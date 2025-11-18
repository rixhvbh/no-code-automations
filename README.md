# No-Code Automations: n8n Workflow Collection

Production-ready n8n workflow automations following universal creation protocols for reliability, scalability, and ease of deployment.

## 📁 Repository Contents

### Workflows

#### 🔍 Multi-Platform Job Scraper with Intelligent Proxy Rotation
**File**: `multi-platform-job-scraper-workflow.json`

A comprehensive workflow that scrapes job postings from Indeed, ZipRecruiter, and Glassdoor with intelligent proxy rotation to avoid IP bans, advanced deduplication, and real-time Slack alerts.

**Key Features**:
- ✅ Multi-platform scraping (Indeed, ZipRecruiter, Glassdoor)
- ✅ Intelligent proxy rotation across 3 providers
- ✅ Advanced deduplication algorithm
- ✅ Data quality validation
- ✅ Company data enrichment (Clearbit-ready)
- ✅ Google Sheets integration with upsert
- ✅ Comprehensive activity logging
- ✅ Real-time Slack notifications
- ✅ Error rate monitoring and alerts
- ✅ Production-ready error handling

**Stats**: 26 nodes, 8 integrations, fully automated

### Documentation

#### 📚 QUICK-START.md
**Get started in 5 minutes** with step-by-step setup instructions, common use cases, and troubleshooting guide.

**Perfect for**: First-time users, quick deployment

#### 📖 WORKFLOW-SETUP-GUIDE.md
**Comprehensive setup guide** covering prerequisites, detailed installation steps, configuration, testing, and production best practices.

**Perfect for**: Production deployment, team onboarding

#### 🔧 TECHNICAL-IMPLEMENTATION.md
**Deep technical reference** with node-by-node breakdowns, algorithm explanations, code examples, and advanced customization.

**Perfect for**: Developers, advanced customization, debugging

#### 📋 UNIVERSAL N8N WORKFLOW CREATION PROTOCOLS.txt
**Standard protocols** for creating production-ready n8n workflows with best practices, design patterns, and validation checklists.

**Perfect for**: Creating new workflows, maintaining quality standards

---

## 🚀 Quick Start

### 1. Choose Your Starting Point

**Just want to try it?** → Start with [QUICK-START.md](QUICK-START.md)

**Setting up for production?** → Read [WORKFLOW-SETUP-GUIDE.md](WORKFLOW-SETUP-GUIDE.md)

**Need to customize?** → Reference [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md)

### 2. Import Workflow

```bash
1. Open your n8n instance
2. Navigate to: Workflows → Import from File
3. Select: multi-platform-job-scraper-workflow.json
4. Click Import
```

### 3. Configure (3 Required Steps)

#### A. Set Proxy Credentials
Edit nodes 004, 008, 012 and add your proxy API key:
```javascript
'http://scraperapi:YOUR_API_KEY@proxy-server.scraperapi.com:8001'
```

#### B. Set Google Sheets ID
Edit nodes 020, 022 and add your spreadsheet ID:
```json
"documentId": { "value": "YOUR_SPREADSHEET_ID", "mode": "id" }
```

#### C. Set Slack Channel
Edit nodes 024, 026 and set your channel:
```json
"channel": "#your-channel"
```

### 4. Test Run
Click **Execute Workflow** and watch it run!

---

## 📊 What You Get

### Automated Job Scraping
- **50+ jobs per platform** (configurable)
- **3 platforms simultaneously** (Indeed, ZipRecruiter, Glassdoor)
- **Automatic deduplication** (removes duplicate postings)
- **Quality filtering** (removes incomplete records)

### Data Storage
- **Google Sheets integration** with automatic upsert
- **Clean, structured data** ready for analysis
- **Activity logging** for tracking and debugging

### Notifications
- **Slack alerts** with rich formatting and metrics
- **Error monitoring** with automatic alerts at 20% threshold
- **Detailed execution reports** with platform breakdowns

### Example Output (Google Sheets)

**Jobs Sheet**:
| ID | Title | Company | Location | URL | Platform | Scraped At |
|----|-------|---------|----------|-----|----------|------------|
| indeed-123 | Software Engineer | Google | Remote | https://... | Indeed | 2024-11-18 |
| zip-456 | DevOps Engineer | Amazon | Seattle | https://... | ZipRecruiter | 2024-11-18 |

**Activity Log Sheet**:
| Timestamp | Status | Total Jobs | Indeed | ZipRecruiter | Glassdoor | Errors |
|-----------|--------|------------|--------|--------------|-----------|---------|
| 2024-11-18 12:00 | Success | 47 | 18 | 15 | 14 | 2 |

**Slack Notification**:
```
✅ Multi-Platform Job Scraper Report

Status: Success
Total Jobs: 47
New Jobs: 12

Platform Breakdown:
• Indeed: 18
• ZipRecruiter: 15
• Glassdoor: 14
```

---

## 🏗️ Architecture Overview

```
Schedule Trigger → Search Config → Platform Router
                                        ↓
                ┌───────────────────────┼───────────────────────┐
                ↓                       ↓                       ↓
         [Indeed Branch]        [ZipRecruiter Branch]   [Glassdoor Branch]
         Proxy → HTTP →         Proxy → HTTP →          Proxy → HTTP →
         Parse → Normalize      Parse → Normalize       Parse → Normalize
                ↓                       ↓                       ↓
                └───────────────────────┼───────────────────────┘
                                        ↓
                                  Merge Results
                                        ↓
                                  Deduplication
                                        ↓
                                 Quality Check
                                        ↓
                               Company Enrichment
                                        ↓
                                Google Sheets Save
                                        ↓
                                 Activity Logging
                                        ↓
                                  Slack Alert
                                        ↓
                                Error Monitoring
```

**Design Principles**:
- **Parallel Processing**: All platforms scrape simultaneously
- **Fault Isolation**: Individual platform failures don't affect others
- **Graceful Degradation**: Workflow completes even with partial failures
- **Comprehensive Logging**: Track every execution for debugging
- **Production-Ready**: Error handling, retries, monitoring included

---

## 🛠️ Prerequisites

### Required
- ✅ n8n instance (v1.0+)
- ✅ Google account (for Google Sheets)
- ✅ Slack workspace (for notifications)
- ✅ Proxy service account (ScraperAPI, WebShare, or Bright Data)

### Optional
- ⭐ Clearbit API (for company enrichment)
- ⭐ Email SMTP (for email notifications)

### Estimated Costs
- **n8n**: Free (self-hosted) or $20/month (cloud)
- **Proxy Service**: $30-100/month depending on volume
- **Google Sheets**: Free
- **Slack**: Free
- **Clearbit**: $99+/month (optional)

**Total**: ~$50-150/month for production use

---

## 📈 Use Cases

### Job Seekers
- Monitor job postings across multiple platforms
- Get daily alerts for new matching positions
- Track application opportunities

### Recruiters
- Source candidates from public job boards
- Monitor competitor job postings
- Analyze hiring trends and salary data

### Market Research
- Track job market trends
- Analyze skill demand across industries
- Monitor company hiring patterns

### Developers
- Learn n8n workflow design patterns
- Study web scraping best practices
- Customize for specific needs

---

## 🔒 Legal & Ethical Considerations

### ✅ Responsible Use
- **Personal/Business Use**: Scraping public job postings for personal job search or business recruiting
- **Respect Rate Limits**: Built-in delays and proxy rotation
- **Data Privacy**: Only collect publicly available information
- **Attribution**: Preserve source URLs and platform information

### ⚠️ Important Notes
- Review each platform's Terms of Service
- Use proxies to respect rate limiting
- Don't scrape private/authenticated data
- Comply with applicable laws (CFAA, GDPR, etc.)

### 📋 Best Practices
1. **Use proxies** to avoid IP bans
2. **Implement delays** between requests
3. **Respect robots.txt** guidelines
4. **Store data securely** with proper access controls
5. **Update regularly** to maintain compatibility

---

## 🤝 Contributing

### Adding New Job Boards
1. Duplicate an existing scraper branch (nodes 004-007)
2. Update URL construction logic
3. Modify HTML/JSON parsing regex
4. Add to platform list in search parameters
5. Update documentation

### Improving Parsing Logic
1. Test against current job board HTML
2. Update regex patterns or switch to Cheerio
3. Add error handling for edge cases
4. Document changes in commit message

### Reporting Issues
- Check existing Activity Log for error patterns
- Review node execution logs
- Include workflow configuration (with credentials removed)
- Describe expected vs actual behavior

---

## 📚 Learn More

### n8n Resources
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [n8n YouTube Channel](https://www.youtube.com/c/n8n-io)

### Web Scraping
- [ScraperAPI Documentation](https://www.scraperapi.com/documentation/)
- [Web Scraping Best Practices](https://www.scraperapi.com/blog/web-scraping-best-practices/)

### APIs
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Slack API](https://api.slack.com/)
- [Clearbit API](https://clearbit.com/docs)

---

## 🆘 Support

### Documentation Files
- **Quick Start**: [QUICK-START.md](QUICK-START.md) - Get running in 5 minutes
- **Setup Guide**: [WORKFLOW-SETUP-GUIDE.md](WORKFLOW-SETUP-GUIDE.md) - Complete installation
- **Technical Docs**: [TECHNICAL-IMPLEMENTATION.md](TECHNICAL-IMPLEMENTATION.md) - Deep dive
- **Protocols**: [UNIVERSAL N8N WORKFLOW CREATION PROTOCOLS.txt](UNIVERSAL%20N8N%20WORKFLOW%20CREATION%20PROTOCOLS.txt) - Standards

### Getting Help
1. **Search documentation** using Ctrl+F in the docs above
2. **Check Activity Log** in Google Sheets for error details
3. **Review n8n execution logs** for specific node failures
4. **Consult n8n community** for platform-specific issues

---

## 📝 Changelog

### Version 1.0.0 (2024-11-18)
#### Initial Release
- ✅ Multi-platform job scraper (Indeed, ZipRecruiter, Glassdoor)
- ✅ Intelligent proxy rotation (3 providers)
- ✅ Advanced deduplication algorithm
- ✅ Google Sheets integration with upsert
- ✅ Slack notifications with rich formatting
- ✅ Error rate monitoring and alerts
- ✅ Comprehensive activity logging
- ✅ Production-ready error handling
- ✅ Complete documentation suite

#### Included Files
- `multi-platform-job-scraper-workflow.json` - Main workflow
- `QUICK-START.md` - 5-minute setup guide
- `WORKFLOW-SETUP-GUIDE.md` - Complete setup documentation
- `TECHNICAL-IMPLEMENTATION.md` - Technical reference
- `UNIVERSAL N8N WORKFLOW CREATION PROTOCOLS.txt` - Standards
- `README.md` - This file

---

## 🌟 Future Enhancements

### Planned Features
- [ ] Additional job boards (LinkedIn, Monster, CareerBuilder)
- [ ] Advanced filtering (salary range, job type, remote only)
- [ ] Email digest notifications
- [ ] Job application tracking
- [ ] Salary data visualization
- [ ] Skills extraction from job descriptions
- [ ] Automatic job application submission
- [ ] Interview scheduling integration

### Community Requests
- Want a feature? Open an issue with your use case
- Have an improvement? Submit a pull request
- Found a bug? Report it with reproduction steps

---

## 📜 License

This workflow is provided as-is for educational and commercial use.

**Important**: Always comply with:
- Job board Terms of Service
- Applicable laws (CFAA, GDPR, CCPA, etc.)
- Ethical web scraping guidelines
- Rate limiting and access restrictions

**Disclaimer**: Users are responsible for ensuring their use complies with all applicable laws and terms of service.

---

## 🙏 Acknowledgments

- **n8n Team** for the amazing automation platform
- **ScraperAPI** for reliable proxy infrastructure
- **Job Boards** for providing public job posting data
- **Open Source Community** for tools and libraries

---

## 📬 Contact

For questions about this workflow:
- Review documentation files first
- Check n8n community forum
- Consult setup guides and troubleshooting sections

---

**Built with ❤️ using n8n and Universal Workflow Creation Protocols**

**Version**: 1.0.0
**Last Updated**: 2024-11-18
**Compatibility**: n8n v1.0+
