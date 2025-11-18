/**
 * Indeed Scraper
 * Scrapes candidate data from Indeed job postings
 */

const BaseScraper = require('./base-scraper');
const { scraperLogger } = require('../utils/logger');
const config = require('../config/config');

class IndeedScraper extends BaseScraper {
  constructor(region = 'us') {
    super('indeed');
    this.region = region;
    this.baseUrl = config.jobBoards.indeed[region] || config.jobBoards.indeed.us;
  }

  async scrape(searchParams) {
    const { query, location, maxResults = 100 } = searchParams;
    const candidates = [];

    try {
      await this.initialize();

      scraperLogger.info('Starting Indeed scrape', { query, location, region: this.region });

      // Build search URL
      const searchUrl = `${this.baseUrl}/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;

      await this.retryOnError(async () => {
        await this.page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      }, 'Navigate to Indeed search');

      // Handle potential CAPTCHA
      await this.handleCaptcha();

      let pageNum = 0;
      let scrapedCount = 0;

      while (scrapedCount < maxResults) {
        scraperLogger.debug(`Scraping page ${pageNum + 1}`);

        // Wait for job cards to load
        await this.page.waitForSelector('.job_seen_beacon, .jobsearch-ResultsList', { timeout: 10000 });

        // Extract job listings
        const jobCards = await this.page.$$('.job_seen_beacon, [data-testid="job-list"] > li');

        for (const card of jobCards) {
          if (scrapedCount >= maxResults) break;

          try {
            const candidateData = await this.extractCandidateData(card);

            if (candidateData) {
              candidates.push({
                ...candidateData,
                source_platform: 'indeed',
                source_region: this.region,
                scraped_at: new Date().toISOString(),
              });
              scrapedCount++;
            }
          } catch (error) {
            scraperLogger.warn('Failed to extract candidate from card', { error: error.message });
          }

          await this.humanDelay(500, 1500);
        }

        // Check if there's a next page
        const nextButton = await this.page.$('[data-testid="pagination-page-next"], a[aria-label="Next Page"]');

        if (nextButton && scrapedCount < maxResults) {
          await nextButton.click();
          await this.humanDelay(2000, 4000);
          await this.handleCaptcha();
          pageNum++;
        } else {
          break;
        }
      }

      scraperLogger.info(`Indeed scrape completed`, {
        candidatesFound: candidates.length,
        region: this.region,
      });

      return candidates;

    } catch (error) {
      scraperLogger.error('Indeed scrape failed', { error: error.message, stack: error.stack });
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async extractCandidateData(cardElement) {
    try {
      const data = await this.page.evaluate((element) => {
        // Helper function to safely get text content
        const getText = (selector, parent = element) => {
          const el = parent.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        const getAttribute = (selector, attr, parent = element) => {
          const el = parent.querySelector(selector);
          return el ? el.getAttribute(attr) : null;
        };

        // Extract job title
        const jobTitle = getText('.jobTitle, [data-testid="job-title"]');

        // Extract company
        const company = getText('.companyName, [data-testid="company-name"]');

        // Extract location
        const location = getText('.companyLocation, [data-testid="job-location"]');

        // Extract job description snippet
        const description = getText('.job-snippet, [data-testid="job-snippet"]');

        // Extract job link
        const jobLink = getAttribute('a', 'href') || getAttribute('[data-testid="job-title"] a', 'href');

        // Extract posted date
        const postedDate = getText('.date, [data-testid="posted-date"]');

        // Extract salary (if available)
        const salary = getText('.salary-snippet, [data-testid="salary-info"]');

        return {
          job_title: jobTitle,
          company: company,
          location: location,
          description: description,
          job_url: jobLink,
          posted_date: postedDate,
          salary: salary,
        };
      }, cardElement);

      // Only return if we have minimum required data
      if (data.job_title && data.company) {
        // Parse location
        const locationParts = this.parseLocation(data.location);

        return {
          current_title: data.job_title,
          current_company: data.company,
          job_title_applied: data.job_title,
          location: data.location,
          city: locationParts.city,
          state: locationParts.state,
          country: locationParts.country,
          source_url: data.job_url ? `${this.baseUrl}${data.job_url}` : null,
          raw_data: {
            description: data.description,
            posted_date: data.posted_date,
            salary: data.salary,
          },
        };
      }

      return null;
    } catch (error) {
      scraperLogger.debug('Failed to extract candidate data', { error: error.message });
      return null;
    }
  }

  parseLocation(locationString) {
    if (!locationString) return { city: null, state: null, country: this.region.toUpperCase() };

    const parts = locationString.split(',').map(p => p.trim());

    if (this.region === 'us') {
      return {
        city: parts[0] || null,
        state: parts[1] || null,
        country: 'US',
      };
    } else if (this.region === 'uk') {
      return {
        city: parts[0] || null,
        state: parts[1] || null,
        country: 'UK',
      };
    } else if (this.region === 'ca') {
      return {
        city: parts[0] || null,
        state: parts[1] || null,
        country: 'CA',
      };
    }

    return {
      city: parts[0] || null,
      state: parts[1] || null,
      country: this.region.toUpperCase(),
    };
  }

  // Scrape specific job posting for more detailed candidate info
  async scrapeJobDetails(jobUrl) {
    try {
      await this.page.goto(jobUrl, { waitUntil: 'networkidle2' });
      await this.handleCaptcha();

      const details = await this.page.evaluate(() => {
        const getText = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        return {
          fullDescription: getText('#jobDescriptionText, .jobsearch-jobDescriptionText'),
          companyInfo: getText('.jobsearch-CompanyInfoContainer'),
          benefits: getText('.jobsearch-JobComponent-benefits'),
        };
      });

      return details;
    } catch (error) {
      scraperLogger.warn('Failed to scrape job details', { jobUrl, error: error.message });
      return null;
    }
  }
}

module.exports = IndeedScraper;
