/**
 * Update all programs outside WI and TX to use out-of-state tuition rates
 * User can only claim residency in WI or TX
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Out-of-state tuition adjustments based on research
// Format: { id: { newTuition, newFees, notes } }
const oosAdjustments = {
  // Already WI - no change needed
  // "uw-madison": WI resident
  // "edgewood": WI resident
  // "alverno": WI resident (private, same rate)
  // "marquette-demsn": WI private (same rate)
  // "uwm-mn": WI resident

  // Already TX - no change needed
  // "baylor": TX resident
  // "stedwards-austin": TX private (same rate)

  // Washington state schools
  "uw-seattle": { newTuition: 57000, notes: "WA non-resident ~$57K vs $50K resident" },
  "spu-seattle": { newTuition: 48000, notes: "Private - same rate" },
  "wsu-spokane": { newTuition: 52000, notes: "WA non-resident ~$52K vs $35K resident" },

  // Ohio schools
  "ohio-state": { newTuition: 38000, notes: "OH non-resident ~$38K vs $12K resident" },
  "csu-cleveland": { newTuition: 30885, newFees: 8432, notes: "OH non-resident $30,885 vs $21,684 resident" },
  "christ-college-dayton": { newTuition: 38000, notes: "Private - same rate" },

  // North Carolina schools
  "duke": { newTuition: 62000, notes: "Private - same rate" },
  "uncc-charlotte": { newTuition: 46000, notes: "NC non-resident ~$46K vs $26K resident" },

  // Georgia schools
  "emory": { newTuition: 58000, notes: "Private - same rate" },
  "emory-demsn": { newTuition: 95000, notes: "Private - same rate" },

  // Pennsylvania schools
  "upenn": { newTuition: 55000, notes: "Private - same rate" },
  "pitt": { newTuition: 72000, notes: "PA non-resident ~$72K vs $54K resident" },
  "drexel": { newTuition: 52000, notes: "Private - same rate" },
  "duquesne-pittsburgh": { newTuition: 55976, notes: "Private - same rate (but still gets $30K scholarship)" },

  // New York schools
  "rochester": { newTuition: 58000, notes: "Private - same rate" },
  "columbia": { newTuition: 85000, notes: "Private - same rate" },
  "yale": { newTuition: 48000, notes: "Private - same rate" },
  "hunter-nyc": { newTuition: 31620, notes: "CUNY non-resident $31,620 vs $15,555 resident" },
  "buffalo-absn": { newTuition: 38000, notes: "SUNY non-resident ~$38K vs $24K resident" },

  // California schools
  "csuf": { newTuition: 28000, notes: "CSU non-resident ~$28K vs $9K resident" },
  "csun": { newTuition: 26000, notes: "CSU non-resident ~$26K vs $8K resident" },
  "samuel-merritt": { newTuition: 95000, notes: "Private - same rate" },
  "ucla-demsn": { newTuition: 85000, notes: "UC non-resident ~$85K vs $55K resident" },

  // Tennessee schools
  "utk": { newTuition: 45000, notes: "TN non-resident ~$45K vs $25K resident" },
  "vanderbilt-msn": { newTuition: 85000, notes: "Private - same rate" },
  "vanderbilt-demsn": { newTuition: 95000, notes: "Private - same rate" },
  "memphis-absn": { newTuition: 15384, notes: "TN non-resident ~$15K vs $5K resident (still very cheap!)" },

  // South Carolina schools
  "musc": { newTuition: 55000, notes: "SC non-resident ~$55K vs $35K resident" },
  "clemson-greenville": { newTuition: 78000, notes: "SC non-resident ~$78K vs $55K resident" },

  // Minnesota schools
  "st-kate": { newTuition: 45000, notes: "Private - same rate" },

  // Maryland schools
  "hopkins": { newTuition: 65000, notes: "Private - same rate" },
  "hopkins-msn": { newTuition: 75000, notes: "Private - same rate" },

  // Arizona schools
  "asu": { newTuition: 38000, notes: "AZ non-resident ~$38K vs $24K resident" },
  "uarizona-tucson": { newTuition: 60000, notes: "AZ non-resident ~$60K vs $40K resident" },

  // Nebraska schools
  "creighton": { newTuition: 48000, notes: "Private - same rate" },

  // Kentucky schools
  "uk": { newTuition: 52000, notes: "KY non-resident ~$52K vs $35K resident" },
  "uofl-louisville": { newTuition: 67000, notes: "KY non-resident ~$67K vs $29K resident" },

  // Colorado schools
  "regis": { newTuition: 72000, notes: "Private - same rate" },
  "uccs-cosprings": { newTuition: 71854, notes: "CO non-resident $71,854 vs $35,716 resident" },

  // Illinois schools (not WI/TX)
  "depaul-demsn": { newTuition: 75000, notes: "Private - same rate" },
  "rush-gem": { newTuition: 85000, notes: "Private - same rate" },
  "rush-demsn": { newTuition: 85000, notes: "Private - same rate" },
  "north-park": { newTuition: 42000, notes: "Private - same rate" },
  "loyola-chicago": { newTuition: 45000, notes: "Private - same rate" },

  // Oregon schools
  "ohsu-portland": { newTuition: 59000, notes: "OR non-resident ~$59K vs $46K resident" },

  // Missouri schools
  "slu-stlouis": { newTuition: 52000, notes: "Private - same rate" },
  "research-college-kc": { newTuition: 14000, notes: "Private - same rate (HCA partnership)" },

  // Michigan schools
  "wayne-state-detroit": { newTuition: 72000, notes: "MI non-resident ~$72K vs $53K resident" },

  // Idaho schools
  "isu-boise": { newTuition: 35000, notes: "ID non-resident ~$35K vs $17K resident" },

  // New Mexico schools
  "unm-albuquerque": { newTuition: 55000, notes: "NM non-resident ~$55K vs $35K resident" },

  // Utah schools
  "roseman-slc": { newTuition: 51000, notes: "Private - same rate" },

  // Alabama schools
  "uab-birmingham": { newTuition: 65000, notes: "AL non-resident ~$65K vs $42K resident" },

  // Washington DC schools
  "georgetown-dc": { newTuition: 68000, notes: "Private - same rate" },

  // Arkansas schools
  "uams-littlerock": { newTuition: 44082, notes: "AR non-resident $44,082 vs $27,032 resident" },

  // Florida schools
  "fiu-miami": { newTuition: 35000, notes: "FL non-resident ~$35K vs $16K resident" },

  // Indiana schools
  "iu-indianapolis": { newTuition: 72000, notes: "IN non-resident ~$72K vs $42K resident" },

  // Oklahoma schools
  "utulsa-absn": { newTuition: 32228, notes: "Private - same rate for all" },

  // Louisiana schools
  "loyola-nola": { newTuition: 27804, notes: "Private - same rate" },

  // Vermont schools
  "uvm-burlington": { newTuition: 85000, notes: "VT non-resident ~$85K vs $55K resident" },

  // Connecticut schools (Yale already listed above)

  // Rhode Island schools
  "ric-providence": { newTuition: 52000, notes: "RI non-resident ~$52K vs $29K resident" },

  // Ohio schools - Lourdes
  "lourdes": { newTuition: 35000, notes: "Private - same rate" }
};

let updatedCount = 0;
let skippedWI = 0;
let skippedTX = 0;

data.programs.forEach(program => {
  const location = program.location.full || program.costs?.Location || "";
  const isWI = location.includes("WI") || location.includes("Wisconsin");
  const isTX = location.includes("TX") || location.includes("Texas");

  if (isWI) {
    skippedWI++;
    return;
  }
  if (isTX) {
    skippedTX++;
    return;
  }

  const adjustment = oosAdjustments[program.id];
  if (adjustment) {
    const oldTuition = program.costs.Tuition;
    program.costs.Tuition = adjustment.newTuition;
    if (adjustment.newFees) {
      program.costs.Fees = adjustment.newFees;
    }

    // Recalculate Net Tuition
    const scholarshipAmt = program.costs["Schlrshp Amt"] || 0;
    program.costs["Net Tuition"] = program.costs.Tuition + (program.costs.Fees || 0) - scholarshipAmt;

    // Recalculate Total Cost
    program.costs["Total Cost"] = program.costs["Net Tuition"] + program.costs["Total Living"];

    // Recalculate Mo. Burn
    program.costs["Mo. Burn"] = Math.round(program.costs["Total Cost"] / program.program_details.duration_months);

    // Recalculate cost_score
    program.costs["Cost Score"] = Math.max(0, Math.round((1 - program.costs["Mo. Burn"] / 10000) * 100) / 100);
    program.scores.cost_score = program.costs["Cost Score"];

    // Add note about OOS tuition
    if (!program.notes.includes("OOS tuition")) {
      program.notes = program.notes + " [OOS tuition applied]";
    }

    console.log(`${program.id}: $${oldTuition} -> $${adjustment.newTuition} (${adjustment.notes})`);
    updatedCount++;
  }
});

// Recalculate raw_scores
function calcTimeFactor(months) {
  if (!months) return 1.0;
  if (months <= 12) return 1.0;
  if (months <= 16) return 0.8;
  if (months <= 23) return 0.6;
  if (months <= 31) return 0.4;
  return 0.2;
}

function calcRawScore(program) {
  const s = program.scores;
  const c = program.costs;

  if (!s.location_score || !s.np_pathway || !s.prestige || !s.competitiveness || !s.start_score) {
    return null;
  }

  const locationTotal = s.location_score + (s.location_boost || 0);
  const prereqFit = program.prerequisites?.addl_prereq_fit || 1.0;
  const onlineLabConf = program.program_details?.online_lab_conf || 1.0;
  const timeFactor = calcTimeFactor(program.program_details?.duration_months);
  const costScore = s.cost_score || 0.5;

  const rawScore = locationTotal * prereqFit * onlineLabConf * s.np_pathway *
                   s.prestige * s.competitiveness * s.start_score * timeFactor * costScore;

  return Math.round(rawScore * 100) / 100;
}

// Recalculate all raw_scores
data.programs.forEach(program => {
  program.scores.raw_score = calcRawScore(program);
});

// Re-rank
const rankedPrograms = data.programs
  .filter(p => p.scores.raw_score !== null)
  .sort((a, b) => (b.scores.raw_score || 0) - (a.scores.raw_score || 0));

rankedPrograms.forEach((p, i) => {
  p.scores.rank = i + 1;
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`\n=== Summary ===`);
console.log(`Updated to OOS rates: ${updatedCount} programs`);
console.log(`Kept WI resident rates: ${skippedWI} programs`);
console.log(`Kept TX resident rates: ${skippedTX} programs`);
console.log(`Total programs: ${data.programs.length}`);
