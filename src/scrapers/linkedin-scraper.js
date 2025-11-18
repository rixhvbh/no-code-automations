/**
 * LinkedIn Scraper
 * Scrapes candidate data from LinkedIn
 * NOTE: LinkedIn has strict anti-scraping measures. Use with caution.
 */

const BaseScraper = require('./base-scraper');
const { linkedInLimiter } = require('../utils/rate-limiter');
const { scraperLogger } = require('../utils/logger');
const config = require('../config/config');

class LinkedInScraper extends BaseScraper {
  constructor() {
    super('linkedin');
    this.baseUrl = config.jobBoards.linkedin;
    this.isLoggedIn = false;
  }

  async login(email, password) {
    try {
      scraperLogger.info('Attempting LinkedIn login');

      await this.retryOnError(async () => {
        await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
      }, 'Navigate to LinkedIn login');

      // Type email
      await this.typeHuman('#username', email);
      await this.humanDelay(500, 1000);

      // Type password
      await this.typeHuman('#password', password);
      await this.humanDelay(500, 1000);

      // Click login button
      await this.page.click('button[type="submit"]');
      await this.humanDelay(3000, 5000);

      // Check for security verification
      const verificationNeeded = await this.page.$('#email-pin-challenge, #text-pin-challenge');

      if (verificationNeeded) {
        scraperLogger.warn('LinkedIn security verification required - manual intervention needed');
        throw new Error('Security verification required');
      }

      this.isLoggedIn = true;
      scraperLogger.info('LinkedIn login successful');

    } catch (error) {
      scraperLogger.error('LinkedIn login failed', { error: error.message });
      throw error;
    }
  }

  async scrape(searchParams) {
    const { keywords, location, maxResults = 100 } = searchParams;
    const candidates = [];

    try {
      await this.initialize();

      // LinkedIn requires login for most scraping
      if (!this.isLoggedIn) {
        throw new Error('Must be logged in to LinkedIn before scraping');
      }

      scraperLogger.info('Starting LinkedIn scrape', { keywords, location });

      // Build job search URL
      const searchUrl = `${this.baseUrl}/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;

      await linkedInLimiter.schedule(async () => {
        await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      });

      await this.humanDelay(2000, 4000);

      let scrapedCount = 0;

      while (scrapedCount < maxResults) {
        // Scroll to load more jobs
        await this.scrollPage();
        await this.humanDelay(2000, 3000);

        // Get job cards
        const jobCards = await this.page.$$('.job-card-container, .jobs-search-results__list-item');

        scraperLogger.debug(`Found ${jobCards.length} job cards`);

        for (const card of jobCards) {
          if (scrapedCount >= maxResults) break;

          try {
            const candidateData = await this.extractCandidateData(card);

            if (candidateData) {
              candidates.push({
                ...candidateData,
                source_platform: 'linkedin',
                scraped_at: new Date().toISOString(),
              });
              scrapedCount++;
            }
          } catch (error) {
            scraperLogger.warn('Failed to extract LinkedIn candidate', { error: error.message });
          }

          await this.humanDelay(1000, 2000);
        }

        // Check for "See more jobs" button
        const seeMoreButton = await this.page.$('.infinite-scroller__show-more-button');

        if (seeMoreButton && scrapedCount < maxResults) {
          await seeMoreButton.click();
          await this.humanDelay(3000, 5000);
        } else {
          break;
        }
      }

      scraperLogger.info(`LinkedIn scrape completed`, { candidatesFound: candidates.length });

      return candidates;

    } catch (error) {
      scraperLogger.error('LinkedIn scrape failed', { error: error.message });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async extractCandidateData(cardElement) {
    try {
      const data = await this.page.evaluate((element) => {
        const getText = (selector, parent = element) => {
          const el = parent.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        const getAttribute = (selector, attr, parent = element) => {
          const el = parent.querySelector(selector);
          return el ? el.getAttribute(attr) : null;
        };

        // Extract job details
        const jobTitle = getText('.job-card-list__title, .artdeco-entity-lockup__title');
        const company = getText('.job-card-container__company-name, .artdeco-entity-lockup__subtitle');
        const location = getText('.job-card-container__metadata-item, .artdeco-entity-lockup__caption');
        const jobLink = getAttribute('a.job-card-list__title', 'href') || getAttribute('a', 'href');
        const postedDate = getText('.job-card-container__listed-time');

        return {
          job_title: jobTitle,
          company: company,
          location: location,
          job_url: jobLink,
          posted_date: postedDate,
        };
      }, cardElement);

      if (data.job_title && data.company) {
        return {
          current_title: data.job_title,
          current_company: data.company,
          job_title_applied: data.job_title,
          location: data.location,
          source_url: data.job_url && data.job_url.startsWith('http') ? data.job_url : `${this.baseUrl}${data.job_url}`,
          raw_data: {
            posted_date: data.posted_date,
          },
        };
      }

      return null;
    } catch (error) {
      scraperLogger.debug('Failed to extract LinkedIn candidate data', { error: error.message });
      return null;
    }
  }

  // Scrape LinkedIn profile (requires Proxycurl API or similar)
  async scrapeProfile(profileUrl) {
    try {
      await linkedInLimiter.schedule(async () => {
        await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
      });

      await this.humanDelay(2000, 4000);

      const profileData = await this.page.evaluate(() => {
        const getText = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          name: getText('.pv-top-card--list li:first-child, h1.text-heading-xlarge'),
          headline: getText('.pv-top-card--list-bullet li, div.text-body-medium'),
          location: getText('.pv-top-card--list-bullet:nth-of-type(2) li, span.text-body-small'),
          about: getText('.pv-about__summary-text, div[data-generated-suggestion-target]'),
          connections: getText('.pv-top-card--list-bullet li span, span.t-black--light'),
        };
      });

      scraperLogger.debug('Scraped LinkedIn profile', { profileUrl });

      return profileData;
    } catch (error) {
      scraperLogger.warn('Failed to scrape LinkedIn profile', { profileUrl, error: error.message });
      return null;
    }
  }
}

module.exports = LinkedInScraper;
