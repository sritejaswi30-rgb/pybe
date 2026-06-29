const express = require('express');
let roadmap;
try {
  roadmap = require('../data/roadmap');
} catch (err) {
  console.error('Failed to load roadmap data:', err);
  roadmap = [];
}

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(roadmap || []);
});

module.exports = router;
