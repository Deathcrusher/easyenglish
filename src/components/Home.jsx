import { useEffect, useState } from 'react'
import { useApp } from '../App.jsx'
import { ALL_WORDS } from '../data/vocab.js'
import { TENSES } from '../data/grammar.js'
import { PHRASES } from '../data/speaking.js'
import { dayKey, addDays, isDue, streakOf, LEARNED_BOX } from '../lib/storage.js'
import { speak, englishVoices } from '../lib/speech.js'
import { achievements } from '../data/achievements.js'
import Lesson, { dayIndex } from './Lesson.jsx'

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export default function Home() {
  const { state, go, update, reset, replace, route } = useApp()
  const [settings, setSettings] = useState(false)
  const [showAll, setShowAll] = useState(false)
  if (route?.lesson) return <Lesson />
  const lessonsToday = state.lessonDay === dayKey()
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

      {settings && <Settings state={state} update={update} reset={reset} replace={replace} close={() => setSettings(false)} />}

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

      <button className={`hero-card lesson-cta ${lessonsToday ? 'done' : ''}`} onClick={() => go('home', { lesson: true })}>
        <div>
          <strong>{lessonsToday ? '✅ Lektion nochmal machen' : '▶ Heutige Lektion starten'}</strong>
          <span>Vokabeln, {tense.en}, Sätze & Sprechen – ca. 10 Min.</span>
        </div>
        <span className="arrow">→</span>
      </button>

      <h2 className="section-title">Oder einzeln üben</h2>
      <div className="todo">
        <button className="todo-item" onClick={() => go('vocab', { mode: 'cards', topic: 'all' })}>
          <span className="todo-icon">📚</span>
          <span className="todo-text">
            <strong>{due > 0 ? `${due} ${due === 1 ? "Vokabel" : "Vokabeln"} wiederholen` : 'Neue Vokabeln lernen'}</strong>
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

      <Achievements state={state} showAll={showAll} setShowAll={setShowAll} />

      <p className="note center">So gibt's XP: Vokabel gewusst +3 · Quiz richtig +2 · Satz gebaut +3 · gut nachgesprochen +3</p>
    </div>
  )
}

function Achievements({ state, showAll, setShowAll }) {
  const list = achievements(state)
  const done = list.filter((a) => a.done).length
  const shown = showAll ? list : [...list.filter((a) => a.done), ...list.filter((a) => !a.done)].slice(0, 6)
  return (
    <>
      <h2 className="section-title">Erfolge · {done}/{list.length}</h2>
      <div className="badges">
        {shown.map((a) => (
          <div key={a.id} className={`badge-card ${a.done ? 'got' : ''}`}>
            <span className="b-icon">{a.icon}</span>
            <strong>{a.title}</strong>
            <small>{a.desc}</small>
            {!a.done && (
              <div className="b-bar"><div style={{ width: `${Math.min(100, (a.v / a.max) * 100)}%` }} /></div>
            )}
          </div>
        ))}
      </div>
      <button className="link skip" onClick={() => setShowAll(!showAll)}>{showAll ? 'Weniger anzeigen' : 'Alle Erfolge anzeigen'}</button>
    </>
  )
}

function VoicePicker({ state, update }) {
  const [voices, setVoices] = useState(() => englishVoices())
  useEffect(() => {
    const load = () => setVoices(englishVoices())
    load()
    const t = setTimeout(load, 600)
    window.speechSynthesis?.addEventListener?.('voiceschanged', load)
    return () => {
      clearTimeout(t)
      window.speechSynthesis?.removeEventListener?.('voiceschanged', load)
    }
  }, [])
  if (!voices.length) return null
  return (
    <label className="field">
      <span>Stimme</span>
      <select
        value={state.voice}
        onChange={(e) => {
          update({ voice: e.target.value })
          setTimeout(() => speak('Hello! Nice to meet you.'), 60)
        }}
      >
        <option value="">Automatisch (beste Stimme)</option>
        {voices.map((v) => (
          <option key={v.voiceURI} value={v.voiceURI}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
      <small className="note" style={{ marginTop: 2 }}>Klingt die Stimme komisch? Probier eine andere – am Handy gibt es oft mehrere.</small>
    </label>
  )
}

function Settings({ state, update, reset, replace, close }) {
  const [confirm, setConfirm] = useState(false)
  const [msg, setMsg] = useState('')

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: 'easy-english', v: 1, state }, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `easy-english-backup-${dayKey()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setMsg('✅ Backup-Datei heruntergeladen.')
  }

  function importData(e) {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((txt) => {
      try {
        const data = JSON.parse(txt)
        if (data.app !== 'easy-english' || !data.state?.cards) throw new Error('bad')
        replace({ ...state, ...data.state })
        setMsg('✅ Fortschritt wiederhergestellt!')
      } catch {
        setMsg('⚠️ Das ist keine gültige Easy-English-Backup-Datei.')
      }
    })
    e.target.value = ''
  }

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
      <VoicePicker state={state} update={update} />
      <label className="toggle plain">
        <input type="checkbox" checked={!!state.showIpa} onChange={(e) => update({ showIpa: e.target.checked })} />
        <span>Zusätzlich internationale Lautschrift (IPA) anzeigen</span>
      </label>
      <div className="field">
        <span>Neue Wörter pro Runde</span>
        <div className="seg">
          {[5, 8, 12].map((n) => (
            <button key={n} className={state.newPerSession === n ? 'on' : ''} onClick={() => update({ newPerSession: n })}>{n}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Backup</span>
        <p className="note" style={{ marginTop: 0 }}>Der Fortschritt liegt nur auf diesem Gerät. Mit einem Backup kannst du ihn sichern oder aufs neue Handy mitnehmen.</p>
        <div className="btn-row" style={{ marginTop: 6 }}>
          <button className="btn ghost" onClick={exportData}>💾 Sichern</button>
          <label className="btn ghost file-btn">
            📂 Wiederherstellen
            <input type="file" accept="application/json,.json" onChange={importData} hidden />
          </label>
        </div>
        {msg && <p className="note">{msg}</p>}
      </div>
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
