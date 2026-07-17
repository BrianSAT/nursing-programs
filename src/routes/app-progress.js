const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/app-progress.json');

function loadProgress() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveProgress(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all progress: { programId: { stepKey: true, ... }, ... }
router.get('/', (req, res) => {
  res.json(loadProgress());
});

// PUT /:programId — body { step: string, done: boolean }
router.put('/:programId', (req, res) => {
  const { step, done } = req.body;
  if (!step || typeof done !== 'boolean') {
    return res.status(400).json({ error: 'step (string) and done (boolean) are required' });
  }
  const data = loadProgress();
  if (!data[req.params.programId]) data[req.params.programId] = {};
  if (done) {
    data[req.params.programId][step] = true;
  } else {
    delete data[req.params.programId][step];
    if (Object.keys(data[req.params.programId]).length === 0) delete data[req.params.programId];
  }
  saveProgress(data);
  res.json({ programId: req.params.programId, step, done });
});

module.exports = router;
