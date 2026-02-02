const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/my-courses.json');

function loadCourses() {
  if (!fs.existsSync(DATA_FILE)) {
    return { semesters: {}, courses: [], transcript: [] };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveCourses(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET all course data (semesters, courses, transcript)
router.get('/', (req, res) => {
  const data = loadCourses();
  res.json(data);
});

// POST add a new course
router.post('/', (req, res) => {
  const data = loadCourses();
  const newCourse = req.body;

  if (!newCourse.id || !newCourse.name) {
    return res.status(400).json({ error: 'Course must have id and name' });
  }

  // Check for duplicate ID in both courses and transcript
  const allIds = [...data.courses, ...data.transcript].map(c => c.id);
  if (allIds.includes(newCourse.id)) {
    return res.status(400).json({ error: 'Course with this ID already exists' });
  }

  data.courses.push(newCourse);
  saveCourses(data);
  res.status(201).json(newCourse);
});

// PUT update a course by ID
router.put('/:id', (req, res) => {
  const data = loadCourses();
  const id = req.params.id;

  let index = data.courses.findIndex(c => c.id === id);
  if (index !== -1) {
    data.courses[index] = { ...data.courses[index], ...req.body };
    saveCourses(data);
    return res.json(data.courses[index]);
  }

  // Also check transcript
  index = data.transcript.findIndex(c => c.id === id);
  if (index !== -1) {
    data.transcript[index] = { ...data.transcript[index], ...req.body };
    saveCourses(data);
    return res.json(data.transcript[index]);
  }

  res.status(404).json({ error: 'Course not found' });
});

// DELETE remove a course by ID
router.delete('/:id', (req, res) => {
  const data = loadCourses();
  const id = req.params.id;

  let index = data.courses.findIndex(c => c.id === id);
  if (index !== -1) {
    data.courses.splice(index, 1);
    saveCourses(data);
    return res.status(204).send();
  }

  index = data.transcript.findIndex(c => c.id === id);
  if (index !== -1) {
    data.transcript.splice(index, 1);
    saveCourses(data);
    return res.status(204).send();
  }

  res.status(404).json({ error: 'Course not found' });
});

module.exports = router;
