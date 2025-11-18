/**
 * Data Processor
 * Layer 2: Deduplication, Normalization, and Enrichment
 */

const _ = require('lodash');
const fuzzball = require('fuzzball');
const { parsePhoneNumber } = require('libphonenumber-js');
const { processorLogger } = require('../utils/logger');
const config = require('../config/config');

class DataProcessor {
  constructor() {
    this.deduplicationThreshold = config.processing.deduplicationThreshold;
  }

  /**
   * Process batch of candidates
   */
  async processBatch(candidates) {
    try {
      processorLogger.info(`Processing batch of ${candidates.length} candidates`);

      // Step 1: Deduplicate
      const deduplicated = this.deduplicateCandidates(candidates);
      processorLogger.info(`Deduplication: ${candidates.length} -> ${deduplicated.length}`);

      // Step 2: Normalize
      const normalized = deduplicated.map(c => this.normalizeCandidate(c));

      // Step 3: Extract company domains
      const withDomains = normalized.map(c => this.extractCompanyDomain(c));

      // Step 4: Calculate quality scores
      const withScores = withDomains.map(c => this.calculateQualityScore(c));

      processorLogger.info(`Processing complete: ${withScores.length} candidates ready`);

      return withScores;

    } catch (error) {
      processorLogger.error('Batch processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Deduplicate candidates using multiple matching strategies
   */
  deduplicateCandidates(candidates) {
    const uniqueCandidates = [];
    const seen = new Map();

    for (const candidate of candidates) {
      const isDuplicate = this.findDuplicate(candidate, uniqueCandidates, seen);

      if (!isDuplicate) {
        uniqueCandidates.push(candidate);

        // Add to seen map with multiple keys
        if (candidate.email) {
          seen.set(`email:${candidate.email.toLowerCase()}`, candidate);
        }
        if (candidate.linkedin_url) {
          seen.set(`linkedin:${candidate.linkedin_url}`, candidate);
        }
        if (candidate.phone) {
          const normalized = this.normalizePhone(candidate.phone);
          if (normalized) {
            seen.set(`phone:${normalized}`, candidate);
          }
        }
      }
    }

    return uniqueCandidates;
  }

  findDuplicate(candidate, existingCandidates, seenMap) {
    // Exact email match
    if (candidate.email) {
      const emailKey = `email:${candidate.email.toLowerCase()}`;
      if (seenMap.has(emailKey)) {
        processorLogger.debug('Duplicate found: email match', { email: candidate.email });
        return true;
      }
    }

    // Exact LinkedIn URL match
    if (candidate.linkedin_url) {
      const linkedinKey = `linkedin:${candidate.linkedin_url}`;
      if (seenMap.has(linkedinKey)) {
        processorLogger.debug('Duplicate found: LinkedIn match');
        return true;
      }
    }

    // Exact phone match
    if (candidate.phone) {
      const normalized = this.normalizePhone(candidate.phone);
      if (normalized) {
        const phoneKey = `phone:${normalized}`;
        if (seenMap.has(phoneKey)) {
          processorLogger.debug('Duplicate found: phone match');
          return true;
        }
      }
    }

    // Fuzzy name + company match
    if (candidate.full_name && candidate.current_company) {
      for (const existing of existingCandidates) {
        if (existing.full_name && existing.current_company) {
          const nameScore = fuzzball.ratio(
            candidate.full_name.toLowerCase(),
            existing.full_name.toLowerCase()
          );

          const companyScore = fuzzball.ratio(
            candidate.current_company.toLowerCase(),
            existing.current_company.toLowerCase()
          );

          if (nameScore >= this.deduplicationThreshold * 100 && companyScore >= 85) {
            processorLogger.debug('Duplicate found: fuzzy name + company match', {
              nameScore,
              companyScore,
            });
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Normalize candidate data
   */
  normalizeCandidate(candidate) {
    const normalized = { ...candidate };

    // Normalize name
    if (candidate.full_name) {
      normalized.full_name = this.normalizeName(candidate.full_name);

      // Extract first and last name if not already present
      if (!candidate.first_name || !candidate.last_name) {
        const { firstName, lastName } = this.splitName(normalized.full_name);
        normalized.first_name = normalized.first_name || firstName;
        normalized.last_name = normalized.last_name || lastName;
      }
    }

    // Normalize email
    if (candidate.email) {
      normalized.email = candidate.email.toLowerCase().trim();
    }

    // Normalize phone
    if (candidate.phone) {
      normalized.phone = this.normalizePhone(candidate.phone);
    }

    // Normalize location
    if (candidate.location) {
      const locationData = this.normalizeLocation(candidate.location);
      normalized.city = normalized.city || locationData.city;
      normalized.state = normalized.state || locationData.state;
      normalized.country = normalized.country || locationData.country;
    }

    // Normalize company name
    if (candidate.current_company) {
      normalized.current_company = this.normalizeCompanyName(candidate.current_company);
    }

    // Normalize job title
    if (candidate.current_title) {
      normalized.current_title = this.normalizeJobTitle(candidate.current_title);
    }

    return normalized;
  }

  normalizeName(name) {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  splitName(fullName) {
    const parts = fullName.trim().split(' ');
    if (parts.length === 0) return { firstName: null, lastName: null };
    if (parts.length === 1) return { firstName: parts[0], lastName: null };

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  normalizePhone(phone) {
    try {
      // Remove all non-digit characters first
      const digitsOnly = phone.replace(/\D/g, '');

      // Try to parse with libphonenumber
      const parsed = parsePhoneNumber('+' + digitsOnly);

      if (parsed && parsed.isValid()) {
        return parsed.format('E.164'); // Returns +1234567890 format
      }

      // If parsing fails, return cleaned version
      return digitsOnly.length >= 10 ? digitsOnly : null;

    } catch (error) {
      processorLogger.debug('Failed to normalize phone', { phone, error: error.message });
      return null;
    }
  }

  normalizeLocation(location) {
    const parts = location.split(',').map(p => p.trim());

    return {
      city: parts[0] || null,
      state: parts[1] || null,
      country: parts[2] || parts[1] || null,
    };
  }

  normalizeCompanyName(company) {
    return company
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,?\s*(Inc|LLC|Ltd|Corp|Corporation|Company|Co)\.?$/i, '');
  }

  normalizeJobTitle(title) {
    return title
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => {
        // Keep acronyms uppercase
        if (word.length <= 3 && word === word.toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Extract company domain from email or company name
   */
  extractCompanyDomain(candidate) {
    const result = { ...candidate };

    // Try to extract from email
    if (candidate.email && candidate.email.includes('@')) {
      const domain = candidate.email.split('@')[1];

      // Avoid generic email domains
      const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];

      if (!genericDomains.includes(domain.toLowerCase())) {
        result.company_domain = domain;
        processorLogger.debug('Extracted company domain from email', { domain });
      }
    }

    // Try to infer from company name if no domain from email
    if (!result.company_domain && candidate.current_company) {
      const inferredDomain = this.inferDomainFromCompany(candidate.current_company);
      if (inferredDomain) {
        result.company_domain = inferredDomain;
      }
    }

    return result;
  }

  inferDomainFromCompany(companyName) {
    // Simple domain inference (would use Apollo.io/Clearbit in production)
    const cleaned = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '');

    // Just a placeholder - in real implementation, use Apollo/Clearbit API
    return `${cleaned}.com`;
  }

  /**
   * Calculate data quality score (0-100)
   */
  calculateQualityScore(candidate) {
    const result = { ...candidate };
    let score = 0;

    // Required fields (60 points)
    if (candidate.first_name) score += 10;
    if (candidate.last_name) score += 10;
    if (candidate.email) score += 15;
    if (candidate.phone) score += 10;
    if (candidate.location || candidate.city) score += 5;
    if (candidate.current_title) score += 10;

    // LinkedIn data (20 points)
    if (candidate.linkedin_url) score += 15;
    if (candidate.linkedin_summary) score += 5;

    // Company data (10 points)
    if (candidate.current_company) score += 5;
    if (candidate.company_domain) score += 5;

    // Additional data (10 points)
    if (candidate.skills && candidate.skills.length > 0) score += 5;
    if (candidate.years_of_experience) score += 5;

    result.data_completeness_score = score;
    result.overall_quality_score = score; // Will be updated after verification

    processorLogger.debug('Calculated quality score', {
      name: candidate.full_name,
      score,
    });

    return result;
  }

  /**
   * Generate email patterns for contact discovery
   */
  generateEmailPatterns(firstName, lastName, domain) {
    if (!firstName || !lastName || !domain) return [];

    const first = firstName.toLowerCase();
    const last = lastName.toLowerCase();
    const f = first.charAt(0);

    return config.emailPatterns.map(pattern => {
      return pattern
        .replace('{first}', first)
        .replace('{last}', last)
        .replace('{f}', f)
        .replace('{domain}', domain);
    });
  }
}

module.exports = DataProcessor;
