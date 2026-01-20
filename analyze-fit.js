/**
 * Analyze program fit against user's prereq plan
 *
 * User's Plan:
 * - Spring 2026 (Jan-May): A&P1, A&P2, Stats, Chemistry, Lifespan Psych
 * - Summer 2026: Nutrition, Microbiology
 * - Fall 2026: Available for up to 3 extra courses
 *
 * Categories:
 * - "fits": Standard prereqs, no unusual requirements
 * - "fall_required": Needs 1-3 extra courses that can be done in Fall 2026
 * - "adjust": Needs 4+ extra courses, or timing/application complications
 * - "ruled_out": Healthcare exp/cert required, or impossible timeline
 *
 * Max leniency: Can apply with courses planned for future semesters (not yet enrolled)
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

  for (const extra of extras) {
    const extraLower = extra.toLowerCase();

    // FIRST: Check if it's a course that needs to be added (check courses BEFORE skipping)
    // This ensures "Pathophysiology (grade B+ required)" gets caught
    if (extraLower.includes('pathophysiology') ||
        extraLower.includes('pathobiology') ||
        extraLower.includes('patho') ||
        extraLower.includes('pharmacology') ||
        extraLower.includes('pharmacotherapy') ||
        extraLower.includes('genetics') ||
        extraLower.includes('organic') ||
        extraLower.includes('biochem') ||
        extraLower.includes('english comp') ||
        extraLower.includes('composition') ||
        extraLower.includes('abnormal psych') ||
        extraLower.includes('general biology') ||
        extraLower.includes('biology (3 cr)') ||
        extraLower.includes('biology or chemistry') ||
        extraLower.includes('ethics') ||
        extraLower.includes('epidemiology') ||
        extraLower.includes('foreign language') ||
        extraLower.includes('theology') ||
        extraLower.includes('religion') ||
        extraLower.includes('philosophy') ||
        extraLower.includes('fine arts') ||
        extraLower.includes('history') ||
        extraLower.includes('government') ||
        extraLower.includes('constitution') ||
        extraLower.includes('chemistry i') ||
        extraLower.includes('chemistry for health') ||
        extraLower.includes('gen ed') ||
        extraLower.includes('general education') ||
        extraLower.includes('cultural diversity') ||
        extraLower.includes('diversity') ||
        extraLower.includes('humanities')) {
      adjustmentNeeded.push(extra);
    }
    // Non-course requirements are ignored (TEAS, GRE, resume, BLS, etc.)
  }

  // Categorize based on number of extra courses needed
  if (adjustmentNeeded.length > 3) {
    // More than 3 extra courses = needs significant adjustment
    status = 'adjust';
    reasons.push(`Needs ${adjustmentNeeded.length} extra courses: ${adjustmentNeeded.join(', ')}`);
    reasons.push('More than 3 courses - may need summer additions or test-outs');
  } else if (adjustmentNeeded.length > 0) {
    // 1-3 extra courses = can do in Fall 2026
    status = 'fall_required';
    reasons.push(`Fall 2026 courses needed (${adjustmentNeeded.length}): ${adjustmentNeeded.join(', ')}`);
  }

  // Special timing considerations - programs requiring prereqs complete at application
  // With max leniency, only flag if they explicitly require COMPLETE (not planned)
  if (notes.toLowerCase().includes('must be complete') ||
      notes.toLowerCase().includes('completed before') ||
      notes.toLowerCase().includes('no in-progress')) {
    if (status === 'fits' || status === 'fall_required') {
      status = 'adjust';
      reasons.push('May require prereqs complete (not planned) at application - verify with school');
    }
  }

  // Check online A&P lab policy - user is taking A&P online
  const onlineLabsOk = program.prerequisites?.online_ap_labs;
  if (onlineLabsOk === false) {
    // Explicit policy: does NOT accept online labs
    if (status === 'fits' || status === 'fall_required') {
      status = 'adjust';
    }
    reasons.push('Does NOT accept online A&P labs - requires in-person lab completion');
  } else if (onlineLabsOk === 'conditional') {
    // Conditional - add a note but don't change status
    reasons.push('Online A&P labs: case-by-case review - verify with school');
  } else if (onlineLabsOk === null) {
    // Policy unclear
    reasons.push('Online A&P lab policy unclear - verify with school before applying');
  }

  if (status === 'fits' && reasons.length === 0) {
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
const fallRequired = data.programs.filter(p => p.plan_fit?.status === 'fall_required');
const adjust = data.programs.filter(p => p.plan_fit?.status === 'adjust');
const ruledOut = data.programs.filter(p => p.plan_fit?.status === 'ruled_out');

console.log('=== Plan Fit Analysis ===\n');

console.log(`✓ FITS WITH PLAN (${fits.length} programs):`);
fits.forEach(p => console.log(`  ${p.name} (${p.location?.full})`));

console.log(`\n📚 FALL CLASS REQUIRED (${fallRequired.length} programs):`);
fallRequired.forEach(p => {
  console.log(`  ${p.name}:`);
  p.plan_fit.reasons.forEach(r => console.log(`    - ${r}`));
});

console.log(`\n⚡ NEEDS ADJUSTMENT (${adjust.length} programs):`);
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
console.log(`Fall Required: ${fallRequired.length}`);
console.log(`Adjust: ${adjust.length}`);
console.log(`Ruled Out: ${ruledOut.length}`);
console.log(`Total: ${data.programs.length}`);
