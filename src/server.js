const express = require('express');
const path = require('path');
const programRoutes = require('./routes/programs');
const courseRoutes = require('./routes/courses');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/programs', programRoutes);
app.use('/api/courses', courseRoutes);

// Serve prereq-map data
app.get('/api/prereq-map', (req, res) => {
  res.sendFile(path.join(__dirname, '../data/prereq-map.json'));
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

module.exports = app;
