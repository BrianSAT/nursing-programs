# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nursing Program Evaluation Matrix** - a Node.js/Express web application for evaluating and comparing 74 nursing programs (58 ABSN, 10 DEMSN, 2 MN, 1 DABSN, 1 AMNP, 1 GEM, 1 MEPN) for Spring 2027 entry. Replaces an Excel spreadsheet with a version-controlled, filterable web interface.

## Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server with auto-reload (http://localhost:3000)
npm start            # Start production server
npm run validate     # Validate program data against schema
```

## Project Structure

```
src/
  server.js             # Express server entry point
  routes/programs.js    # REST API (CRUD for programs.json)
  routes/courses.js     # REST API (CRUD for my-courses.json)
  utils/scoring.js      # Scoring algorithm (for future recalculation)
  utils/validate-data.js
public/
  index.html            # Main page: table, modals, side panel
  css/styles.css        # All styling (table, modal, panel, forms)
  js/app.js             # Frontend: filtering, sorting, detail modal, engine integration
  js/plan-fit-engine.js # Client-side plan-fit evaluation engine
  js/courses.js         # My Courses side panel UI
data/
  programs.json         # 74 programs with scoring and verification data
  my-courses.json       # User's transcript + current/planned courses
  prereq-map.json       # Maps prerequisites.extra strings → standardized tags
  schema.json           # JSON Schema v7
```

## Current Features

### Phase 1: Table + Scoring (Complete)

**Table View**
- Columns: Rank, Program, Type, Location, Duration, Start Date, Deadline, $/Month, Work Commit, Score, Plan Fit, Status
- Color-coded type badges (ABSN/DEMSN/DABSN/MN/GEM/AMNP/MEPN)
- Verification icons on program names
- Work-commitment checkbox toggle (recalculates burn + score in real-time)

**Filtering & Sorting**
- Filter by: program type, data completeness (complete/needs data)
- Plan-fit checkboxes: Fits Plan, Fall Classes, Adjust, Ruled Out (checked = prioritized in list)
- Sort by: score, rank, duration, monthly cost, start date, deadline, name, location, plan_fit
- Search: program name and location

**Detail Modal** (click any row)
- Plan Fit box with computed status, reasons, and warnings
- Notes, program details, scores, costs, scholarships, prerequisites, verification

### Phase 1.5: My Courses Panel + Plan-Fit Engine (Complete)

**My Courses Side Panel** (right side, toggle button in header)
- Tab bar: My Courses (active) | To Do (disabled placeholder)
- Current/planned courses grouped by semester (Spring 1/2, Summer, Fall 2026)
- Course cards with name, institution, online/lab badges, prereq tag chips
- Add/edit/delete course forms with auto-suggest prereq tags from keyword matching
- Collapsible transcript section (UW-Madison, 26 courses)
- Panel is 380px fixed right, main content flexes when open

**Dynamic Plan-Fit Engine** (`public/js/plan-fit-engine.js`)
- Runs client-side on every course change
- Replaces hardcoded `plan_fit.status` + `plan_fit.reasons` with live computation
- Evaluation pipeline per program:
  1. Not accepting check (verification notes contain "NOT ACCEPTING")
  2. Deadline passed check
  3. In-progress policy check (in_progress_ok=false + user has incomplete prereqs)
  4. Hard blocker check (CNA, healthcare exp, residency via prereq-map)
  5. Online lab policy check (online_lab_conf <= 0.1 → ruled_out, null → warning)
  6. Standard prereq check (ap_1_2 needs both ap1+ap2, chem_sequence needs 2 chem courses)
  7. Extra prereq check via prereq-map.json (OR/AND logic, type-based handling)
  8. Status: 0 missing → fits, 1-3 → fall_required, 4+ → adjust, blocker → ruled_out

**Current engine results** (with Brian's pre-populated courses):
- 24 fits, 21 fall_required, 0 adjust, 29 ruled_out

## API Endpoints

- `GET /api/programs` - List all programs (scores pre-calculated in data)
- `GET /api/programs/:id` - Get single program
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program
- `GET /api/courses` - Load all course data (semesters, courses, transcript)
- `POST /api/courses` - Add a course
- `PUT /api/courses/:id` - Update a course
- `DELETE /api/courses/:id` - Remove a course
- `GET /api/prereq-map` - Load prereq-map.json (static serve)

## Data Notes

- All 74 programs have scoring and verification data in `data/programs.json`
- Program types: 58 ABSN, 10 DEMSN, 2 MN, 1 DABSN, 1 AMNP, 1 GEM, 1 MEPN
- Duplicate IDs exist: `rush` (GEM + DEMSN), `vanderbilt-mn` (MN + DEMSN)
- Cost fields use Excel column names: `Mo. Burn`, `Schlrshp Amt`, `COL Index`

### my-courses.json Structure

```json
{
  "semesters": { "spring1_2026": { "label": "...", "end_date": "2026-03-13" }, ... },
  "courses": [{ "id", "name", "institution", "semester", "status", "tags": [], "online", "has_lab", "credits" }],
  "transcript": [{ "id", "name", "institution", "status": "completed", "tags": [], "grade", "credits", "notes?" }]
}
```

### prereq-map.json Structure

Maps every unique `prerequisites.extra` string → `{ tags: [], type, logic?, hard_blocker, notes? }`.
- Types: course, exam, certification, experience, document, policy, institutional
- OR logic: `tags: [["patho", "pharm"]]` means either tag satisfies
- Hard blockers: CNA, healthcare_exp, residency → immediately rules out program
- Exams (teas, hesi, gre) → warnings only, not counted as missing courses
- Documents (resume, letters) → skipped entirely

### Tag Taxonomy

**Standard tags** (match `prerequisites.standard` keys):
`ap1`, `ap2` (combine for `ap_1_2`), `micro`, `stats`, `chem`, `lifespan`, `nutrition`, `psych`, `sociology`, `biology`, `ethics`

**Extended tags** (for extra prereqs):
`pathophysiology`, `pharmacology`, `organic_chem`, `biochemistry`, `chem_sequence`, `gen_chem_lab`, `genetics`, `gen_biology`, `english_comp`, `speech_comm`, `fine_arts`, `history`, `us_government`, `tx_government`, `theology`, `college_algebra`, `abnormal_psych`, `cultural_diversity`, `philosophy`, `critical_thinking`, `epidemiology`, `foreign_language`

**Non-course tags**: `teas`, `hesi`, `gre`, `cna`, `bls`, `healthcare_exp`, `residency`

## Scoring Formula

### Goal
Find the best ABSN program for transitioning to become a **triage nurse in an under-resourced healthcare system**.

### Pathway
`BSN → RN work (ED/triage experience) → NP program (while working) → Triage NP in underserved area`

### Formula
```
raw_score = (location_score + boost) × prereq_fit × online_lab_conf × np_pathway
            × prestige × competitiveness × start_score × time_factor × cost_score
```

All factors are multiplied together (weights default to 1.0). A zero in any factor zeros the entire score.

### Factor Definitions

| Factor | Range | Description | Calculation |
|--------|-------|-------------|-------------|
| `location_score` | 0-9.5+ | Base desirability (auto-calculated from metro-scoring.js) | See Location Score Rubric below |
| `location_boost` | 0-0.5 | NP practice authority bonus (+0.5 for full NP states) | Auto from state |
| `prereq_fit` | 0-1 | How well current coursework matches requirements | Manual |
| `online_lab_conf` | 0-1 | Confidence that online/lab components are manageable | Manual |
| `prestige` | 0-1 | Career value of the degree downstream | Manual rating |
| `competitiveness` | 0-1 | Ease of admission (sweet spot = 80th percentile) | `1 - |national_percentile - 0.8|` |
| `start_score` | 0-1 | How well start date aligns with target (Jan 2027) | Calculated from start_date |
| `time_factor` | 0.2-1 | Preference for shorter programs | ≤12mo=1.0, 13-16mo=0.8, 17-23mo=0.6, 24-31mo=0.4, ≥32mo=0.2 |
| `cost_score` | 0-1 | Affordability (lower monthly burn = higher score) | `max(0, 1 - monthly_burn/10000)` |
| `np_pathway` | 0-1 | Regional viability for BSN→NP transition | See below |

### Location Score Rubric (v2)

Auto-calculated by `data/metro-scoring.js`. Base max 9.5 + 0.5 NP boost = 10.

| Component | Max | Description |
|-----------|-----|-------------|
| **Distance** | 3 | Drive time from Milwaukee + airport connectivity |
| **Geography** | 2.5 | Outdoor/natural appeal (mountains, rivers, coast) |
| **Desirability** | 3 | cool_factor (0-2, research-based) + size_pref (0-1, population formula) |
| **Bonuses** | 1 | Food(+0.25) + Events(+0.25) + Dating(+0.25) + Student Vibe(+0.25) |
| **Manual bonus** | varies | User overrides and regional penalties (recorded in metro-scores.json) |

**Size preference strata**: 500K-1.5M=1.0, >1.5M=0.8, 250K-500K=0.7, 100K-250K=0.3, <100K=0.0

**location_boost** = +0.5 for states with full NP practice authority (AZ, CO, CT, DC, HI, ID, IA, ME, MD, MN, MT, NE, NV, NH, NM, ND, OR, RI, SD, VT, WA, WY)

**Manual overrides**: Pittsburgh +1, Spokane +0.75, Austin +0.75, Chicago +0.75, New Orleans +0.75, Memphis +0.25, St. Louis +0.25, Seattle +0.5, Denver -0.75. No regional penalties — let the math sort it out.

**Workflow**: Edit `data/metro-scoring.js` → run `node data/metro-scoring.js` → run `node data/sync-programs.js`

### NP Pathway Score (Regional Viability)

Measures how well the program's **region** supports the career transition, not the school's NP program quality.

```
np_pathway = 0.35 × ed_opportunity + 0.40 × np_accessibility + 0.25 × underserved_access
```

| Component | Weight | What it measures |
|-----------|--------|------------------|
| `ed_opportunity` | 35% | Can you get ED/trauma RN experience? (Level 1/2 trauma centers in metro) |
| `np_accessibility` | 40% | Are there part-time/hybrid NP programs for working nurses? |
| `underserved_access` | 25% | Proximity to underserved populations (HPSAs, FQHCs) |

**Rationale**: NP accessibility weighted highest because doing NP while working requires local programs. You can travel for underserved work later, but need local NP options.

### Competitiveness vs Prestige

These measure **different things**:

- **Competitiveness**: How hard is it to get in? Sweet spot is 80th percentile - not too hard, not too easy. Being at 100th percentile (ultra-competitive) is penalized equally to 60th percentile.

- **Prestige**: How valuable is this degree for your career? Higher is always better. Ideal: high prestige school that's not impossible to get into.

### Cost Score

Programs with monthly burn rate >$10,000 automatically score 0 (non-starter threshold).

### Combined Location Score

Used for sorting by location (not alphabetically). Combines base location desirability with regional NP pathway viability.

```
location_combined = (location_score + location_boost) × np_pathway
```

This ensures that when sorting by "location", programs in regions with better NP pathway opportunities rank higher.

## Data Files

| File | Purpose |
|------|---------|
| `data/programs.json` | Main program data with scores and verification |
| `data/my-courses.json` | User's transcript (26 UW-Madison courses) + 7 current/planned courses |
| `data/prereq-map.json` | Maps ~110 prerequisites.extra strings to standardized tags |
| `data/regional-data.json` | Regional NP pathway viability data per metro area |
| `data/metro-scores.json` | Metro area scoring data (auto-generated by metro-scoring.js) |
| `data/metro-scoring.js` | Metro scoring logic: rubric, cool_factor, bonuses, manual overrides |
| `data/sync-programs.js` | Syncs metro scores → programs.json, fixes competitiveness, re-ranks |
| `data/schema.json` | JSON Schema for validation |

```
monthly_burn = (tuition + fees - scholarships + living_costs) / duration_months
cost_score = max(0, 1 - monthly_burn / 10000)
```

## Implementation Status (as of Feb 2, 2026)

### Just Completed: My Courses Panel + Plan-Fit Engine

Commit `653a336` — 9 files changed, 2789 insertions. All pushed to `origin/master`.

**What works:**
- Server starts clean (`npm run dev`), all endpoints serve correctly
- Plan-fit engine evaluates all 74 programs against user's course tags
- Engine tested via Node.js: 24 fits, 21 fall_required, 0 adjust, 29 ruled_out
- CRUD API tested: POST creates course, DELETE removes it, both trigger JSON file writes
- Side panel HTML/CSS is wired up, toggle button in header works

**What needs browser testing:**
- Open http://localhost:3000 and verify the table renders with dynamically computed Plan Fit column
- Click "My Courses" button — panel should slide in from right, main table should narrow
- Verify courses render in semester groups with correct tags
- Click "+ Add Course" in a semester — form should appear with tag chips
- Type a course name (e.g. "Pathophysiology") — tags should auto-suggest
- Save a course for Fall 2026 → table should re-evaluate (some fall_required → fits)
- Delete it → table should revert
- Expand transcript section → 26 UW-Madison courses should appear
- Click a program row → detail modal should show computed plan-fit (not hardcoded)
- Sort by Plan Fit column → should use computed statuses
- Fit checkboxes → should partition by computed statuses

**Known discrepancies vs hardcoded plan_fit:**
- More programs show "fits" (24 vs 17) because the engine correctly matches transcript tags (ethics, philosophy, cultural_diversity, sociology, psych, speech_comm, etc.) against extra prereqs that the hardcoded evaluation didn't account for
- 0 "adjust" (vs 3) because transcript tags cover what were previously uncounted extras
- ISU Boise went from "adjust" (5 extras) to "fall_required" (3 missing) because Cultural Diversity + Medical Ethics are satisfied by transcript
- Northeastern shows "fits" instead of "adjust" because its `online_lab_conf` is null (unknown), not 0.1 — engine correctly warns rather than blocking

**Architecture decisions:**
- Engine runs fully client-side (no server-side evaluation) — every course change triggers immediate re-evaluation
- `computedPlanFit` object in app.js holds engine results, `getPlanFit(program)` falls back to stored `plan_fit` if engine hasn't run
- `reEvaluateAndRender()` is the global function courses.js calls after any CRUD operation
- prereq-map.json is served as a static file via dedicated Express route (not through courses router)

## Next Phases

**Phase 2**: Data Entry - CRUD forms, inline editing, schema validation

**Phase 3**: External Data - Web scraping, cost-of-living API integration

**To Do tab** (in panel): Currently a disabled placeholder — future feature for tracking application tasks per program
