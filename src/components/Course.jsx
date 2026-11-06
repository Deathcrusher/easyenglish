import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { UNITS, UNIT_BY_ID, LEVELS, ALL_WORDS } from '../data/units.js'
import { GRAMMAR_BY_ID } from '../data/grammar-all.js'
import { unitStatus, currentUnit, levelStats, PASS_TEST, SENTENCES_NEEDED } from '../lib/progress.js'
import { speak } from '../lib/speech.js'
import { sentenceItems } from '../lib/sentences.js'
import { Flashcards } from './Vocab.jsx'
import { GrammarDetail, GapQuiz } from './Grammar.jsx'
import { Reader } from './Reader.jsx'
import { SentenceTask } from './Sentences.jsx'
import { Listen, Progress, SayInline, shuffle } from './ui.jsx'
import { UnitPath } from './Home.jsx'

// Lektionsseiten (der Lernpfad selbst ist auf „Lernen“)
export default function Course() {
  const { route, state } = useApp()
  if (route?.unit) return <UnitRouter unit={UNIT_BY_ID[route.unit]} step={route.step} />
  return <UnitPath level={currentUnit(state).level} />
}

function UnitRouter({ unit, step }) {
  const { setRoute } = useApp()
  const back = () => setRoute({ unit: unit.id })
  switch (step) {
    case 'words':
      return <Flashcards topic={unit.id} onFinish={back} />
    case 'wordlist':
      return <WordList unit={unit} onBack={back} />
    case 'grammar':
      return (
        <GrammarDetail
          id={unit.grammar}
          backLabel="← Lektion"
          onBack={back}
          onPractice={() => setRoute({ unit: unit.id, step: 'grammarQuiz' })}
        />
      )
    case 'grammarQuiz':
      return <GapQuiz tense={unit.grammar} onFinish={back} />
    case 'reading':
      return <Reader id={unit.reading} onBack={back} onDone={back} />
    case 'sentences':
      return <UnitSentences unit={unit} onBack={back} />
    case 'test':
      return <UnitTest unit={unit} onBack={back} />
    default:
      return <UnitPage unit={unit} />
  }
}

function UnitPage({ unit }) {
  const { state, setRoute, go } = useApp()
  const s = unitStatus(unit, state)
  const lvl = LEVELS.find((l) => l.id === unit.level)
  const nextUnit = UNITS[unit.num] // num ist 1-basiert → nächste Lektion
  const open = (step) => setRoute({ unit: unit.id, step })

  return (
    <div style={{ '--c': lvl.color }}>
      <button className="back" onClick={() => go('home')}>← Lernen</button>
      <header className="unit-head">
        <span className="uh-icon">{unit.icon}</span>
        <div>
          <p className="eyebrow">Lektion {unit.num} · {unit.level}</p>
          <h1>{unit.title}</h1>
          <p className="sub">{unit.desc}</p>
        </div>
      </header>

      <div className="unit-progress">
        <Progress value={s.doneCount} max={5} color={lvl.color} />
        <span>{s.doneCount}/5 Schritte</span>
      </div>

      {s.next && (
        <button className="btn primary wide big-cta" onClick={() => open(s.next.key)}>
          {s.doneCount === 0 ? "Los geht's" : 'Weiter'}: {s.next.title.split(':')[0]} →
        </button>
      )}

      {s.complete && (
        <div className="feedback good">
          <p><strong>🏅 Lektion geschafft!</strong> Du kannst alles jederzeit wiederholen.</p>
          {nextUnit && (
            <button className="btn primary wide" onClick={() => setRoute({ unit: nextUnit.id })}>
              Weiter zu Lektion {nextUnit.num}: {nextUnit.title} →
            </button>
          )}
        </div>
      )}

      <div className="steps">
        {s.steps.map((st, i) => (
          <button key={st.key} className={`step ${st.done ? 'done' : ''} ${s.next?.key === st.key ? 'next' : ''}`} onClick={() => open(st.key)}>
            <span className="step-icon">{st.done ? '✓' : st.icon}</span>
            <span className="step-text">
              <small>Schritt {i + 1}</small>
              <strong>{st.title}</strong>
              <span>{st.sub}</span>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>

      <button className="link skip" onClick={() => open('wordlist')}>📋 Alle {unit.words.length} Wörter dieser Lektion ansehen</button>
    </div>
  )
}

function WordList({ unit, onBack }) {
  const { state } = useApp()
  return (
    <div>
      <button className="back" onClick={onBack}>← Lektion</button>
      <header className="page-head">
        <h1>{unit.icon} Wörter</h1>
        <p className="sub">Lektion {unit.num}: {unit.title}</p>
      </header>
      <ul className="word-list">
        {unit.words.map((w) => {
          const box = state.cards[w.id]?.box
          return (
            <li key={w.id}>
              <div className="wl-main">
                <strong>{w.en}</strong>
                <SayInline text={w.en} />
                <span className="wl-de">{w.de}</span>
              </div>
              <span className={`dot box${box === undefined ? 'new' : Math.min(box, 4)}`} />
              <Listen text={w.en} small />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function UnitSentences({ unit, onBack }) {
  const { state, update } = useApp()
  const items = useMemo(() => sentenceItems(unit, SENTENCES_NEEDED), [unit])
  const [i, setI] = useState(0)

  function done() {
    const prev = state.units?.[unit.id] || {}
    update({ units: { ...state.units, [unit.id]: { ...prev, sentences: (prev.sentences || 0) + 1 } } })
    setI((n) => n + 1)
  }

  if (i >= items.length) {
    return (
      <div className="center-box">
        <div className="big-emoji">🧩</div>
        <h2>Alle Sätze gebaut!</h2>
        <p>Stark – Wortstellung ist der Schlüssel zu gutem Englisch.</p>
        <button className="btn primary" onClick={onBack}>Zurück zur Lektion</button>
      </div>
    )
  }

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={onBack}>✕</button>
        <Progress value={i} max={items.length} />
        <span className="count">{i + 1}/{items.length}</span>
      </div>
      <SentenceTask key={i} item={items[i]} onDone={done} doneLabel={i === items.length - 1 ? 'Fertig' : 'Nächster Satz'} />
    </div>
  )
}

// ---------- Lektionstest ----------
function buildTest(unit) {
  const words = shuffle(unit.words)
  const others = (w) => shuffle(unit.words.filter((x) => x.id !== w.id)).slice(0, 3)
  const qs = []
  for (const w of words.slice(0, 4)) qs.push({ type: 'de2en', w, options: shuffle([w, ...others(w)]) })
  for (const w of words.slice(4, 6)) qs.push({ type: 'listen', w, options: shuffle([w, ...others(w)]) })
  const g = GRAMMAR_BY_ID[unit.grammar]
  for (const e of shuffle(g.ex).slice(0, 3)) qs.push({ type: 'gap', e: { ...e, o: shuffle(e.o) }, topic: g })
  const out = shuffle(qs)
  const s = sentenceItems(unit, 1)[0]
  if (s) out.push({ type: 'build', item: s })
  else {
    const w = words[6] || words[0]
    out.push({ type: 'de2en', w, options: shuffle([w, ...others(w)]) })
  }
  return out
}

function UnitTest({ unit, onBack }) {
  const { state, update, addXp, setRoute } = useApp()
  const [qs, setQs] = useState(() => buildTest(unit))
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [saved, setSaved] = useState(false)
  const q = qs[i]

  useEffect(() => {
    if (q?.type === 'listen') {
      const t = setTimeout(() => speak(q.w.en), 300)
      return () => clearTimeout(t)
    }
  }, [q])

  useEffect(() => {
    if (!q && !saved) {
      setSaved(true)
      const prev = state.units?.[unit.id] || {}
      update({ units: { ...state.units, [unit.id]: { ...prev, test: Math.max(score, prev.test || 0) } } })
      if (score >= PASS_TEST) addXp(10)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, saved])

  if (!q) {
    const passed = score >= PASS_TEST
    const nextUnit = UNITS[unit.num]
    return (
      <div className="center-box">
        <div className="big-emoji">{passed ? '🏅' : '🌱'}</div>
        <h2>{score} von {qs.length} richtig</h2>
        <p>{passed ? `Bestanden! Lektion ${unit.num} ist geschafft. +10 XP` : `Ab ${PASS_TEST} richtigen Antworten ist der Test bestanden. Wiederhol die Wörter und versuch es nochmal!`}</p>
        {passed && nextUnit && (
          <button className="btn primary" onClick={() => setRoute({ unit: nextUnit.id })}>Weiter zu Lektion {nextUnit.num} →</button>
        )}
        {!passed && (
          <button className="btn primary" onClick={() => { setQs(buildTest(unit)); setI(0); setScore(0); setPicked(null); setSaved(false) }}>Nochmal versuchen</button>
        )}
        <button className="btn ghost" onClick={onBack}>Zurück zur Lektion</button>
      </div>
    )
  }

  const next = () => {
    setPicked(null)
    setI((n) => n + 1)
  }
  const choose = (ok, val) => {
    if (picked) return
    setPicked(val)
    if (ok) setScore((s) => s + 1)
  }

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={onBack}>✕</button>
        <Progress value={i} max={qs.length} />
        <span className="count">{i + 1}/{qs.length}</span>
      </div>

      {q.type === 'build' ? (
        <SentenceTask key={i} item={q.item} doneLabel="Ergebnis anzeigen" onDone={(ok) => { if (ok) setScore((s) => s + 1); next() }} />
      ) : (
        <>
          <div className="quiz-q">
            {q.type === 'de2en' && (<><p className="quiz-ask">Wie heißt das auf Englisch?</p><div className="fc-word">{q.w.de}</div></>)}
            {q.type === 'listen' && (
              <>
                <p className="quiz-ask">Hör zu – was bedeutet das?</p>
                <button className="play-big" onClick={() => speak(q.w.en)}>🔊</button>
                <button className="link" onClick={() => speak(q.w.en, { slow: true })}>🐢 langsamer</button>
              </>
            )}
            {q.type === 'gap' && (
              <>
                <p className="quiz-ask">{q.topic.en}</p>
                <p className="gap-sentence">
                  {q.e.q.split('___')[0]}
                  <span className={`gap ${picked ? 'ok' : ''}`}>{picked ? q.e.a : '?'}</span>
                  {q.e.q.split('___')[1]}
                </p>
                <p className="ex-de">{q.e.de}</p>
              </>
            )}
          </div>
          <div className="options">
            {q.type === 'gap'
              ? q.e.o.map((o) => {
                  const cls = picked ? (o === q.e.a ? 'right' : o === picked ? 'wrong' : 'dim') : ''
                  return <button key={o} className={`option ${cls}`} onClick={() => { choose(o === q.e.a, o); speak(q.e.q.replace('___', q.e.a)) }}>{o}</button>
                })
              : q.options.map((o) => {
                  const cls = picked ? (o.id === q.w.id ? 'right' : o.id === picked ? 'wrong' : 'dim') : ''
                  return (
                    <button key={o.id} className={`option ${cls}`} onClick={() => { choose(o.id === q.w.id, o.id); if (q.type === 'de2en') speak(q.w.en) }}>
                      {q.type === 'listen' ? o.de : o.en}
                    </button>
                  )
                })}
          </div>
          {picked && (
            <div className={`feedback ${(q.type === 'gap' ? picked === q.e.a : picked === q.w.id) ? 'good' : 'bad'}`}>
              <p>
                <strong>{(q.type === 'gap' ? picked === q.e.a : picked === q.w.id) ? 'Richtig! 🎉' : 'Nicht ganz.'}</strong>{' '}
                {q.type === 'gap' ? q.e.why : `${q.w.en} = ${q.w.de}`}
              </p>
              <button className="btn primary wide" onClick={next}>Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export const COURSE_WORD_COUNT = ALL_WORDS.length
