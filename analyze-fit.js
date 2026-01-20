/**
 * Analyze program fit against user's prereq plan
 *
 * User's Plan:
 * - Spring 2026 (Jan-May): A&P1, A&P2, Stats, Chemistry, Lifespan Psych
 * - Summer 2026: Nutrition, Microbiology
 * - Fall 2026: Available for extras
 *
 * Categories:
 * - "fits": Standard prereqs, no unusual requirements
 * - "adjust": Needs extra course(s) that can be done summer/fall, or test out option
 * - "ruled_out": Complete prereqs at app, healthcare exp/cert required, or impossible timeline
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// What user will have by when:
// By Feb 2026 (early deadlines): All 5 spring courses IN PROGRESS
// By May 2026: A&P1, A&P2, Stats, Chem, Lifespan COMPLETE
// By Aug 2026: + Nutrition, Micro COMPLETE
// By Dec 2026: + Any fall extras COMPLETE
// By Jan 2027: Ready to start program

// Standard prereqs user will have: A&P, Stats, Chem, Lifespan, Nutrition, Micro
const userWillHave = ['ap_1_2', 'stats', 'chem', 'lifespan', 'nutrition', 'micro'];

// Extra prereqs that RULE OUT (require prior certification/experience)
const ruledOutExtras = [
  'CNA certification',
  'CNA I certification',
  'healthcare experience',
  '100 hours healthcare experience',
  '50 hours healthcare experience',
  '10 hrs healthcare exp',
  'Healthcare experience (10 hrs',
];

// Extra prereqs that can be done in Fall 2026 (one course)
const oneCourseAdjustments = [
  'Pathophysiology',
  'Pharmacology',
  'Genetics',
  'Introduction to Genetics',
  'Human Genetics',
  'Organic Chemistry',
  'Biochemistry',
  'English Composition',
  'Abnormal Psychology',
  'General Biology',
  'Ethics',
  'Health Care Ethics',
];

// Extra prereqs that need summer adjustment (test out of nutrition or add to summer)
const summerAdjustments = [
  'Pathophysiology',  // Could add to summer if test out of nutrition
  'Pharmacology',
];

// Programs requiring COMPLETE prereqs at application (Feb 2026) = ruled out
// Because user will have everything IN PROGRESS, not complete

function analyzeProgram(program) {
  const extras = program.prerequisites?.extra || [];
  const inProgressOk = program.admissions?.in_progress_ok;
  const notes = program.admissions?.app_timing_notes || '';

  let status = 'fits';
  let reasons = [];

  // Check if program requires complete prereqs at application
  if (inProgressOk === false) {
    status = 'ruled_out';
    reasons.push('Requires complete prereqs at application (Feb 2026) - you will have all in-progress');
    program.plan_fit = { status, reasons };
    return;
  }

  // Check for healthcare experience/certification requirements
  for (const extra of extras) {
    const extraLower = extra.toLowerCase();
    if (extraLower.includes('cna') ||
        extraLower.includes('healthcare experience') ||
        extraLower.includes('healthcare exp')) {
      status = 'ruled_out';
      reasons.push(`Requires: ${extra}`);
    }
  }

  if (status === 'ruled_out') {
    program.plan_fit = { status, reasons };
    return;
  }

  // Check for extra prereqs that need adjustment
  let adjustmentNeeded = [];
  let impossibleExtras = [];

  for (const extra of extras) {
    const extraLower = extra.toLowerCase();

    // Skip non-course requirements (TEAS, GRE, resume, etc.)
    if (extraLower.includes('teas') ||
        extraLower.includes('hesi') ||
        extraLower.includes('gre') ||
        extraLower.includes('gmat') ||
        extraLower.includes('resume') ||
        extraLower.includes('letter') ||
        extraLower.includes('recommendation') ||
        extraLower.includes('statement') ||
        extraLower.includes('interview') ||
        extraLower.includes('bls') ||
        extraLower.includes('cpr') ||
        extraLower.includes('within') ||  // timing notes
        extraLower.includes('grade') ||   // grade requirements
        extraLower.includes('gpa') ||
        extraLower.includes('credits') ||
        extraLower.includes('hours') ||
        extraLower.includes('sequence') ||
        extraLower.includes('must be') ||
        extraLower.includes('cannot') ||
        extraLower.includes('before')) {
      continue;
    }

    // Check if it's a course that needs to be added
    if (extraLower.includes('pathophysiology') ||
        extraLower.includes('patho') ||
        extraLower.includes('pharmacology') ||
        extraLower.includes('genetics') ||
        extraLower.includes('organic') ||
        extraLower.includes('biochem') ||
        extraLower.includes('english comp') ||
        extraLower.includes('composition') ||
        extraLower.includes('abnormal psych') ||
        extraLower.includes('general biology') ||
        extraLower.includes('biology (3 cr)') ||
        extraLower.includes('ethics') ||
        extraLower.includes('epidemiology') ||
        extraLower.includes('foreign language') ||
        extraLower.includes('theology') ||
        extraLower.includes('religion') ||
        extraLower.includes('philosophy') ||
        extraLower.includes('fine arts') ||
        extraLower.includes('history') ||
        extraLower.includes('government') ||
        extraLower.includes('constitution')) {
      adjustmentNeeded.push(extra);
    }
  }

  // Special case: Programs requiring 2+ extra courses = harder adjustment
  if (adjustmentNeeded.length > 2) {
    status = 'adjust';
    reasons.push(`Needs ${adjustmentNeeded.length} extra courses: ${adjustmentNeeded.join(', ')}`);
    reasons.push('May need to add courses to summer or test out of Nutrition');
  } else if (adjustmentNeeded.length > 0) {
    status = 'adjust';
    reasons.push(`Add to Fall 2026: ${adjustmentNeeded.join(', ')}`);
  }

  // Special timing considerations
  if (notes.toLowerCase().includes('3 of 4') ||
      notes.toLowerCase().includes('2 of 3') ||
      notes.toLowerCase().includes('at least 1 science')) {
    // Programs that need some prereqs done at application
    if (status === 'fits') {
      status = 'adjust';
      reasons.push('May need some prereqs complete (not just in-progress) at application');
    }
  }

  if (status === 'fits') {
    reasons.push('Standard prereqs match your plan');
  }

  program.plan_fit = { status, reasons };
}

// Analyze all programs
data.programs.forEach(analyzeProgram);

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

// Summary
const fits = data.programs.filter(p => p.plan_fit?.status === 'fits');
const adjust = data.programs.filter(p => p.plan_fit?.status === 'adjust');
const ruledOut = data.programs.filter(p => p.plan_fit?.status === 'ruled_out');

console.log('=== Plan Fit Analysis ===\n');

console.log(`✓ FITS WITH PLAN (${fits.length} programs):`);
fits.forEach(p => console.log(`  ${p.name} (${p.location?.full})`));

console.log(`\n⚡ REQUIRES ADJUSTMENT (${adjust.length} programs):`);
adjust.forEach(p => {
  console.log(`  ${p.name}:`);
  p.plan_fit.reasons.forEach(r => console.log(`    - ${r}`));
});

console.log(`\n✗ RULED OUT (${ruledOut.length} programs):`);
ruledOut.forEach(p => {
  console.log(`  ${p.name}:`);
  p.plan_fit.reasons.forEach(r => console.log(`    - ${r}`));
});

console.log(`\n=== Summary ===`);
console.log(`Fits: ${fits.length}`);
console.log(`Adjust: ${adjust.length}`);
console.log(`Ruled Out: ${ruledOut.length}`);
console.log(`Total: ${data.programs.length}`);
