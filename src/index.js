/**
 * IBOVI Candidate Acquisition System
 * Main Entry Point
 */

const express = require('express');
const config = require('./config/config');
const { logger } = require('./utils/logger');

// Import services
const database = require('./storage/database');
const IndeedScraper = require('./scrapers/indeed-scraper');
const DataProcessor = require('./processors/data-processor');
const EmailVerifier = require('./verification/email-verifier');
const CompanyEnricher = require('./enrichment/company-enricher');
const googleSheets = require('./storage/google-sheets');

// Initialize Express
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Scraping endpoints
app.post('/api/scrape/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const { searchQuery, location, maxResults } = req.body;

    logger.info('Scraping request received', { platform, searchQuery, location });

    let scraper;
    let candidates = [];

    // Initialize appropriate scraper
    if (platform.startsWith('indeed_')) {
      const region = platform.split('_')[1];
      scraper = new IndeedScraper(region);
      candidates = await scraper.scrape({ query: searchQuery, location, maxResults });
    }
    // Add other scrapers as needed

    res.json({
      success: true,
      platform,
      candidatesFound: candidates.length,
      candidates,
    });

  } catch (error) {
    logger.error('Scraping failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Processing endpoint
app.post('/api/process', async (req, res) => {
  try {
    const { candidates } = req.body;

    logger.info('Processing request received', { count: candidates.length });

    const processor = new DataProcessor();
    const processed = await processor.processBatch(candidates);

    res.json({
      success: true,
      processed: processed.length,
      candidates: processed,
    });

  } catch (error) {
    logger.error('Processing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { candidates } = req.body;

    logger.info('Verification request received', { count: candidates.length });

    const verifier = new EmailVerifier();

    // Verify emails for all candidates
    const verified = await Promise.all(
      candidates.map(async (candidate) => {
        if (candidate.email) {
          const verificationResult = await verifier.verifyEmail(candidate.email);
          return {
            ...candidate,
            email_verified: verificationResult.is_valid,
            email_deliverability_score: verificationResult.deliverability_score,
            email_verification_status: verificationResult.status,
            verification_data: verificationResult,
          };
        }
        return candidate;
      })
    );

    res.json({
      success: true,
      verified: verified.length,
      candidates: verified,
    });

  } catch (error) {
    logger.error('Verification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Enrichment endpoint
app.post('/api/enrich', async (req, res) => {
  try {
    const { candidates } = req.body;

    logger.info('Enrichment request received', { count: candidates.length });

    const enricher = new CompanyEnricher();

    // Enrich company data for all candidates
    const enriched = await Promise.all(
      candidates.map(async (candidate) => {
        if (candidate.current_company) {
          const companyData = await enricher.enrichCompany(
            candidate.current_company,
            candidate.company_domain
          );

          if (companyData) {
            return {
              ...candidate,
              company_domain: companyData.domain || candidate.company_domain,
              company_size: companyData.size,
              company_industry: companyData.industry,
              hr_contact_email: companyData.hr_email,
              enrichment_data: companyData,
            };
          }
        }
        return candidate;
      })
    );

    res.json({
      success: true,
      enriched: enriched.length,
      candidates: enriched,
    });

  } catch (error) {
    logger.error('Enrichment failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Storage endpoints
app.post('/api/storage/save', async (req, res) => {
  try {
    const { candidates } = req.body;

    logger.info('Storage request received', { count: candidates.length });

    const savedIds = [];

    for (const candidate of candidates) {
      try {
        const id = await database.insertCandidate(candidate);
        savedIds.push(id);
      } catch (error) {
        logger.warn('Failed to save candidate', { error: error.message });
      }
    }

    res.json({
      success: true,
      saved: savedIds.length,
      candidateIds: savedIds,
    });

  } catch (error) {
    logger.error('Storage failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delivery endpoints
app.post('/api/delivery/sheets', async (req, res) => {
  try {
    const { candidates } = req.body;

    logger.info('Google Sheets sync request received', { count: candidates.length });

    await googleSheets.appendCandidates(candidates);

    res.json({
      success: true,
      synced: candidates.length,
    });

  } catch (error) {
    logger.error('Google Sheets sync failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/delivery/slack', async (req, res) => {
  try {
    const { candidates, summary } = req.body;

    logger.info('Slack notification request received');

    // Implement Slack webhook notification
    // TODO: Add Slack integration

    res.json({
      success: true,
      notified: true,
    });

  } catch (error) {
    logger.error('Slack notification failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Start server
const PORT = config.server.port;

app.listen(PORT, () => {
  logger.info(`IBOVI System started on port ${PORT}`, {
    environment: config.server.env,
    nodeVersion: process.version,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully');
  await database.close();
  process.exit(0);
});

module.exports = app;
