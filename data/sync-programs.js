/**
 * Sync programs.json with metro-scores.json
 *
 * - Maps each program's city to its nearest metro
 * - Updates location_score, location_boost
 * - Fixes competitiveness = 1 - |national_percentile - 0.8| for ALL 74 programs
 * - Recalculates location_combined, raw_score, re-ranks
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'programs.json');
const metroScoresPath = path.join(__dirname, 'metro-scores.json');

const programsData = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
const metroScores = JSON.parse(fs.readFileSync(metroScoresPath, 'utf8'));

// Build metro lookup by name
const metroByName = {};
for (const m of metroScores.metros) {
  metroByName[m.name] = m;
}

// City-to-metro mapping for program locations that don't exactly match metro names
const CITY_TO_METRO = {
  'Meridian, ID (Boise area)': 'Boise, ID',
  'Maywood, IL (Chicago)': 'Chicago, IL',
  'Cincinnati, OH (near Dayton)': 'Cincinnati, OH',
  'Gilbert, AZ (Tucson metro)': 'Tucson, AZ',
  'South Jordan, UT (SLC area)': 'Salt Lake City, UT',
  'Sylvania, OH (Toledo area)': 'Toledo, OH',
  'Fayetteville, AR': 'Little Rock, AR',
  'Northridge, CA': 'Los Angeles, CA',
  'Fullerton, CA': 'Los Angeles, CA',
  'Baltimore, MD': 'Washington, DC',   // Baltimore is in the DC/Baltimore corridor; closest metro we score
  'St. Paul, MN': 'Minneapolis, MN',
};

function resolveMetro(locationFull) {
  if (!locationFull) return null;

  // Direct match
  if (metroByName[locationFull]) return metroByName[locationFull];

  // Explicit mapping
  const mapped = CITY_TO_METRO[locationFull];
  if (mapped && metroByName[mapped]) return metroByName[mapped];

  console.warn(`  WARNING: No metro match for "${locationFull}"`);
  return null;
}

// Competitiveness formula: 1 - |national_percentile - 0.8|
function calcCompetitiveness(nationalPercentile) {
  if (nationalPercentile === null || nationalPercentile === undefined) return 1.0;
  return Math.round((1 - Math.abs(nationalPercentile - 0.8)) * 100) / 100;
}

// Scoring formula matching src/utils/scoring.js
function calcRawScore(scores, program) {
  const locationScore = scores.location_score || 5;
  const locationBoost = scores.location_boost || 0;
  const prereqFit = scores.prereq_fit || 1.0;
  const onlineLabConf = scores.online_lab_confidence || 1.0;
  const npPathway = scores.np_pathway || 1.0;
  const prestige = scores.prestige || 1.0;
  const competitiveness = scores.competitiveness || 1.0;

  // start_score
  let startScore = 1.0;
  const startDate = program.admissions?.start_date;
  if (startDate) {
    const start = new Date(startDate);
    const target = new Date('2027-01-20');
    const diffMonths = (start - target) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths < -6) startScore = 0.5;
    else if (diffMonths > 6) startScore = 0.5;
    else if (diffMonths < -3) startScore = 0.75;
    else if (diffMonths > 3) startScore = 0.75;
  }

  // time_factor
  const durationMonths = program.program_details?.duration_months;
  let timeFactor = 1.0;
  if (durationMonths) {
    if (durationMonths <= 12) timeFactor = 1.0;
    else if (durationMonths <= 18) timeFactor = 0.75;
    else if (durationMonths <= 24) timeFactor = 0.5;
    else timeFactor = 0.25;
  }

  // cost_score
  const costs = program.costs || {};
  const details = program.program_details || {};
  const tuition = costs.Tuition || 0;
  const fees = costs.Fees || 0;
  const scholarships = costs['Schlrshp Amt'] || 0;
  const netTuition = tuition + fees - scholarships;
  const duration = details.duration_months || 12;
  const colIndex = (costs['COL Index'] || 100) / 100;
  const totalLiving = 1500 * colIndex * duration;
  const monthlyBurn = (netTuition + totalLiving) / duration;
  const costScore = Math.max(0, 1 - (monthlyBurn / 10000));

  const rawScore = (locationScore + locationBoost)
    * prereqFit
    * onlineLabConf
    * npPathway
    * prestige
    * competitiveness
    * startScore
    * timeFactor
    * costScore;

  return {
    raw_score: Math.round(rawScore * 100) / 100,
    competitiveness: scores.competitiveness,
    start_score: Math.round(startScore * 100) / 100,
    time_factor: timeFactor,
    monthly_burn: Math.round(monthlyBurn),
    cost_score: Math.round(costScore * 100) / 100,
  };
}

// ─── MAIN ───────────────────────────────────────────────────────────

console.log('=== Syncing programs.json with metro-scores.json ===\n');

let updated = 0;
let compFixed = 0;
let missingMetro = 0;

for (const program of programsData.programs) {
  const loc = program.location?.full;
  const metro = resolveMetro(loc);
  const scores = program.scores || {};

  if (metro) {
    // Update location_score from metro
    const oldLocScore = scores.location_score;
    scores.location_score = metro.locationScore;

    // location_boost = npPractice only (from metro)
    const oldBoost = scores.location_boost;
    scores.location_boost = metro.location_boost;

    if (oldLocScore !== scores.location_score || oldBoost !== scores.location_boost) {
      updated++;
    }
  } else {
    missingMetro++;
    console.log(`  SKIP metro update for: ${program.id} (${loc})`);
  }

  // Fix competitiveness for ALL programs
  const oldComp = scores.competitiveness;
  scores.competitiveness = calcCompetitiveness(scores.national_percentile);
  if (oldComp !== scores.competitiveness) {
    compFixed++;
    console.log(`  COMP FIX: ${program.id} ${oldComp} → ${scores.competitiveness} (np=${scores.national_percentile})`);
  }

  // Recalculate raw_score
  const calculated = calcRawScore(scores, program);
  scores.raw_score = calculated.raw_score;
  scores.start_score = calculated.start_score;
  scores.cost_score = calculated.cost_score;

  // Recalculate location_combined = (location_score + location_boost) × np_pathway
  const npPathway = scores.np_pathway || 1.0;
  scores.location_combined = Math.round((scores.location_score + scores.location_boost) * npPathway * 100) / 100;

  program.scores = scores;
}

// Re-rank by raw_score descending
const sorted = [...programsData.programs].sort((a, b) => (b.scores?.raw_score || 0) - (a.scores?.raw_score || 0));
sorted.forEach((p, i) => {
  p.scores.rank = i + 1;
});

// Summary
console.log(`\n=== SYNC COMPLETE ===`);
console.log(`Programs: ${programsData.programs.length}`);
console.log(`Location scores updated: ${updated}`);
console.log(`Competitiveness fixed: ${compFixed}`);
console.log(`Missing metro matches: ${missingMetro}`);

// Show new rankings top 20
console.log('\n=== NEW TOP 20 ===\n');
sorted.slice(0, 20).forEach(p => {
  const s = p.scores;
  console.log(`#${String(s.rank).padStart(2)} ${p.id.padEnd(28)} raw=${s.raw_score.toFixed(2).padStart(5)} loc=${s.location_score.toFixed(1)} boost=${s.location_boost.toFixed(1)} comp=${s.competitiveness} np=${s.np_pathway}`);
});

// Show bottom 10
console.log('\n=== BOTTOM 10 ===\n');
sorted.slice(-10).forEach(p => {
  const s = p.scores;
  console.log(`#${String(s.rank).padStart(2)} ${p.id.padEnd(28)} raw=${s.raw_score.toFixed(2).padStart(5)} loc=${s.location_score.toFixed(1)} boost=${s.location_boost.toFixed(1)} comp=${s.competitiveness} np=${s.np_pathway}`);
});

// Save
fs.writeFileSync(programsPath, JSON.stringify(programsData, null, 2));
console.log(`\nSaved updated programs.json`);
