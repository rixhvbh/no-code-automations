# Multi-Platform Job Scraper Workflow - Setup Guide

## Overview

This n8n workflow automates job scraping from Indeed, ZipRecruiter, and Glassdoor with intelligent proxy rotation, deduplication, and real-time Slack alerts.

### Key Features
- **Multi-Platform Scraping**: Simultaneously scrapes Indeed, ZipRecruiter, and Glassdoor
- **Intelligent Proxy Rotation**: Avoids IP bans with rotating proxy providers
- **Advanced Deduplication**: Removes duplicate job postings across platforms
- **Data Quality Checks**: Filters out incomplete records
- **Company Enrichment**: Ready for Clearbit API integration
- **Google Sheets Integration**: Automatic data storage with upsert capability
- **Activity Logging**: Comprehensive execution tracking
- **Slack Notifications**: Real-time alerts with detailed metrics
- **Error Handling**: Retry logic and error rate monitoring

## Architecture (26 Nodes)

```
Schedule Trigger
  ↓
Search Parameters Input
  ↓
Split by Platform (Switch)
  ↓
┌─────────────┬──────────────┬────────────────┐
│   Indeed    │ ZipRecruiter │   Glassdoor    │
│  (5 nodes)  │  (5 nodes)   │   (5 nodes)    │
└─────────────┴──────────────┴────────────────┘
  ↓
Merge All Results
  ↓
Deduplication Logic
  ↓
Data Quality Check
  ↓
Enrich Company Data
  ↓
Append to Google Sheets
  ↓
Prepare Activity Log
  ↓
Log to Activity Sheet
  ↓
Format Slack Message
  ↓
Send Slack Alert
  ↓
Error Rate Check
  ↓
Send Error Alert (if needed)
```

## Prerequisites

### 1. n8n Instance
- n8n version 1.0+ installed
- Access to n8n admin panel

### 2. Proxy Services (Choose at least one)
- **ScraperAPI**: https://www.scraperapi.com/
- **WebShare**: https://www.webshare.io/
- **Bright Data**: https://brightdata.com/

### 3. Google Sheets
- Google account with Google Sheets access
- OAuth2 credentials configured in n8n

### 4. Slack Workspace
- Slack workspace admin access
- Slack app created with OAuth tokens

### 5. Optional: Clearbit API
- Clearbit account for company data enrichment
- API key

## Installation Steps

### Step 1: Import Workflow to n8n

1. Log into your n8n instance
2. Click **"Workflows"** → **"Import from File"**
3. Select `multi-platform-job-scraper-workflow.json`
4. Click **"Import"**

### Step 2: Configure Proxy Rotation

Update the proxy configuration in these nodes:
- **Indeed - Proxy Setup** (node-004)
- **ZipRecruiter - Proxy Setup** (node-008)
- **Glassdoor - Proxy Setup** (node-012)

Replace placeholder values:

```javascript
const proxies = [
  'http://scraperapi:YOUR_SCRAPERAPI_KEY@proxy-server.scraperapi.com:8001',
  'http://api:YOUR_WEBSHARE_KEY@proxy.webshare.io:80',
  'rotating-residential.brightdata.com:22225'
];
```

**Example with real API keys:**
```javascript
const proxies = [
  'http://scraperapi:a1b2c3d4e5f6@proxy-server.scraperapi.com:8001',
  'http://api:ws_1234567890@proxy.webshare.io:80',
  'brd-customer-c_abc123:pass123@rotating-residential.brightdata.com:22225'
];
```

### Step 3: Set Up Google Sheets

#### Create Google Sheets Document

1. Create a new Google Sheet named **"Job Scraper Database"**
2. Create two sheets:
   - **Jobs** (for job data)
   - **Activity_Log** (for execution logs)

#### Jobs Sheet Headers (Row 1):
```
ID | Title | Company | Location | Description | Salary | Job Type | Posted Date | URL | Platform | Scraped At | Search Query | Search Location
```

#### Activity_Log Sheet Headers (Row 1):
```
Timestamp | Workflow | Status | Total Jobs | New Jobs | Indeed Count | ZipRecruiter Count | Glassdoor Count | Search Query | Search Location | Error Count | Execution ID
```

#### Configure n8n Google Sheets Credentials

1. In n8n, go to **"Credentials"** → **"Create New"**
2. Select **"Google Sheets OAuth2 API"**
3. Follow OAuth2 authentication flow
4. Save credential and note the credential ID

#### Update Workflow Nodes

Replace `YOUR_SPREADSHEET_ID` and credential IDs in:
- **Append to Google Sheets** (node-020)
- **Log to Activity Sheet** (node-022)

Get Spreadsheet ID from URL:
```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

Update node parameters:
```json
{
  "documentId": {
    "value": "1a2b3c4d5e6f7g8h9i0j",  // Your actual spreadsheet ID
    "mode": "id"
  }
}
```

### Step 4: Configure Slack Integration

#### Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name it **"n8n Job Scraper"**
4. Select your workspace

#### Set Permissions

Add these OAuth scopes:
- `chat:write`
- `chat:write.public`
- `channels:read`

#### Install App to Workspace

1. Click **"Install to Workspace"**
2. Authorize the app
3. Copy the **OAuth Access Token**

#### Configure n8n Slack Credentials

1. In n8n, create **"Slack OAuth2 API"** credential
2. Paste your OAuth token
3. Save and note credential ID

#### Update Workflow Nodes

Replace `YOUR_SLACK_CHANNEL` and credential IDs in:
- **Send Slack Alert** (node-024)
- **Send Error Alert** (node-026)

Channel format: `#job-scraper` or channel ID `C1234567890`

### Step 5: Configure Search Parameters (Optional)

Edit the **Search Parameters Input** node (node-002) to set default values:

```javascript
const searchParams = {
  jobTitle: inputData.jobTitle || 'Software Engineer',  // Default job title
  location: inputData.location || 'Remote',              // Default location
  platforms: inputData.platforms || ['indeed', 'ziprecruiter', 'glassdoor'],
  maxResultsPerPlatform: inputData.maxResultsPerPlatform || 50,  // Max results per platform
  timestamp: new Date().toISOString(),
  sessionId: `scrape-${Date.now()}`
};
```

### Step 6: Set Schedule (Optional)

The **Schedule Trigger** (node-001) is set to run every 6 hours:

```
Cron Expression: 0 */6 * * *
```

**Common schedules:**
- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at 9 AM: `0 9 * * *`
- Twice daily (9 AM, 5 PM): `0 9,17 * * *`

To change, edit the cron expression in the Schedule Trigger node.

### Step 7: Test the Workflow

#### Manual Test

1. Click **"Execute Workflow"** button
2. Monitor execution in real-time
3. Check for errors in each node
4. Verify data appears in Google Sheets
5. Confirm Slack notification received

#### Debug Common Issues

**Issue: HTTP Request Fails**
- Verify proxy credentials are correct
- Check if proxy service is active
- Test proxy connection separately

**Issue: No Data in Google Sheets**
- Verify spreadsheet ID is correct
- Check Google Sheets credential authentication
- Ensure sheet names match exactly ("Jobs", "Activity_Log")

**Issue: Slack Notification Not Sent**
- Verify Slack credential is valid
- Check channel name/ID is correct
- Ensure Slack app has `chat:write` permission

**Issue: Parsing Returns No Jobs**
- Job board HTML structure may have changed
- Update regex patterns in parse nodes
- Consider using ScraperAPI's HTML parsing features

## Advanced Configuration

### Add Clearbit Company Enrichment

Update **Enrich Company Data** node (node-019):

```javascript
const jobs = $input.all();
const enriched = [];

for (const item of jobs) {
  const job = item.json;

  try {
    // Make HTTP request to Clearbit
    const response = await $http.request({
      method: 'GET',
      url: `https://company.clearbit.com/v2/companies/find?domain=${job.company_data.domain}`,
      headers: {
        'Authorization': `Bearer YOUR_CLEARBIT_API_KEY`
      }
    });

    const enrichedJob = {
      ...job,
      company_data: {
        ...response.data,
        enriched_at: new Date().toISOString()
      }
    };

    enriched.push({ json: enrichedJob });
  } catch (error) {
    // If enrichment fails, keep original data
    enriched.push(item);
  }
}

return enriched;
```

### Customize Deduplication Logic

The deduplication algorithm in **Deduplication Logic** node (node-017) uses composite keys:

```javascript
// Current logic
const jobId = job.id || `${job.company}-${job.title}-${job.location}`.toLowerCase().replace(/\s+/g, '-');

// Alternative: Use title + company only
const jobId = `${job.company}-${job.title}`.toLowerCase().replace(/\s+/g, '-');

// Alternative: Use fuzzy matching (requires additional library)
// Implement Levenshtein distance for similar titles
```

### Add Email Notifications

1. Add **Send Email** node after Slack alert
2. Configure SMTP credentials
3. Format email with job summary

### Implement Rate Limiting

Add delays between requests to respect platform limits:

1. Insert **Wait** node after each HTTP request
2. Set wait time: 2-5 seconds
3. Randomize delay for more natural behavior

## Monitoring & Maintenance

### Activity Log Metrics

Monitor these metrics in Activity_Log sheet:
- **Status**: Success/Warning indicates workflow health
- **Error Count**: Track failures over time
- **Platform Counts**: Monitor which platforms return most jobs
- **Execution Time**: Track via execution_id timestamps

### Regular Maintenance Tasks

**Weekly:**
- Review Activity Log for error patterns
- Check Google Sheets storage capacity
- Verify proxy service quota

**Monthly:**
- Update HTML parsing regex if needed
- Rotate proxy API keys
- Review and optimize search parameters

**Quarterly:**
- Test all three platform scrapers
- Update user agent strings
- Review data quality metrics

## Troubleshooting

### High Error Rate Alerts

If you receive error rate >20% alerts:

1. Check proxy service status
2. Verify job board websites haven't blocked IPs
3. Review HTML structure changes
4. Increase retry delays
5. Rotate to different proxy provider

### Duplicate Jobs Despite Deduplication

1. Check if job IDs are being captured correctly
2. Verify deduplication key logic
3. Add additional matching criteria (e.g., salary, description)

### Incomplete Job Data

1. Review Data Quality Check conditions
2. Adjust required field validation
3. Update parsing logic for missing fields

### Workflow Times Out

1. Reduce `maxResultsPerPlatform` in Search Parameters
2. Increase HTTP request timeout values
3. Process platforms sequentially instead of parallel

## Production Best Practices

### Security
- Store all API keys in n8n credentials (never hardcode)
- Use environment variables for sensitive data
- Regularly rotate proxy credentials
- Enable n8n's built-in authentication

### Performance
- Limit concurrent HTTP requests
- Implement exponential backoff for retries
- Cache frequently accessed data
- Monitor memory usage

### Data Quality
- Implement data validation at each step
- Log all parsing errors for review
- Periodically audit scraped data accuracy
- Remove outdated job postings (>30 days)

### Compliance
- Review job board Terms of Service
- Respect robots.txt guidelines
- Implement rate limiting
- Add proper user agent identification

## Support & Resources

### Documentation
- n8n Documentation: https://docs.n8n.io/
- n8n Community Forum: https://community.n8n.io/
- Workflow Protocols: See `UNIVERSAL N8N WORKFLOW CREATION PROTOCOLS.txt`

### API Documentation
- ScraperAPI: https://www.scraperapi.com/documentation/
- Google Sheets API: https://developers.google.com/sheets/api
- Slack API: https://api.slack.com/
- Clearbit API: https://clearbit.com/docs

### Getting Help
For issues specific to this workflow:
1. Check Activity_Log sheet for error details
2. Review n8n execution logs
3. Test individual nodes in isolation
4. Consult n8n community forum

## Changelog

### Version 1.0 (Initial Release)
- Multi-platform scraping (Indeed, ZipRecruiter, Glassdoor)
- Proxy rotation with 3 provider support
- Advanced deduplication algorithm
- Google Sheets integration with upsert
- Slack notifications with metrics
- Error rate monitoring and alerts
- Comprehensive activity logging

## License

This workflow is provided as-is for educational and commercial use. Always comply with job board Terms of Service and applicable laws.

---

**Created with n8n Universal Workflow Creation Protocols v1.0**
