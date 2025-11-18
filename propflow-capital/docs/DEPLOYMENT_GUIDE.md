# PropFlow Capital - Deployment Guide
## Real Estate Deal Flow Engine

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Configuration](#database-configuration)
4. [n8n Installation](#n8n-installation)
5. [Workflow Deployment](#workflow-deployment)
6. [API Configuration](#api-configuration)
7. [Testing & Validation](#testing--validation)
8. [Production Deployment](#production-deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## PREREQUISITES

### System Requirements
- **Server**: Ubuntu 20.04+ or equivalent Linux distribution
- **CPU**: Minimum 4 cores (8 cores recommended for production)
- **RAM**: Minimum 8GB (16GB+ recommended)
- **Storage**: Minimum 100GB SSD
- **Network**: Static IP address, port 443 open

### Required Software
- Docker & Docker Compose (v20.10+)
- PostgreSQL 14+
- Redis 6+
- Node.js 18+ (for n8n)
- Nginx (reverse proxy)
- SSL certificate (Let's Encrypt recommended)

### Required Accounts & API Keys
- [ ] n8n Cloud or self-hosted instance
- [ ] BrightData / Oxylabs (proxy service)
- [ ] 2Captcha (CAPTCHA solving)
- [ ] Hunter.io (email discovery)
- [ ] Apollo.io (email discovery)
- [ ] NeverBounce (email verification)
- [ ] Debounce.io (email verification)
- [ ] ZeroBounce (email verification)
- [ ] TrueCaller (phone lookup)
- [ ] Proxycurl (LinkedIn data)
- [ ] Dun & Bradstreet (business intelligence)
- [ ] OpenAI (GPT-4 API)
- [ ] Airtable (CRM)
- [ ] Google Cloud (Sheets API)
- [ ] Twilio (SMS)
- [ ] SendGrid (email)
- [ ] Slack (notifications)

---

## INFRASTRUCTURE SETUP

### 1. Server Provisioning

#### Option A: DigitalOcean Droplet
```bash
# Create droplet via CLI
doctl compute droplet create propflow-production \
  --image ubuntu-20-04-x64 \
  --size s-4vcpu-8gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID
```

#### Option B: AWS EC2
```bash
# Launch EC2 instance
aws ec2 run-instances \
  --image-id ami-0557a15b87f6559cf \
  --instance-type t3.xlarge \
  --key-name propflow-key \
  --security-group-ids sg-XXXXXXXX \
  --subnet-id subnet-XXXXXXXX
```

### 2. Initial Server Configuration

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y curl git nginx certbot python3-certbot-nginx postgresql-client redis-tools

# Create application user
adduser propflow
usermod -aG sudo propflow
su - propflow
```

### 3. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

---

## DATABASE CONFIGURATION

### 1. PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE propflow_capital;
CREATE USER propflow_user WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE propflow_capital TO propflow_user;
\q
EOF
```

### 2. Database Schema

```sql
-- Connect to database
psql -U propflow_user -d propflow_capital

-- Create tables
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  property_id VARCHAR(255) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  property_type VARCHAR(50),
  square_feet INTEGER,
  list_price DECIMAL(15, 2),
  cap_rate DECIMAL(5, 2),
  source VARCHAR(100),
  scraped_at TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  crm_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  contact_id VARCHAR(255) UNIQUE NOT NULL,
  property_id VARCHAR(255) REFERENCES properties(property_id),
  owner_name TEXT,
  email VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_confidence INTEGER,
  phone VARCHAR(50),
  linkedin_url TEXT,
  contact_quality INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE deal_scores (
  id SERIAL PRIMARY KEY,
  property_id VARCHAR(255) REFERENCES properties(property_id),
  final_score INTEGER NOT NULL,
  deal_tier VARCHAR(1),
  recommendation TEXT,
  scoring_data JSONB,
  scored_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  status VARCHAR(50),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_properties_property_id ON properties(property_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_processed ON properties(processed);
CREATE INDEX idx_contacts_property_id ON contacts(property_id);
CREATE INDEX idx_deal_scores_final_score ON deal_scores(final_score DESC);
CREATE INDEX idx_activity_log_workflow ON activity_log(workflow_name);
```

### 3. Redis Setup

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 2gb
# Set: maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis

# Test connection
redis-cli ping
```

---

## N8N INSTALLATION

### 1. Self-Hosted n8n with Docker

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: propflow-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${N8N_HOST}/
      - GENERIC_TIMEZONE=America/Chicago
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${DB_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/workflows
    depends_on:
      - postgres
    networks:
      - propflow

  postgres:
    image: postgres:14-alpine
    container_name: propflow-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - propflow

  redis:
    image: redis:6-alpine
    container_name: propflow-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - propflow

volumes:
  n8n_data:
  postgres_data:
  redis_data:

networks:
  propflow:
    driver: bridge
```

### 2. Start n8n

```bash
# Create .env file
cat > .env << EOF
N8N_PASSWORD=YOUR_SECURE_PASSWORD
N8N_HOST=n8n.propflowcapital.com
DB_PASSWORD=YOUR_DB_PASSWORD
EOF

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f n8n
```

### 3. Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/n8n

# Add configuration:
server {
    listen 80;
    server_name n8n.propflowcapital.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo certbot --nginx -d n8n.propflowcapital.com
```

---

## WORKFLOW DEPLOYMENT

### 1. Import Workflow Files

```bash
# Navigate to n8n UI
https://n8n.propflowcapital.com

# Login with credentials
# Navigate to: Workflows → Import from File

# Import each workflow in order:
1. workflows/scraping/01-multi-platform-property-scraper.json
2. workflows/processing/02-property-deduplication-engine.json
3. workflows/enrichment/03-owner-contact-discovery.json
4. workflows/enrichment/04-email-verification-pipeline.json
5. workflows/orchestration/05-deal-scoring-engine.json
6. workflows/delivery/06-alert-distribution-system.json
7. workflows/delivery/07-crm-sync-workflow.json
```

### 2. Configure Credentials

For each workflow requiring API credentials:

1. Navigate to **Credentials** in n8n
2. Click **Add Credential**
3. Select credential type (e.g., "Twilio API", "Airtable API")
4. Enter API keys from environment template
5. Test connection
6. Save

**Required Credentials:**
- Hunter.io API
- Apollo.io API
- NeverBounce API
- Debounce.io API
- ZeroBounce API
- TrueCaller API
- Proxycurl API
- Dun & Bradstreet API
- OpenAI API
- Airtable API (OAuth2)
- Google Sheets API (Service Account)
- Twilio API
- SendGrid API
- Slack Webhook

### 3. Update Webhook URLs

In each workflow, update webhook trigger URLs:

```javascript
// Example: Update in 02-property-deduplication-engine.json
{
  "parameters": {
    "path": "property-deduplication"
  }
}

// Final webhook URL will be:
// https://n8n.propflowcapital.com/webhook/property-deduplication
```

### 4. Activate Workflows

1. Test each workflow manually first
2. Review execution logs
3. Activate workflows in sequence
4. Monitor for errors

---

## API CONFIGURATION

### 1. Set Environment Variables

```bash
# Copy template
cp config/environment.template.env .env

# Edit with actual values
nano .env

# Load environment variables
source .env
```

### 2. Proxy Configuration

```bash
# Test proxy connection
curl -x http://PROXY_USER:PROXY_PASS@PROXY_HOST:PROXY_PORT http://api.ipify.org

# Configure in n8n HTTP Request nodes
{
  "proxy": "http://PROXY_USER:PROXY_PASS@PROXY_HOST:PROXY_PORT"
}
```

---

## TESTING & VALIDATION

### 1. Unit Testing Workflows

```bash
# Test scraping workflow
curl -X POST https://n8n.propflowcapital.com/webhook-test/property-scraper

# Test processing workflow
curl -X POST https://n8n.propflowcapital.com/webhook/property-deduplication \
  -H "Content-Type: application/json" \
  -d '{"batchId": "test-batch-001"}'

# Test email verification
curl -X POST https://n8n.propflowcapital.com/webhook/email-verification \
  -H "Content-Type: application/json" \
  -d '{"batchId": "test-verification", "emails": [{"email": "test@example.com"}]}'
```

### 2. Integration Testing

1. Run full pipeline end-to-end
2. Verify data in database
3. Check Airtable records
4. Confirm Google Sheets updates
5. Test SMS/email alerts
6. Validate Slack notifications

### 3. Performance Testing

```bash
# Monitor resource usage
docker stats

# Check database performance
psql -U propflow_user -d propflow_capital -c "SELECT * FROM pg_stat_activity;"

# Monitor n8n executions
# Navigate to: Executions → Review timing and success rates
```

---

## PRODUCTION DEPLOYMENT

### 1. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### 2. Backup Configuration

```bash
# Database backup script
cat > /home/propflow/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/propflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U propflow_user propflow_capital > $BACKUP_DIR/propflow_$DATE.sql
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /home/propflow/backup-db.sh

# Add to crontab (daily at 2am)
crontab -e
# Add: 0 2 * * * /home/propflow/backup-db.sh
```

### 3. Monitoring Setup

Install monitoring tools:

```bash
# Install Prometheus & Grafana
docker-compose -f monitoring-stack.yml up -d

# Configure alerts
# Setup PagerDuty / OpsGenie integration
```

---

## MONITORING & MAINTENANCE

### Key Metrics to Monitor

1. **Workflow Execution Success Rate** (target: >95%)
2. **Scraping Volume** (target: 500+ properties/day)
3. **Email Verification Accuracy** (target: >95%)
4. **Deal Scoring Latency** (target: <30s)
5. **Database Query Performance**
6. **API Rate Limit Usage**
7. **Error Rate** (target: <2%)

### Daily Checks

- [ ] Review workflow execution logs
- [ ] Check error notifications
- [ ] Verify CRM sync completion
- [ ] Monitor API credit usage
- [ ] Check disk space usage

### Weekly Maintenance

- [ ] Database performance analysis
- [ ] Cleanup old execution logs
- [ ] Review and optimize slow workflows
- [ ] Update API credentials if needed
- [ ] Review deal quality metrics

---

## TROUBLESHOOTING

### Common Issues

**Issue**: Scraping fails with CAPTCHA errors
```
Solution:
1. Verify 2Captcha API key
2. Check account balance
3. Increase delay between requests
```

**Issue**: Email verification timeout
```
Solution:
1. Reduce batch size
2. Increase rate limit delay
3. Check API service status
```

**Issue**: Airtable sync errors
```
Solution:
1. Verify API credentials
2. Check base ID configuration
3. Review field mapping
4. Check rate limits
```

### Log Locations

```bash
# n8n logs
docker logs propflow-n8n

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Support Contacts

- **n8n Community**: https://community.n8n.io
- **Technical Lead**: [Your contact info]
- **Emergency Pager**: [Pager contact]

---

**Deployment Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Production Ready
