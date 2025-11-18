# Multi-Platform Job Scraper - Technical Implementation Reference

## Table of Contents
1. [Workflow Architecture](#workflow-architecture)
2. [Node-by-Node Technical Breakdown](#node-by-node-technical-breakdown)
3. [Proxy Rotation System](#proxy-rotation-system)
4. [Data Processing Pipeline](#data-processing-pipeline)
5. [Error Handling Strategy](#error-handling-strategy)
6. [Performance Optimization](#performance-optimization)
7. [Code Examples & Snippets](#code-examples--snippets)

---

## Workflow Architecture

### Overview
This workflow implements a **parallel processing architecture** with three independent scraping branches that converge at a merge point, followed by sequential data processing.

### Flow Diagram
```
                    ┌─────────────────────┐
                    │  Schedule Trigger   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Search Parameters   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Split by Platform  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
    │ Indeed  │          │ZipRecruiter│       │ Glassdoor │
    │ Branch  │          │   Branch   │       │  Branch   │
    │(5 nodes)│          │  (5 nodes) │       │ (5 nodes) │
    └────┬────┘          └─────┬─────┘        └─────┬─────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Merge Results     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Deduplication     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Quality Check      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Company Enrichment  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Google Sheets      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Activity Logging   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Slack Alerts       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Error Monitoring   │
                    └─────────────────────┘
```

### Processing Stages

#### Stage 1: Initialization (Nodes 1-3)
- **Trigger**: Schedule-based or manual execution
- **Configuration**: Load search parameters
- **Routing**: Split execution across platforms

#### Stage 2: Parallel Scraping (Nodes 4-15)
- **Concurrency**: All three platforms scrape simultaneously
- **Independence**: Each branch operates independently
- **Resilience**: Individual branch failures don't affect others

#### Stage 3: Data Processing (Nodes 16-19)
- **Merging**: Combine all platform results
- **Deduplication**: Remove duplicate jobs
- **Validation**: Quality checks
- **Enrichment**: Add company data

#### Stage 4: Storage & Notification (Nodes 20-26)
- **Persistence**: Save to Google Sheets
- **Logging**: Track execution metrics
- **Alerting**: Notify via Slack
- **Monitoring**: Error rate checking

---

## Node-by-Node Technical Breakdown

### NODE-001: Schedule Trigger
**Type**: `n8n-nodes-base.scheduleTrigger`
**Purpose**: Initiates workflow execution on schedule

**Configuration**:
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 */6 * * *"
      }
    ]
  }
}
```

**Cron Expression**: `0 */6 * * *`
- Runs at minute 0 of every 6th hour
- Executions: 12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM

**Manual Trigger**: Also supports manual execution via n8n UI

---

### NODE-002: Search Parameters Input
**Type**: `n8n-nodes-base.code`
**Purpose**: Configure and validate search parameters

**Key Logic**:
```javascript
// Input handling - supports both manual trigger and webhook input
const inputData = $input.first()?.json || {};

// Default parameters with fallbacks
const searchParams = {
  jobTitle: inputData.jobTitle || 'Software Engineer',
  location: inputData.location || 'Remote',
  platforms: inputData.platforms || ['indeed', 'ziprecruiter', 'glassdoor'],
  maxResultsPerPlatform: inputData.maxResultsPerPlatform || 50,
  timestamp: new Date().toISOString(),
  sessionId: `scrape-${Date.now()}`
};

// Validation
if (!searchParams.jobTitle || !searchParams.location) {
  throw new Error('Job title and location are required parameters');
}
```

**Output Data Structure**:
```javascript
{
  "jobTitle": "Software Engineer",
  "location": "Remote",
  "platforms": ["indeed", "ziprecruiter", "glassdoor"],
  "maxResultsPerPlatform": 50,
  "timestamp": "2024-11-18T12:00:00.000Z",
  "sessionId": "scrape-1700308800000"
}
```

**Why This Approach**:
- Provides sensible defaults for automated runs
- Allows dynamic parameters from manual triggers
- Generates unique session IDs for tracking
- Validates required fields early in pipeline

---

### NODE-003: Split by Platform
**Type**: `n8n-nodes-base.switch`
**Purpose**: Route execution to appropriate platform scrapers

**Switch Rules**:
```javascript
// Rule 1: Indeed (Output 0)
$json.platforms.includes('indeed')

// Rule 2: ZipRecruiter (Output 1)
$json.platforms.includes('ziprecruiter')

// Rule 3: Glassdoor (Output 2)
$json.platforms.includes('glassdoor')
```

**Routing Behavior**:
- **Multi-output**: Can activate multiple branches simultaneously
- **Conditional**: Only routes to platforms in the `platforms` array
- **Parallel Execution**: All active branches run concurrently

**Example Flow**:
```
Input: { platforms: ['indeed', 'glassdoor'] }
Result: Routes to Indeed (output 0) and Glassdoor (output 2)
        ZipRecruiter branch remains inactive
```

---

### NODES 004-007: Indeed Scraping Branch

#### NODE-004: Indeed - Proxy Setup
**Type**: `n8n-nodes-base.code`

**Proxy Rotation Logic**:
```javascript
const proxies = [
  'http://scraperapi:KEY@proxy-server.scraperapi.com:8001',
  'http://api:KEY@proxy.webshare.io:80',
  'rotating-residential.brightdata.com:22225'
];

const itemIndex = $item(0).$itemIndex || 0;
const selectedProxy = proxies[itemIndex % proxies.length];
```

**Why Modulo Operator**:
- Ensures index never exceeds array length
- Creates rotating pattern: 0, 1, 2, 0, 1, 2...
- Distributes load across proxy providers

**User Agent Rotation**:
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];
const selectedUserAgent = userAgents[itemIndex % userAgents.length];
```

**URL Construction**:
```javascript
const jobTitle = encodeURIComponent(inputData.jobTitle);
const location = encodeURIComponent(inputData.location);
const indeedUrl = `https://www.indeed.com/jobs?q=${jobTitle}&l=${location}&fromage=7`;
```

**URL Parameters**:
- `q`: Job search query
- `l`: Location
- `fromage`: Jobs posted within last 7 days

#### NODE-005: Indeed - HTTP Request
**Type**: `n8n-nodes-base.httpRequest`

**Configuration**:
```json
{
  "method": "GET",
  "url": "={{ $json.url }}",
  "sendHeaders": true,
  "headerParameters": {
    "User-Agent": "={{ $json.headers['User-Agent'] }}",
    "Accept": "text/html,application/xhtml+xml,application/xml",
    "Accept-Language": "en-US,en;q=0.9"
  },
  "options": {
    "timeout": 30000,
    "retry": {
      "maxTries": 3,
      "waitBetweenTries": 2000
    }
  }
}
```

**Retry Strategy**:
- **Max Tries**: 3 attempts
- **Backoff**: 2 seconds between retries
- **Timeout**: 30 seconds per request

**Response Handling**:
- **Success**: Returns HTML content
- **Failure**: Triggers retry or returns error

#### NODE-006: Indeed - Parse HTML
**Type**: `n8n-nodes-base.code`

**Parsing Strategy**:
```javascript
const html = $input.first().json.data || $input.first().json;
const jobs = [];

// Regex pattern for job cards
const jobCardRegex = /data-jk=\"([^\"]+)\"[^>]*>.*?<span[^>]*title=\"([^\"]+)\"[^>]*>.*?<span[^>]*company[^>]*>([^<]+)<.*?<div[^>]*location[^>]*>([^<]+)</gs;

let match;
let count = 0;
const maxResults = searchParams.maxResultsPerPlatform || 50;

while ((match = jobCardRegex.exec(html)) !== null && count < maxResults) {
  jobs.push({
    job_id: `indeed-${match[1]}`,
    title: match[2]?.trim(),
    company: match[3]?.trim(),
    location: match[4]?.trim(),
    platform: 'indeed',
    url: `https://www.indeed.com/viewjob?jk=${match[1]}`,
    scraped_at: new Date().toISOString()
  });
  count++;
}
```

**Why Regex**:
- **Fast**: No DOM parsing overhead
- **Lightweight**: Works with raw HTML strings
- **Flexible**: Easy to adjust patterns

**Alternative**: For production, consider using Cheerio:
```javascript
const cheerio = require('cheerio');
const $ = cheerio.load(html);

$('.job_seen_beacon').each((i, elem) => {
  jobs.push({
    job_id: `indeed-${$(elem).data('jk')}`,
    title: $(elem).find('.jobTitle').text().trim(),
    company: $(elem).find('.companyName').text().trim(),
    location: $(elem).find('.companyLocation').text().trim()
  });
});
```

**Error Handling**:
```javascript
try {
  // Parsing logic
} catch (error) {
  console.error('Indeed parsing error:', error.message);
  return [{
    json: {
      error: true,
      platform: 'indeed',
      message: error.message,
      jobs: []
    }
  }];
}
```

#### NODE-007: Indeed - Normalize Data
**Type**: `n8n-nodes-base.code`

**Purpose**: Standardize data structure across platforms

**Normalization Logic**:
```javascript
const jobs = $input.all();
const normalized = [];

for (const item of jobs) {
  const job = item.json;

  if (job.error) continue; // Skip error items

  normalized.push({
    json: {
      id: job.job_id,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description || '',
      salary: job.salary || 'Not specified',
      job_type: job.job_type || 'Full-time',
      posted_date: job.posted_date || new Date().toISOString().split('T')[0],
      url: job.url,
      platform: 'Indeed',
      scraped_at: job.scraped_at,
      search_query: job.search_query,
      search_location: job.search_location,
      raw_data: job  // Preserve original for debugging
    }
  });
}
```

**Standardized Fields**:
- **id**: Unique identifier
- **title**: Job title
- **company**: Company name
- **location**: Job location
- **description**: Job description (with default)
- **salary**: Salary range (with default)
- **job_type**: Employment type (with default)
- **posted_date**: When job was posted
- **url**: Direct link to job posting
- **platform**: Source platform
- **scraped_at**: Timestamp of scraping
- **search_query**: Original search term
- **search_location**: Search location
- **raw_data**: Original unprocessed data

**Why Normalize**:
- Ensures consistent data structure
- Simplifies downstream processing
- Provides default values for missing fields
- Preserves original data for debugging

---

### NODES 008-011: ZipRecruiter Branch
**Similar architecture to Indeed branch**

**Key Differences**:
- Different URL structure
- Different HTML parsing patterns
- Offset proxy rotation index: `(itemIndex + 1) % proxies.length`

---

### NODES 012-015: Glassdoor Branch
**Similar architecture to Indeed branch**

**Key Differences**:
- Different URL parameters
- Different parsing regex
- Offset proxy rotation index: `(itemIndex + 2) % proxies.length`

---

### NODE-016: Merge All Results
**Type**: `n8n-nodes-base.merge`

**Configuration**:
```json
{
  "mode": "combine",
  "combinationMode": "mergeByPosition",
  "options": {}
}
```

**Merge Behavior**:
- **Input 0**: Indeed results
- **Input 1**: ZipRecruiter results
- **Input 2**: Glassdoor results
- **Output**: Combined array of all job items

**Example**:
```
Input 0: [job1, job2, job3]  (Indeed)
Input 1: [job4, job5]         (ZipRecruiter)
Input 2: [job6, job7, job8, job9] (Glassdoor)

Output: [job1, job2, job3, job4, job5, job6, job7, job8, job9]
```

---

### NODE-017: Deduplication Logic
**Type**: `n8n-nodes-base.code`

**Algorithm**: Composite Key Hashing

**Implementation**:
```javascript
const items = $input.all();
const seen = new Set();      // O(1) lookup
const unique = [];
const duplicates = [];

for (const item of items) {
  const job = item.json;

  // Skip malformed items
  if (!job.id && !job.title && !job.company) {
    continue;
  }

  // Create composite key
  const jobId = job.id ||
    `${job.company}-${job.title}-${job.location}`
      .toLowerCase()
      .replace(/\s+/g, '-');

  if (!seen.has(jobId)) {
    seen.add(jobId);
    unique.push(item);
  } else {
    duplicates.push(item);
  }
}
```

**Why Set Data Structure**:
- **O(1) lookup time**: Constant time checking
- **Memory efficient**: Only stores keys, not full objects
- **Fast insertion**: No array searching needed

**Deduplication Strategy**:
1. **Primary**: Use job.id if available
2. **Fallback**: Create composite key from company + title + location
3. **Normalization**: Lowercase and remove spaces for matching

**Example Composite Keys**:
```
"google-software-engineer-mountain-view"
"amazon-senior-developer-seattle"
"microsoft-product-manager-redmond"
```

**Performance**:
```
Time Complexity: O(n) where n = number of jobs
Space Complexity: O(u) where u = number of unique jobs
```

**Metrics Logging**:
```javascript
console.log(`Deduplication: ${items.length} total, ${unique.length} unique, ${duplicates.length} duplicates removed`);
```

---

### NODE-018: Data Quality Check
**Type**: `n8n-nodes-base.if`

**Validation Rules**:
```javascript
{
  "conditions": {
    "conditions": [
      { "leftValue": "={{ $json.title }}", "operator": "notEmpty" },
      { "leftValue": "={{ $json.company }}", "operator": "notEmpty" },
      { "leftValue": "={{ $json.url }}", "operator": "notEmpty" }
    ],
    "combinator": "and"
  }
}
```

**Logic**:
- **ALL conditions must be true** (AND combinator)
- **Pass**: Job has title, company, and URL
- **Fail**: Job is missing any required field

**Flow**:
```
True Branch → Continue to Company Enrichment
False Branch → Discarded (incomplete records)
```

**Why This Matters**:
- Prevents incomplete data in Google Sheets
- Ensures minimum data quality
- Reduces noise in final dataset

---

### NODE-019: Enrich Company Data
**Type**: `n8n-nodes-base.code`

**Purpose**: Add company metadata via Clearbit API

**Basic Implementation**:
```javascript
const jobs = $input.all();
const enriched = [];

for (const item of jobs) {
  const job = item.json;

  const enrichedJob = {
    ...job,
    company_data: {
      domain: job.company ? `${job.company.toLowerCase().replace(/\s+/g, '')}.com` : '',
      enriched_at: new Date().toISOString(),
      status: 'enrichment_ready'
    }
  };

  enriched.push({ json: enrichedJob });
}
```

**Advanced Implementation (with Clearbit API)**:
```javascript
for (const item of jobs) {
  const job = item.json;

  try {
    const response = await $http.request({
      method: 'GET',
      url: `https://company.clearbit.com/v2/companies/find?domain=${job.company_data.domain}`,
      headers: {
        'Authorization': `Bearer YOUR_CLEARBIT_API_KEY`
      },
      timeout: 5000
    });

    enriched.push({
      json: {
        ...job,
        company_data: {
          name: response.data.name,
          domain: response.data.domain,
          logo: response.data.logo,
          description: response.data.description,
          industry: response.data.category.industry,
          employees: response.data.metrics.employees,
          founded: response.data.foundedYear,
          location: response.data.geo.city + ', ' + response.data.geo.country,
          enriched_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    // If enrichment fails, keep original
    enriched.push(item);
  }
}
```

**Rate Limiting Consideration**:
```javascript
// Add delay between Clearbit requests
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
```

---

### NODE-020: Append to Google Sheets
**Type**: `n8n-nodes-base.googleSheets`

**Operation**: `appendOrUpdate` (Upsert)

**Configuration**:
```json
{
  "operation": "appendOrUpdate",
  "documentId": "YOUR_SPREADSHEET_ID",
  "sheetName": "Jobs",
  "columns": {
    "mappingMode": "defineBelow",
    "matchingColumns": ["id"]
  },
  "options": {
    "cellFormat": "USER_ENTERED",
    "useAppend": false
  }
}
```

**Upsert Logic**:
- **If job.id exists in sheet**: Update row
- **If job.id doesn't exist**: Append new row

**Column Mapping**:
```json
{
  "id": "={{ $json.id }}",
  "title": "={{ $json.title }}",
  "company": "={{ $json.company }}",
  "location": "={{ $json.location }}",
  "url": "={{ $json.url }}",
  "platform": "={{ $json.platform }}",
  "scraped_at": "={{ $json.scraped_at }}"
}
```

**Why Upsert**:
- Prevents duplicate entries
- Updates existing job postings
- Maintains data freshness

---

### NODE-021: Prepare Activity Log
**Type**: `n8n-nodes-base.code`

**Purpose**: Generate execution metrics for logging

**Metrics Calculation**:
```javascript
const jobs = $input.all();
const timestamp = new Date().toISOString();
const searchParams = $node["Search Parameters Input"].json;

const totalJobs = jobs.length;
const platformBreakdown = {};
const errors = [];

for (const item of jobs) {
  const job = item.json;
  const platform = job.platform || 'Unknown';

  platformBreakdown[platform] = (platformBreakdown[platform] || 0) + 1;

  if (job.error) {
    errors.push({ platform, message: job.message });
  }
}
```

**Status Determination**:
```javascript
const status = errors.length > totalJobs * 0.2 ? 'Warning' : 'Success';
```
- **Warning**: If >20% of jobs have errors
- **Success**: If ≤20% error rate

**Log Entry Structure**:
```javascript
{
  timestamp: "2024-11-18T12:00:00.000Z",
  workflow: "Multi-Platform Job Scraper",
  status: "Success",
  total_jobs: 47,
  new_jobs: 12,
  indeed_count: 18,
  ziprecruiter_count: 15,
  glassdoor_count: 14,
  search_query: "Software Engineer",
  search_location: "Remote",
  error_count: 2,
  error_details: "[{\"platform\":\"indeed\",\"message\":\"timeout\"}]",
  execution_id: "scrape-1700308800000"
}
```

---

### NODE-022: Log to Activity Sheet
**Type**: `n8n-nodes-base.googleSheets`

**Operation**: `append`

**Purpose**: Create audit trail of all executions

**Benefits**:
- Track workflow performance over time
- Identify patterns in errors
- Monitor data volume trends
- Debug failed executions

---

### NODE-023: Format Slack Message
**Type**: `n8n-nodes-base.code`

**Purpose**: Create rich Slack notification with blocks

**Message Structure**:
```javascript
{
  text: "✅ Job Scraper Report",  // Fallback text
  blocks: [
    {
      type: 'header',
      text: { type: 'plain_text', text: '✅ Multi-Platform Job Scraper Report' }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: '*Status:*\nSuccess' },
        { type: 'mrkdwn', text: '*Total Jobs:*\n47' },
        { type: 'mrkdwn', text: '*New Jobs:*\n12' },
        { type: 'mrkdwn', text: '*Timestamp:*\n2024-11-18T12:00:00Z' }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Platform Breakdown:*\n• Indeed: 18\n• ZipRecruiter: 15\n• Glassdoor: 14'
      }
    }
  ]
}
```

**Conditional Error Section**:
```javascript
if (logData.error_count > 0) {
  slackMessage.json.blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*⚠️ Errors:* ${logData.error_count} errors detected`
    }
  });
}
```

---

### NODE-024: Send Slack Alert
**Type**: `n8n-nodes-base.slack`

**Configuration**:
```json
{
  "resource": "message",
  "operation": "post",
  "channel": "YOUR_SLACK_CHANNEL",
  "text": "={{ $json.text }}",
  "otherOptions": {
    "blocks": "={{ JSON.stringify($json.blocks) }}"
  }
}
```

---

### NODE-025: Error Rate Check
**Type**: `n8n-nodes-base.if`

**Condition**:
```javascript
$json.error_count > ($json.total_jobs * 0.2)
```

**Threshold**: 20% error rate

**Examples**:
```
Total Jobs: 50, Error Count: 11 → 11 > 10 → TRUE → Send alert
Total Jobs: 50, Error Count: 9  → 9 > 10  → FALSE → No alert
Total Jobs: 100, Error Count: 21 → 21 > 20 → TRUE → Send alert
```

---

### NODE-026: Send Error Alert
**Type**: `n8n-nodes-base.slack`

**Purpose**: Critical alert for high error rates

**Message**:
```
🚨 *Critical Alert: Job Scraper High Error Rate*

Error rate exceeded 20% threshold.
Total errors: 11
Total jobs: 50

Please review the Activity Log for details.
Execution ID: scrape-1700308800000
```

---

## Proxy Rotation System

### Strategy: Round-Robin with Offset

**Implementation**:
```javascript
// Indeed (offset 0)
const selectedProxy = proxies[itemIndex % proxies.length];

// ZipRecruiter (offset 1)
const selectedProxy = proxies[(itemIndex + 1) % proxies.length];

// Glassdoor (offset 2)
const selectedProxy = proxies[(itemIndex + 2) % proxies.length];
```

**Rotation Pattern**:
```
Request #1:
  Indeed      → proxies[0] = ScraperAPI
  ZipRecruiter → proxies[1] = WebShare
  Glassdoor   → proxies[2] = BrightData

Request #2:
  Indeed      → proxies[0] = ScraperAPI
  ZipRecruiter → proxies[1] = WebShare
  Glassdoor   → proxies[2] = BrightData

Request #3:
  Indeed      → proxies[0] = ScraperAPI
  ZipRecruiter → proxies[1] = WebShare
  Glassdoor   → proxies[2] = BrightData
```

**Why Offsets**:
- Distributes load across proxy providers
- Prevents all platforms using same proxy
- Reduces chance of provider-specific rate limiting

### Proxy Provider Selection

**ScraperAPI**:
- Best for: Complex scraping with JavaScript rendering
- Pricing: Pay per request
- Features: Auto-retry, CAPTCHA solving

**WebShare**:
- Best for: High-volume scraping
- Pricing: Bandwidth-based
- Features: Rotating residential IPs

**Bright Data**:
- Best for: Enterprise-grade scraping
- Pricing: Bandwidth + concurrent connections
- Features: Largest proxy network, geo-targeting

---

## Data Processing Pipeline

### Stage 1: Collection
```
3 Platforms → Raw HTML/JSON
```

### Stage 2: Parsing
```
Raw Data → Structured Objects
```

### Stage 3: Normalization
```
Platform-Specific → Standardized Schema
```

### Stage 4: Merging
```
3 Arrays → 1 Combined Array
```

### Stage 5: Deduplication
```
N Jobs → U Unique Jobs (U ≤ N)
```

### Stage 6: Validation
```
U Jobs → V Valid Jobs (V ≤ U)
```

### Stage 7: Enrichment
```
V Jobs → E Enriched Jobs (E = V)
```

### Stage 8: Storage
```
E Jobs → Google Sheets
```

**Pipeline Characteristics**:
- **Lossy**: Each stage may filter items
- **Additive**: Enrichment adds data without removing items
- **Idempotent**: Re-running produces same results

---

## Error Handling Strategy

### Level 1: Request-Level Retry
**Location**: HTTP Request nodes
**Strategy**: Automatic retry with backoff

```json
{
  "retry": {
    "maxTries": 3,
    "waitBetweenTries": 2000
  },
  "timeout": 30000
}
```

### Level 2: Parse-Level Try-Catch
**Location**: Parse nodes
**Strategy**: Graceful failure with error object

```javascript
try {
  // Parsing logic
  return jobs.map(job => ({ json: job }));
} catch (error) {
  return [{ json: { error: true, platform: 'indeed', message: error.message } }];
}
```

### Level 3: Branch Isolation
**Location**: Merge node
**Strategy**: Independent branch failures

```
If Indeed fails → ZipRecruiter + Glassdoor continue
If all fail → Workflow continues with empty array
```

### Level 4: Workflow-Level Monitoring
**Location**: Error Rate Check
**Strategy**: Alert on aggregate failures

```javascript
if (errorCount > totalJobs * 0.2) {
  // Send critical alert
}
```

---

## Performance Optimization

### 1. Parallel Processing
- All 3 platforms scrape simultaneously
- Reduces total execution time by ~66%

**Sequential**: 90 seconds (3 × 30s)
**Parallel**: 30 seconds (max of 30s)

### 2. Connection Reuse
- HTTP connections maintained across retries
- Reduces TCP handshake overhead

### 3. Early Filtering
- Data quality check before enrichment
- Avoids enriching invalid data

### 4. Batch Operations
- Google Sheets upsert handles multiple rows
- Reduces API calls

### 5. Efficient Data Structures
- Set for O(1) deduplication lookup
- Array methods (map, filter) over loops

---

## Code Examples & Snippets

### Dynamic Search Parameters
```javascript
// Modify Node-002 to accept dynamic input
const searchParams = {
  jobTitle: inputData.jobTitle || 'Software Engineer',
  location: inputData.location || 'Remote',
  platforms: inputData.platforms || ['indeed', 'ziprecruiter', 'glassdoor'],
  maxResultsPerPlatform: inputData.maxResultsPerPlatform || 50,

  // New: Date range filter
  datePosted: inputData.datePosted || 7,  // Days

  // New: Salary filter
  minSalary: inputData.minSalary || 0,

  // New: Job type filter
  jobTypes: inputData.jobTypes || ['fulltime', 'contract', 'parttime']
};
```

### Advanced Deduplication with Fuzzy Matching
```javascript
// Install Levenshtein distance library
const levenshtein = require('js-levenshtein');

const items = $input.all();
const unique = [];

for (const item of items) {
  const job = item.json;

  // Check if similar job exists
  const isDuplicate = unique.some(existingItem => {
    const existing = existingItem.json;

    // Fuzzy match on title + company
    const titleSimilarity = levenshtein(
      job.title.toLowerCase(),
      existing.title.toLowerCase()
    );

    const companySimilarity = levenshtein(
      job.company.toLowerCase(),
      existing.company.toLowerCase()
    );

    // Consider duplicate if both title and company are very similar
    return titleSimilarity <= 3 && companySimilarity <= 2;
  });

  if (!isDuplicate) {
    unique.push(item);
  }
}

return unique;
```

### Webhook Trigger Instead of Schedule
```javascript
// Replace Node-001 with Webhook trigger
{
  "parameters": {
    "httpMethod": "POST",
    "path": "job-scraper",
    "responseMode": "responseNode"
  },
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2.1
}

// Trigger via HTTP POST:
// POST https://your-n8n-instance.com/webhook/job-scraper
// Body: { "jobTitle": "DevOps Engineer", "location": "Austin, TX" }
```

### Add Email Notifications
```javascript
// New node after Slack Alert
{
  "parameters": {
    "fromEmail": "noreply@yourcompany.com",
    "toEmail": "team@yourcompany.com",
    "subject": "Job Scraper Report - {{ $json.status }}",
    "emailFormat": "html",
    "html": `
      <h2>{{ $json.status }} Job Scraper Execution</h2>
      <p>Total Jobs: {{ $json.total_jobs }}</p>
      <p>New Jobs: {{ $json.new_jobs }}</p>
      <ul>
        <li>Indeed: {{ $json.indeed_count }}</li>
        <li>ZipRecruiter: {{ $json.ziprecruiter_count }}</li>
        <li>Glassdoor: {{ $json.glassdoor_count }}</li>
      </ul>
    `
  },
  "type": "n8n-nodes-base.emailSend",
  "typeVersion": 2.2
}
```

---

## Conclusion

This workflow demonstrates production-ready design patterns:
- **Resilience**: Multiple error handling layers
- **Scalability**: Parallel processing architecture
- **Observability**: Comprehensive logging and alerting
- **Maintainability**: Modular, well-documented code
- **Flexibility**: Configurable parameters and easy extension

Follow the setup guide to deploy and customize for your needs.
