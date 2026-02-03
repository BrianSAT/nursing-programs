const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/research-queue.json');

function loadQueue() {
  if (!fs.existsSync(DATA_FILE)) {
    return { pending: [], completed: [] };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveQueue(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET full queue
router.get('/', (req, res) => {
  const data = loadQueue();
  res.json(data);
});

// POST add a program to pending (idempotent: skips if already queued)
router.post('/', (req, res) => {
  const data = loadQueue();
  const item = req.body;

  if (!item.program_id || !item.program_name) {
    return res.status(400).json({ error: 'program_id and program_name are required' });
  }

  // Skip if already in pending
  if (data.pending.some(p => p.program_id === item.program_id)) {
    return res.json({ status: 'already_queued', program_id: item.program_id });
  }

  const entry = {
    program_id: item.program_id,
    program_name: item.program_name,
    queued_at: new Date().toISOString().split('T')[0],
    reason: item.reason || 'No application_requirements data',
    fields_needed: item.fields_needed || ['fee', 'system', 'essays', 'references', 'exam', 'certifications', 'resume', 'background_check', 'interview', 'deposit', 'unique']
  };

  data.pending.push(entry);
  saveQueue(data);
  res.status(201).json(entry);
});

// DELETE move a program from pending to completed
router.delete('/:programId', (req, res) => {
  const data = loadQueue();
  const programId = req.params.programId;
  const index = data.pending.findIndex(p => p.program_id === programId);

  if (index === -1) {
    return res.status(404).json({ error: 'Program not found in pending queue' });
  }

  const item = data.pending.splice(index, 1)[0];
  item.researched_at = new Date().toISOString().split('T')[0];
  data.completed.push(item);

  saveQueue(data);
  res.json({ status: 'completed', item });
});

module.exports = router;
