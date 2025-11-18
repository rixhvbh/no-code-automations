# IBOVI System Architecture - Complete Implementation Guide

## 🎯 System Overview
Multi-layer candidate data acquisition, enrichment, and delivery platform built on n8n orchestration with Node.js microservices.

## 📊 Architecture Layers

### **LAYER 1: Data Acquisition (Scraping Engine)**

#### Components:
1. **Multi-Platform Scrapers**
   - Indeed (US/UK/CA)
   - LinkedIn
   - ZipRecruiter
   - Glassdoor
   - CareerBuilder

2. **Anti-Detection System**
   - Proxy rotation (BrightData, Oxylabs, SmartProxy)
   - CAPTCHA solving (2Captcha, Anti-Captcha)
   - Rate limiting & throttling
   - User-agent rotation
   - Browser fingerprint randomization

3. **Error Handling**
   - Retry logic with exponential backoff
   - Dead letter queue for failed scrapes
   - Success rate monitoring

#### Technology Stack:
- **Scraping**: Puppeteer, Playwright, Axios
- **Proxy Management**: Proxy-chain, rotating-proxy
- **CAPTCHA**: 2captcha-node, anticaptcha
- **Rate Limiting**: Bottleneck.js

---

### **LAYER 2: Data Processing Pipeline**

#### Components:
1. **Deduplication Engine**
   - Multi-field matching (email, phone, LinkedIn URL)
   - Fuzzy name matching (Levenshtein distance)
   - Company + location combination

2. **Data Normalization**
   - Standardize phone formats (E.164)
   - Clean email addresses
   - Normalize location data
   - Standardize job titles

3. **Company Enrichment**
   - Domain extraction from email
   - Apollo.io company data
   - Clearbit company enrichment
   - Hunter.io domain search

4. **Contact Discovery**
   - HR/recruiter email pattern generation
   - LinkedIn Sales Navigator data
   - Company website scraping

5. **Quality Scoring**
   - Completeness metrics (0-100 score)
   - Data freshness scoring
   - Confidence levels

#### Technology Stack:
- **Processing**: Node.js, Lodash
- **Matching**: fuzzball.js, leven
- **APIs**: Apollo, Clearbit, Hunter.io SDKs

---

### **LAYER 3: Verification & Enrichment**

#### Components:
1. **Email Verification**
   - Hunter.io Email Verifier
   - ZeroBounce bulk verification
   - NeverBounce real-time check
   - Debounce.io validation

2. **Email Pattern Generation**
   - firstName.lastName@company.com
   - firstNameLastName@company.com
   - f.lastName@company.com
   - Multiple pattern testing

3. **LinkedIn Enrichment**
   - Proxycurl API (profile data)
   - Clay.com enrichment
   - RocketReach integration

4. **Phone Validation**
   - Twilio Lookup API
   - Numverify validation
   - Format standardization

5. **Deliverability Scoring**
   - Email deliverability %
   - Phone validity status
   - Profile completeness %

#### Technology Stack:
- **Verification**: Hunter.io, ZeroBounce, NeverBounce APIs
- **Enrichment**: Proxycurl, Clay.com, RocketReach APIs
- **Phone**: Twilio SDK

---

### **LAYER 4: Storage & Delivery**

#### Components:
1. **Primary Storage**
   - AWS RDS (PostgreSQL) - structured candidate data
   - DynamoDB - session/cache data
   - S3 - document storage (resumes, attachments)

2. **Client Dashboard**
   - Google Sheets integration
   - Real-time updates via Google Sheets API
   - Filtering and search capabilities

3. **ATS Integration**
   - Bullhorn API integration
   - Greenhouse API integration
   - Lever API integration
   - Custom webhook support

4. **Notifications**
   - Slack webhooks (new candidate alerts)
   - Email notifications (digest reports)
   - SMS alerts (high-priority matches)

5. **Export Capabilities**
   - CSV export
   - JSON API endpoints
   - Webhook delivery
   - FTP/SFTP upload

#### Technology Stack:
- **Database**: PostgreSQL (AWS RDS), DynamoDB
- **APIs**: Google Sheets API v4, Slack API
- **Export**: csv-writer, jsonwebtoken

---

### **LAYER 5: Orchestration & Monitoring**

#### Components:
1. **n8n Workflows**
   - Cron-based triggers (daily/hourly scrapes)
   - Webhook endpoints (on-demand processing)
   - Sequential processing chains
   - Parallel processing for speed

2. **Error Tracking**
   - Centralized error logging (Sentry)
   - Error categorization
   - Alert thresholds
   - Auto-recovery mechanisms

3. **Performance Monitoring**
   - Scrape success rate tracking
   - API cost monitoring
   - Processing time metrics
   - Queue depth monitoring

4. **Retry Queues**
   - Failed scrape retry (3 attempts)
   - Exponential backoff
   - Priority queuing
   - Dead letter queue

5. **Reporting**
   - Daily summary dashboard
   - Cost analysis reports
   - Data quality metrics
   - System health checks

#### Technology Stack:
- **Orchestration**: n8n
- **Monitoring**: Sentry, DataDog
- **Logging**: Winston, Bunyan
- **Metrics**: Prometheus, Grafana

---

## 🔄 Data Flow

```
1. TRIGGER (n8n cron/webhook)
   ↓
2. SCRAPE job platforms → Raw candidate data
   ↓
3. PROCESS → Deduplicate → Normalize → Enrich
   ↓
4. VERIFY → Email validation → Phone validation
   ↓
5. ENRICH → LinkedIn data → Company data
   ↓
6. SCORE → Quality metrics → Deliverability %
   ↓
7. STORE → PostgreSQL + Google Sheets
   ↓
8. DELIVER → ATS + Slack + Export
   ↓
9. MONITOR → Logs + Metrics + Reports
```

---

## 📦 Service Architecture

### **Microservices:**

1. **scraper-service** - Handles all web scraping operations
2. **processor-service** - Data normalization and deduplication
3. **enrichment-service** - Company and contact enrichment
4. **verification-service** - Email and phone validation
5. **storage-service** - Database operations and caching
6. **delivery-service** - ATS integration and exports
7. **monitoring-service** - Logging and metrics collection

### **n8n Workflows:**

1. **master-orchestrator** - Main workflow coordinator
2. **scrape-indeed** - Indeed-specific scraping
3. **scrape-linkedin** - LinkedIn scraping
4. **scrape-ziprecruiter** - ZipRecruiter scraping
5. **process-candidates** - Data processing pipeline
6. **enrich-verify** - Enrichment and verification
7. **deliver-results** - Storage and delivery
8. **monitoring-dashboard** - Metrics and reporting

---

## 🔐 Security Considerations

1. **API Key Management**: Use n8n credentials store
2. **Data Encryption**: Encrypt PII at rest and in transit
3. **Rate Limiting**: Implement per-service rate limits
4. **Access Control**: Role-based access for Google Sheets
5. **Audit Logging**: Track all data access and modifications

---

## 💰 Cost Optimization

1. **Proxy Usage**: Rotate between free and paid proxies
2. **API Calls**: Batch requests where possible
3. **Storage**: Archive old data to S3 Glacier
4. **Caching**: Cache enrichment data for 30 days
5. **Monitoring**: Set up cost alerts for API usage

---

## 📈 Scalability

1. **Horizontal Scaling**: Deploy multiple scraper instances
2. **Queue Management**: Use Redis for job queuing
3. **Load Balancing**: Distribute scraping across regions
4. **Database Sharding**: Partition by company or date
5. **CDN**: Cache static enrichment data

---

## 🚀 Deployment Strategy

1. **Development**: Local n8n instance with test data
2. **Staging**: Cloud n8n with limited scraping
3. **Production**: Full deployment with monitoring
4. **Rollback**: Version-controlled workflows
5. **Backup**: Daily database backups to S3

---

## 📊 Success Metrics

1. **Scrape Success Rate**: Target 95%+
2. **Email Deliverability**: Target 85%+
3. **Data Completeness**: Target 90%+ profiles with email
4. **Processing Speed**: <5 min per 1000 candidates
5. **API Cost per Candidate**: <$0.10

---

## 🛠️ Technology Summary

| Layer | Primary Tech | Supporting Tech |
|-------|--------------|-----------------|
| Layer 1 | Puppeteer, Playwright | BrightData, 2Captcha |
| Layer 2 | Node.js, Lodash | Apollo.io, Hunter.io |
| Layer 3 | ZeroBounce, Proxycurl | Twilio, RocketReach |
| Layer 4 | PostgreSQL, Google Sheets | Slack API, Bullhorn |
| Layer 5 | n8n, Sentry | DataDog, Grafana |

---

## 📝 Next Steps

1. Set up n8n instance (cloud or self-hosted)
2. Configure API credentials (Hunter.io, Apollo, etc.)
3. Set up PostgreSQL database
4. Create Google Sheets templates
5. Build core scraping modules
6. Create n8n workflows
7. Deploy and test
8. Monitor and optimize
