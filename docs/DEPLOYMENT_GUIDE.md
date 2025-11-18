# Medical Device Competitive Intelligence Platform
## Complete Deployment Guide

This guide provides step-by-step instructions for deploying the entire system from scratch.

---

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [Database Installation](#database-installation)
3. [n8n Installation & Configuration](#n8n-installation--configuration)
4. [Workflow Import & Configuration](#workflow-import--configuration)
5. [API Keys & Credentials](#api-keys--credentials)
6. [Retool Dashboard Setup](#retool-dashboard-setup)
7. [Testing & Validation](#testing--validation)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Infrastructure Setup

### Option 1: Docker Compose (Recommended for Quick Start)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: medtech-postgres
    environment:
      POSTGRES_DB: medtech_intel
      POSTGRES_USER: medtech_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed_companies.sql:/docker-entrypoint-initdb.d/02-seed.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medtech_user -d medtech_intel"]
      interval: 10s
      timeout: 5s
      retries: 5

  n8n:
    image: n8nio/n8n:latest
    container_name: medtech-n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${N8N_HOST}
      - GENERIC_TIMEZONE=America/New_York
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=medtech_user
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      # API Keys
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CRUNCHBASE_API_KEY=${CRUNCHBASE_API_KEY}
      - APOLLO_API_KEY=${APOLLO_API_KEY}
      - HUNTER_API_KEY=${HUNTER_API_KEY}
      - ROCKETREACH_API_KEY=${ROCKETREACH_API_KEY}
      - CLEARBIT_API_KEY=${CLEARBIT_API_KEY}
      - PDFSHIFT_API_KEY=${PDFSHIFT_API_KEY}
      - GOOGLE_DRIVE_FOLDER_ID=${GOOGLE_DRIVE_FOLDER_ID}
      - CLIENT_EMAIL=${CLIENT_EMAIL}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/workflows
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: medtech-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - n8n
    restart: unless-stopped

volumes:
  postgres_data:
  n8n_data:
```

Create `.env` file:

```bash
# Database
POSTGRES_PASSWORD=your_secure_postgres_password

# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=your_secure_n8n_password
N8N_HOST=n8n.yourdomain.com

# API Keys - External Services
OPENAI_API_KEY=sk-...
CRUNCHBASE_API_KEY=...
APOLLO_API_KEY=...
HUNTER_API_KEY=...
ROCKETREACH_API_KEY=...
CLEARBIT_API_KEY=...
PDFSHIFT_API_KEY=...

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=...

# Email Configuration
CLIENT_EMAIL=client@medtechinsights.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Start the stack**:

```bash
docker-compose up -d
```

### Option 2: Manual Installation on Ubuntu/Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install n8n globally
sudo npm install n8n -g

# Install PM2 for process management
sudo npm install pm2 -g

# Install Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Database Installation

### 1. Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE medtech_intel;
CREATE USER medtech_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE medtech_intel TO medtech_user;
\q
```

### 2. Import Schema

```bash
# Navigate to project directory
cd /path/to/no-code-automations

# Import schema
psql -U medtech_user -d medtech_intel -f database/schema.sql

# Import seed data
psql -U medtech_user -d medtech_intel -f database/seed_companies.sql
```

### 3. Verify Installation

```bash
psql -U medtech_user -d medtech_intel -c "SELECT COUNT(*) FROM companies;"
```

Expected output: 50 companies

---

## n8n Installation & Configuration

### 1. Configure n8n Environment

Create `/home/user/.n8n/.env`:

```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
WEBHOOK_URL=https://n8n.yourdomain.com
N8N_HOST=n8n.yourdomain.com
N8N_PORT=5678
N8N_PROTOCOL=https
GENERIC_TIMEZONE=America/New_York
```

### 2. Start n8n with PM2

```bash
# Create n8n startup script
cat > /home/user/start-n8n.sh << 'EOF'
#!/bin/bash
export N8N_BASIC_AUTH_ACTIVE=true
export N8N_BASIC_AUTH_USER=admin
export N8N_BASIC_AUTH_PASSWORD=secure_password
export WEBHOOK_URL=https://n8n.yourdomain.com
n8n
EOF

chmod +x /home/user/start-n8n.sh

# Start with PM2
pm2 start /home/user/start-n8n.sh --name n8n
pm2 save
pm2 startup
```

### 3. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/n8n`:

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running workflows
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d n8n.yourdomain.com
```

---

## Workflow Import & Configuration

### 1. Access n8n

Navigate to `https://n8n.yourdomain.com` and log in

### 2. Configure Database Credentials

1. Go to **Settings** > **Credentials**
2. Click **Add Credential** > **PostgreSQL**
3. Configure:
   - **Name**: MedTech PostgreSQL DB
   - **Host**: localhost (or postgres container name)
   - **Database**: medtech_intel
   - **User**: medtech_user
   - **Password**: [your password]
   - **Port**: 5432
   - **SSL**: Disable (for local) or Enable (for remote)
4. Click **Create**

### 3. Configure API Credentials

**Slack**:
1. Create Slack App at https://api.slack.com/apps
2. Add OAuth scopes: `chat:write`, `channels:read`
3. Install to workspace
4. In n8n: **Add Credential** > **Slack OAuth2 API**
5. Enter OAuth Token

**OpenAI**:
1. Get API key from https://platform.openai.com/api-keys
2. In n8n: **Add Credential** > **OpenAI API**
3. Enter API key

**Google Drive**:
1. Create OAuth2 credentials in Google Cloud Console
2. In n8n: **Add Credential** > **Google Drive OAuth2 API**
3. Follow OAuth flow

**SMTP** (for email):
1. In n8n: **Add Credential** > **SMTP**
2. Configure your email provider (Gmail, SendGrid, etc.)

### 4. Import Workflows

For each workflow JSON file:

1. Click **Workflows** > **Add Workflow** > **Import from File**
2. Select workflow file from `/workflows/` directory
3. Update credential references to match your credential names
4. Activate the workflow

Import order:
1. `09_error_recovery_system.json` (set as Error Workflow in settings)
2. `01_fda_510k_scraper.json`
3. `02_clinical_trials_monitor.json`
4. `03_crunchbase_funding_monitor.json`
5. `04_pubmed_research_monitor.json`
6. `05_company_rss_monitor.json`
7. `06_company_enrichment_pipeline.json`
8. `07_weekly_report_generator.json`
9. `08_slack_alert_system.json`

### 5. Set Error Workflow

1. Go to **Settings** > **Workflow Settings**
2. Select **Error Workflow**: `Error Recovery & Retry System`
3. Apply to all workflows

---

## API Keys & Credentials

### Required Services

| Service | Purpose | Cost | Sign Up |
|---------|---------|------|---------|
| OpenAI | GPT-4 for analysis & summaries | $200-500/mo | https://platform.openai.com |
| Crunchbase | Funding data | $299-999/mo | https://www.crunchbase.com/products/api |
| Apollo.io | Company enrichment | $99-199/mo | https://www.apollo.io/api |
| Hunter.io | Email discovery | $49-149/mo | https://hunter.io/api |
| RocketReach | Contact data | $99-299/mo | https://rocketreach.co/api |
| Clearbit | Firmographic data | $99-299/mo | https://clearbit.com/api |
| PDFShift | HTML to PDF | $9-49/mo | https://pdfshift.io |
| SendGrid | Email delivery | $15-90/mo | https://sendgrid.com |

### Optional Services

- **Puppeteer Cloud**: For heavy scraping ($50-100/mo)
- **TimescaleDB Cloud**: Managed database ($50-200/mo)

---

## Retool Dashboard Setup

See detailed guide in `/retool-config/dashboard_setup_guide.md`

**Quick Steps**:

1. Sign up at https://retool.com
2. Add PostgreSQL resource (connection to medtech_intel database)
3. Create 7 dashboard pages as specified in guide
4. Configure queries and components
5. Set up user permissions
6. Publish dashboard

---

## Testing & Validation

### 1. Test Database Connection

```bash
psql -U medtech_user -d medtech_intel -c "SELECT * FROM companies LIMIT 5;"
```

### 2. Test n8n Workflows

**Manual Test**:
1. Open workflow in n8n
2. Click **Execute Workflow**
3. Verify successful execution
4. Check database for inserted records

**Test FDA Scraper**:
```bash
# Trigger manually
curl -X POST https://n8n.yourdomain.com/webhook/test-fda-scraper
```

**Verify Data**:
```sql
SELECT COUNT(*) FROM fda_approvals;
SELECT COUNT(*) FROM clinical_trials;
SELECT COUNT(*) FROM funding_rounds;
```

### 3. Test Alert System

```bash
curl -X POST https://n8n.yourdomain.com/webhook/send-alert \
  -H "Content-Type: application/json" \
  -d '{
    "alert_type": "test",
    "priority": "high",
    "title": "Test Alert",
    "description": "Testing alert system"
  }'
```

Check Slack channel for alert.

### 4. Test Report Generation

```bash
# Trigger weekly report manually
curl -X POST https://n8n.yourdomain.com/webhook-test/weekly-report-generator
```

Check email and Google Drive for PDF report.

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check workflow execution logs
# In n8n: Executions tab

# Check database size
psql -U medtech_user -d medtech_intel -c "
SELECT
  pg_size_pretty(pg_database_size('medtech_intel')) as db_size;
"

# Check scraper state
psql -U medtech_user -d medtech_intel -c "
SELECT
  scraper_name,
  last_run_at,
  last_success_at
FROM scraper_state;
"
```

### Weekly Tasks

1. Review workflow execution success rate
2. Check alert queue for false positives
3. Validate data quality metrics
4. Review PDF reports for accuracy

### Monthly Tasks

1. Rotate API keys
2. Update company seed list
3. Optimize slow queries
4. Database backup verification
5. Review and adjust scraping frequencies

### Backup Strategy

**Database Backup** (Daily):

```bash
# Add to crontab: 0 2 * * *
pg_dump -U medtech_user medtech_intel | gzip > /backups/medtech_intel_$(date +%Y%m%d).sql.gz

# Retention: Keep last 30 days
find /backups -name "medtech_intel_*.sql.gz" -mtime +30 -delete
```

**n8n Workflow Backup** (Weekly):

```bash
# Export all workflows
# n8n CLI: n8n export:workflow --all --output=/backups/workflows/
```

---

## Troubleshooting

### Issue: Workflow fails with "Connection refused"

**Solution**:
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in n8n match database
- Check firewall rules

### Issue: FDA scraper returns no data

**Solution**:
- FDA website structure may have changed
- Update HTML parsing selectors
- Consider using official FDA API endpoints

### Issue: Slack alerts not sending

**Solution**:
- Verify Slack OAuth token is valid
- Check channel exists and bot is invited
- Review Slack app permissions

### Issue: PDF generation fails

**Solution**:
- Check PDFShift API key is valid
- Verify HTML is well-formed
- Check API rate limits

### Issue: High database disk usage

**Solution**:
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old data
DELETE FROM workflow_logs WHERE created_at < NOW() - INTERVAL '90 days';
VACUUM FULL;
```

---

## Performance Optimization

### Database Indexes

Already included in schema.sql, but verify:

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### n8n Workflow Optimization

1. **Batch Processing**: Process items in batches of 50-100
2. **Rate Limiting**: Add delays between API calls
3. **Caching**: Cache frequently accessed data
4. **Parallel Execution**: Use `Split in Batches` node

---

## Scaling Considerations

### When to Scale

- Database > 100GB
- Workflows timing out
- > 1000 companies tracked
- API rate limits hit frequently

### Scaling Options

**Horizontal Scaling**:
- Add read replicas for PostgreSQL
- Deploy multiple n8n instances with queue mode
- Use Redis for workflow queue

**Vertical Scaling**:
- Upgrade server resources (CPU, RAM, Disk)
- Use TimescaleDB for better time-series performance
- Optimize queries with materialized views

---

## Security Checklist

- [ ] All passwords are strong and unique
- [ ] SSL/TLS enabled for all services
- [ ] Firewall configured (allow only 80, 443, 22)
- [ ] Database not exposed to public internet
- [ ] n8n basic auth enabled
- [ ] Regular security updates applied
- [ ] API keys rotated every 90 days
- [ ] Backups encrypted
- [ ] Monitoring and alerting configured
- [ ] Access logs reviewed weekly

---

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review n8n documentation: https://docs.n8n.io
3. PostgreSQL docs: https://www.postgresql.org/docs/
4. Retool docs: https://docs.retool.com

---

**Deployment Completed!** 🎉

Your Medical Device Competitive Intelligence Platform is now live.

**Next Steps**:
1. Monitor first week of data collection
2. Fine-tune alert thresholds
3. Gather user feedback on Retool dashboard
4. Expand company list to 500+
5. Add custom workflows as needed

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: MedTech Insights Inc.
