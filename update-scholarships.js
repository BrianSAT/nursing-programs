/**
 * Update programs with:
 * 1. Realistic scholarship categories
 * 2. Out-of-state tuition for public schools (except TX/WI)
 * 3. Remove duplicates
 * 4. Recalculate costs
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Work-commitment scholarships (user can toggle)
const WORK_COMMITMENT_SCHOLARSHIPS = {
  'u-rochester': {
    program_name: 'UR Nursing Scholars',
    amount: 84090,
    commitment_years: 3,
    employer: 'Strong Memorial / Highland / F.F. Thompson Hospital',
    competitive: true,
    notes: '100% tuition coverage as forgivable loan. Must work full-time RN at UR Medicine hospital for 3 years. U.S. citizens/permanent residents/DACA only.'
  },
  'utk': {
    program_name: 'UTMC ABSN Scholarship',
    amount: 12776,
    commitment_years: 3,
    employer: 'UT Medical Center',
    competitive: true,
    notes: 'Only 8 scholars admitted per year. Application deadline March 1.'
  },
  'vanderbilt-mn': {
    program_name: 'VUMC Nurse Scholars',
    amount: 30000,
    commitment_years: 3,
    employer: 'Vanderbilt University Medical Center',
    competitive: true,
    notes: 'Up to $7,500/semester for 4 semesters. Must maintain good academic standing.'
  }
};

// Guaranteed scholarships (everyone gets these)
const GUARANTEED_SCHOLARSHIPS = {
  'northeastern': { amount: 15000, notes: 'All Boston/Providence admits receive $15K ($3,750/semester x 4)' },
  'pitt': { amount: 8333, notes: 'Guaranteed for all ABSN students' },
  'vanderbilt-mn': { amount: 9000, notes: 'All full-time MN students receive $3K-$15K (using $9K midpoint)' }
};

// Merit scholarships - 10% probability for non-diversity/non-need applicants
const MERIT_SCHOLARSHIP_POOLS = {
  'ohio-state': { pool: 5000, probability: 0.10 },
  'emory': { pool: 15000, probability: 0.15 },
  'duke': { pool: 20000, probability: 0.10 },
  'creighton': { pool: 5000, probability: 0.10 },
  'musc': { pool: 5000, probability: 0.10 },
  'gcu': { pool: 5000, probability: 0.15 },
  'mercer': { pool: 5000, probability: 0.10 }
};

// Out-of-state tuition corrections (user qualifies in-state for TX and WI only)
const OUT_OF_STATE_TUITION = {
  'ohio-state': { tuition: 100700, fees: 0, notes: 'Non-resident surcharge $1,199/credit' },
  'csuf': { tuition: 43675, fees: 0, notes: 'Non-resident surcharge $444/unit' },
  'utk': { tuition: 62461, fees: 2500, notes: 'Out-of-state rate' },
  'musc': { tuition: 60660, fees: 2400, notes: 'Out-of-state rate' },
  'ucla-mecn': { tuition: 99016, fees: 3000, notes: 'Non-resident including health insurance' },
  'u-cincinnati': { tuition: 96749, fees: 2000, notes: 'Non-resident rate' }
  // UW-Seattle, CSUN, U Kentucky - same rate for all (fee-based/online programs)
};

// IDs to remove (duplicates) - keep the first entry
const DUPLICATE_IDS_TO_REMOVE = [];

// Find duplicates
const seen = new Set();
const toRemove = [];
data.programs.forEach((p, i) => {
  const key = p.id;
  if (seen.has(key)) {
    toRemove.push(i);
    console.log(`Marking duplicate for removal: ${p.name} (${p.type}) at index ${i}`);
  } else {
    seen.add(key);
  }
});

// Remove duplicates (reverse order to preserve indices)
toRemove.reverse().forEach(i => {
  console.log(`Removing: ${data.programs[i].name} (${data.programs[i].type})`);
  data.programs.splice(i, 1);
});

console.log(`\nRemoved ${toRemove.length} duplicate entries.\n`);

// Update each program
console.log('Updating programs...\n');
console.log('Program'.padEnd(25) + 'Old Tuition'.padStart(12) + 'New Tuition'.padStart(12) + 'Guaranteed'.padStart(12) + 'Work Commit'.padStart(12));
console.log('='.repeat(75));

data.programs.forEach(p => {
  const oldTuition = p.costs?.Tuition || 0;

  // Initialize scholarship structure
  if (!p.scholarships) p.scholarships = {};

  // 1. Update out-of-state tuition
  if (OUT_OF_STATE_TUITION[p.id]) {
    const update = OUT_OF_STATE_TUITION[p.id];
    p.costs.Tuition = update.tuition;
    p.costs.Fees = update.fees;
    p.costs.tuition_notes = update.notes;
  }

  // 2. Add guaranteed scholarships
  if (GUARANTEED_SCHOLARSHIPS[p.id]) {
    p.scholarships.guaranteed = GUARANTEED_SCHOLARSHIPS[p.id];
  } else {
    p.scholarships.guaranteed = null;
  }

  // 3. Add work-commitment scholarships
  if (WORK_COMMITMENT_SCHOLARSHIPS[p.id]) {
    p.scholarships.work_commitment = WORK_COMMITMENT_SCHOLARSHIPS[p.id];
  } else {
    p.scholarships.work_commitment = null;
  }

  // 4. Add merit scholarship pool (10% probability)
  if (MERIT_SCHOLARSHIP_POOLS[p.id]) {
    p.scholarships.merit = MERIT_SCHOLARSHIP_POOLS[p.id];
  } else {
    p.scholarships.merit = { pool: 0, probability: 0 };
  }

  // 5. Calculate expected scholarship value (without work commitment)
  const guaranteedAmt = p.scholarships.guaranteed?.amount || 0;
  const meritExpected = (p.scholarships.merit?.pool || 0) * (p.scholarships.merit?.probability || 0);
  p.scholarships.expected_value_no_commitment = Math.round(guaranteedAmt + meritExpected);

  // 6. Calculate expected value WITH work commitment
  const workCommitAmt = p.scholarships.work_commitment?.amount || 0;
  // Work commitment scholarships are competitive, so apply ~50% probability of acceptance
  const workCommitExpected = p.scholarships.work_commitment?.competitive ? workCommitAmt * 0.5 : workCommitAmt;
  p.scholarships.expected_value_with_commitment = Math.round(guaranteedAmt + meritExpected + workCommitExpected);

  // 7. Clear old scholarship fields, recalculate net tuition
  const newTuition = p.costs.Tuition || oldTuition;
  const fees = p.costs.Fees || 0;

  // Net tuition WITHOUT work commitment
  p.costs['Net Tuition'] = newTuition + fees - p.scholarships.expected_value_no_commitment;
  p.costs['Schlrshp Amt'] = p.scholarships.expected_value_no_commitment;
  p.costs['Schlrshp %'] = null; // Remove misleading percentage

  console.log(
    p.name.padEnd(25) +
    ('$' + oldTuition.toLocaleString()).padStart(12) +
    ('$' + newTuition.toLocaleString()).padStart(12) +
    ('$' + guaranteedAmt.toLocaleString()).padStart(12) +
    ('$' + (p.scholarships.work_commitment?.amount || 0).toLocaleString()).padStart(12)
  );
});

// Recalculate monthly burn and cost scores
console.log('\n\nRecalculating costs and scores...\n');

const BASE_LIVING = 1500;
const MAX_BURN = 10000;

data.programs.forEach(p => {
  const costs = p.costs || {};
  const details = p.program_details || {};

  const tuition = costs.Tuition || 0;
  const fees = costs.Fees || 0;
  const scholarship = p.scholarships?.expected_value_no_commitment || 0;
  const netTuition = tuition + fees - scholarship;

  const duration = costs['Duration (mo)'] || details.duration_months || 12;
  let colIndex = costs['COL Index'] || 100;
  if (colIndex > 10) colIndex = colIndex / 100;

  const totalLiving = BASE_LIVING * colIndex * duration;
  const monthlyBurn = (netTuition + totalLiving) / duration;
  const costScore = Math.max(0, 1 - (monthlyBurn / MAX_BURN));

  costs['Net Tuition'] = netTuition;
  costs['Mo. Burn'] = Math.round(monthlyBurn);
  costs['Cost Score'] = Math.round(costScore * 100) / 100;

  // Update scores
  if (p.scores) {
    p.scores.cost_score = Math.round(costScore * 100) / 100;
  }
});

// Recalculate raw scores
const TARGET_PERCENTILE = 0.8;
const TARGET_START = '2027-01-20';

function calcCompetitiveness(percentile) {
  if (percentile == null) return 1.0;
  return 1 - Math.abs(percentile - TARGET_PERCENTILE);
}

function calcStartScore(startDate) {
  if (!startDate) return 1.0;
  const start = new Date(startDate);
  const target = new Date(TARGET_START);
  const diffMonths = (start - target) / (1000 * 60 * 60 * 24 * 30);
  if (diffMonths < -6 || diffMonths > 6) return 0.5;
  if (diffMonths < -3 || diffMonths > 3) return 0.75;
  return 1.0;
}

function calcTimeFactor(months) {
  if (!months) return 1.0;
  if (months <= 12) return 1.0;
  if (months <= 18) return 0.75;
  if (months <= 24) return 0.5;
  return 0.25;
}

data.programs.forEach(p => {
  const scores = p.scores || {};
  const details = p.program_details || {};
  const costs = p.costs || {};

  const base = (scores.location_score || 5) + (scores.location_boost || 0);
  const prereqFit = p.prerequisites?.addl_prereq_fit || 1.0;
  const onlineLabConf = scores.online_lab_conf || details.online_lab_conf || 1.0;
  const npPathway = scores.np_pathway || 0.5;
  const prestige = scores.prestige || 1.0;
  const competitiveness = calcCompetitiveness(scores.national_percentile);
  const startScore = calcStartScore(p.admissions?.start_date);
  const duration = costs['Duration (mo)'] || details.duration_months || 12;
  const timeFactor = calcTimeFactor(duration);
  const costScore = scores.cost_score || 0.5;

  const rawScore = base * prereqFit * onlineLabConf * npPathway * prestige * competitiveness * startScore * timeFactor * costScore;

  scores.raw_score = Math.round(rawScore * 100) / 100;
  scores.competitiveness = Math.round(competitiveness * 100) / 100;
  scores.start_score = Math.round(startScore * 100) / 100;
});

// Re-rank
const sorted = [...data.programs].sort((a, b) => {
  const scoreA = a.scores?.raw_score ?? -1;
  const scoreB = b.scores?.raw_score ?? -1;
  return scoreB - scoreA;
});

let rank = 1;
sorted.forEach(p => {
  if (p.scores?.raw_score > 0) {
    p.scores.rank = rank++;
  } else {
    p.scores.rank = null;
  }
});

data.programs.forEach(p => {
  const updated = sorted.find(s => s.id === p.id);
  if (updated) p.scores.rank = updated.scores.rank;
});

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\n' + '='.repeat(75));
console.log(`\nUpdated ${data.programs.length} programs.`);
console.log('\nNew Top 15:');
sorted.slice(0, 15).forEach(p => {
  const workCommit = p.scholarships?.work_commitment ? ' [has work-commit option]' : '';
  console.log(`#${p.scores.rank}: ${p.name} (${p.scores.raw_score}) - $${p.costs['Mo. Burn']}/mo${workCommit}`);
});

console.log('\n\nPrograms with Work-Commitment Scholarships:');
data.programs.filter(p => p.scholarships?.work_commitment).forEach(p => {
  const wc = p.scholarships.work_commitment;
  console.log(`- ${p.name}: ${wc.program_name} - $${wc.amount.toLocaleString()} for ${wc.commitment_years}yr at ${wc.employer}`);
});
