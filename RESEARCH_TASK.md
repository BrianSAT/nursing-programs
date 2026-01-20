# Task: Research and Complete Data for 18 Nursing Programs

## Instructions

Read `RESEARCH_BRIEF.md` for full context on my situation, scoring methodology, and what data to collect.

## The Task

For each of the 18 programs listed in the brief that need data:

1. **Search the web** for the program's official nursing school page
2. **Extract the factual data**: tuition, deadlines, duration, prerequisites, contact info
3. **Make the assessments**: location score, NP pathway, prestige, national percentile, prereq fit
4. **Output in JSON format** as specified in the brief
5. **Note your sources** so I can verify

## How to Execute

For each program:
```
1. Search: "[School Name] accelerated BSN program"
2. Find official page, extract data
3. Search: "US News [School Name] nursing ranking" for prestige/percentile
4. Apply my scoring methodology (detailed in RESEARCH_BRIEF.md)
5. Output the JSON block
```

## Important Notes

- **Use my methodology** for location scores — not generic "is this a nice city" but specifically: drive time from Milwaukee, geography/outdoor access, city size/culture
- **The 80th percentile is the target** — I don't want the most elite programs, I want realistic ones with good outcomes
- **Prerequisites matter** — If a program has unusual requirements that would be hard for me to complete, flag it with low `addl_prereq_fit`
- **Pittsburgh gets +1 boost** — No other city does

## Output

Either:
1. Update the `nursing_programs_full_export.json` directly with the new data, OR
2. Create a `new_programs_data.json` with just the 18 researched programs that I can merge

Start with the first 5 programs in my priority order:
1. Rush
2. DePaul  
3. Marquette GEM
4. Regis
5. Johns Hopkins

Then continue with the rest if those look good.
