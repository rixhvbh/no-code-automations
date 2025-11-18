# Multi-Platform Job Scraper - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Checklist
- [ ] n8n instance running
- [ ] At least one proxy service account (ScraperAPI, WebShare, or Bright Data)
- [ ] Google Sheets OAuth2 credentials in n8n
- [ ] Slack workspace with bot token
- [ ] Google Sheet created with "Jobs" and "Activity_Log" sheets

### Step 1: Import Workflow (1 min)
```bash
1. Open n8n
2. Click "Workflows" → "Import from File"
3. Select: multi-platform-job-scraper-workflow.json
4. Click "Import"
```

### Step 2: Quick Configuration (2 min)

#### A. Update Proxy Keys
Edit these 3 nodes and replace `YOUR_SCRAPERAPI_KEY` with your actual key:
- **Indeed - Proxy Setup** (node-004)
- **ZipRecruiter - Proxy Setup** (node-008)
- **Glassdoor - Proxy Setup** (node-012)

```javascript
// Find this line in each node:
'http://scraperapi:YOUR_SCRAPERAPI_KEY@proxy-server.scraperapi.com:8001'

// Replace with:
'http://scraperapi:abc123xyz789@proxy-server.scraperapi.com:8001'
```

#### B. Set Google Sheets ID
Get your spreadsheet ID from the URL:
```
https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
                                        ^^^^^^^^^^^^^^^^^^^^
                                        This is your ID
```

Update in 2 nodes:
- **Append to Google Sheets** (node-020)
- **Log to Activity Sheet** (node-022)

```json
"documentId": {
  "value": "1a2b3c4d5e6f7g8h9i0j",  // Paste your ID here
  "mode": "id"
}
```

#### C. Set Slack Channel
Update in 2 nodes:
- **Send Slack Alert** (node-024)
- **Send Error Alert** (node-026)

```json
"channel": "#job-scraper"  // Your channel name or ID
```

### Step 3: Test Run (2 min)
```bash
1. Click "Execute Workflow" button
2. Watch nodes execute in real-time
3. Check for green checkmarks on all nodes
4. Verify data appears in Google Sheets
5. Check Slack for notification
```

---

## 🎯 Common Use Cases

### Use Case 1: One-Time Manual Search
**Scenario**: Find "DevOps Engineer" jobs in "Seattle"

1. Modify **Search Parameters Input** (node-002):
```javascript
const searchParams = {
  jobTitle: inputData.jobTitle || 'DevOps Engineer',
  location: inputData.location || 'Seattle',
  platforms: inputData.platforms || ['indeed', 'ziprecruiter', 'glassdoor'],
  maxResultsPerPlatform: inputData.maxResultsPerPlatform || 50
};
```

2. Click "Execute Workflow"

### Use Case 2: Scheduled Daily Scraping
**Scenario**: Scrape "Product Manager" jobs every day at 9 AM

1. Update **Schedule Trigger** (node-001):
```json
{
  "cronExpression": "0 9 * * *"  // 9:00 AM daily
}
```

2. Update **Search Parameters Input**:
```javascript
jobTitle: 'Product Manager',
location: 'San Francisco',
```

3. Activate workflow (toggle switch in top-right)

### Use Case 3: Monitor Multiple Job Titles
**Scenario**: Track both "Data Scientist" and "ML Engineer" roles

**Solution**: Duplicate the workflow for each job title
1. Click workflow options → "Duplicate"
2. Rename to "Job Scraper - Data Scientist"
3. Update search parameters
4. Activate both workflows

### Use Case 4: Only Scrape Indeed
**Scenario**: Use only one platform to save on API costs

1. Update **Search Parameters Input**:
```javascript
platforms: ['indeed']  // Remove other platforms
```

---

## 📊 Understanding Your Results

### Google Sheets - Jobs Tab
| Column | Description | Example |
|--------|-------------|---------|
| ID | Unique job identifier | `indeed-123abc` |
| Title | Job title | `Senior Software Engineer` |
| Company | Company name | `Google` |
| Location | Job location | `Mountain View, CA` |
| URL | Direct link | `https://indeed.com/viewjob?jk=123` |
| Platform | Source | `Indeed` |
| Scraped At | Timestamp | `2024-11-18T12:00:00Z` |

### Google Sheets - Activity_Log Tab
| Column | What It Tells You |
|--------|-------------------|
| Total Jobs | How many jobs were scraped |
| New Jobs | Jobs not seen before |
| Indeed Count | Jobs from Indeed |
| Error Count | Failed scraping attempts |
| Status | Success or Warning |

### Slack Notification
```
✅ Multi-Platform Job Scraper Report

Status: Success
Total Jobs: 47
New Jobs: 12
Timestamp: 2024-11-18T12:00:00Z

Platform Breakdown:
• Indeed: 18
• ZipRecruiter: 15
• Glassdoor: 14

Search Query: Software Engineer
Location: Remote
```

---

## 🔧 Troubleshooting

### Problem: "HTTP Request Failed"
**Cause**: Proxy credentials are incorrect or expired

**Solution**:
1. Verify proxy API key is correct
2. Check proxy service dashboard for account status
3. Try a different proxy from the list

### Problem: "No Jobs Found"
**Cause**: Parsing regex didn't match HTML structure

**Solution**:
1. Check if job board changed their HTML
2. Use ScraperAPI's rendering feature
3. Update regex patterns in Parse nodes

### Problem: "Duplicate Jobs in Sheet"
**Cause**: Deduplication not working correctly

**Solution**:
1. Check if job IDs are being captured
2. Verify Google Sheets "matching column" is set to "id"
3. Review deduplication logic in node-017

### Problem: "Slack Alert Not Received"
**Cause**: Slack credentials or channel incorrect

**Solution**:
1. Verify Slack OAuth token is valid
2. Check channel name starts with `#`
3. Ensure bot is invited to the channel

### Problem: "Too Many Errors (>20%)"
**Cause**: Multiple scraping failures

**Solution**:
1. Check Activity Log sheet for error details
2. Verify all 3 platforms are accessible
3. Increase HTTP request timeout
4. Try different proxy provider

---

## ⚡ Performance Tips

### Tip 1: Optimize for Speed
```javascript
// Reduce results per platform
maxResultsPerPlatform: 25  // Instead of 50
```

### Tip 2: Reduce Proxy Costs
```javascript
// Scrape less frequently
cronExpression: "0 */12 * * *"  // Every 12 hours instead of 6
```

### Tip 3: Scrape Only Recent Jobs
```javascript
// Add to Indeed URL construction
const indeedUrl = `https://www.indeed.com/jobs?q=${jobTitle}&l=${location}&fromage=1`;
// fromage=1 means "posted in last 1 day"
```

### Tip 4: Focus on One Platform
```javascript
// Use only the platform with best results for your search
platforms: ['indeed']  // Comment out others
```

---

## 📈 Next Steps

### Week 1: Monitor & Optimize
- [ ] Run workflow daily
- [ ] Review Activity Log for patterns
- [ ] Adjust search parameters based on results
- [ ] Optimize proxy usage

### Week 2: Enhance Data Quality
- [ ] Enable Clearbit company enrichment
- [ ] Add salary parsing improvements
- [ ] Implement job description extraction
- [ ] Add job posting date parsing

### Week 3: Scale Up
- [ ] Add more job titles (duplicate workflow)
- [ ] Set up email digests
- [ ] Create data visualization dashboard
- [ ] Implement job application tracking

### Week 4: Automate Actions
- [ ] Auto-apply to matching jobs
- [ ] Send personalized job alerts
- [ ] Track application status
- [ ] Generate weekly reports

---

## 🆘 Need Help?

### Documentation
- **Full Setup Guide**: See `WORKFLOW-SETUP-GUIDE.md`
- **Technical Details**: See `TECHNICAL-IMPLEMENTATION.md`
- **n8n Protocols**: See `UNIVERSAL N8N WORKFLOW CREATION PROTOCOLS.txt`

### External Resources
- n8n Community: https://community.n8n.io/
- ScraperAPI Docs: https://www.scraperapi.com/documentation/
- Google Sheets API: https://developers.google.com/sheets/api
- Slack API: https://api.slack.com/

### Common Questions

**Q: How much does it cost to run?**
A: Depends on proxy service and volume. ScraperAPI free tier = 5,000 requests/month. For 50 jobs × 3 platforms × 4 runs/day = 600 requests/day = ~$30/month on paid plan.

**Q: Can I scrape LinkedIn?**
A: LinkedIn has strict anti-scraping measures. Not recommended without their official API.

**Q: How do I add more job boards?**
A: Duplicate one of the existing branches (nodes 004-007), update URLs and parsing logic.

**Q: Is this legal?**
A: Scraping public job postings for personal use is generally legal, but review each platform's Terms of Service. Always use responsibly.

**Q: How do I stop the workflow?**
A: Click the toggle switch in the top-right to deactivate. It will stop scheduled runs.

---

**Ready to start? Import the workflow and execute your first job search!** 🎉
