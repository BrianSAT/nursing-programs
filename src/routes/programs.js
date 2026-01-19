const express = require('express');
const fs = require('fs');
const path = require('path');
const { calculateScores } = require('../utils/scoring');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/programs.json');

// Load programs from JSON file
function loadPrograms() {
  if (!fs.existsSync(DATA_FILE)) {
    return { metadata: {}, programs: [] };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save programs to JSON file
function savePrograms(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all programs with calculated scores
router.get('/', (req, res) => {
  const data = loadPrograms();
  const programsWithScores = data.programs.map(program => ({
    ...program,
    calculated: calculateScores(program, data.metadata)
  }));
  res.json({ metadata: data.metadata, programs: programsWithScores });
});

// GET single program by ID
router.get('/:id', (req, res) => {
  const data = loadPrograms();
  const program = data.programs.find(p => p.id === req.params.id);
  if (!program) {
    return res.status(404).json({ error: 'Program not found' });
  }
  res.json({
    ...program,
    calculated: calculateScores(program, data.metadata)
  });
});

// POST new program
router.post('/', (req, res) => {
  const data = loadPrograms();
  const newProgram = req.body;

  if (data.programs.some(p => p.id === newProgram.id)) {
    return res.status(400).json({ error: 'Program with this ID already exists' });
  }

  data.programs.push(newProgram);
  savePrograms(data);
  res.status(201).json(newProgram);
});

// PUT update program
router.put('/:id', (req, res) => {
  const data = loadPrograms();
  const index = data.programs.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Program not found' });
  }

  data.programs[index] = { ...data.programs[index], ...req.body };
  savePrograms(data);
  res.json(data.programs[index]);
});

// DELETE program
router.delete('/:id', (req, res) => {
  const data = loadPrograms();
  const index = data.programs.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Program not found' });
  }

  data.programs.splice(index, 1);
  savePrograms(data);
  res.status(204).send();
});

module.exports = router;
