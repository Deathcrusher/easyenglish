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
              <small>{s.pairs.slice(0, 2).map((p) => p.join(' / ')).join(' · ')}</small>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>

      <LeseLegende />
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

export function LeseLegende() {
  return (
    <section className="card">
      <h3>So liest du die Lesehilfe</h3>
      <p className="note" style={{ marginTop: 0 }}>
        Die Lesehilfe schreibt englische Wörter so, wie du sie auf Deutsch lesen würdest. Tippe auf ein Beispiel zum Anhören.
      </p>
      <div className="legend">
        {[
          ['he·LOU', 'hello', 'Die farbige Silbe wird betont, · trennt die Silben.'],
          ['ej', 'make', '„ej“ wie in „hey“ – nicht wie deutsches „ei“!'],
          ['ai', 'time', '„ai“ wie im deutschen „Mai“'],
          ['ou', 'go', '„ou“: erst o, dann zu u gleiten'],
          ['ä', 'cat', 'Mund weit auf, offenes ä'],
          ['a', 'cup', 'kurzes, dumpfes a'],
          ['e', 'about', 'schwaches, kurzes e (unbetont)'],
          ['ör', 'girl', 'Zunge nach hinten biegen'],
          ['ii / uu', 'see / food', 'doppelt = lang'],
          ['th / dh', 'think / the', 'Zunge zwischen die Zähne (dh mit Stimme)'],
          ['u…', 'water', 'u am Silbenanfang = englisches w (Lippen rund)'],
          ['w', 'very', 'w wie im Deutschen = englisches v'],
          ['dsch / tsch', 'job / chair', 'wie geschrieben'],
          ['ß', 'stop', 'scharfes s: „ßtap“ – nicht „schtop“'],
        ].map(([sym, ex, de]) => (
          <button key={sym} className="legend-row" onClick={() => speak(ex.split(' / ')[0])}>
            <span className="legend-sym">{sym}</span>
            <span className="legend-text">
              <strong>{ex}</strong>
              <small>{de}</small>
            </span>
            <span>🔊</span>
          </button>
        ))}
      </div>
    </section>
  )
}
