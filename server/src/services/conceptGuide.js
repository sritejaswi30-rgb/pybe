const store = require('../data/store');

async function getConceptById(id) {
  const db = await store.readDb();
  const concepts = db.concepts || {};
  return concepts[id] || null;
}

async function getConceptByName(name) {
  const db = await store.readDb();
  const concepts = db.concepts || {};
  const lowerName = name.toLowerCase();
  return Object.values(concepts).find(
    (concept) => concept.title.toLowerCase() === lowerName
  ) || null;
}

async function getAllConcepts() {
  const db = await store.readDb();
  return Object.values(db.concepts || {});
}

async function conceptExists(id) {
  const db = await store.readDb();
  const concepts = db.concepts || {};
  return Boolean(concepts[id]);
}

module.exports = {
  conceptExists,
  getAllConcepts,
  getConceptById,
  getConceptByName
};