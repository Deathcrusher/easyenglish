import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { TOPICS, ALL_WORDS } from '../data/vocab.js'
import { isDue, LEARNED_BOX } from '../lib/storage.js'
import { speak } from '../lib/speech.js'
import { Listen, MicCheck, Progress, shuffle } from './ui.jsx'

function topicWords(topic) {
  return topic === 'all' ? ALL_WORDS : TOPICS.find((t) => t.id === topic).words
}

export default function Vocab() {
  const { route, setRoute, state } = useApp()
  if (route?.mode === 'cards') return <Flashcards topic={route.topic} />
  if (route?.mode === 'quiz') return <WordQuiz topic={route.topic} listenMode={false} />
  if (route?.mode === 'listen') return <WordQuiz topic={route.topic} listenMode />
  if (route?.mode === 'pick') return <TopicDetail topic={route.topic} />

  const dueAll = ALL_WORDS.filter((w) => isDue(state.cards[w.id])).length
  return (
    <div>
      <header className="page-head">
        <h1>Vokabeln</h1>
        <p className="sub">Wähle ein Thema. Wörter, die du nicht weißt, kommen öfter wieder.</p>
      </header>

      <button className="hero-card" onClick={() => setRoute({ mode: 'cards', topic: 'all' })}>
        <div>
          <strong>Alle Themen wiederholen</strong>
          <span>{dueAll > 0 ? `${dueAll} Karten sind heute fällig` : 'Neue Wörter aus allen Themen lernen'}</span>
        </div>
        <span className="arrow">→</span>
      </button>

      <div className="topic-grid">
        {TOPICS.map((t) => {
          const learned = t.words.filter((w) => (state.cards[w.id]?.box || 0) >= LEARNED_BOX).length
          const started = t.words.filter((w) => state.cards[w.id]).length
          const due = t.words.filter((w) => isDue(state.cards[w.id])).length
          return (
            <button key={t.id} className="topic" onClick={() => setRoute({ mode: 'pick', topic: t.id })}>
              <span className="topic-icon">{t.icon}</span>
              <strong>{t.title}</strong>
              <Progress value={started + learned} max={t.words.length * 2} />
              <small>
                {learned}/{t.words.length} sicher{due ? ` · ${due} fällig` : ''}
              </small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TopicDetail({ topic }) {
  const { setRoute, state } = useApp()
  const t = TOPICS.find((x) => x.id === topic)
  return (
    <div>
      <button className="back" onClick={() => setRoute(null)}>← Themen</button>
      <header className="page-head">
        <h1>{t.icon} {t.title}</h1>
      </header>
      <div className="mode-row">
        <button className="mode" onClick={() => setRoute({ mode: 'cards', topic })}>
          <span>🃏</span><strong>Karteikarten</strong><small>Lernen & wiederholen</small>
        </button>
        <button className="mode" onClick={() => setRoute({ mode: 'quiz', topic })}>
          <span>✅</span><strong>Quiz</strong><small>Deutsch → Englisch</small>
        </button>
        <button className="mode" onClick={() => setRoute({ mode: 'listen', topic })}>
          <span>👂</span><strong>Hören</strong><small>Was bedeutet das?</small>
        </button>
      </div>
      <h2 className="section-title">Alle Wörter</h2>
      <ul className="word-list">
        {t.words.map((w) => {
          const box = state.cards[w.id]?.box
          return (
            <li key={w.id}>
              <div className="wl-main">
                <strong>{w.en}</strong>
                <span className="ipa">/{w.ipa}/</span>
                <span className="wl-de">{w.de}</span>
              </div>
              <span className={`dot box${box === undefined ? 'new' : Math.min(box, 4)}`} title="Lernstand" />
              <Listen text={w.en} small />
            </li>
          )
        })}
      </ul>
      <p className="note">Punkt-Farbe: grau = neu, orange = am Lernen, grün = sitzt.</p>
    </div>
  )
}

function Flashcards({ topic }) {
  const { state, grade, addXp, setRoute } = useApp()
  const initial = useMemo(() => {
    const words = topicWords(topic)
    const due = shuffle(words.filter((w) => isDue(state.cards[w.id])))
    const fresh = words.filter((w) => !state.cards[w.id]).slice(0, state.newPerSession)
    return [...due, ...fresh]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic])
  const [queue, setQueue] = useState(initial)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const total = initial.length
  const w = queue[0]

  useEffect(() => {
    if (w && !flipped) speak(w.en)
  }, [w, flipped])

  if (!total) {
    return (
      <div className="center-box">
        <div className="big-emoji">🌟</div>
        <h2>Alles erledigt!</h2>
        <p>Hier ist heute nichts mehr fällig. Lust auf ein Quiz?</p>
        <button className="btn primary" onClick={() => setRoute({ mode: 'quiz', topic })}>Quiz starten</button>
        <button className="btn ghost" onClick={() => setRoute(null)}>Zurück</button>
      </div>
    )
  }
  if (!w) {
    return (
      <div className="center-box">
        <div className="big-emoji">🎉</div>
        <h2>Runde geschafft!</h2>
        <p>{total} Wörter geübt. Die schwierigen kommen bald wieder.</p>
        <button className="btn primary" onClick={() => setRoute(topic === 'all' ? null : { mode: 'pick', topic })}>Fertig</button>
      </div>
    )
  }

  function answer(g) {
    grade(w.id, g)
    addXp(g === 'good' ? 3 : 1)
    setFlipped(false)
    if (g === 'again') {
      setQueue((q) => [...q.slice(1), q[0]])
    } else {
      setQueue((q) => q.slice(1))
      setDone((d) => d + 1)
    }
  }

  const isNew = !state.cards[w.id]

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={() => setRoute(topic === 'all' ? null : { mode: 'pick', topic })}>✕</button>
        <Progress value={done} max={total} />
        <span className="count">{done}/{total}</span>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        {isNew && <span className="badge">neu</span>}
        <div className="fc-word">{w.en}</div>
        <div className="ipa big">/{w.ipa}/</div>
        <div className="hint">🗣️ sprich: <strong>{w.hint}</strong></div>
        <Listen text={w.en} />

        {flipped ? (
          <div className="fc-back">
            <div className="fc-de">{w.de}</div>
            <div className="example">
              <p className="ex-en">{w.ex}</p>
              <p className="ex-de">{w.exDe}</p>
              <Listen text={w.ex} small />
            </div>
            <MicCheck target={w.en} compact />
          </div>
        ) : (
          <button className="btn primary wide" onClick={() => setFlipped(true)}>Bedeutung zeigen</button>
        )}
      </div>

      {flipped && (
        <div className="grade-row">
          <button className="grade again" onClick={() => answer('again')}>😕<span>Nochmal</span></button>
          <button className="grade hard" onClick={() => answer('hard')}>🤔<span>Schwer</span></button>
          <button className="grade good" onClick={() => answer('good')}>😄<span>Gewusst</span></button>
        </div>
      )}
    </div>
  )
}

function WordQuiz({ topic, listenMode }) {
  const { addXp, setRoute, grade } = useApp()
  const pool = topicWords(topic)
  const questions = useMemo(
    () =>
      shuffle(pool).slice(0, 10).map((w) => {
        const others = shuffle(ALL_WORDS.filter((x) => x.id !== w.id && x.topic === w.topic)).slice(0, 3)
        return { w, options: shuffle([w, ...others]) }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, listenMode]
  )
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const q = questions[i]

  useEffect(() => {
    if (q && listenMode) {
      const t = setTimeout(() => speak(q.w.en), 250)
      return () => clearTimeout(t)
    }
  }, [q, listenMode])

  const exit = () => setRoute(topic === 'all' ? null : { mode: 'pick', topic })

  if (!q) {
    return (
      <div className="center-box">
        <div className="big-emoji">{score >= 8 ? '🏆' : score >= 5 ? '💪' : '🌱'}</div>
        <h2>{score} von {questions.length} richtig</h2>
        <p>{score >= 8 ? 'Wahnsinn, richtig stark!' : score >= 5 ? 'Gut gemacht! Weiter so.' : 'Übung macht den Meister – probier die Karteikarten!'}</p>
        <button className="btn primary" onClick={() => { setI(0); setScore(0); setPicked(null) }}>Nochmal</button>
        <button className="btn ghost" onClick={exit}>Fertig</button>
      </div>
    )
  }

  function pick(o) {
    if (picked) return
    setPicked(o)
    const ok = o.id === q.w.id
    if (ok) {
      setScore((s) => s + 1)
      addXp(2)
    } else {
      grade(q.w.id, 'again')
    }
    if (!listenMode) speak(q.w.en)
  }

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={exit}>✕</button>
        <Progress value={i} max={questions.length} />
        <span className="count">{i + 1}/{questions.length}</span>
      </div>

      <div className="quiz-q">
        {listenMode ? (
          <>
            <p className="quiz-ask">Was hörst du? Was bedeutet das?</p>
            <button className="play-big" onClick={() => speak(q.w.en)}>🔊</button>
            <button className="link" onClick={() => speak(q.w.en, { slow: true })}>🐢 langsamer</button>
            {picked && <div className="fc-word small">{q.w.en} <span className="ipa">/{q.w.ipa}/</span></div>}
          </>
        ) : (
          <>
            <p className="quiz-ask">Wie heißt das auf Englisch?</p>
            <div className="fc-word">{q.w.de}</div>
          </>
        )}
      </div>

      <div className="options">
        {q.options.map((o) => {
          const cls = picked ? (o.id === q.w.id ? 'right' : o.id === picked.id ? 'wrong' : 'dim') : ''
          return (
            <button key={o.id} className={`option ${cls}`} onClick={() => pick(o)}>
              {listenMode ? o.de : o.en}
            </button>
          )
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked.id === q.w.id ? 'good' : 'bad'}`}>
          <p>
            <strong>{picked.id === q.w.id ? 'Richtig! 🎉' : 'Nicht ganz.'}</strong> {q.w.en} = {q.w.de}
          </p>
          <p className="ex-en">{q.w.ex}</p>
          <button className="btn primary wide" onClick={() => { setPicked(null); setI(i + 1) }}>Weiter</button>
        </div>
      )}
    </div>
  )
}
