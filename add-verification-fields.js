/**
 * Add verification tracking fields to all programs
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

const TODAY = '2026-01-21';

// Programs we've manually verified during this session
const verifiedPrograms = [
  'duquesne-pittsburgh'  // Just verified - Fall only start
];

data.programs.forEach(program => {
  // Initialize verification object if not exists
  program.verification = program.verification || {};

  if (verifiedPrograms.includes(program.id)) {
    program.verification = {
      last_verified: TODAY,
      confidence: 'verified',
      sources: {},
      notes: 'Manually verified'
    };
  } else {
    // Mark all others as needing verification, prioritized by rank
    const rank = program.scores?.rank || 999;
    let confidence = 'unverified';

    // Top 20 programs are high priority
    if (rank <= 20) {
      confidence = 'needs_verification';
      program.verification.priority = 'high';
    } else if (rank <= 40) {
      confidence = 'needs_verification';
      program.verification.priority = 'medium';
    } else {
      confidence = 'unverified';
      program.verification.priority = 'low';
    }

    program.verification = {
      ...program.verification,
      last_verified: null,
      confidence: confidence,
      sources: {},
      notes: null
    };
  }
});

fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

// Summary
const verified = data.programs.filter(p => p.verification?.confidence === 'verified').length;
const needsVerif = data.programs.filter(p => p.verification?.confidence === 'needs_verification').length;
const unverified = data.programs.filter(p => p.verification?.confidence === 'unverified').length;

console.log('=== Verification Fields Added ===');
console.log(`Verified: ${verified}`);
console.log(`Needs Verification: ${needsVerif}`);
console.log(`Unverified: ${unverified}`);
console.log(`Total: ${data.programs.length}`);

console.log('\n=== High Priority (Top 20) ===');
data.programs
  .filter(p => p.verification?.priority === 'high')
  .sort((a, b) => a.scores.rank - b.scores.rank)
  .forEach(p => console.log(`  #${p.scores.rank} ${p.name}`));
