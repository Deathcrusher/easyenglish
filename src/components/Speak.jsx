import { useState } from 'react'
import { useApp } from '../App.jsx'
import { SOUNDS, PHRASES } from '../data/speaking.js'
import { speak, canListen } from '../lib/speech.js'
import { Listen, MicCheck } from './ui.jsx'

export default function Speak() {
  const { route, setRoute } = useApp()
  if (route?.sound) return <SoundDetail id={route.sound} />
  if (route?.phrases) return <PhrasePractice level={route.phrases} />

  return (
    <div>
      <header className="page-head">
        <h1>Aussprache</h1>
        <p className="sub">Anhören, langsam anhören, nachsprechen – die App sagt dir, welche Wörter sie verstanden hat.</p>
      </header>

      {!canListen() && (
        <p className="note warn">🎤 Nachsprechen funktioniert in Chrome (Android/PC) und Safari (iPhone). Anhören geht überall.</p>
      )}

      <h2 className="section-title">Nachsprechen</h2>
      <div className="mode-row">
        {[[1, '🌱', 'Leicht', 'Alltagssätze'], [2, '🌿', 'Mittel', 'Mit Zeiten'], [3, '🌳', 'Knifflig', 'Zungenbrecher']].map(([l, e, t, s]) => (
          <button key={l} className="mode" onClick={() => setRoute({ phrases: l })}>
            <span>{e}</span><strong>{t}</strong><small>{s}</small>
          </button>
        ))}
      </div>

      <h2 className="section-title">Knifflige Laute für Deutschsprachige</h2>
      <div className="sound-list">
        {SOUNDS.map((s) => (
          <button key={s.id} className="sound-item" onClick={() => setRoute({ sound: s.id })}>
            <span className="si-icon">{s.icon}</span>
            <span className="si-text">
              <strong>{s.title}</strong>
              <small>/{s.ipa}/</small>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>

      <section className="card">
        <h3>So liest du die Lautschrift</h3>
        <p className="note">Die Zeichen zwischen /…/ zeigen, wie ein Wort klingt. Die wichtigsten:</p>
        <div className="ipa-table">
          {[
            ['θ', 'think', 'th ohne Stimme'],
            ['ð', 'the', 'th mit Stimme'],
            ['æ', 'cat', 'offenes ä'],
            ['ʌ', 'cup', 'kurzes a'],
            ['ə', 'about', 'schwaches e'],
            ['ɪ', 'sit', 'kurzes i'],
            ['iː', 'see', 'langes i'],
            ['ʃ', 'she', 'sch'],
            ['tʃ', 'chair', 'tsch'],
            ['dʒ', 'job', 'dsch'],
            ['ŋ', 'sing', 'ng'],
            ['w', 'water', 'u-artig'],
            ['ˈ', 'ˈhappy', 'Betonung danach'],
          ].map(([sym, ex, de]) => (
            <button key={sym} className="ipa-cell" onClick={() => speak(ex.replace('ˈ', ''))}>
              <span className="ipa-sym">{sym}</span>
              <span>{ex}</span>
              <small>{de}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function SoundDetail({ id }) {
  const { setRoute, addXp } = useApp()
  const s = SOUNDS.find((x) => x.id === id)
  return (
    <div>
      <button className="back" onClick={() => setRoute(null)}>← Aussprache</button>
      <header className="page-head">
        <h1>{s.icon} {s.title}</h1>
        <p className="sub">/{s.ipa}/</p>
      </header>

      <section className="card">
        <p>{s.explain}</p>
        <h3>So geht's</h3>
        <ol className="when">{s.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
      </section>

      <section className="card">
        <h3>Hör den Unterschied</h3>
        <p className="note">Tippe beide Wörter nacheinander an.</p>
        <div className="pairs">
          {s.pairs.map(([a, b]) => (
            <div key={a} className="pair">
              <button className="pair-btn main" onClick={() => speak(a, { slow: true })}>🔊 {a}</button>
              <span className="vs">vs</span>
              <button className="pair-btn" onClick={() => speak(b, { slow: true })}>🔊 {b}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Jetzt du!</h3>
        {s.practice.map((p) => (
          <div key={p} className="practice">
            <div className="example-row">
              <p className="ex-en">{p}</p>
              <Listen text={p} small />
            </div>
            <MicCheck target={p} compact onScore={(sc) => sc >= 0.65 && addXp(2)} />
          </div>
        ))}
      </section>
    </div>
  )
}

function PhrasePractice({ level }) {
  const { setRoute, addXp } = useApp()
  const list = PHRASES.filter((p) => p.lvl === level)
  const [i, setI] = useState(0)
  const [showDe, setShowDe] = useState(false)
  const p = list[i]
  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={() => setRoute(null)}>✕</button>
        <span className="count">{i + 1}/{list.length}</span>
      </div>
      <section className="card phrase-card">
        <p className="phrase">{p.en}</p>
        {showDe ? <p className="ex-de">{p.de}</p> : <button className="link" onClick={() => setShowDe(true)}>Was heißt das?</button>}
        <Listen text={p.en} />
        <MicCheck key={p.en} target={p.en} onScore={(sc) => sc >= 0.65 && addXp(3)} />
      </section>
      <div className="btn-row">
        <button className="btn ghost" disabled={i === 0} onClick={() => { setI(i - 1); setShowDe(false) }}>← Zurück</button>
        <button className="btn primary" onClick={() => { setI((i + 1) % list.length); setShowDe(false) }}>Weiter →</button>
      </div>
    </div>
  )
}
