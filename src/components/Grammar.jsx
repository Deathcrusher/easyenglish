import { useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { TENSES, TENSE_BY_ID, GAPS, IRREGULAR } from '../data/grammar.js'
import { speak } from '../lib/speech.js'
import { Listen, Progress, Timeline, shuffle } from './ui.jsx'

export default function Grammar() {
  const { route, setRoute, state } = useApp()
  if (route?.tense) return <TenseDetail id={route.tense} />
  if (route?.quiz) return <GapQuiz tense={route.quiz} />
  if (route?.irregular) return <Irregular />
  if (route?.compare) return <PastVsPerfect />

  return (
    <div>
      <header className="page-head">
        <h1>Die Zeiten</h1>
        <p className="sub">Jede Zeit mit Zeitstrahl, Bauplan, Signalwörtern und Übungen.</p>
      </header>

      <button className="hero-card warn" onClick={() => setRoute({ compare: true })}>
        <div>
          <strong>⚠️ Die größte Falle: „Ich habe … gemacht“</strong>
          <span>Simple Past oder Present Perfect? Hier einfach erklärt.</span>
        </div>
        <span className="arrow">→</span>
      </button>

      <div className="tense-list">
        {TENSES.map((t) => {
          const best = state.tenseDone[t.id]
          return (
            <button key={t.id} className="tense-item" onClick={() => setRoute({ tense: t.id })} style={{ '--c': t.color }}>
              <div className="ti-bar" />
              <div className="ti-text">
                <strong>{t.en}</strong>
                <span>{t.de}</span>
                <small>{t.oneLiner}</small>
              </div>
              {best !== undefined && <span className="ti-score">{best}/5</span>}
            </button>
          )
        })}
      </div>

      <div className="mode-row">
        <button className="mode" onClick={() => setRoute({ quiz: 'mix' })}>
          <span>🎲</span><strong>Mix-Quiz</strong><small>Welche Zeit passt?</small>
        </button>
        <button className="mode" onClick={() => setRoute({ irregular: true })}>
          <span>📋</span><strong>Unregelmäßige Verben</strong><small>go – went – gone</small>
        </button>
      </div>
    </div>
  )
}

function TenseDetail({ id }) {
  const { setRoute } = useApp()
  const t = TENSE_BY_ID[id]
  return (
    <div style={{ '--c': t.color }}>
      <button className="back" onClick={() => setRoute(null)}>← Alle Zeiten</button>
      <header className="page-head tense-head">
        <h1>{t.en}</h1>
        <p className="sub">{t.de}</p>
      </header>

      <section className="card">
        <Timeline kind={t.timeline} color={t.color} />
        <p className="one-liner">{t.oneLiner}</p>
      </section>

      <section className="card">
        <h3>Wann benutze ich das?</h3>
        <ul className="when">
          {t.when.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </section>

      <section className="card">
        <h3>So baust du den Satz</h3>
        <div className="forms">
          {t.forms.map((f, i) => (
            <div key={i} className="form-row">
              <span className="form-label">{f.label}</span>
              <code className="formula">{f.f}</code>
              <button className="form-ex" onClick={() => speak(f.ex)}>🔊 {f.ex}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Signalwörter – daran erkennst du sie</h3>
        <div className="chips">
          {t.signals.map((s) => <button key={s} className="chip" onClick={() => speak(s)}>{s}</button>)}
        </div>
      </section>

      <section className="card">
        <h3>Beispiele</h3>
        {t.examples.map(([en, de], i) => (
          <div key={i} className="example-row">
            <div>
              <p className="ex-en">{en}</p>
              <p className="ex-de">{de}</p>
            </div>
            <Listen text={en} small />
          </div>
        ))}
      </section>

      <section className="card mistake">
        <h3>Typischer Fehler</h3>
        <p className="wrong">✗ {t.mistake.wrong}</p>
        <p className="right">✓ {t.mistake.right}</p>
        <p className="why">{t.mistake.why}</p>
      </section>

      <button className="btn primary wide sticky-cta" onClick={() => setRoute({ quiz: id })}>
        Jetzt üben ✏️
      </button>
    </div>
  )
}

function GapQuiz({ tense }) {
  const { setRoute, addXp, update, state } = useApp()
  const items = useMemo(() => {
    const pool = tense === 'mix' ? shuffle(GAPS).slice(0, 10) : shuffle(GAPS.filter((g) => g.t === tense)).slice(0, 5)
    return pool.map((g) => ({ ...g, o: shuffle(g.o) }))
  }, [tense])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const q = items[i]
  const back = () => setRoute(tense === 'mix' ? null : { tense })

  if (!q) {
    return (
      <div className="center-box">
        <div className="big-emoji">{score / items.length >= 0.8 ? '🏆' : score / items.length >= 0.5 ? '💪' : '🌱'}</div>
        <h2>{score} von {items.length} richtig</h2>
        <p>{score === items.length ? 'Fehlerfrei – du hast es drauf!' : 'Schau dir die Erklärung nochmal an und probier es gleich nochmal.'}</p>
        <button className="btn primary" onClick={() => { setI(0); setScore(0); setPicked(null) }}>Nochmal üben</button>
        <button className="btn ghost" onClick={back}>{tense === 'mix' ? 'Zurück' : 'Zur Erklärung'}</button>
      </div>
    )
  }

  const full = q.q.replace('___', q.a)

  function pick(o) {
    if (picked) return
    setPicked(o)
    const ok = o === q.a
    if (ok) {
      setScore((s) => s + 1)
      addXp(2)
    }
    speak(full)
    const isLast = i === items.length - 1
    if (isLast && tense !== 'mix') {
      const final = score + (ok ? 1 : 0)
      update({ tenseDone: { ...state.tenseDone, [tense]: Math.max(final, state.tenseDone[tense] || 0) } })
    }
  }

  const t = TENSE_BY_ID[q.t]
  const parts = q.q.split('___')

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={back}>✕</button>
        <Progress value={i} max={items.length} />
        <span className="count">{i + 1}/{items.length}</span>
      </div>

      <div className="quiz-q">
        <p className="quiz-ask">{tense === 'mix' ? 'Welche Form passt?' : t.en}</p>
        <p className="gap-sentence">
          {parts[0]}
          <span className={`gap ${picked ? 'ok' : ''}`}>{picked ? q.a : '?'}</span>
          {parts[1]}
        </p>
        <p className="ex-de">{q.de}</p>
      </div>

      <div className="options">
        {q.o.map((o) => {
          const cls = picked ? (o === q.a ? 'right' : o === picked ? 'wrong' : 'dim') : ''
          return <button key={o} className={`option ${cls}`} onClick={() => pick(o)}>{o}</button>
        })}
      </div>

      {picked && (
        <div className={`feedback ${picked === q.a ? 'good' : 'bad'}`}>
          <p><strong>{picked === q.a ? 'Richtig! 🎉' : 'Nicht ganz.'}</strong> {q.why}</p>
          {tense === 'mix' && <p className="tag" style={{ '--c': t.color }}>{t.en}</p>}
          <button className="btn primary wide" onClick={() => { setPicked(null); setI(i + 1) }}>Weiter</button>
        </div>
      )}
    </div>
  )
}

function Irregular() {
  const { setRoute } = useApp()
  const [hide, setHide] = useState(false)
  const [shown, setShown] = useState({})
  return (
    <div>
      <button className="back" onClick={() => setRoute(null)}>← Zeiten</button>
      <header className="page-head">
        <h1>Unregelmäßige Verben</h1>
        <p className="sub">Grundform – Simple Past – 3. Form (für Present Perfect & Past Perfect)</p>
      </header>
      <label className="toggle">
        <input type="checkbox" checked={hide} onChange={(e) => { setHide(e.target.checked); setShown({}) }} />
        <span>Lernmodus: Formen verstecken (antippen zum Aufdecken)</span>
      </label>
      <div className="verb-table">
        <div className="vt-head"><span>Grundform</span><span>Past</span><span>3. Form</span></div>
        {IRREGULAR.map(([a, b, c, de]) => {
          const open = !hide || shown[a]
          return (
            <button key={a} className="vt-row" onClick={() => { setShown((s) => ({ ...s, [a]: true })); speak(`${a}, ${b.replace(' / ', ' or ')}, ${c.replace(' / ', ' or ')}`) }}>
              <span><strong>{a}</strong><small>{de}</small></span>
              <span className={open ? '' : 'masked'}>{open ? b : '???'}</span>
              <span className={open ? '' : 'masked'}>{open ? c : '???'}</span>
            </button>
          )
        })}
      </div>
      <p className="note">Tippe auf eine Zeile, um alle drei Formen zu hören.</p>
    </div>
  )
}

function PastVsPerfect() {
  const { setRoute } = useApp()
  return (
    <div>
      <button className="back" onClick={() => setRoute(null)}>← Zeiten</button>
      <header className="page-head">
        <h1>„Ich habe … gemacht“</h1>
        <p className="sub">Im Deutschen sagen wir fast immer „ich habe gemacht“. Im Englischen gibt es zwei Möglichkeiten.</p>
      </header>

      <section className="card split">
        <div className="split-col" style={{ '--c': '#b45309' }}>
          <h3>Simple Past</h3>
          <p><strong>WANN</strong> ist wichtig / bekannt.</p>
          <p className="ex-en">I <b>saw</b> him <u>yesterday</u>.</p>
          <p className="ex-de">Ich habe ihn gestern gesehen.</p>
          <div className="chips small">
            {['yesterday', 'last week', 'ago', 'in 2019', 'when …?'].map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
        <div className="split-col" style={{ '--c': '#dc2626' }}>
          <h3>Present Perfect</h3>
          <p><strong>DASS</strong> es passiert ist, ist wichtig – Ergebnis jetzt.</p>
          <p className="ex-en">I <b>have seen</b> this film.</p>
          <p className="ex-de">Ich habe den Film (schon) gesehen.</p>
          <div className="chips small">
            {['ever', 'never', 'already', 'yet', 'just', 'since', 'for'].map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Die Faustregel 👍</h3>
        <ol className="when">
          <li>Steht ein <strong>genauer Zeitpunkt</strong> in der Vergangenheit dabei? → <strong>Simple Past</strong>.</li>
          <li>Kein Zeitpunkt, aber das <strong>Ergebnis zählt jetzt</strong> oder es geht um „schon mal / noch nie“? → <strong>Present Perfect</strong>.</li>
          <li>„seit“ (since / for) und es dauert noch an? → <strong>Present Perfect</strong> – nicht Gegenwart wie im Deutschen!</li>
        </ol>
      </section>

      <section className="card">
        <h3>Vergleich zum Anhören</h3>
        {[
          ['I lost my phone last week.', 'Letzte Woche verloren (vielleicht schon wieder gefunden).'],
          ['I have lost my phone.', 'Es ist JETZT weg!'],
          ['I lived in Graz for two years.', 'Wohne nicht mehr dort.'],
          ['I have lived in Innsbruck for two years.', 'Wohne immer noch dort.'],
        ].map(([en, de]) => (
          <div key={en} className="example-row">
            <div><p className="ex-en">{en}</p><p className="ex-de">{de}</p></div>
            <Listen text={en} small />
          </div>
        ))}
      </section>

      <div className="mode-row">
        <button className="mode" onClick={() => setRoute({ quiz: 'past-simple' })}><span>✏️</span><strong>Simple Past üben</strong></button>
        <button className="mode" onClick={() => setRoute({ quiz: 'present-perfect' })}><span>✏️</span><strong>Present Perfect üben</strong></button>
      </div>
    </div>
  )
}
