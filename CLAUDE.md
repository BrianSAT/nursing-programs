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

```
raw_score = (location_score + boost) × prereq_fit^w × online_lab^w × np_pathway^w
            × prestige^w × competitiveness^w × start_score^w × time_factor^w × cost_score^w
```

## Next Phases

**Phase 2**: Data Entry - CRUD forms, inline editing, schema validation

**Phase 3**: External Data - Web scraping, cost-of-living API integration
