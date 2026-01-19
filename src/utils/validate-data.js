/**
 * Validate program data against schema
 * Run with: npm run validate
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = path.join(__dirname, '../../data/schema.json');
const DATA_FILE = path.join(__dirname, '../../data/programs.json');

function validate() {
  console.log('Validating program data...\n');

  if (!fs.existsSync(DATA_FILE)) {
    console.log('No programs.json found. Skipping validation.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const errors = [];

  // Basic validation
  if (!data.programs || !Array.isArray(data.programs)) {
    errors.push('Root "programs" must be an array');
  } else {
    data.programs.forEach((program, index) => {
      if (!program.id) {
        errors.push(`Program at index ${index} missing required field: id`);
      }
      if (!program.name) {
        errors.push(`Program "${program.id || index}" missing required field: name`);
      }
      if (!program.type) {
        errors.push(`Program "${program.id || index}" missing required field: type`);
      }
      if (!program.location) {
        errors.push(`Program "${program.id || index}" missing required field: location`);
      }
    });
  }

  if (errors.length > 0) {
    console.log('Validation errors:');
    errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  } else {
    console.log(`Validated ${data.programs.length} programs successfully.`);
  }
}

validate();
