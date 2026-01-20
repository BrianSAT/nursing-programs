# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nursing Program Evaluation Matrix** - a Node.js/Express web application for evaluating and comparing 40 Accelerated BSN programs for Spring 2027 entry. Replaces an Excel spreadsheet with a version-controlled, filterable web interface.

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
  routes/programs.js    # REST API (CRUD, serves pre-calculated scores)
  utils/scoring.js      # Scoring algorithm (for future recalculation)
  utils/validate-data.js
public/
  index.html            # Main page with table and modal
  css/styles.css        # Styling including modal, type badges
  js/app.js             # Frontend: filtering, sorting, detail modal
data/
  programs.json         # 40 programs from Excel export (22 complete, 18 needs data)
  schema.json           # JSON Schema v7
```

## Current Features (Phase 1 Complete)

**Table View**
- Columns: Rank, Program, Type, Location, Duration, Start Date, Deadline, $/Month, Score, Status
- Color-coded type badges (ABSN/DEMSN/DABSN/MN/GEM)
- "Needs Data" rows shown with reduced opacity

**Filtering & Sorting**
- Filter by: program type, data completeness (complete/needs data)
- Sort by: score, rank, duration, monthly cost, start date, deadline, name
- Search: program name and location

**Detail Modal** (click any row)
- Notes, program details (duration, terms, dates)
- Full scores breakdown (raw score, location, prestige, NP pathway, etc.)
- Cost breakdown (tuition, fees, net tuition, monthly burn, scholarships)
- Prerequisites grid with additional requirements
- Contact email

## API Endpoints

- `GET /api/programs` - List all programs (scores pre-calculated in data)
- `GET /api/programs/:id` - Get single program
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program

## Data Notes

- Scores are pre-calculated from Excel export in `data/programs.json`
- 22 programs have complete scoring data, 18 marked as "needs data"
- Duplicate IDs exist: `rush` (GEM + DEMSN), `vanderbilt-mn` (MN + DEMSN)
- Cost fields use Excel column names: `Mo. Burn`, `Schlrshp Amt`, `COL Index`

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
| `location_score` | 1-10 | Base desirability of location | Manual rating |
| `location_boost` | 0-2 | Bonus for preferred cities (e.g., Pittsburgh) | Manual |
| `prereq_fit` | 0-1 | How well current coursework matches requirements | Manual |
| `online_lab_conf` | 0-1 | Confidence that online/lab components are manageable | Manual |
| `prestige` | 0-1 | Career value of the degree downstream | Manual rating |
| `competitiveness` | 0-1 | Ease of admission (sweet spot = 80th percentile) | `1 - |national_percentile - 0.8|` |
| `start_score` | 0-1 | How well start date aligns with target (Jan 2027) | Calculated from start_date |
| `time_factor` | 0.2-1 | Preference for shorter programs | ≤12mo=1.0, 13-16mo=0.8, 17-23mo=0.6, 24-31mo=0.4, ≥32mo=0.2 |
| `cost_score` | 0-1 | Affordability (lower monthly burn = higher score) | `max(0, 1 - monthly_burn/10000)` |
| `np_pathway` | 0-1 | Regional viability for BSN→NP transition | See below |

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
| `data/programs.json` | Main program data with scores |
| `data/regional-data.json` | Regional NP pathway viability data (ed_opportunity, np_accessibility, underserved_access) for each metro area |
| `data/schema.json` | JSON Schema for validation |

```
monthly_burn = (tuition + fees - scholarships + living_costs) / duration_months
cost_score = max(0, 1 - monthly_burn / 10000)
```

## Next Phases

**Phase 2**: Data Entry - CRUD forms, inline editing, schema validation

**Phase 3**: External Data - Web scraping, cost-of-living API integration
