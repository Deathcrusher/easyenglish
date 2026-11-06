import { useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { IRREGULAR } from '../data/grammar.js'
import { GRAMMAR, GRAMMAR_BY_ID, EXERCISES } from '../data/grammar-all.js'
import { LEVELS } from '../data/units.js'
import { speak } from '../lib/speech.js'
import { Listen, Progress, Timeline, shuffle } from './ui.jsx'

export default function Grammar() {
  const { route, setRoute, state } = useApp()
  if (route?.topic) return <GrammarDetail id={route.topic} onBack={() => setRoute(null)} onPractice={() => setRoute({ quiz: route.topic })} />
  if (route?.quiz) return <GapQuiz tense={route.quiz} onBack={() => setRoute(route.quiz === 'mix' || route.quiz === 'mistakes' ? null : { topic: route.quiz })} />
  if (route?.irregular) return <Irregular onBack={() => setRoute(null)} />
  if (route?.compare) return <PastVsPerfect onBack={() => setRoute(null)} />

  const mistakes = Object.keys(state.gapMistakes || {}).filter((k) => k.includes(':')).length

  return (
    <div>
      <header className="page-head">
        <h1>Grammatik</h1>
        <p className="sub">30 Themen von A1 bis B1 – einfach auf Deutsch erklärt, mit Übungen.</p>
      </header>

      {mistakes > 0 && (
        <button className="hero-card" onClick={() => setRoute({ quiz: 'mistakes' })}>
          <div>
            <strong>🎯 Fehler-Training</strong>
            <span>{mistakes} {mistakes === 1 ? 'Frage, die' : 'Fragen, die'} noch nicht sitzen</span>
          </div>
          <span className="arrow">→</span>
        </button>
      )}

      <div className="mode-row">
        <button className="mode" onClick={() => setRoute({ compare: true })}>
          <span>⚠️</span><strong>Die größte Falle</strong><small>„Ich habe … gemacht“</small>
        </button>
        <button className="mode" onClick={() => setRoute({ irregular: true })}>
          <span>📋</span><strong>Unregelmäßige Verben</strong><small>go – went – gone</small>
        </button>
        <button className="mode" onClick={() => setRoute({ quiz: 'mix' })}>
          <span>🎲</span><strong>Mix-Quiz</strong><small>10 Fragen quer durch</small>
        </button>
      </div>

      {LEVELS.map((l) => (
        <div key={l.id}>
          <h2 className="section-title">{l.title}</h2>
          <div className="tense-list">
            {GRAMMAR.filter((g) => g.level === l.id).map((g) => {
              const best = state.tenseDone[g.id]
              return (
                <button key={g.id} className="tense-item" onClick={() => setRoute({ topic: g.id })} style={{ '--c': g.color }}>
                  <div className="ti-bar" />
                  <div className="ti-text">
                    <strong>{g.en}</strong>
                    <span>{g.de}</span>
                    <small>Lektion {g.unitNum} · {g.oneLiner}</small>
                  </div>
                  {best !== undefined && <span className="ti-score">{best}/{g.ex.length}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function GrammarDetail({ id, onBack, onPractice, backLabel = '← Grammatik' }) {
  const t = GRAMMAR_BY_ID[id]
  return (
    <div style={{ '--c': t.color }}>
      <button className="back" onClick={onBack}>{backLabel}</button>
      <header className="page-head tense-head">
        <p className="eyebrow">{t.level} · Lektion {t.unitNum}</p>
        <h1>{t.en}</h1>
        <p className="sub">{t.de}</p>
      </header>

      <section className="card">
        {t.timeline && <Timeline kind={t.timeline} color={t.color} />}
        <p className="one-liner">{t.oneLiner}</p>
      </section>

      <section className="card">
        <h3>Wann benutze ich das?</h3>
        <ul className="when">
          {t.when.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      </section>

      <section className="card">
        <h3>So geht's</h3>
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

      {t.signals?.length > 0 && (
        <section className="card">
          <h3>{t.signalsTitle || 'Merkwörter'}</h3>
          <div className="chips">
            {t.signals.map((s) => (
              <button key={s} className="chip" onClick={() => speak(s.split(' – ')[0].replace(/[…+→].*$/, '').trim() || s)}>{s}</button>
            ))}
          </div>
        </section>
      )}

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

      <button className="btn primary wide sticky-cta" onClick={onPractice}>
        Jetzt üben ✏️ ({t.ex.length} Fragen)
      </button>
    </div>
  )
}

export function GapQuiz({ tense, onFinish, onBack, onDone, count }) {
  const { addXp, update, state, markGap } = useApp()
  const plain = tense === 'mix' || tense === 'mistakes'
  const items = useMemo(() => {
    let pool
    if (tense === 'mix') pool = shuffle(EXERCISES).slice(0, 10)
    else if (tense === 'mistakes') pool = shuffle(EXERCISES.filter((g) => state.gapMistakes?.[g.id])).slice(0, 10)
    else pool = shuffle(EXERCISES.filter((g) => g.t === tense)).slice(0, count || 99)
    return pool.map((g) => ({ ...g, o: shuffle(g.o) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tense])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const q = items[i]

  if (!items.length) {
    return (
      <div className="center-box">
        <div className="big-emoji">🌟</div>
        <h2>Nichts zu üben</h2>
        <p>Hier ist gerade alles erledigt.</p>
        <button className="btn primary" onClick={onFinish || onBack}>Zurück</button>
      </div>
    )
  }

  if (!q) {
    if (onFinish) {
      return (
        <div className="center-box">
          <div className="big-emoji">✏️</div>
          <h2>{score} von {items.length} richtig</h2>
          <button className="btn primary" onClick={onFinish}>Weiter</button>
        </div>
      )
    }
    const ratio = score / items.length
    return (
      <div className="center-box">
        <div className="big-emoji">{ratio >= 0.8 ? '🏆' : ratio >= 0.5 ? '💪' : '🌱'}</div>
        <h2>{score} von {items.length} richtig</h2>
        <p>
          {tense === 'mistakes'
            ? 'Richtig beantwortete Fragen fliegen aus dem Fehler-Training raus.'
            : ratio === 1 ? 'Fehlerfrei – du hast es drauf!' : 'Falsche Antworten landen im Fehler-Training. Probier es gleich nochmal!'}
        </p>
        {tense !== 'mistakes' && (
          <button className="btn primary" onClick={() => { setI(0); setScore(0); setPicked(null) }}>Nochmal üben</button>
        )}
        <button className="btn ghost" onClick={onBack}>{plain ? 'Zurück' : 'Zur Erklärung'}</button>
      </div>
    )
  }

  const full = q.q.replace('___', q.a)

  function pick(o) {
    if (picked) return
    setPicked(o)
    const ok = o === q.a
    markGap(q.id, ok)
    if (ok) {
      setScore((s) => s + 1)
      addXp(2)
    }
    speak(full)
    if (i === items.length - 1) {
      const final = score + (ok ? 1 : 0)
      if (!plain) update({ tenseDone: { ...state.tenseDone, [tense]: Math.max(final, state.tenseDone[tense] || 0) } })
      onDone?.(final, items.length)
    }
  }

  const t = GRAMMAR_BY_ID[q.t]
  const parts = q.q.split('___')

  return (
    <div>
      <div className="session-top">
        <button className="back" onClick={onFinish || onBack}>✕</button>
        <Progress value={i} max={items.length} />
        <span className="count">{i + 1}/{items.length}</span>
      </div>

      <div className="quiz-q">
        <p className="quiz-ask">{plain ? 'Welche Form passt?' : t.en}</p>
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
          {plain && <p className="tag" style={{ '--c': t.color }}>{t.en}</p>}
          <button className="btn primary wide" onClick={() => { setPicked(null); setI(i + 1) }}>Weiter</button>
        </div>
      )}
    </div>
  )
}

function Irregular({ onBack }) {
  const [hide, setHide] = useState(false)
  const [shown, setShown] = useState({})
  return (
    <div>
      <button className="back" onClick={onBack}>← Grammatik</button>
      <header className="page-head">
        <h1>Unregelmäßige Verben</h1>
        <p className="sub">Grundform – Simple Past – 3. Form (für Present Perfect, Passiv & Past Perfect)</p>
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

function PastVsPerfect({ onBack }) {
  const { setRoute } = useApp()
  return (
    <div>
      <button className="back" onClick={onBack}>← Grammatik</button>
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
