# PropFlow Capital - Real Estate Investment Deal Flow Engine
## System Architecture Documentation

---

## 🎯 SYSTEM OVERVIEW

**Client:** PropFlow Capital
**Industry:** Commercial Real Estate Investment
**Purpose:** Automated deal flow aggregation, analysis, and distribution system

**Core Problem Solved:**
- Aggregate off-market property listings from 15+ platforms
- Discover and enrich owner contact information
- Analyze and score investment opportunities
- Deliver qualified deals to investment team in real-time

---

## 🏗️ ARCHITECTURE LAYERS

### LAYER 1: SCRAPING (Data Acquisition)
**Platforms Integrated:**
- LoopNet (commercial properties)
- CoStar (market analytics)
- Crexi (commercial listings)
- County Property Records (public data)
- Zillow/Realtor.com (residential comparables)
- Auction.com (distressed properties)
- LinkedIn (owner profiles)

**Technical Implementation:**
- Rotating proxy management (BrightData/Oxylabs)
- CAPTCHA solving integration (2Captcha API)
- Rate limiting and request throttling
- Cookie/session management
- User-agent rotation
- HTML parsing and data extraction

**Data Points Extracted:**
- Property address (normalized)
- Owner information (entity name)
- Sale price / asking price
- Property type and square footage
- Listing date and status
- Contact information (if available)
- Financial metrics (cap rate, NOI)

---

### LAYER 2: PROCESSING (Data Refinement)

#### 2.1 Property Deduplication
**Method:** Multi-factor matching algorithm
- Address normalization (USPS standard)
- Latitude/longitude proximity matching (±0.001°)
- Parcel ID cross-reference
- Owner name fuzzy matching (Levenshtein distance)

**Deduplication Logic:**
```javascript
// Confidence scoring system
- Exact parcel ID match: 100% confidence
- Address + owner match: 95% confidence
- Lat/long within 100ft: 85% confidence
- Address match only: 70% confidence
```

#### 2.2 Owner Entity Resolution
**Chain:** Property → LLC → Registered Agent → Parent Company → Key Person

**Data Sources:**
- Secretary of State business registries
- Registered agent databases
- Corporate structure lookups
- UCC filing records

**Output:** Hierarchical ownership structure with decision-maker identification

#### 2.3 Financial Modeling
**Calculations Performed:**
- Cap Rate: NOI / Purchase Price
- Cash-on-Cash Return: Annual Cash Flow / Total Cash Invested
- Internal Rate of Return (IRR) projections
- Debt Service Coverage Ratio (DSCR)
- Gross Rent Multiplier (GRM)

**Comparable Analysis:**
- Neighborhood median prices
- Price per square foot benchmarking
- Historical appreciation rates
- Rental yield comparisons

#### 2.4 Deal Scoring Algorithm
**Scoring Matrix (0-100 scale):**

| Factor | Weight | Criteria |
|--------|--------|----------|
| Financial Metrics | 35% | Cap rate >7%, DSCR >1.25, IRR >15% |
| Location Quality | 25% | Neighborhood grade, crime stats, demographics |
| Owner Motivation | 20% | Listing age, price reductions, distress signals |
| Contact Quality | 10% | Verified email/phone, decision-maker access |
| Market Timing | 10% | Supply/demand ratio, market cycle position |

**AI Enhancement:**
- GPT-4 property description analysis
- Sentiment analysis of listing language
- Opportunity keyword detection
- Risk factor identification

---

### LAYER 3: ENRICHMENT (Contact Discovery)

#### 3.1 Owner Contact Discovery Workflow
**Step-by-Step Process:**

1. **Entity Identification**
   - Extract owner LLC name from property records
   - Identify registered agent from state filings

2. **Registered Agent Lookup**
   - Cross-reference with registered agent databases
   - Locate principal business address

3. **Key Person Identification**
   - Find company officers/managers
   - Identify decision-makers (CEO, Managing Partner)

4. **Email Discovery**
   - Pattern matching (firstname.lastname@company.com)
   - Hunter.io / Apollo.io lookup
   - Clearbit company email discovery
   - Email permutation testing

5. **Phone Number Append**
   - TrueCaller API (mobile numbers)
   - NumVerify (validation)
   - Public records scraping
   - Corporate directory lookups

#### 3.2 Email Verification Pipeline
**Three-Service Validation:**
- NeverBounce (deliverability check)
- Debounce.io (spam trap detection)
- ZeroBounce (catch-all server detection)

**Confidence Scoring:**
```javascript
Valid + Deliverable + No Spam Trap = 95% confidence
Valid + Unknown Deliverability = 70% confidence
Catch-All Server = 40% confidence
Invalid Syntax = 0% confidence
```

#### 3.3 LinkedIn Profile Matching
**Proxycurl API Integration:**
- Company → Employee list
- Job title filtering (C-level, VP, Partner)
- Profile data extraction
- Contact information enrichment

#### 3.4 Financial History Enrichment
**Dun & Bradstreet API:**
- Company credit score
- Annual revenue estimates
- Employee count
- Business risk assessment
- Payment history

---

### LAYER 4: DELIVERY (Distribution & Integration)

#### 4.1 Airtable CRM Integration
**Deal Pipeline Structure:**

**Bases:**
- Properties (master property database)
- Owners (contact management)
- Deals (active opportunities)
- Activity Log (engagement tracking)

**Automated Actions:**
- Upsert logic (update existing, insert new)
- Duplicate prevention
- Status field updates
- Relationship linking (property → owner → deal)

#### 4.2 Google Sheets Investor Dashboard
**Live Dashboards:**
- Deal Scoreboard (sortable by ranking)
- Weekly New Deals
- Contact Acquisition Metrics
- Market Analysis Summaries

**Auto-Generated Reports:**
- Property comparison tables
- Financial metrics charts
- Geographic heat maps (via Google Maps API)

#### 4.3 Twilio SMS Alerts
**Instant Notifications:**
- Deal score >85: Immediate SMS to partners
- New off-market listing: Alert to acquisition team
- Price reduction detected: Notify assigned analyst
- Owner contact found: Ping outreach coordinator

**Message Format:**
```
🏢 NEW HOT DEAL (Score: 92/100)
📍 123 Main St, Austin TX
💰 $2.4M | Cap: 8.5% | ROI: 18%
👤 Owner: John Smith (verified email)
🔗 [View Details]
```

#### 4.4 Zapier Webhook Integration
**Triggers for External CRMs:**
- HubSpot deal creation
- Salesforce opportunity logging
- Slack channel notifications
- Email campaign triggers (Mailchimp/SendGrid)

#### 4.5 Automated Weekly Deal Packages
**Email Report Contents:**
- Top 10 deals by score
- Market trends analysis
- New contacts acquired
- Outreach recommendations
- Performance metrics

**Distribution Schedule:**
- Monday 8am: Weekly deal digest
- Thursday 2pm: Mid-week opportunities
- Friday 5pm: Week-in-review summary

---

## 🔄 N8N WORKFLOW ORCHESTRATION

### Workflow 1: Multi-Platform Property Scraper
**Trigger:** Cron (every 4 hours)
**Components:**
- Platform router (selects source)
- Proxy rotation manager
- CAPTCHA solver integration
- HTML parser
- Data normalizer
- Error handler with retry logic

**Output:** Raw property data → Processing layer

---

### Workflow 2: Owner Contact Discovery Chain
**Trigger:** New property without owner contact
**Components:**
- Property → LLC lookup
- LLC → Registered Agent API
- Registered Agent → Principal Address
- Company → Key Person scraper
- Email finder (multi-service)
- Phone append services

**Output:** Enriched contact data → Verification pipeline

---

### Workflow 3: Email Verification Pipeline
**Trigger:** New email discovered
**Components:**
- Batch aggregation (wait 100 emails or 1 hour)
- NeverBounce API call
- Debounce.io API call
- ZeroBounce API call
- Confidence score calculator
- Result aggregator

**Output:** Verified contacts → CRM update

---

### Workflow 4: Deal Scoring Engine
**Trigger:** New property with complete data
**Components:**
- Financial calculator function
- Comparable property fetcher
- GPT-4 analysis node
- Scoring algorithm function
- Ranking updater

**Output:** Scored deal → Distribution logic

---

### Workflow 5: CRM Sync Workflow
**Trigger:** Deal score calculated
**Components:**
- Airtable upsert logic
- Google Sheets row append
- Duplicate check function
- Relationship linker
- Activity logger

**Output:** Synced data across platforms

---

### Workflow 6: Alert Distribution
**Trigger:** Deal score >85 OR price reduction detected
**Components:**
- Threshold evaluator
- SMS message composer
- Twilio send node
- Email formatter
- SendGrid send node
- Slack webhook
- Zapier webhook trigger

**Output:** Real-time notifications to team

---

## 🔐 SECURITY & COMPLIANCE

### Data Privacy
- GDPR compliance for EU properties
- Data retention policies (90-day automatic purge)
- Encrypted credential storage
- Audit logging of all data access

### API Security
- OAuth2 authentication where available
- API key rotation schedule (30 days)
- Rate limiting enforcement
- IP whitelisting for sensitive services

### Legal Compliance
- robots.txt respect for public scraping
- Terms of Service adherence
- Fair use data collection practices
- No illegal data harvesting

---

## 📊 MONITORING & PERFORMANCE

### Key Performance Indicators (KPIs)
- Properties scraped per day: Target 500+
- Contact discovery success rate: Target 60%
- Email verification accuracy: Target 95%+
- Deal scoring latency: Target <30 seconds
- Alert delivery time: Target <60 seconds

### Error Monitoring
- Failed scraping attempts logged
- API timeout tracking
- Data quality validation checks
- Duplicate detection accuracy

### System Health Checks
- Hourly uptime verification
- API credential validation
- Proxy pool status monitoring
- Database connection testing

---

## 🚀 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- n8n workflow distribution across multiple instances
- Database read replicas for reporting
- Queue-based processing for batch operations

### Performance Optimization
- Caching for frequently accessed data
- Batch processing for API calls
- Async operations for long-running tasks
- Database indexing on search fields

### Cost Management
- API call budgeting and tracking
- Proxy usage optimization
- Storage lifecycle policies
- Serverless function usage monitoring

---

## 📅 DEPLOYMENT PHASES

### Phase 1: Foundation (Week 1-2)
- Core scraping workflows (3 platforms)
- Basic property deduplication
- Airtable integration
- Manual deal scoring

### Phase 2: Enhancement (Week 3-4)
- Contact discovery workflows
- Email verification pipeline
- Automated deal scoring
- Google Sheets dashboards

### Phase 3: Distribution (Week 5-6)
- SMS alert system
- Email report automation
- Zapier webhooks
- LinkedIn enrichment

### Phase 4: Optimization (Week 7-8)
- Performance tuning
- Error handling refinement
- UI/UX improvements
- Documentation completion

---

## 🛠️ TECHNOLOGY STACK

**Automation Platform:** n8n (self-hosted or cloud)
**Databases:**
- PostgreSQL (primary data store)
- Redis (caching layer)

**APIs & Services:**
- Hunter.io (email discovery)
- TrueCaller (phone lookup)
- NeverBounce (email verification)
- Proxycurl (LinkedIn data)
- 2Captcha (CAPTCHA solving)
- BrightData (proxy rotation)
- OpenAI GPT-4 (analysis)
- Twilio (SMS)
- Airtable (CRM)
- Google Sheets (dashboards)

**Infrastructure:**
- Docker containers
- AWS/DigitalOcean hosting
- Cloudflare (CDN/security)
- GitHub (version control)

---

**Last Updated:** 2025-11-18
**Version:** 1.0
**Status:** Architecture Design Complete
