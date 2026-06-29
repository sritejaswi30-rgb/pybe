import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Brain,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronUp,
  Code2,
  Compass,
  Flag,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Mic,
  Play,
  Route,
  Search,
  Send,
  Sparkles,
  Star,
  TrendingDown,
  Zap
} from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function api(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

const emotionConfig = {
  happy: { icon: '😊', label: 'Good thinking!', animation: 'bounce' },
  thinking: { icon: '🤔', label: 'Processing...', animation: 'pulse' },
  concerned: { icon: '⚠️', label: 'Review this', animation: 'shake' },
  excited: { icon: '🔥', label: 'Breakthrough!', animation: 'glow' }
};

function EmotionCompanion({ emotion, streak }) {
  if (!emotion) return null;
  const config = emotionConfig[emotion] || emotionConfig.thinking;
  return (
    <div className={`emotion-companion emotion-${emotion}`} role="status" aria-live="polite">
      <span className={`emotion-icon emotion-${config.animation}`}>{config.icon}</span>
      <span className="emotion-label">{config.label}</span>
    </div>
  );
}

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [roadmap, setRoadmap] = useState([]);
  const [w3hData, setW3hData] = useState(null);
  const [w3hLoading, setW3hLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', difficulty: '', concept: '' });
  const [form, setForm] = useState({ learnerName: 'Guest learner', reasoning: '', promptText: '', reflection: '' });
  const [activeResult, setActiveResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem('pybe_streak');
      return saved ? JSON.parse(saved) : { current: 0, lastActive: null, freezeTokens: 3, milestones: [] };
    } catch { return { current: 0, lastActive: null, freezeTokens: 3, milestones: [] }; }
  });

  const [xp, setXp] = useState(() => {
    try {
      const saved = localStorage.getItem('pybe_xp');
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });

  const concepts = useMemo(() => [...new Set(scenarios.flatMap((scenario) => scenario.concepts || []))].sort(), [scenarios]);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [voiceField, setVoiceField] = useState(null);

  function toggleVoiceInput(field) {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    if (voiceField === field) {
      recognition.stop();
      setVoiceField(null);
      return;
    }

    setVoiceField(field);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm((prev) => ({ ...prev, [field]: prev[field] + transcript }));
      setVoiceField(null);
    };

    recognition.onerror = () => {
      setVoiceField(null);
    };

    recognition.onend = () => {
      setVoiceField(null);
    };
  }

  function deriveEmotion(result) {
    if (!result) return null;
    const duolingoResult = result.duolingo?.result;
    if (duolingoResult === 'correct') return 'happy';
    if (duolingoResult === 'partial') return 'thinking';
    if (duolingoResult === 'wrong') return 'concerned';
    const score = result.promptScore || 0;
    const misconceptions = result.misconceptions || [];
    const hasMisconceptions = misconceptions.length > 0;
    const abstractionCount = result.abstractionMap?.length || 0;
    if (score >= 75 && !hasMisconceptions && abstractionCount >= 1) return 'excited';
    if (score >= 50 && !hasMisconceptions) return 'happy';
    if (score >= 35 || (hasMisconceptions && score >= 30)) return 'thinking';
    return 'concerned';
  }

  function getToday() {
    return new Date().toISOString().split('T')[0];
  }

  function updateStreak() {
    const today = getToday();
    const { current, lastActive, freezeTokens, milestones } = streak;

    if (lastActive === today) return streak;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = current;
    let newFreeze = freezeTokens;

    if (lastActive === yesterdayStr) {
      newStreak = current + 1;
    } else if (lastActive !== today) {
      if (lastActive && freezeTokens > 0) {
        newFreeze = freezeTokens - 1;
        newStreak = current + 1;
      } else {
        newStreak = 1;
      }
    }

    const milestonesArr = [...milestones];
    const milestonesDef = { 3: 'Beginner Spark', 7: 'Momentum Builder', 14: 'Consistency Master', 30: 'Discipline Legend' };
    for (const [days, name] of Object.entries(milestonesDef)) {
      if (newStreak >= parseInt(days) && !milestonesArr.includes(name)) {
        milestonesArr.push(name);
      }
    }

    const updated = { current: newStreak, lastActive: today, freezeTokens: newFreeze, milestones: milestonesArr };
    setStreak(updated);
    try { localStorage.setItem('pybe_streak', JSON.stringify(updated)); } catch {}
    return updated;
  }

  function getStreakAura(streakCount) {
    if (streakCount >= 30) return 'legend';
    if (streakCount >= 14) return 'master';
    if (streakCount >= 7) return 'builder';
    if (streakCount >= 3) return 'spark';
    return 'neutral';
  }

  function getStreakMessage(streakCount, emotion) {
    if (streakCount === 0) return "Let's start our journey together!";
    if (streakCount === 1) return "Day 1! Great beginning!";
    if (streakCount < 7) return `Keep going! ${streakCount} days and counting!`;
    if (emotion === 'concerned') return "Don't break our streak tomorrow...";
    if (emotion === 'excited') return `We're on fire for ${streakCount} days!`;
    if (emotion === 'happy') return "We're building something strong here!";
    return `Amazing ${streakCount}-day momentum!`;
  }

  function addXpToTotal(xpAmount) {
    if (!xpAmount || xpAmount <= 0) return;
    const newXp = xp + xpAmount;
    setXp(newXp);
    try { localStorage.setItem('pybe_xp', newXp.toString()); } catch {}
  }

  async function refresh() {
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    const [scenarioData, sessionData, analyticsData, roadmapData] = await Promise.all([
      api(`/scenarios?${params}`),
      api('/sessions'),
      api('/analytics'),
      api('/roadmap')
    ]);
    setScenarios(scenarioData);
    setSessions(sessionData);
    setAnalytics(analyticsData);
    setRoadmap(roadmapData);
    setSelected((current) => current || scenarioData[0] || null);
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, [filters.q, filters.difficulty, filters.concept]);

  const activeResultId = activeResult?._id;

  useEffect(() => {
    if (!activeResultId) {
      setW3hData(null);
      return;
    }
    if (!activeResult?.abstractionMap?.length) {
      setW3hData(null);
      return;
    }
    const rawConcept = activeResult.abstractionMap[0]?.pythonConcept || '';
    const conceptMap = {
      'for / while loops': 'loops',
      'if / elif / else': 'conditionals',
      'lists and dictionaries': 'lists',
      'variables and arithmetic expressions': 'variables',
      'comparisons and list comprehensions': 'comparisons',
      'statements and variables': 'variables'
    };
    const primaryConcept = (conceptMap[rawConcept] || rawConcept.toLowerCase().split(' ')[0].replace(/[^a-z]/g, ''));
    if (!primaryConcept) {
      setW3hData(null);
      return;
    }
    setW3hLoading(true);
    api(`/concepts/${primaryConcept}`)
      .then(setW3hData)
      .catch(() => setW3hData(null))
      .finally(() => setW3hLoading(false));
  }, [activeResultId]);

  async function submitSession(event) {
    event.preventDefault();
    if (!selected || !form.reasoning.trim()) return;
    setSubmitting(true);
    setEmotion(null);
    try {
      const result = await api('/sessions', {
        method: 'POST',
        body: JSON.stringify({ ...form, scenarioId: selected._id })
      });
      setActiveResult(result);
      setEmotion(deriveEmotion(result));
      updateStreak();
      if (result.duolingo?.xp) addXpToTotal(result.duolingo.xp);
      setForm({ ...form, reasoning: '', promptText: '', reflection: '' });
      await refresh();
    } catch (err) {
      console.error('Session error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <main className="loading">Loading PyBe...</main>;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Brain size={30} />
          <div>
            <strong>PyBe</strong>
            <span>Scenario-first Python</span>
          </div>
        </div>

        <label className="search">
          <Search size={18} />
          <input
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
            placeholder="Search scenarios"
          />
        </label>

        <select value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}>
          <option value="">All levels</option>
          <option>Beginner</option>
          <option>Explorer</option>
          <option>Builder</option>
        </select>

        <select value={filters.concept} onChange={(event) => setFilters({ ...filters, concept: event.target.value })}>
          <option value="">All concepts</option>
          {concepts.map((concept) => <option key={concept}>{concept}</option>)}
        </select>

        <div className="scenario-list">
          {scenarios.map((scenario) => (
            <button
              key={scenario._id}
              className={selected?._id === scenario._id ? 'scenario active' : 'scenario'}
              onClick={() => {
                setSelected(scenario);
                setActiveResult(null);
                setEmotion(null);
              }}
            >
              <span>{scenario.difficulty}</span>
              <strong>{scenario.title}</strong>
              <small>{scenario.concepts.join(' / ')}</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace">
        <header className="hero">
          <div>
            <p>AI-native learning journey</p>
            <h1>Learn Python by reasoning through real situations first.</h1>
          </div>
          <div className="hero-stats">
            <span>{analytics?.scenarioCount || 0}<small>Scenarios</small></span>
            <span>{analytics?.sessionCount || 0}<small>Sessions</small></span>
            <span>{analytics?.averagePromptScore || 0}<small>Prompt score</small></span>
            <span className={`streak-badge streak-${getStreakAura(streak.current)}`}>
              🔥 {streak.current}<small>Day Streak</small>
            </span>
            <span className="xp-badge">
              ⭐ {xp}<small>XP</small>
            </span>
          </div>
        </header>

        <div className="main-grid">
          <section className="panel learning-panel">
            <div className="section-title">
              <Compass size={20} />
              <h2>{selected?.title}</h2>
            </div>
            <p className="context">{selected?.context}</p>
            <div className="objective-row">
              {selected?.objectives.map((item) => <span key={item}>{item}</span>)}
            </div>
            <form onSubmit={submitSession} className="learning-form">
              <label className="reasoning-label">
                Your reasoning
                <div className="input-row">
                  <textarea
                    required
                    value={form.reasoning}
                    onChange={(event) => setForm({ ...form, reasoning: event.target.value })}
                    placeholder={selected?.prompt}
                  />
                  <button
                    type="button"
                    className={`voice-btn ${voiceField === 'reasoning' ? 'listening' : ''}`}
                    onClick={() => toggleVoiceInput('reasoning')}
                    aria-label={voiceField === 'reasoning' ? 'Stop recording' : 'Start voice input'}
                    title={SpeechRecognition ? 'Voice input' : 'Voice not supported'}
                    disabled={!SpeechRecognition}
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </label>
              <label>
                Prompt you would give an AI mentor
                <div className="input-row">
                  <textarea
                    value={form.promptText}
                    onChange={(event) => setForm({ ...form, promptText: event.target.value })}
                    placeholder="Explain my approach step by step, then show the Python concept and code..."
                  />
                  <button
                    type="button"
                    className={`voice-btn ${voiceField === 'promptText' ? 'listening' : ''}`}
                    onClick={() => toggleVoiceInput('promptText')}
                    aria-label={voiceField === 'promptText' ? 'Stop recording' : 'Start voice input'}
                    title={SpeechRecognition ? 'Voice input' : 'Voice not supported'}
                    disabled={!SpeechRecognition}
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </label>
              <label>
                Reflection
                <div className="input-row">
                  <textarea
                    value={form.reflection}
                    onChange={(event) => setForm({ ...form, reflection: event.target.value })}
                    placeholder="What did you notice about your thinking?"
                  />
                  <button
                    type="button"
                    className={`voice-btn ${voiceField === 'reflection' ? 'listening' : ''}`}
                    onClick={() => toggleVoiceInput('reflection')}
                    aria-label={voiceField === 'reflection' ? 'Stop recording' : 'Start voice input'}
                    title={SpeechRecognition ? 'Voice input' : 'Voice not supported'}
                    disabled={!SpeechRecognition}
                  >
                    <Mic size={18} />
                  </button>
                </div>
              </label>
              <button className="primary" disabled={submitting}>
                <Send size={18} />{submitting ? 'Mapping...' : 'Map My Reasoning'}
              </button>
            </form>
          </section>

          <section className="panel result-panel">
            <div className="section-title">
              <Sparkles size={20} />
              <h2>AI Mentor Output</h2>
              <EmotionCompanion emotion={emotion} streak={streak} />
            </div>
            {!activeResult ? <EmptyResult /> : (
              <Result result={activeResult} />
            )}
          </section>

          {activeResult && w3hData && (
            <section className="panel w3h-panel" aria-label="W3H Concept Guide">
              <div className="section-title">
                <Lightbulb size={20} />
                <h2>W3H Guide</h2>
              </div>
              <div className="w3h-content-wrapper">
                <W3hGuide data={w3hData} mentorFeedback={activeResult} />
              </div>
            </section>
          )}
        </div>

        <section className="dashboard">
          <div className="panel">
            <div className="section-title"><ChartNoAxesCombined size={20} /><h2>Learner Analytics</h2></div>
            <Analytics analytics={analytics} />
          </div>
          <div className="panel">
            <div className="section-title"><Route size={20} /><h2>Roadmap</h2></div>
            <Roadmap roadmap={roadmap} />
          </div>
          <div className="panel">
            <div className="section-title"><MessageSquareText size={20} /><h2>Recent Sessions</h2></div>
            <SessionList sessions={sessions} />
          </div>
        </section>
      </section>
    </main>
  );
}

function EmptyResult() {
  return (
    <div className="empty">
      <Lightbulb size={38} />
      <p>Submit reasoning to see abstraction mapping, Python code, prompt feedback, and misconception signals.</p>
    </div>
  );
}

function Result({ result }) {
  const duolingo = result.duolingo || {};
  const resultIcon = duolingo.result === 'correct' ? '✅' : duolingo.result === 'partial' ? '🤔' : duolingo.result === 'wrong' ? '❌' : '💡';

  return (
    <div className="result-stack">
      {duolingo.result && (
        <div className={`duolingo-block duo-${duolingo.result}`}>
          <span className="duo-icon">{resultIcon}</span>
          <div className="duo-content">
            <p className="duo-feedback">{duolingo.feedback}</p>
            {duolingo.hint && <small className="duo-hint">💡 {duolingo.hint}</small>}
          </div>
          <div className="duo-xp">+{duolingo.xp || 0} XP</div>
        </div>
      )}
      <div className="score"><span>{result.promptScore}</span><small>Prompt maturity</small></div>
      <div>
        {result.abstractionMap.map((item) => (
          <article className="mapping" key={item.pattern}>
            <strong>{item.pattern}</strong>
            <span>{item.pythonConcept}</span>
            <p>{item.explanation}</p>
          </article>
        ))}
      </div>
      <div className="code-block">
        <div><Code2 size={18} /> Generated Python</div>
        <pre>{result.generatedCode}</pre>
        <p>{result.codeExplanation}</p>
      </div>
      <ul className="feedback">
        {result.promptFeedback.map((item) => <li key={item}>{item}</li>)}
      </ul>
      {result.misconceptions.length > 0 && (
        <div className="note">
          <strong>Misconception watch</strong>
          {result.misconceptions.map((item) => <p key={item}>{item}</p>)}
        </div>
      )}
    </div>
  );
}

function Analytics({ analytics }) {
  const concepts = Object.entries(analytics?.conceptCounts || {});
  return (
    <div className="analytics-list">
      {concepts.length ? concepts.map(([name, count]) => (
        <div key={name}>
          <span>{name}</span>
          <meter min="0" max="10" value={count}></meter>
          <strong>{count}</strong>
        </div>
      )) : <p>No learning sessions yet.</p>}
    </div>
  );
}

function Roadmap({ roadmap }) {
  return (
    <div className="roadmap">
      {roadmap.map((phase) => (
        <article key={phase.phase}>
          <strong>{phase.phase}</strong>
          <div>
            <h3>{phase.title}</h3>
            <p>{phase.summary}</p>
            <small>{phase.items.join(' / ')}</small>
          </div>
        </article>
      ))}
    </div>
  );
}

function SessionList({ sessions }) {
  return (
    <div className="sessions">
      {sessions.length ? sessions.slice(0, 6).map((session) => (
        <article key={session._id}>
          <Play size={16} />
          <div>
            <strong>{session.scenario?.title}</strong>
            <span>{session.masterySignals.join(' / ')}</span>
          </div>
        </article>
      )) : <p>No sessions yet.</p>}
    </div>
  );
}

function W3hGuide({ data, mentorFeedback }) {
  const [expanded, setExpanded] = useState({ what: true, why: true, where: true, how: true });

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleKeyDown = (e, key) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(key);
    }
  };

  const sectionIcons = {
    what: '📘',
    why: '💡',
    where: '🌍',
    how: '⚙️',
  };

  const sections = [
    { key: 'what', label: 'What is it?', content: data?.w3h?.what },
    { key: 'why', label: 'Why is it used?', content: data?.w3h?.why },
    { key: 'where', label: 'Where is it used?', content: data?.w3h?.where },
    { key: 'how', label: 'How does it work?', content: data?.w3h?.how },
  ];

  const primaryConcept = mentorFeedback?.abstractionMap?.[0]?.pythonConcept || data?.title || 'Concept';

  if (!data) return null;

  return (
    <div className="w3h-guide-content" role="region" aria-label="Concept Guide">
      <div className="w3h-header">
        <h3>Learn More About <strong>{primaryConcept}</strong></h3>
      </div>

      <div className="w3h-sections">
        {sections.map(({ key, label, content }) => {
          if (!content) return null;
          const isArray = Array.isArray(content);
          const isExpanded = expanded[key];

          return (
            <div key={key} className="w3h-section">
              <button
                className="w3h-section-header"
                onClick={() => toggle(key)}
                onKeyDown={(e) => handleKeyDown(e, key)}
                aria-expanded={isExpanded}
                aria-controls={`w3h-section-${key}`}
                type="button"
              >
                <span className="w3h-section-title">
                  <span className="w3h-icon" aria-hidden="true">{sectionIcons[key]}</span>
                  {label}
                </span>
                <span className="w3h-chevron" aria-hidden="true">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              {isExpanded && (
                <div
                  id={`w3h-section-${key}`}
                  className="w3h-section-body"
                  role="region"
                >
                  {isArray ? (
                    <ul className="w3h-list">
                      {content.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="w3h-text">{content}</p>
                  )}
                  {key === 'how' && data?.w3h?.example && (
                    <div className="w3h-example-wrapper">
                      <code className="w3h-example">{data.w3h.example}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data?.keyTakeaway && (
        <div className="w3h-takeaway" role="note">
          <span aria-hidden="true">⭐</span>
          <div>
            <strong>Key Takeaway</strong>
            <p>{data.keyTakeaway}</p>
          </div>
        </div>
      )}

      {data?.commonMistake && (
        <div className="w3h-mistake" role="alert">
          <span aria-hidden="true">⚠️</span>
          <div>
            <strong>Common Mistake</strong>
            <p>{data.commonMistake}</p>
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
