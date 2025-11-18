-- ========================================
-- IBOVI CANDIDATE ACQUISITION SYSTEM
-- DATABASE SCHEMA (PostgreSQL)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ CANDIDATES TABLE ============
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic Info
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    location VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(50),

    -- Job Info
    current_title VARCHAR(255),
    current_company VARCHAR(255),
    years_of_experience INTEGER,
    skills TEXT[],

    -- LinkedIn Data
    linkedin_url VARCHAR(500) UNIQUE,
    linkedin_headline VARCHAR(500),
    linkedin_summary TEXT,
    linkedin_connections INTEGER,

    -- Source Data
    source_platform VARCHAR(50), -- 'indeed', 'linkedin', 'ziprecruiter', etc.
    source_url TEXT,
    job_posting_id VARCHAR(255),
    job_title_applied VARCHAR(255),

    -- Verification Status
    email_verified BOOLEAN DEFAULT FALSE,
    email_deliverability_score DECIMAL(5,2),
    email_verification_status VARCHAR(50), -- 'valid', 'invalid', 'risky', 'unknown'
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_validity_status VARCHAR(50),

    -- Enrichment Data
    company_domain VARCHAR(255),
    company_size VARCHAR(50),
    company_industry VARCHAR(255),
    hr_contact_email VARCHAR(255),
    recruiter_email VARCHAR(255),

    -- Quality Metrics
    data_completeness_score INTEGER, -- 0-100
    profile_confidence_score DECIMAL(5,2), -- 0-100
    data_freshness_score INTEGER, -- 0-100
    overall_quality_score INTEGER, -- 0-100

    -- Metadata
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    enriched_at TIMESTAMP,
    verified_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Delivery Status
    delivered_to_client BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP,
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    synced_to_ats BOOLEAN DEFAULT FALSE,
    ats_candidate_id VARCHAR(255),

    -- Additional Data (JSON)
    raw_data JSONB,
    enrichment_data JSONB,
    verification_data JSONB,
    custom_fields JSONB,

    -- Indexes for faster queries
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for candidates table
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_linkedin ON candidates(linkedin_url);
CREATE INDEX idx_candidates_source ON candidates(source_platform, scraped_at);
CREATE INDEX idx_candidates_quality ON candidates(overall_quality_score DESC);
CREATE INDEX idx_candidates_company ON candidates(current_company);
CREATE INDEX idx_candidates_location ON candidates(city, state, country);
CREATE INDEX idx_candidates_scraped_at ON candidates(scraped_at DESC);
CREATE INDEX idx_candidates_delivered ON candidates(delivered_to_client, delivered_at);

-- ============ COMPANIES TABLE ============
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,

    -- Company Details
    industry VARCHAR(255),
    size VARCHAR(50),
    founded_year INTEGER,
    location VARCHAR(255),
    website VARCHAR(500),

    -- Contact Patterns
    email_pattern VARCHAR(100), -- e.g., 'firstName.lastName@domain.com'
    hr_email VARCHAR(255),
    careers_email VARCHAR(255),

    -- Enrichment Data
    linkedin_company_url VARCHAR(500),
    description TEXT,
    employee_count INTEGER,

    -- Apollo/Clearbit Data
    apollo_data JSONB,
    clearbit_data JSONB,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_enriched_at TIMESTAMP
);

CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_companies_name ON companies(name);

-- ============ SCRAPING JOBS TABLE ============
CREATE TABLE scraping_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    job_type VARCHAR(50), -- 'indeed_us', 'linkedin', etc.
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'

    -- Job Parameters
    search_query VARCHAR(500),
    location VARCHAR(255),
    job_board VARCHAR(50),
    max_results INTEGER,

    -- Progress Tracking
    candidates_found INTEGER DEFAULT 0,
    candidates_processed INTEGER DEFAULT 0,
    candidates_failed INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Results
    success_rate DECIMAL(5,2),
    error_count INTEGER DEFAULT 0,
    errors JSONB,

    -- Metadata
    triggered_by VARCHAR(50), -- 'cron', 'webhook', 'manual'
    n8n_execution_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status, created_at);
CREATE INDEX idx_scraping_jobs_type ON scraping_jobs(job_type);

-- ============ ACTIVITY LOG TABLE ============
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    activity_type VARCHAR(100), -- 'scrape', 'process', 'enrich', 'verify', 'deliver'
    entity_type VARCHAR(50), -- 'candidate', 'company', 'job'
    entity_id UUID,

    -- Activity Details
    action VARCHAR(100),
    status VARCHAR(50), -- 'success', 'failure', 'warning'
    message TEXT,

    -- Context
    workflow_name VARCHAR(255),
    n8n_execution_id VARCHAR(255),
    user_id VARCHAR(100),

    -- Performance Metrics
    duration_ms INTEGER,
    api_calls_made INTEGER,
    cost_usd DECIMAL(10,4),

    -- Data
    metadata JSONB,
    error_details JSONB,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_type ON activity_log(activity_type, created_at DESC);
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_status ON activity_log(status, created_at);

-- ============ API USAGE TRACKING TABLE ============
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    api_service VARCHAR(100), -- 'apollo', 'hunter', 'zerobounce', etc.
    operation VARCHAR(100),

    -- Usage Metrics
    requests_count INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Cost Tracking
    cost_per_request DECIMAL(10,4),
    total_cost DECIMAL(10,4),

    -- Rate Limiting
    rate_limit_hit BOOLEAN DEFAULT FALSE,

    -- Timing
    date DATE DEFAULT CURRENT_DATE,
    hour INTEGER,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_api_usage_service ON api_usage(api_service, date);
CREATE INDEX idx_api_usage_date ON api_usage(date DESC);

-- ============ EMAIL VERIFICATION CACHE TABLE ============
CREATE TABLE email_verification_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    email VARCHAR(255) UNIQUE NOT NULL,

    -- Verification Results
    is_valid BOOLEAN,
    status VARCHAR(50), -- 'valid', 'invalid', 'risky', 'unknown'
    deliverability_score DECIMAL(5,2),

    -- Provider
    verification_provider VARCHAR(50), -- 'hunter', 'zerobounce', etc.

    -- Details
    is_disposable BOOLEAN,
    is_role_email BOOLEAN,
    smtp_check BOOLEAN,
    mx_record_found BOOLEAN,

    -- Metadata
    verification_data JSONB,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Cache expiration (30 days)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verification_cache_email ON email_verification_cache(email);
CREATE INDEX idx_email_verification_cache_expires ON email_verification_cache(expires_at);

-- ============ DELIVERY QUEUE TABLE ============
CREATE TABLE delivery_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    candidate_id UUID REFERENCES candidates(id),

    destination VARCHAR(50), -- 'google_sheets', 'bullhorn', 'greenhouse', 'slack'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'delivered', 'failed'

    -- Retry Logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,

    -- Timing
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,

    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_queue_status ON delivery_queue(status, scheduled_at);
CREATE INDEX idx_delivery_queue_candidate ON delivery_queue(candidate_id);

-- ============ TRIGGERS ============

-- Update last_updated timestamp on candidates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ VIEWS ============

-- View: High Quality Candidates
CREATE VIEW high_quality_candidates AS
SELECT
    id, full_name, email, phone, current_title, current_company,
    overall_quality_score, email_deliverability_score,
    source_platform, scraped_at
FROM candidates
WHERE overall_quality_score >= 80
  AND email_verified = TRUE
  AND delivered_to_client = FALSE
ORDER BY overall_quality_score DESC, scraped_at DESC;

-- View: Daily Scraping Performance
CREATE VIEW daily_scraping_stats AS
SELECT
    DATE(created_at) as date,
    job_type,
    COUNT(*) as total_jobs,
    SUM(candidates_found) as total_candidates_found,
    SUM(candidates_processed) as total_candidates_processed,
    AVG(success_rate) as avg_success_rate,
    SUM(duration_seconds) as total_duration_seconds
FROM scraping_jobs
WHERE status = 'completed'
GROUP BY DATE(created_at), job_type
ORDER BY date DESC, job_type;

-- View: API Cost Summary
CREATE VIEW daily_api_costs AS
SELECT
    date,
    api_service,
    SUM(requests_count) as total_requests,
    SUM(total_cost) as total_cost_usd
FROM api_usage
GROUP BY date, api_service
ORDER BY date DESC, total_cost_usd DESC;

-- ============ SAMPLE FUNCTIONS ============

-- Function: Calculate Data Completeness Score
CREATE OR REPLACE FUNCTION calculate_completeness_score(candidate_row candidates)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Basic fields (60 points total)
    IF candidate_row.first_name IS NOT NULL THEN score := score + 10; END IF;
    IF candidate_row.last_name IS NOT NULL THEN score := score + 10; END IF;
    IF candidate_row.email IS NOT NULL THEN score := score + 15; END IF;
    IF candidate_row.phone IS NOT NULL THEN score := score + 10; END IF;
    IF candidate_row.location IS NOT NULL THEN score := score + 5; END IF;
    IF candidate_row.current_title IS NOT NULL THEN score := score + 10; END IF;

    -- LinkedIn data (20 points)
    IF candidate_row.linkedin_url IS NOT NULL THEN score := score + 15; END IF;
    IF candidate_row.linkedin_summary IS NOT NULL THEN score := score + 5; END IF;

    -- Company data (10 points)
    IF candidate_row.current_company IS NOT NULL THEN score := score + 5; END IF;
    IF candidate_row.company_domain IS NOT NULL THEN score := score + 5; END IF;

    -- Skills (10 points)
    IF candidate_row.skills IS NOT NULL AND array_length(candidate_row.skills, 1) > 0 THEN
        score := score + 10;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- ============ INITIAL DATA ============

-- Insert test company
INSERT INTO companies (name, domain, email_pattern, industry) VALUES
('Test Company', 'testcompany.com', 'firstName.lastName@testcompany.com', 'Technology');

-- ============ GRANTS ============
-- Grant appropriate permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ibovi_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ibovi_user;
