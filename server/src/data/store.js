const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'db.json');

const defaultDb = { scenarios: [], sessions: [] };

async function safeReadFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return null;
    }
    if (err instanceof SyntaxError) {
      console.error('Corrupted JSON in database, resetting:', err.message);
      return null;
    }
    throw err;
  }
}

async function safeWriteFile(filePath, data) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  } catch (err) {
    console.error('Failed to write database:', err);
    throw err;
  }
}

async function ensureDb() {
  try {
    await fs.access(dbPath);
  } catch {
    await safeWriteFile(dbPath, defaultDb);
  }
}

async function readDb() {
  await ensureDb();
  const data = await safeReadFile(dbPath);
  if (!data) {
    return defaultDb;
  }
  return {
    scenarios: Array.isArray(data.scenarios) ? data.scenarios : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : []
  };
}

async function writeDb(data) {
  await safeWriteFile(dbPath, data || defaultDb);
}

function now() {
  return new Date().toISOString();
}

function createRecord(input) {
  const timestamp = now();
  return {
    _id: crypto.randomUUID(),
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

async function listScenarios(filters = {}) {
  const db = await readDb();
  let scenarios = Array.isArray(db.scenarios) ? [...db.scenarios] : [];
  if (filters.difficulty) scenarios = scenarios.filter((item) => item.difficulty === filters.difficulty);
  if (filters.concept) scenarios = scenarios.filter((item) => item.concepts && item.concepts.includes(filters.concept));
  if (filters.q) {
    const query = filters.q.toLowerCase();
    scenarios = scenarios.filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const title = item.title ? item.title.toLowerCase() : '';
      const context = item.context ? item.context.toLowerCase() : '';
      const concepts = Array.isArray(item.concepts) ? item.concepts : [];
      return title.includes(query) || context.includes(query) || concepts.some((c) => c.toLowerCase().includes(query));
    });
  }
  return scenarios.sort((a, b) => (b.effectivenessScore || 0) - (a.effectivenessScore || 0));
}

async function getScenario(id) {
  const db = await readDb();
  if (!Array.isArray(db.scenarios)) return null;
  return db.scenarios.find((scenario) => scenario && scenario._id === id) || null;
}

async function addScenario(input) {
  const db = await readDb();
  if (!Array.isArray(db.scenarios)) db.scenarios = [];
  const scenario = createRecord(input);
  db.scenarios.push(scenario);
  await writeDb(db);
  return scenario;
}

async function listSessions() {
  const db = await readDb();
  const sessions = Array.isArray(db.sessions) ? db.sessions : [];
  const scenarios = Array.isArray(db.scenarios) ? db.scenarios : [];
  return sessions
    .map((session) => ({
      ...session,
      scenario: scenarios.find((scenario) => scenario && scenario._id === session.scenario) || null
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addSession(input) {
  const db = await readDb();
  if (!Array.isArray(db.sessions)) db.sessions = [];
  if (!Array.isArray(db.scenarios)) db.scenarios = [];
  const session = createRecord(input);
  db.sessions.push(session);
  await writeDb(db);
  return {
    ...session,
    scenario: db.scenarios.find((scenario) => scenario && scenario._id === session.scenario) || null
  };
}

async function resetData(scenarios) {
  await writeDb({
    scenarios: scenarios.map((scenario) => createRecord(scenario)),
    sessions: []
  });
}

module.exports = {
  addScenario,
  addSession,
  getScenario,
  listScenarios,
  listSessions,
  readDb,
  resetData
};
