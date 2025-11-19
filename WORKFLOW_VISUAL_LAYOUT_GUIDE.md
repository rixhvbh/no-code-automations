# 📐 Email Verification Pipeline - Visual Layout Guide

## Complete Node & Note Positioning Reference

This document shows the **exact positions** of all 22 nodes and 9 sticky notes in the workflow canvas.

---

## 🎨 CANVAS LAYOUT OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW CANVAS (4500 x 1000)                       │
│                                                                              │
│  [Note 1]  [Note 2]        [Note 3]                      [Note 7]           │
│     ↓         ↓              ↓                              ↓               │
│  ┌──────┐ ┌──────┐ ┌──────┐┌──────┐┌──────┐┌──────┐    ┌──────┐           │
│  │Webhk │→│Valid │→│Batch ││Domain│→│Ptrn  │→│Batch │→···│Enrich│           │
│  └──────┘ └──────┘ └──────┘└──────┘└──────┘└──────┘    └──────┘           │
│                                                             ↓               │
│                              ↓                          ┌──────┐           │
│                          ┌──────┐                       │Format│           │
│                          │Wait  │                       └──────┘           │
│                          └──────┘                          ↓               │
│                              ↓                          ┌──────┐           │
│                       ┌──────────────┐                  │ Tag  │           │
│                       │ 3 Verifiers  │                  └──────┘           │
│                       │  (parallel)  │                     ↓               │
│                       └──────────────┘              ┌──────────────┐       │
│                              ↓                      │  3 Storage   │       │
│                          ┌──────┐                   │  (parallel)  │       │
│                          │Merge │                   └──────────────┘       │
│                          └──────┘                          ↓               │
│                              ↓                          ┌──────┐           │
│                          ┌──────┐                       │Respns│           │
│                          │Score │                       └──────┘           │
│                          └──────┘                                          │
│                              ↓                                             │
│                    [Note 4] [Note 5] [Note 6]         [Note 8]            │
│                                                                            │
│                                                        ┌──────┐            │
│                                                        │Error │            │
│                                                        └──────┘            │
│                                                        [Note 9]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📍 EXACT NODE POSITIONS

### **Column 1: Input Section (x=250-500)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Webhook Trigger | [250, 300] | Receives POST requests |
| Input Validation | [500, 300] | Validates payload & sets defaults |

### **Column 2: Company Processing (x=750-1250)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Company Batch Splitter | [750, 300] | Batches 10 companies at a time |
| Domain Lookup - Hunter | [1000, 300] | Finds email patterns for domain |
| Email Pattern Generator | [1250, 300] | Creates 14 email variations |

### **Column 3: Email Batching (x=1500-1750)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Email Batch Splitter | [1500, 300] | Batches 5 emails at a time |
| Rate Limit Wait | [1750, 300] | 2-second delay between batches |

### **Column 4: Verification (x=2000, parallel y=200/300/400)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Hunter Verification | [2000, 200] | Checks email validity (Hunter) |
| NeverBounce Verification | [2000, 300] | Checks email validity (NeverBounce) |
| Debounce Verification | [2000, 400] | Checks email validity (Debounce) |

### **Column 5: Scoring (x=2250-2750)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Verification Merge | [2250, 300] | Combines 3 provider results |
| Consensus Scoring | [2500, 300] | Calculates 0-100 confidence score |
| Confidence Filter | [2750, 300] | Filters emails <85% confidence |

### **Column 6: Enrichment (x=3000-3250)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Enrichment Conditional | [3000, 300] | Checks if enrichment enabled |
| LinkedIn Enrichment | [3250, 200] | Fetches LinkedIn profile data |

### **Column 7: Formatting (x=3500-3750)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Final JSON Formatter | [3500, 300] | Standardizes output structure |
| Quality Tagger | [3750, 300] | Tags Premium/Good/Review |

### **Column 8: Storage (x=4000, parallel y=200/300/400)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Airtable Logger | [4000, 200] | Saves to Airtable database |
| CRM Sync | [4000, 300] | Sends to client CRM/ATS |
| Activity Logger - Google Sheets | [4000, 400] | Logs execution to Sheets |

### **Column 9: Response & Error (x=4250)**
| Node Name | Position [x, y] | Purpose |
|-----------|----------------|---------|
| Webhook Response | [4250, 300] | Returns verified contacts to client |
| Error Handler | [4250, 700] | Global error logging |

---

## 📌 EXACT STICKY NOTE POSITIONS

### **Note 1: Workflow Overview**
- **Position**: `[250, 100]`
- **Size**: 360px wide × 180px tall
- **Location**: Above "Webhook Trigger"
- **Color**: Light blue (recommended)
- **Content**: What this workflow does + use case

### **Note 2: Input Explanation**
- **Position**: `[500, 100]`
- **Size**: 360px wide × 180px tall
- **Location**: Above "Input Validation"
- **Color**: Light yellow (recommended)
- **Content**: Required payload fields + defaults

### **Note 3: Email Discovery**
- **Position**: `[1000, 80]`
- **Size**: 420px wide × 200px tall
- **Location**: Above "Domain Lookup" and "Email Pattern Generator"
- **Color**: Light green (recommended)
- **Content**: 2-step email finding process

### **Note 4: Batch Processing**
- **Position**: `[1500, 500]`
- **Size**: 340px wide × 160px tall
- **Location**: Below "Email Batch Splitter"
- **Color**: Light orange (recommended)
- **Content**: Why we process slowly (rate limits)

### **Note 5: Triple-Check System**
- **Position**: `[1840, 550]`
- **Size**: 400px wide × 200px tall
- **Location**: Below the 3 verification nodes
- **Color**: Light purple (recommended)
- **Content**: Explains 3-provider verification logic

### **Note 6: Scoring Explained**
- **Position**: `[2500, 500]`
- **Size**: 380px wide × 240px tall
- **Location**: Below "Consensus Scoring"
- **Color**: Light pink (recommended)
- **Content**: Scoring algorithm breakdown (points & penalties)

### **Note 7: Optional Enrichment**
- **Position**: `[3250, 40]`
- **Size**: 360px wide × 180px tall
- **Location**: Above "LinkedIn Enrichment"
- **Color**: Light cyan (recommended)
- **Content**: LinkedIn data + cost warning

### **Note 8: Results Destinations**
- **Position**: `[3880, 550]`
- **Size**: 400px wide × 200px tall
- **Location**: Below the 3 storage nodes
- **Color**: Light lime (recommended)
- **Content**: Where results are saved (Airtable/CRM/Sheets)

### **Note 9: Error Safety**
- **Position**: `[4250, 850]`
- **Size**: 360px wide × 180px tall
- **Location**: Below "Error Handler"
- **Color**: Light red (recommended)
- **Content**: Error resilience features

---

## 🎯 VISUAL ALIGNMENT GUIDE

### **Horizontal Alignment (X-axis)**
```
250   500   750   1000  1250  1500  1750  2000  2250  2500  2750  3000  3250  3500  3750  4000  4250
 ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓     ↓
[1]   [2]   [3]   [4]   [5]   [6]   [7]   [8]   [11]  [12]  [13]  [15]  [16]  [17]  [18]  [19]  [21]
                                           [9]                           [14]              [20]  [22]
                                           [10]
```

### **Vertical Alignment (Y-axis)**
```
40-100:   Sticky notes (above workflow)
200:      Upper parallel branch (verification, enrichment, Airtable)
300:      Main workflow flow (center line)
400:      Lower parallel branch (Debounce, Sheets)
500-550:  Sticky notes (below workflow)
700:      Error handler
850:      Error note
```

---

## 🔗 CONNECTION FLOW DIAGRAM

```
START → Webhook → Validation → Company Batch → Domain Lookup → Pattern Gen → Email Batch → Rate Wait
                                                                                              ↓
                                                                                    ┌─────────┼─────────┐
                                                                                    ↓         ↓         ↓
                                                                                  Hunter  NeverB  Debounce
                                                                                    └─────────┼─────────┘
                                                                                              ↓
                                                                                           Merge
                                                                                              ↓
                                                                                          Scoring
                                                                                              ↓
                                                                                      Confidence Filter
                                                                                              ↓
                                                                                    Enrichment Check?
                                                                                         ↙        ↘
                                                                                    LinkedIn    Skip
                                                                                         ↘        ↙
                                                                                          Formatter
                                                                                              ↓
                                                                                           Tagger
                                                                                              ↓
                                                                                    ┌─────────┼─────────┐
                                                                                    ↓         ↓         ↓
                                                                                 Airtable   CRM     Sheets
                                                                                    └─────────┼─────────┘
                                                                                              ↓
                                                                                          Response

                                                                                          [Error Handler]
```

---

## 📏 SPACING & LAYOUT RULES

### **Horizontal Spacing**
- Nodes: 250px apart (column width)
- Notes: Aligned with node columns
- Wide notes: Can span 1.5-2 columns

### **Vertical Spacing**
- Main flow: y=300 (center line)
- Parallel branches: ±100px from center (y=200, y=400)
- Notes above: y=40-100
- Notes below: y=500-550
- Error section: y=700+

### **Note Sizing Guidelines**
- Standard width: 360-400px
- Standard height: 160-200px
- Wide notes (for complex explanations): 420px
- Keep text readable (min 12px font)

---

## 🎨 RECOMMENDED COLOR SCHEME

### **Sticky Notes**
| Note | Color | Hex Code | Purpose |
|------|-------|----------|---------|
| Note 1 (Overview) | Light Blue | #E3F2FD | Introduction |
| Note 2 (Input) | Light Yellow | #FFF9C4 | Requirements |
| Note 3 (Discovery) | Light Green | #E8F5E9 | Process explanation |
| Note 4 (Batching) | Light Orange | #FFE0B2 | Performance |
| Note 5 (Verification) | Light Purple | #F3E5F5 | Quality assurance |
| Note 6 (Scoring) | Light Pink | #FCE4EC | Algorithm |
| Note 7 (Enrichment) | Light Cyan | #E0F7FA | Optional feature |
| Note 8 (Results) | Light Lime | #F1F8E9 | Output destinations |
| Note 9 (Error) | Light Red | #FFEBEE | Error handling |

### **Node Grouping** (Optional Visual Enhancement)
- Input section (1-2): Blue background
- Processing (3-7): Green background
- Verification (8-12): Purple background
- Enrichment (14-15): Cyan background
- Storage (18-20): Yellow background
- Response (21): Blue background
- Error (22): Red background

---

## 🖼️ CANVAS SIZE RECOMMENDATION

### **Minimum Canvas**
- Width: 4600px (to fit all nodes + spacing)
- Height: 1000px (to fit notes above/below + error handler)

### **Optimal Canvas** (with margins)
- Width: 4800px
- Height: 1100px

### **Zoom Level** (for editing)
- Overview: 40-50% zoom (see entire workflow)
- Detail work: 80-100% zoom (edit individual nodes)

---

## 📋 IMPORT CHECKLIST

When importing this workflow into n8n:

1. **Before Import**
   - [ ] Ensure n8n version ≥1.64.0
   - [ ] Have all API credentials ready
   - [ ] Create Airtable base and table
   - [ ] Set up Google Sheets activity log

2. **During Import**
   - [ ] Import JSON file
   - [ ] Verify all 22 nodes loaded
   - [ ] Verify all 9 sticky notes loaded
   - [ ] Check canvas size (should auto-adjust)

3. **After Import**
   - [ ] Zoom to 40% to see full layout
   - [ ] Verify node positions match this guide
   - [ ] Verify sticky note positions
   - [ ] Check all connections (no red lines)
   - [ ] Configure credentials (7 total)
   - [ ] Test with sample payload

---

## 🔧 MANUAL ADJUSTMENT (If Needed)

If notes don't appear in the right positions after import:

### **Quick Fix Steps**
1. Click on sticky note
2. Drag to correct position (see coordinates above)
3. Resize if text is cut off (drag corners)
4. Change color for better visibility (right-click → color)

### **Batch Repositioning** (if all notes are off)
1. Select all notes (Ctrl/Cmd + A, filter sticky notes)
2. Drag as group to align with first node
3. Individually adjust each note using this guide

---

## 📐 POSITION CALCULATION FORMULA

If you need to add custom nodes or notes:

### **For New Nodes**
```
x_position = last_node_x + 250
y_position = 300 (main flow) or 200/400 (parallel branches)
```

### **For New Notes**
```
x_position = related_node_x - 50 (centered above node)
y_position = 100 (above) or 500 (below)
```

---

## 🎯 EXPECTED RESULT

When you open the imported workflow in n8n:

✅ **You should see:**
- Clean left-to-right flow
- 3 clear parallel sections (verification & storage)
- Notes positioned above/below relevant nodes
- No overlapping elements
- Easy to trace the data flow
- Professional, documentation-ready appearance

❌ **You should NOT see:**
- Nodes overlapping each other
- Notes covering important nodes
- Connection lines crossing unnecessarily
- Disconnected/orphaned nodes
- Misaligned elements

---

## 📸 VISUAL SECTIONS BREAKDOWN

### **Section 1: INPUT (x=250-750)**
```
    [Note 1: Overview]  [Note 2: Input]
           ↓                   ↓
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │ Webhook  │  →    │ Validate │  →    │ Batch Co │
    └──────────┘       └──────────┘       └──────────┘
```

### **Section 2: EMAIL DISCOVERY (x=1000-1250)**
```
           [Note 3: Email Discovery]
                      ↓
    ┌──────────┐            ┌──────────┐
    │  Domain  │  →         │ Pattern  │
    │  Lookup  │            │Generator │
    └──────────┘            └──────────┘
```

### **Section 3: RATE LIMITING (x=1500-1750)**
```
    ┌──────────┐            ┌──────────┐
    │ Email    │  →         │ Rate     │
    │ Batch    │            │ Wait     │
    └──────────┘            └──────────┘
           ↓
    [Note 4: Why We Go Slow]
```

### **Section 4: VERIFICATION (x=2000-2500)**
```
                    ┌──────────┐
                    │ Hunter   │
                    └──────────┘
                          ↓
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │Previous  │ →  │NeverBnce │ →  │  Merge   │
    └──────────┘    └──────────┘    └──────────┘
                          ↓
                    ┌──────────┐
                    │ Debounce │
                    └──────────┘
                          ↓
              [Note 5: Triple-Check]
```

### **Section 5: SCORING (x=2500-2750)**
```
    ┌──────────┐            ┌──────────┐
    │Consensus │  →         │Confidence│
    │ Scoring  │            │ Filter   │
    └──────────┘            └──────────┘
         ↓
    [Note 6: How We Score]
```

### **Section 6: ENRICHMENT (x=3000-3500)**
```
         [Note 7: LinkedIn Bonus]
                    ↓
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Enrichmnt │→ │ LinkedIn │→ │ Format   │
    │  Check   │  │Enrichmnt │  │  JSON    │
    └──────────┘  └──────────┘  └──────────┘
```

### **Section 7: STORAGE (x=3750-4000)**
```
                    ┌──────────┐
                    │ Airtable │
                    └──────────┘
                          ↓
    ┌──────────┐    ┌──────────┐
    │ Quality  │ →  │   CRM    │
    │  Tagger  │    └──────────┘
    └──────────┘          ↓
                    ┌──────────┐
                    │  Sheets  │
                    └──────────┘
                          ↓
              [Note 8: Where Results Go]
```

### **Section 8: RESPONSE & ERROR (x=4250)**
```
    ┌──────────┐
    │ Webhook  │
    │ Response │
    └──────────┘

    ┌──────────┐
    │  Error   │
    │ Handler  │
    └──────────┘
         ↓
    [Note 9: Error Safety]
```

---

**This layout ensures:**
✅ Anyone can understand the workflow at a glance
✅ Non-technical stakeholders can follow the logic
✅ Easy handoff to other team members
✅ Professional, documentation-ready appearance
✅ Clear visual hierarchy of operations

---

**End of Visual Layout Guide**
