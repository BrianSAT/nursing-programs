const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/my-todos.json');

function loadTodos() {
  if (!fs.existsSync(DATA_FILE)) {
    return { tracked_programs: [], tasks: [], settings: {} };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveTodos(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all todo data
router.get('/', (req, res) => {
  const data = loadTodos();
  res.json(data);
});

// POST create a new task
router.post('/tasks', (req, res) => {
  const data = loadTodos();
  const task = req.body;

  if (!task.id || !task.title) {
    return res.status(400).json({ error: 'Task must have id and title' });
  }

  // Check for duplicate ID
  if (data.tasks.some(t => t.id === task.id)) {
    return res.status(400).json({ error: 'Task with this ID already exists' });
  }

  // Set defaults
  task.status = task.status || 'pending';
  task.category = task.category || 'custom';
  task.applies_to = task.applies_to || [];
  task.auto_generated = false;
  task.created_at = task.created_at || new Date().toISOString().split('T')[0];
  task.completed_at = null;

  data.tasks.push(task);
  saveTodos(data);
  res.status(201).json(task);
});

// PUT update a task by ID
router.put('/tasks/:id', (req, res) => {
  const data = loadTodos();
  const id = req.params.id;
  const index = data.tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates = req.body;

  // Track completion
  if (updates.status === 'done' && data.tasks[index].status !== 'done') {
    updates.completed_at = new Date().toISOString().split('T')[0];
  } else if (updates.status && updates.status !== 'done') {
    updates.completed_at = null;
  }

  data.tasks[index] = { ...data.tasks[index], ...updates };
  saveTodos(data);
  res.json(data.tasks[index]);
});

// DELETE remove a task by ID
router.delete('/tasks/:id', (req, res) => {
  const data = loadTodos();
  const id = req.params.id;
  const index = data.tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  data.tasks.splice(index, 1);
  saveTodos(data);
  res.status(204).send();
});

module.exports = router;
