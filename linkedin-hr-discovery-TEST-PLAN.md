# LinkedIn HR Contact Discovery - Test Plan

## Test Payloads

### **Test Case 1: Standard Tech Company (Expected Success)**
```json
{
  "linkedin_company_url": "https://www.linkedin.com/company/anthropic/",
  "job_title_filters": ["recruiter", "talent acquisition", "hr manager", "human resources"],
  "min_quality_score": 60,
  "batch_size": 5,
  "hot_threshold": 80,
  "warm_threshold": 60
}
```
**Expected Outcome**:
- ✅ Extract company ID: `anthropic`
- ✅ Proxycurl returns 10-50 employees
- ✅ Filter finds 5-15 HR-related profiles
- ✅ Process in batches of 5
- ✅ Hunter.io finds 60%+ emails
- ✅ NeverBounce verifies 70%+ as valid
- ✅ Quality scores range 40-95
- ✅ 3-8 hot leads saved to sheet
- ✅ 5-10 warm leads saved to sheet
- ✅ Slack notification sent with summary
- ✅ Activity log entry created
- ✅ Response returned with counts and execution time

---

### **Test Case 2: Small Startup (Low Email Discovery Rate)**
```json
{
  "linkedin_company_url": "https://www.linkedin.com/company/small-startup-inc/",
  "job_title_filters": ["recruiter", "people operations", "talent"],
  "min_quality_score": 50,
  "batch_size": 3,
  "hot_threshold": 75,
  "warm_threshold": 50
}
```
**Expected Outcome**:
- ✅ Extract company ID: `small-startup-inc`
- ✅ Proxycurl returns 5-10 employees
- ✅ Filter finds 1-3 HR profiles (may be limited)
- ⚠️ Hunter.io may fail to find emails (30% success rate)
- ✅ Email pattern generation triggers for 70% of leads
- ⚠️ NeverBounce marks many as "unknown" or "catchall"
- ✅ Quality scores lower (30-70 range)
- ✅ 0-2 hot leads
- ✅ 2-5 warm leads
- ✅ Workflow completes successfully despite low email discovery
- ✅ Response includes breakdown showing email generation fallback usage

---

### **Test Case 3: Enterprise Company (High Volume)**
```json
{
  "linkedin_company_url": "https://www.linkedin.com/company/microsoft/",
  "job_title_filters": ["recruiter", "talent acquisition"],
  "min_quality_score": 70,
  "batch_size": 10,
  "hot_threshold": 85,
  "warm_threshold": 70
}
```
**Expected Outcome**:
- ✅ Extract company ID: `microsoft`
- ✅ Proxycurl returns 50+ employees (pagination may be needed)
- ✅ Filter finds 20-40 HR profiles
- ✅ Process in batches of 10
- ✅ High email discovery rate (80%+)
- ✅ High verification success (75%+)
- ✅ Quality scores skewed higher due to company size bonus
- ✅ 10-20 hot leads
- ✅ 15-25 warm leads
- ⏱️ Longer execution time (60-120 seconds)
- ✅ Rate limiting respected (3x retries with backoff)
- ✅ All API calls stay within limits

---

### **Test Case 4: Invalid Input (Error Handling)**
```json
{
  "linkedin_company_url": "https://example.com/not-a-linkedin-url",
  "batch_size": 5
}
```
**Expected Outcome**:
- ❌ Validation fails at "Validate Input" node
- ❌ Error: "Invalid LinkedIn company URL format"
- ✅ Returns 400 status code
- ✅ Error message clear and actionable
- ✅ No downstream API calls made
- ✅ Activity log records failure

---

### **Test Case 5: Company with No HR Employees**
```json
{
  "linkedin_company_url": "https://www.linkedin.com/company/solo-consulting-firm/",
  "job_title_filters": ["recruiter", "hr manager"],
  "min_quality_score": 60
}
```
**Expected Outcome**:
- ✅ Extract company ID: `solo-consulting-firm`
- ✅ Proxycurl returns 1-5 employees
- ⚠️ Filter finds 0 HR profiles
- ✅ Workflow completes without errors
- ✅ 0 hot leads
- ✅ 0 warm leads
- ✅ Slack notification: "0 total leads found"
- ✅ Activity log shows successful completion with 0 results
- ✅ Response: `{"total_processed": 0, "hot_count": 0, ...}`

---

## Explicit Assumptions

### Data Quality Assumptions:
1. **Proxycurl Data Freshness**: Assumes Proxycurl profiles are updated within 180 days
2. **Email Pattern Accuracy**: Generated email patterns follow common conventions (first.last@domain)
3. **Company Domain Extraction**: Assumes company domain can be inferred from LinkedIn company slug
4. **HR Role Detection**: Keyword matching is sufficient for 85%+ accuracy in identifying HR roles

### API Rate Limit Assumptions:
1. **Proxycurl**: 300 requests/month on free tier; 10 requests/minute
2. **Hunter.io**: 50 requests/month on free tier; burst of 10/second
3. **NeverBounce**: 1,000 credits/month; 10 requests/second
4. **Apollo.io**: 50 requests/month on free tier; 1 request/second
5. **Batch Size of 5**: Designed to stay well below rate limits with retry logic

### Workflow Behavior Assumptions:
1. **Sequential Batch Processing**: Each batch of 5 completes before next batch starts
2. **Partial Success Handling**: Individual lead failures don't halt entire workflow
3. **Email Fallback Priority**: Hunter.io → Email pattern generation → NeverBounce verification
4. **Scoring Fairness**: All leads processed with same scoring criteria regardless of discovery method

### Data Storage Assumptions:
1. **Google Sheets Quota**: Assumes 500 writes/day is sufficient
2. **Sheet Pre-Existence**: Hot Leads, Warm/Cold Leads, and Activity Log sheets exist with headers
3. **No Duplicate Prevention**: Workflow may create duplicate entries if run multiple times on same company

---

## Open Human Questions

### Business Logic Clarifications:
1. **Q**: Should we implement deduplication logic to prevent re-processing the same company within X days?
   - **Impact**: Could reduce API costs and prevent duplicate leads

2. **Q**: What is the desired behavior when Proxycurl returns 100+ HR employees?
   - **Options**:
     - A) Process all (high API cost)
     - B) Limit to top 50 by seniority
     - C) Ask user to specify max_leads parameter

3. **Q**: Should leads with "catchall" email verification be treated as warm or discarded?
   - **Current**: Scores them at 15/30 points (vs 30 for valid)
   - **Alternative**: Could add specific "catchall" tier

4. **Q**: How should we handle profile data that's >180 days old?
   - **Current**: Reduces score by 4-5 points
   - **Alternative**: Could flag as "stale" or skip entirely

5. **Q**: Should the workflow send a failure notification if 0 HR employees are found?
   - **Current**: Sends success notification with 0 counts
   - **Alternative**: Send Slack warning or skip notification

### Technical Clarifications:
6. **Q**: What should happen if Google Sheets write fails due to quota limits?
   - **Current**: Error logged, workflow continues
   - **Alternative**: Implement queue/retry mechanism or CSV export fallback

7. **Q**: Should we implement webhook authentication for production security?
   - **Current**: Open webhook endpoint
   - **Recommendation**: Add API key header validation

8. **Q**: How should the workflow handle Proxycurl "cache vs live" data preference?
   - **Current**: Uses `fallback_to_cache: on-error` and `use_cache: if-present`
   - **Alternative**: Force live data only (higher cost, fresher data)

---

## Top 3 Production Failure Modes & Mitigations

### **1. API Rate Limit Exhaustion**
**Failure Scenario**:
- Workflow triggered for large company (500+ employees)
- Proxycurl rate limit hit after 50 profile fetches
- Workflow fails midway, leaving partial results

**Symptoms**:
- HTTP 429 responses from Proxycurl
- Workflow execution stalls at "Proxycurl Fetch Profile" node
- No leads saved to sheets despite starting successfully

**Mitigation Steps**:
✅ **Implemented**:
- 3 retry attempts with exponential backoff (2s, 4s, 8s)
- Batch size limited to 5 (respects rate limits)
- Timeout handling (20-30s per request)

🔧 **Additional Recommendations**:
- Add rate limit monitoring (track API usage per day)
- Implement queue system for large companies (process across multiple days)
- Add workflow pause/resume capability using n8n's built-in features
- Show progress in Slack notifications (e.g., "Processing batch 3 of 10")

---

### **2. Email Discovery Complete Failure**
**Failure Scenario**:
- Hunter.io API down or quota exceeded
- All email pattern generation fails NeverBounce verification
- 100% of leads have no verified email, resulting in quality scores <40

**Symptoms**:
- All leads marked as "discard" (score < 60)
- 0 hot leads, 0 warm leads
- User receives notification: "Total: 50, Hot: 0, Warm: 0, Discarded: 50"

**Mitigation Steps**:
✅ **Implemented**:
- Email pattern generation fallback when Hunter fails
- Scoring still awards points for LinkedIn URL, seniority, company size
- Workflow completes successfully even with 0 emails found

🔧 **Additional Recommendations**:
- Lower min_quality_score threshold to 40 for email-less profiles in specific scenarios
- Add "Email Pending" tier for high-potential leads without verified emails
- Implement secondary email discovery (e.g., RocketReach, Clearbit as backup)
- Store leads without emails in separate "Manual Research" sheet for human follow-up

---

### **3. Google Sheets Write Failure (Data Loss)**
**Failure Scenario**:
- Google Sheets API quota exceeded (500 writes/day)
- OAuth token expired or revoked
- Sheet ID environment variable incorrect
- Workflow processes 30 leads successfully but fails to save any

**Symptoms**:
- HTTP 403/429 from Google Sheets API
- Error in Activity Log: "Failed to write to sheet"
- Leads processed but not stored = **complete data loss**

**Mitigation Steps**:
✅ **Implemented**:
- Error handling with try-catch in critical nodes
- Activity log captures errors
- Slack notification includes success/failure status

🔧 **Additional Recommendations**:
- **CRITICAL**: Add CSV export fallback when Sheets write fails
  - Store results in n8n's internal storage or S3
  - Attach CSV to Slack notification or email to user
- Implement write batching (append 10 rows at once vs 1 row per lead)
- Add pre-flight check: Test Sheets connection before processing leads
- Set up monitoring alerts for OAuth token expiration
- Create backup sheet destination (write to Sheet A and B in parallel)

---

### **Bonus: Credential Management Failure**
**Failure Scenario**:
- API key for Proxycurl rotated/expired
- User forgets to update credential in n8n
- Workflow starts but immediately fails on first Proxycurl call

**Mitigation**:
- Add credential validation node at workflow start (test API call with dummy data)
- Fail fast with clear error message: "Proxycurl API key invalid - please update credentials"
- Prevent processing until credentials verified

---

## Pre-Production Checklist

### Credentials Setup:
- [ ] Proxycurl API key configured in n8n credentials
- [ ] Hunter.io API key configured
- [ ] NeverBounce API key configured
- [ ] Apollo.io API key configured
- [ ] Google Sheets OAuth2 connected and tested
- [ ] Slack Webhook URL configured

### Google Sheets Setup:
- [ ] Create "Hot Leads" sheet with headers: Name, Title, Company, Email, Phone, LinkedIn, Quality Score, Seniority, HR Role, Timestamp
- [ ] Create "Warm Cold Leads" sheet with headers: Name, Title, Company, Email, Phone, LinkedIn, Quality Score, Tier, Notes, Timestamp
- [ ] Create "Activity Log" sheet with headers: Request ID, Timestamp, Workflow, Status, Company URL, Total Leads, Hot, Warm, Cold, Discarded, Execution Time, Errors
- [ ] Set sheet IDs in environment variables

### Environment Variables:
- [ ] `GOOGLE_SHEETS_HOT_LEADS_ID`
- [ ] `GOOGLE_SHEETS_WARM_COLD_LEADS_ID`
- [ ] `GOOGLE_SHEETS_ACTIVITY_LOG_ID`
- [ ] `SLACK_WEBHOOK_URL` (optional but recommended)

### Testing:
- [ ] Test with sample company (5-10 employees)
- [ ] Verify email discovery working
- [ ] Verify NeverBounce validation
- [ ] Check Google Sheets writes
- [ ] Confirm Slack notification format
- [ ] Test error scenarios (invalid URL, API failure)

### Monitoring:
- [ ] Set up n8n execution monitoring
- [ ] Configure alerts for workflow failures
- [ ] Track API usage per service (stay within quotas)

---

## Performance Benchmarks

### Expected Execution Times:
- **Small company (5-10 employees)**: 20-40 seconds
- **Medium company (20-50 employees)**: 60-120 seconds
- **Large company (100+ employees)**: 180-300 seconds

### API Call Counts per Lead:
- Proxycurl: 2 calls (1 company + 1 profile per lead)
- Hunter.io: 1 call per lead
- NeverBounce: 1-2 calls per lead (depends on email discovery success)
- Apollo.io: 1 call per lead
- **Total**: ~5-6 API calls per lead

### Cost Estimate (per 100 leads):
- Proxycurl: $15-30 (based on pricing tier)
- Hunter.io: $0-5 (within free tier for 100 requests)
- NeverBounce: $5-10 (bulk pricing)
- Apollo.io: $0-5 (within free tier)
- **Total**: ~$25-50 per 100 HR contacts discovered

---

## Workflow Version History

**v1.0.0** - Initial Production Release
- 24-node architecture
- Full HR contact discovery pipeline
- Email discovery with fallback patterns
- Quality scoring (0-100 scale)
- Hot/warm/cold tiering
- Google Sheets storage
- Slack notifications
- Activity logging
