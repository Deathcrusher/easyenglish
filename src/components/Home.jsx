import { useState } from 'react'
import { useApp } from '../App.jsx'
import { ALL_WORDS } from '../data/vocab.js'
import { TENSES } from '../data/grammar.js'
import { PHRASES } from '../data/speaking.js'
import { dayKey, addDays, isDue, streakOf, LEARNED_BOX } from '../lib/storage.js'
import { speak } from '../lib/speech.js'

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function dayIndex() {
  const d = new Date()
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
}

export default function Home() {
  const { state, go, update, reset } = useApp()
  const [settings, setSettings] = useState(false)
  const today = dayKey()
  const xp = state.days[today] || 0
  const goal = state.goal
  const pct = Math.min(1, xp / goal)
  const streak = streakOf(state.days, goal)
  const due = ALL_WORDS.filter((w) => isDue(state.cards[w.id])).length
  const learned = ALL_WORDS.filter((w) => (state.cards[w.id]?.box || 0) >= LEARNED_BOX).length
  const seen = ALL_WORDS.filter((w) => state.cards[w.id]).length
  const tense = TENSES[dayIndex() % TENSES.length]
  const phrase = PHRASES[dayIndex() % PHRASES.length]
  const hour = new Date().getHours()
  const hello = hour < 11 ? 'Good morning' : hour < 18 ? 'Hi' : 'Good evening'

  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(today, i - 6)
    const [y, m, d] = k.split('-').map(Number)
    return { k, xp: state.days[k] || 0, name: DAY_NAMES[new Date(y, m - 1, d).getDay()] }
  })

  const R = 52
  const C = 2 * Math.PI * R

  return (
    <div>
      <header className="home-head">
        <div>
          <p className="hello">{hello}{state.name ? `, ${state.name}` : ''}! 👋</p>
          <h1>Bereit für heute?</h1>
        </div>
        <button className="icon-btn" onClick={() => setSettings(!settings)} aria-label="Einstellungen">⚙️</button>
      </header>

      {settings && <Settings state={state} update={update} reset={reset} close={() => setSettings(false)} />}

      <section className="card goal-card">
        <svg viewBox="0 0 120 120" className="ring">
          <circle cx="60" cy="60" r={R} className="ring-bg" />
          <circle
            cx="60" cy="60" r={R}
            className="ring-fg"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 60 60)"
          />
          <text x="60" y="58" textAnchor="middle" className="ring-num">{xp}</text>
          <text x="60" y="76" textAnchor="middle" className="ring-sub">von {goal} XP</text>
        </svg>
        <div className="goal-info">
          <div className="streak">
            <span className="flame">{streak > 0 ? '🔥' : '🌱'}</span>
            <div>
              <strong>{streak} {streak === 1 ? 'Tag' : 'Tage'}</strong>
              <small>in Folge</small>
            </div>
          </div>
          <p className="goal-text">
            {pct >= 1 ? 'Tagesziel geschafft! 🎉 Alles extra ist Bonus.' : `Noch ${goal - xp} XP bis zum Tagesziel.`}
          </p>
          <div className="week">
            {week.map((d) => (
              <div key={d.k} className={`wday ${d.xp >= goal ? 'full' : d.xp > 0 ? 'some' : ''} ${d.k === today ? 'today' : ''}`}>
                <span className="wdot" />
                <small>{d.name}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <h2 className="section-title">Deine Mini-Lektion für heute</h2>
      <div className="todo">
        <button className="todo-item" onClick={() => go('vocab', { mode: 'cards', topic: 'all' })}>
          <span className="todo-icon">📚</span>
          <span className="todo-text">
            <strong>{due > 0 ? `${due} Vokabeln wiederholen` : 'Neue Vokabeln lernen'}</strong>
            <small>{learned} Wörter sitzen · {seen} von {ALL_WORDS.length} gesehen</small>
          </span>
          <span className="arrow">→</span>
        </button>
        <button className="todo-item" onClick={() => go('grammar', { tense: tense.id })} style={{ '--c': tense.color }}>
          <span className="todo-icon">⏳</span>
          <span className="todo-text">
            <strong>Zeit des Tages: {tense.en}</strong>
            <small>{tense.oneLiner}</small>
          </span>
          <span className="arrow">→</span>
        </button>
        <button className="todo-item" onClick={() => go('sentences')}>
          <span className="todo-icon">🧩</span>
          <span className="todo-text">
            <strong>Sätze bauen</strong>
            <small>Wortstellung üben – mit Tipps</small>
          </span>
          <span className="arrow">→</span>
        </button>
      </div>

      <section className="card phrase-day">
        <p className="quiz-ask">Satz des Tages 🎤</p>
        <p className="phrase">{phrase.en}</p>
        <p className="ex-de">{phrase.de}</p>
        <div className="btn-row">
          <button className="btn ghost" onClick={() => speak(phrase.en, { slow: true })}>🐢 Langsam</button>
          <button className="btn primary" onClick={() => go('speak', { phrases: phrase.lvl })}>Nachsprechen</button>
        </div>
      </section>

      <p className="note center">So gibt's XP: Vokabel gewusst +3 · Quiz richtig +2 · Satz gebaut +3 · gut nachgesprochen +3</p>
    </div>
  )
}

function Settings({ state, update, reset, close }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <section className="card settings">
      <h3>Einstellungen</h3>
      <label className="field">
        <span>Name</span>
        <input value={state.name} onChange={(e) => update({ name: e.target.value })} maxLength={20} />
      </label>
      <div className="field">
        <span>Tagesziel</span>
        <div className="seg">
          {[[15, 'Locker'], [30, 'Normal'], [50, 'Ehrgeizig']].map(([g, l]) => (
            <button key={g} className={state.goal === g ? 'on' : ''} onClick={() => update({ goal: g })}>
              {l}<small>{g} XP</small>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Aussprache</span>
        <div className="seg">
          {[['us', '🇺🇸 Amerikanisch'], ['gb', '🇬🇧 Britisch']].map(([a, l]) => (
            <button key={a} className={state.accent === a ? 'on' : ''} onClick={() => { update({ accent: a }); setTimeout(() => speak('Hello! How are you today?'), 50) }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Neue Wörter pro Runde</span>
        <div className="seg">
          {[5, 8, 12].map((n) => (
            <button key={n} className={state.newPerSession === n ? 'on' : ''} onClick={() => update({ newPerSession: n })}>{n}</button>
          ))}
        </div>
      </div>
      <p className="note">Dein Fortschritt wird nur auf diesem Gerät gespeichert.</p>
      <div className="btn-row">
        {confirm ? (
          <button className="btn danger" onClick={() => { reset(); setConfirm(false); close() }}>Wirklich alles löschen?</button>
        ) : (
          <button className="btn ghost" onClick={() => setConfirm(true)}>Fortschritt zurücksetzen</button>
        )}
        <button className="btn primary" onClick={close}>Fertig</button>
      </div>
    </section>
  )
}
