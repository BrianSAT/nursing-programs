# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Nursing Program Evaluation Matrix** - a Node.js/Express web application for evaluating and comparing ~40 Accelerated BSN (ABSN) programs for Spring 2027 entry. The project replaces an error-prone Excel spreadsheet with a version-controlled, data-driven decision support system.

## Build Commands

```bash
npm install          # Install dependencies (express required)
npm run dev          # Start dev server with auto-reload (http://localhost:3000)
npm start            # Start production server
npm test             # Run all tests
npm run test:single <file>  # Run single test file
npm run validate     # Validate program data against schema
```

## Project Structure

```
src/
  server.js           # Express server entry point
  routes/programs.js  # REST API for program CRUD + scoring
  utils/scoring.js    # Scoring algorithm implementation
  utils/validate-data.js
public/               # Static frontend (HTML/CSS/JS)
data/
  programs.json       # Program data (git-tracked)
  schema.json         # JSON Schema v7 for validation
```

## API Endpoints

- `GET /api/programs` - List all programs with calculated scores
- `GET /api/programs/:id` - Get single program
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program

## Scoring Algorithm

The core scoring formula in `src/utils/scoring.js`:

```
raw_score = (location_score + location_boost) × prereq_fit^w × online_lab_conf^w
            × np_pathway^w × prestige^w × competitiveness^w × start_score^w
            × time_factor^w × cost_score^w
```

Key calculated fields:
- `competitiveness`: Peaks at target 80th percentile national ranking
- `start_score`: Time penalty/bonus relative to 2027-01-20 target start
- `time_factor`: Duration penalty (≤12mo=1.0, 13-18mo=0.75, 19-24mo=0.5, >24mo=0.25)
- `monthly_burn`: (net_tuition + total_living) / duration_months

## Data Schema

Program objects include:
- **Core fields**: id, name, type (ABSN/DEMSN/DABSN/MN/GEM), location
- **Prerequisites**: 11-field boolean grid
- **Costs**: tuition, fees, cost_of_living_index, scholarship details
- **Scores**: manual assessments (0-1 scale, location 0-10)
- **Data completeness**: complete | partial | stub

## Development Phases

**Phase 1 (Current)**: Foundation - basic structure, JSON storage, sortable table, scoring

**Phase 2**: Data Entry - CRUD forms, schema validation

**Phase 3**: External Data - Web scraping, cost-of-living integration

## Original Specifications

Detailed requirements are in `Installation Files/From Claude OG/`:
- `CLAUDE_CODE_STARTER.md` - Full project brief and requirements
- `nursing_program_schema.json` - Original schema specification
- `nursing_programs_sample.json` - Original sample data
