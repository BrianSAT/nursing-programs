/**
 * Seed script: generates data/my-todos.json
 *
 * Reads programs.json, selects top 10 non-ruled-out programs,
 * and auto-generates consolidated tasks.
 *
 * Usage: node data/seed-todos.js
 */

const fs = require('fs');
const path = require('path');

const programsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'programs.json'), 'utf-8'));
const prereqMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'prereq-map.json'), 'utf-8'));
const programs = programsData.programs;

// Sort by rank, take top 10 with valid ranks
const ranked = programs
  .filter(p => p.scores && p.scores.rank != null)
  .sort((a, b) => a.scores.rank - b.scores.rank)
  .slice(0, 10);

console.log('Top 10 programs by rank:');
ranked.forEach(p => {
  console.log(`  #${p.scores.rank} ${p.name} (${p.id}) — deadline: ${p.admissions?.deadline}`);
});

const trackedIds = ranked.map(p => p.id);
const today = '2026-02-02';
let taskCounter = 0;

function nextId() {
  taskCounter++;
  return 'task-' + String(taskCounter).padStart(3, '0');
}

function subtractDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function formatDeadlineReason(program) {
  const deadline = program.admissions?.deadline;
  if (!deadline) return '';
  const d = new Date(deadline);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  return `${program.name} deadline ${month} ${day}`;
}

// Analyze each tracked program
const analysis = ranked.map(p => {
  const extras = (p.prerequisites?.extra || []);
  const extrasLower = extras.map(e => e.toLowerCase());
  const extrasJoined = extrasLower.join(' ');

  return {
    id: p.id,
    name: p.name,
    deadline: p.admissions?.deadline,
    verification: p.verification?.confidence,
    requiresTEAS: extrasLower.some(e => e.includes('teas')),
    requiresHESI: extrasLower.some(e => e.includes('hesi')),
    requiresBLS: extrasLower.some(e => e.includes('bls') || e.includes('basic life support') || e.includes('cpr')),
    requiresEssay: extrasLower.some(e => e.includes('essay') || e.includes('statement') || e.includes('personal')),
    extras: extras
  };
});

console.log('\nAnalysis:');
analysis.forEach(a => {
  console.log(`  ${a.name}: TEAS=${a.requiresTEAS}, HESI=${a.requiresHESI}, BLS=${a.requiresBLS}, Essay=${a.requiresEssay}, verification=${a.verification}`);
});

const tasks = [];

// ===== CROSS-PROGRAM TASKS =====

// 1. TEAS exam
const teasPrograms = analysis.filter(a => a.requiresTEAS);
if (teasPrograms.length > 0) {
  const deadlines = teasPrograms.filter(a => a.deadline).map(a => a.deadline).sort();
  const earliest = deadlines[0];
  const dueDate = earliest ? subtractDays(earliest, 30) : null;
  const drivingProgram = teasPrograms.find(a => a.deadline === earliest);

  tasks.push({
    id: nextId(),
    title: 'Take TEAS exam',
    category: 'exam',
    status: 'pending',
    due_date: dueDate,
    due_reason: drivingProgram ? formatDeadlineReason(ranked.find(p => p.id === drivingProgram.id)) : '',
    applies_to: teasPrograms.map(a => a.id),
    notes: 'Register at atitesting.com. Score valid 24 months.',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });
}

// 2. HESI exam
const hesiPrograms = analysis.filter(a => a.requiresHESI);
if (hesiPrograms.length > 0) {
  const deadlines = hesiPrograms.filter(a => a.deadline).map(a => a.deadline).sort();
  const earliest = deadlines[0];
  const dueDate = earliest ? subtractDays(earliest, 30) : null;
  const drivingProgram = hesiPrograms.find(a => a.deadline === earliest);

  tasks.push({
    id: nextId(),
    title: 'Take HESI A2 exam',
    category: 'exam',
    status: 'pending',
    due_date: dueDate,
    due_reason: drivingProgram ? formatDeadlineReason(ranked.find(p => p.id === drivingProgram.id)) : '',
    applies_to: hesiPrograms.map(a => a.id),
    notes: 'Register through your testing center. Check which version each school requires.',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });
}

// 3. Personal statement / essay
const essayPrograms = analysis.filter(a => a.requiresEssay);
if (essayPrograms.length > 0) {
  const deadlines = essayPrograms.filter(a => a.deadline).map(a => a.deadline).sort();
  const earliest = deadlines[0];
  const dueDate = earliest ? subtractDays(earliest, 14) : null;
  const drivingProgram = essayPrograms.find(a => a.deadline === earliest);

  tasks.push({
    id: nextId(),
    title: 'Write personal statement',
    category: 'document',
    status: 'pending',
    due_date: dueDate,
    due_reason: drivingProgram ? formatDeadlineReason(ranked.find(p => p.id === drivingProgram.id)) : '',
    applies_to: essayPrograms.map(a => a.id),
    notes: 'Most programs want: why nursing, career goals, relevant experience. Tailor for each school if needed.',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });
}

// 4. Transcripts - one per institution
const institutions = ['UW-Madison', 'WCTC', 'MATC'];
const allDeadlines = analysis.filter(a => a.deadline).map(a => a.deadline).sort();
const earliestDeadline = allDeadlines[0];

for (const inst of institutions) {
  const dueDate = earliestDeadline ? subtractDays(earliestDeadline, 21) : null;
  const drivingProgram = analysis.find(a => a.deadline === earliestDeadline);

  tasks.push({
    id: nextId(),
    title: `Request ${inst} transcripts`,
    category: 'document',
    status: 'pending',
    due_date: dueDate,
    due_reason: drivingProgram ? formatDeadlineReason(ranked.find(p => p.id === drivingProgram.id)) : '',
    applies_to: trackedIds, // all tracked programs need transcripts
    notes: '',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });
}

// 5. BLS certification
const blsPrograms = analysis.filter(a => a.requiresBLS);
if (blsPrograms.length > 0) {
  const deadlines = blsPrograms.filter(a => a.deadline).map(a => a.deadline).sort();
  const earliest = deadlines[0];
  const dueDate = earliest ? subtractDays(earliest, 30) : null;
  const drivingProgram = blsPrograms.find(a => a.deadline === earliest);

  tasks.push({
    id: nextId(),
    title: 'Complete BLS certification',
    category: 'verification',
    status: 'pending',
    due_date: dueDate,
    due_reason: drivingProgram ? formatDeadlineReason(ranked.find(p => p.id === drivingProgram.id)) : '',
    applies_to: blsPrograms.map(a => a.id),
    notes: 'American Heart Association BLS for Healthcare Providers. Valid 2 years.',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });
}

// ===== PER-PROGRAM TASKS =====

for (const a of analysis) {
  const program = ranked.find(p => p.id === a.id);

  // 6. Submit application
  tasks.push({
    id: nextId(),
    title: `Submit application — ${a.name}`,
    category: 'application',
    status: 'pending',
    due_date: a.deadline || null,
    due_reason: a.deadline ? `${a.name} deadline` : '',
    applies_to: [a.id],
    notes: '',
    auto_generated: true,
    created_at: today,
    completed_at: null
  });

  // 7. Verify requirements (only if not verified)
  if (a.verification !== 'verified') {
    const dueDate = a.deadline ? subtractDays(a.deadline, 45) : null;
    tasks.push({
      id: nextId(),
      title: `Verify ${a.name} requirements`,
      category: 'verification',
      status: 'pending',
      due_date: dueDate,
      due_reason: a.deadline ? `${a.name} deadline` : '',
      applies_to: [a.id],
      notes: `Confidence: ${a.verification || 'unknown'}. Check official website for current prereqs and deadlines.`,
      auto_generated: true,
      created_at: today,
      completed_at: null
    });
  }
}

// Build output
const output = {
  tracked_programs: trackedIds,
  tasks: tasks,
  settings: {
    transcript_lead_days: 21,
    default_view: 'timeline'
  }
};

// Write to file
const outPath = path.join(__dirname, 'my-todos.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`\nGenerated ${tasks.length} tasks for ${trackedIds.length} tracked programs`);
console.log(`Written to ${outPath}`);
