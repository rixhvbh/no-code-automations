# Quick Start Guide
## Medical Device Competitive Intelligence Platform

Get the system running in 30 minutes with Docker.

---

## Prerequisites Check

Before starting, ensure you have:

- [ ] Docker & Docker Compose installed
- [ ] Domain name pointed to your server (for SSL)
- [ ] OpenAI API key
- [ ] Crunchbase API key
- [ ] Slack workspace with admin access

---

## Step 1: Clone Repository (2 min)

```bash
git clone https://github.com/yourusername/no-code-automations.git
cd no-code-automations
```

---

## Step 2: Configure Environment (5 min)

Create `.env` file:

```bash
cat > .env << 'EOF'
# Database
POSTGRES_PASSWORD=change_this_secure_password_123

# n8n
N8N_USER=admin
N8N_PASSWORD=change_this_password_456
N8N_HOST=n8n.yourdomain.com

# Required API Keys
OPENAI_API_KEY=sk-your-key-here
CRUNCHBASE_API_KEY=your-key-here
APOLLO_API_KEY=your-key-here

# Slack
# Get from: https://api.slack.com/apps (create new app)

# Email
CLIENT_EMAIL=client@medtechinsights.com
ADMIN_EMAIL=admin@yourdomain.com

# Optional (can add later)
HUNTER_API_KEY=
CLEARBIT_API_KEY=
ROCKETREACH_API_KEY=
PDFSHIFT_API_KEY=
GOOGLE_DRIVE_FOLDER_ID=
EOF
```

**Edit the file** and replace placeholder values:
```bash
nano .env
```

---

## Step 3: Start Services (3 min)

```bash
# Create required directories
mkdir -p nginx/ssl docs retool-config scripts

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME                 STATUS
medtech-postgres     Up (healthy)
medtech-n8n          Up
medtech-nginx        Up
```

---

## Step 4: Access n8n (2 min)

1. Open browser: `https://n8n.yourdomain.com`
2. Login with credentials from `.env`:
   - Username: `admin`
   - Password: (your N8N_PASSWORD)

---

## Step 5: Configure Credentials (10 min)

### PostgreSQL

1. Go to **Settings** → **Credentials**
2. Click **Add Credential** → **Postgres**
3. Fill in:
   ```
   Name: MedTech PostgreSQL DB
   Host: postgres
   Database: medtech_intel
   User: medtech_user
   Password: [POSTGRES_PASSWORD from .env]
   Port: 5432
   SSL: Disable
   ```
4. **Test Connection** → **Create**

### Slack

1. Create Slack app: https://api.slack.com/apps → **Create New App**
2. Choose **From scratch**
3. Name: `MedTech Alerts`, select your workspace
4. Go to **OAuth & Permissions** → Add scopes:
   - `chat:write`
   - `channels:read`
5. **Install to Workspace**
6. Copy **Bot User OAuth Token**
7. In n8n: **Add Credential** → **Slack API**
8. Paste token → **Create**

### OpenAI

1. In n8n: **Add Credential** → **OpenAI API**
2. Paste API key from `.env` → **Create**

---

## Step 6: Import Workflows (5 min)

1. In n8n: **Workflows** → **Add Workflow** → **Import from File**
2. Import each file from `workflows/` directory (in order):
   - `09_error_recovery_system.json` ⚠️ **FIRST**
   - `01_fda_510k_scraper.json`
   - `02_clinical_trials_monitor.json`
   - `03_crunchbase_funding_monitor.json`
   - `04_pubmed_research_monitor.json`
   - `05_company_rss_monitor.json`
   - `06_company_enrichment_pipeline.json`
   - `07_weekly_report_generator.json`
   - `08_slack_alert_system.json`

3. For each workflow:
   - Update credential references to match your credential names
   - Click **Save**

---

## Step 7: Set Error Workflow (1 min)

1. **Settings** → **Workflow Settings**
2. **Error Workflow**: Select `Error Recovery & Retry System`
3. **Save**

---

## Step 8: Activate Workflows (1 min)

For each workflow (except Error Recovery):
1. Open workflow
2. Toggle **Active** switch in top right
3. Verify status shows "Active"

---

## Step 9: Test the System (5 min)

### Test Database Connection

```bash
docker exec -it medtech-postgres psql -U medtech_user -d medtech_intel -c "SELECT COUNT(*) FROM companies;"
```

Expected: 50 companies

### Test FDA Scraper (Manual Trigger)

1. Open `FDA 510k Scraper` workflow
2. Click **Execute Workflow** button
3. Wait for completion
4. Check **Executions** tab for success

### Test Alert System

```bash
curl -X POST https://n8n.yourdomain.com/webhook/send-alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert_type": "test",
    "priority": "high",
    "title": "System Test Alert",
    "description": "Testing the alert system - everything is working!"
  }'
```

Check your Slack channel `#medtech-alerts` for the message.

---

## What's Running Now?

✅ **PostgreSQL**: Database with 50 seeded companies
✅ **n8n**: Automation engine with 9 workflows
✅ **Nginx**: Reverse proxy with SSL
✅ **Workflows**:
- FDA scraper (runs daily at 6 AM UTC)
- Clinical trials monitor (every 6 hours)
- Funding tracker (daily at 8 AM)
- PubMed monitor (daily at 10 AM)
- RSS monitor (every 12 hours)

---

## Next Steps

### 1. Set Up Retool Dashboard (30 min)

Follow: [retool-config/dashboard_setup_guide.md](../retool-config/dashboard_setup_guide.md)

### 2. Expand Company List (15 min)

```bash
# Add more companies to database
docker exec -it medtech-postgres psql -U medtech_user -d medtech_intel

# In PostgreSQL:
INSERT INTO companies (name, website, industry_vertical) VALUES
('Your Company Name', 'https://example.com', 'Cardiovascular');
```

Or create a CSV and bulk import.

### 3. Configure Additional API Keys

As budget allows, add:
- Hunter.io (email discovery)
- Clearbit (company enrichment)
- RocketReach (contact data)
- PDFShift (PDF reports)

Update `.env` and restart:
```bash
docker-compose down
docker-compose up -d
```

### 4. Schedule First Report

The weekly report runs every Monday at 9 AM UTC. To test immediately:

1. Open `Weekly Report Generator` workflow
2. Click **Execute Workflow**
3. Check email for PDF report

---

## Monitoring

### Check Workflow Status

```bash
# View n8n logs
docker logs medtech-n8n -f

# View PostgreSQL logs
docker logs medtech-postgres -f
```

### Database Queries

```bash
# Recent FDA approvals
docker exec -it medtech-postgres psql -U medtech_user -d medtech_intel -c "
SELECT approval_date, device_name, applicant_name
FROM fda_approvals
ORDER BY approval_date DESC
LIMIT 10;
"

# Recent alerts
docker exec -it medtech-postgres psql -U medtech_user -d medtech_intel -c "
SELECT created_at, priority, title
FROM alerts
ORDER BY created_at DESC
LIMIT 10;
"

# Workflow execution stats
docker exec -it medtech-postgres psql -U medtech_user -d medtech_intel -c "
SELECT workflow_name, status, COUNT(*) as executions
FROM workflow_logs
GROUP BY workflow_name, status;
"
```

---

## Troubleshooting

### Workflows not executing

**Check cron schedule**:
- Workflows run on UTC time
- Verify system time: `date`

**Check logs**:
```bash
docker logs medtech-n8n --tail 100
```

### Database connection failed

**Verify container is running**:
```bash
docker ps | grep postgres
```

**Check credentials match `.env`**

### Slack alerts not sending

1. Verify Slack credential in n8n
2. Check bot is invited to channel:
   - In Slack: `/invite @MedTech Alerts` in #medtech-alerts
3. Test webhook manually

---

## Production Recommendations

Before going to production:

1. **SSL Certificate**: Use Let's Encrypt for proper SSL
2. **Backups**: Set up automated database backups
3. **Monitoring**: Add uptime monitoring (UptimeRobot, Pingdom)
4. **Firewall**: Configure firewall to allow only 80, 443, 22
5. **Secrets**: Use Docker secrets instead of `.env` file
6. **Scaling**: Consider managed PostgreSQL (AWS RDS, DigitalOcean)

---

## Cost Breakdown

**Infrastructure** (Docker on VPS):
- DigitalOcean Droplet (4GB RAM, 2 vCPU): $24/mo
- Database storage: $10/mo

**APIs** (minimum tiers):
- OpenAI GPT-4: $200/mo
- Crunchbase Basic: $299/mo
- Apollo.io Growth: $99/mo
- Slack: Free
- **Total**: ~$632/mo

Add optional services as needed.

---

## Success! 🎉

Your Medical Device Competitive Intelligence Platform is now running!

**Access Points**:
- n8n Dashboard: `https://n8n.yourdomain.com`
- Database: `localhost:5432`
- Retool: (set up separately)

**Next**: Follow [full deployment guide](DEPLOYMENT_GUIDE.md) for production hardening.

---

**Questions?** Check the [troubleshooting section](DEPLOYMENT_GUIDE.md#troubleshooting) in the deployment guide.
