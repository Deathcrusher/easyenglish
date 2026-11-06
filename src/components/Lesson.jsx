import { useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { SENTENCES } from '../data/grammar.js'
import { GRAMMAR_BY_ID } from '../data/grammar-all.js'
import { currentUnit } from '../lib/progress.js'
import { sentenceItems } from '../lib/sentences.js'
import { PHRASES } from '../data/speaking.js'
import { Flashcards } from './Vocab.jsx'
import { GapQuiz } from './Grammar.jsx'
import { SentenceTask } from './Sentences.jsx'
import { Listen, MicCheck, Timeline, shuffle } from './ui.jsx'
import { dayKey } from '../lib/storage.js'

export function dayIndex() {
  const d = new Date()
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

const STEPS = ['Wörter', 'Grammatik', 'Satz 1', 'Satz 2', 'Sprechen']

export default function Lesson() {
  const { go, addXp, count, state, update } = useApp()
  const [step, setStep] = useState(-1)
  const unit = currentUnit(state)
  const tense = GRAMMAR_BY_ID[unit.grammar]
  const phrase = PHRASES[dayIndex() % PHRASES.length]
  const sentences = useMemo(() => {
    const fromUnit = sentenceItems(unit, 2)
    return fromUnit.length === 2 ? fromUnit : shuffle(SENTENCES).slice(0, 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const next = () => {
    window.scrollTo({ top: 0 })
    setStep((s) => s + 1)
  }

  function finish() {
    addXp(5)
    count('lessons')
    update({ lessonDay: dayKey() })
    go('practice')
  }

  const header =
    step >= 0 && step < STEPS.length ? (
      <div className="lesson-steps">
        {STEPS.map((s, i) => (
          <div key={s} className={`ls ${i < step ? 'done' : i === step ? 'now' : ''}`}>
            <span className="ls-dot">{i < step ? '✓' : i + 1}</span>
            <small>{s}</small>
          </div>
        ))}
      </div>
    ) : null

  if (step === -1) {
    return (
      <div>
        <button className="back" onClick={() => go('practice')}>← Üben</button>
        <header className="page-head">
          <h1>Tagesmix</h1>
          <p className="sub">Etwa 10 Minuten, passend zu Lektion {unit.num} ({unit.title}). Fünf kurze Schritte – danach hast du für heute richtig was geschafft.</p>
        </header>
        <section className="card">
          <ol className="lesson-plan">
            <li><span>📚</span> 6 Wörter lernen oder wiederholen</li>
            <li><span>📖</span> Grammatik: <strong>{tense.en}</strong></li>
            <li><span>🧩</span> 2 Sätze bauen</li>
            <li><span>🎤</span> Einen Satz nachsprechen</li>
          </ol>
        </section>
        <button className="btn primary wide" onClick={next}>Los geht's 🚀</button>
        {state.name && <p className="note center">Du schaffst das, {state.name}! 💪</p>}
      </div>
    )
  }

  if (step === 0) {
    return (
      <div>
        {header}
        <Flashcards topic="all" max={6} onFinish={next} />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div>
        {header}
        <section className="card" style={{ '--c': tense.color }}>
          <p className="quiz-ask">Kurz erinnert: {tense.en}</p>
          {tense.timeline && <Timeline kind={tense.timeline} color={tense.color} />}
          <p className="one-liner">{tense.oneLiner}</p>
          <div className="chips small center">
            {(tense.signals || []).slice(0, 5).map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        </section>
        <GapQuiz tense={tense.id} count={4} onFinish={next} />
      </div>
    )
  }

  if (step === 2 || step === 3) {
    return (
      <div>
        {header}
        <SentenceTask key={step} item={sentences[step - 2]} onDone={next} doneLabel="Weiter" />
      </div>
    )
  }

  if (step === 4) {
    return (
      <div>
        {header}
        <section className="card phrase-card">
          <p className="quiz-ask">Hör zu und sprich nach</p>
          <p className="phrase">{phrase.en}</p>
          <p className="ex-de">{phrase.de}</p>
          <Listen text={phrase.en} />
          <MicCheck target={phrase.en} onScore={(sc) => sc >= 0.65 && addXp(3)} />
        </section>
        <button className="btn primary wide" onClick={next}>Fertig</button>
      </div>
    )
  }

  return (
    <div className="center-box">
      <div className="big-emoji">🏅</div>
      <h2>Tagesmix geschafft!</h2>
      <p>Großartig! Dafür gibt's +5 Bonus-XP. Bis morgen – dranbleiben lohnt sich.</p>
      <button className="btn primary" onClick={finish}>Bonus abholen</button>
    </div>
  )
}
