import { useState } from 'react'
import { useApp } from '../App.jsx'
import { ALL_WORDS, LEVELS, UNITS } from '../data/units.js'
import { currentUnit, unitStatus, levelStats } from '../lib/progress.js'
import { dayKey, isDue, streakOf } from '../lib/storage.js'
import { InstallHint } from './Me.jsx'

const STEP_SHORT = { words: 'Wörter lernen', grammar: 'Grammatik', reading: 'Lesen', sentences: 'Sätze bauen', test: 'Lektionstest' }

// „Lernen“: ein klarer nächster Schritt + der Lernpfad. Sonst nichts.
export default function Home() {
  const { state, go, update } = useApp()
  const cur = currentUnit(state)
  const [level, setLevel] = useState(cur.level)
  const st = unitStatus(cur, state)
  const lvl = LEVELS.find((l) => l.id === cur.level)
  const xp = state.days[dayKey()] || 0
  const goal = state.goal
  const streak = streakOf(state.days, goal)
  const due = ALL_WORDS.filter((w) => isDue(state.cards[w.id])).length
  const hour = new Date().getHours()
  const hello = hour < 11 ? 'Good morning' : hour < 18 ? 'Hi' : 'Good evening'

  return (
    <div>
      <header className="learn-head">
        <div>
          <p className="hello">{hello}{state.name ? `, ${state.name}` : ''}! 👋</p>
          <h1>Lernen</h1>
        </div>
        <button className="stat-chips" onClick={() => go('me')} aria-label="Dein Fortschritt">
          <span>🔥 {streak}</span>
          <span>⚡ {xp}/{goal}</span>
        </button>
      </header>
      <div className="day-bar" title="Tagesziel">
        <span style={{ width: `${Math.min(100, (xp / goal) * 100)}%` }} />
      </div>

      <InstallHint state={state} update={update} openSettings={() => go('me')} />

      {!state.startLevel ? (
        <section className="card onboarding">
          <h3>Wo möchtest du starten?</h3>
          <p className="note" style={{ marginTop: 0 }}>Keine Sorge – alle Lektionen bleiben offen.</p>
          {[
            ['A1', '🌱', 'Ganz von vorne', 'Sich vorstellen, Zahlen, Alltag'],
            ['A2', '🌿', 'Die Basics sitzen', 'Vergangenheit, Reisen, Arbeit'],
            ['B1', '🌳', 'Ich kann schon einiges', 'Meinung sagen, Bewerbung, if-Sätze'],
          ].map(([id, e, t, d]) => (
            <button key={id} className="level-pick" onClick={() => { update({ startLevel: id }); setLevel(id) }}>
              <span className="lp-emoji">{e}</span>
              <span className="lp-text">
                <strong>{id} · {t}</strong>
                <small>{d}</small>
              </span>
              <span className="arrow">→</span>
            </button>
          ))}
        </section>
      ) : (
        <section className="continue-card" style={{ '--c': lvl.color }}>
          <span className="cc-eyebrow">Lektion {cur.num} von 30 · {cur.level}</span>
          <span className="cc-title">{cur.icon} {cur.title}</span>
          <div className="cc-dots">
            {st.steps.map((s) => (
              <span key={s.key} className={`cc-dot ${s.done ? 'done' : ''} ${st.next?.key === s.key ? 'now' : ''}`} title={STEP_SHORT[s.key]}>
                {s.done ? '✓' : s.icon}
              </span>
            ))}
          </div>
          <button className="cc-go" onClick={() => go('course', st.next ? { unit: cur.id, step: st.next.key } : { unit: cur.id })}>
            {st.next ? `Weiter: ${STEP_SHORT[st.next.key]}` : 'Lektion ansehen'} →
          </button>
        </section>
      )}

      {due > 0 && (
        <button className="review-row" onClick={() => go('vocab', { mode: 'cards', topic: 'all' })}>
          <span className="rr-icon">🔁</span>
          <span className="rr-text">
            <strong>{due} {due === 1 ? 'Wort' : 'Wörter'} wiederholen</strong>
            <small>Heute fällig · ca. {Math.max(1, Math.ceil(due / 6))} Min.</small>
          </span>
          <span className="arrow">→</span>
        </button>
      )}

      <h2 className="section-title">Dein Lernpfad</h2>
      <LevelTabs value={level} onChange={setLevel} />
      <UnitPath level={level} />
    </div>
  )
}

function LevelTabs({ value, onChange }) {
  const { state } = useApp()
  return (
    <div className="level-tabs">
      {levelStats(state).map((s) => (
        <button key={s.id} className={value === s.id ? 'on' : ''} onClick={() => onChange(s.id)} style={{ '--c': s.color }}>
          <strong>{s.short}</strong>
          <small>{s.done}/{s.units.length}</small>
        </button>
      ))}
    </div>
  )
}

export function UnitPath({ level }) {
  const { state, go } = useApp()
  const cur = currentUnit(state)
  const lvl = LEVELS.find((l) => l.id === level)
  return (
    <div className="path" style={{ '--c': lvl.color }}>
      {UNITS.filter((u) => u.level === level).map((u) => {
        const s = unitStatus(u, state)
        const isCur = u.id === cur.id
        return (
          <button key={u.id} className={`path-item ${s.complete ? 'done' : ''} ${isCur ? 'current' : ''}`} onClick={() => go('course', { unit: u.id })}>
            <span className="pi-node">{s.complete ? '✓' : u.icon}</span>
            <span className="pi-text">
              <strong>{u.num}. {u.title}</strong>
              <small>{s.complete ? 'Geschafft ✓' : isCur ? `Hier bist du · ${s.doneCount}/5 Schritte` : u.desc}</small>
            </span>
          </button>
        )
      })}
    </div>
  )
}
