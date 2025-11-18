/**
 * Google Sheets Service
 * Syncs candidate data to Google Sheets for client access
 */

const { google } = require('googleapis');
const config = require('../config/config');
const { googleSheetsLimiter } = require('../utils/rate-limiter');
const { storageLogger } = require('../utils/logger');

class GoogleSheetsService {
  constructor() {
    this.sheetsApi = null;
    this.spreadsheetId = config.googleSheets.spreadsheetId;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: config.googleSheets.clientEmail,
          private_key: config.googleSheets.privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheetsApi = google.sheets({ version: 'v4', auth });
      this.initialized = true;

      storageLogger.info('Google Sheets API initialized');

    } catch (error) {
      storageLogger.error('Failed to initialize Google Sheets API', { error: error.message });
      throw error;
    }
  }

  /**
   * Sync candidates to Google Sheets
   */
  async syncCandidates(candidates, sheetName = 'Candidates') {
    await this.initialize();

    try {
      storageLogger.info(`Syncing ${candidates.length} candidates to Google Sheets`);

      // Prepare data for sheets
      const rows = candidates.map(c => this.candidateToRow(c));

      // Add header row
      const headers = [
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Location',
        'Current Title', 'Current Company', 'LinkedIn URL',
        'Email Verified', 'Email Deliverability %', 'Quality Score',
        'Source Platform', 'Scraped At', 'Status',
      ];

      const values = [headers, ...rows];

      // Clear existing data
      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.values.clear({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:Z`,
        });
      });

      // Write new data
      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          resource: { values },
        });
      });

      // Format header row
      await this.formatHeaderRow(sheetName);

      storageLogger.info('Google Sheets sync complete', { candidatesCount: candidates.length });

      return true;

    } catch (error) {
      storageLogger.error('Failed to sync to Google Sheets', { error: error.message });
      throw error;
    }
  }

  /**
   * Append candidates to Google Sheets (without clearing)
   */
  async appendCandidates(candidates, sheetName = 'Candidates') {
    await this.initialize();

    try {
      storageLogger.info(`Appending ${candidates.length} candidates to Google Sheets`);

      const rows = candidates.map(c => this.candidateToRow(c));

      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:Z`,
          valueInputOption: 'RAW',
          resource: { values: rows },
        });
      });

      storageLogger.info('Candidates appended to Google Sheets', { count: candidates.length });

      return true;

    } catch (error) {
      storageLogger.error('Failed to append to Google Sheets', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert candidate object to sheet row
   */
  candidateToRow(candidate) {
    return [
      candidate.id || '',
      candidate.first_name || '',
      candidate.last_name || '',
      candidate.email || '',
      candidate.phone || '',
      candidate.location || `${candidate.city || ''}, ${candidate.state || ''}`.trim(),
      candidate.current_title || '',
      candidate.current_company || '',
      candidate.linkedin_url || '',
      candidate.email_verified ? 'Yes' : 'No',
      candidate.email_deliverability_score || '',
      candidate.overall_quality_score || '',
      candidate.source_platform || '',
      candidate.scraped_at ? new Date(candidate.scraped_at).toLocaleDateString() : '',
      candidate.delivered_to_client ? 'Delivered' : 'Pending',
    ];
  }

  /**
   * Format header row (bold, frozen)
   */
  async formatHeaderRow(sheetName) {
    try {
      // Get sheet ID
      const sheetMetadata = await this.sheetsApi.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = sheetMetadata.data.sheets.find(s => s.properties.title === sheetName);
      if (!sheet) return;

      const sheetId = sheet.properties.sheetId;

      // Format header row
      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [
              // Freeze header row
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: sheetId,
                    gridProperties: {
                      frozenRowCount: 1,
                    },
                  },
                  fields: 'gridProperties.frozenRowCount',
                },
              },
              // Bold header row
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: true,
                      },
                      backgroundColor: {
                        red: 0.9,
                        green: 0.9,
                        blue: 0.9,
                      },
                    },
                  },
                  fields: 'userEnteredFormat(textFormat,backgroundColor)',
                },
              },
            ],
          },
        });
      });

      storageLogger.debug('Header row formatted');

    } catch (error) {
      storageLogger.warn('Failed to format header row', { error: error.message });
    }
  }

  /**
   * Create a new sheet
   */
  async createSheet(sheetName) {
    await this.initialize();

    try {
      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        });
      });

      storageLogger.info('Sheet created', { sheetName });

    } catch (error) {
      if (error.message.includes('already exists')) {
        storageLogger.info('Sheet already exists', { sheetName });
      } else {
        storageLogger.error('Failed to create sheet', { sheetName, error: error.message });
        throw error;
      }
    }
  }

  /**
   * Log activity to a separate "Activity Log" sheet
   */
  async logActivity(activityData) {
    await this.initialize();

    try {
      const sheetName = 'Activity Log';

      const row = [
        new Date().toISOString(),
        activityData.workflow_name || '',
        activityData.action || '',
        activityData.status || '',
        activityData.message || '',
        activityData.candidatesProcessed || '',
        activityData.duration || '',
      ];

      await googleSheetsLimiter.schedule(async () => {
        await this.sheetsApi.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!A:Z`,
          valueInputOption: 'RAW',
          resource: { values: [row] },
        });
      });

    } catch (error) {
      storageLogger.debug('Failed to log activity to sheets', { error: error.message });
    }
  }
}

module.exports = new GoogleSheetsService();
