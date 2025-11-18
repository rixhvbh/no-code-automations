/**
 * Email Verification Service
 * Layer 3: Email verification using multiple providers
 */

const axios = require('axios');
const config = require('../config/config');
const { zeroBounceLimiter, hunterLimiter } = require('../utils/rate-limiter');
const { verificationLogger } = require('../utils/logger');

class EmailVerifier {
  constructor() {
    this.providers = {
      zerobounce: config.verification.email.zeroBounce.apiKey,
      neverbounce: config.verification.email.neverBounce.apiKey,
      hunter: config.enrichment.hunter.apiKey,
      debounce: config.verification.email.debounce.apiKey,
    };
  }

  /**
   * Verify email using primary provider (ZeroBounce)
   */
  async verifyEmail(email) {
    try {
      verificationLogger.info('Verifying email', { email });

      // Try ZeroBounce first
      if (this.providers.zerobounce) {
        const result = await this.verifyWithZeroBounce(email);
        if (result) return result;
      }

      // Fallback to Hunter.io
      if (this.providers.hunter) {
        const result = await this.verifyWithHunter(email);
        if (result) return result;
      }

      // Fallback to NeverBounce
      if (this.providers.neverbounce) {
        const result = await this.verifyWithNeverBounce(email);
        if (result) return result;
      }

      verificationLogger.warn('No verification providers available');
      return this.getDefaultVerificationResult(email);

    } catch (error) {
      verificationLogger.error('Email verification failed', { email, error: error.message });
      return this.getDefaultVerificationResult(email);
    }
  }

  async verifyWithZeroBounce(email) {
    try {
      const result = await zeroBounceLimiter.schedule(async () => {
        const response = await axios.get(
          `${config.verification.email.zeroBounce.baseUrl}/validate`,
          {
            params: {
              api_key: config.verification.email.zeroBounce.apiKey,
              email: email,
            },
            timeout: 10000,
          }
        );

        return response.data;
      });

      verificationLogger.debug('ZeroBounce verification complete', { email, result });

      return {
        email: email,
        is_valid: result.status === 'valid',
        status: this.mapZeroBounceStatus(result.status),
        deliverability_score: this.calculateDeliverabilityScore(result),
        is_disposable: result.disposable || false,
        is_role_email: result.role || false,
        smtp_check: result.smtp_check || false,
        mx_record_found: result.mx_found || false,
        provider: 'zerobounce',
        raw_response: result,
      };

    } catch (error) {
      verificationLogger.warn('ZeroBounce verification failed', { email, error: error.message });
      return null;
    }
  }

  async verifyWithHunter(email) {
    try {
      const result = await hunterLimiter.schedule(async () => {
        const response = await axios.get(
          `${config.enrichment.hunter.baseUrl}/email-verifier`,
          {
            params: {
              email: email,
              api_key: config.enrichment.hunter.apiKey,
            },
            timeout: 10000,
          }
        );

        return response.data.data;
      });

      verificationLogger.debug('Hunter.io verification complete', { email, result });

      return {
        email: email,
        is_valid: result.result === 'deliverable',
        status: this.mapHunterStatus(result.result),
        deliverability_score: result.score || 0,
        is_disposable: result.disposable || false,
        is_role_email: result.role || false,
        smtp_check: result.smtp_check || false,
        mx_record_found: result.mx_records || false,
        provider: 'hunter',
        raw_response: result,
      };

    } catch (error) {
      verificationLogger.warn('Hunter.io verification failed', { email, error: error.message });
      return null;
    }
  }

  async verifyWithNeverBounce(email) {
    try {
      const response = await axios.get(
        `${config.verification.email.neverBounce.baseUrl}/single/check`,
        {
          params: {
            key: config.verification.email.neverBounce.apiKey,
            email: email,
          },
          timeout: 10000,
        }
      );

      const result = response.data;

      verificationLogger.debug('NeverBounce verification complete', { email, result });

      return {
        email: email,
        is_valid: result.result === 'valid',
        status: this.mapNeverBounceStatus(result.result),
        deliverability_score: result.result === 'valid' ? 90 : result.result === 'catchall' ? 50 : 0,
        is_disposable: result.result === 'disposable',
        is_role_email: result.result === 'role',
        smtp_check: true,
        mx_record_found: true,
        provider: 'neverbounce',
        raw_response: result,
      };

    } catch (error) {
      verificationLogger.warn('NeverBounce verification failed', { email, error: error.message });
      return null;
    }
  }

  /**
   * Verify bulk emails
   */
  async verifyBulk(emails) {
    verificationLogger.info(`Bulk verification started`, { count: emails.length });

    const results = [];

    for (const email of emails) {
      try {
        const result = await this.verifyEmail(email);
        results.push(result);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        verificationLogger.warn('Failed to verify email in bulk', { email, error: error.message });
        results.push(this.getDefaultVerificationResult(email));
      }
    }

    verificationLogger.info(`Bulk verification complete`, {
      total: emails.length,
      valid: results.filter(r => r.is_valid).length,
    });

    return results;
  }

  // Helper methods

  mapZeroBounceStatus(status) {
    const statusMap = {
      valid: 'valid',
      invalid: 'invalid',
      catch-all: 'risky',
      unknown: 'unknown',
      spamtrap: 'invalid',
      abuse: 'invalid',
      do_not_mail: 'invalid',
    };

    return statusMap[status] || 'unknown';
  }

  mapHunterStatus(status) {
    const statusMap = {
      deliverable: 'valid',
      undeliverable: 'invalid',
      risky: 'risky',
      unknown: 'unknown',
    };

    return statusMap[status] || 'unknown';
  }

  mapNeverBounceStatus(status) {
    const statusMap = {
      valid: 'valid',
      invalid: 'invalid',
      disposable: 'invalid',
      catchall: 'risky',
      unknown: 'unknown',
    };

    return statusMap[status] || 'unknown';
  }

  calculateDeliverabilityScore(result) {
    // Calculate score based on ZeroBounce result
    if (result.status === 'valid') return 95;
    if (result.status === 'catch-all') return 60;
    if (result.status === 'unknown') return 30;
    return 0;
  }

  getDefaultVerificationResult(email) {
    return {
      email: email,
      is_valid: false,
      status: 'unknown',
      deliverability_score: 0,
      is_disposable: false,
      is_role_email: false,
      smtp_check: false,
      mx_record_found: false,
      provider: 'none',
      raw_response: null,
    };
  }

  /**
   * Check if email format is valid (basic check)
   */
  isValidFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email is from a disposable provider
   */
  isDisposableEmail(email) {
    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'mailinator.com', 'throwaway.email', 'yopmail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Check if email is a role-based email
   */
  isRoleEmail(email) {
    const roleKeywords = [
      'admin', 'info', 'support', 'sales', 'contact', 'help',
      'noreply', 'no-reply', 'postmaster', 'webmaster', 'careers',
      'jobs', 'recruiting', 'hr', 'humanresources',
    ];

    const localPart = email.split('@')[0]?.toLowerCase();
    return roleKeywords.some(keyword => localPart.includes(keyword));
  }
}

module.exports = EmailVerifier;
