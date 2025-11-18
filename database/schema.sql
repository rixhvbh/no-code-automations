-- Medical Device Competitive Intelligence Platform
-- PostgreSQL Database Schema
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB for time-series optimization (optional but recommended)
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    industry_vertical VARCHAR(100),
    employee_count INTEGER,
    headquarters_location VARCHAR(255),
    founded_date DATE,
    description TEXT,
    logo_url VARCHAR(500),
    stock_ticker VARCHAR(10),
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry_vertical);
CREATE INDEX idx_companies_metadata ON companies USING GIN(metadata);

-- FDA Approvals table
CREATE TABLE fda_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    approval_type VARCHAR(50) NOT NULL, -- 510k, PMA, De Novo, HDE
    device_name VARCHAR(500) NOT NULL,
    device_classification VARCHAR(100),
    product_code VARCHAR(10),
    approval_date DATE NOT NULL,
    fda_number VARCHAR(100) UNIQUE NOT NULL,
    applicant_name VARCHAR(255),
    indications_for_use TEXT,
    decision VARCHAR(50), -- Approved, Denied, Withdrawn
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fda_approvals_company ON fda_approvals(company_id);
CREATE INDEX idx_fda_approvals_date ON fda_approvals(approval_date DESC);
CREATE INDEX idx_fda_approvals_type ON fda_approvals(approval_type);
CREATE INDEX idx_fda_approvals_number ON fda_approvals(fda_number);

-- Clinical Trials table
CREATE TABLE clinical_trials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    nct_id VARCHAR(50) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status VARCHAR(100), -- Recruiting, Active, Completed, Withdrawn, etc.
    phase VARCHAR(50), -- Phase 1, Phase 2, Phase 3, Phase 4
    study_type VARCHAR(100),
    start_date DATE,
    completion_date DATE,
    primary_completion_date DATE,
    enrollment INTEGER,
    enrollment_actual INTEGER,
    primary_outcome TEXT,
    secondary_outcome TEXT,
    conditions TEXT[],
    interventions TEXT[],
    sponsors TEXT[],
    collaborators TEXT[],
    locations TEXT[],
    outcome_measures TEXT,
    last_updated TIMESTAMP,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clinical_trials_company ON clinical_trials(company_id);
CREATE INDEX idx_clinical_trials_nct ON clinical_trials(nct_id);
CREATE INDEX idx_clinical_trials_status ON clinical_trials(status);
CREATE INDEX idx_clinical_trials_phase ON clinical_trials(phase);
CREATE INDEX idx_clinical_trials_start_date ON clinical_trials(start_date DESC);

-- Funding Rounds table
CREATE TABLE funding_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    round_type VARCHAR(100) NOT NULL, -- Seed, Series A/B/C/D, IPO, M&A
    amount_usd NUMERIC(15, 2),
    valuation_usd NUMERIC(15, 2),
    announcement_date DATE NOT NULL,
    closing_date DATE,
    lead_investors TEXT[],
    participating_investors TEXT[],
    investor_count INTEGER,
    source VARCHAR(100), -- Crunchbase, PitchBook, Press Release
    press_release_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_funding_company ON funding_rounds(company_id);
CREATE INDEX idx_funding_date ON funding_rounds(announcement_date DESC);
CREATE INDEX idx_funding_type ON funding_rounds(round_type);
CREATE INDEX idx_funding_amount ON funding_rounds(amount_usd DESC);

-- Publications table
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    pmid VARCHAR(50) UNIQUE NOT NULL,
    doi VARCHAR(255),
    title TEXT NOT NULL,
    authors TEXT[],
    corresponding_author VARCHAR(255),
    journal VARCHAR(255),
    journal_impact_factor NUMERIC(5, 3),
    publication_date DATE,
    publication_year INTEGER,
    abstract TEXT,
    keywords TEXT[],
    mesh_terms TEXT[],
    citation_count INTEGER DEFAULT 0,
    sentiment_score NUMERIC(3, 2), -- -1 to 1
    significance_score NUMERIC(3, 2), -- 0 to 1
    full_text_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_publications_company ON publications(company_id);
CREATE INDEX idx_publications_pmid ON publications(pmid);
CREATE INDEX idx_publications_date ON publications(publication_date DESC);
CREATE INDEX idx_publications_journal ON publications(journal);
CREATE INDEX idx_publications_citation_count ON publications(citation_count DESC);

-- Press Releases table
CREATE TABLE press_releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(1000) NOT NULL,
    content TEXT,
    summary TEXT,
    published_date TIMESTAMP NOT NULL,
    url VARCHAR(1000) UNIQUE,
    source VARCHAR(100), -- RSS, Website, PR Newswire
    category VARCHAR(100), -- Product Launch, Partnership, Funding, Clinical Data, Regulatory
    sentiment_score NUMERIC(3, 2),
    key_entities JSONB DEFAULT '{}', -- Extracted entities (people, products, etc.)
    is_material BOOLEAN DEFAULT FALSE, -- Material event flag
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_press_releases_company ON press_releases(company_id);
CREATE INDEX idx_press_releases_date ON press_releases(published_date DESC);
CREATE INDEX idx_press_releases_category ON press_releases(category);
CREATE INDEX idx_press_releases_material ON press_releases(is_material);

-- Company Enrichment table
CREATE TABLE company_enrichment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    linkedin_url VARCHAR(500),
    linkedin_followers INTEGER,
    crunchbase_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    twitter_followers INTEGER,
    facebook_url VARCHAR(500),
    annual_revenue_usd NUMERIC(15, 2),
    funding_total_usd NUMERIC(15, 2),
    tech_stack TEXT[],
    employee_growth_rate NUMERIC(5, 2), -- Percentage
    alexa_rank INTEGER,
    monthly_web_visitors INTEGER,
    company_type VARCHAR(100), -- Private, Public, Subsidiary
    parent_company VARCHAR(255),
    subsidiaries TEXT[],
    competitive_set TEXT[],
    enrichment_date TIMESTAMP DEFAULT NOW(),
    data_sources JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_enrichment_company ON company_enrichment(company_id);
CREATE INDEX idx_enrichment_revenue ON company_enrichment(annual_revenue_usd DESC);

-- Executive Contacts table
CREATE TABLE executive_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    department VARCHAR(100),
    email VARCHAR(255),
    email_pattern VARCHAR(100),
    phone VARCHAR(50),
    linkedin_url VARCHAR(500),
    twitter_handle VARCHAR(100),
    bio TEXT,
    photo_url VARCHAR(500),
    source VARCHAR(100), -- RocketReach, Hunter, LinkedIn
    confidence_score NUMERIC(3, 2), -- 0 to 1
    verified BOOLEAN DEFAULT FALSE,
    last_verified TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_company ON executive_contacts(company_id);
CREATE INDEX idx_contacts_email ON executive_contacts(email);
CREATE INDEX idx_contacts_title ON executive_contacts(title);

-- Patents table (bonus feature)
CREATE TABLE patents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    patent_number VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    filing_date DATE,
    grant_date DATE,
    expiration_date DATE,
    inventors TEXT[],
    assignee VARCHAR(255),
    status VARCHAR(50), -- Granted, Pending, Expired, Abandoned
    classifications TEXT[],
    claims_count INTEGER,
    citations_count INTEGER,
    family_size INTEGER,
    source_url VARCHAR(1000),
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patents_company ON patents(company_id);
CREATE INDEX idx_patents_number ON patents(patent_number);
CREATE INDEX idx_patents_grant_date ON patents(grant_date DESC);

-- ============================================================================
-- MONITORING & ALERTING TABLES
-- ============================================================================

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- fda_approval, trial_failure, funding_round, etc.
    priority VARCHAR(20) NOT NULL, -- critical, high, medium, low
    title VARCHAR(500) NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    action_url VARCHAR(1000),
    sent_to_slack BOOLEAN DEFAULT FALSE,
    sent_to_email BOOLEAN DEFAULT FALSE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_company ON alerts(company_id);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);

-- Workflow Logs table
CREATE TABLE workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- success, partial_success, failure
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_logs_name ON workflow_logs(workflow_name);
CREATE INDEX idx_workflow_logs_status ON workflow_logs(status);
CREATE INDEX idx_workflow_logs_start_time ON workflow_logs(start_time DESC);

-- Data Quality Metrics table
CREATE TABLE data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(10, 4),
    threshold_value NUMERIC(10, 4),
    passed BOOLEAN,
    details JSONB DEFAULT '{}',
    measured_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_quality_table ON data_quality_metrics(table_name);
CREATE INDEX idx_data_quality_metric ON data_quality_metrics(metric_name);
CREATE INDEX idx_data_quality_measured ON data_quality_metrics(measured_at DESC);

-- Scraper State table (for incremental scraping)
CREATE TABLE scraper_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scraper_name VARCHAR(255) UNIQUE NOT NULL,
    last_run_at TIMESTAMP,
    last_success_at TIMESTAMP,
    last_item_id VARCHAR(500),
    last_item_date DATE,
    next_run_scheduled TIMESTAMP,
    state_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scraper_state_name ON scraper_state(scraper_name);
CREATE INDEX idx_scraper_state_next_run ON scraper_state(next_run_scheduled);

-- ============================================================================
-- REPORTING TABLES
-- ============================================================================

-- Generated Reports table
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(100) NOT NULL, -- weekly_summary, monthly_deep_dive, custom
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    generated_by VARCHAR(255),
    file_url VARCHAR(1000),
    file_size_bytes INTEGER,
    pages_count INTEGER,
    companies_covered INTEGER,
    events_covered INTEGER,
    sent_to TEXT[], -- Email addresses
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_type ON generated_reports(report_type);
CREATE INDEX idx_reports_period ON generated_reports(report_period_start DESC);
CREATE INDEX idx_reports_generated ON generated_reports(generated_at DESC);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Company Activity Summary View
CREATE VIEW company_activity_summary AS
SELECT
    c.id,
    c.name,
    c.industry_vertical,
    COUNT(DISTINCT f.id) as fda_approvals_count,
    COUNT(DISTINCT ct.id) as clinical_trials_count,
    COUNT(DISTINCT fr.id) as funding_rounds_count,
    COUNT(DISTINCT p.id) as publications_count,
    COUNT(DISTINCT pr.id) as press_releases_count,
    COALESCE(SUM(fr.amount_usd), 0) as total_funding_usd,
    MAX(f.approval_date) as last_fda_approval_date,
    MAX(pr.published_date) as last_press_release_date
FROM companies c
LEFT JOIN fda_approvals f ON c.id = f.company_id
LEFT JOIN clinical_trials ct ON c.id = ct.company_id
LEFT JOIN funding_rounds fr ON c.id = fr.company_id
LEFT JOIN publications p ON c.id = p.company_id
LEFT JOIN press_releases pr ON c.id = pr.company_id
GROUP BY c.id, c.name, c.industry_vertical;

-- Recent Activity Feed View (last 30 days)
CREATE VIEW recent_activity_feed AS
SELECT
    'FDA Approval' as event_type,
    f.approval_date::TIMESTAMP as event_date,
    c.name as company_name,
    c.id as company_id,
    f.device_name as event_title,
    f.approval_type as event_category,
    f.id as event_id
FROM fda_approvals f
JOIN companies c ON f.company_id = c.id
WHERE f.approval_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT
    'Funding Round' as event_type,
    fr.announcement_date::TIMESTAMP as event_date,
    c.name as company_name,
    c.id as company_id,
    fr.round_type || ' - $' || fr.amount_usd/1000000 || 'M' as event_title,
    fr.round_type as event_category,
    fr.id as event_id
FROM funding_rounds fr
JOIN companies c ON fr.company_id = c.id
WHERE fr.announcement_date >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT
    'Press Release' as event_type,
    pr.published_date as event_date,
    c.name as company_name,
    c.id as company_id,
    pr.title as event_title,
    pr.category as event_category,
    pr.id as event_id
FROM press_releases pr
JOIN companies c ON pr.company_id = c.id
WHERE pr.published_date >= CURRENT_TIMESTAMP - INTERVAL '30 days'

UNION ALL

SELECT
    'Clinical Trial' as event_type,
    ct.start_date::TIMESTAMP as event_date,
    c.name as company_name,
    c.id as company_id,
    ct.title as event_title,
    ct.phase as event_category,
    ct.id as event_id
FROM clinical_trials ct
JOIN companies c ON ct.company_id = c.id
WHERE ct.start_date >= CURRENT_DATE - INTERVAL '30 days'

ORDER BY event_date DESC;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fda_approvals_updated_at BEFORE UPDATE ON fda_approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funding_rounds_updated_at BEFORE UPDATE ON funding_rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_enrichment_updated_at BEFORE UPDATE ON company_enrichment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_contacts_updated_at BEFORE UPDATE ON executive_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraper_state_updated_at BEFORE UPDATE ON scraper_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample company
INSERT INTO companies (name, website, industry_vertical, description) VALUES
('Medtronic', 'https://www.medtronic.com', 'Cardiovascular', 'Global leader in medical technology'),
('Abbott Laboratories', 'https://www.abbott.com', 'Diagnostics', 'Healthcare products and diagnostics'),
('Boston Scientific', 'https://www.bostonscientific.com', 'Interventional Medicine', 'Medical devices for interventional medicine');

-- Insert sample scraper states
INSERT INTO scraper_state (scraper_name, state_data) VALUES
('fda_510k_scraper', '{"last_page": 0}'),
('clinicaltrials_monitor', '{"last_check": null}'),
('crunchbase_funding', '{"last_sync": null}'),
('pubmed_research', '{"last_pmid": null}'),
('rss_monitor', '{"feeds": []}');

-- ============================================================================
-- PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Create composite indexes for common queries
CREATE INDEX idx_fda_company_date ON fda_approvals(company_id, approval_date DESC);
CREATE INDEX idx_trials_company_status ON clinical_trials(company_id, status);
CREATE INDEX idx_funding_company_date ON funding_rounds(company_id, announcement_date DESC);

-- Analyze tables for query planner
ANALYZE companies;
ANALYZE fda_approvals;
ANALYZE clinical_trials;
ANALYZE funding_rounds;
ANALYZE publications;
ANALYZE press_releases;

COMMIT;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
