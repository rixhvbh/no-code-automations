/**
 * Company Enrichment Service
 * Enriches company data using Apollo.io, Clearbit, Hunter.io
 */

const axios = require('axios');
const config = require('../config/config');
const { apolloLimiter, hunterLimiter } = require('../utils/rate-limiter');
const { enrichmentLogger } = require('../utils/logger');

class CompanyEnricher {
  constructor() {
    this.apolloApiKey = config.enrichment.apollo.apiKey;
    this.clearbitApiKey = config.enrichment.clearbit.apiKey;
    this.hunterApiKey = config.enrichment.hunter.apiKey;
  }

  /**
   * Enrich company data using multiple sources
   */
  async enrichCompany(companyName, domain = null) {
    try {
      enrichmentLogger.info('Enriching company', { companyName, domain });

      let enrichedData = {
        name: companyName,
        domain: domain,
        industry: null,
        size: null,
        founded_year: null,
        location: null,
        description: null,
        employee_count: null,
        linkedin_url: null,
        hr_email: null,
        email_pattern: null,
      };

      // Try Apollo.io first
      if (this.apolloApiKey) {
        const apolloData = await this.enrichWithApollo(companyName, domain);
        if (apolloData) {
          enrichedData = { ...enrichedData, ...apolloData };
        }
      }

      // Try Clearbit if we have a domain
      if (this.clearbitApiKey && (domain || enrichedData.domain)) {
        const clearbitData = await this.enrichWithClearbit(domain || enrichedData.domain);
        if (clearbitData) {
          enrichedData = { ...enrichedData, ...clearbitData };
        }
      }

      // Try Hunter.io for email patterns
      if (this.hunterApiKey && (domain || enrichedData.domain)) {
        const hunterData = await this.enrichWithHunter(domain || enrichedData.domain);
        if (hunterData) {
          enrichedData = { ...enrichedData, ...hunterData };
        }
      }

      enrichmentLogger.info('Company enrichment complete', { companyName });

      return enrichedData;

    } catch (error) {
      enrichmentLogger.error('Company enrichment failed', { companyName, error: error.message });
      return null;
    }
  }

  async enrichWithApollo(companyName, domain) {
    try {
      const result = await apolloLimiter.schedule(async () => {
        const response = await axios.post(
          `${config.enrichment.apollo.baseUrl}/organizations/enrich`,
          {
            organization_name: companyName,
            domain: domain,
          },
          {
            headers: {
              'X-Api-Key': this.apolloApiKey,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        return response.data.organization;
      });

      enrichmentLogger.debug('Apollo enrichment complete', { companyName });

      return {
        domain: result.website_url || result.primary_domain || domain,
        industry: result.industry,
        size: result.estimated_num_employees ? this.mapEmployeeCountToSize(result.estimated_num_employees) : null,
        employee_count: result.estimated_num_employees,
        founded_year: result.founded_year,
        location: `${result.city || ''}, ${result.state || ''}, ${result.country || ''}`.trim(),
        linkedin_url: result.linkedin_url,
        description: result.short_description,
        apollo_data: result,
      };

    } catch (error) {
      enrichmentLogger.warn('Apollo enrichment failed', { companyName, error: error.message });
      return null;
    }
  }

  async enrichWithClearbit(domain) {
    try {
      const response = await axios.get(
        `${config.enrichment.clearbit.baseUrl}/companies/find`,
        {
          params: { domain: domain },
          headers: {
            Authorization: `Bearer ${this.clearbitApiKey}`,
          },
          timeout: 10000,
        }
      );

      const result = response.data;

      enrichmentLogger.debug('Clearbit enrichment complete', { domain });

      return {
        domain: result.domain,
        industry: result.category?.industry,
        size: this.mapEmployeeCountToSize(result.metrics?.employees),
        employee_count: result.metrics?.employees,
        founded_year: result.foundedYear,
        location: result.location || result.geo?.city,
        description: result.description,
        linkedin_url: result.linkedin?.handle ? `https://www.linkedin.com/company/${result.linkedin.handle}` : null,
        clearbit_data: result,
      };

    } catch (error) {
      enrichmentLogger.warn('Clearbit enrichment failed', { domain, error: error.message });
      return null;
    }
  }

  async enrichWithHunter(domain) {
    try {
      const result = await hunterLimiter.schedule(async () => {
        const response = await axios.get(
          `${config.enrichment.hunter.baseUrl}/domain-search`,
          {
            params: {
              domain: domain,
              api_key: this.hunterApiKey,
              limit: 10,
            },
            timeout: 10000,
          }
        );

        return response.data.data;
      });

      enrichmentLogger.debug('Hunter enrichment complete', { domain });

      // Extract email pattern
      let emailPattern = null;
      if (result.pattern) {
        emailPattern = result.pattern
          .replace('{first}', 'firstName')
          .replace('{last}', 'lastName')
          .replace('{f}', 'f')
          .replace('{l}', 'l');
      }

      // Find HR or recruiting emails
      let hrEmail = null;
      if (result.emails && result.emails.length > 0) {
        const hrEmails = result.emails.filter(e =>
          e.department === 'hr' ||
          e.position?.toLowerCase().includes('recruiter') ||
          e.position?.toLowerCase().includes('talent')
        );

        if (hrEmails.length > 0) {
          hrEmail = hrEmails[0].value;
        }
      }

      return {
        email_pattern: emailPattern,
        hr_email: hrEmail,
        hunter_data: result,
      };

    } catch (error) {
      enrichmentLogger.warn('Hunter enrichment failed', { domain, error: error.message });
      return null;
    }
  }

  /**
   * Search for company domain by name
   */
  async findDomain(companyName) {
    try {
      enrichmentLogger.info('Finding domain for company', { companyName });

      // Try Apollo first
      if (this.apolloApiKey) {
        const apolloData = await this.enrichWithApollo(companyName, null);
        if (apolloData && apolloData.domain) {
          return apolloData.domain;
        }
      }

      // Simple inference as fallback
      const inferred = companyName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '');

      enrichmentLogger.debug('Using inferred domain', { domain: `${inferred}.com` });

      return `${inferred}.com`;

    } catch (error) {
      enrichmentLogger.error('Domain search failed', { companyName, error: error.message });
      return null;
    }
  }

  /**
   * Find HR/recruiter contacts for a company
   */
  async findHRContacts(domain) {
    try {
      enrichmentLogger.info('Finding HR contacts', { domain });

      if (!this.hunterApiKey) {
        enrichmentLogger.warn('Hunter.io API key not configured');
        return [];
      }

      const result = await hunterLimiter.schedule(async () => {
        const response = await axios.get(
          `${config.enrichment.hunter.baseUrl}/domain-search`,
          {
            params: {
              domain: domain,
              api_key: this.hunterApiKey,
              department: 'hr',
              limit: 50,
            },
            timeout: 10000,
          }
        );

        return response.data.data;
      });

      const hrContacts = result.emails
        .filter(e =>
          e.department === 'hr' ||
          e.position?.toLowerCase().includes('recruiter') ||
          e.position?.toLowerCase().includes('talent') ||
          e.position?.toLowerCase().includes('human resources')
        )
        .map(e => ({
          email: e.value,
          name: `${e.first_name} ${e.last_name}`.trim(),
          position: e.position,
          confidence: e.confidence,
        }));

      enrichmentLogger.info('HR contacts found', { domain, count: hrContacts.length });

      return hrContacts;

    } catch (error) {
      enrichmentLogger.error('HR contact search failed', { domain, error: error.message });
      return [];
    }
  }

  mapEmployeeCountToSize(count) {
    if (!count) return null;
    if (count < 10) return '1-10';
    if (count < 50) return '11-50';
    if (count < 200) return '51-200';
    if (count < 500) return '201-500';
    if (count < 1000) return '501-1000';
    if (count < 5000) return '1001-5000';
    if (count < 10000) return '5001-10000';
    return '10000+';
  }
}

module.exports = CompanyEnricher;
