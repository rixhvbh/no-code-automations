# Sticky Notes Reference - LinkedIn HR Discovery Workflow

This document shows the placement and content of all 11 sticky notes added to the workflow for easy documentation.

---

## Visual Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW HORIZONTAL FLOW                          │
│  (All processing nodes positioned at y=500, left to right progression)  │
└─────────────────────────────────────────────────────────────────────────┘

X-Axis Position (left to right):
  240    460    680    900   1120  1340  1560  1780  2000  2220  2440...

  [1] → [2] → [3] → [4] → [5] → [6] → [7] → [8] → [9] → [10] → [11]...

Sticky Notes (above at y≈140-200, below at y≈800-900):

  NOTE1        NOTE2   NOTE3        NOTE5        NOTE6        NOTE7   NOTE8
  (above)      (above) (above)      (above)      (above)      (above) (above)

                      NOTE4                   NOTE11                 NOTE9
                      (below)                 (below)                (below)

                                                              NOTE10
                                                              (above final nodes)
```

---

## Complete Sticky Notes List

### **Note 1: Workflow Entry & Setup** 🟦 BLUE
**Position**: `[180, 180]` (above Webhook Trigger)
**Size**: 400w × 280h
**Covers Nodes**: Webhook Trigger, Validate Input, Parse Company ID

**Content:**
```
🎯 START HERE: Input Company LinkedIn URL

This workflow finds HR contacts from any company's LinkedIn page.

You provide:
• Company LinkedIn URL (e.g., linkedin.com/company/google)
• Optional: filters and quality thresholds

The workflow automatically extracts employee data, finds emails,
scores each contact, and saves the best leads to Google Sheets.
```

---

### **Note 2: Company Employee Discovery** 🟩 GREEN
**Position**: `[820, 180]` (above Proxycurl Fetch Employees)
**Size**: 360w × 260h
**Covers Nodes**: Proxycurl Fetch Employees

**Content:**
```
📋 STEP 1: Get All Employees

We call Proxycurl API to fetch all current employees
from the LinkedIn company page.

Returns: List of employee names, titles, and profile URLs
(Usually 10-50 employees depending on company size)

Next → Filter for HR & recruiting roles only
```

---

### **Note 3: HR Role Filtering** 🟩 GREEN
**Position**: `[1040, 140]` (above Filter HR Roles)
**Size**: 360w × 300h
**Covers Nodes**: Filter HR Roles

**Content:**
```
🎯 STEP 2: Find HR & Recruiting People

We scan all employee titles looking for HR-related keywords:
• Recruiter, Talent Acquisition, HR Manager
• People Operations, Hiring Manager
• Talent Partner, Headhunter, etc.

Also detects seniority:
VP → Director → Manager → Specialist

Next → Process in small batches to avoid API limits
```

---

### **Note 4: Batch Processing Loop** 🟦 BLUE
**Position**: `[1260, 800]` (below Split Into Batches)
**Size**: 340w × 260h
**Covers Nodes**: Split Into Batches (explains the loop-back mechanism)

**Content:**
```
⚙️ BATCH PROCESSING
(5 leads at a time)

Why batches? API rate limits!

We process 5 HR contacts at a time, then loop back for the next 5.

This prevents hitting rate limits on Proxycurl, Hunter.io,
and other services.

The loop continues until all HR contacts are processed.
```

---

### **Note 5: Profile Enrichment** 🟩 GREEN
**Position**: `[1580, 140]` (above Proxycurl Fetch Profile and Extract Hints)
**Size**: 400w × 280h
**Covers Nodes**: Proxycurl Fetch Profile, Extract Contact Hints

**Content:**
```
👤 STEP 3: Get Detailed Profile Data

For each HR person, we:
1. Fetch their full LinkedIn profile (job history, location, etc.)
2. Extract: First name, last name, company domain, seniority
3. Calculate how recently they updated their profile

This data helps us find and verify their email address.
```

---

### **Note 6: Email Discovery** 🟩 GREEN
**Position**: `[2120, 140]` (above Email Found? branch)
**Size**: 380w × 300h
**Covers Nodes**: Hunter.io Email Discovery, Email Found?, NeverBounce Verify, Generate Patterns, Verify Generated

**Content:**
```
📧 STEP 4: Find & Verify Emails

METHOD 1: Hunter.io searches for work email using name + domain
✅ If found → Verify with NeverBounce

METHOD 2: If not found → Generate common patterns
(john.doe@company.com, jdoe@company.com, etc.)
→ Test each pattern with NeverBounce

Result: Verified email or "no email found"
```

---

### **Note 7: Additional Data Enrichment** 🟩 GREEN
**Position**: `[3020, 140]` (above Apollo.io Enrichment)
**Size**: 360w × 260h
**Covers Nodes**: Apollo.io Enrichment

**Content:**
```
🔍 STEP 5: Find Phone Numbers & More

Apollo.io enriches each contact with:
• Phone number (if available)
• Additional emails
• Company size data
• Recent job changes

Even if we don't find everything, we move forward
with whatever data we have.
```

---

### **Note 8: Quality Scoring** 🟪 PURPLE
**Position**: `[3240, 120]` (above Calculate Quality Score)
**Size**: 380w × 340h
**Covers Nodes**: Calculate Quality Score

**Content:**
```
⭐ STEP 6: Score Each Contact
(0-100 points)

Scoring breakdown:
• Email verified = 30 pts
• Phone number = 20 pts
• LinkedIn URL = 10 pts
• Large company = 10 pts
• Senior position (VP/Director) = 15 pts
• High HR relevance = 10 pts
• Recently updated profile = 5 pts

Total determines tier:
🔥 HOT (80+) | ⚡ WARM (60-80) | ❄️ DISCARD (<60)
```

---

### **Note 9: Lead Storage** 🟧 ORANGE
**Position**: `[3700, 900]` (below the storage branches)
**Size**: 420w × 320h
**Covers Nodes**: Hot Lead?, Save to Hot Leads, Warm/Cold Lead?, Save to Warm/Cold Leads

**Content:**
```
💾 STEP 7: Save Leads to Google Sheets

Hot Leads (Score 80+) → "Hot Leads" sheet
   These are your best contacts with verified emails & phones

Warm/Cold Leads (Score 60-80) → "Warm Cold Leads" sheet
   Good contacts but missing some data (may need manual research)

Anything below 60 → Discarded (too little info to be useful)

After saving, we loop back to process the next batch.
```

---

### **Note 10: Results Summary** 🟧 ORANGE
**Position**: `[4300, 100]` (above Slack Notification and Activity Log)
**Size**: 420w × 340h
**Covers Nodes**: Aggregate Results, Slack Notification, Activity Log, Respond to Webhook

**Content:**
```
📊 STEP 8: Send Results & Log Activity

Once ALL batches are done:

1. Aggregate Results
   Count: Total processed, Hot, Warm, Cold, Discarded

2. Slack Notification
   Send summary to your team channel

3. Activity Log
   Record this execution in Google Sheets for tracking

4. Return Response
   Send JSON response with counts and execution time
```

---

### **Note 11: Error Handling Info** 🟥 RED
**Position**: `[1940, 800]` (below email discovery area)
**Size**: 360w × 280h
**Covers Nodes**: All API-calling nodes (general explanation)

**Content:**
```
⚠️ ERROR HANDLING & RETRIES

All API calls automatically retry 3 times if they fail:
• Wait 2 seconds → retry
• Wait 4 seconds → retry
• Wait 8 seconds → final attempt

If a single contact fails, we skip it and continue
with the rest. The workflow never crashes completely.

Errors are logged in the Activity Log sheet.
```

---

## Color Coding Strategy

| Color | n8n Code | Purpose | Notes Using This Color |
|-------|----------|---------|------------------------|
| 🟦 Blue | 2 | Entry points and system mechanics | 1, 4 |
| 🟩 Green | 4 | Data collection and enrichment | 2, 3, 5, 6, 7 |
| 🟪 Purple | 5 | Scoring and evaluation logic | 8 |
| 🟧 Orange | 6 | Storage, output, and results | 9, 10 |
| 🟥 Red | 3 | Error handling and warnings | 11 |

---

## Node Position Reference

**Main Workflow Spine** (y = 500):
- Webhook Trigger: [240, 500]
- Validate Input: [460, 500]
- Parse Company ID: [680, 500]
- Proxycurl Fetch Employees: [900, 500]
- Filter HR Roles: [1120, 500]
- Split Into Batches: [1340, 500]
- Proxycurl Fetch Profile: [1560, 500]
- Extract Contact Hints: [1780, 500]
- Hunter.io Email Discovery: [2000, 500]
- Email Found?: [2220, 500]

**Email Found Branch** (y = 380, upper):
- NeverBounce Verify Email: [2440, 380]

**Email NOT Found Branch** (y = 620, lower):
- Generate Email Patterns: [2440, 620]
- Select Best Generated Email: [2660, 620]
- Verify Generated Email: [2880, 620]

**Continuing Main Flow** (y = 500):
- Apollo.io Enrichment: [3100, 500]
- Calculate Quality Score: [3320, 500]
- Hot Lead?: [3540, 500]

**Hot Lead Branch** (y = 380, upper):
- Save to Hot Leads Sheet: [3760, 380]

**Not Hot Branch** (y = 620, lower):
- Warm/Cold Lead?: [3760, 620]
- Save to Warm/Cold Leads Sheet: [3980, 620]

**Final Processing** (varying y):
- Aggregate Results: [4200, 500]
- Slack Notification: [4420, 380]
- Log to Activity Sheet: [4420, 500]
- Respond to Webhook: [4640, 500]

---

## How to Use This Workflow

### **For Non-Technical Users:**
1. Read the blue note (#1) at the top-left to understand what inputs you need
2. Follow the green notes (#2-7) to see how data is collected and enriched
3. Check the purple note (#8) to understand how contacts are scored
4. Review the orange notes (#9-10) to see where results are stored
5. Reference the red note (#11) if you encounter errors

### **For Technical Users:**
- Sticky notes provide high-level flow documentation
- Each note positioned strategically near the nodes it describes
- Color coding helps visually segment the workflow into logical phases
- Use this as a quick reference when making modifications

### **For Stakeholders:**
- Open the workflow in n8n editor
- Sticky notes provide a self-guided tour
- No need to understand individual nodes or code
- Get complete picture of what the automation does in plain English

---

## Importing the Workflow

1. Download `linkedin-hr-discovery-workflow-WITH-NOTES.json`
2. Open n8n → Workflows → Import from File
3. Select the JSON file
4. All nodes AND sticky notes will appear with proper positioning
5. Set up credentials for: Proxycurl, Hunter.io, NeverBounce, Apollo.io, Google Sheets, Slack
6. Configure environment variables for Google Sheets IDs
7. Activate and test!

---

## Maintenance Notes

When modifying the workflow:
- **Add nodes**: Position them on the appropriate y-level (380/500/620)
- **Update notes**: Edit sticky note content to reflect changes
- **Keep colors consistent**: Use the color coding strategy above
- **Maintain spacing**: Keep ~220px horizontal spacing between nodes
- **Update this doc**: If you add/remove notes, update this reference

---

**Created**: 2025-11-19
**Workflow Version**: 1.0.0
**n8n Compatibility**: 1.64.0+
**Total Sticky Notes**: 11
**Total Processing Nodes**: 24
