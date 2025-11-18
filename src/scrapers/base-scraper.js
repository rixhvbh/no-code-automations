/**
 * Base Scraper Class
 * Common functionality for all platform scrapers
 */

const puppeteer = require('puppeteer');
const config = require('../config/config');
const proxyManager = require('../utils/proxy-manager');
const { scraperLimiter } = require('../utils/rate-limiter');
const { scraperLogger } = require('../utils/logger');
const Solver = require('2captcha');

class BaseScraper {
  constructor(platform) {
    this.platform = platform;
    this.browser = null;
    this.page = null;
    this.captchaSolver = config.captcha.twoCaptcha ? new Solver(config.captcha.twoCaptcha) : null;
    this.retryCount = 0;
    this.maxRetries = config.scraper.maxRetries;
  }

  async initialize() {
    try {
      const proxy = proxyManager.getNextProxy();
      const launchOptions = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      };

      // Add proxy if available
      if (proxy) {
        launchOptions.args.push(`--proxy-server=${proxy.url}`);
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // Set random user agent
      const userAgent = this.getRandomUserAgent();
      await this.page.setUserAgent(userAgent);

      // Set viewport
      await this.page.setViewport({
        width: 1920 + Math.floor(Math.random() * 100),
        height: 1080 + Math.floor(Math.random() * 100),
      });

      // Set extra headers to look more human
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });

      scraperLogger.info(`Initialized ${this.platform} scraper`);
    } catch (error) {
      scraperLogger.error(`Failed to initialize ${this.platform} scraper`, { error: error.message });
      throw error;
    }
  }

  getRandomUserAgent() {
    const agents = config.scraper.userAgents;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  async humanDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async typeHuman(selector, text) {
    await this.page.waitForSelector(selector);
    await this.page.click(selector);

    for (const char of text) {
      await this.page.keyboard.type(char);
      await this.humanDelay(50, 150);
    }
  }

  async scrollPage() {
    await this.page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  async solveCaptcha(sitekey, pageUrl) {
    if (!this.captchaSolver) {
      scraperLogger.warn('No CAPTCHA solver configured');
      return null;
    }

    try {
      scraperLogger.info('Attempting to solve CAPTCHA');
      const result = await this.captchaSolver.recaptcha({
        googlekey: sitekey,
        pageurl: pageUrl,
      });

      scraperLogger.info('CAPTCHA solved successfully');
      return result.data;
    } catch (error) {
      scraperLogger.error('Failed to solve CAPTCHA', { error: error.message });
      return null;
    }
  }

  async handleCaptcha() {
    try {
      // Check if CAPTCHA is present
      const captchaElement = await this.page.$('iframe[src*="recaptcha"]');

      if (captchaElement) {
        scraperLogger.warn('CAPTCHA detected');

        // Get sitekey
        const sitekey = await this.page.evaluate(() => {
          const iframe = document.querySelector('iframe[src*="recaptcha"]');
          if (iframe && iframe.src) {
            const match = iframe.src.match(/k=([^&]+)/);
            return match ? match[1] : null;
          }
          return null;
        });

        if (sitekey) {
          const solution = await this.solveCaptcha(sitekey, this.page.url());

          if (solution) {
            // Submit CAPTCHA solution
            await this.page.evaluate((token) => {
              document.querySelector('#g-recaptcha-response').value = token;
            }, solution);

            scraperLogger.info('CAPTCHA solution submitted');
            await this.humanDelay(2000, 3000);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      scraperLogger.error('Error handling CAPTCHA', { error: error.message });
      return false;
    }
  }

  async retryOnError(fn, context = 'operation') {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await scraperLimiter.schedule(() => fn());
      } catch (error) {
        lastError = error;
        scraperLogger.warn(`${context} failed (attempt ${attempt}/${this.maxRetries})`, {
          error: error.message,
        });

        if (attempt < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    scraperLogger.error(`${context} failed after ${this.maxRetries} attempts`, {
      error: lastError.message,
    });
    throw lastError;
  }

  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      scraperLogger.info(`Cleaned up ${this.platform} scraper`);
    } catch (error) {
      scraperLogger.error(`Error during cleanup`, { error: error.message });
    }
  }

  // Abstract methods to be implemented by child classes
  async scrape(searchParams) {
    throw new Error('scrape() must be implemented by child class');
  }

  async extractCandidateData(element) {
    throw new Error('extractCandidateData() must be implemented by child class');
  }
}

module.exports = BaseScraper;
