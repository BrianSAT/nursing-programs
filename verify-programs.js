#!/usr/bin/env node
/**
 * Verification Report Script
 *
 * Run this periodically to check for:
 * - Stale data (not verified in 30+ days)
 * - Unverified programs
 * - Programs with data issues
 * - Upcoming deadlines that need re-verification
 *
 * Usage: node verify-programs.js
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

const TODAY = new Date();
const STALE_DAYS = 30;

console.log('='.repeat(60));
console.log('PROGRAM VERIFICATION REPORT');
console.log('Generated:', TODAY.toISOString().split('T')[0]);
console.log('='.repeat(60));

// 1. Unverified programs
const unverified = data.programs.filter(p =>
  !p.verification?.confidence || p.verification.confidence === 'unverified'
);

console.log(`\n📋 UNVERIFIED PROGRAMS (${unverified.length}):`);
unverified
  .sort((a, b) => (a.scores?.rank || 999) - (b.scores?.rank || 999))
  .forEach(p => {
    console.log(`  #${p.scores?.rank || '?'} ${p.name}`);
  });

// 2. Needs verification (flagged but not yet verified)
const needsVerif = data.programs.filter(p =>
  p.verification?.confidence === 'needs_verification'
);

console.log(`\n⚠️  NEEDS VERIFICATION (${needsVerif.length}):`);
needsVerif
  .sort((a, b) => (a.scores?.rank || 999) - (b.scores?.rank || 999))
  .forEach(p => {
    const note = p.verification?.notes ? ` - ${p.verification.notes.substring(0, 50)}...` : '';
    console.log(`  #${p.scores?.rank || '?'} ${p.name}${note}`);
  });

// 3. Stale verifications (verified but >30 days ago)
const stale = data.programs.filter(p => {
  if (!p.verification?.last_verified) return false;
  const verifiedDate = new Date(p.verification.last_verified);
  const daysSince = (TODAY - verifiedDate) / (1000 * 60 * 60 * 24);
  return daysSince > STALE_DAYS;
});

console.log(`\n🕐 STALE VERIFICATIONS (>${STALE_DAYS} days old) (${stale.length}):`);
stale.forEach(p => {
  console.log(`  ${p.name} - last verified: ${p.verification.last_verified}`);
});

// 4. Verified programs
const verified = data.programs.filter(p =>
  p.verification?.confidence === 'verified'
);

console.log(`\n✅ VERIFIED (${verified.length}):`);
verified
  .sort((a, b) => (a.scores?.rank || 999) - (b.scores?.rank || 999))
  .slice(0, 10)
  .forEach(p => {
    console.log(`  #${p.scores?.rank || '?'} ${p.name}`);
  });
if (verified.length > 10) {
  console.log(`  ... and ${verified.length - 10} more`);
}

// 5. Programs with issues
const issues = data.programs.filter(p =>
  p.verification?.program_type_issue || p.verification?.program_ended
);

console.log(`\n🚨 PROGRAMS WITH ISSUES (${issues.length}):`);
issues.forEach(p => {
  const issue = p.verification.program_ended ? 'PROGRAM ENDED' :
                p.verification.program_type_issue;
  console.log(`  ${p.name}: ${issue}`);
});

// 6. Upcoming deadlines to verify
const upcomingDeadlines = data.programs.filter(p => {
  if (!p.admissions?.deadline) return false;
  const deadline = new Date(p.admissions.deadline);
  const daysUntil = (deadline - TODAY) / (1000 * 60 * 60 * 24);
  return daysUntil > 0 && daysUntil < 60;
}).sort((a, b) => new Date(a.admissions.deadline) - new Date(b.admissions.deadline));

console.log(`\n📅 UPCOMING DEADLINES (<60 days) - verify these soon (${upcomingDeadlines.length}):`);
upcomingDeadlines.forEach(p => {
  const deadline = new Date(p.admissions.deadline);
  const daysUntil = Math.round((deadline - TODAY) / (1000 * 60 * 60 * 24));
  const status = p.verification?.confidence === 'verified' ? '✓' : '?';
  console.log(`  ${status} ${p.admissions.deadline} (${daysUntil}d) - ${p.name}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total programs: ${data.programs.length}`);
console.log(`Verified: ${verified.length} (${Math.round(verified.length/data.programs.length*100)}%)`);
console.log(`Needs verification: ${needsVerif.length}`);
console.log(`Unverified: ${unverified.length}`);
console.log(`Stale (>${STALE_DAYS}d): ${stale.length}`);
console.log(`Programs with issues: ${issues.length}`);
