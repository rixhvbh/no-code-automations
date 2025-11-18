# Retool Dashboard Setup Guide
## Medical Device Competitive Intelligence Platform

This guide walks through setting up the Retool dashboard for the MedTech Intelligence Platform.

---

## Prerequisites

1. **Retool Account**: Sign up at https://retool.com
2. **Database Access**: PostgreSQL connection string
3. **API Keys**: For REST API endpoints (if using custom API)

---

## Database Resource Configuration

### Step 1: Add PostgreSQL Resource

1. Go to **Resources** > **Create New** > **PostgreSQL**
2. Configure connection:
   ```
   Name: MedTech Intelligence DB
   Host: your-postgres-host.com
   Port: 5432
   Database: medtech_intel
   Username: medtech_user
   Password: [your-secure-password]
   SSL Mode: require
   ```
3. Click **Test Connection** > **Create Resource**

---

## Dashboard Pages

### Page 1: Company Overview Dashboard

**Purpose**: Search, filter, and view high-level company metrics

#### Components:

**1. Search & Filter Section**
- **Text Input**: Company name search
  - Name: `companySearchInput`
  - Placeholder: "Search companies..."

- **Select**: Industry filter
  - Name: `industryFilter`
  - Options Query:
    ```sql
    SELECT DISTINCT industry_vertical
    FROM companies
    ORDER BY industry_vertical
    ```

**2. Companies Table**
- **Name**: `companiesTable`
- **Query**: `getCompanies`
  ```sql
  SELECT
    c.id,
    c.name,
    c.industry_vertical,
    c.employee_count,
    c.headquarters_location,
    COALESCE(ce.annual_revenue_usd, 0) as revenue,
    COALESCE(SUM(fr.amount_usd), 0) as total_funding,
    COUNT(DISTINCT f.id) as fda_approvals_count,
    COUNT(DISTINCT ct.id) as clinical_trials_count
  FROM companies c
  LEFT JOIN company_enrichment ce ON c.id = ce.company_id
  LEFT JOIN funding_rounds fr ON c.id = fr.company_id
  LEFT JOIN fda_approvals f ON c.id = f.company_id
  LEFT JOIN clinical_trials ct ON c.id = ct.company_id
  WHERE
    ({{ companySearchInput.value }} = '' OR c.name ILIKE '%' || {{ companySearchInput.value }} || '%')
    AND ({{ industryFilter.value }} = '' OR c.industry_vertical = {{ industryFilter.value }})
  GROUP BY c.id, ce.annual_revenue_usd
  ORDER BY c.name
  LIMIT 100
  ```

- **Columns**:
  - Company Name (link to detail page)
  - Industry
  - Location
  - Revenue (formatted as currency)
  - Total Funding (formatted as currency)
  - FDA Approvals Count
  - Clinical Trials Count
  - Employee Count

**3. Summary Statistics Cards**
- **Total Companies**:
  ```sql
  SELECT COUNT(*) as count FROM companies
  ```

- **Total FDA Approvals (Last 30 Days)**:
  ```sql
  SELECT COUNT(*) as count
  FROM fda_approvals
  WHERE approval_date >= CURRENT_DATE - INTERVAL '30 days'
  ```

- **Active Clinical Trials**:
  ```sql
  SELECT COUNT(*) as count
  FROM clinical_trials
  WHERE status IN ('RECRUITING', 'ACTIVE_NOT_RECRUITING')
  ```

- **Total Funding (YTD)**:
  ```sql
  SELECT COALESCE(SUM(amount_usd), 0) as total
  FROM funding_rounds
  WHERE announcement_date >= DATE_TRUNC('year', CURRENT_DATE)
  ```

---

### Page 2: FDA Approvals Tracker

**Purpose**: Monitor FDA device approvals with timeline visualization

#### Components:

**1. Date Range Selector**
- **Name**: `dateRangePicker`
- **Default**: Last 90 days

**2. Approval Type Filter**
- **Name**: `approvalTypeFilter`
- **Options**: ["All", "510k", "PMA", "De Novo"]

**3. Timeline Chart**
- **Type**: Line Chart
- **Query**: `fdaApprovalsTimeline`
  ```sql
  SELECT
    DATE_TRUNC('week', approval_date) as week,
    approval_type,
    COUNT(*) as count
  FROM fda_approvals
  WHERE approval_date BETWEEN {{ dateRangePicker.value.start }} AND {{ dateRangePicker.value.end }}
  AND ({{ approvalTypeFilter.value }} = 'All' OR approval_type = {{ approvalTypeFilter.value }})
  GROUP BY week, approval_type
  ORDER BY week
  ```
- **X-Axis**: week
- **Y-Axis**: count
- **Group By**: approval_type

**4. Recent Approvals Table**
- **Query**: `recentFDAApprovals`
  ```sql
  SELECT
    f.approval_date,
    c.name as company_name,
    f.device_name,
    f.approval_type,
    f.fda_number,
    f.decision,
    f.source_url
  FROM fda_approvals f
  JOIN companies c ON f.company_id = c.id
  WHERE f.approval_date BETWEEN {{ dateRangePicker.value.start }} AND {{ dateRangePicker.value.end }}
  AND ({{ approvalTypeFilter.value }} = 'All' OR f.approval_type = {{ approvalTypeFilter.value }})
  ORDER BY f.approval_date DESC
  LIMIT 50
  ```

**5. Top Companies by Approvals**
- **Type**: Bar Chart
- **Query**: `topCompaniesByApprovals`
  ```sql
  SELECT
    c.name,
    COUNT(*) as approval_count
  FROM fda_approvals f
  JOIN companies c ON f.company_id = c.id
  WHERE f.approval_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY c.name
  ORDER BY approval_count DESC
  LIMIT 10
  ```

---

### Page 3: Clinical Trials Monitor

**Purpose**: Track clinical trial activity and status changes

#### Components:

**1. Trial Status Distribution**
- **Type**: Pie Chart
- **Query**:
  ```sql
  SELECT
    status,
    COUNT(*) as count
  FROM clinical_trials
  GROUP BY status
  ORDER BY count DESC
  ```

**2. Trials by Phase**
- **Type**: Donut Chart
- **Query**:
  ```sql
  SELECT
    phase,
    COUNT(*) as count
  FROM clinical_trials
  WHERE phase IS NOT NULL
  GROUP BY phase
  ORDER BY phase
  ```

**3. Active Trials Table**
- **Query**:
  ```sql
  SELECT
    ct.nct_id,
    c.name as company_name,
    ct.title,
    ct.phase,
    ct.status,
    ct.enrollment,
    ct.start_date,
    ct.completion_date,
    'https://clinicaltrials.gov/study/' || ct.nct_id as trial_url
  FROM clinical_trials ct
  JOIN companies c ON ct.company_id = c.id
  WHERE ct.status IN ('RECRUITING', 'ACTIVE_NOT_RECRUITING', 'ENROLLING_BY_INVITATION')
  ORDER BY ct.start_date DESC
  LIMIT 100
  ```

**4. Trial Success Rate Analysis**
- **Type**: Stacked Bar Chart
- **Query**:
  ```sql
  SELECT
    phase,
    status,
    COUNT(*) as count
  FROM clinical_trials
  WHERE phase IS NOT NULL
  GROUP BY phase, status
  ORDER BY phase, status
  ```

---

### Page 4: Funding Intelligence

**Purpose**: Track funding rounds and investment trends

#### Components:

**1. Funding Timeline**
- **Type**: Area Chart
- **Query**:
  ```sql
  SELECT
    DATE_TRUNC('month', announcement_date) as month,
    round_type,
    SUM(amount_usd) as total_amount
  FROM funding_rounds
  WHERE announcement_date >= CURRENT_DATE - INTERVAL '2 years'
  AND amount_usd IS NOT NULL
  GROUP BY month, round_type
  ORDER BY month
  ```

**2. Top Funded Companies**
- **Type**: Table with sparklines
- **Query**:
  ```sql
  SELECT
    c.name,
    COUNT(fr.id) as round_count,
    SUM(fr.amount_usd) as total_funding,
    MAX(fr.announcement_date) as last_round_date,
    ARRAY_AGG(fr.round_type ORDER BY fr.announcement_date) as round_types,
    ARRAY_AGG(fr.amount_usd ORDER BY fr.announcement_date) as amounts
  FROM companies c
  JOIN funding_rounds fr ON c.id = fr.company_id
  WHERE fr.amount_usd IS NOT NULL
  GROUP BY c.id, c.name
  ORDER BY total_funding DESC
  LIMIT 20
  ```

**3. Investment Heatmap**
- **Type**: Calendar Heatmap
- **Query**:
  ```sql
  SELECT
    announcement_date as date,
    COUNT(*) as count,
    SUM(amount_usd) as total_amount
  FROM funding_rounds
  WHERE announcement_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY announcement_date
  ORDER BY announcement_date
  ```

**4. Investor Network**
- **Type**: Table
- **Query**:
  ```sql
  SELECT
    investor,
    COUNT(*) as investment_count,
    SUM(fr.amount_usd) as total_invested
  FROM funding_rounds fr,
  LATERAL unnest(fr.lead_investors) as investor
  WHERE fr.announcement_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY investor
  ORDER BY investment_count DESC
  LIMIT 30
  ```

---

### Page 5: Competitive Landscape

**Purpose**: Visualize competitive positioning and technology overlap

#### Components:

**1. Company Clustering Visualization**
- **Type**: Scatter Plot
- **Query**:
  ```sql
  SELECT
    c.name,
    c.industry_vertical,
    COALESCE(ce.annual_revenue_usd, 0) as revenue,
    COALESCE(ce.employee_count, c.employee_count, 0) as employees,
    COUNT(DISTINCT f.id) as fda_approvals,
    COUNT(DISTINCT ct.id) as clinical_trials
  FROM companies c
  LEFT JOIN company_enrichment ce ON c.id = ce.company_id
  LEFT JOIN fda_approvals f ON c.id = f.company_id
  LEFT JOIN clinical_trials ct ON c.id = ct.company_id
  GROUP BY c.id, ce.annual_revenue_usd, ce.employee_count
  ```
- **X-Axis**: revenue (log scale)
- **Y-Axis**: employees
- **Size**: fda_approvals + clinical_trials
- **Color**: industry_vertical

**2. Technology Stack Comparison**
- **Type**: Tag Cloud / List Group
- **Query**:
  ```sql
  SELECT
    tech,
    COUNT(*) as company_count
  FROM company_enrichment,
  LATERAL unnest(tech_stack) as tech
  GROUP BY tech
  ORDER BY company_count DESC
  LIMIT 50
  ```

**3. Market Positioning Matrix**
- **Type**: Quadrant Chart
- **Query**:
  ```sql
  SELECT
    c.name,
    COUNT(DISTINCT f.id) as innovation_score,
    COALESCE(SUM(fr.amount_usd), 0) / 1000000 as funding_millions
  FROM companies c
  LEFT JOIN fda_approvals f ON c.id = f.company_id
    AND f.approval_date >= CURRENT_DATE - INTERVAL '2 years'
  LEFT JOIN funding_rounds fr ON c.id = fr.company_id
    AND fr.announcement_date >= CURRENT_DATE - INTERVAL '2 years'
  GROUP BY c.id, c.name
  HAVING COUNT(DISTINCT f.id) > 0 OR COALESCE(SUM(fr.amount_usd), 0) > 0
  ```

---

### Page 6: Alerts & Activity Feed

**Purpose**: Real-time monitoring of critical events

#### Components:

**1. Alert Stream**
- **Type**: List with auto-refresh (every 30 seconds)
- **Query**:
  ```sql
  SELECT
    a.id,
    a.created_at,
    a.priority,
    a.alert_type,
    a.title,
    a.description,
    c.name as company_name,
    a.action_url,
    a.acknowledged,
    a.acknowledged_by
  FROM alerts a
  LEFT JOIN companies c ON a.company_id = c.id
  WHERE a.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  ORDER BY a.created_at DESC, a.priority DESC
  LIMIT 100
  ```

**2. Priority Filter**
- **Name**: `priorityFilter`
- **Options**: ["All", "critical", "high", "medium", "low"]

**3. Acknowledge Button**
- **Action**: Update alert as acknowledged
  ```sql
  UPDATE alerts
  SET
    acknowledged = true,
    acknowledged_by = {{ current_user.email }},
    acknowledged_at = NOW()
  WHERE id = {{ alertsTable.selectedRow.id }}
  ```

**4. Recent Activity Timeline**
- **Type**: Timeline Component
- **Query**:
  ```sql
  SELECT * FROM recent_activity_feed
  ORDER BY event_date DESC
  LIMIT 50
  ```

---

### Page 7: Reports & Exports

**Purpose**: Access generated reports and create custom exports

#### Components:

**1. Generated Reports Table**
- **Query**:
  ```sql
  SELECT
    id,
    report_type,
    report_period_start,
    report_period_end,
    generated_at,
    file_url,
    companies_covered,
    events_covered
  FROM generated_reports
  ORDER BY generated_at DESC
  LIMIT 50
  ```

**2. Download Report Button**
- **Action**: Open `file_url` in new tab

**3. Custom Export Builder**
- **Components**:
  - Date range picker
  - Entity type selector (Companies, FDA Approvals, Trials, etc.)
  - Format selector (CSV, JSON, Excel)
  - Export button

- **Export Query**:
  ```sql
  -- Dynamic based on selections
  -- Example for FDA Approvals:
  SELECT * FROM fda_approvals
  WHERE approval_date BETWEEN {{ exportDateRange.start }} AND {{ exportDateRange.end }}
  ```

**4. Scheduled Reports List**
- **Query**:
  ```sql
  SELECT
    workflow_name,
    last_run_at,
    last_success_at,
    next_run_scheduled
  FROM scraper_state
  WHERE workflow_name LIKE '%report%'
  ```

---

## Styling & Branding

### Color Scheme

```
Primary: #3498db (Blue)
Secondary: #2c3e50 (Dark Blue)
Success: #27ae60 (Green)
Warning: #f39c12 (Orange)
Danger: #e74c3c (Red)
Info: #1abc9c (Teal)
Background: #ecf0f1 (Light Gray)
Text: #2c3e50 (Dark)
```

### Custom CSS

```css
/* Apply to dashboard container */
.retool-dashboard {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
}

/* Card styling */
.metric-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Priority badges */
.priority-critical {
  background: #e74c3c;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.priority-high {
  background: #f39c12;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.priority-medium {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}

.priority-low {
  background: #95a5a6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}
```

---

## User Permissions

### Roles

**1. Admin**
- Full access to all pages
- Can acknowledge alerts
- Can trigger manual exports
- Can view system logs

**2. Analyst**
- Read access to all dashboards
- Can acknowledge alerts
- Can create custom exports
- Cannot access system logs

**3. Viewer**
- Read-only access to dashboards
- Cannot acknowledge alerts
- Cannot create exports

---

## Mobile Responsiveness

Ensure all pages are optimized for tablet viewing:
- Use responsive grid layouts
- Stack components vertically on small screens
- Reduce table columns for mobile
- Use collapsible sections for detailed data

---

## Performance Optimization

1. **Query Caching**: Enable 5-minute cache for heavy queries
2. **Pagination**: Limit initial results to 100 rows
3. **Lazy Loading**: Load charts on-demand
4. **Indexes**: Ensure database has proper indexes (see schema.sql)

---

## Integration with n8n Workflows

### Webhook Endpoints

**Trigger Manual Enrichment**:
```javascript
// Button click event
const response = await fetch('https://n8n.yourdomain.com/webhook/enrich-company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_id: {{ companiesTable.selectedRow.id }},
    company_name: {{ companiesTable.selectedRow.name }},
    company_website: {{ companiesTable.selectedRow.website }}
  })
});
```

**Send Custom Alert**:
```javascript
await fetch('https://n8n.yourdomain.com/webhook/send-alert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    alert_type: 'custom',
    priority: 'medium',
    title: {{ alertTitleInput.value }},
    description: {{ alertDescriptionInput.value }},
    company_id: {{ companiesTable.selectedRow.id }}
  })
});
```

---

## Deployment Checklist

- [ ] Database resource configured and tested
- [ ] All 7 pages created with components
- [ ] Queries tested and optimized
- [ ] Custom CSS applied
- [ ] User roles and permissions set
- [ ] Mobile responsiveness verified
- [ ] n8n webhook integrations tested
- [ ] Dashboard published and shared with team

---

## Support & Maintenance

- **Query Performance**: Monitor slow queries in Retool's performance tab
- **User Feedback**: Collect feedback via in-app feedback button
- **Updates**: Review and update queries monthly as data grows
- **Backups**: Retool automatically backs up dashboard configurations

---

**Last Updated**: 2025-11-18
**Version**: 1.0
