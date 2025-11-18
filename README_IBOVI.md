# IBOVI Candidate Acquisition System

> Multi-layer candidate data acquisition, enrichment, and delivery platform built on n8n orchestration

[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-18%2B-green.svg)](https://nodejs.org)
[![n8n](https://img.shields.io/badge/n8n-1.0%2B-orange.svg)](https://n8n.io)

## 🎯 Overview

The IBOVI system is a comprehensive, automated platform for acquiring, processing, verifying, and delivering candidate data from multiple job boards and professional networks. It combines web scraping, data enrichment, email verification, and intelligent delivery mechanisms to provide high-quality candidate leads.

### Key Features

✅ **Multi-Platform Scraping** - Indeed (US/UK/CA), LinkedIn, ZipRecruiter, Glassdoor
✅ **Anti-Detection** - Proxy rotation, CAPTCHA solving, rate limiting
✅ **Data Processing** - Deduplication, normalization, quality scoring
✅ **Company Enrichment** - Apollo.io, Clearbit, Hunter.io integration
✅ **Email Verification** - ZeroBounce, NeverBounce, Hunter.io
✅ **Smart Delivery** - Google Sheets, ATS integration, Slack notifications
✅ **Monitoring** - Sentry error tracking, cost controls, performance metrics
✅ **n8n Orchestration** - Automated workflows, cron scheduling

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    n8n ORCHESTRATION LAYER                   │
│         (Cron Triggers, Webhooks, Workflow Management)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  LAYER 1: SCRAPE │    │  LAYER 5: MONITOR│
│  - Indeed        │    │  - Sentry        │
│  - LinkedIn      │    │  - DataDog       │
│  - ZipRecruiter  │    │  - Cost Tracking │
│  - Glassdoor     │    │  - Metrics       │
└────────┬─────────┘    └──────────────────┘
         │
         ▼
┌──────────────────┐
│  LAYER 2: PROCESS│
│  - Deduplicate   │
│  - Normalize     │
│  - Enrich        │
│  - Score Quality │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  LAYER 3: VERIFY │
│  - Email Verify  │
│  - Phone Verify  │
│  - LinkedIn Enr. │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  LAYER 4: DELIVER│
│  - PostgreSQL    │
│  - Google Sheets │
│  - ATS (Bullhorn)│
│  - Slack Alerts  │
└──────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- n8n 1.0+
- API keys (see API Requirements below)

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd no-code-automations

# Install dependencies
npm install

# Set up environment
cp .env.example .env
nano .env  # Add your API keys

# Initialize database
psql -U postgres -f src/config/database.sql

# Create logs directory
mkdir -p logs
```

### 3. Configuration

Edit `.env` with your credentials:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ibovi_candidates

# API Keys
APOLLO_API_KEY=your_apollo_key
HUNTER_API_KEY=your_hunter_key
ZEROBOUNCE_API_KEY=your_zerobounce_key

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 4. Start Services

```bash
# Development mode
npm run dev

# Production mode (with PM2)
pm2 start src/index.js --name ibovi-system
pm2 save
```

### 5. Import n8n Workflows

1. Open n8n at http://localhost:5678
2. Import `n8n-workflows/master-orchestrator.json`
3. Configure webhook URLs to point to your application
4. Activate workflow

---

## 📦 Project Structure

```
no-code-automations/
├── src/
│   ├── config/
│   │   ├── config.js              # Central configuration
│   │   └── database.sql           # PostgreSQL schema
│   ├── scrapers/
│   │   ├── base-scraper.js        # Base scraper class
│   │   ├── indeed-scraper.js      # Indeed scraper
│   │   └── linkedin-scraper.js    # LinkedIn scraper
│   ├── processors/
│   │   └── data-processor.js      # Data processing pipeline
│   ├── verification/
│   │   └── email-verifier.js      # Email verification service
│   ├── enrichment/
│   │   └── company-enricher.js    # Company enrichment service
│   ├── storage/
│   │   ├── database.js            # PostgreSQL operations
│   │   └── google-sheets.js       # Google Sheets sync
│   └── utils/
│       ├── logger.js              # Winston logger
│       ├── proxy-manager.js       # Proxy rotation
│       └── rate-limiter.js        # API rate limiting
├── n8n-workflows/
│   └── master-orchestrator.json   # Main n8n workflow
├── logs/                          # Application logs
├── .env.example                   # Environment template
├── package.json                   # Dependencies
├── IBOVI_SYSTEM_ARCHITECTURE.md   # Architecture details
├── DEPLOYMENT_GUIDE.md            # Deployment instructions
└── README_IBOVI.md                # This file
```

---

## 🔧 API Requirements

### Required APIs:

| Service | Purpose | Free Tier | Cost/Month |
|---------|---------|-----------|------------|
| **BrightData** | Proxy rotation | No | $500+ |
| **2Captcha** | CAPTCHA solving | Yes | $10-50 |
| **Apollo.io** | Company data | 100 req/day | Free-$99 |
| **Hunter.io** | Email verification | 50 req/month | Free-$49 |
| **ZeroBounce** | Email verification | 100 credits | $16+ |
| **Twilio** | Phone validation | $15 credit | Pay-as-you-go |
| **Google Cloud** | Sheets API | Yes | Free |
| **Slack** | Notifications | Yes | Free |

### Optional APIs:

- **Clearbit** - Enhanced company data ($99+/mo)
- **Proxycurl** - LinkedIn enrichment ($79+/mo)
- **RocketReach** - Contact discovery ($49+/mo)

---

## 📖 Usage

### Trigger Scraping Job

```bash
# Via n8n webhook
curl -X POST http://localhost:5678/webhook/ibovi/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["indeed_us", "linkedin"],
    "searchQuery": "software engineer",
    "location": "Remote",
    "maxResults": 200,
    "minQualityScore": 70,
    "enableVerification": true,
    "enableEnrichment": true
  }'
```

### Run Individual Components

```bash
# Test scraper
npm run scrape:indeed

# Test processor
npm run process

# Test verification
npm run verify

# View monitoring dashboard
npm run monitor
```

### Query Database

```sql
-- Get high-quality candidates
SELECT * FROM high_quality_candidates LIMIT 100;

-- Daily statistics
SELECT * FROM daily_scraping_stats
WHERE date >= CURRENT_DATE - 7;

-- API costs
SELECT * FROM daily_api_costs
WHERE date = CURRENT_DATE;
```

---

## 🎯 Features

### Layer 1: Data Acquisition

- **Multi-platform scraping** (Indeed, LinkedIn, ZipRecruiter)
- **Proxy rotation** (BrightData, Oxylabs, SmartProxy)
- **CAPTCHA solving** (2Captcha, Anti-Captcha)
- **Rate limiting** & human-like behavior
- **Retry logic** with exponential backoff

### Layer 2: Data Processing

- **Deduplication** (email, phone, LinkedIn URL, fuzzy name matching)
- **Normalization** (names, emails, phones, locations)
- **Company enrichment** (domain extraction, Apollo.io data)
- **Quality scoring** (0-100 completeness score)

### Layer 3: Verification & Enrichment

- **Email verification** (ZeroBounce, NeverBounce, Hunter.io)
- **Email pattern generation** (firstName.lastName@domain.com)
- **LinkedIn enrichment** (Proxycurl API)
- **Phone validation** (Twilio Lookup)
- **Deliverability scoring**

### Layer 4: Storage & Delivery

- **PostgreSQL storage** (structured candidate data)
- **Google Sheets sync** (real-time client dashboard)
- **ATS integration** (Bullhorn, Greenhouse, Lever)
- **Slack notifications** (new candidate alerts)
- **CSV/JSON exports**

### Layer 5: Orchestration & Monitoring

- **n8n workflows** (cron triggers, webhook endpoints)
- **Error tracking** (Sentry integration)
- **Performance monitoring** (success rates, API costs)
- **Retry queues** (automatic retry for failures)
- **Daily reports** (metrics dashboard)

---

## 📊 Performance Metrics

### Target KPIs:

- **Scrape Success Rate:** 95%+
- **Email Deliverability:** 85%+
- **Data Completeness:** 90%+ profiles with email
- **Processing Speed:** <5 min per 1000 candidates
- **API Cost per Candidate:** <$0.10
- **System Uptime:** 99.5%+

---

## 🔐 Security

- **API Key Management:** Environment variables only
- **Data Encryption:** PII encrypted at rest and in transit
- **Rate Limiting:** Per-service rate limits
- **Access Control:** Role-based Google Sheets access
- **Audit Logging:** All data access tracked

---

## 💰 Cost Estimation

### Monthly Operating Costs:

| Component | Low Volume | High Volume |
|-----------|------------|-------------|
| **Proxies** | $100 | $500 |
| **CAPTCHA** | $10 | $50 |
| **Apollo.io** | Free | $99 |
| **Hunter.io** | $49 | $149 |
| **ZeroBounce** | $16 | $80 |
| **Twilio** | $10 | $50 |
| **Infrastructure** | $50 | $200 |
| **TOTAL** | **$235/mo** | **$1,128/mo** |

**Cost per Candidate:** $0.05 - $0.15 (depending on volume)

---

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Adding New Scraper

1. Create new scraper in `src/scrapers/`
2. Extend `BaseScraper` class
3. Implement `scrape()` and `extractCandidateData()` methods
4. Add to workflow configuration

---

## 📚 Documentation

- **[System Architecture](IBOVI_SYSTEM_ARCHITECTURE.md)** - Detailed architecture overview
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment
- **[API Documentation](API_DOCUMENTATION.md)** - API endpoints and usage
- **[n8n Workflows](n8n-workflows/)** - Workflow templates

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🆘 Support

For issues or questions:

1. Check logs: `tail -f logs/error.log`
2. Review n8n execution logs
3. Verify API quota limits
4. Check environment variables

---

## 🎉 Acknowledgments

- **n8n** - Workflow automation platform
- **Puppeteer** - Headless browser automation
- **PostgreSQL** - Reliable database
- **All API providers** - Data enrichment and verification

---

**Built for IBOVI with ❤️**

*Last Updated: January 2025*
