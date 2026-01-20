/**
 * Update programs with multiple start dates and pick closest to Jan 2027
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Programs with multiple start dates per year
const multipleStarts = {
  'samuel-merritt': {
    start_dates: ['2027-01-15', '2027-05-15', '2026-08-15'],
    notes: 'Fall, Spring, and Summer starts available'
  },
  'johns-hopkins': {
    start_dates: ['2027-01-15', '2026-08-01'],
    notes: 'Fall and Spring cohorts available'
  },
  'vanderbilt-mn': {
    start_dates: ['2027-01-15', '2026-08-01'],
    notes: 'January and August starts'
  },
  'uwm': {
    start_dates: ['2027-01-15', '2026-08-01'],
    notes: 'Fall and Spring starts available'
  },
  'alverno': {
    start_dates: ['2027-01-15', '2026-08-01'],
    notes: 'January and August starts at Milwaukee and Mesa'
  },
  'research-college': {
    start_dates: ['2027-01-15', '2026-05-15'],
    notes: 'January and May starts'
  },
  'musc': {
    start_dates: ['2027-01-04', '2026-08-24'],
    notes: 'Spring and Fall cohorts available'
  },
  // Programs with only one start per year (keeping for reference)
  'baylor': {
    start_dates: ['2027-05-01'],  // May only
    notes: 'FastBacc starts May only; would need to wait for May 2027'
  },
  'columbia': {
    start_dates: ['2027-06-01'],  // June only
    notes: 'Summer (June) start only'
  },
  'yale': {
    start_dates: ['2027-08-26'],  // Fall only, would need Fall 2027
    notes: 'Fall only; next available is Fall 2027'
  },
  'u-kentucky': {
    start_dates: ['2027-08-01'],  // Fall only
    notes: 'Fall only; next available is Fall 2027'
  },
  'ucla-mecn': {
    start_dates: ['2027-09-24'],  // Fall only
    notes: 'Fall only; next available is Fall 2027'
  },
  'penn': {
    start_dates: ['2027-05-15'],  // Summer only
    notes: 'Summer (May) start only'
  },
  'wsu-spokane': {
    start_dates: ['2027-08-15'],  // Fall only
    notes: 'Fall only'
  }
};

const JAN_2027 = new Date('2027-01-15');

function getClosestDate(dates) {
  if (!dates || dates.length === 0) return null;

  let closest = dates[0];
  let minDiff = Math.abs(new Date(dates[0]) - JAN_2027);

  for (const dateStr of dates) {
    const diff = Math.abs(new Date(dateStr) - JAN_2027);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dateStr;
    }
  }

  return closest;
}

// Update programs
let updated = 0;
data.programs.forEach(program => {
  const update = multipleStarts[program.id];
  if (update) {
    // Store all start dates
    program.admissions.start_dates = update.start_dates;
    program.admissions.start_date_notes = update.notes;

    // Set primary start_date to closest to Jan 2027
    const closest = getClosestDate(update.start_dates);
    const oldDate = program.admissions.start_date;
    program.admissions.start_date = closest;

    console.log(`${program.name}: ${oldDate} -> ${closest} (from ${update.start_dates.join(', ')})`);
    updated++;
  }
});

// Recalculate start_score for all programs based on updated dates
data.programs.forEach(program => {
  const startDate = program.admissions?.start_date;
  if (!startDate) return;

  const start = new Date(startDate);
  const monthsDiff = (start - JAN_2027) / (1000 * 60 * 60 * 24 * 30);

  // Score based on distance from Jan 2027
  // Perfect = Jan 2027, penalties for earlier or later
  let startScore = 1.0;
  const absDiff = Math.abs(monthsDiff);

  if (absDiff <= 1) {
    startScore = 1.0;  // Within 1 month of Jan 2027
  } else if (absDiff <= 3) {
    startScore = 0.9;  // 1-3 months off
  } else if (absDiff <= 6) {
    startScore = 0.8;  // 3-6 months off
  } else if (absDiff <= 9) {
    startScore = 0.6;  // 6-9 months off
  } else {
    startScore = 0.4;  // 9+ months off
  }

  program.scores.start_score = startScore;
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`\nUpdated ${updated} programs with multiple start dates`);
console.log('Recalculated start_score for all programs');
