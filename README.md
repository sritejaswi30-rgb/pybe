# PyBe MERN App

PyBe is a scenario-driven Python learning prototype built from the supplied PRD and breakdown document. It has no login flow for now.

📚 View the project wiki: [WIKI.md](WIKI.md)

## Features

- Scenario browser with difficulty, concept, and search filters
- Interactive learning session: learner reasoning, abstraction mapping, conversational prompts, Python construct generation, prompt scoring, and reflection capture
- Dashboard with progress, prompt maturity, concept mastery, misconceptions, and recent sessions
- Roadmap view covering V0 through V3 from the source documents
- JSON-file backed API with seed data
- W³H Concept Guide: Learn what, why, where, and how for each Python concept
- Motivational messages at the start of each learning session

## Tech Stack

- JSON file storage
- Express + Node.js
- React + Vite
- Plain CSS, no auth

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies:

```bash
npm run installAll
```

2. Configure the server environment:

```bash
cp server/.env.example server/.env
```

The default values work for local development.

3. Seed sample data:

```bash
npm run seed
```

4. Run the app:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

## API Overview

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/scenarios` | List scenarios (filter by `q`, `concept`, `difficulty`) |
| GET | `/api/scenarios/:id` | Get single scenario |
| POST | `/api/scenarios` | Create scenario |
| GET | `/api/sessions` | List sessions |
| POST | `/api/sessions` | Create session (runs learning engine) |
| GET | `/api/analytics` | Get learner analytics |
| GET | `/api/roadmap` | Get development roadmap |
| GET | `/api/concepts` | List all concepts |
| GET | `/api/concepts?name=variables` | Get concept by name |
| GET | `/api/concepts/:id` | Get concept by ID |
| GET | `/api/motivation` | Get random motivation message |

### Example: Get Concept Guide

```bash
GET /api/concepts/variables
```

Response:
```json
{
  "id": "variables",
  "title": "Variables",
  "difficulty": "Beginner",
  "w3h": {
    "what": "A variable is a named container...",
    "why": "Programs need to remember values...",
    "where": ["Banking systems", "Shopping carts", "Games"],
    "how": "Assign a value using the = sign...",
    "example": "age = 12\nname = 'Alex'"
  },
  "relatedConcepts": ["input", "output", "arithmetic"],
  "commonMistake": "Using a variable before assigning it a value.",
  "keyTakeaway": "Variables let programs store, name, and reuse information.",
  "tags": ["basics", "memory"]
}
```

## Project Structure

```
pybe/
├── client/                    # React frontend
│   ├── src/
│   │   ├── main.jsx           # Main app component
│   │   └── styles.css         # Styles
│   └── index.html
├── server/                    # Express backend
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── routes/            # API routes
│   │   │   ├── analytics.js
│   │   │   ├── concepts.js    # W3H concepts API
│   │   │   ├── motivation.js
│   │   │   ├── roadmap.js
│   │   │   ├── scenarios.js
│   │   │   └── sessions.js
│   │   ├── services/          # Business logic
│   │   │   ├── conceptGuide.js
│   │   │   └── learningEngine.js
│   │   └── data/              # JSON storage
│   │       ├── db.json
│   │       ├── roadmap.js
│   │       ├── seed.js
│   │       └── store.js
│   └── .env.example
├── README.md
└── WIKI.md
```

## Architecture

### Service Layer

The application follows a service-oriented architecture:

- **conceptGuide service**: Single source of truth for W³H concept data. Acts as an abstraction layer between the JSON database and API routes. Can be replaced with an AI-powered service in future versions without changing the API contract.

### Data Model

Concept schema (stored in `db.json`):
```json
{
  "id": "string",
  "title": "string",
  "difficulty": "Beginner | Explorer | Builder",
  "w3h": {
    "what": "string",
    "why": "string",
    "where": ["string"],
    "how": "string",
    "example": "string"
  },
  "relatedConcepts": ["string"],
  "commonMistake": "string",
  "keyTakeaway": "string",
  "tags": ["string"]
}
```

## Feature Progress

- [x] Motivation System
- [x] W³H Concept Schema (24 concepts with full W³H content)
- [x] Concept Guide Service
- [x] Concepts API (GET /api/concepts, GET /api/concepts/:id, GET /api/concepts?name=...)
- [x] W³H UI Panel (collapsible sections, key takeaway, common mistake)
- [ ] Achievement Badge System
- [ ] Learning Companion
- [ ] UI Polish

## Notes

The AI behavior in this prototype is deterministic and local. The abstraction mapper, prompt evaluator, and Python construct generator use rule-based logic so you can run everything without external AI keys. Later phases can replace those services with OpenAI, RAG, or TinyLLM components.

Learning data is stored in `server/src/data/db.json`. This keeps the prototype simple and fully local, without MongoDB, Docker, Atlas, or any external database.

## Roadmap

- **V0**: Core Learning Experience - Scenario interface, AI abstraction mapper, prompt evaluation
- **V1**: Educational Data Engine - Scenario database, learner interaction logging, misconception dataset
- **V2**: TinyLLM Specialization - RAG pipeline, prompt grading, scenario generation
- **V3**: Intelligent Learning Ecosystem - Learner dashboard, gamification, adaptive learning, persistent AI mentor