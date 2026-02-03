/**
 * Seed script: generates data/my-todos.json
 *
 * Reads programs.json, selects top 12 ranked programs,
 * reads application_requirements for granular task generation,
 * and auto-generates consolidated + per-school tasks.
 *
 * Features:
 *   - Cross-program consolidation (exams, essays, transcripts, BLS, resume, NursingCAS)
 *   - Quantity-aware reference letter scheduling
 *   - Per-school decomposed tasks (submit, supplemental, fee, interview, deposit, unique)
 *   - NOT ACCEPTING check (Emory)
 *   - Synthetic deadlines for rolling programs (start_date - 120 days)
 *   - Auto-roll-forward for passed deadlines (generates verification task)
 *   - tracked_programs as objects with app_status
 *
 * Usage: node data/seed-todos.js
 */

const fs = require('fs');
const path = require('path');

const programsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'programs.json'), 'utf-8'));
const programs = programsData.programs;
const today = '2026-02-03';

// ===== CONFIGURATION =====

const COHORT_SIZE = 12;
const ROLL_FORWARD_THRESHOLD_DAYS = 14;

const LEAD_DAYS = {
  exam: 30,
  personal_statement: 14,
  resume: 14,
  bls: 30,
  transcript: 4,
  reference: 30,
  nursingcas_setup: 14,
  background_check: 14,
  supplemental_essay: 14,
};

// Institutions for transcript requests
const TRANSCRIPT_INSTITUTIONS = ['UW-Madison', 'WCTC', 'MATC'];

// ===== UTILITY FUNCTIONS =====

let taskCounter = 0;

function nextId() {
  taskCounter++;
  return 'task-' + String(taskCounter).padStart(3, '0');
}

function subtractDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function earliestFutureDeadline(deadlines) {
  const sorted = deadlines.filter(d => d && d >= today).sort();
  return sorted[0] || null;
}

function formatDeadlineReason(program) {
  const deadline = getEffectiveDeadline(program);
  if (!deadline) return '';
  const d = new Date(deadline + 'T00:00:00');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${program.name} deadline ${month} ${day}`;
}

// Get effective deadline: use actual deadline, or compute synthetic from start_date - 120 days
function getEffectiveDeadline(program) {
  const deadline = program.admissions?.deadline;
  if (deadline) return deadline;
  // Synthetic deadline for rolling programs
  const startDate = program.admissions?.start_date;
  if (startDate) return subtractDays(startDate, 120);
  return null;
}

// Check if a program is NOT ACCEPTING
function isNotAccepting(program) {
  const notes = program.verification?.notes || '';
  return notes.toUpperCase().includes('NOT ACCEPTING');
}

function makeTask(title, category, dueDate, dueReason, appliesTo, notes) {
  return {
    id: nextId(),
    title,
    category,
    status: 'pending',
    due_date: dueDate,
    due_reason: dueReason,
    applies_to: appliesTo,
    notes: notes || '',
    auto_generated: true,
    created_at: today,
    completed_at: null
  };
}

// Get application_requirements with fallback to prerequisites.extra string matching
function getAppReqs(program) {
  if (program.application_requirements) return program.application_requirements;

  // Fallback: build from prerequisites.extra
  const extras = (program.prerequisites?.extra || []);
  const extrasLower = extras.map(e => e.toLowerCase());
  const extrasJoined = extrasLower.join(' ');

  return {
    system: null,
    fee: null,
    essays: extrasLower.some(e => e.includes('essay') || e.includes('statement') || e.includes('personal'))
      ? [{ type: 'personal_statement', label: 'Personal statement', word_range: null, transferable: true }]
      : [],
    references: { count: 0 },
    resume: false,
    exam: extrasLower.some(e => e.includes('teas') && e.includes('hesi')) ? 'teas_or_hesi'
      : extrasLower.some(e => e.includes('teas')) ? 'teas'
      : extrasLower.some(e => e.includes('hesi')) ? 'hesi'
      : null,
    certifications: extrasLower.some(e => e.includes('bls') || e.includes('basic life support') || e.includes('cpr'))
      ? ['bls'] : [],
    background_check: false,
    immunizations: false,
    interview: 'none',
    deposit: null,
    unique: [],
    research_status: 'pending'
  };
}

// ===== PROGRAM SELECTION =====

// Select top COHORT_SIZE by rank (include all, even deadline-passed — handle them differently)
const ranked = programs
  .filter(p => p.scores && p.scores.rank != null)
  .sort((a, b) => a.scores.rank - b.scores.rank)
  .slice(0, COHORT_SIZE);

console.log(`Top ${COHORT_SIZE} programs by rank:`);
ranked.forEach(p => {
  const deadline = p.admissions?.deadline;
  const effDeadline = getEffectiveDeadline(p);
  const notAccepting = isNotAccepting(p) ? ' [NOT ACCEPTING]' : '';
  const deadlinePassed = deadline && deadline < today ? ' [DEADLINE PASSED]' : '';
  console.log(`  #${p.scores.rank} ${p.name} (${p.id}) — deadline: ${deadline || 'rolling'}, effective: ${effDeadline}${notAccepting}${deadlinePassed}`);
});

// Build tracked programs with app_status
const trackedPrograms = ranked.map(p => ({
  id: p.id,
  app_status: 'not_started'
}));

const trackedIds = ranked.map(p => p.id);

// Separate active programs from special cases
const activePrograms = [];
const notAcceptingPrograms = [];
const deadlinePassedPrograms = [];

for (const p of ranked) {
  if (isNotAccepting(p)) {
    notAcceptingPrograms.push(p);
  } else {
    const deadline = p.admissions?.deadline;
    const daysPast = deadline ? daysBetween(deadline, today) : 0;
    if (deadline && daysPast > ROLL_FORWARD_THRESHOLD_DAYS) {
      deadlinePassedPrograms.push(p);
    } else {
      activePrograms.push(p);
    }
  }
}

console.log(`\nActive: ${activePrograms.length}, Not accepting: ${notAcceptingPrograms.length}, Deadline passed: ${deadlinePassedPrograms.length}`);

// ===== ANALYSIS =====

// Analyze only active programs for task generation
const analysis = activePrograms.map(p => {
  const reqs = getAppReqs(p);
  const effDeadline = getEffectiveDeadline(p);

  return {
    id: p.id,
    name: p.name,
    deadline: effDeadline,
    rawDeadline: p.admissions?.deadline,
    verification: p.verification?.confidence,
    reqs,
    program: p
  };
});

// Sort by deadline ascending for quantity-aware scheduling
analysis.sort((a, b) => {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
});

console.log('\nAnalysis (sorted by deadline):');
analysis.forEach(a => {
  const r = a.reqs;
  console.log(`  ${a.name}: deadline=${a.deadline}, system=${r.system}, exam=${r.exam}, refs=${r.references?.count}, fee=$${r.fee}, interview=${r.interview}`);
});

const tasks = [];

// ===== CROSS-PROGRAM TASKS =====

// Helper: find earliest deadline among programs matching a filter
function earliestAmong(filter) {
  const deadlines = analysis.filter(filter).map(a => a.deadline).filter(Boolean);
  return earliestFutureDeadline(deadlines);
}

function findDrivingProgram(deadline) {
  return analysis.find(a => a.deadline === deadline);
}

// 1. TEAS exam
const teasPrograms = analysis.filter(a => a.reqs.exam === 'teas' || a.reqs.exam === 'teas_or_hesi');
if (teasPrograms.length > 0) {
  const earliest = earliestAmong(a => a.reqs.exam === 'teas' || a.reqs.exam === 'teas_or_hesi');
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.exam) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Take TEAS exam',
    'exam',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    teasPrograms.map(a => a.id),
    'Register at atitesting.com. Score valid 24 months.'
  ));
}

// 2. HESI exam
const hesiPrograms = analysis.filter(a => a.reqs.exam === 'hesi' || a.reqs.exam === 'teas_or_hesi');
if (hesiPrograms.length > 0) {
  const earliest = earliestAmong(a => a.reqs.exam === 'hesi' || a.reqs.exam === 'teas_or_hesi');
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.exam) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Take HESI A2 exam',
    'exam',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    hesiPrograms.map(a => a.id),
    'Register through your testing center. Check which version each school requires.'
  ));
}

// 3. Personal statement (transferable)
const psPrograms = analysis.filter(a =>
  (a.reqs.essays || []).some(e => e.type === 'personal_statement' && e.transferable)
);
if (psPrograms.length > 0) {
  const earliest = earliestAmong(a =>
    (a.reqs.essays || []).some(e => e.type === 'personal_statement' && e.transferable)
  );
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.personal_statement) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Write personal statement',
    'document',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    psPrograms.map(a => a.id),
    'Most programs want: why nursing, career goals, relevant experience. Reusable across programs.'
  ));
}

// 4. Resume/CV
const resumePrograms = analysis.filter(a => a.reqs.resume);
if (resumePrograms.length > 0) {
  const earliest = earliestAmong(a => a.reqs.resume);
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.resume) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Prepare resume/CV',
    'document',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    resumePrograms.map(a => a.id),
    'Highlight healthcare-relevant experience, volunteer work, education. One resume works for all programs.'
  ));
}

// 5. BLS certification
const blsPrograms = analysis.filter(a => (a.reqs.certifications || []).includes('bls'));
if (blsPrograms.length > 0) {
  const earliest = earliestAmong(a => (a.reqs.certifications || []).includes('bls'));
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.bls) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Complete BLS certification',
    'verification',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    blsPrograms.map(a => a.id),
    'American Heart Association BLS for Healthcare Providers. Valid 2 years.'
  ));
}

// 6. Transcripts - one per institution
const allDeadlines = analysis.map(a => a.deadline).filter(Boolean);
const earliestDeadline = earliestFutureDeadline(allDeadlines);

for (const inst of TRANSCRIPT_INSTITUTIONS) {
  const dueDate = earliestDeadline ? subtractDays(earliestDeadline, LEAD_DAYS.transcript) : null;
  const driver = findDrivingProgram(earliestDeadline);
  tasks.push(makeTask(
    `Request ${inst} transcripts`,
    'document',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    trackedIds,
    ''
  ));
}

// 7. NursingCAS account setup
const nursingcasPrograms = analysis.filter(a => a.reqs.system === 'nursingcas' || a.reqs.system === 'both');
if (nursingcasPrograms.length > 0) {
  const earliest = earliestAmong(a => a.reqs.system === 'nursingcas' || a.reqs.system === 'both');
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.nursingcas_setup) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Set up NursingCAS account',
    'application',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    nursingcasPrograms.map(a => a.id),
    'Create account at nursingcas.liaisoncas.com. Upload transcripts, enter coursework. Shared across all NursingCAS schools.'
  ));
}

// 8. Background check (if any program requires it)
const bgCheckPrograms = analysis.filter(a => a.reqs.background_check);
if (bgCheckPrograms.length > 0) {
  const earliest = earliestAmong(a => a.reqs.background_check);
  const dueDate = earliest ? subtractDays(earliest, LEAD_DAYS.background_check) : null;
  const driver = findDrivingProgram(earliest);
  tasks.push(makeTask(
    'Complete background check',
    'verification',
    dueDate,
    driver ? formatDeadlineReason(driver.program) : '',
    bgCheckPrograms.map(a => a.id),
    'Most programs use CastleBranch or similar. One check may satisfy multiple programs.'
  ));
}

// 9. Quantity-aware reference letter scheduling
// Sort programs by deadline ascending, incrementally create reference tasks
let maxRefsSoFar = 0;
for (const a of analysis) {
  const refsNeeded = a.reqs.references?.count || 0;
  if (refsNeeded <= maxRefsSoFar) continue;

  const dueDate = a.deadline ? subtractDays(a.deadline, LEAD_DAYS.reference) : null;

  for (let i = maxRefsSoFar + 1; i <= refsNeeded; i++) {
    // Find all programs needing >= i references
    const programsNeedingI = analysis.filter(x => (x.reqs.references?.count || 0) >= i);
    tasks.push(makeTask(
      `Request reference letter #${i}`,
      'document',
      dueDate,
      a.deadline ? formatDeadlineReason(a.program) : '',
      programsNeedingI.map(x => x.id),
      `Reference letter ${i}. ${a.reqs.references?.notes || 'Academic or professional.'}`
    ));
  }

  maxRefsSoFar = Math.max(maxRefsSoFar, refsNeeded);
}

// ===== PER-SCHOOL TASKS =====

for (const a of analysis) {
  const p = a.program;
  const reqs = a.reqs;
  const deadline = a.deadline;

  // Determine application system label
  const systemLabel = reqs.system === 'nursingcas' ? 'NursingCAS'
    : reqs.system === 'both' ? 'NursingCAS + supplemental'
    : reqs.system === 'direct' ? 'direct'
    : 'application';

  // Submit application
  tasks.push(makeTask(
    `Submit ${systemLabel} application — ${a.name}`,
    'application',
    deadline,
    deadline ? `${a.name} deadline` : '',
    [a.id],
    reqs.system_notes || ''
  ));

  // Application fee
  if (reqs.fee) {
    tasks.push(makeTask(
      `Pay ${a.name} application fee ($${reqs.fee})`,
      'fee',
      deadline,
      deadline ? `${a.name} deadline` : '',
      [a.id],
      reqs.system_notes || ''
    ));
  }

  // Non-transferable supplemental essays
  const supplementals = (reqs.essays || []).filter(e => !e.transferable);
  for (const essay of supplementals) {
    const essayDue = deadline ? subtractDays(deadline, LEAD_DAYS.supplemental_essay) : null;
    tasks.push(makeTask(
      `Write ${a.name} essay: ${essay.label}`,
      'document',
      essayDue,
      deadline ? `${a.name} deadline` : '',
      [a.id],
      essay.word_range ? `Word range: ${essay.word_range[0]}-${essay.word_range[1]}` : ''
    ));
  }

  // Interview prep (if required or by invitation)
  if (reqs.interview === 'required' || reqs.interview === 'by_invitation') {
    tasks.push(makeTask(
      `Prepare for ${a.name} interview`,
      'application',
      null, // TBD — after invitation
      reqs.interview === 'by_invitation' ? 'After invitation received' : '',
      [a.id],
      reqs.interview === 'by_invitation'
        ? 'Interview by invitation only. Prepare: why this program, career goals, clinical interests.'
        : 'Prepare: why this program, career goals, clinical interests.'
    ));
  }

  // Enrollment deposit (after admission)
  if (reqs.deposit) {
    tasks.push(makeTask(
      `Pay ${a.name} enrollment deposit ($${reqs.deposit.amount})`,
      'fee',
      null, // Due after admission
      reqs.deposit.timing || 'After admission',
      [a.id],
      `${reqs.deposit.refundable ? 'Refundable' : 'Non-refundable'}. ${reqs.deposit.timing || ''}`
    ));
  }

  // Unique items
  for (const item of (reqs.unique || [])) {
    // Skip items that are just informational notes (not actionable tasks)
    const lower = item.toLowerCase();
    if (lower.includes('max ') || lower.includes('all prereqs') || lower.includes('summer start only') || lower.includes('rolling admissions')) continue;

    tasks.push(makeTask(
      `${a.name}: ${item}`,
      'verification',
      deadline ? subtractDays(deadline, 30) : null,
      deadline ? `${a.name} deadline` : '',
      [a.id],
      ''
    ));
  }

  // Verify requirements (if not fully verified)
  if (a.verification !== 'verified') {
    const dueDate = deadline ? subtractDays(deadline, 45) : null;
    tasks.push(makeTask(
      `Verify ${a.name} requirements`,
      'verification',
      dueDate,
      deadline ? `${a.name} deadline` : '',
      [a.id],
      `Confidence: ${a.verification || 'unknown'}. Check official website for current prereqs and deadlines.`
    ));
  }
}

// ===== NOT ACCEPTING PROGRAMS =====

for (const p of notAcceptingPrograms) {
  tasks.push(makeTask(
    `Check ${p.name} application status`,
    'verification',
    subtractDays(today, -90), // 90 days from now
    'Periodic check',
    [p.id],
    'Program marked as NOT ACCEPTING as of Feb 2026. Check periodically for reopening.'
  ));
}

// ===== DEADLINE-PASSED PROGRAMS (roll-forward) =====

for (const p of deadlinePassedPrograms) {
  const notes = p.admissions?.app_timing_notes || '';
  tasks.push(makeTask(
    `Research ${p.name} next application cycle`,
    'verification',
    subtractDays(today, -14), // 2 weeks from now
    'Deadline passed — verify next cycle',
    [p.id],
    `Previous deadline: ${p.admissions?.deadline}. ${notes}. Check for next start date and updated deadline.`
  ));
}

// ===== BUILD OUTPUT =====

const output = {
  tracked_programs: trackedPrograms,
  tasks: tasks,
  settings: {
    transcript_lead_days: LEAD_DAYS.transcript,
    default_view: 'timeline'
  }
};

// Write to file
const outPath = path.join(__dirname, 'my-todos.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`\nGenerated ${tasks.length} tasks for ${trackedIds.length} tracked programs`);
console.log(`  Active programs: ${activePrograms.length}`);
console.log(`  Not accepting: ${notAcceptingPrograms.length}`);
console.log(`  Deadline passed (roll-forward): ${deadlinePassedPrograms.length}`);
console.log(`Written to ${outPath}`);
