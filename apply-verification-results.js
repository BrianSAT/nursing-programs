/**
 * Apply verification results from research agents
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

const TODAY = '2026-01-21';

// Verification results from research
const verificationUpdates = {
  'isu-boise': {
    verified: true,
    start_date: '2026-05-15',  // Summer only (May)
    start_dates: ['2026-05-15'],
    start_date_notes: 'Summer start only (May each year)',
    deadline: '2026-02-15',
    source: 'https://www.isu.edu/acceleratednursing/',
    notes: 'Verified Jan 2026. Applications Nov 15-Feb 15. TEAS required.'
  },
  'emory': {
    verified: false,
    notes: 'CONFLICTING INFO - DABSN page says not accepting applications, but deadlines still listed. Contact nursingquestions@emory.edu to verify.',
    source: 'https://www.nursing.emory.edu/program-details/distance-accelerated-bsn'
  },
  'slu-stlouis': {
    verified: true,
    start_date: '2026-05-15',  // May only
    start_dates: ['2026-05-15'],
    start_date_notes: 'May start only (once per year)',
    deadline: null,  // Rolling admissions
    deadline_notes: 'Rolling admissions - no fixed deadline. Review begins August, decisions January.',
    source: 'https://www.slu.edu/nursing/degrees/undergraduate/nursing-bs-accelerated.php',
    notes: 'Verified Jan 2026. Rolling admissions until cohort full.'
  },
  'uthealth-houston': {
    verified: true,
    start_date: '2026-08-15',  // Fall 2026
    start_dates: ['2026-08-15', '2027-01-15', '2027-05-15'],
    start_date_notes: 'Fall, Spring, and Summer starts available',
    deadline: '2026-03-30',  // Fall 2026 deadline
    source: 'https://nursing.uth.edu/programs/application-deadlines',
    notes: 'Verified Jan 2026. FREE tuition available via Future Nurses Fund for qualifying students.'
  },
  'csu-cleveland': {
    verified: true,
    start_date: '2027-01-15',  // January for in-person
    start_dates: ['2027-01-15'],
    start_date_notes: 'In-person: January only. Online track: Fall and Spring.',
    deadline: '2026-06-01',
    source: 'https://health.csuohio.edu/undergraduate-programs/accelerated-bsn-program',
    notes: 'Verified Jan 2026. 16-month program.'
  },
  'buffalo-absn': {
    verified: true,
    start_date: '2026-05-15',  // Summer only
    start_dates: ['2026-05-15'],
    start_date_notes: 'Summer start only (once per year in May)',
    deadline: '2025-10-01',  // Already passed!
    source: 'https://nursing.buffalo.edu/academic-programs/undergraduate-programs/abs/',
    notes: 'Verified Jan 2026. DEADLINE PASSED for Summer 2026.'
  },
  'christ-college-dayton': {
    verified: false,
    notes: 'DATA GAP - Start dates and deadlines not publicly listed on website. Contact admissions: 513-585-2401',
    source: 'https://thechristcollege.edu/accelerated-nursing/'
  },
  'ohsu-portland': {
    verified: true,
    start_date: '2026-06-15',  // Summer 2026
    start_dates: ['2026-06-15', '2026-09-15', '2027-01-15'],
    start_date_notes: 'Portland: Summer, Fall, Winter. Ashland/Bend: Summer only.',
    deadline: '2026-01-05',  // Priority deadline
    source: 'https://www.ohsu.edu/school-of-nursing/admissions',
    notes: 'Verified Jan 2026. Priority deadline Jan 5.'
  },
  'research-college-kc': {
    verified: true,
    start_date: '2026-05-15',  // May 2026
    start_dates: ['2027-01-15', '2026-05-15'],
    start_date_notes: 'January and May starts (May is NEW)',
    deadline: '2026-04-01',
    source: 'https://researchcollege.edu/admission/',
    notes: 'Verified Jan 2026. HCA Work Loan Forgiveness covers ~75% tuition.'
  },
  'loyola-chicago': {
    verified: true,
    start_date: '2026-08-15',  // August
    start_dates: ['2026-01-15', '2026-08-15'],
    start_date_notes: 'January and August starts',
    deadline: null,
    deadline_notes: 'Rolling admissions - no fixed deadline',
    source: 'https://www.luc.edu/nursing/admission/apply/absn/',
    notes: 'Verified Jan 2026. Hybrid or fully on-campus options.'
  },
  'spu-seattle': {
    verified: true,
    notes: 'NOT AN ABSN PROGRAM - Post-baccalaureate BSN is 6 quarters (2 years), not accelerated.',
    source: 'https://spu.edu/academics/school-of-health-sciences/undergraduate-programs/',
    program_type_correction: 'not_absn'
  },
  'duke': {
    verified: true,
    notes: 'ABSN PROGRAM ENDED - Final cohort graduates Spring 2026. Replaced by Master of Nursing (MN).',
    source: 'https://nursing.duke.edu/academic-programs',
    program_ended: true
  },
  'ohio-state': {
    verified: true,
    start_date: '2026-05-15',  // Summer only
    start_dates: ['2026-05-15'],
    start_date_notes: 'Summer start only (once per year)',
    deadline: '2026-01-09',
    source: 'https://nursing.osu.edu/academics/undergraduate/accelerated-bachelor-science-nursing/',
    notes: 'Verified Jan 2026. 18-month hybrid program.'
  },
  'uab-birmingham': {
    verified: true,
    notes: 'NOT AN ABSN - UAB offers AMNP (Accelerated Masters in Nursing Pathway) awarding MSN, not BSN.',
    source: 'https://www.uab.edu/nursing/home/academics/masters/amnp',
    program_type_correction: 'msn_entry'
  },
  'memphis-absn': {
    verified: true,
    start_date: '2026-08-15',  // Fall only
    start_dates: ['2026-08-15'],
    start_date_notes: 'Fall start only (once per year)',
    deadline: '2026-02-15',
    source: 'https://www.memphis.edu/nursing/program-admit/accelerated-bsn/',
    notes: 'Verified Jan 2026. 16-18 month program.'
  },
  'carlow-pittsburgh': {
    verified: true,
    start_date: '2026-08-15',  // Fall only
    start_dates: ['2026-08-15'],
    start_date_notes: 'Fall start only',
    deadline: null,
    deadline_notes: 'Rolling admissions',
    source: 'https://www.carlow.edu/academic-programs/nursing-degrees/nursing-major-second-degree/',
    notes: 'Verified Jan 2026. 15-month program.'
  },
  'unm-albuquerque': {
    verified: true,
    start_date: '2026-08-15',  // Fall only
    start_dates: ['2026-08-15'],
    start_date_notes: 'Fall start only (4 consecutive terms)',
    deadline: '2026-03-15',
    source: 'https://hsc.unm.edu/nursing/admissions/',
    notes: 'Verified Jan 2026. Application window Nov 1 - Mar 15.'
  },
  'uw-madison': {
    verified: true,
    start_date: '2027-05-15',  // May only - 2026 deadline passed!
    start_dates: ['2027-05-15'],
    start_date_notes: 'May start only. May 2026 CLOSED, next is May 2027.',
    deadline: '2026-09-15',  // For May 2027
    source: 'https://nursing.wisc.edu/apply-absn/',
    notes: 'Verified Jan 2026. May 2026 deadline PASSED (was Sep 15, 2025).'
  },
  'stedwards-austin': {
    verified: true,
    start_date: '2026-08-15',  // Fall only
    start_dates: ['2026-08-15'],
    start_date_notes: 'Fall start only',
    deadline: '2025-12-31',  // Already passed!
    source: 'https://www.stedwards.edu/academics/programs/nursing-accelerated-bsn',
    notes: 'Verified Jan 2026. DEADLINE PASSED for Fall 2026.'
  },
  'loyola-nola': {
    verified: true,
    start_date: '2026-01-15',  // Spring primarily
    start_dates: ['2026-01-15'],
    start_date_notes: 'Spring (January) start - primary cohort',
    deadline: '2025-11-01',  // Already passed!
    source: 'https://www.loyno.edu/academics/colleges/college-nursing-health/accelerated-bachelor-science-nursing-hybrid',
    notes: 'Verified Jan 2026. 17-month hybrid program.'
  }
};

// Apply updates
let updatedCount = 0;
let corrections = [];

data.programs.forEach(program => {
  const update = verificationUpdates[program.id];
  if (!update) return;

  // Update verification fields
  program.verification = program.verification || {};
  program.verification.last_verified = TODAY;
  program.verification.confidence = update.verified ? 'verified' : 'needs_verification';
  program.verification.sources = program.verification.sources || {};
  if (update.source) {
    program.verification.sources.primary = update.source;
  }
  if (update.notes) {
    program.verification.notes = update.notes;
  }

  // Update admissions data if verified
  if (update.verified && update.start_date) {
    const oldStart = program.admissions?.start_date;
    program.admissions.start_date = update.start_date;
    if (oldStart !== update.start_date) {
      corrections.push(`${program.name}: start_date ${oldStart} -> ${update.start_date}`);
    }
  }
  if (update.start_dates) {
    program.admissions.start_dates = update.start_dates;
  }
  if (update.start_date_notes) {
    program.admissions.start_date_notes = update.start_date_notes;
  }
  if (update.deadline !== undefined) {
    const oldDeadline = program.admissions?.deadline;
    program.admissions.deadline = update.deadline;
    if (oldDeadline !== update.deadline) {
      corrections.push(`${program.name}: deadline ${oldDeadline} -> ${update.deadline}`);
    }
  }
  if (update.deadline_notes) {
    program.admissions.deadline_notes = update.deadline_notes;
  }

  // Flag program type corrections
  if (update.program_type_correction) {
    program.verification.program_type_issue = update.program_type_correction;
    corrections.push(`${program.name}: PROGRAM TYPE ISSUE - ${update.program_type_correction}`);
  }
  if (update.program_ended) {
    program.verification.program_ended = true;
    corrections.push(`${program.name}: PROGRAM ENDED`);
  }

  updatedCount++;
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log('=== Verification Results Applied ===');
console.log(`Updated ${updatedCount} programs\n`);

console.log('=== Key Corrections ===');
corrections.forEach(c => console.log('  ' + c));

console.log('\n=== Programs Needing Attention ===');
data.programs
  .filter(p => p.verification?.program_type_issue || p.verification?.program_ended)
  .forEach(p => console.log(`  ${p.name}: ${p.verification.notes}`));
