# 📝 N8N WORKFLOW STICKY NOTES GUIDE

## Overview

The workflow JSON now includes **8 strategically placed sticky notes** that explain the entire automation in simple, non-technical terms. Anyone viewing the workflow in n8n will immediately understand what each section does.

---

## 🗺️ VISUAL LAYOUT MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NOTE 1: WORKFLOW OVERVIEW                            │
│                         (Blue - Position: 200, 80)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
              ┌────────────────────────────────────┐
              │     [Webhook Trigger] (240, 400)   │
              └────────────────────────────────────┘
                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTE 2: INPUT VALIDATION ZONE                            │
│                       (Yellow - Position: 440, 80)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
       [Input Validation] (460, 400) → [Normalize Fields] (680, 400)
                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                  NOTE 3: DUPLICATE DETECTION ENGINE                         │
│                       (Yellow - Position: 900, 80)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
       [Load Existing DB] (900, 400) → [Fuzzy Matching] (1120, 400)
                                    ↓
                    [Split Results] (1340, 400)
                                    ↓
                   [Route: Duplicate?] (1560, 400)
                                    ↓
                      ┌──────────────┴──────────────┐
                      │                              │
           ┌──────────────────────────┐             │
           │  NOTE 4: DUPLICATE PATH  │             │
           │  (Orange - 1760, 80)     │             │
           └──────────────────────────┘             │
                      ↓                              ↓
          [Merge Records] (1780, 240)    [Check Email Validity] (1780, 560)
                      ↓                              ↓
                      │                   [Parse Email Result] (2000, 560)
                      │                              ↓
                      │                   [Enrich Company] (2220, 560)
                      │                              ↓
                      │            ┌─────────────────────────────────────────┐
                      │            │  NOTE 5: ENRICHMENT PIPELINE            │
                      │            │  (Yellow - Position: 2200, 700)         │
                      │            └─────────────────────────────────────────┘
                      │                              ↓
                      │                   [Parse Company Data] (2440, 560)
                      │                              ↓
                      │                   [Find LinkedIn] (2660, 560)
                      │                              ↓
                      │                   [Parse LinkedIn] (2880, 560)
                      │                              ↓
                      │                   [Extract Skills GPT-4] (3100, 560)
                      │                              ↓
                      │                   [Parse Skills] (3320, 560)
                      │                              ↓
                      │                   [Standardize Titles GPT-4] (3540, 560)
                      │                              ↓
                      └──────────────────────────────┘
                                    ↓
                           PATHS CONVERGE HERE
                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTE 6: SCORING & ROUTING                                │
│                       (Yellow - Position: 3760, 80)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
     [Calculate Score] (3760, 400) → [Assign Recruiter] (3980, 400)
                                    ↓
                        [Tag for Campaigns] (4200, 400)
                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                      NOTE 7: DATABASE SYNC                                  │
│                       (Yellow - Position: 4420, 80)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
      [Update Master DB] (4420, 400) → [Send to ATS] (4640, 400)
                                    ↓

┌─────────────────────────────────────────────────────────────────────────────┐
│                    NOTE 8: LOGGING & RESPONSE                               │
│                       (Yellow - Position: 4860, 80)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
            [Prepare Activity Log] (4860, 400)
                        ↓                    ↓
            [Log Activity] (5080, 480)  [Format Response] (5080, 320)
                        ↓                    ↓
                        └────────┬───────────┘
                                 ↓
                    [Respond with Summary] (5300, 400)
                                 ↓
                          ✅ WORKFLOW COMPLETE
```

---

## 📍 DETAILED NOTE POSITIONS & CONTENT

### NOTE 1: Workflow Overview
- **Position**: `[200, 80]`
- **Color**: Blue (color: 4)
- **Size**: 400 x 280px
- **Covers**: Header/Introduction
- **Content**:
  ```
  🎯 CANDIDATE DEDUPLICATION WORKFLOW

  This automation cleans up duplicate candidate data from job boards,
  uploads, and ATS exports.

  What it does:
  • Finds & merges duplicates using smart matching
  • Enriches profiles with LinkedIn, company info, and skills
  • Scores candidates and assigns them to recruiters
  • Syncs everything to your ATS and logs activity

  Processing Time: ~60 seconds per 100 candidates
  ```

---

### NOTE 2: Input Validation Zone
- **Position**: `[440, 80]`
- **Color**: Yellow (color: 5)
- **Size**: 380 x 240px
- **Covers**: Input Validation, Normalize Fields
- **Content**:
  ```
  ✅ STEP 1: INPUT CLEANUP

  Checks incoming candidates for:
  • Required fields (name, email)
  • Valid email format
  • Data type correctness

  Then standardizes names, emails, and phone numbers to make
  duplicate detection more accurate.

  ⚠️ Invalid records are filtered out but logged.
  ```

---

### NOTE 3: Duplicate Detection Engine
- **Position**: `[900, 80]`
- **Color**: Yellow (color: 5)
- **Size**: 420 x 260px
- **Covers**: Load Existing Database, Fuzzy Matching, Split Results, Route
- **Content**:
  ```
  🔍 STEP 2: FIND DUPLICATES

  Compares new candidates against existing database:

  Matching Rules:
  1. Exact email match → Always a duplicate
  2. Name similarity >85% + same phone → Duplicate
  3. Otherwise → Treat as new candidate

  Uses Levenshtein Distance algorithm (measures how similar
  two names are, letter by letter).
  ```

---

### NOTE 4: Duplicate Found Path
- **Position**: `[1760, 80]`
- **Color**: Orange (color: 6)
- **Size**: 340 x 220px
- **Covers**: Merge Records (duplicate branch)
- **Content**:
  ```
  🔄 DUPLICATE FOUND PATH

  When a duplicate is detected:
  • Combines old + new data (keeps newest info)
  • Fills in any missing fields from either record
  • Updates the "last modified" timestamp
  • Skips re-enrichment (we already have their data)

  Then jumps straight to scoring.
  ```

---

### NOTE 5: Enrichment Pipeline
- **Position**: `[2200, 700]`
- **Color**: Yellow (color: 5)
- **Size**: 500 x 280px
- **Covers**: Check Email → Find LinkedIn → Extract Skills → Standardize Titles
- **Content**:
  ```
  ✨ STEP 3: ENRICH NEW CANDIDATES

  For brand new candidates, gather extra info:

  📧 Email Check: Verify it's deliverable (NeverBounce)
  🏢 Company Data: Get size, industry, logo (Clearbit)
  💼 LinkedIn: Search for profile (Proxycurl)
  🤖 AI Skills: Extract from resume (GPT-4)
  🏷️ Job Title: Standardize to categories (GPT-4)

  ⚠️ If any service fails, we continue anyway (no blocking).
  ```

---

### NOTE 6: Scoring & Routing
- **Position**: `[3760, 80]`
- **Color**: Yellow (color: 5)
- **Size**: 440 x 280px
- **Covers**: Calculate Score, Assign Recruiter, Tag for Campaigns
- **Content**:
  ```
  🎯 STEP 4: SCORE & ASSIGN

  Every candidate gets a score (0-100 points):
  • Completeness: Email, phone, LinkedIn, resume (40 pts)
  • Experience: Years in the field (30 pts)
  • Engagement: Company, location, referral (30 pts)

  Tier Assignment:
  • Tier A (80+) → Senior recruiter
  • Tier B (60-79) → Mid-level recruiter
  • Tier C (<60) → Junior recruiter pool

  Also tagged for marketing campaigns.
  ```

---

### NOTE 7: Database Sync
- **Position**: `[4420, 80]`
- **Color**: Yellow (color: 5)
- **Size**: 380 x 240px
- **Covers**: Update Master Database, Send to ATS
- **Content**:
  ```
  💾 STEP 5: SAVE & SYNC

  Updates Master Candidate Database (Google Sheets):
  • If email exists → Update the record
  • If new → Create new row

  Then syncs to your ATS (recruiting software) via API.

  ⚡ Only Tier A and B sent to ATS.
  ⚡ Retries 3 times if Google Sheets is busy.
  ```

---

### NOTE 8: Logging & Response
- **Position**: `[4860, 80]`
- **Color**: Yellow (color: 5)
- **Size**: 360 x 240px
- **Covers**: Prepare Activity Log, Log Activity, Format Response, Respond
- **Content**:
  ```
  📊 STEP 6: LOG & RESPOND

  Logs execution summary to Activity Log sheet:
  • Total uploaded, duplicates found, new candidates
  • Tier breakdown (A/B/C counts)
  • Enrichment success rates

  Then sends success response:
  "78 uploaded, 12 duplicates, 66 new"

  ✅ Workflow complete!
  ```

---

## 📐 EXACT COORDINATES TABLE

| Note # | Title | X | Y | Width | Height | Color | Nodes Covered |
|--------|-------|---|---|-------|--------|-------|---------------|
| 1 | Workflow Overview | 200 | 80 | 400 | 280 | Blue (4) | Header |
| 2 | Input Validation | 440 | 80 | 380 | 240 | Yellow (5) | Nodes 2-3 |
| 3 | Duplicate Detection | 900 | 80 | 420 | 260 | Yellow (5) | Nodes 4-7 |
| 4 | Duplicate Path | 1760 | 80 | 340 | 220 | Orange (6) | Node 8 |
| 5 | Enrichment Pipeline | 2200 | 700 | 500 | 280 | Yellow (5) | Nodes 9-17 |
| 6 | Scoring & Routing | 3760 | 80 | 440 | 280 | Yellow (5) | Nodes 18-20 |
| 7 | Database Sync | 4420 | 80 | 380 | 240 | Yellow (5) | Nodes 21-22 |
| 8 | Logging & Response | 4860 | 80 | 360 | 240 | Yellow (5) | Nodes 23-26 |

---

## 🎨 COLOR CODING EXPLAINED

- **Blue (color: 4)**: Overview/Header - Sets the context for the entire workflow
- **Yellow (color: 5)**: Process Steps - Standard operational sections
- **Orange (color: 6)**: Branch Path - Highlights the special duplicate handling path

---

## 🎯 DESIGN PRINCIPLES

### 1. **Strategic Placement**
- Notes are positioned **above** the relevant node groups
- Vertical spacing: 320px between note and first node (Y: 80 for notes, Y: 400 for nodes)
- Horizontal alignment: Notes align with the leftmost node of their section

### 2. **Progressive Disclosure**
Each note uses a **STEP X** format to guide users through the workflow sequentially:
1. Input Cleanup
2. Find Duplicates
3. Enrich New Candidates
4. Score & Assign
5. Save & Sync
6. Log & Respond

### 3. **Non-Technical Language**
- **Before**: "Levenshtein Distance algorithm for fuzzy string matching"
- **After**: "Measures how similar two names are, letter by letter"

- **Before**: "OAuth2 API integration with retry logic and exponential backoff"
- **After**: "Retries 3 times if Google Sheets is busy"

### 4. **Visual Hierarchy**
- **Emojis** for quick scanning (🎯 🔍 ✨ 🎯 💾 📊)
- **Bullet points** for lists
- **Bold text** for key concepts
- **Warning symbols** (⚠️) for important caveats

---

## ✅ WHAT MAKES THESE NOTES EFFECTIVE

### For Non-Technical Users (Recruiters, Managers):
- "Smart matching" instead of "fuzzy matching algorithm"
- "Deliverable" instead of "email validation API response codes"
- Real examples: "78 uploaded, 12 duplicates, 66 new"

### For Junior Developers:
- Mentions specific technologies (NeverBounce, Clearbit, Proxycurl, GPT-4)
- Explains business logic (tier assignment rules)
- Provides performance expectations (60 seconds per 100 candidates)

### For Senior Engineers:
- Acknowledges the algorithm being used (Levenshtein Distance)
- Highlights error handling patterns (graceful degradation)
- Shows retry logic (3 attempts with delays)

---

## 🔄 HOW TO UPDATE NOTES

If you need to modify note content:

1. **Find the note** in the JSON by its `id` (e.g., `"id": "note-overview"`)
2. **Edit the `content` parameter** (supports markdown)
3. **Adjust position** by changing `"position": [X, Y]` values
4. **Change color** by modifying `"color": 1-7` (1=red, 2=pink, 3=orange, 4=blue, 5=yellow, 6=orange, 7=purple)

---

## 📏 WORKFLOW DIMENSIONS

- **Total Width**: ~5,500px (from webhook at X:240 to response at X:5300)
- **Total Height**: ~1,000px
  - Main flow: Y:400
  - Top branch (duplicate path): Y:240
  - Bottom branch (enrichment): Y:560
  - Notes layer: Y:80

**Recommended n8n Canvas Zoom**: 75% to see the entire workflow at once

---

## 🚀 IMPORT INSTRUCTIONS

1. Open n8n instance (v1.19.0+)
2. Go to **Workflows** → **Import from File**
3. Select `candidate-deduplication-enrichment-workflow.json`
4. Click **Import**
5. The workflow will load with all 26 nodes + 8 sticky notes pre-positioned
6. No manual note creation needed! ✨

---

## 💡 TIPS FOR VIEWING IN N8N

1. **First Time Opening**: Zoom out to 50-75% to see the big picture
2. **Reading Notes**: Click and drag to scroll horizontally through each section
3. **Understanding Flow**: Follow the connecting lines from left to right
4. **Branch Visualization**: The duplicate path (top) and enrichment path (bottom) converge at "Calculate Score"
5. **Color Coding**: Use note colors to quickly identify workflow stages

---

**Version**: 1.1 (with sticky notes)
**Last Updated**: 2025-11-18
**Total Elements**: 26 nodes + 8 sticky notes = 34 canvas elements
