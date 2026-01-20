/**
 * Update programs with online A&P lab acceptance policies
 *
 * Values:
 * - true: Explicitly accepts online/virtual A&P labs
 * - false: Explicitly requires in-person labs
 * - null/undefined: Policy unclear, should verify with school
 */

const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(programsPath, 'utf8'));

// Online A&P lab policies based on research
const onlineLabPolicies = {
  // EXPLICIT YES - accepts online/virtual labs
  'johns-hopkins': { accepts: true, notes: 'Explicit policy: virtual labs accepted' },
  'vanderbilt-mn': { accepts: true, notes: 'Labs "preferred but not required"' },
  'gcu': { accepts: true, notes: 'Offers own online A&P with labs' },
  'creighton': { accepts: true, notes: 'Courses can be taken online or in person' },

  // EXPLICIT NO - requires in-person labs
  'northeastern': { accepts: false, notes: 'Explicit policy: labs cannot be online' },

  // CONDITIONAL - case by case, generally flexible
  'duke': { accepts: 'conditional', notes: 'Online courses accepted; verify virtual labs' },
  'georgetown-dc': { accepts: 'conditional', notes: 'Accepts Portage; case-by-case review' },
  'depaul': { accepts: 'conditional', notes: 'Max 2 online courses recommended' },
  'u-cincinnati': { accepts: 'conditional', notes: 'Case-by-case; Portage no longer accepted 2024+' },

  // UNCLEAR - must verify with school (defaulting to needing verification)
  'penn': { accepts: null, notes: 'Labs required; verify online lab policy' },
  'notre-dame-md': { accepts: null, notes: 'Contact admissions to verify' },
  'marquette-gem': { accepts: null, notes: 'Contact admissions to verify' },
  'emory': { accepts: null, notes: 'Contact admissions to verify' },
  'pitt': { accepts: null, notes: 'Contact absn@pitt.edu to verify' },
  'uw-madison': { accepts: null, notes: 'Use course evaluation form to verify' },
  'utk': { accepts: null, notes: 'Contact nursing@utk.edu to verify' },
  'musc': { accepts: null, notes: 'Contact admissions to verify' },
  'uthealth-houston': { accepts: null, notes: 'Contact admissions to verify' },
  'regis': { accepts: null, notes: 'Contact healthcare@regis.edu to verify' },
  'samuel-merritt': { accepts: null, notes: 'Use articulation tool; contact admissions' },
};

// Update programs
let updated = 0;
data.programs.forEach(program => {
  const policy = onlineLabPolicies[program.id];
  if (policy) {
    program.prerequisites = program.prerequisites || {};
    program.prerequisites.online_ap_labs = policy.accepts;
    program.prerequisites.online_lab_notes = policy.notes;
    console.log(`${program.name}: online_ap_labs = ${policy.accepts} (${policy.notes})`);
    updated++;
  }
});

// Write updated data
fs.writeFileSync(programsPath, JSON.stringify(data, null, 2));

console.log(`\nUpdated ${updated} programs with online lab policies`);
