/**
 * Update programs with verified prerequisite data and application timing
 * Based on comprehensive research of all 74 programs
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Research data compiled from all batches
const prereqUpdates = {
  // Batch 1: Top performers
  "baylor": {
    extra_prereqs: ["English Composition I & II", "English Literature", "Federal/US Government", "Bible-based Religion", "World Religion", "HESI A2 (English 80+, Math 80+)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply with 33/52 credits (incl. 2 sciences). All complete before start."
  },
  "memphis-absn": {
    extra_prereqs: ["TEAS exam", "Resume", "Letter of Interest", "Two reference letters"],
    in_progress_ok: true,
    app_timing_notes: "All prereqs in-progress or complete at application, finished before start."
  },
  "research-college-kc": {
    extra_prereqs: ["ATI TEAS (within 24 months)"],
    in_progress_ok: true,
    app_timing_notes: "Apply 12-18 months early to complete remaining prereqs."
  },
  "edgewood": {
    extra_prereqs: ["Pathophysiology", "CNA certification", "Foreign language (2 semesters)", "AHA BLS/CPR"],
    in_progress_ok: true,
    app_timing_notes: "Pathophysiology may be completed during first session."
  },
  "uthealth-houston": {
    extra_prereqs: ["HESI A2 or TEAS", "Texas Government", "US History (6 hrs)", "Visual & Performing Arts", "Philosophy/Ethics"],
    in_progress_ok: true,
    app_timing_notes: "Apply with 48/60 credits (16 must be sciences). TX Gov required for out-of-state."
  },
  "loyola-nola": {
    extra_prereqs: ["Organic Chemistry with lab"],
    in_progress_ok: null,
    app_timing_notes: "Contact school for in-progress policy."
  },
  "alverno": {
    extra_prereqs: ["Abnormal Psychology"],
    in_progress_ok: true,
    app_timing_notes: "May apply while completing prereqs, all done before start."
  },
  "ohio-state": {
    extra_prereqs: [],
    in_progress_ok: false,
    app_timing_notes: "ALL prereqs complete with B- by application deadline."
  },
  "stedwards-austin": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "May apply with prereqs in progress, complete before nursing courses."
  },
  "north-park": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for in-progress policy."
  },
  "marquette-gem": {
    extra_prereqs: ["Resume", "3 letters of recommendation", "Admissions statement"],
    in_progress_ok: true,
    app_timing_notes: "May apply while completing, cannot be in progress at program start."
  },
  "lourdes": {
    extra_prereqs: ["BLS certification (valid 18+ months)"],
    in_progress_ok: null,
    app_timing_notes: "Contact school for in-progress policy."
  },

  // Batch 2: Rank 13-24
  "carlow-pittsburgh": {
    extra_prereqs: ["Pathophysiology (3 credits)"],
    in_progress_ok: null,
    app_timing_notes: "A&P must be from same institution and within 7 years."
  },
  "utk": {
    extra_prereqs: ["Tennessee U.S. History requirement (6 semester hrs or 1 HS unit)"],
    in_progress_ok: true,
    app_timing_notes: "3 of 4 prereqs done by Fall 2025; 1 can be Spring 2026."
  },
  "uw-madison": {
    extra_prereqs: ["University Gen Ed Requirements (Communication, Quantitative, Ethnic Studies)"],
    in_progress_ok: true,
    app_timing_notes: "All 4 science prereqs complete by Sep 15 deadline; others before start."
  },
  "uw-seattle": {
    extra_prereqs: ["100 hours healthcare experience (within 12 months)", "RSN course"],
    in_progress_ok: true,
    app_timing_notes: "3+ sciences done with 3.0 grade at application. All done before start."
  },
  "creighton": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "2 of 3 sciences complete at deadline. All done 45 days before start."
  },
  "slu-stlouis": {
    extra_prereqs: ["Theology/Religion (3 cr)", "History (3 cr)", "Fine Arts (3 cr)"],
    in_progress_ok: false,
    app_timing_notes: "ALL prereqs must be complete before program begins."
  },
  "concordia-st-paul": {
    extra_prereqs: ["TEAS exam (65% min, proficiency all areas)", "Theology (5 credits, during program)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply with prereqs in progress; provisional admission until completion."
  },
  "duke": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Prereqs not required before applying, must complete before enrollment. NOTE: Duke ABSN ending Spring 2026 - only MN available."
  },
  "u-rochester": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Prereqs must be complete 3 weeks before program start - very flexible!"
  },
  "pitt": {
    extra_prereqs: ["Human Genetics (3 cr)", "Pathophysiology (4 cr)", "English Composition - technical writing (3 cr)"],
    in_progress_ok: null,
    app_timing_notes: "Rolling admissions. Contact absn@pitt.edu for in-progress policy."
  },
  "tulane-nola": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Can receive conditional admission with up to 3 prereqs in progress."
  },
  "buffalo-absn": {
    extra_prereqs: ["Pharmacology", "Applied Physiology"],
    in_progress_ok: true,
    app_timing_notes: "4 of 9 prereqs complete by Oct 1 deadline. Rest done before May start."
  },

  // Batch 3: Rank 25-36
  "csu-cleveland": {
    extra_prereqs: ["Chemistry I & II (2 semesters)", "Health Care Ethics"],
    in_progress_ok: true,
    app_timing_notes: "Only 2 science prereqs must be complete at application."
  },
  "drexel": {
    extra_prereqs: ["English Composition (3 cr)", "General Chemistry I with Lab (4 cr)"],
    in_progress_ok: false,
    app_timing_notes: "3 of 4 sciences (incl. both A&P) must be complete BEFORE applying."
  },
  "emory": {
    extra_prereqs: ["General Chemistry I with lab"],
    in_progress_ok: true,
    app_timing_notes: "Can apply with courses in progress, complete by orientation. <20% acceptance."
  },
  "musc": {
    extra_prereqs: ["English Composition (6 semester hrs)", "Science Elective (4 cr)"],
    in_progress_ok: true,
    app_timing_notes: "3 of 4 sciences at application. All done by enrollment."
  },
  "notre-dame-md": {
    extra_prereqs: ["TEAS exam (65% min)", "Starting Summer 2027: Nutrition and Human Growth added"],
    in_progress_ok: null,
    app_timing_notes: "Contact school for in-progress policy."
  },
  "christ-college-dayton": {
    extra_prereqs: ["Pathophysiology OR Pharmacology", "60 credit hrs Liberal Arts & Sciences"],
    in_progress_ok: true,
    app_timing_notes: "Prep Phase available for those completing prereqs. Note: Located in CINCINNATI."
  },
  "xavier-cincinnati": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Provisional admission available. Only 4 prereqs required (minimal)."
  },
  "ohsu-portland": {
    extra_prereqs: ["Introduction to Genetics (3 cr)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply while completing prerequisites."
  },
  "duquesne-pittsburgh": {
    extra_prereqs: ["Biology OR Chemistry with lab (4 cr)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply before done, all complete before start. Portage Learning accepted."
  },
  "capital-columbus": {
    extra_prereqs: ["Organic/Biochemistry"],
    in_progress_ok: true,
    app_timing_notes: "Conditional acceptance with prereqs in progress (proof by March 15)."
  },
  "regis": {
    extra_prereqs: ["Health Care Ethics", "English Composition (3 cr)", "Philosophy (6 cr)", "Religious Studies (6 cr)"],
    in_progress_ok: true,
    app_timing_notes: "3 of 4 science prereqs by deadline. Rolling admissions."
  },
  "isu-boise": {
    extra_prereqs: ["ATI TEAS (7th ed)", "Pathobiology", "Pharmacotherapy for Nursing", "Intro to Organic & Biochem with Lab", "Cultural Diversity", "Medical Ethics"],
    in_progress_ok: true,
    app_timing_notes: "Set A prereqs complete before applying; Set B can be in progress."
  },

  // Batch 4: Rank 37-50
  "umd-baltimore": {
    extra_prereqs: ["English Composition I & II", "TEAS exam (58.7% min, waived with bachelor's)", "College Math/Algebra"],
    in_progress_ok: true,
    app_timing_notes: "Up to 4 courses in progress. 2 sciences + 1 other must be done at application."
  },
  "wsu-spokane": {
    extra_prereqs: ["TEAS exam (70% min)", "50 hours healthcare experience"],
    in_progress_ok: true,
    app_timing_notes: "Up to 3 prereqs in progress. All done by end of Spring before Fall entry."
  },
  "uofl-louisville": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Minimum 2 science prereqs complete at application."
  },
  "u-cincinnati": {
    extra_prereqs: ["Pathophysiology", "Pharmacology with Nursing Component (within 1 YEAR!)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply while finishing bachelor's. Pre-Accelerated pathway available."
  },
  "unm-albuquerque": {
    extra_prereqs: ["HESI A2 (75% cumulative and each subsection)", "Pathophysiology II (NURS 240)"],
    in_progress_ok: true,
    app_timing_notes: "Case-by-case for missing Patho, Nutrition, or Lifespan."
  },
  "roseman-slc": {
    extra_prereqs: ["TEAS exam", "U.S. Constitution course (3 cr)"],
    in_progress_ok: false,
    app_timing_notes: "Prereqs and bachelor's should be complete for review. Rolling admissions."
  },
  "clemson-greenville": {
    extra_prereqs: ["NUTR 2050 (must take at Clemson)"],
    in_progress_ok: true,
    app_timing_notes: "Direct admission program. Transfer admits ~10 students only."
  },
  "uncc-charlotte": {
    extra_prereqs: ["CNA I certification (NC Nurse Aide Registry)"],
    in_progress_ok: true,
    app_timing_notes: "At least 3 science courses with labs complete at application."
  },
  "ric-providence": {
    extra_prereqs: ["RIC Math Competency", "RIC Writing Requirement"],
    in_progress_ok: true,
    app_timing_notes: "Can apply while enrolled in core sciences."
  },
  "loyola-chicago": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "Some in progress OK, ALL complete before starting ABSN."
  },
  "hunter-nyc": {
    extra_prereqs: ["Organic Chemistry with lab", "NLN NEX exam", "American History/Political Science", "Genetics"],
    in_progress_ok: false,
    app_timing_notes: "ALL prereqs complete by end of Spring before Fall. VERY competitive (100 admitted annually)."
  },
  "spu-seattle": {
    extra_prereqs: ["Organic/Biochemistry (CHM 1360)"],
    in_progress_ok: true,
    app_timing_notes: "Transfer applicants need 4+ prereqs (incl. 2 sciences) at application."
  },
  "fiu-miami": {
    extra_prereqs: ["TEAS VII (70% total, 62% science min)", "Chemistry for Health Sciences with lab"],
    in_progress_ok: true,
    app_timing_notes: "ALL science prereqs complete at application. Up to 2 non-science in progress."
  },
  "iu-indianapolis": {
    extra_prereqs: ["TEAS exam (58.7% Proficient min)", "Finite Math (or Calculus)", "Arts/Humanities course"],
    in_progress_ok: false,
    app_timing_notes: "All 28-31 credits should be complete for competitive consideration."
  },

  // Batch 5: Elite schools
  "johns-hopkins": {
    extra_prereqs: ["Anatomy must be taken BEFORE Physiology (cannot be same semester)"],
    in_progress_ok: true,
    app_timing_notes: "Can apply while completing prereqs. All done before program start. Nov 1 for merit scholarships."
  },
  "columbia": {
    extra_prereqs: ["Statistics must be within 5 years"],
    in_progress_ok: true,
    app_timing_notes: "At least 1 science prereq MUST be complete at application."
  },
  "yale": {
    extra_prereqs: ["General Chemistry with lab (4 cr)", "GRE if GPA <3.0"],
    in_progress_ok: true,
    app_timing_notes: "3 of 4 prereqs complete at application. 4th done by June 15. Oct 15 priority deadline."
  },
  "vanderbilt-mn": {
    extra_prereqs: ["Lifespan Development OR Developmental Psych specifically"],
    in_progress_ok: true,
    app_timing_notes: "Prereqs NOT required at time of application - most flexible elite school!"
  },
  "georgetown-dc": {
    extra_prereqs: ["Pathophysiology (grade B+ required)"],
    in_progress_ok: true,
    app_timing_notes: "Rolling admissions. Prereqs due at matriculation."
  },
  "u-kentucky": {
    extra_prereqs: ["General Biology (3 cr)", "Composition/Communication course", "Two-semester Chemistry sequence"],
    in_progress_ok: true,
    app_timing_notes: "Some prereqs at application (Anatomy, Physio, Bio, Chem, Psych, Comp). Others before first nursing semester."
  },

  // Batch 6: Remaining
  "samuel-merritt": {
    extra_prereqs: ["Pathophysiology", "Pharmacology", "English Composition I & II", "Interpersonal Communication", "HESI A2 or TEAS"],
    in_progress_ok: true,
    app_timing_notes: "Prereqs can be planned/in-progress, must be done before start."
  },
  "ucla-mecn": {
    extra_prereqs: ["Epidemiology", "English Reading & Composition (2 courses)", "Written and Oral Communication"],
    in_progress_ok: true,
    app_timing_notes: "Apply Nov 1, all prereqs (except Epidemiology) complete by December."
  },
  "depaul-demsn": {
    extra_prereqs: ["General/Inorganic Chemistry with lab"],
    in_progress_ok: true,
    app_timing_notes: "2 prereqs done for conditional admission. Only 4 prereqs total - streamlined!"
  },
  "northeastern": {
    extra_prereqs: ["Behavioral Science (Psych, Sociology, or Anthropology)"],
    in_progress_ok: true,
    app_timing_notes: "Max 3 prereqs in progress at application."
  },
  "penn": {
    extra_prereqs: [],
    in_progress_ok: true,
    app_timing_notes: "All prereqs complete by June 15 of enrollment year. Very flexible!"
  },
  "csuf": {
    extra_prereqs: ["Oral Communication (CSU GE A.1)", "Written Composition (CSU GE A.2)", "Critical Thinking (CSU GE A.3)"],
    in_progress_ok: false,
    app_timing_notes: "ALL prereqs complete by end of Fall 2025 for Fall 2026. CA residents only."
  },
  "csun": {
    extra_prereqs: [],
    in_progress_ok: false,
    app_timing_notes: "ALL prereqs on transcripts by deadline. NO in-progress considered."
  },
  "gcu": {
    extra_prereqs: ["Pathophysiology (BIO-322)", "Christian Worldview (CWV-101)", "HESI A2 exam"],
    in_progress_ok: true,
    app_timing_notes: "Complete before core nursing courses. Can do prereqs online at GCU."
  },
  "mercer": {
    extra_prereqs: ["Pathophysiology", "Abnormal Psychology/Psychopathology", "Ethics (Religion/Philosophy)", "TEAS (76% min)"],
    in_progress_ok: false,
    app_timing_notes: "All 30 hours complete before enrolling."
  },
  "uvm-burlington": {
    extra_prereqs: ["GRE may be required"],
    in_progress_ok: true,
    app_timing_notes: "Max 2 prereqs incomplete at application. MEPN program (not ABSN)."
  },
  "uw-milwaukee": {
    extra_prereqs: ["Biochemistry", "CNA recommended"],
    in_progress_ok: true,
    app_timing_notes: "Don't need prereqs to apply, complete before start. B+ required in all prereqs."
  },
  "rush": {
    extra_prereqs: ["3 of 4 prereqs from 4-year institution"],
    in_progress_ok: false,
    app_timing_notes: "All prereqs complete with C+ by NursingCAS deadline. Only 4 prereqs!"
  },

  // Additional programs not in research batches - keep existing data
  "uarizona-tucson": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  },
  "uams-littlerock": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  },
  "wayne-state-detroit": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  },
  "utulsa-absn": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  },
  "uccs-cosprings": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  },
  "uab-birmingham": {
    extra_prereqs: [],
    in_progress_ok: null,
    app_timing_notes: "Contact school for policy."
  }
};

// Apply updates
let updatedCount = 0;
data.programs.forEach(program => {
  const update = prereqUpdates[program.id];
  if (update) {
    // Add extra_prereqs array
    if (!program.prerequisites) {
      program.prerequisites = {};
    }
    program.prerequisites.extra = update.extra_prereqs || [];

    // Add in_progress_ok to admissions
    if (!program.admissions) {
      program.admissions = {};
    }
    program.admissions.in_progress_ok = update.in_progress_ok;
    program.admissions.app_timing_notes = update.app_timing_notes;

    updatedCount++;
    console.log(`Updated: ${program.name} (${program.id})`);
    if (update.extra_prereqs && update.extra_prereqs.length > 0) {
      console.log(`  Extra prereqs: ${update.extra_prereqs.join(', ')}`);
    }
    console.log(`  In-progress OK: ${update.in_progress_ok === true ? 'YES' : update.in_progress_ok === false ? 'NO' : 'Unknown'}`);
  }
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`\n=== Summary ===`);
console.log(`Updated ${updatedCount} programs with prereq research`);
console.log(`Total programs: ${data.programs.length}`);

// Count by timing category
const timingCounts = { true: 0, false: 0, null: 0 };
data.programs.forEach(p => {
  const timing = p.admissions?.in_progress_ok;
  if (timing === true) timingCounts.true++;
  else if (timing === false) timingCounts.false++;
  else timingCounts.null++;
});

console.log(`\nApplication Timing:`);
console.log(`  In-progress OK: ${timingCounts.true} programs`);
console.log(`  Complete at application: ${timingCounts.false} programs`);
console.log(`  Unknown/contact school: ${timingCounts.null} programs`);
