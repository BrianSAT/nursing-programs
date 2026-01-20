/**
 * Add 6 more programs per user request:
 * 1. UTHealth Houston Pacesetter (UT Austin doesn't have ABSN - Houston has Pacesetter ABSN)
 * 2. Carlow University Pittsburgh (Pittsburgh #3)
 * 3. Tulane University New Orleans (NOLA #2)
 * 4. Xavier University Cincinnati (Xavier - note: paused Cincinnati location, has Columbus/Cleveland)
 * 5. Capital University Columbus (Columbus #2)
 * 6. University of Maryland Baltimore (Baltimore #3)
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Helper functions
function calcTimeFactor(months) {
  if (!months) return 1.0;
  if (months <= 12) return 1.0;
  if (months <= 16) return 0.8;
  if (months <= 23) return 0.6;
  if (months <= 31) return 0.4;
  return 0.2;
}

function calcCostScore(monthlyBurn) {
  return Math.max(0, Math.round((1 - monthlyBurn / 10000) * 100) / 100);
}

function calcRawScore(program) {
  const s = program.scores;
  const locationTotal = s.location_score + (s.location_boost || 0);
  const prereqFit = program.prerequisites?.addl_prereq_fit || 1.0;
  const onlineLabConf = program.program_details?.online_lab_conf || 1.0;
  const timeFactor = calcTimeFactor(program.program_details?.duration_months);
  const costScore = s.cost_score || 0.5;

  const rawScore = locationTotal * prereqFit * onlineLabConf * s.np_pathway *
                   s.prestige * s.competitiveness * s.start_score * timeFactor * costScore;

  return Math.round(rawScore * 100) / 100;
}

function calcLocationCombined(program) {
  const locationTotal = program.scores.location_score + (program.scores.location_boost || 0);
  return Math.round(locationTotal * program.scores.np_pathway * 100) / 100;
}

// New programs to add
const newPrograms = [
  // 1. UTHealth Houston Pacesetter ABSN (user asked for Austin but UT Austin has no ABSN)
  // Houston is in TX so gets TX resident rates!
  {
    id: "uthealth-houston",
    name: "UTHealth Houston",
    type: "ABSN",
    location: { full: "Houston, TX" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: "Pacesetter ABSN; 12-month intensive",
      addl_prereq_fit: null
    },
    admissions: {
      email: "son.admissions@uth.tmc.edu",
      deadline: "2026-06-01",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 12,
      terms: 3,
      online_lab_conf: 0.9,
      np_pathway_type: "standard",
      np_pathway_notes: "Texas Medical Center - largest in the world"
    },
    scores: {
      location_score: 7.5,  // Houston - large city, not as desirable as Austin
      location_boost: 0,
      np_pathway: 0.85,  // Texas Medical Center = excellent opportunities
      prestige: 0.85,  // Top nursing school in Texas
      competitiveness: 0.9,  // Competitive but not ultra-competitive
      start_score: 1,
      national_percentile: 0.9
    },
    notes: "Pacesetter ABSN at Texas Medical Center (world's largest medical complex). TX RESIDENT RATES!",
    scoring_notes: "TMC provides unmatched clinical exposure",
    regional: {
      ed_opportunity: 0.95,  // Texas Medical Center has 21 hospitals
      np_accessibility: 0.85,
      underserved_access: 0.8,
      np_pathway_calculated: 0.87
    },
    scholarships: {
      guaranteed: null,
      work_commitment: null,
      merit: { pool: 5000, probability: 0.2 },
      expected_value_no_commitment: 1000,
      expected_value_with_commitment: 1000
    },
    costs: {
      Location: "Houston, TX",
      Tuition: 22000,  // TX resident rate
      Fees: 3000,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 100,
      "Duration (mo)": 12,
      "Living $/mo": 1500,
      Total_Living: 18000
    }
  },

  // 2. Carlow University Pittsburgh (Pittsburgh #3)
  {
    id: "carlow-pittsburgh",
    name: "Carlow University",
    type: "ABSN",
    location: { full: "Pittsburgh, PA" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: {
      email: "admissions@carlow.edu",
      deadline: "2026-04-01",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 15,
      terms: 4,
      online_lab_conf: 0.85,
      np_pathway_type: "standard",
      np_pathway_notes: null
    },
    scores: {
      location_score: 10,
      location_boost: 0.5,  // Pittsburgh boost
      np_pathway: 0.76,
      prestige: 0.65,  // Smaller private university
      competitiveness: 0.8,  // Moderately competitive
      start_score: 1,
      national_percentile: 0.6
    },
    notes: "15-month program; 100% NCLEX pass rate; $695/credit (~63 credits); Catholic university",
    scoring_notes: "Strong clinical placements in UPMC network",
    regional: {
      ed_opportunity: 0.75,
      np_accessibility: 0.8,
      underserved_access: 0.7,
      np_pathway_calculated: 0.76
    },
    scholarships: {
      guaranteed: null,
      work_commitment: null,
      merit: { pool: 5000, probability: 0.25 },
      expected_value_no_commitment: 1250,
      expected_value_with_commitment: 1250
    },
    costs: {
      Location: "Pittsburgh, PA",
      Tuition: 43785,  // $695/credit x 63 credits
      Fees: 2500,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 98,
      "Duration (mo)": 15,
      "Living $/mo": 1500,
      Total_Living: 22050
    }
  },

  // 3. Tulane University New Orleans (NOLA #2)
  {
    id: "tulane-nola",
    name: "Tulane University",
    type: "ABSN",
    location: { full: "New Orleans, LA" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: {
      email: "mclnurse@tulane.edu",
      deadline: "2026-03-15",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 16,
      terms: 4,
      online_lab_conf: 0.85,
      np_pathway_type: "standard",
      np_pathway_notes: "Hybrid format"
    },
    scores: {
      location_score: 7.5,
      location_boost: 0.5,  // NOLA food/music
      np_pathway: 0.81,
      prestige: 0.85,  // Top-tier private research university
      competitiveness: 0.85,
      start_score: 1,
      national_percentile: 0.85
    },
    notes: "16mo hybrid program; $69,280 tuition OR FREE via LCMC Nurse Scholars (2yr work commitment); elite program [OOS tuition applied]",
    scoring_notes: "R1 research university; excellent NOLA clinical sites",
    regional: {
      ed_opportunity: 0.8,
      np_accessibility: 0.75,
      underserved_access: 0.9,
      np_pathway_calculated: 0.81
    },
    scholarships: {
      guaranteed: null,
      work_commitment: {
        name: "LCMC Nurse Scholars",
        amount: 69280,
        years: 2,
        notes: "Full tuition covered; 2-year commitment to LCMC Health"
      },
      merit: { pool: 5000, probability: 0.15 },
      expected_value_no_commitment: 750,
      expected_value_with_commitment: 69280
    },
    costs: {
      Location: "New Orleans, LA",
      Tuition: 69280,
      Fees: 3000,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 100,
      "Duration (mo)": 16,
      "Living $/mo": 1500,
      Total_Living: 24000
    }
  },

  // 4. Xavier University (Cincinnati location paused, but Columbus/Cleveland available)
  {
    id: "xavier-cincinnati",
    name: "Xavier University",
    type: "ABSN",
    location: { full: "Cincinnati, OH" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: "NOTE: Cincinnati location paused; Columbus/Cleveland sites available",
      addl_prereq_fit: 0.9
    },
    admissions: {
      email: "absn@xavier.edu",
      deadline: "2026-04-15",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 16,
      terms: 4,
      online_lab_conf: 0.8,
      np_pathway_type: "standard",
      np_pathway_notes: "Hybrid with clinical sites in Columbus/Cleveland"
    },
    scores: {
      location_score: 9.5,  // Cincinnati/Columbus area
      location_boost: 0,
      np_pathway: 0.72,  // Cincinnati regional
      prestige: 0.7,  // Solid Jesuit university
      competitiveness: 0.82,
      start_score: 1,
      national_percentile: 0.68
    },
    notes: "16mo hybrid; $900/credit (~69 credits = $61,880); Cincinnati campus paused but Columbus/Cleveland available [OOS tuition applied]",
    scoring_notes: "Jesuit tradition; flexible locations",
    regional: {
      ed_opportunity: 0.65,
      np_accessibility: 0.75,
      underserved_access: 0.75,
      np_pathway_calculated: 0.72
    },
    scholarships: {
      guaranteed: null,
      work_commitment: null,
      merit: { pool: 5000, probability: 0.2 },
      expected_value_no_commitment: 1000,
      expected_value_with_commitment: 1000
    },
    costs: {
      Location: "Cincinnati, OH",
      Tuition: 61880,  // $900/credit x 69 credits
      Fees: 2000,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 95,
      "Duration (mo)": 16,
      "Living $/mo": 1500,
      Total_Living: 22800
    }
  },

  // 5. Capital University Columbus (Columbus #2)
  {
    id: "capital-columbus",
    name: "Capital University",
    type: "ABSN",
    location: { full: "Columbus, OH" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: null,
      addl_prereq_fit: null
    },
    admissions: {
      email: "nursing@capital.edu",
      deadline: "2026-06-01",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 20,
      terms: 5,
      online_lab_conf: 0.85,
      np_pathway_type: "standard",
      np_pathway_notes: "Hybrid option available"
    },
    scores: {
      location_score: 7.5,
      location_boost: 0,
      np_pathway: 0.86,  // Columbus regional (from OSU)
      prestige: 0.6,  // Smaller private university
      competitiveness: 0.75,  // Less competitive
      start_score: 1,
      national_percentile: 0.55
    },
    notes: "20mo (5 semesters); $664/credit (~65 credits = ~$43,160); hybrid option available [OOS tuition applied]",
    scoring_notes: "Affordable option in Columbus",
    regional: {
      ed_opportunity: 0.9,
      np_accessibility: 0.85,
      underserved_access: 0.8,
      np_pathway_calculated: 0.86
    },
    scholarships: {
      guaranteed: null,
      work_commitment: null,
      merit: { pool: 5000, probability: 0.25 },
      expected_value_no_commitment: 1250,
      expected_value_with_commitment: 1250
    },
    costs: {
      Location: "Columbus, OH",
      Tuition: 43160,  // $664/credit x 65 credits
      Fees: 2000,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 95,
      "Duration (mo)": 20,
      "Living $/mo": 1500,
      Total_Living: 28500
    }
  },

  // 6. University of Maryland Baltimore (Baltimore #3)
  {
    id: "umd-baltimore",
    name: "U of Maryland Baltimore",
    type: "ABSN",
    location: { full: "Baltimore, MD" },
    prerequisites: {
      standard: {
        ap_1_2: true, micro: true, stats: true, chem: true,
        lifespan: true, nutrition: true, psych: false, sociology: false,
        biology: false, ethics: false
      },
      additional: "Pre-nursing track available",
      addl_prereq_fit: 0.9
    },
    admissions: {
      email: "admissions@nursing.umaryland.edu",
      deadline: "2026-06-01",
      start_date: "2027-01-15"
    },
    program_details: {
      duration_months: 24,
      terms: 5,
      online_lab_conf: 0.85,
      np_pathway_type: "standard",
      np_pathway_notes: null
    },
    scores: {
      location_score: 7,
      location_boost: 0,
      np_pathway: 0.8,  // Baltimore regional
      prestige: 0.8,  // Strong public research university
      competitiveness: 0.85,
      start_score: 1,
      national_percentile: 0.85
    },
    notes: "24mo accelerated BSN; ~$30,607 total tuition (OOS); flagship Maryland nursing school [OOS tuition applied]",
    scoring_notes: "Top 10 public nursing school",
    regional: {
      ed_opportunity: 0.85,
      np_accessibility: 0.75,
      underserved_access: 0.8,
      np_pathway_calculated: 0.8
    },
    scholarships: {
      guaranteed: null,
      work_commitment: null,
      merit: { pool: 10000, probability: 0.2 },
      expected_value_no_commitment: 2000,
      expected_value_with_commitment: 2000
    },
    costs: {
      Location: "Baltimore, MD",
      Tuition: 30607,  // OOS tuition
      Fees: 3000,
      "Schlrshp Amt": 0,
      "Schlrshp %": null,
      COL_Index: 118,
      "Duration (mo)": 24,
      "Living $/mo": 1500,
      Total_Living: 42480
    }
  }
];

// Process and add each program
newPrograms.forEach(program => {
  // Calculate costs
  const c = program.costs;
  c["Net Tuition"] = c.Tuition + c.Fees - (c["Schlrshp Amt"] || 0);
  c["Total Living"] = c.Total_Living || (c["Duration (mo)"] * c["Living $/mo"] * (c.COL_Index / 100));
  c["Total Cost"] = c["Net Tuition"] + c["Total Living"];
  c["Mo. Burn"] = Math.round(c["Total Cost"] / program.program_details.duration_months);
  c["Cost Score"] = calcCostScore(c["Mo. Burn"]);

  // Set cost_score in scores
  program.scores.cost_score = c["Cost Score"];

  // Calculate raw_score
  program.scores.raw_score = calcRawScore(program);

  // Calculate location_combined
  program.scores.location_combined = calcLocationCombined(program);

  // Clean up costs object
  delete c.Total_Living;
  delete c.COL_Index;

  console.log(`Adding: ${program.name} (${program.location.full})`);
  console.log(`  Tuition: $${c.Tuition}, Mo. Burn: $${c["Mo. Burn"]}, Cost Score: ${c["Cost Score"]}`);
  console.log(`  Raw Score: ${program.scores.raw_score}`);
});

// Add programs to data
data.programs.push(...newPrograms);

// Re-rank all programs
const rankedPrograms = data.programs
  .filter(p => p.scores.raw_score !== null)
  .sort((a, b) => (b.scores.raw_score || 0) - (a.scores.raw_score || 0));

rankedPrograms.forEach((p, i) => {
  p.scores.rank = i + 1;
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`\n=== Summary ===`);
console.log(`Added ${newPrograms.length} new programs`);
console.log(`Total programs: ${data.programs.length}`);

// Show new rankings for added programs
console.log(`\nNew program rankings:`);
newPrograms.forEach(p => {
  const updated = data.programs.find(prog => prog.id === p.id);
  console.log(`  ${updated.name}: Rank #${updated.scores.rank} (score: ${updated.scores.raw_score})`);
});
