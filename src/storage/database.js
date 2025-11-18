/**
 * Database Service
 * PostgreSQL operations for candidate storage
 */

const { Pool } = require('pg');
const config = require('../config/config');
const { storageLogger } = require('../utils/logger');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      storageLogger.error('Unexpected database error', { error: err.message });
    });
  }

  /**
   * Insert a new candidate
   */
  async insertCandidate(candidateData) {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO candidates (
          first_name, last_name, full_name, email, phone, location, city, state, country,
          current_title, current_company, years_of_experience, skills,
          linkedin_url, linkedin_headline, linkedin_summary, linkedin_connections,
          source_platform, source_url, job_posting_id, job_title_applied,
          email_verified, email_deliverability_score, email_verification_status,
          phone_verified, phone_validity_status,
          company_domain, company_size, company_industry, hr_contact_email, recruiter_email,
          data_completeness_score, profile_confidence_score, data_freshness_score, overall_quality_score,
          raw_data, enrichment_data, verification_data, custom_fields
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19, $20, $21,
          $22, $23, $24,
          $25, $26,
          $27, $28, $29, $30, $31,
          $32, $33, $34, $35,
          $36, $37, $38, $39
        )
        RETURNING id;
      `;

      const values = [
        candidateData.first_name || null,
        candidateData.last_name || null,
        candidateData.full_name || null,
        candidateData.email || null,
        candidateData.phone || null,
        candidateData.location || null,
        candidateData.city || null,
        candidateData.state || null,
        candidateData.country || null,
        candidateData.current_title || null,
        candidateData.current_company || null,
        candidateData.years_of_experience || null,
        candidateData.skills || null,
        candidateData.linkedin_url || null,
        candidateData.linkedin_headline || null,
        candidateData.linkedin_summary || null,
        candidateData.linkedin_connections || null,
        candidateData.source_platform || null,
        candidateData.source_url || null,
        candidateData.job_posting_id || null,
        candidateData.job_title_applied || null,
        candidateData.email_verified || false,
        candidateData.email_deliverability_score || null,
        candidateData.email_verification_status || null,
        candidateData.phone_verified || false,
        candidateData.phone_validity_status || null,
        candidateData.company_domain || null,
        candidateData.company_size || null,
        candidateData.company_industry || null,
        candidateData.hr_contact_email || null,
        candidateData.recruiter_email || null,
        candidateData.data_completeness_score || null,
        candidateData.profile_confidence_score || null,
        candidateData.data_freshness_score || null,
        candidateData.overall_quality_score || null,
        JSON.stringify(candidateData.raw_data || {}),
        JSON.stringify(candidateData.enrichment_data || {}),
        JSON.stringify(candidateData.verification_data || {}),
        JSON.stringify(candidateData.custom_fields || {}),
      ];

      const result = await client.query(query, values);

      storageLogger.info('Candidate inserted', { id: result.rows[0].id });

      return result.rows[0].id;

    } catch (error) {
      storageLogger.error('Failed to insert candidate', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update candidate data
   */
  async updateCandidate(candidateId, updates) {
    const client = await this.pool.connect();

    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setClauses.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (setClauses.length === 0) {
        storageLogger.warn('No updates provided');
        return;
      }

      values.push(candidateId);

      const query = `
        UPDATE candidates
        SET ${setClauses.join(', ')}, last_updated = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
      `;

      await client.query(query, values);

      storageLogger.info('Candidate updated', { id: candidateId });

    } catch (error) {
      storageLogger.error('Failed to update candidate', { id: candidateId, error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find candidate by email
   */
  async findCandidateByEmail(email) {
    try {
      const query = 'SELECT * FROM candidates WHERE LOWER(email) = LOWER($1) LIMIT 1';
      const result = await this.pool.query(query, [email]);

      return result.rows[0] || null;

    } catch (error) {
      storageLogger.error('Failed to find candidate by email', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Get candidates for delivery (not yet delivered, high quality)
   */
  async getCandidatesForDelivery(minQualityScore = 70, limit = 100) {
    try {
      const query = `
        SELECT * FROM candidates
        WHERE delivered_to_client = FALSE
          AND overall_quality_score >= $1
        ORDER BY overall_quality_score DESC, scraped_at DESC
        LIMIT $2
      `;

      const result = await this.pool.query(query, [minQualityScore, limit]);

      storageLogger.info('Fetched candidates for delivery', { count: result.rows.length });

      return result.rows;

    } catch (error) {
      storageLogger.error('Failed to fetch candidates for delivery', { error: error.message });
      throw error;
    }
  }

  /**
   * Mark candidates as delivered
   */
  async markAsDelivered(candidateIds) {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE candidates
        SET delivered_to_client = TRUE, delivered_at = CURRENT_TIMESTAMP
        WHERE id = ANY($1::uuid[])
      `;

      await client.query(query, [candidateIds]);

      storageLogger.info('Candidates marked as delivered', { count: candidateIds.length });

    } catch (error) {
      storageLogger.error('Failed to mark candidates as delivered', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log activity
   */
  async logActivity(activityData) {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO activity_log (
          activity_type, entity_type, entity_id, action, status, message,
          workflow_name, n8n_execution_id, user_id,
          duration_ms, api_calls_made, cost_usd,
          metadata, error_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      const values = [
        activityData.activity_type,
        activityData.entity_type,
        activityData.entity_id || null,
        activityData.action,
        activityData.status,
        activityData.message,
        activityData.workflow_name || null,
        activityData.n8n_execution_id || null,
        activityData.user_id || null,
        activityData.duration_ms || null,
        activityData.api_calls_made || null,
        activityData.cost_usd || null,
        JSON.stringify(activityData.metadata || {}),
        JSON.stringify(activityData.error_details || {}),
      ];

      await client.query(query, values);

    } catch (error) {
      storageLogger.error('Failed to log activity', { error: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * Track API usage
   */
  async trackApiUsage(apiService, operation, cost, success = true) {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO api_usage (
          api_service, operation, requests_count, success_count, failure_count,
          cost_per_request, total_cost, hour, metadata
        ) VALUES ($1, $2, 1, $3, $4, $5, $5, EXTRACT(HOUR FROM CURRENT_TIMESTAMP), $6)
      `;

      const values = [
        apiService,
        operation,
        success ? 1 : 0,
        success ? 0 : 1,
        cost,
        JSON.stringify({ timestamp: new Date().toISOString() }),
      ];

      await client.query(query, values);

    } catch (error) {
      storageLogger.error('Failed to track API usage', { error: error.message });
    } finally {
      client.release();
    }
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(date = new Date()) {
    try {
      const dateStr = date.toISOString().split('T')[0];

      const query = `
        SELECT
          COUNT(*) as total_candidates,
          COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_emails,
          COUNT(CASE WHEN delivered_to_client = TRUE THEN 1 END) as delivered,
          AVG(overall_quality_score) as avg_quality_score,
          SUM(CASE WHEN overall_quality_score >= 80 THEN 1 ELSE 0 END) as high_quality_count
        FROM candidates
        WHERE DATE(scraped_at) = $1
      `;

      const result = await this.pool.query(query, [dateStr]);

      return result.rows[0];

    } catch (error) {
      storageLogger.error('Failed to get daily stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Close database connection pool
   */
  async close() {
    await this.pool.end();
    storageLogger.info('Database pool closed');
  }
}

module.exports = new Database();
