/**
 * Add user's favorite city programs
 * New Orleans, Burlington VT, Spokane, Pittsburgh (2nd), Chicago (4th), NYC (2nd), Seattle (2nd)
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

const newPrograms = [
  // New Orleans, LA - Loyola NOLA
  {
    id: "loyola-nola",
    name: "Loyola New Orleans",
    type: "ABSN",
    location: { full: "New Orleans, LA" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@loyno.edu", deadline: "2026-04-01", start_date: "2027-01-15" },
    program_details: { duration_months: 17, terms: 4, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 7.5, location_boost: 0.5, np_pathway: 0.81, prestige: 0.70, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    notes: "Hybrid program; Ochsner Nurse Scholar bonus ($30K); Greater NOLA clinical sites",
    scoring_notes: "Food + music city; excellent underserved access",
    costs: { Location: "New Orleans, LA", Tuition: 24804, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 27804, "COL Index": 100, "Duration (mo)": 17, "Living $/mo": 1500, "Total Living": 25500, "Total Cost": 53304, "Mo. Burn": 3135, "Cost Score": null },
    regional: { ed_opportunity: 0.80, np_accessibility: 0.75, underserved_access: 0.90, np_pathway_calculated: 0.81 },
    scholarships: { guaranteed: null, work_commitment: { name: "Ochsner Nurse Scholar", amount: 30000, years: 3 }, merit: { pool: 5000, probability: 0.2 }, expected_value_no_commitment: 1000, expected_value_with_commitment: 31000 }
  },

  // Burlington, VT - UVM Direct Entry MSN
  {
    id: "uvm-burlington",
    name: "UVM",
    type: "MEPN",
    location: { full: "Burlington, VT" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: true, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "cnhsgrad@uvm.edu", deadline: "2026-02-01", start_date: "2027-05-15" },
    program_details: { duration_months: 36, terms: 9, online_lab_conf: 0.85, np_pathway_type: "pre_specialty", np_pathway_notes: "Direct entry MSN with NP pathway" },
    scores: { location_score: 6.5, location_boost: 0.5, np_pathway: 0.78, prestige: 0.75, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.60, location_combined: null },
    notes: "MEPN = 1yr prelicensure + 2yr MSN; Full NP practice authority state; 675 clinical hours yr 1",
    scoring_notes: "Beautiful location; hipster food/craft scene; skiing",
    costs: { Location: "Burlington, VT", Tuition: 55000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 58000, "COL Index": 115, "Duration (mo)": 36, "Living $/mo": 1500, "Total Living": 62100, "Total Cost": 120100, "Mo. Burn": 3336, "Cost Score": null },
    regional: { ed_opportunity: 0.65, np_accessibility: 0.85, underserved_access: 0.85, np_pathway_calculated: 0.78 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.15 }, expected_value_no_commitment: 750, expected_value_with_commitment: 750 }
  },

  // Spokane, WA - WSU Spokane
  {
    id: "wsu-spokane",
    name: "WSU Spokane",
    type: "ABSN",
    location: { full: "Spokane, WA" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: "TEAS 70% min",
      addl_prereq_fit: 0.9
    },
    admissions: { email: "nursing@wsu.edu", deadline: "2026-02-01", start_date: "2027-08-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 7.0, location_boost: 0.5, np_pathway: 0.71, prestige: 0.70, competitiveness: 0.85, start_score: 0.75, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    notes: "97% NCLEX (2024); Full NP practice authority state; River + mountains; Affordable outdoor city",
    scoring_notes: "User favorite - mountain/river access; underrated city",
    costs: { Location: "Spokane, WA", Tuition: 35000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 38000, "COL Index": 100, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 24000, "Total Cost": 62000, "Mo. Burn": 3875, "Cost Score": null },
    regional: { ed_opportunity: 0.65, np_accessibility: 0.70, underserved_access: 0.80, np_pathway_calculated: 0.71 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 3000, probability: 0.2 }, expected_value_no_commitment: 600, expected_value_with_commitment: 600 }
  },

  // Pittsburgh, PA - Duquesne (2nd Pittsburgh program)
  {
    id: "duquesne-pittsburgh",
    name: "Duquesne",
    type: "ABSN",
    location: { full: "Pittsburgh, PA" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@duq.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 12, terms: 3, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 9.0, location_boost: 0.5, np_pathway: 0.82, prestige: 0.75, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.65, location_combined: null },
    notes: "12-month fast track; $30K scholarship for all admits; UPMC + AHN rotations; 95.6% NCLEX",
    scoring_notes: "User's #1 city; on-the-come-up; excellent topology",
    costs: { Location: "Pittsburgh, PA", Tuition: 55976, Fees: 3000, "Schlrshp Amt": 30000, "Schlrshp %": null, "Net Tuition": 28976, "COL Index": 95, "Duration (mo)": 12, "Living $/mo": 1500, "Total Living": 17100, "Total Cost": 46076, "Mo. Burn": 3840, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.80, underserved_access: 0.80, np_pathway_calculated: 0.82 },
    scholarships: { guaranteed: { name: "Second Degree Scholarship", amount: 30000 }, work_commitment: null, merit: { pool: 0, probability: 0 }, expected_value_no_commitment: 30000, expected_value_with_commitment: 30000 }
  },

  // Chicago, IL - Loyola Chicago (4th Chicago program)
  {
    id: "loyola-chicago",
    name: "Loyola Chicago",
    type: "ABSN",
    location: { full: "Maywood, IL (Chicago)" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@luc.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: 0.9, np_pathway_type: "standard", np_pathway_notes: null },
    scores: { location_score: 7.5, location_boost: 0.5, np_pathway: 0.82, prestige: 0.80, competitiveness: 0.80, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.70, location_combined: null },
    notes: "Hybrid option; Social justice emphasis; 94% NCLEX; Northwestern Memorial rotations",
    scoring_notes: "Strong Jesuit program; food + music scene",
    costs: { Location: "Chicago, IL", Tuition: 45000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 48000, "COL Index": 110, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 26400, "Total Cost": 74400, "Mo. Burn": 4650, "Cost Score": null },
    regional: { ed_opportunity: 0.85, np_accessibility: 0.85, underserved_access: 0.75, np_pathway_calculated: 0.82 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.2 }, expected_value_no_commitment: 1000, expected_value_with_commitment: 1000 }
  },

  // NYC - Hunter College CUNY (2nd NYC program - AFFORDABLE!)
  {
    id: "hunter-nyc",
    name: "Hunter College (CUNY)",
    type: "ABSN",
    location: { full: "New York, NY" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: true, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@hunter.cuny.edu", deadline: "2026-02-01", start_date: "2027-01-15" },
    program_details: { duration_months: 18, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "CUNY = very affordable for NY residents; 51 credits; Major NYC hospital rotations",
    scoring_notes: "Best value in NYC; public school pricing",
    scores: { location_score: 6.0, location_boost: 0.5, np_pathway: 0.85, prestige: 0.70, competitiveness: 0.80, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "New York, NY", Tuition: 15555, Fees: 2000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 17555, "COL Index": 180, "Duration (mo)": 18, "Living $/mo": 1500, "Total Living": 48600, "Total Cost": 66155, "Mo. Burn": 3675, "Cost Score": null },
    regional: { ed_opportunity: 0.90, np_accessibility: 0.85, underserved_access: 0.80, np_pathway_calculated: 0.85 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 2000, probability: 0.15 }, expected_value_no_commitment: 300, expected_value_with_commitment: 300 }
  },

  // Seattle - Seattle Pacific University (2nd Seattle program)
  {
    id: "spu-seattle",
    name: "Seattle Pacific",
    type: "ABSN",
    location: { full: "Seattle, WA" },
    prerequisites: {
      standard: { ap_1_2: true, micro: true, stats: true, chem: true, lifespan: true, nutrition: true, psych: false, sociology: false, biology: false, ethics: false },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: { email: "nursing@spu.edu", deadline: "2026-03-01", start_date: "2027-01-15" },
    program_details: { duration_months: 16, terms: 4, online_lab_conf: null, np_pathway_type: "standard", np_pathway_notes: null },
    notes: "Christian university; Full NP practice authority state; Pacific NW lifestyle",
    scoring_notes: "Mountains + water access; food/music/dating scene",
    scores: { location_score: 8.5, location_boost: 1.0, np_pathway: 0.77, prestige: 0.70, competitiveness: 0.85, start_score: 1.0, cost_score: null, raw_score: null, rank: null, national_percentile: 0.55, location_combined: null },
    costs: { Location: "Seattle, WA", Tuition: 48000, Fees: 3000, "Schlrshp Amt": 0, "Schlrshp %": null, "Net Tuition": 51000, "COL Index": 150, "Duration (mo)": 16, "Living $/mo": 1500, "Total Living": 36000, "Total Cost": 87000, "Mo. Burn": 5438, "Cost Score": null },
    regional: { ed_opportunity: 0.70, np_accessibility: 0.85, underserved_access: 0.75, np_pathway_calculated: 0.77 },
    scholarships: { guaranteed: null, work_commitment: null, merit: { pool: 5000, probability: 0.15 }, expected_value_no_commitment: 750, expected_value_with_commitment: 750 }
  }
];

// Calculate cost_score
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

// Add new programs
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

console.log(`Added ${newPrograms.length} new programs (user favorites)`);
console.log(`Total programs: ${data.programs.length}`);
console.log('\nNew programs added:');
newPrograms.forEach(p => {
  console.log(`  - ${p.name} (${p.location.full}): ${p.type}, ${p.program_details.duration_months}mo, $${p.costs["Mo. Burn"]}/mo`);
});
