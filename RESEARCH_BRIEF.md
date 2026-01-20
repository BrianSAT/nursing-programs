# Research Brief: Complete Data for 18 Nursing Programs

## My Context (Why This Matters)

I'm a 43-year-old career changer targeting **Spring 2027 ABSN program entry**. Ultimate goal: become a **Nurse Practitioner** for maximum clinical autonomy. This means:

- **NP Pathway matters a lot** — I want schools where I can continue to an NP program (ideally at the same institution)
- **I'm not chasing elite programs** — I'm targeting the **80th percentile** nationally (good but realistic)
- **Speed matters** — 12-month programs preferred over 18-24 month programs
- **I have unusual prerequisites** — Some already done from UW-Madison BA (Psych, Ethics), currently completing sciences at Wisconsin tech colleges

### Location Preferences (Critical Context)
- **Pittsburgh is #1 preference** — give it a +1 boost. Love the geography, industrial-meets-tech vibe, midwestern feel
- **Strong interest in:** Seattle, Texas cities (Houston, Austin), New Orleans, Nashville, Portland
- **Avoiding:** Staying in Milwaukee long-term (family pressure)
- **Value:** Water features, topology, hiking; mid-size cities with cultural momentum; reasonable COL

---

## Programs Needing Data (18)

```
Drexel, U Kentucky, Baylor, DePaul, Edgewood, Alverno, Regis, 
Samuel Merritt, Rush (duplicate?), Marquette GEM, UW-Milwaukee, 
Vanderbilt MN (duplicate?), Johns Hopkins, UCLA MECN, Columbia, 
Yale, North Park, Lourdes
```

---

## Data to Collect for Each Program

### From Program Website (Factual)

| Field | Where to Find | Notes |
|-------|---------------|-------|
| **Type** | Program page | ABSN, DEMSN, DABSN, MN, or GEM |
| **Location** | Program page | City, State |
| **Start Date** | Admissions page | When does Spring 2027 cohort start? |
| **App Deadline** | Admissions page | For Spring 2027 entry |
| **Duration** | Program overview | In months (12, 15, 16, 18, etc.) |
| **Terms** | Program overview | Number of semesters/quarters |
| **Tuition** | Tuition/costs page | Total program cost |
| **Fees** | Tuition/costs page | Additional fees |
| **Admissions Email** | Contact page | Direct admissions contact |

### Prerequisites (Y/N for each)
Check the program's prerequisite page for:
- A&P I and II (both required?)
- Microbiology
- Statistics  
- Chemistry (with lab?)
- Lifespan/Developmental Psychology
- Nutrition
- General Psychology
- Sociology
- Biology (separate from A&P?)
- Ethics/Philosophy

**Additional Prerequisites:** List anything beyond the above (e.g., "Pathophysiology", "Genetics", "Pharmacology", "Medical Terminology")

### Assessments (Requires Judgment)

#### Location Score (0-10)
Based on my methodology:
- **Distance (0-3 pts):** Drive time from Milwaukee + airport connectivity
  - <4 hrs or direct flight hub: 3
  - 4-8 hrs or 1-stop flight: 2  
  - >8 hrs or difficult access: 1
  - Very remote: 0
  
- **Geography (0-3 pts):** Water features, topology, hiking
  - Mountains + water + trails: 3
  - Good outdoor access: 2
  - Some features: 1
  - Flat/landlocked/limited: 0
  
- **City Size/Culture (0-4 pts):** Metro population, cultural trajectory
  - Major metro with momentum (Austin, Nashville): 4
  - Large established city: 3
  - Mid-size with character: 2
  - Small/isolated: 1

**Location Boost:** Only Pittsburgh gets +1. Others get 0.

#### NP Pathway (0-1)
- 1.0: Same institution has highly-ranked NP programs, clear BSN→MSN/DNP pathway, good clinical placements
- 0.8: Has NP programs, reasonable pathway
- 0.6: Has some graduate nursing, but not strong NP focus
- 0.4: BSN only, would need to go elsewhere for NP
- 0.2: Limited graduate options

#### Prestige (0-1)
- 0.9-1.0: Top 10 nationally (Penn, Johns Hopkins, Duke)
- 0.8: Top 25
- 0.7: Top 50
- 0.6: Regionally strong
- 0.5: Average/unknown
- 0.4: Below average or concerns

#### National Percentile (0-1)
For the Competitiveness calculation. Research US News nursing rankings:
- 1.0: #1 nationally
- 0.9: Top 10
- 0.8: Top 20% ← MY TARGET SWEET SPOT
- 0.7: Top 30%
- 0.5: Median
- 0.3: Bottom third

**Note:** My scoring formula penalizes BOTH elite (>0.9) and weak (<0.7) programs. The sweet spot is 0.75-0.85.

#### Addl Prereq Fit (0-1)
Probability I can complete ALL prerequisites in time to apply (deadline ~Fall 2026):

- 1.0: Only standard prereqs (A&P, Micro, Stats, Chem, Lifespan, Nutrition) — I'll have these done
- 0.8: Has 1 additional prereq that's available online (e.g., Medical Terminology)
- 0.5: Has additional prereq requiring planning (e.g., Pathophysiology)
- 0.3: Has prereq with timing constraints (e.g., must be taken within 2 years, nursing-specific course)
- 0.1: Has prereq I likely can't complete (e.g., Cincinnati's nursing-specific Pharmacology)

#### Online Lab Confidence (0-1)
Whether they accept online labs for A&P, Micro, Chem:
- 1.0: Explicitly accepts online labs
- 0.8: Silent on the issue (probably fine)
- 0.5: Ambiguous or "case by case"
- 0.2: Prefers in-person, may accept
- 0.0: Requires in-person labs only

---

## COL Index Reference
Use these for cost calculations (Milwaukee = 100):

| City | COL Index |
|------|-----------|
| Columbus, OH | 95 |
| Houston, TX | 96 |
| Pittsburgh, PA | 98 |
| Milwaukee, WI | 100 |
| Madison, WI | 105 |
| Nashville, TN | 105 |
| Atlanta, GA | 108 |
| Durham, NC | 110 |
| Chicago, IL | 115 |
| Portland, OR | 130 |
| Boston, MA | 145 |
| Seattle, WA | 150 |
| San Francisco, CA | 165 |
| NYC, NY | 180 |
| LA, CA | 160 |

For cities not listed, estimate relative to these anchors.

---

## Output Format

For each program, provide data in this structure:

```json
{
  "name": "Program Name",
  "type": "ABSN",
  "location": "City, State",
  "admissions": {
    "email": "nursing@school.edu",
    "deadline": "2026-09-15",
    "start_date": "2027-01-15"
  },
  "program_details": {
    "duration_months": 12,
    "terms": 4
  },
  "prerequisites": {
    "standard": {
      "ap_1_2": true,
      "micro": true,
      "stats": true,
      "chem": true,
      "lifespan": true,
      "nutrition": true,
      "psych": false,
      "sociology": false,
      "biology": false,
      "ethics": false
    },
    "additional": "Pathophysiology, Genetics",
    "addl_prereq_fit": 0.5
  },
  "costs": {
    "tuition": 50000,
    "fees": 2500,
    "col_index": 115
  },
  "scores": {
    "location_score": 7.5,
    "location_boost": 0,
    "np_pathway": 0.8,
    "prestige": 0.75,
    "national_percentile": 0.78,
    "online_lab_conf": 0.8
  },
  "notes": "Key observations about the program",
  "sources": ["URL1", "URL2"]
}
```

---

## Research Process

1. **Search for:** "[School Name] accelerated BSN" or "[School Name] ABSN prerequisites"
2. **Find the official nursing school page** — avoid third-party aggregators
3. **Look for:** Admissions requirements, tuition/costs, program overview, contact info
4. **For rankings:** Search "US News nursing school rankings [School Name]"
5. **For NP pathway:** Check if the nursing school offers MSN, DNP, or NP tracks

---

## Quality Checks

- Start dates should be in 2027 for Spring 2027 entry
- Deadlines should be in 2026 (typically Sept-Nov for Spring start)
- Duration is typically 11-18 months for ABSN
- Tuition ranges from ~$30K (state schools) to ~$100K+ (elite privates)
- Always note the source URL for verification

---

## Priority Order

Research in this order (most likely to be useful to me first):

1. **Rush** — Chicago, interested in this one
2. **DePaul** — Chicago option
3. **Marquette GEM** — Milwaukee but might be worth it
4. **Regis** — Denver area, outdoor access
5. **Johns Hopkins** — Elite but worth knowing the data
6. **Baylor** — Texas option
7. **U Kentucky** — Lower COL option
8. **Vanderbilt MN** — Nashville, good city
9. **UCLA MECN** — CA option
10. **Yale** — Elite comparison
11. **Columbia** — NYC option
12. **Drexel** — Philly, close to Pittsburgh
13. **North Park** — Chicago option
14. **Samuel Merritt** — Bay Area
15. **UW-Milwaukee** — Local backup
16. **Edgewood** — Madison backup  
17. **Alverno** — Milwaukee backup
18. **Lourdes** — Unknown, low priority
