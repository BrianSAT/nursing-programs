/**
 * Update programs with NP pathway type information
 * - pre_specialty: Integrated NP specialty track (declare specialty during program)
 * - cnl: Results in Clinical Nurse Leader certification
 * - standard: Traditional pathway (apply separately for NP later)
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'programs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Programs with pre-specialty tracks (integrated NP pathway)
const PRE_SPECIALTY_PROGRAMS = {
  'emory': {
    np_pathway_type: 'pre_specialty',
    np_pathway_notes: 'DABSN leads directly to NP specialization tracks'
  },
  'vanderbilt-mn': {
    np_pathway_type: 'pre_specialty',
    np_pathway_notes: 'MN Prespecialty track - declare NP specialty during program'
  },
  'yale': {
    np_pathway_type: 'pre_specialty',
    np_pathway_notes: 'GEPN (Graduate Entry Pre-Specialty Nursing) - 3yr program with integrated specialty'
  },
  'columbia': {
    np_pathway_type: 'pre_specialty',
    np_pathway_notes: 'Direct Entry MS allows specialty declaration; seamless to DNP'
  },
  'duke': {
    np_pathway_type: 'pre_specialty',
    np_pathway_notes: 'MN program with integrated specialty tracks'
  }
};

// Programs resulting in CNL certification
const CNL_PROGRAMS = {
  'rush': {
    np_pathway_type: 'cnl',
    np_pathway_notes: 'GEM results in MSN + Clinical Nurse Leader (CNL) certification. CNL focus is care coordination/systems leadership, not direct clinical NP path.'
  }
};

// Update each program
data.programs.forEach(p => {
  if (!p.program_details) p.program_details = {};

  if (PRE_SPECIALTY_PROGRAMS[p.id]) {
    const update = PRE_SPECIALTY_PROGRAMS[p.id];
    p.program_details.np_pathway_type = update.np_pathway_type;
    p.program_details.np_pathway_notes = update.np_pathway_notes;
    console.log(`${p.name}: marked as pre_specialty`);
  } else if (CNL_PROGRAMS[p.id]) {
    const update = CNL_PROGRAMS[p.id];
    p.program_details.np_pathway_type = update.np_pathway_type;
    p.program_details.np_pathway_notes = update.np_pathway_notes;
    console.log(`${p.name}: marked as cnl`);
  } else {
    p.program_details.np_pathway_type = 'standard';
    p.program_details.np_pathway_notes = null;
  }
});

// Save
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\n--- Summary ---');
console.log('Pre-specialty programs:', Object.keys(PRE_SPECIALTY_PROGRAMS).length);
console.log('CNL programs:', Object.keys(CNL_PROGRAMS).length);
console.log('Standard programs:', data.programs.length - Object.keys(PRE_SPECIALTY_PROGRAMS).length - Object.keys(CNL_PROGRAMS).length);
