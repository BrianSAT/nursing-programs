# Nursing Program Matrix - Claude Code Project Brief

## Context
I'm a career-changer targeting Spring 2027 ABSN program entry. I've been maintaining a 40-program evaluation matrix in Excel, but it keeps getting corrupted during edits. I want to rebuild this as a proper web app with version-controlled data.

## Current State
- `nursing_program_schema.json` - JSON Schema defining the data structure
- `nursing_programs_sample.json` - Sample data for 3 programs demonstrating the format

## Goals

### Phase 1: Foundation
1. Set up a basic project structure (I'm thinking Python + Flask or Node, your call)
2. Store program data in JSON files tracked by git
3. Build a simple local web UI that displays all programs in a sortable/filterable table
4. Implement the scoring calculations (formulas documented in the schema file under `calculated_fields_documentation`)

### Phase 2: Data Entry
1. Add forms to create/edit program entries
2. Validation against the schema
3. Mark fields as "needs research" vs "confirmed"

### Phase 3: External Data (future)
1. Scrape program websites for tuition, deadlines, prerequisites
2. Pull in cost-of-living data by city
3. Track changes over time

## Scoring Logic Summary
The raw score formula multiplies location score by several 0-1 factors raised to configurable weights:

```
raw_score = (location_score + boost) 
            × prereq_fit^w 
            × online_lab_conf^w 
            × np_pathway^w 
            × prestige^w 
            × competitiveness^w 
            × start_score^w 
            × time_factor^w 
            × cost_score^w
```

Where:
- `competitiveness = 1 - abs(national_percentile - 0.8)` (peaks at 80th percentile)
- `start_score` = based on days from target start (Jan 20, 2027)
- `time_factor` = penalty for longer programs (≤12mo=1.0, 13-18=0.75, etc.)
- `cost_score` = normalized monthly burn rate

## My Setup
- Mac/Windows/Linux: [fill in]
- Comfortable with: terminal basics, some Python experience from old projects
- Want to learn: proper version control workflow, modern web dev patterns

## First Request
Let's start with Phase 1. Set up a minimal project structure and get a basic table displaying the sample data. I want to understand each file you create.
