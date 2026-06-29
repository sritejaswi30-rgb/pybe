const express = require('express');
const conceptGuide = require('../services/conceptGuide');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name) {
      const concepts = await conceptGuide.getAllConcepts();
      return res.json(concepts);
    }
    const concept = await conceptGuide.getConceptByName(name);
    if (!concept) {
      return res.status(404).json({ message: 'Concept not found' });
    }
    res.json(concept);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ message: 'Invalid concept id' });
    }
    const concept = await conceptGuide.getConceptById(id.trim());
    if (!concept) {
      return res.status(404).json({ message: 'Concept not found' });
    }
    res.json(concept);
  } catch (error) {
    next(error);
  }
});

module.exports = router;