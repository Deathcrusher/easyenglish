import { useMemo, useState } from 'react'
import { useApp } from '../App.jsx'
import { SENTENCES } from '../data/grammar.js'
import { speak } from '../lib/speech.js'
import { Listen, MicCheck, Progress, shuffle } from './ui.jsx'

const clean = (s) => s.replace(/[.,!?]/g, '')

// Erstes Wort klein schreiben, damit der Großbuchstabe nicht verrät, was vorne steht
function tokensOf(en) {
  const t = clean(en).split(/\s+/).filter(Boolean)
  if (t.length && !/^I('|$)/.test(t[0])) t[0] = t[0].charAt(0).toLowerCase() + t[0].slice(1)
  return t
}

export default function Sentences() {
  const { addXp } = useApp()
  const order = useMemo(() => shuffle(SENTENCES), [])
  const [i, setI] = useState(0)
  const item = order[i % order.length]
  const solution = useMemo(() => tokensOf(item.en), [item])
  const [pool, setPool] = useState(() => shuffle(solution.map((w, k) => ({ w, k }))))
  const [built, setBuilt] = useState([])
  const [status, setStatus] = useState(null) // null | 'ok' | 'no'
  const [showTip, setShowTip] = useState(false)
  const [streak, setStreak] = useState(0)

  function next() {
    const n = i + 1
    const it = order[n % order.length]
    setI(n)
    setPool(shuffle(tokensOf(it.en).map((w, k) => ({ w, k }))))
    setBuilt([])
    setStatus(null)
    setShowTip(false)
  }

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
    if (ok) {
      addXp(showTip ? 2 : 3)
      setStreak((s) => s + 1)
      speak(item.en)
    } else {
      setStreak(0)
    }
  }
  function reset() {
    setPool(shuffle(solution.map((w, k) => ({ w, k }))))
    setBuilt([])
    setStatus(null)
  }

  // Position des ersten Fehlers für die Hilfe
  const firstWrong = built.findIndex((t, idx) => t.w !== solution[idx])

  return (
    <div>
      <header className="page-head">
        <h1>Sätze bauen</h1>
        <p className="sub">Bring die englischen Wörter in die richtige Reihenfolge.</p>
      </header>

      <div className="session-top plain">
        <Progress value={i % order.length} max={order.length} />
        <span className="count">{streak > 1 ? `🔥 ${streak}` : `${(i % order.length) + 1}/${order.length}`}</span>
      </div>

      <section className="card">
        <p className="quiz-ask">Übersetze:</p>
        <p className="de-sentence">{item.de}</p>

        <div className={`build-area ${status || ''}`}>
          {built.length === 0 && <span className="placeholder">Tippe unten auf die Wörter …</span>}
          {built.map((t, idx) => (
            <button
              key={t.k}
              className={`token placed ${status === 'no' && idx === firstWrong ? 'bad' : ''}`}
              onClick={() => remove(t)}
            >
              {t.w}
            </button>
          ))}
        </div>

        <div className="token-pool">
          {pool.map((t) => (
            <button key={t.k} className="token" onClick={() => add(t)}>{t.w}</button>
          ))}
        </div>

        {status === 'no' && (
          <p className="note warn">Fast! Das markierte Wort steht noch falsch. Tippe es an, um es zurückzulegen.</p>
        )}

        {showTip && status !== 'ok' && <p className="tip">💡 {item.tip}</p>}

        {status === 'ok' ? (
          <div className="feedback good">
            <p><strong>Richtig! 🎉</strong> {item.en}</p>
            <p className="tip">💡 {item.tip}</p>
            <Listen text={item.en} />
            <MicCheck target={item.en} compact />
            <button className="btn primary wide" onClick={next}>Nächster Satz</button>
          </div>
        ) : (
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setShowTip(true)} disabled={showTip}>💡 Tipp</button>
            <button className="btn ghost" onClick={reset}>↺</button>
            <button className="btn primary" onClick={check} disabled={pool.length > 0}>Prüfen</button>
          </div>
        )}
      </section>

      <button className="link skip" onClick={next}>Satz überspringen →</button>
    </div>
  )
}
