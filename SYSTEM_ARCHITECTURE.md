# Medical Device Competitive Intelligence Platform
## System Architecture Documentation

### Overview
A comprehensive competitive intelligence platform for tracking 500+ medical technology companies across multiple data sources including FDA approvals, clinical trials, funding rounds, and M&A activity.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCRAPING LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  FDA.gov              │  ClinicalTrials.gov  │  Crunchbase      │
│  (Puppeteer)          │  (API + Scraper)     │  (API)           │
│                       │                       │                   │
│  PubMed               │  Company Websites    │  RSS Feeds       │
│  (NCBI API)           │  (Web Scraper)       │  (Feed Parser)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA PROCESSING LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  • Entity Extraction (GPT-4)                                    │
│  • Temporal Analysis (Time-series aggregation)                  │
│  • Competitive Clustering (ML similarity algorithms)            │
│  • Sentiment Analysis (NLP on publications/trials)              │
│  • Anomaly Detection (Statistical outlier identification)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ENRICHMENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Apollo.io/Clearbit   │  RocketReach/Hunter  │  Google Patents  │
│  (Company Metadata)   │  (Executive Contacts)│  (Patent Data)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE & DELIVERY LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database  │  Retool Dashboard    │  REST API        │
│  (Time-series data)   │  (Analytics UI)      │  (Integration)   │
│                       │                       │                   │
│  PDF Reports          │  Slack Alerts        │  Email Digests   │
│  (Weekly)             │  (Real-time)         │  (Daily)         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Automation Platform
- **n8n**: Workflow orchestration and automation
- **Node.js**: Runtime environment for custom functions
- **Puppeteer**: Headless browser for dynamic content scraping

### Data Storage
- **PostgreSQL 15+**: Primary database with TimescaleDB extension
  - Time-series optimization for event tracking
  - Full-text search for content indexing
  - JSONB columns for flexible schema

### External Services
- **OpenAI GPT-4**: Entity extraction, sentiment analysis, report generation
- **Various APIs**: FDA, ClinicalTrials.gov, Crunchbase, PubMed
- **Enrichment Services**: Apollo.io, Clearbit, RocketReach, Hunter.io

### Delivery & Monitoring
- **Retool**: Client-facing analytics dashboard
- **Slack**: Real-time alerts and notifications
- **SendGrid/SMTP**: Email delivery for reports
- **REST API**: Custom endpoints for data access

---

## n8n Workflows

### 1. FDA Scraper Workflow
**Schedule**: Daily at 6:00 AM UTC
**Function**: Scrape FDA.gov for 510(k) approvals and PMA submissions
**Nodes**:
- Cron Trigger
- HTTP Request (Puppeteer Cloud Service or self-hosted)
- Function: Parse HTML and extract device data
- Function: Entity extraction (company names, device types)
- PostgreSQL: Insert new approvals
- IF: Check for high-priority approvals
- Slack: Send alerts for critical submissions

### 2. Clinical Trial Monitor Workflow
**Schedule**: Every 6 hours
**Function**: Monitor ClinicalTrials.gov for new registrations and updates
**Nodes**:
- Schedule Trigger
- HTTP Request: ClinicalTrials.gov API
- Function: Process XML/JSON response
- Function: Change detection (compare with last run)
- PostgreSQL: Update trial records
- Function: Identify significant changes (status changes, enrollment milestones)
- Slack: Alert on trial failures or completions

### 3. Crunchbase Funding Monitor
**Schedule**: Daily at 8:00 AM UTC
**Function**: Track funding rounds, M&A, and company updates
**Nodes**:
- Cron Trigger
- HTTP Request: Crunchbase API (with API key)
- Function: Parse funding data
- Function: Calculate funding velocity and trends
- PostgreSQL: Update company funding records
- Function: Detect anomalies (large rounds, acquisitions)
- Slack: Alert on significant events

### 4. PubMed Research Monitor
**Schedule**: Daily at 10:00 AM UTC
**Function**: Track research publications from target companies
**Nodes**:
- Cron Trigger
- HTTP Request: NCBI E-utilities API
- Function: Parse PubMed XML
- OpenAI: Extract key findings and sentiment
- PostgreSQL: Store publication metadata
- Function: Link publications to companies/devices
- Slack: Alert on breakthrough research

### 5. Company Website Monitor
**Schedule**: Every 12 hours
**Function**: Monitor RSS feeds and press releases from 500+ companies
**Nodes**:
- Schedule Trigger
- HTTP Request: Fetch RSS feeds (batch of 50)
- Function: Parse RSS/Atom feeds
- Function: Content extraction and deduplication
- OpenAI: Categorize and summarize press releases
- PostgreSQL: Store press release data
- Slack: Alert on major announcements

### 6. Company Enrichment Pipeline
**Trigger**: New company added to database
**Function**: Enrich company profiles with metadata and contacts
**Nodes**:
- Webhook Trigger (or Database Trigger)
- HTTP Request: Apollo.io API (company metadata)
- HTTP Request: Hunter.io (email patterns)
- HTTP Request: RocketReach (executive contacts)
- HTTP Request: Clearbit (firmographics)
- Function: Merge and deduplicate data
- PostgreSQL: Update company enrichment table

### 7. Report Generation Workflow
**Schedule**: Weekly on Monday at 9:00 AM UTC
**Function**: Generate comprehensive PDF reports with analytics
**Nodes**:
- Cron Trigger
- PostgreSQL: Query last 7 days of data
- Function: Aggregate statistics and trends
- OpenAI: Generate executive summary
- Function: Create data visualizations (Chart.js or similar)
- HTTP Request: HTML to PDF service (e.g., Gotenberg, PDFShift)
- Google Drive: Upload PDF
- Email: Send report to client
- PostgreSQL: Log report generation

### 8. Slack Alert System
**Trigger**: Event-driven (called by other workflows)
**Function**: Centralized alert routing and formatting
**Nodes**:
- Webhook Trigger
- Function: Alert classification and priority scoring
- Switch: Route by priority (Critical/High/Medium/Low)
- Slack: Send to appropriate channels
- PostgreSQL: Log all alerts
- Function: Rate limiting (prevent alert fatigue)

### 9. Error Recovery Workflow
**Trigger**: Failed workflow execution
**Function**: Retry failed scrapes with exponential backoff
**Nodes**:
- Error Trigger
- Function: Analyze error type
- Switch: Route by error category
- Wait: Exponential backoff delay
- HTTP Request: Retry original request
- PostgreSQL: Log retry attempts
- Email: Notify admin after 3 failed retries
- Slack: Alert on critical failures

### 10. Data Quality Monitor
**Schedule**: Daily at 11:00 PM UTC
**Function**: Check data completeness and flag anomalies
**Nodes**:
- Cron Trigger
- PostgreSQL: Run data quality queries
- Function: Calculate completeness scores
- Function: Detect data anomalies
- PostgreSQL: Update data quality metrics
- Slack: Alert on quality issues

---

## Database Schema

### Core Tables

#### companies
```sql
- id (UUID, primary key)
- name (VARCHAR)
- website (VARCHAR)
- industry_vertical (VARCHAR)
- employee_count (INTEGER)
- headquarters_location (VARCHAR)
- founded_date (DATE)
- description (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### fda_approvals
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- approval_type (VARCHAR) -- 510k, PMA, De Novo
- device_name (VARCHAR)
- device_classification (VARCHAR)
- approval_date (DATE)
- fda_number (VARCHAR)
- indications_for_use (TEXT)
- source_url (VARCHAR)
- raw_data (JSONB)
- created_at (TIMESTAMP)
```

#### clinical_trials
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- nct_id (VARCHAR, unique)
- title (VARCHAR)
- status (VARCHAR)
- phase (VARCHAR)
- start_date (DATE)
- completion_date (DATE)
- enrollment (INTEGER)
- primary_outcome (TEXT)
- conditions (TEXT[])
- interventions (TEXT[])
- last_updated (TIMESTAMP)
- raw_data (JSONB)
```

#### funding_rounds
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- round_type (VARCHAR) -- Seed, Series A/B/C, IPO
- amount_usd (NUMERIC)
- valuation_usd (NUMERIC)
- announcement_date (DATE)
- lead_investors (TEXT[])
- source (VARCHAR)
- raw_data (JSONB)
- created_at (TIMESTAMP)
```

#### publications
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- pmid (VARCHAR, unique)
- title (VARCHAR)
- authors (TEXT[])
- journal (VARCHAR)
- publication_date (DATE)
- abstract (TEXT)
- keywords (TEXT[])
- citation_count (INTEGER)
- sentiment_score (NUMERIC)
- raw_data (JSONB)
- created_at (TIMESTAMP)
```

#### press_releases
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- title (VARCHAR)
- content (TEXT)
- published_date (TIMESTAMP)
- url (VARCHAR)
- category (VARCHAR)
- sentiment_score (NUMERIC)
- key_entities (JSONB)
- created_at (TIMESTAMP)
```

#### company_enrichment
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- linkedin_url (VARCHAR)
- crunchbase_url (VARCHAR)
- twitter_handle (VARCHAR)
- annual_revenue_usd (NUMERIC)
- funding_total_usd (NUMERIC)
- tech_stack (TEXT[])
- employee_growth_rate (NUMERIC)
- enrichment_date (TIMESTAMP)
- data_sources (JSONB)
```

#### executive_contacts
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- full_name (VARCHAR)
- title (VARCHAR)
- email (VARCHAR)
- linkedin_url (VARCHAR)
- phone (VARCHAR)
- source (VARCHAR)
- verified (BOOLEAN)
- last_verified (TIMESTAMP)
```

#### alerts
```sql
- id (UUID, primary key)
- company_id (UUID, foreign key)
- alert_type (VARCHAR)
- priority (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- data (JSONB)
- sent_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### workflow_logs
```sql
- id (UUID, primary key)
- workflow_name (VARCHAR)
- execution_id (VARCHAR)
- status (VARCHAR)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- records_processed (INTEGER)
- errors (JSONB)
- created_at (TIMESTAMP)
```

---

## API Endpoints

### Data Access API
```
GET /api/companies?limit=50&offset=0
GET /api/companies/{id}
GET /api/companies/{id}/fda-approvals
GET /api/companies/{id}/clinical-trials
GET /api/companies/{id}/funding
GET /api/companies/{id}/publications
GET /api/companies/{id}/timeline

GET /api/fda-approvals?start_date=2024-01-01&end_date=2024-12-31
GET /api/clinical-trials?status=recruiting&phase=3
GET /api/funding-rounds?min_amount=10000000

GET /api/search?q=cardiac+devices&limit=20
```

---

## Retool Dashboard Pages

### 1. Company Overview
- Search and filter companies
- Company cards with key metrics
- Quick links to detailed views

### 2. FDA Approvals Tracker
- Timeline visualization of approvals
- Filter by device type, approval type
- Comparison charts (YoY growth)

### 3. Clinical Trials Monitor
- Active trials by phase
- Success/failure rate analysis
- Trial status changes feed

### 4. Funding Intelligence
- Funding rounds heatmap
- Top funded companies
- Investment trend analysis

### 5. Competitive Landscape
- Company clustering visualization
- Technology overlap matrix
- Market positioning charts

### 6. Alerts & Activity Feed
- Real-time alert stream
- Priority filtering
- Action items dashboard

### 7. Reports & Exports
- Report history
- Download past reports
- Custom export builder

---

## Deployment Architecture

### Infrastructure Requirements
- **n8n Server**: 4 CPU, 8GB RAM, 100GB SSD
- **PostgreSQL**: 4 CPU, 16GB RAM, 500GB SSD
- **Puppeteer Service**: 2 CPU, 4GB RAM (can be containerized)

### Recommended Stack
- **Docker Compose** for easy deployment
- **Nginx** reverse proxy with SSL
- **Let's Encrypt** SSL certificates
- **PM2** or Docker for process management

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/medtech_intel
POSTGRES_USER=medtech_user
POSTGRES_PASSWORD=secure_password

# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
WEBHOOK_URL=https://n8n.yourdomain.com

# API Keys
OPENAI_API_KEY=sk-...
CRUNCHBASE_API_KEY=...
APOLLO_API_KEY=...
HUNTER_API_KEY=...
ROCKETREACH_API_KEY=...
CLEARBIT_API_KEY=...

# Notification Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SENDGRID_API_KEY=...
EMAIL_FROM=reports@yourdomain.com
EMAIL_TO=client@medtechinsights.com

# Retool
RETOOL_API_KEY=...
RETOOL_DB_CONNECTION_STRING=...
```

---

## Monitoring & Maintenance

### Daily Checks
- Verify all scheduled workflows executed successfully
- Check alert queue for anomalies
- Monitor database growth

### Weekly Tasks
- Review data quality metrics
- Validate new companies added
- Test report generation

### Monthly Tasks
- Rotate API keys
- Update company list
- Performance optimization review
- Backup verification

---

## Cost Estimates (Monthly)

### Infrastructure
- **DigitalOcean/AWS**: $150-300 (servers)
- **Database hosting**: $100-200

### API Costs
- **OpenAI GPT-4**: $200-500 (depending on volume)
- **Crunchbase**: $299-999 (Pro/Enterprise)
- **Apollo.io**: $99-199
- **Hunter.io**: $49-149
- **RocketReach**: $99-299

### Tools
- **Retool**: $50-200 (per user)
- **Puppeteer Cloud** (optional): $50-100

**Total**: $1,000-3,000/month depending on scale and API tier selection

---

## Success Metrics

### Data Coverage
- 500+ companies tracked
- 95%+ uptime for scraping workflows
- <24h latency for critical events

### Data Quality
- 90%+ data completeness
- <5% duplicate records
- <1% false positive alerts

### Client Engagement
- Dashboard active users
- Report open rates
- API usage statistics
- Alert response times

---

## Next Steps

1. Set up infrastructure (PostgreSQL, n8n)
2. Import n8n workflow JSON files
3. Configure API credentials
4. Initialize database schema
5. Load initial company list
6. Test each workflow individually
7. Set up Retool dashboard
8. Configure alert thresholds
9. Run initial data collection (backfill)
10. Deploy to production

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Maintained By**: MedTech Insights Inc.
