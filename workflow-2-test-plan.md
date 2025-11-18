# Test Plan: Email Finder & Multi-Provider Verification Pipeline

## Test Environment Setup

### Required Credentials
- [ ] Hunter.io API Key (Free tier: 50 searches/month, 50 verifications/month)
- [ ] NeverBounce API Key (Free tier: 1000 credits)
- [ ] Debounce.io API Key (Free tier: 100 verifications)
- [ ] Proxycurl API Key (optional for LinkedIn enrichment)
- [ ] Google Sheets OAuth2 credentials
- [ ] CRM webhook endpoint URL

### Test Data Preparation
- Google Sheet for verified contacts (columns: email, company_name, job_title, confidence_score, quality_tag, verified_by_count, flags, created_at)
- Google Sheet for activity logging
- Google Sheet for error logging
- CRM endpoint configured to receive POST requests

---

## Test Case 1: Happy Path - Single Company with Valid Email

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "Google",
      "job_title": "HR Manager",
      "first_name": "Jane",
      "last_name": "Smith"
    }
  ]
}
```

### Expected Outcome
- **Status**: 200 OK
- **Response Structure**:
```json
{
  "success": true,
  "summary": {
    "total_emails_processed": 8,
    "verified_emails": 1-3,
    "success_rate": "12.5% - 37.5%",
    "avg_confidence_score": "85-100",
    "premium_contacts": 0-3,
    "good_contacts": 0-3
  },
  "verified_contacts": [
    {
      "email": "jane.smith@google.com",
      "company": "Google",
      "job_title": "HR Manager",
      "confidence_score": 85-100,
      "quality_tag": "Good or Premium",
      "verified_by_count": 2-3
    }
  ]
}
```
- **Side Effects**:
  - 1+ rows added to Verified Contacts sheet
  - 1+ rows added to Activity Log
  - 1+ POST requests to CRM endpoint

### Assumptions
- Google.com domain is easily resolvable
- jane.smith@google.com is a valid email pattern
- At least 2 of 3 providers return "valid" status

---

## Test Case 2: Batch Processing - 20 Companies

### Input Payload
```json
{
  "companies": [
    {"company_name": "Microsoft", "job_title": "Recruiter", "first_name": "John", "last_name": "Doe"},
    {"company_name": "Amazon", "job_title": "Talent Acquisition", "first_name": "Sarah", "last_name": "Lee"},
    {"company_name": "Facebook", "job_title": "HR Manager", "first_name": "Mike", "last_name": "Johnson"},
    // ... 17 more companies
  ]
}
```

### Expected Outcome
- **Processing Time**: 4-6 minutes (due to batching and rate limits)
- **Total Emails Generated**: ~160 (20 companies × 8 patterns)
- **Expected Verified**: 20-60 emails (depending on pattern accuracy)
- **Success Rate**: 12.5% - 37.5%
- **Batch Behavior**:
  - Companies processed in 2 batches of 10
  - Emails verified in batches of 5 with 2-second waits
- **Google Sheet**: 20-60 rows added to Verified Contacts

### Assumptions
- All companies have publicly known domains
- First/last names are generic placeholders
- Provider rate limits not exceeded

---

## Test Case 3: Invalid Input - Missing Required Fields

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "Tesla"
      // Missing job_title
    },
    {
      "job_title": "HR Manager"
      // Missing company_name
    }
  ]
}
```

### Expected Outcome
- **Status**: 500 Error
- **Error Message**: "No valid companies found. Errors: [...]"
- **Validation Errors**:
```json
{
  "validation_errors": [
    {"index": 0, "error": "job_title is required"},
    {"index": 1, "error": "company_name is required"}
  ]
}
```
- **No Data Written**: Workflow stops at validation, no sheets updated

---

## Test Case 4: Provider Failure Fallback - 1 Provider Down

### Scenario Setup
- Simulate Hunter.io API returning 500 error
- NeverBounce and Debounce continue normally

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "Stripe",
      "job_title": "Technical Recruiter",
      "first_name": "Alex",
      "last_name": "Chen"
    }
  ]
}
```

### Expected Outcome
- **Workflow Continues**: Does not fail completely
- **Scoring Adjusted**: Maximum possible score = 65 (NeverBounce 35 + Debounce 30)
- **Verified Emails**: Filtered at >= 85% threshold may return 0 results
- **Error Log**: 1 entry for Hunter.io provider failure
- **Response**: Success with reduced verified count

### Assumptions
- onError: "continueErrorOutput" setting works correctly
- Consensus algorithm handles missing provider data gracefully

---

## Test Case 5: Catch-All Domain Detection

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "SmallStartup",
      "job_title": "HR",
      "first_name": "Random",
      "last_name": "Person"
    }
  ]
}
```

### Expected Outcome
- **Catch-All Flag**: Detected by Hunter.io or NeverBounce
- **Score Deduction**: -15 points applied
- **Final Score**: Likely 50-70 (below 85 threshold)
- **Filtered Out**: Email does not appear in verified_contacts
- **Response**: success_rate = "0%", verified_emails = 0

---

## Test Case 6: Disposable Email Detection

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "mailinator",
      "job_title": "Test",
      "first_name": "test",
      "last_name": "user"
    }
  ]
}
```

### Expected Outcome
- **Disposable Flag**: Detected by providers
- **Severe Deduction**: -50 points
- **Final Score**: 0-20 (well below threshold)
- **Filtered Out**: Not included in results
- **Flags Field**: "disposable"

---

## Test Case 7: No First/Last Name Provided

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "IBM",
      "job_title": "HR Manager"
    }
  ]
}
```

### Expected Outcome
- **Default Names Used**: "john" and "doe"
- **Email Patterns Generated**: john.doe@ibm.com, john@ibm.com, etc.
- **Low Verification Rate**: Likely 0% (invalid guesses)
- **No Errors**: Workflow completes successfully
- **Response**: verified_emails = 0

### Assumptions
- Generate Email Patterns function uses fallback defaults

---

## Test Case 8: Domain Not Found

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "NonexistentCompany12345XYZ",
      "job_title": "HR",
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}
```

### Expected Outcome
- **Hunter Domain Search**: Returns empty or 404
- **Fallback Domain**: Constructed as "nonexistentcompany12345xyz.com"
- **Email Patterns Generated**: 8 patterns with fallback domain
- **Verification Fails**: All providers return "invalid"
- **Score**: 0 across all emails
- **Filtered Out**: No emails in final results
- **Activity Log**: Entry showing 0 verified

---

## Test Case 9: Rate Limit Compliance

### Monitoring Points
- Wait nodes execute 2-second delays between batches
- Batch size limits: 10 companies, 5 emails
- API timeout: 10 seconds per request
- Parallel calls: 3 providers simultaneously

### Expected Behavior
- **No Rate Limit Errors**: Providers do not return 429 status
- **Execution Time**: Predictable based on batch count
  - 20 companies = ~160 emails = 32 batches × 2s = ~64 seconds minimum
- **Provider Logs**: No rate-limit warnings

### Tools for Verification
- Check workflow execution logs for timing
- Monitor provider API dashboards for rate limit status

---

## Test Case 10: LinkedIn Enrichment Integration

### Input Payload
```json
{
  "companies": [
    {
      "company_name": "Tesla",
      "job_title": "Recruiter",
      "first_name": "Elon",
      "last_name": "Musk"
    }
  ]
}
```

### Expected Outcome (if Proxycurl configured)
- **LinkedIn URL**: Constructed as https://linkedin.com/in/elon-musk
- **Proxycurl Call**: Executes after confidence filter passes
- **Enriched Data**: LinkedIn profile URL added to output
- **onError Behavior**: If profile not found, continues without failing

### Expected Outcome (if Proxycurl not configured)
- **Node Skipped**: LinkedIn enrichment returns empty
- **Workflow Continues**: Does not block verification results

---

## Open Questions

1. **API Rate Limits**: What happens when monthly quotas are exceeded mid-workflow?
   - **Mitigation**: Implement quota tracking, pause workflow, notify admin

2. **Large Batch Performance**: How does the workflow handle 100+ companies (800+ emails)?
   - **Mitigation**: Test with 100 companies, monitor memory usage, consider async processing

3. **Provider Response Time**: What if a provider takes >10 seconds to respond?
   - **Current**: Timeout set to 10s, onError: continueErrorOutput
   - **Improvement**: Implement exponential backoff retry (2s, 4s, 8s, 16s)

4. **CRM Endpoint Failure**: What happens if CRM POST fails?
   - **Current**: onError: continueErrorOutput - continues to activity log
   - **Risk**: Data saved to Sheets but not synced to CRM
   - **Mitigation**: Implement CRM retry queue or manual sync tool

5. **Duplicate Email Processing**: What if same company+title submitted multiple times?
   - **Current**: No deduplication logic
   - **Improvement**: Add deduplication check against Verified Contacts sheet

6. **LinkedIn Enrichment Cost**: Proxycurl charges per API call - is it worth calling for all emails?
   - **Optimization**: Only enrich Premium tier (95%+) contacts to reduce costs

---

## Failure Modes & Mitigations

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| All 3 providers down | 0 verified emails | Implement fallback to single-provider mode (lower threshold) |
| Invalid credentials | Workflow fails at first API call | Pre-flight credential validation node |
| Google Sheets quota exceeded | Logs not saved | Implement local file logging fallback |
| Malformed API response | Consensus scoring fails | Add response validation before scoring |
| Infinite loop in batches | Workflow hangs | Implement max iteration limit (safety: 1000 emails) |
| Memory overflow (large batches) | n8n instance crash | Hard limit on input array size (max 50 companies) |

---

## Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Avg processing time per company | < 20 seconds | Workflow execution log |
| Success rate (verified emails) | > 20% | Response summary field |
| Provider uptime | > 95% | Error log analysis |
| Confidence score accuracy | 85%+ precision | Manual spot-check validation |
| CRM sync rate | > 98% | Compare Sheet rows vs CRM records |

---

## Pre-Deployment Checklist

- [ ] All API credentials configured and tested individually
- [ ] Google Sheets created with correct column headers
- [ ] CRM endpoint URL verified and accepting test POSTs
- [ ] Workflow imported successfully into n8n (no JSON errors)
- [ ] Test Case 1 (Happy Path) executed successfully
- [ ] Test Case 3 (Invalid Input) returns proper error
- [ ] Rate limits verified with 20-company batch
- [ ] Activity logging confirmed in Google Sheets
- [ ] Error handler tested with simulated provider failure
- [ ] Response format validated against integration requirements

---

## Post-Deployment Monitoring

### Week 1 Metrics
- Total workflows executed
- Average success rate
- Provider failure frequency
- Avg confidence score distribution
- Quality tier breakdown (Premium vs Good)

### Alerts to Configure
- Provider failure rate > 10%
- Success rate < 15%
- Workflow execution time > 5 minutes
- Error log entries > 5 per day
- CRM sync failures detected

### Continuous Improvement
- Analyze failed verifications to refine email patterns
- Tune consensus scoring weights based on provider accuracy
- Implement caching for frequently verified domains
- Add pattern learning from successful verifications
