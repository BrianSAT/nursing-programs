/**
 * Add ABSN programs from top 25 metros (excluding those already covered)
 * These programs were researched based on metro scoring analysis
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// New programs from top 25 metros (based on web research January 2026)
const newPrograms = [
  // #1 St. Louis, MO (8.36)
  {
    id: "slu-stlouis",
    name: "Saint Louis University",
    type: "ABSN",
    location: { full: "St. Louis, MO" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@slu.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 9.5, location_boost: 0, np_pathway: 0.88, prestige: 0.75, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.70, location_combined: null },
    notes: "CCNE accredited; 97% NCLEX pass rate; Spring/Fall starts",
    scoring_notes: "Top St. Louis metro - excellent NP pathway",
    costs: { Location: "St. Louis, MO", Tuition: 52000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 55000, "COL Index": 95, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 22800, "Total Cost": 77800, "Mo. Burn": 4863, "Cost Score": null },
    regional: { ed_opportunity: 0.90, np_accessibility: 0.85, underserved_access: 0.90, np_pathway_calculated: 0.88 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.2 }, expected_value_no_commitment: 1000, expected_value_with_commitment: 1000 }
  },

  // #2 Portland, OR (8.00)
  {
    id: "ohsu-portland",
    name: "OHSU",
    type: "ABSN",
    location: { full: "Portland, OR" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@ohsu.edu", deadline: "2026-02-01", start_date: "2027-01-10" },
    program_details: { duration_months: 15, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 8.5, location_boost: 1.25, np_pathway: 0.82, prestige: 0.85, competitiveness: 0.80, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.80, location_combined: null },
    notes: "Tuition Promise locks rate; 15-month intensive; Ashland/Bend/Portland",
    scoring_notes: "Full NP practice authority state + food/music/dating scene",
    costs: { Location: "Portland, OR", Tuition: 46044, Fees: 2500, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 48544, "COL Index": 130, "Duration (mo)": 15, "Living $/mo": 1500, "Total Living": 29250, "Total Cost": 77794, "Mo. Burn": 5186, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.85, underserved_access: 0.80, np_pathway_calculated: 0.82 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #3 Austin, TX (7.75)
  {
    id: "stedwards-austin",
    name: "St. Edward's University",
    type: "ABSN",
    location: { full: "Austin, TX" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@stedwards.edu", deadline: "2025-12-31", start_date: "2026-08-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 8.5, location_boost: 1.25, np_pathway: 0.80, prestige: 0.70, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.65, location_combined: null },
    notes: "Fall 2026 applications open; Private Catholic university",
    scoring_notes: "On-the-come-up city + food/music/dating scene",
    costs: { Location: "Austin, TX", Tuition: 55000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 58000, "COL Index": 115, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 27600, "Total Cost": 85600, "Mo. Burn": 5350, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.85, underserved_access: 0.70, np_pathway_calculated: 0.80 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.2 }, expected_value_no_commitment: 1000, expected_value_with_commitment: 1000 }
  },

  // #4 Louisville, KY (7.52)
  {
    id: "uofl-louisville",
    name: "University of Louisville",
    type: "ABSN",
    location: { full: "Louisville, KY" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@louisville.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 15, terms: 5, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Hybrid program; Louisville or Owensboro campus; 500+ clinical hours",
    scoring_notes: "Very affordable for residents; strong food scene",
    scores: { location_score: 9.0, location_boost: 0.25, np_pathway: 0.81, prestige: 0.70, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.60, location_combined: null },
    costs: { Location: "Louisville, KY", Tuition: 29160, Fees: 2500, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 31660, "COL Index": 90, "Duration (mo)": 15, "Living $/mo": 1500, "Total Living": 20250, "Total Cost": 51910, "Mo. Burn": 3461, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.80, underserved_access: 0.85, np_pathway_calculated: 0.81 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #5 Cleveland, OH (7.44)
  {
    id: "csu-cleveland",
    name: "Cleveland State",
    type: "ABSN",
    location: { full: "Cleveland, OH" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@csuohio.edu", deadline: "2026-04-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Online with 2 on-campus residencies; Cleveland Clinic rotations; OH/IN/KY residents",
    scoring_notes: "Affordable public option; music city bonus",
    scores: { location_score: 8.5, location_boost: 0.25, np_pathway: 0.85, prestige: 0.70, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Cleveland, OH", Tuition: 21684, Fees: 8432, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 30116, "COL Index": 95, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 22800, "Total Cost": 52916, "Mo. Burn": 3307, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.85, underserved_access: 0.85, np_pathway_calculated: 0.85 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // #6 Detroit, MI (7.37)
  {
    id: "wayne-state-detroit",
    name: "Wayne State",
    type: "ABSN",
    location: { full: "Detroit, MI" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: true, sociology: false, biology: false, ethics: false },
      additional: "Healthcare experience (10 hr min)",
      addl_prereq_fit: 0.9
    },
    admissions: { email: "nursing@wayne.edu", deadline: "2026-02-01", start_date: "2027-05-15" },
    program_details: { duration_months: 20, terms: 5, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "CD2 pathway; Spring/Summer start; 3.0 prereq GPA required",
    scoring_notes: "Major medical center access; music city bonus",
    scores: { location_score: 8.5, location_boost: 0.25, np_pathway: 0.84, prestige: 0.75, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.65, location_combined: null },
    costs: { Location: "Detroit, MI", Tuition: 48231, Fees: 5017, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 53248, "COL Index": 90, "Duration (mo)": 20, "Living $/mo": 1500, "Total Living": 27000, "Total Cost": 80248, "Mo. Burn": 4012, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.80, underserved_access: 0.90, np_pathway_calculated: 0.84 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #7 Boise, ID (7.30)
  {
    id: "isu-boise",
    name: "Idaho State University",
    type: "ABSN",
    location: { full: "Meridian, ID (Boise area)" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@isu.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 12, terms: 3, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "ISU Meridian Campus; 12-month program; statewide coverage",
    scoring_notes: "Full NP practice authority + on-the-come-up + dating bonus",
    scores: { location_score: 9.0, location_boost: 1.25, np_pathway: 0.71, prestige: 0.65, competitiveness: 0.90, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.45, location_combined: null },
    costs: { Location: "Boise, ID", Tuition: 17283, Fees: 2500, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 19783, "COL Index": 105, "Duration (mo)": 12, "Living $/mo": 1500, "Total Living": 18900, "Total Cost": 38683, "Mo. Burn": 3224, "Cost Score": null },
    regional: { ed_opportunity: 0.70, np_accessibility: 0.70, underserved_access: 0.75, np_pathway_calculated: 0.71 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.2 }, expected_value_no_commitment: 400, expected_value_with_commitment: 400 }
  },

  // #8 Greenville, SC (7.24)
  {
    id: "clemson-greenville",
    name: "Clemson",
    type: "ABSN",
    location: { full: "Greenville, SC" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@clemson.edu", deadline: "2026-02-15", start_date: "2027-01-15" },
    program_details: { duration_months: 20, terms: 5, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Only 32 students/cohort; Clemson alumni priority; 100% NCLEX pass rate",
    scoring_notes: "On-the-come-up city; competitive admission",
    scores: { location_score: 9.0, location_boost: 0.5, np_pathway: 0.76, prestige: 0.80, competitiveness: 0.75, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.75, location_combined: null },
    costs: { Location: "Greenville, SC", Tuition: 55440, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 58440, "COL Index": 95, "Duration (mo)": 20, "Living $/mo": 1500, "Total Living": 28500, "Total Cost": 86940, "Mo. Burn": 4347, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.75, underserved_access: 0.80, np_pathway_calculated: 0.76 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.1 }, expected_value_no_commitment: 500, expected_value_with_commitment: 500 }
  },

  // #9 Memphis, TN (7.10)
  {
    id: "memphis-absn",
    name: "University of Memphis",
    type: "ABSN",
    location: { full: "Memphis, TN" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@memphis.edu", deadline: "2026-03-01", start_date: "2026-08-15" },
    program_details: { duration_months: 18, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "TN tuition cap makes extremely affordable; 90% NCLEX; 300+ clinical sites",
    scoring_notes: "Food + music city bonuses",
    scores: { location_score: 8.0, location_boost: 0.5, np_pathway: 0.84, prestige: 0.65, competitiveness: 0.90, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.50, location_combined: null },
    costs: { Location: "Memphis, TN", Tuition: 5364, Fees: 5000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 10364, "COL Index": 85, "Duration (mo)": 18, "Living $/mo": 1500, "Total Living": 22950, "Total Cost": 33314, "Mo. Burn": 1851, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.75, underserved_access: 0.95, np_pathway_calculated: 0.84 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 1000, probability: 0.2 }, expected_value_no_commitment: 200, expected_value_with_commitment: 200 }
  },

  // #10 Albuquerque, NM (6.97)
  {
    id: "unm-albuquerque",
    name: "UNM",
    type: "ABSN",
    location: { full: "Albuquerque, NM" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "Pathophysiology I & II",
      addl_prereq_fit: 0.85
    },
    admissions: { email: "HSC-CON-FinancialAid@salud.unm.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "NM resident preference; Level 1 trauma center access; 92%+ NCLEX",
    scoring_notes: "Full NP practice authority state",
    scores: { location_score: 8.0, location_boost: 0.5, np_pathway: 0.82, prestige: 0.70, competitiveness: 0.90, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Albuquerque, NM", Tuition: 35149, Fees: 2500, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 37649, "COL Index": 95, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 22800, "Total Cost": 60449, "Mo. Burn": 3778, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.80, underserved_access: 0.95, np_pathway_calculated: 0.82 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #11 Salt Lake City, UT (6.89)
  {
    id: "roseman-slc",
    name: "Roseman University",
    type: "ABSN",
    location: { full: "South Jordan, UT (SLC area)" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@roseman.edu", deadline: "2026-04-01", start_date: "2027-01-15" },
    program_details: { duration_months: 18, terms: 4, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Hybrid-online + on-campus; 95%+ NCLEX; 97% hired within 6 months",
    scoring_notes: "On-the-come-up + dating city bonus",
    scores: { location_score: 8.0, location_boost: 0.75, np_pathway: 0.79, prestige: 0.65, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.50, location_combined: null },
    costs: { Location: "Salt Lake City, UT", Tuition: 48000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 51000, "COL Index": 105, "Duration (mo)": 18, "Living $/mo": 1500, "Total Living": 28350, "Total Cost": 79350, "Mo. Burn": 4408, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.80, underserved_access: 0.75, np_pathway_calculated: 0.79 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #12 Colorado Springs, CO (6.82)
  {
    id: "uccs-cosprings",
    name: "UCCS",
    type: "ABSN",
    location: { full: "Colorado Springs, CO" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "Sciences within 10 years; 3.25 GPA required",
      addl_prereq_fit: 0.85
    },
    admissions: { email: "accbsn@uccs.edu", deadline: "2026-02-01", start_date: "2027-05-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Summer start only; CO residents only; CCNE accredited",
    scoring_notes: "Full NP practice authority + on-the-come-up + dating bonus",
    scores: { location_score: 8.0, location_boost: 1.25, np_pathway: 0.74, prestige: 0.65, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.50, location_combined: null },
    costs: { Location: "Colorado Springs, CO", Tuition: 35716, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 38716, "COL Index": 105, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 25200, "Total Cost": 63916, "Mo. Burn": 3995, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.75, underserved_access: 0.70, np_pathway_calculated: 0.74 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // #13 Birmingham, AL (6.74)
  {
    id: "uab-birmingham",
    name: "UAB",
    type: "AMNP",
    location: { full: "Birmingham, AL" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@uab.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: "Direct-entry MSN available" },
    notes: "Accelerated Master's in Nursing Pathway; major teaching hospital",
    scoring_notes: "Top Alabama program; excellent underserved access",
    scores: { location_score: 8.0, location_boost: 0, np_pathway: 0.84, prestige: 0.75, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.65, location_combined: null },
    costs: { Location: "Birmingham, AL", Tuition: 42000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 45000, "COL Index": 85, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 20400, "Total Cost": 65400, "Mo. Burn": 4088, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.80, underserved_access: 0.90, np_pathway_calculated: 0.84 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.15 }, expected_value_no_commitment: 750, expected_value_with_commitment: 750 }
  },

  // #14 Dayton, OH (6.71)
  {
    id: "christ-college-dayton",
    name: "Christ College of Nursing",
    type: "ABSN",
    location: { full: "Cincinnati, OH (near Dayton)" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "admissions@thechristcollege.edu", deadline: "2026-04-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "15-16 month program; intensive clinical focus",
    scoring_notes: "Dayton area coverage; close to Milwaukee",
    scores: { location_score: 9.0, location_boost: 0, np_pathway: 0.75, prestige: 0.60, competitiveness: 0.90, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.45, location_combined: null },
    costs: { Location: "Dayton, OH", Tuition: 38000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 41000, "COL Index": 90, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 21600, "Total Cost": 62600, "Mo. Burn": 3913, "Cost Score": null },
    regional: { ed_opportunity: 0.70, np_accessibility: 0.75, underserved_access: 0.80, np_pathway_calculated: 0.75 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // #15 Charlotte, NC (6.64)
  {
    id: "uncc-charlotte",
    name: "UNC Charlotte",
    type: "ABSN",
    location: { full: "Charlotte, NC" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "CNA I certification required",
      addl_prereq_fit: 0.8
    },
    admissions: { email: "nursing@uncc.edu", deadline: "2026-02-01", start_date: "2026-08-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Scholarship auto-eligible; low NC resident tuition; CNA required",
    scoring_notes: "On-the-come-up + dating city bonus",
    scores: { location_score: 7.5, location_boost: 0.75, np_pathway: 0.81, prestige: 0.70, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Charlotte, NC", Tuition: 26000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 29000, "COL Index": 100, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 24000, "Total Cost": 53000, "Mo. Burn": 3313, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.80, underserved_access: 0.75, np_pathway_calculated: 0.81 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.25 }, expected_value_no_commitment: 750, expected_value_with_commitment: 750 }
  },

  // #16 Kansas City, MO (6.60)
  {
    id: "research-college-kc",
    name: "Research College of Nursing",
    type: "ABSN",
    location: { full: "Kansas City, MO" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "admissions@researchcollege.edu", deadline: "2026-04-01", start_date: "2026-05-15" },
    program_details: { duration_months: 12, terms: 3, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "HCA Work Loan Forgiveness available; May 2026 fast-track; #1 in KC",
    scoring_notes: "Food + music + dating bonuses",
    scores: { location_score: 7.5, location_boost: 0.75, np_pathway: 0.80, prestige: 0.70, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.60, location_combined: null },
    costs: { Location: "Kansas City, MO", Tuition: 14000, Fees: 2000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 16000, "COL Index": 95, "Duration (mo)": 12, "Living $/mo": 1500, "Total Living": 17100, "Total Cost": 33100, "Mo. Burn": 2758, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.80, underserved_access: 0.80, np_pathway_calculated: 0.80 },
    scholarships: { guaranteed: null, work_commitment: { name: "HCA Work Loan Forgiveness", amount: 10000, years: 2 }, merit: { pool: 2000, probability: 0.2 }, expected_value_no_commitment: 400, expected_value_with_commitment: 10400 }
  },

  // #17 Washington, DC (6.43)
  {
    id: "georgetown-dc",
    name: "Georgetown",
    type: "ABSN",
    location: { full: "Washington, DC" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@georgetown.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 12, terms: 3, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Hybrid program; 700+ clinical hours; 96-100% NCLEX; Scholarships available",
    scoring_notes: "Full NP practice authority (DC) + dating city bonus",
    scores: { location_score: 6.5, location_boost: 0.75, np_pathway: 0.89, prestige: 0.90, competitiveness: 0.75, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.88, location_combined: null },
    costs: { Location: "Washington, DC", Tuition: 65000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 68000, "COL Index": 145, "Duration (mo)": 12, "Living $/mo": 1500, "Total Living": 26100, "Total Cost": 94100, "Mo. Burn": 7842, "Cost Score": null },
    regional: { ed_opportunity: 0.90, np_accessibility: 0.90, underserved_access: 0.85, np_pathway_calculated: 0.89 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 10000, probability: 0.15 }, expected_value_no_commitment: 1500, expected_value_with_commitment: 1500 }
  },

  // #18 Little Rock, AR (6.30)
  {
    id: "uams-littlerock",
    name: "UAMS",
    type: "ABSN",
    location: { full: "Fayetteville, AR" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "TEAS 65% min required",
      addl_prereq_fit: 0.9
    },
    admissions: { email: "nursing@uams.edu", deadline: "2026-03-01", start_date: "2027-05-15" },
    program_details: { duration_months: 15, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "NW Arkansas campus; Full-tuition scholarships for Fall 2026 (5 ABSN spots)",
    scoring_notes: "Chancellor's Scholar opportunity",
    scores: { location_score: 8.0, location_boost: 0, np_pathway: 0.79, prestige: 0.70, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Fayetteville, AR", Tuition: 27032, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 30032, "COL Index": 85, "Duration (mo)": 15, "Living $/mo": 1500, "Total Living": 19125, "Total Cost": 49157, "Mo. Burn": 3277, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.75, underserved_access: 0.90, np_pathway_calculated: 0.79 },
    scholarships: { guaranteed: null, work_commitment: { name: "Chancellor's Scholar", amount: 30000, years: 2 }, merit: { pool: 30000, probability: 0.05 }, expected_value_no_commitment: 1500, expected_value_with_commitment: 31500 }
  },

  // #19 Miami, FL (6.24)
  {
    id: "fiu-miami",
    name: "FIU",
    type: "ABSN",
    location: { full: "Miami, FL" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "3.25 GPA min; TEAS required",
      addl_prereq_fit: 0.85
    },
    admissions: { email: "nursing@fiu.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Most affordable Miami option; 60 students/cohort; 88% NCLEX; 97% grad rate",
    scoring_notes: "Food city bonus",
    scores: { location_score: 7.0, location_boost: 0.25, np_pathway: 0.86, prestige: 0.70, competitiveness: 0.80, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.60, location_combined: null },
    costs: { Location: "Miami, FL", Tuition: 16000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 19000, "COL Index": 130, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 31200, "Total Cost": 50200, "Mo. Burn": 3138, "Cost Score": null },
    regional: { ed_opportunity: 0.90, np_accessibility: 0.80, underserved_access: 0.90, np_pathway_calculated: 0.86 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // #20 Indianapolis, IN (6.20)
  {
    id: "iu-indianapolis",
    name: "IU Indianapolis",
    type: "ABSN",
    location: { full: "Indianapolis, IN" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "2.7 undergrad GPA; 3.0 prereq GPA",
      addl_prereq_fit: 0.9
    },
    admissions: { email: "nursing@iu.edu", deadline: "2026-02-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "#23 nationally (US News); #1 in Indiana; Spring 2026 apps open",
    scoring_notes: "Dating city bonus",
    scores: { location_score: 7.5, location_boost: 0.25, np_pathway: 0.80, prestige: 0.80, competitiveness: 0.80, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.70, location_combined: null },
    costs: { Location: "Indianapolis, IN", Tuition: 42000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 45000, "COL Index": 95, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 22800, "Total Cost": 67800, "Mo. Burn": 4238, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.80, underserved_access: 0.80, np_pathway_calculated: 0.80 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.15 }, expected_value_no_commitment: 750, expected_value_with_commitment: 750 }
  },

  // #21 Tulsa, OK (6.20)
  {
    id: "utulsa-absn",
    name: "University of Tulsa",
    type: "ABSN",
    location: { full: "Tulsa, OK" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "online@utulsa.edu", deadline: "2026-04-01", start_date: "2027-01-15" },
    program_details: { duration_months: 21, terms: 5, online_lab_conf: 0.85, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Online with 1-week on-campus bootcamp; 630 clinical hours; ACEN accredited",
    scoring_notes: "Hybrid model good for working professionals",
    scores: { location_score: 8.0, location_boost: 0, np_pathway: 0.78, prestige: 0.65, competitiveness: 0.90, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.50, location_combined: null },
    costs: { Location: "Tulsa, OK", Tuition: 30228, Fees: 2000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 32228, "COL Index": 90, "Duration (mo)": 21, "Living $/mo": 1500, "Total Living": 28350, "Total Cost": 60578, "Mo. Burn": 2885, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.75, underserved_access: 0.85, np_pathway_calculated: 0.78 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // #22 Buffalo, NY (6.10)
  {
    id: "buffalo-absn",
    name: "University at Buffalo",
    type: "ABSN",
    location: { full: "Buffalo, NY" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@buffalo.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 12, terms: 3, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "100% NCLEX pass rate; 600+ clinical hours; DEU model; $180K+ in scholarships",
    scoring_notes: "Very affordable for NY residents",
    scores: { location_score: 8.0, location_boost: 0, np_pathway: 0.76, prestige: 0.70, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Buffalo, NY", Tuition: 24000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 27000, "COL Index": 95, "Duration (mo)": 12, "Living $/mo": 1500, "Total Living": 17100, "Total Cost": 44100, "Mo. Burn": 3675, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.75, underserved_access: 0.80, np_pathway_calculated: 0.76 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.25 }, expected_value_no_commitment: 1250, expected_value_with_commitment: 1250 }
  },

  // #23 Tucson, AZ (6.06)
  {
    id: "uarizona-tucson",
    name: "University of Arizona",
    type: "ABSN",
    location: { full: "Gilbert, AZ (Tucson metro)" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@arizona.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Hybrid integrative health focus; 93% NCLEX; Gilbert campus (not Tucson main)",
    scoring_notes: "Full NP practice authority state",
    scores: { location_score: 7.0, location_boost: 0.5, np_pathway: 0.81, prestige: 0.75, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.65, location_combined: null },
    costs: { Location: "Tucson, AZ", Tuition: 40000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 43000, "COL Index": 100, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 24000, "Total Cost": 67000, "Mo. Burn": 4188, "Cost Score": null },
    regional: { ed_opportunity: 0.75, np_accessibility: 0.80, underserved_access: 0.90, np_pathway_calculated: 0.81 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.15 }, expected_value_no_commitment: 450, expected_value_with_commitment: 450 }
  },

  // #24 Providence, RI (6.06)
  {
    id: "ric-providence",
    name: "Rhode Island College",
    type: "ABSN",
    location: { full: "Providence, RI" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@ric.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 20, terms: 5, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Affordable public option; 5 semesters; RINEC facility",
    scoring_notes: "Full NP practice authority state",
    scores: { location_score: 7.0, location_boost: 0.5, np_pathway: 0.81, prestige: 0.65, competitiveness: 0.90, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.50, location_combined: null },
    costs: { Location: "Providence, RI", Tuition: 29273, Fees: 2500, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 31773, "COL Index": 115, "Duration (mo)": 20, "Living $/mo": 1500, "Total Living": 34500, "Total Cost": 66273, "Mo. Burn": 3314, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.85, underserved_access: 0.75, np_pathway_calculated: 0.81 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  }
];

// Calculate cost_score for each program
function calcCostScore(monthlyBurn) {
  if (!monthlyBurn) return null;
  return Math.max(0, 1 - monthlyBurn / 10000);
}

// Calculate time_factor
function calcTimeFactor(months) {
  if (!months) return 1.0;
  if (months <= 12) return 1.0;
  if (months <= 16) return 0.8;
  if (months <= 23) return 0.6;
  if (months <= 31) return 0.4;
  return 0.2;
}

// Calculate raw_score
function calcRawScore(program) {
  const s = program.scores;
  const c = program.costs;

  if (!s.location_score || !s.np_pathway || !s.prestige || !s.competitiveness || !s.start_score) {
    return null;
  }

  const locationTotal = s.location_score + (s.location_boost || 0);
  const prereqFit = program.prerequisites.addl_prereq_fit || 1.0;
  const onlineLabConf = program.program_details.online_lab_conf || 1.0;
  const timeFactor = calcTimeFactor(program.program_details.duration_months);
  const costScore = calcCostScore(c["Mo. Burn"]) || 0.5;

  const rawScore = locationTotal * prereqFit * onlineLabConf * s.np_pathway *
                   s.prestige * s.competitiveness * s.start_score * timeFactor * costScore;

  return Math.round(rawScore * 100) / 100;
}

// Process each new program
newPrograms.forEach(program => {
  // Calculate Mo. Burn if not set
  if (!program.costs["Mo. Burn"]) {
    program.costs["Mo. Burn"] = Math.round(program.costs["Total Cost"] / program.program_details.duration_months);
  }

  // Calculate cost_score
  program.scores.cost_score = Math.round(calcCostScore(program.costs["Mo. Burn"]) * 100) / 100;
  program.costs["Cost Score"] = program.scores.cost_score;

  // Calculate location_combined
  program.scores.location_combined = Math.round((program.scores.location_score + (program.scores.location_boost || 0)) * program.scores.np_pathway * 100) / 100;

  // Calculate raw_score
  program.scores.raw_score = calcRawScore(program);
});

// Add new programs to the data
data.programs.push(...newPrograms);

// Re-rank all programs by raw_score
const rankedPrograms = data.programs
  .filter(p => p.scores.raw_score !== null)
  .sort((a, b) => (b.scores.raw_score || 0) - (a.scores.raw_score || 0));

rankedPrograms.forEach((p, i) => {
  p.scores.rank = i + 1;
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`Added ${newPrograms.length} new programs from top 25 metros`);
console.log(`Total programs: ${data.programs.length}`);
console.log('\nNew programs added:');
newPrograms.forEach(p => {
  console.log(`  - ${p.name} (${p.location.full}): ${p.type}, ${p.program_details.duration_months}mo, $${p.costs["Mo. Burn"]}/mo`);
});
