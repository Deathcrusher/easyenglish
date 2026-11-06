import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../App.jsx'
import { READINGS, READING_BY_ID } from '../data/readings.js'
import { UNITS } from '../data/units.js'
import { lookupAt } from '../lib/dictionary.js'
import { speak, speakSequence, stopSpeaking } from '../lib/speech.js'
import { SayInline } from './ui.jsx'

const TOKEN = /([A-Za-z0-9’'-]+)|([^A-Za-z0-9’'-]+)/g

function tokenize(sentence) {
  const parts = []
  let m
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(sentence))) parts.push(m[1] ? { w: m[1] } : { p: m[2] })
  return parts
}

export function Reader({ id, onBack, onDone }) {
  const { state, update, addXp, count } = useApp()
  const r = READING_BY_ID[id]
  const unit = UNITS.find((u) => u.reading === id)
  const [showDe, setShowDe] = useState(false)
  const [openDe, setOpenDe] = useState({})
  const [playing, setPlaying] = useState(-1)
  const [slow, setSlow] = useState(false)
  const [pop, setPop] = useState(null)
  const [answers, setAnswers] = useState({})
  const stopRef = useRef(null)

  useEffect(() => () => stopRef.current?.(), [])

  const tokens = useMemo(() => r.s.map(([en]) => tokenize(en)), [r])

  function play() {
    if (playing >= 0) {
      stopRef.current?.()
      setPlaying(-1)
      return
    }
    stopRef.current = speakSequence(
      r.s.map(([en]) => en),
      { slow, onIndex: setPlaying, onEnd: () => setPlaying(-1) }
    )
  }

  function tapWord(si, ti) {
    const words = tokens[si].filter((t) => t.w).map((t) => t.w)
    const wi = tokens[si].slice(0, ti).filter((t) => t.w).length
    const res = lookupAt(words, wi, r.gloss)
    setPop(res)
    stopSpeaking()
    speak(res.word?.en?.replace(/^to /, '') || res.text)
  }

  const answered = Object.keys(answers).length
  const correct = r.q.filter((q, i) => answers[i] === q.a).length
  const finished = answered === r.q.length

  function answer(i, o) {
    if (answers[i] !== undefined) return
    const next = { ...answers, [i]: o }
    setAnswers(next)
    if (o === r.q[i].a) addXp(2)
    if (Object.keys(next).length === r.q.length && unit) {
      const score = r.q.filter((q, k) => next[k] === q.a).length
      const prev = state.units?.[unit.id] || {}
      update({ units: { ...state.units, [unit.id]: { ...prev, reading: Math.max(score, prev.reading || 0) } } })
      count('readings')
    }
  }

  return (
    <div className="reader">
      <button className="back" onClick={onBack}>← Zurück</button>
      <header className="page-head">
        <p className="eyebrow">{unit ? `Lektion ${unit.num} · ${unit.level}` : 'Lesetext'}</p>
        <h1>{r.title}</h1>
        <p className="sub">{r.titleDe}</p>
      </header>

      <div className="reader-tools">
        <button className={`btn ${playing >= 0 ? 'danger' : 'primary'}`} onClick={play}>
          {playing >= 0 ? '⏹ Stopp' : '▶ Vorlesen'}
        </button>
        <button className={`btn ghost ${slow ? 'on' : ''}`} onClick={() => setSlow(!slow)}>🐢 {slow ? 'langsam' : 'normal'}</button>
        <button className={`btn ghost ${showDe ? 'on' : ''}`} onClick={() => setShowDe(!showDe)}>🇩🇪 {showDe ? 'aus' : 'Deutsch'}</button>
      </div>
      <p className="note">💡 Tippe auf ein Wort für die Übersetzung – oder auf 🇩🇪 neben einem Satz.</p>

      <section className="card text-card">
        {r.s.map(([en, de], si) => (
          <div key={si} className={`rs ${playing === si ? 'playing' : ''}`}>
            <div className="rs-main">
              <p className="rs-en">
                {tokens[si].map((t, ti) =>
                  t.w ? (
                    <span key={ti} className="tw" onClick={() => tapWord(si, ti)}>{t.w}</span>
                  ) : (
                    <span key={ti}>{t.p}</span>
                  )
                )}
              </p>
              {(showDe || openDe[si]) && <p className="rs-de">{de}</p>}
            </div>
            <div className="rs-actions">
              <button className="rs-btn" onClick={() => speak(en, { slow })} aria-label="Satz anhören">🔊</button>
              <button className={`rs-btn ${showDe || openDe[si] ? 'on' : ''}`} onClick={() => setOpenDe((o) => ({ ...o, [si]: !o[si] }))} aria-label="Übersetzung">🇩🇪</button>
            </div>
          </div>
        ))}
      </section>

      <h2 className="section-title">Fragen zum Text</h2>
      {r.q.map((q, i) => (
        <section key={i} className="card question">
          <p className="q-en">{i + 1}. {q.q}</p>
          <p className="q-de">{q.de}</p>
          <div className="options">
            {q.o.map((o) => {
              const a = answers[i]
              const cls = a === undefined ? '' : o === q.a ? 'right' : o === a ? 'wrong' : 'dim'
              return (
                <button key={o} className={`option small ${cls}`} onClick={() => answer(i, o)}>{o}</button>
              )
            })}
          </div>
        </section>
      ))}

      {finished && (
        <div className={`feedback ${correct >= 2 ? 'good' : 'bad'}`}>
          <p><strong>{correct} von {r.q.length} richtig {correct === r.q.length ? '🎉' : correct >= 2 ? '👍' : ''}</strong></p>
          <p>{correct >= 2 ? 'Super verstanden!' : 'Lies den Text nochmal – tipp auf unbekannte Wörter.'}</p>
          {onDone && <button className="btn primary wide" onClick={onDone}>Weiter</button>}
          {!onDone && correct < 2 && (
            <button className="btn ghost wide" onClick={() => setAnswers({})}>Fragen nochmal beantworten</button>
          )}
        </div>
      )}

      {pop && (
        <div className="pop-backdrop" onClick={() => setPop(null)}>
          <div className="pop" onClick={(e) => e.stopPropagation()}>
            <div className="pop-head">
              <strong>{pop.text}</strong>
              <button className="icon-btn" onClick={() => speak(pop.word?.en?.replace(/^to /, '') || pop.text)}>🔊</button>
              <button className="icon-btn slow" onClick={() => speak(pop.word?.en?.replace(/^to /, '') || pop.text, { slow: true })}>🐢</button>
            </div>
            <SayInline text={pop.word?.en || pop.text} />
            {pop.de ? (
              <p className="pop-de">{pop.de}</p>
            ) : (
              <p className="note">Kein Eintrag – aber hör es dir an!</p>
            )}
            {pop.base && pop.word && <p className="note">Grundform: {pop.word.en}</p>}
            <button className="btn ghost wide" onClick={() => setPop(null)}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReadingList({ onOpen }) {
  const { state } = useApp()
  return (
    <div>
      <header className="page-head">
        <h1>Lesen</h1>
        <p className="sub">Die Geschichte von Mia in 30 Teilen – vom ersten „Hello“ bis zum neuen Job.</p>
      </header>
      <div className="reading-list">
        {READINGS.map((r) => {
          const unit = UNITS.find((u) => u.reading === r.id)
          const score = state.units?.[unit?.id]?.reading
          return (
            <button key={r.id} className="reading-item" onClick={() => onOpen(r.id)}>
              <span className="ri-num">{unit?.num}</span>
              <span className="ri-text">
                <strong>{r.title}</strong>
                <small>{r.titleDe} · {unit?.level}</small>
              </span>
              {score !== undefined ? <span className="ri-score">{score}/{r.q.length}</span> : <span className="arrow">→</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
