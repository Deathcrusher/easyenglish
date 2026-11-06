import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { SENTENCES } from '../data/grammar.js'
import { UNITS } from '../data/units.js'
import { currentUnit } from '../lib/progress.js'
import { sentenceItems } from '../lib/sentences.js'
import { speak, words } from '../lib/speech.js'
import { Listen, MicCheck, Progress, shuffle } from './ui.jsx'

const clean = (s) => s.replace(/[.,!?]/g, '')

// Erstes Wort klein schreiben, damit der Großbuchstabe nicht verrät, was vorne steht
function tokensOf(en) {
  const t = clean(en).split(/\s+/).filter(Boolean)
  if (t.length && !/^I('|$)/.test(t[0])) t[0] = t[0].charAt(0).toLowerCase() + t[0].slice(1)
  return t
}

export default function Sentences() {
  const { state } = useApp()
  const [mode, setMode] = useState('build')
  const order = useMemo(() => {
    const upTo = currentUnit(state).num
    const fromUnits = UNITS.slice(0, upTo).flatMap((u) => sentenceItems(u, 3))
    return shuffle([...SENTENCES, ...fromUnits]).slice(0, 40)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [i, setI] = useState(0)
  const [streak, setStreak] = useState(0)
  const item = order[i % order.length]

  const next = (ok) => {
    setStreak((s) => (ok ? s + 1 : 0))
    setI((n) => n + 1)
  }

  return (
    <div>
      <header className="page-head">
        <h1>Sätze</h1>
        <p className="sub">
          {mode === 'build' ? 'Bring die englischen Wörter in die richtige Reihenfolge.' : 'Hör gut zu und schreib den Satz auf.'}
        </p>
      </header>

      <div className="seg big">
        <button className={mode === 'build' ? 'on' : ''} onClick={() => setMode('build')}>🧩 Bauen</button>
        <button className={mode === 'dictation' ? 'on' : ''} onClick={() => setMode('dictation')}>✍️ Diktat</button>
      </div>

      <div className="session-top plain">
        <Progress value={i % order.length} max={order.length} />
        <span className="count">{streak > 1 ? `🔥 ${streak}` : `${(i % order.length) + 1}/${order.length}`}</span>
      </div>

      {mode === 'build' ? (
        <SentenceTask key={`b${i}`} item={item} onDone={next} />
      ) : (
        <DictationTask key={`d${i}`} item={item} onDone={next} />
      )}

      <button className="link skip" onClick={() => next(false)}>Satz überspringen →</button>
    </div>
  )
}

export function SentenceTask({ item, onDone, doneLabel = 'Nächster Satz' }) {
  const { addXp, count } = useApp()
  const solution = useMemo(() => tokensOf(item.en), [item])
  const [pool, setPool] = useState(() => shuffle(solution.map((w, k) => ({ w, k }))))
  const [built, setBuilt] = useState([])
  const [status, setStatus] = useState(null) // null | 'ok' | 'no'
  const [showTip, setShowTip] = useState(false)
  const [tries, setTries] = useState(0)

  function add(t) {
    if (status === 'ok') return
    setBuilt((b) => [...b, t])
    setPool((p) => p.filter((x) => x.k !== t.k))
    setStatus(null)
  }
  function remove(t) {
    if (status === 'ok') return
    setPool((p) => [...p, t])
    setBuilt((b) => b.filter((x) => x.k !== t.k))
    setStatus(null)
  }
  function check() {
    const ok = built.map((t) => t.w).join(' ') === solution.join(' ')
    setStatus(ok ? 'ok' : 'no')
    setTries((n) => n + 1)
    if (ok) {
      addXp(showTip || tries > 0 ? 2 : 3)
      count('sentences')
      speak(item.en)
    }
  }
  function reset() {
    setPool(shuffle(solution.map((w, k) => ({ w, k }))))
    setBuilt([])
    setStatus(null)
  }

  const firstWrong = built.findIndex((t, idx) => t.w !== solution[idx])

  return (
    <section className="card">
      <p className="quiz-ask">Übersetze:</p>
      <p className="de-sentence">{item.de}</p>

      <div className={`build-area ${status || ''}`}>
        {built.length === 0 && <span className="placeholder">Tippe unten auf die Wörter …</span>}
        {built.map((t, idx) => (
          <button key={t.k} className={`token placed ${status === 'no' && idx === firstWrong ? 'bad' : ''}`} onClick={() => remove(t)}>
            {t.w}
          </button>
        ))}
      </div>

      <div className="token-pool">
        {pool.map((t) => (
          <button key={t.k} className="token" onClick={() => add(t)}>{t.w}</button>
        ))}
      </div>

      {status === 'no' && <p className="note warn">Fast! Das markierte Wort steht noch falsch. Tippe es an, um es zurückzulegen.</p>}
      {showTip && status !== 'ok' && <p className="tip">💡 {item.tip}</p>}

      {status === 'ok' ? (
        <div className="feedback good">
          <p><strong>Richtig! 🎉</strong> {item.en}</p>
          <p className="tip">💡 {item.tip}</p>
          <Listen text={item.en} />
          <MicCheck target={item.en} compact />
          <button className="btn primary wide" onClick={() => onDone(tries <= 1)}>{doneLabel}</button>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn ghost" onClick={() => setShowTip(true)} disabled={showTip}>💡 Tipp</button>
          <button className="btn ghost" onClick={reset} aria-label="Neu mischen">↺</button>
          <button className="btn primary" onClick={check} disabled={pool.length > 0}>Prüfen</button>
        </div>
      )}
    </section>
  )
}

function DictationTask({ item, onDone }) {
  const { addXp, count } = useApp()
  const [value, setValue] = useState('')
  const [result, setResult] = useState(null)
  const [showDe, setShowDe] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => speak(item.en), 300)
    return () => clearTimeout(t)
  }, [item])

  function check(e) {
    e.preventDefault()
    if (result) return onDone(result.score === 1)
    if (!value.trim()) return
    const target = words(item.en)
    const pool = words(value)
    const marks = target.map((w) => {
      const idx = pool.indexOf(w)
      if (idx >= 0) {
        pool.splice(idx, 1)
        return { w, ok: true }
      }
      return { w, ok: false }
    })
    const score = marks.filter((m) => m.ok).length / target.length
    setResult({ marks, score })
    if (score >= 0.8) {
      addXp(score === 1 ? 4 : 2)
      count('dictation')
    }
  }

  return (
    <section className="card">
      <p className="quiz-ask">Was hörst du?</p>
      <div className="dict-play">
        <button className="play-big" onClick={() => speak(item.en)} type="button">🔊</button>
        <button className="link" type="button" onClick={() => speak(item.en, { slow: true })}>🐢 langsamer</button>
        {!showDe && !result && (
          <button className="link muted" type="button" onClick={() => setShowDe(true)}>Hilfe: deutsche Bedeutung</button>
        )}
        {(showDe || result) && <p className="ex-de">{item.de}</p>}
      </div>
      <form onSubmit={check}>
        <textarea
          className={`write-input area ${result ? (result.score === 1 ? 'right' : result.score >= 0.8 ? 'typo' : 'wrong') : ''}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Schreib den englischen Satz …"
          rows={2}
          autoCapitalize="sentences"
          autoCorrect="off"
          spellCheck="false"
          readOnly={!!result}
        />
        {result && (
          <div className={`feedback ${result.score >= 0.8 ? 'good' : 'bad'}`}>
            <p>
              <strong>{result.score === 1 ? 'Perfekt! 🎉' : result.score >= 0.8 ? 'Fast alles richtig! 👍' : 'Hör nochmal genau hin.'}</strong>
            </p>
            <div className="mic-words left">
              {result.marks.map((m, k) => <span key={k} className={m.ok ? 'w-ok' : 'w-miss'}>{m.w}</span>)}
            </div>
            <p className="ex-en">{item.en}</p>
          </div>
        )}
        <button className="btn primary wide" type="submit">{result ? 'Nächster Satz' : 'Prüfen'}</button>
      </form>
    </section>
  )
}
