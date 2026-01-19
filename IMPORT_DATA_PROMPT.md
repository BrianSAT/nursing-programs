# Import Real Data Into Nursing Matrix App

## Context
I've exported my full nursing program evaluation data from Excel. The file `nursing_programs_full_export.json` contains 40 programs with all scoring data, prerequisites, costs, and metadata.

## Current State
- Basic app running at localhost:3000 with sample data
- Need to replace sample data with real export
- Need to display more columns and match the Excel structure

## Data File Location
`nursing_programs_full_export.json` - drop this in your project root or data folder

## What I Need

### 1. Replace Sample Data
Load the full export instead of the 3-program sample. The structure is:
```json
{
  "metadata": { "target_start", "weights", ... },
  "programs": [ ... 40 programs ... ],
  "scoring_formula": { ... documentation ... }
}
```

### 2. Display These Columns (matching my Excel)
Essential columns for the main table:
- Program (name)
- Type (ABSN/DEMSN/etc)
- Location (location.full)
- Duration (program_details.duration_months)
- Start Date (admissions.start_date)
- App Deadline (admissions.deadline)
- Monthly Cost (costs["Mo. Burn"] if available)
- Raw Score (scores.raw_score)
- Rank (scores.rank)
- Data Status (derived: "complete" if raw_score exists, else "needs data")

### 3. Filtering & Sorting
- Sort by: Score (default), Rank, Duration, Cost, Start Date
- Filter by: Type, State/Region, Has Complete Data
- Search: Program name, location

### 4. Detail View
Clicking a program should show all fields:
- Prerequisites grid (standard + additional)
- Scores breakdown (all individual scores)
- Cost breakdown (if available)
- Notes
- Admissions contact

### 5. Score Calculation
Right now scores come pre-calculated from Excel. Eventually I want the app to calculate them using the formulas in `scoring_formula`. But for now, just display what's in the data.

## Scoring Formula Reference
```
raw_score = (location_score + boost) 
            × prereq_fit^w 
            × online_lab^w 
            × np_pathway^w 
            × prestige^w 
            × competitiveness^w 
            × start_score^w 
            × time_factor^w 
            × cost_score^w
```

Where `competitiveness = 1 - abs(national_percentile - 0.8)` and weights default to 1.

## Data Completeness
Programs with `scores.raw_score` populated = "complete" (22 programs)
Programs without = "needs data" (18 programs)

## Priority
1. Get real data loading and displaying
2. Add column sorting  
3. Add filters
4. Add detail view
5. (Later) Add edit capability
6. (Later) Add scrapers

Let's start with #1 - loading the real data file and displaying it in the table with the essential columns listed above.
