import { useState } from 'react'
import { speak, canListen, listen, compareSpeech } from '../lib/speech.js'
import { useApp } from '../App.jsx'
import { lesehilfe, plainLesehilfe } from '../lib/lesehilfe.js'

export function Listen({ text, small = false, label }) {
  return (
    <div className={`listen ${small ? 'small' : ''}`}>
      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); speak(text) }} aria-label="Anhören">
        🔊{label ? <span>{label}</span> : null}
      </button>
      <button className="icon-btn slow" onClick={(e) => { e.stopPropagation(); speak(text, { slow: true }) }} aria-label="Langsam anhören">
        🐢{!small && <span>langsam</span>}
      </button>
    </div>
  )
}

const ERRORS = {
  'not-allowed': 'Mikrofon ist blockiert. Bitte im Browser das Mikrofon erlauben.',
  'service-not-allowed': 'Mikrofon ist blockiert. Bitte im Browser das Mikrofon erlauben.',
  'no-speech': 'Ich habe nichts gehört. Nochmal probieren – etwas lauter!',
  'audio-capture': 'Kein Mikrofon gefunden.',
  network: 'Spracherkennung braucht Internet. Bitte Verbindung prüfen.',
  unsupported: 'Dieser Browser kann keine Sprache erkennen. Am besten Chrome oder Safari verwenden.',
}

export function MicCheck({ target, onScore, compact = false }) {
  const app = useApp()
  const [state, setState] = useState('idle') // idle | listening | done | error
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  if (!canListen()) {
    return <p className="note">🎤 Nachsprechen geht in Chrome (Android/PC) und Safari (iPhone).</p>
  }

  async function go() {
    setState('listening')
    setErr('')
    try {
      const alts = await listen()
      const r = compareSpeech(target, alts)
      setResult(r)
      setState('done')
      if (r.score >= 0.65) app?.count('spoken')
      onScore?.(r.score)
    } catch (e) {
      setErr(ERRORS[e] || 'Das hat nicht geklappt. Nochmal probieren!')
      setState('error')
    }
  }

  const pct = result ? Math.round(result.score * 100) : 0
  const verdict =
    pct >= 90 ? ['Perfekt! 🎉', 'good'] : pct >= 65 ? ['Sehr gut – fast alles verstanden! 👍', 'ok'] : ['Nochmal versuchen – hör dir erst die langsame Version an 🐢', 'bad']

  return (
    <div className={`mic ${compact ? 'compact' : ''}`}>
      <button className={`mic-btn ${state === 'listening' ? 'on' : ''}`} onClick={go} disabled={state === 'listening'}>
        {state === 'listening' ? '🎙️ Ich höre zu …' : '🎤 Nachsprechen'}
      </button>
      {state === 'error' && <p className="note warn">{err}</p>}
      {state === 'done' && result && (
        <div className={`mic-result ${verdict[1]}`}>
          <div className="mic-words">
            {result.marks.map((m, i) => (
              <span key={i} className={m.ok ? 'w-ok' : 'w-miss'}>{m.w}</span>
            ))}
          </div>
          <p className="mic-verdict">{verdict[0]}</p>
          <p className="mic-heard">Verstanden: „{result.heard}“</p>
        </div>
      )}
    </div>
  )
}

export function Progress({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100))
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// Zeitstrahl für die Zeiten
export function Timeline({ kind, color = 'var(--primary)' }) {
  const NOW = 200
  const y = 38
  const dot = (x, r = 6, c = color) => <circle cx={x} cy={y} r={r} fill={c} />
  let marks = null
  switch (kind) {
    case 'repeat':
      marks = [40, 80, 120, 160, 200, 240, 280].map((x) => <g key={x}>{dot(x, 5)}</g>)
      break
    case 'now':
      marks = (
        <>
          <rect x={NOW - 22} y={y - 7} width={44} height={14} rx={7} fill={color} opacity="0.35" />
          {dot(NOW, 7)}
        </>
      )
      break
    case 'pastPoint':
      marks = (
        <>
          {dot(90, 7)}
          <text x={90} y={y - 14} textAnchor="middle" className="tl-lbl">yesterday</text>
        </>
      )
      break
    case 'pastInterrupt':
      marks = (
        <>
          <rect x={50} y={y - 6} width={90} height={12} rx={6} fill={color} opacity="0.45" />
          <path d={`M108 ${y - 20} l-6 12 h8 l-6 14`} stroke="#dc2626" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={60} y={y - 14} className="tl-lbl">was cooking</text>
          <text x={118} y={y + 26} className="tl-lbl" fill="#dc2626">called!</text>
        </>
      )
      break
    case 'pastToNow':
      marks = (
        <>
          <rect x={70} y={y - 6} width={NOW - 70} height={12} rx={6} fill={color} opacity="0.45" />
          {dot(70, 6)}
          <path d={`M${NOW - 8} ${y - 9} l10 9 l-10 9`} stroke={color} strokeWidth="3" fill="none" />
          <text x={135} y={y - 14} textAnchor="middle" className="tl-lbl">bis jetzt wichtig</text>
        </>
      )
      break
    case 'futurePoint':
      marks = (
        <>
          {dot(255, 7)}
          <text x={255} y={y - 14} textAnchor="middle" className="tl-lbl">spontan</text>
        </>
      )
      break
    case 'futurePlan':
      marks = (
        <>
          <line x1={NOW} y1={y} x2={250} y2={y} stroke={color} strokeWidth="4" strokeDasharray="6 5" />
          {dot(NOW, 5)}
          {dot(255, 7)}
          <text x={228} y={y - 14} textAnchor="middle" className="tl-lbl">schon geplant</text>
        </>
      )
      break
    case 'beforePast':
      marks = (
        <>
          {dot(55, 7)}
          {dot(130, 7, '#94a3b8')}
          <text x={55} y={y - 14} textAnchor="middle" className="tl-lbl">① had started</text>
          <text x={130} y={y - 14} textAnchor="middle" className="tl-lbl">② arrived</text>
        </>
      )
      break
    default:
  }
  return (
    <svg className="timeline" viewBox="0 0 320 72" role="img" aria-label="Zeitstrahl">
      <line x1="12" y1={y} x2="304" y2={y} stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
      <path d={`M300 ${y - 6} l8 6 l-8 6`} fill="none" stroke="var(--line-strong)" strokeWidth="3" />
      <line x1={NOW} y1={y - 22} x2={NOW} y2={y + 22} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 3" />
      {marks}
      <text x="14" y="68" className="tl-axis">Vergangenheit</text>
      <text x={NOW} y="68" textAnchor="middle" className="tl-axis now">JETZT</text>
      <text x="306" y="68" textAnchor="end" className="tl-axis">Zukunft</text>
    </svg>
  )
}

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- Aussprache-Anzeige: deutsche Lesehilfe ----------
export function Say({ text, size = 'big', tips = true, listen = true }) {
  const app = useApp()
  const r = lesehilfe(text)
  const showIpa = app?.state?.showIpa
  return (
    <div className={`say say-${size}`}>
      {r ? (
        <div className="say-line" aria-label={`Aussprache: ${plainLesehilfe(text)}`}>
          {size === 'big' && <span className="say-label">So klingt's</span>}
          <span className="say-words">
            {r.words.map((w, wi) => (
              <span key={wi} className="say-word">
                {w.syllables.map((s, si) => (
                  <span key={si}>
                    {si > 0 && <span className="say-dot">·</span>}
                    <span className={s.stress ? 'say-stress' : ''}>{s.text}</span>
                  </span>
                ))}
              </span>
            ))}
          </span>
          {showIpa && <span className="say-ipa">/{r.words.map((w) => w.ipa).join(' ')}/</span>}
        </div>
      ) : null}
      {listen && <Listen text={text} small={size !== 'big'} />}
      {tips && r && r.tips.length > 0 && (
        <div className="say-tips">
          {r.tips.map((t) => (
            <span key={t.text} className="say-tip">
              <b>{t.key}</b> {t.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Kurze Inline-Version für Listen
export function SayInline({ text }) {
  const r = lesehilfe(text)
  if (!r) return null
  return (
    <span className="say-inline">
      {r.words.map((w, wi) => (
        <span key={wi} className="say-word">
          {w.syllables.map((s, si) => (
            <span key={si}>
              {si > 0 && '·'}
              <span className={s.stress ? 'say-stress' : ''}>{s.text}</span>
            </span>
          ))}
        </span>
      ))}
    </span>
  )
}
