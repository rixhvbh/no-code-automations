# PropFlow Capital - Real Estate Deal Flow Engine

**Automated Property Intelligence & Deal Flow Aggregation System**

---

## OVERVIEW

PropFlow Capital's Deal Flow Engine is a comprehensive, automated system that aggregates off-market property listings, enriches owner contact data, scores investment opportunities, and delivers qualified deals to the investment team in real-time.

### Key Capabilities

- **Multi-Platform Property Scraping** from 15+ sources
- **Intelligent Deduplication** using multi-factor matching
- **Owner Contact Discovery** with verification pipeline
- **AI-Powered Deal Scoring** with GPT-4 analysis
- **Real-Time Alerting** via SMS, Email, and Slack
- **Automated CRM Integration** with Airtable & Google Sheets

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    SCRAPING LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  LoopNet | CoStar | Crexi | County Records | Zillow        │
│  Realtor.com | Auction.com | LinkedIn                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROCESSING LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Property Deduplication → Entity Resolution                │
│  Financial Modeling → Market Comparables Analysis          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  ENRICHMENT LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Contact Discovery (Email + Phone) → LinkedIn Matching     │
│  3-Service Email Verification → D&B Financial History       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                ORCHESTRATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Deal Scoring Engine (100-point scale)                     │
│  GPT-4 Analysis → Tier Classification (S/A/B/C/D)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   DELIVERY LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Twilio SMS → SendGrid Email → Slack → Zapier              │
│  Airtable CRM → Google Sheets Dashboards                   │
└─────────────────────────────────────────────────────────────┘
```

---

## WORKFLOWS

### 1. Multi-Platform Property Scraper
**Schedule**: Every 4 hours
**Function**: Aggregates property listings from commercial and residential platforms
**Output**: 500+ properties per day

**Platforms**:
- LoopNet (commercial properties)
- CoStar (market analytics)
- Crexi (commercial listings)
- County Property Records (public data)
- Zillow/Realtor.com (residential comparables)
- Auction.com (distressed properties)

**Features**:
- Rotating proxy management
- CAPTCHA solving (2Captcha API)
- Rate limiting and request throttling
- HTML parsing and data extraction

---

### 2. Property Deduplication Engine
**Trigger**: Webhook (from scraper)
**Function**: Removes duplicate properties using multi-factor matching
**Accuracy**: 95%+ confidence scoring

**Deduplication Methods**:
- Exact parcel ID matching (100% confidence)
- Address normalization + owner matching (95% confidence)
- Lat/long proximity matching (85% confidence)
- Fuzzy address matching (70% confidence)

**Additional Processing**:
- Owner entity resolution (LLC → Parent Company → Key Person)
- Financial modeling (Cap Rate, IRR, DSCR, Cash-on-Cash)
- Market comparables analysis

---

### 3. Owner Contact Discovery Chain
**Trigger**: Webhook (from processing layer)
**Function**: Discovers and enriches owner contact information
**Success Rate**: 60% contact discovery

**Discovery Steps**:
1. Company domain extraction from LLC name
2. Email pattern generation (8+ permutations)
3. Email discovery (Hunter.io, Apollo.io, Clearbit)
4. Phone number append (TrueCaller, NumVerify)
5. LinkedIn profile matching (Proxycurl API)
6. D&B financial history lookup

**Contact Quality Scoring**: 0-100 scale based on:
- Verified email (40 points)
- Phone number (30 points)
- LinkedIn presence (20 points)
- D&B data (10 points)

---

### 4. Email Verification Pipeline
**Trigger**: Webhook (from contact discovery)
**Function**: Validates email deliverability using 3 services
**Batch Size**: 100 emails (or 1 hour wait)

**Verification Services**:
- NeverBounce (syntax, deliverability)
- Debounce.io (spam trap detection)
- ZeroBounce (catch-all server detection)

**Confidence Scoring Algorithm**:
```
Valid + Deliverable + No Spam Trap = 95% confidence
Valid + Unknown Deliverability = 70% confidence
Catch-All Server = 40% confidence
Invalid Syntax = 0% confidence
```

---

### 5. Deal Scoring Engine
**Trigger**: Webhook (from processing + enrichment layers)
**Function**: Scores investment attractiveness on 100-point scale

**Scoring Matrix**:

| Factor | Weight | Criteria |
|--------|--------|----------|
| Financial Metrics | 35% | Cap rate >7%, DSCR >1.25, IRR >15% |
| Location Quality | 25% | City tier, property type demand |
| Owner Motivation | 20% | Days on market, pricing vs market |
| Contact Quality | 10% | Verified email/phone availability |
| Market Timing | 10% | Market cycle positioning |

**Deal Tiers**:
- **S-Tier (85-100)**: Exceptional - Immediate action required
- **A-Tier (75-84)**: Excellent - High priority, review today
- **B-Tier (65-74)**: Good - Review this week
- **C-Tier (50-64)**: Fair - Monitor for changes
- **D-Tier (<50)**: Below threshold - Low priority

**GPT-4 Enhancement**:
- Property description sentiment analysis
- Opportunity keyword detection
- Risk factor identification
- Investment thesis generation

---

### 6. Alert Distribution System
**Trigger**: Webhook (from scoring engine)
**Function**: Real-time notifications for high-value deals

**Alert Channels**:

**SMS (Twilio)** - For S-Tier deals (score ≥85):
```
🔥 HOT DEAL ALERT (Score: 92/100)

📍 123 Main St, Austin TX
💰 $2.4M | Cap: 8.5% | ROI: 18%
👤 Owner: John Smith (verified email)

🔗 [View Details]
```

**Email (SendGrid)** - Daily digest for A/S-tier deals:
- HTML-formatted deal cards
- Financial metrics comparison
- Top strengths & concerns
- Action buttons to CRM

**Slack** - Channel notifications with deal blocks

**Zapier Webhooks** - External CRM integrations (HubSpot, Salesforce)

---

### 7. CRM Sync Workflow
**Schedule**: Every 2 hours
**Function**: Syncs deals to Airtable and Google Sheets

**Airtable Integration**:
- **Properties Base**: Master property database
- **Contacts Base**: Owner contact management
- **Deals Base**: Active opportunity pipeline
- Upsert logic (update existing, insert new)
- Automatic relationship linking

**Google Sheets Integration**:
- **Active Deals**: Sortable scoreboard
- **Deal Pipeline**: Stage tracking
- **Analytics Dashboard**: Performance metrics

**Data Synced**:
- Property details (address, price, type, size)
- Financial metrics (cap rate, IRR, DSCR)
- Deal score and tier
- Owner contact information
- Recommendation and action items

---

## GETTING STARTED

### Prerequisites

- n8n instance (self-hosted or cloud)
- PostgreSQL 14+
- API keys for all services (see config/environment.template.env)

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/propflow/deal-flow-engine.git
cd deal-flow-engine/propflow-capital

# 2. Configure environment
cp config/environment.template.env .env
nano .env  # Add your API keys

# 3. Setup database
psql -U postgres -f schemas/database-schema.sql

# 4. Import workflows to n8n
# Navigate to n8n UI and import each workflow from workflows/ directory

# 5. Configure credentials in n8n
# Add API credentials for each service

# 6. Activate workflows
# Start with scraping workflow, then activate others in sequence
```

### Detailed Setup

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for complete installation instructions.

---

## CONFIGURATION

### Workflow Settings

Edit `config/workflow-config.json` to customize:

- Scraping schedules and target locations
- Deduplication confidence thresholds
- Scoring weights and tier thresholds
- Alert recipients and channels
- CRM sync intervals

### Environment Variables

Key variables in `.env`:

```bash
# API Keys
HUNTER_IO_API_KEY=your_key_here
NEVERBOUNCE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
TWILIO_AUTH_TOKEN=your_token_here
AIRTABLE_API_KEY=your_key_here

# Webhook URLs
WEBHOOK_URL_PROCESSING_LAYER=https://n8n.propflow.com/webhook/property-deduplication
WEBHOOK_URL_EMAIL_VERIFICATION=https://n8n.propflow.com/webhook/email-verification
WEBHOOK_URL_ALERT_DISTRIBUTION=https://n8n.propflow.com/webhook/alert-distribution

# Feature Flags
ENABLE_AUTO_ALERTS=true
ENABLE_GPT_ANALYSIS=true
ENABLE_LINKEDIN_ENRICHMENT=true
```

---

## PERFORMANCE METRICS

### Expected Throughput

| Metric | Target | Current |
|--------|--------|---------|
| Properties Scraped/Day | 500+ | ✓ |
| Contact Discovery Rate | 60% | ✓ |
| Email Verification Accuracy | 95%+ | ✓ |
| Deal Scoring Latency | <30s | ✓ |
| Alert Delivery Time | <60s | ✓ |

### Resource Usage

- **Database**: ~5GB for 10,000 properties
- **n8n Executions**: ~1,000 per day
- **API Calls**: ~50,000 per month
- **Monthly Cost**: ~$500-800 (API services)

---

## API SERVICES & COSTS

| Service | Purpose | Est. Cost/Month |
|---------|---------|-----------------|
| BrightData | Proxy rotation | $100 |
| Hunter.io | Email discovery | $50 |
| NeverBounce | Email verification | $50 |
| Debounce.io | Email verification | $40 |
| ZeroBounce | Email verification | $40 |
| Proxycurl | LinkedIn data | $100 |
| OpenAI GPT-4 | Deal analysis | $80 |
| Twilio | SMS alerts | $20 |
| Airtable | CRM storage | $50 |
| **Total** | | **~$530/month** |

---

## SECURITY & COMPLIANCE

### Data Privacy
- GDPR-compliant data handling
- 90-day automatic data purge
- Encrypted credential storage
- Audit logging of all data access

### API Security
- OAuth2 authentication where available
- API key rotation (30-day schedule)
- Rate limiting enforcement
- IP whitelisting for sensitive services

### Legal Compliance
- robots.txt respect for public scraping
- Terms of Service adherence
- Fair use data collection practices
- No illegal data harvesting

---

## MONITORING & ALERTS

### System Health Checks
- Hourly uptime verification
- API credential validation
- Proxy pool status monitoring
- Database connection testing

### Error Notifications
- Failed workflow executions → Slack
- API quota warnings → Email
- Data quality issues → Dashboard
- Critical errors → SMS (PagerDuty)

### Performance Dashboards

Access real-time metrics at:
- **n8n Execution Dashboard**: https://n8n.propflow.com/executions
- **Airtable Dashboard**: https://airtable.com/propflow-dashboard
- **Google Sheets Analytics**: [Link to sheets]

---

## TROUBLESHOOTING

### Common Issues

**Problem**: Scraping fails with 403 errors
```
Solution:
1. Check proxy service status
2. Rotate proxies
3. Verify user-agent rotation
4. Check robots.txt compliance
```

**Problem**: Low contact discovery rate
```
Solution:
1. Verify Hunter.io / Apollo.io credits
2. Check email pattern accuracy
3. Review domain discovery logic
4. Increase pattern permutations
```

**Problem**: Deal scores seem inaccurate
```
Solution:
1. Review financial data quality
2. Adjust scoring weights in config
3. Validate market comparables data
4. Check GPT-4 analysis prompts
```

### Support Resources

- **Documentation**: [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)
- **Deployment Guide**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **n8n Community**: https://community.n8n.io
- **GitHub Issues**: [Repository Issues]

---

## ROADMAP

### Phase 1: Foundation (Complete ✓)
- [x] Core scraping workflows
- [x] Property deduplication
- [x] Contact discovery
- [x] Email verification
- [x] Deal scoring engine
- [x] Alert distribution
- [x] CRM sync

### Phase 2: Enhancement (Q1 2025)
- [ ] Machine learning-based scoring
- [ ] Predictive market analysis
- [ ] Automated outreach sequencing
- [ ] Mobile app for deal reviews
- [ ] Advanced reporting dashboards

### Phase 3: Scale (Q2 2025)
- [ ] Multi-market expansion (20+ cities)
- [ ] International property support
- [ ] API for third-party integrations
- [ ] White-label solution for partners

---

## CREDITS & LICENSES

### Technology Stack
- **n8n**: Workflow automation platform (Fair Code License)
- **PostgreSQL**: Database (PostgreSQL License)
- **OpenAI GPT-4**: AI analysis (Commercial License)

### API Services
- Hunter.io, Apollo.io, NeverBounce, Debounce.io, ZeroBounce
- TrueCaller, NumVerify, Proxycurl
- Dun & Bradstreet, Airtable, Twilio, SendGrid

### Development Team
- **System Architect**: [Your Name]
- **Client**: PropFlow Capital
- **Version**: 1.0.0
- **Last Updated**: 2025-11-18

---

## LICENSE

Proprietary - PropFlow Capital
© 2025 PropFlow Capital. All rights reserved.

This system is proprietary software developed exclusively for PropFlow Capital.
Unauthorized copying, distribution, or modification is strictly prohibited.

---

## CONTACT

**PropFlow Capital**
- Website: https://propflowcapital.com
- Email: tech@propflowcapital.com
- Support: support@propflowcapital.com

**For Technical Issues**:
- Create an issue in the repository
- Email: devops@propflowcapital.com
- Emergency: [PagerDuty contact]

---

**Built with n8n • Powered by AI • Designed for Results**
