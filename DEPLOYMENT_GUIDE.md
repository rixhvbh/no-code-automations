# IBOVI System - Complete Deployment Guide

## 📋 Prerequisites

### Required Services:
1. **n8n** (v1.0.0+) - Workflow orchestration
2. **PostgreSQL** (v14+) - Primary database
3. **Redis** (v7+) - Caching and queue management
4. **Node.js** (v18+) - Application runtime
5. **AWS Account** - RDS, DynamoDB, S3

### API Subscriptions Needed:
- **Scraping:**
  - BrightData or Oxylabs (proxy service)
  - 2Captcha or Anti-Captcha

- **Enrichment:**
  - Apollo.io (Company data)
  - Hunter.io (Email patterns & verification)
  - Clearbit (Company enrichment) - Optional
  - Proxycurl (LinkedIn data) - Optional

- **Verification:**
  - ZeroBounce (Email verification)
  - NeverBounce (Backup verification)
  - Twilio (Phone validation)

- **Delivery:**
  - Google Cloud (Sheets API)
  - Slack (Webhooks)

---

## 🚀 Step-by-Step Deployment

### **STEP 1: Set Up Infrastructure**

#### 1.1 PostgreSQL Database

```bash
# Option A: Local PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb ibovi_candidates

# Option B: AWS RDS
# Create RDS PostgreSQL instance via AWS Console
# Note the connection string
```

#### 1.2 Initialize Database Schema

```bash
# Connect to PostgreSQL
psql -U postgres -d ibovi_candidates -f src/config/database.sql

# Verify tables created
psql -U postgres -d ibovi_candidates -c "\dt"
```

#### 1.3 Set Up Redis

```bash
# Option A: Local Redis
sudo apt-get install redis-server
sudo systemctl start redis-server

# Option B: AWS ElastiCache
# Create Redis cluster via AWS Console
```

---

### **STEP 2: Deploy n8n**

#### 2.1 Install n8n

```bash
# Option A: Local Installation
npm install -g n8n

# Option B: Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Option C: n8n Cloud (Recommended for production)
# Sign up at https://n8n.io/cloud
```

#### 2.2 Configure n8n

```bash
# Set environment variables
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=your_secure_password
export N8N_HOST=0.0.0.0
export N8N_PORT=5678
export N8N_PROTOCOL=https
export N8N_WEBHOOK_BASE_URL=https://your-domain.com

# Start n8n
n8n start
```

#### 2.3 Import Workflows

1. Open n8n at http://localhost:5678
2. Go to **Workflows** → **Import from File**
3. Import workflows from `n8n-workflows/` directory:
   - `master-orchestrator.json`
   - Other workflow files

---

### **STEP 3: Deploy Node.js Application**

#### 3.1 Clone and Install

```bash
# Clone repository (or use existing code)
cd /home/user/no-code-automations

# Install dependencies
npm install

# Create logs directory
mkdir -p logs
```

#### 3.2 Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

#### 3.3 Configure API Keys

Edit `.env` and add all API keys:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ibovi_candidates

# Proxies
BRIGHTDATA_PROXY_URL=http://...
TWOCAPTCHA_API_KEY=...

# Enrichment
APOLLO_API_KEY=...
HUNTER_API_KEY=...
CLEARBIT_API_KEY=...

# Verification
ZEROBOUNCE_API_KEY=...
TWILIO_ACCOUNT_SID=...

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
GOOGLE_SHEETS_SPREADSHEET_ID=...

# Slack
SLACK_WEBHOOK_URL=...
```

#### 3.4 Set Up Google Sheets Integration

1. **Create Google Cloud Project:**
   - Go to https://console.cloud.google.com
   - Create new project: "IBOVI Candidate System"

2. **Enable APIs:**
   - Enable "Google Sheets API"
   - Enable "Google Drive API"

3. **Create Service Account:**
   - IAM & Admin → Service Accounts → Create
   - Name: "ibovi-sheets-service"
   - Create and download JSON key

4. **Share Spreadsheet:**
   - Create new Google Sheet
   - Share with service account email
   - Give "Editor" permissions
   - Copy Spreadsheet ID from URL

5. **Update .env:**
   ```bash
   GOOGLE_SHEETS_CLIENT_EMAIL=ibovi-sheets-service@project.iam.gserviceaccount.com
   GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
   GOOGLE_SHEETS_SPREADSHEET_ID=1abc...xyz
   ```

---

### **STEP 4: Start Services**

#### 4.1 Start Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Or use PM2 for production
npm install -g pm2
pm2 start src/index.js --name ibovi-system
pm2 save
pm2 startup
```

#### 4.2 Verify Services

```bash
# Check if application is running
curl http://localhost:3000/health

# Check database connection
psql -U postgres -d ibovi_candidates -c "SELECT COUNT(*) FROM candidates;"

# Check Redis
redis-cli ping
```

---

### **STEP 5: Configure Monitoring**

#### 5.1 Set Up Sentry (Error Tracking)

```bash
# Sign up at https://sentry.io
# Create new project: "IBOVI Candidate System"
# Copy DSN
# Add to .env:
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

#### 5.2 Set Up Logging

```bash
# Logs are automatically created in logs/ directory
tail -f logs/combined.log
tail -f logs/error.log
```

---

### **STEP 6: Test the System**

#### 6.1 Manual Test Scrape

```bash
# Test Indeed scraper
node src/scrapers/indeed-scraper.js

# Test data processor
node src/processors/data-processor.js

# Test email verifier
node src/verification/email-verifier.js
```

#### 6.2 Trigger n8n Workflow

```bash
# Via webhook
curl -X POST http://localhost:5678/webhook/ibovi/orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "platforms": ["indeed_us"],
    "searchQuery": "software engineer",
    "location": "New York, NY",
    "maxResults": 50
  }'
```

#### 6.3 Check Results

```bash
# Check database
psql -U postgres -d ibovi_candidates -c "SELECT COUNT(*) FROM candidates;"

# Check Google Sheets
# Open your spreadsheet and verify data
```

---

### **STEP 7: Production Hardening**

#### 7.1 Security

```bash
# Set strong passwords
# Rotate API keys regularly
# Use HTTPS only
# Enable firewall rules
# Restrict database access
```

#### 7.2 Backups

```bash
# Automated PostgreSQL backups
# Add to crontab:
0 2 * * * pg_dump ibovi_candidates | gzip > /backups/ibovi_$(date +\%Y\%m\%d).sql.gz

# AWS S3 backup
aws s3 sync /backups s3://ibovi-backups/
```

#### 7.3 Scaling

```bash
# Horizontal scaling for scrapers
# Deploy multiple instances behind load balancer

# Database read replicas
# Create RDS read replicas for analytics

# Redis cluster
# Set up Redis cluster for high availability
```

---

## 📊 Usage

### Running Daily Scrapes

The master orchestrator runs automatically every 6 hours via cron trigger in n8n.

### Manual Trigger

Trigger specific platform scrapes:

```bash
# Trigger via API
curl -X POST http://localhost:3000/api/scrape/indeed_us \
  -H "Content-Type: application/json" \
  -d '{
    "searchQuery": "data scientist",
    "location": "San Francisco, CA",
    "maxResults": 200
  }'
```

### Monitoring Dashboards

1. **n8n Dashboard:** http://localhost:5678
   - View workflow executions
   - Check error logs
   - Monitor API usage

2. **Database Stats:**
   ```sql
   -- Daily summary
   SELECT * FROM daily_scraping_stats
   ORDER BY date DESC LIMIT 7;

   -- API costs
   SELECT * FROM daily_api_costs
   WHERE date >= CURRENT_DATE - 7;
   ```

3. **Google Sheets:**
   - Real-time candidate data
   - Quality scores
   - Delivery status

---

## 🔧 Troubleshooting

### Common Issues

**1. Scraper Getting Blocked**
```bash
# Rotate proxies
# Increase rate limiting delays
# Check CAPTCHA solver status
```

**2. Database Connection Errors**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string
psql $DATABASE_URL
```

**3. Google Sheets API Errors**
```bash
# Verify service account permissions
# Check API quotas in Google Cloud Console
# Ensure spreadsheet is shared with service account email
```

**4. High API Costs**
```bash
# Check daily API usage
SELECT * FROM api_usage WHERE date = CURRENT_DATE;

# Reduce scraping frequency
# Implement better caching
```

---

## 📈 Performance Optimization

### Recommended Settings

**For High Volume (1000+ candidates/day):**
```bash
SCRAPER_MAX_CONCURRENT=10
MAX_CANDIDATES_PER_BATCH=2000
ENABLE_COST_TRACKING=true
MAX_API_COST_PER_DAY=500.00
```

**For Low Volume (<500 candidates/day):**
```bash
SCRAPER_MAX_CONCURRENT=3
MAX_CANDIDATES_PER_BATCH=500
ENABLE_COST_TRACKING=true
MAX_API_COST_PER_DAY=100.00
```

---

## 🆘 Support

For issues:
1. Check logs: `tail -f logs/error.log`
2. Review n8n execution logs
3. Check API quota limits
4. Verify environment variables

---

## 📝 Maintenance

### Daily Tasks:
- Monitor error logs
- Check API costs
- Verify data quality scores

### Weekly Tasks:
- Review scraping success rates
- Analyze candidate quality metrics
- Optimize email verification costs

### Monthly Tasks:
- Rotate API keys
- Archive old candidate data
- Review and optimize costs
- Update proxy configurations

---

## 🎯 Success Metrics

Monitor these KPIs:

1. **Scrape Success Rate:** Target 95%+
2. **Email Deliverability:** Target 85%+
3. **Data Completeness:** Target 90%+ with email
4. **Processing Speed:** <5 min per 1000 candidates
5. **API Cost per Candidate:** <$0.10
6. **System Uptime:** 99.5%+

---

**System is now fully deployed and operational! 🎉**
