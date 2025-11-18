# 🧪 TEST PLAN & ASSUMPTIONS
## Workflow: Candidate Deduplication & Data Enrichment System

---

## 📦 TEST PAYLOADS

### Test Case 1: Single New Candidate (Happy Path)

**Purpose**: Verify basic workflow execution with one valid candidate

**Trigger Payload**:
```json
{
  "candidates": [
    {
      "source": "manual",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.johnson@techcorp.com",
      "phone": "(415) 555-0123",
      "company": "TechCorp Inc",
      "job_title": "Senior Software Engineer",
      "resume_text": "Experienced software engineer with 7 years in Python, AWS, Docker, PostgreSQL, React, Node.js. Led microservices architecture migration for Fortune 500 client. Strong background in CI/CD pipelines and DevOps practices.",
      "linkedin_url": "",
      "years_experience": 7,
      "location": "San Francisco, CA",
      "skills": ""
    }
  ],
  "upload_batch_id": "test_batch_001",
  "uploaded_by": "recruiter@company.com"
}
```

**Expected Outcome**:
- ✅ Email validation: `valid`
- ✅ Skills extracted: `Python, AWS, Docker, PostgreSQL, React, Node.js`
- ✅ Job title standardized: `Senior Software Engineer`
- ✅ Candidate score: 85-95 (Tier A)
- ✅ Assigned to: `senior-tech-recruiter@company.com`
- ✅ Campaign tags: `high_priority`, `experienced`, `python_developer`, `frontend_developer`, `cloud_engineer`
- ✅ Database record created
- ✅ Synced to ATS (Tier A)
- ✅ Response: `"1 uploaded, 0 duplicates, 1 new"`

---

### Test Case 2: Batch Upload with Duplicates

**Purpose**: Test fuzzy matching and duplicate merge logic

**Trigger Payload**:
```json
{
  "candidates": [
    {
      "source": "scraped",
      "first_name": "john",
      "last_name": "smith",
      "email": "john.smith@example.com",
      "phone": "5551234567",
      "company": "Acme Corp",
      "job_title": "Product Manager",
      "years_experience": 5,
      "location": "New York, NY"
    },
    {
      "source": "ats_export",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@example.com",
      "phone": "+1-555-123-4567",
      "company": "Acme Corporation",
      "job_title": "Senior Product Manager",
      "linkedin_url": "https://linkedin.com/in/johnsmith",
      "years_experience": 6,
      "location": "Remote"
    },
    {
      "source": "manual",
      "first_name": "Emily",
      "last_name": "Chen",
      "email": "emily.chen@startup.io",
      "phone": "(650) 555-9999",
      "company": "StartupIO",
      "job_title": "Data Scientist",
      "resume_text": "PhD in Machine Learning. Expert in Python, TensorFlow, scikit-learn, SQL, Spark. Published researcher with 3 years industry experience in ML model deployment.",
      "years_experience": 3,
      "location": "Palo Alto, CA"
    }
  ],
  "upload_batch_id": "test_batch_002",
  "uploaded_by": "system_import"
}
```

**Expected Outcome**:
- ✅ John Smith records detected as duplicates (exact email match)
- ✅ Merged record contains: newer job title, LinkedIn URL, combined skills
- ✅ Emily Chen processed as new candidate
- ✅ Emily score: 75-85 (Tier B)
- ✅ Response: `"3 uploaded, 1 duplicates, 2 new"`
- ✅ Tier breakdown: `{ "A": 0, "B": 2, "C": 0 }`

---

### Test Case 3: Invalid & Edge Cases

**Purpose**: Test error handling and validation

**Trigger Payload**:
```json
{
  "candidates": [
    {
      "source": "manual",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "invalid-email-format",
      "phone": "123"
    },
    {
      "source": "scraped",
      "first_name": "",
      "last_name": "Anonymous",
      "email": "anon@test.com"
    },
    {
      "source": "manual",
      "first_name": "Valid",
      "last_name": "Candidate",
      "email": "valid@company.com",
      "phone": null,
      "years_experience": 0,
      "location": "Remote"
    }
  ],
  "upload_batch_id": "test_batch_003"
}
```

**Expected Outcome**:
- ❌ First candidate rejected: invalid email format
- ❌ Second candidate rejected: missing first_name
- ✅ Third candidate processed successfully (minimal data)
- ✅ Score: 25-35 (Tier C) - low completeness
- ✅ Assigned to: `junior-recruiter-pool@company.com`
- ✅ Response: `"3 uploaded, 0 duplicates, 1 new"` (2 filtered during validation)
- ✅ Activity log shows: `invalid_count: 2`

---

### Test Case 4: API Failure Resilience

**Purpose**: Test graceful degradation when external APIs fail

**Setup**: Simulate API failures (mock/staging environment)
- NeverBounce: 500 error
- Clearbit: Rate limit exceeded (429)
- Proxycurl: Timeout
- OpenAI: Service unavailable

**Trigger Payload**:
```json
{
  "candidates": [
    {
      "source": "manual",
      "first_name": "Test",
      "last_name": "Resilience",
      "email": "test@resilience.com",
      "phone": "5555555555",
      "company": "resilience.com",
      "job_title": "Staff Engineer",
      "resume_text": "Senior engineer with expertise in distributed systems.",
      "years_experience": 8,
      "location": "Austin, TX"
    }
  ],
  "upload_batch_id": "test_batch_004"
}
```

**Expected Outcome**:
- ⚠️ Email status: `unchecked` (NeverBounce failed)
- ⚠️ Company data: empty (Clearbit unavailable)
- ⚠️ LinkedIn: empty (Proxycurl timeout)
- ⚠️ Skills: empty (OpenAI down)
- ✅ Workflow completes successfully (no blocking failures)
- ✅ Candidate still saved to database with partial data
- ✅ Score: 40-50 (Tier C) - lower due to missing enrichment
- ✅ Response: `"1 uploaded, 0 duplicates, 1 new"`
- ✅ Activity log shows lower enrichment counts

---

### Test Case 5: High-Volume Batch (Performance Test)

**Purpose**: Validate scalability and rate limiting

**Trigger Payload**: Generate programmatically
```json
{
  "candidates": [ /* Array of 150 unique candidates */ ],
  "upload_batch_id": "test_batch_005_bulk",
  "uploaded_by": "bulk_import_tool"
}
```

**Expected Outcome**:
- ✅ Execution time: < 180 seconds (target: ~1.2s per candidate)
- ✅ All candidates processed (no timeouts)
- ✅ Rate limiting respected:
  - NeverBounce: Batched in groups of 50
  - Clearbit: Max 10 requests/second
  - OpenAI: Queued with delays
- ✅ No duplicate Google Sheets writes
- ✅ Activity log shows accurate counts
- ✅ Response includes all 150 candidates

---

## 🔍 ASSUMPTIONS DOCUMENTED

### 1. Google Sheets Structure

**Master_Candidates Sheet Columns**:
```
A: candidate_id (auto-generated UUID)
B: email (unique key)
C: first_name
D: last_name
E: full_name
F: phone
G: company
H: job_title
I: standardized_title
J: resume_text
K: linkedin_url
L: years_experience
M: location
N: skills
O: email_status
P: candidate_score
Q: candidate_tier
R: assigned_recruiter
S: campaign_tags (comma-separated)
T: source
U: created_date
V: last_updated
W: batch_id
```

**Activity_Log Sheet Columns**:
```
A: timestamp
B: workflow
C: status
D: total_uploaded
E: duplicates_found
F: new_candidates
G: tier_a_count
H: tier_b_count
I: tier_c_count
J: emails_validated
K: linkedin_found
L: skills_extracted
M: uploaded_by
N: batch_id
O: execution_time_ms
```

**Assumption**: Sheets exist with these exact column headers before workflow execution.

---

### 2. ATS API Contract

**Endpoint**: `POST /candidates`

**Expected Request Body**:
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "job_title": "string",
  "linkedin_url": "string",
  "score": 0-100,
  "tier": "A|B|C",
  "assigned_recruiter": "email",
  "tags": ["tag1", "tag2"]
}
```

**Expected Response**: `201 Created` or `200 OK`

**Assumption**: ATS accepts JSON and returns success within 15s timeout.

---

### 3. API Rate Limits & Quotas

| Service | Limit | Assumption |
|---------|-------|------------|
| NeverBounce | 300 requests/hour | Batch processing for >100 candidates |
| Clearbit | 600 requests/hour | Skip enrichment if quota exceeded |
| Proxycurl | 300 requests/month | Only search if `linkedin_url` is empty |
| OpenAI GPT-4o-mini | 500 RPM | Queue requests with 120ms delay |
| Google Sheets API | 100 write requests/100s | Use `appendOrUpdate` for efficiency |

**Assumption**: Workflow processes <100 candidates per execution to stay within hourly limits.

---

### 4. Duplicate Detection Rules

**Rule Priority**:
1. **Exact Email Match** → Always duplicate (100% confidence)
2. **Name Similarity ≥85% + Exact Phone** → Duplicate (95% confidence)
3. **Name Similarity ≥85% + No Phone** → NOT duplicate (false positive risk)

**Edge Case Assumptions**:
- Different emails but same name+phone → Treated as separate (user may have multiple emails)
- Typos in names (e.g., "Jon" vs "John") → May not match unless within 85% threshold
- Candidates without phone → Only matched by exact email

---

### 5. Data Privacy & Compliance

**PII Fields**: `email`, `phone`, `full_name`, `resume_text`, `linkedin_url`

**Assumptions**:
- All candidates have provided consent for data storage (via source system)
- Google Sheets workspace has encryption enabled
- Data retention: 2 years, then manual archival required
- No GDPR right-to-erasure automation (handled via support tickets)
- Resume text may contain sensitive info (e.g., SSN) → Not validated/redacted

---

### 6. Credential & Secret Management

**Assumption**: The following are pre-configured in n8n:

**Environment Variables**:
```bash
GOOGLE_SHEETS_MASTER_DB_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_SHEETS_ACTIVITY_LOG_ID=9i8h7g6f5e4d3c2b1a0
NEVERBOUNCE_API_KEY=nb_live_xxxxxxxxxxxxxx
CLEARBIT_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
PROXYCURL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxx
ATS_API_ENDPOINT=https://ats.company.com/api/v1
ATS_API_KEY=bearer_token_xxxxxxxxx
```

**n8n Credentials**:
- `google-sheets-credential` → OAuth2 with read/write scope
- `openai-credential` → API key for GPT-4o-mini access

---

### 7. Job Title Standardization Mapping

**Assumption**: GPT-4 will map to these 11 standard titles:
1. Software Engineer
2. Senior Software Engineer
3. Staff Engineer
4. Engineering Manager
5. Product Manager
6. Data Scientist
7. Data Engineer
8. DevOps Engineer
9. QA Engineer
10. Designer
11. Other

**Edge Case**: If GPT-4 returns unexpected value, original `job_title` is preserved.

---

## ❓ OPEN QUESTIONS REQUIRING HUMAN DECISION

### 1. Duplicate Merge Conflict Resolution

**Question**: When duplicate candidate has conflicting `years_experience` (old: 5, new: 3), which should be kept?

**Options**:
- A) Always prefer newer value (current implementation)
- B) Always prefer higher value (assume most accurate)
- C) Flag for manual review

**Recommendation**: Implement Option B for numeric fields like experience.

---

### 2. Email Validation Failure Behavior

**Question**: Should candidates with `email_status: 'invalid'` or `'disposable'` be blocked from database?

**Current**: They are saved but flagged

**Options**:
- A) Block invalid emails (reject candidate)
- B) Save but mark as low priority (current)
- C) Send notification for manual review

**Recommendation**: Implement Option C for `disposable` emails.

---

### 3. LinkedIn Profile Ambiguity

**Question**: If Proxycurl returns 5 potential matches, which profile should be selected?

**Current**: First result is used

**Options**:
- A) Use first result (current)
- B) Use result with highest confidence score
- C) Leave empty if multiple matches (avoid false positive)

**Recommendation**: Implement Option C with confidence threshold >80%.

---

### 4. Resume Text Storage Limit

**Question**: What is maximum `resume_text` length to store in Google Sheets?

**Current**: No limit (may exceed cell limit of 50,000 chars)

**Options**:
- A) Truncate to 10,000 characters
- B) Store full text in Google Drive, save Drive URL in sheet
- C) Hash resume for duplicate detection only, don't store text

**Recommendation**: Implement Option B for resumes >10,000 chars.

---

### 5. Recruiter Assignment Round-Robin State

**Question**: How should round-robin state be persisted for Tier B assignments?

**Current**: Uses timestamp modulo (not true round-robin)

**Options**:
- A) Store last assigned recruiter in Google Sheets state table
- B) Use external Redis/database for state
- C) Accept timestamp modulo as "good enough" distribution

**Recommendation**: Implement Option A with simple state sheet.

---

## 🚨 TOP 3 PRODUCTION FAILURE MODES & MITIGATIONS

### Failure Mode #1: Google Sheets Write Quota Exceeded

**Scenario**: Bulk upload of 500+ candidates triggers Google API quota limit (100 writes/100s)

**Symptoms**:
- Workflow fails at "Update Master Database" node
- Error: `429 Too Many Requests`
- Candidates processed but not saved

**Impact**: **CRITICAL** - Data loss, duplicate processing on retry

**Mitigation Strategy**:
1. **Prevention**:
   - Implement batch limiting: Max 80 candidates per workflow execution
   - Add pre-check: Query current quota usage via Google API
   - Split large batches into sub-batches with 120s delay between

2. **Detection**:
   - Monitor Activity Log for `status: 'failed'` with "quota" keyword
   - Alert Slack channel if >3 quota failures in 1 hour

3. **Recovery**:
   - Automatic retry after 120s (3 attempts)
   - If all retries fail, save candidates to backup CSV in Google Drive
   - Send notification: "500 candidates pending manual upload - see Drive link"

**Code Addition** (Insert before Node 21):
```javascript
// Check batch size and split if needed
const BATCH_LIMIT = 80;
if (candidates.length > BATCH_LIMIT) {
  throw new Error(`Batch size ${candidates.length} exceeds limit ${BATCH_LIMIT}. Please split into smaller batches.`);
}
```

---

### Failure Mode #2: OpenAI API Timeout During High Load

**Scenario**: GPT-4 skill extraction takes >30s per candidate during OpenAI service degradation

**Symptoms**:
- Workflow execution time >5 minutes for 50 candidates
- Timeout errors at "Extract Skills from Resume" node
- Partial data saved (candidates missing skills)

**Impact**: **MEDIUM** - Degraded data quality but workflow completes

**Mitigation Strategy**:
1. **Prevention**:
   - Set aggressive timeout: 10s per GPT request
   - Use `gpt-4o-mini` (faster) instead of `gpt-4`
   - Implement request queuing with exponential backoff
   - Cache extracted skills by resume hash (avoid re-processing)

2. **Detection**:
   - Track `skills_extracted` percentage in Activity Log
   - Alert if <50% success rate for batch

3. **Recovery**:
   - Mark candidates with `skills_extraction_pending: true`
   - Schedule background job to retry failed extractions
   - Fallback: Use keyword matching (regex) for common skills

**Code Addition** (Node 15 modification):
```javascript
// Timeout handling
const EXTRACTION_TIMEOUT = 10000; // 10s
try {
  const result = await openai.complete({ timeout: EXTRACTION_TIMEOUT });
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    return { skills: '', extraction_pending: true };
  }
  throw error;
}
```

---

### Failure Mode #3: Duplicate Detection False Negatives

**Scenario**: Candidate "Robert Smith" and "Bob Smith" not detected as duplicates despite being same person

**Symptoms**:
- Multiple profiles for same candidate in database
- Recruiter contacts same person twice
- Database bloat with near-duplicates

**Impact**: **MEDIUM** - Data integrity issue, poor user experience

**Root Cause**:
- Levenshtein threshold (85%) too strict
- Nickname variations not handled (Robert/Bob, Elizabeth/Liz)
- Middle names/initials not normalized

**Mitigation Strategy**:
1. **Prevention**:
   - Implement nickname normalization library:
     ```javascript
     const nicknames = {
       'bob': 'robert', 'rob': 'robert', 'bobby': 'robert',
       'liz': 'elizabeth', 'beth': 'elizabeth',
       'mike': 'michael', 'jim': 'james'
     };
     ```
   - Fuzzy match on email domain + first 3 letters of last name
   - Use phone number as stronger signal (increase weight)

2. **Detection**:
   - Weekly batch job: Scan database for potential duplicates using relaxed threshold (75%)
   - Generate report of "suspicious pairs" for manual review
   - Track duplicate merge rate in dashboard

3. **Recovery**:
   - Manual merge tool: UI to combine two candidate records
   - Audit log of all merges
   - Undo capability (restore from backup)

**Code Addition** (Node 5 enhancement):
```javascript
// Normalize nicknames before comparison
function normalizeNickname(name) {
  const lowerName = name.toLowerCase();
  return nicknames[lowerName] || lowerName;
}

const normalizedNew = normalizeNickname(newCandidate.first_name);
const normalizedExisting = normalizeNickname(existing.first_name);
const nameSimilarity = similarityScore(normalizedNew, normalizedExisting);
```

---

## 📊 SUCCESS METRICS & KPIs

**Workflow Health Indicators**:
- Execution success rate: >95%
- Average execution time: <60s per 100 candidates
- Duplicate detection accuracy: >90%
- Email validation coverage: >80%
- LinkedIn profile match rate: >40%
- Skill extraction success: >70%

**Business Impact Metrics**:
- Time saved per week: 20+ hours (vs manual deduplication)
- Candidate database quality score: 75+ (completeness metric)
- Recruiter satisfaction: 4.5/5 (quarterly survey)
- ATS sync success rate: >98%

---

## ✅ PRE-PRODUCTION CHECKLIST

Before deploying to production:

- [ ] All environment variables configured in n8n instance
- [ ] Google Sheets templates created with exact column structure
- [ ] API credentials validated (test API calls succeed)
- [ ] Webhook URL whitelisted in firewall/security groups
- [ ] Test Cases 1-5 executed successfully in staging
- [ ] Error notifications configured (Slack webhook)
- [ ] Monitoring dashboard deployed (Google Data Studio)
- [ ] User documentation published (internal wiki)
- [ ] Rollback procedure documented
- [ ] On-call rotation assigned for workflow failures
- [ ] Data retention policy approved by legal team
- [ ] GDPR compliance review completed

---

**Test Plan Version**: 1.0.0
**Last Updated**: 2025-11-18
**Prepared By**: Senior n8n Automation Architect
**Review Status**: Pending stakeholder approval
