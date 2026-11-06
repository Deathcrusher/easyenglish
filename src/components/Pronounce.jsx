import { useEffect, useRef, useState } from 'react'
import { useApp } from '../App.jsx'
import { startCapture, assessPronunciation, speechServiceStatus, checkSpeechService, onSpeechServiceChange } from '../lib/azure.js'
import { speak, stopSpeaking } from '../lib/speech.js'
import { phonemeDe, phonemeTip } from '../lib/lesehilfe.js'

// true = Azure eingerichtet, false = nicht, null = wird noch geprüft
export function useSpeechService() {
  const [s, setS] = useState(speechServiceStatus())
  useEffect(() => {
    const off = onSpeechServiceChange(setS)
    if (speechServiceStatus() === null) checkSpeechService()
    else setS(speechServiceStatus())
    return off
  }, [])
  return s
}

const cls = (score) => (score >= 80 ? 'good' : score >= 60 ? 'ok' : 'bad')

// Tippen & sprechen → Azure prüft jedes Wort und jeden Laut
export function PronounceCheck({ target, onScore, compact = false }) {
  const app = useApp()
  const [phase, setPhase] = useState('idle') // idle | rec | check | done | error
  const [level, setLevel] = useState(0)
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState(null)
  const [url, setUrl] = useState(null)
  const cap = useRef(null)
  const audioRef = useRef(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      cap.current?.stop()
    }
  }, [])
  useEffect(() => () => url && URL.revokeObjectURL(url), [url])

  async function start() {
    stopSpeaking()
    setErr('')
    setRes(null)
    setOpen(null)
    setLevel(0)
    setPhase('rec')
    const c = startCapture({ onLevel: (l) => alive.current && setLevel(l) })
    cap.current = c
    let out
    try {
      out = await c.done
    } catch (e) {
      if (!alive.current) return
      setErr(e === 'not-allowed' ? 'Das Mikrofon ist nicht erlaubt. Bitte beim Nachfragen „Erlauben“ tippen.' : 'Kein Mikrofon gefunden.')
      setPhase('error')
      return
    }
    cap.current = null
    if (!alive.current) return
    if (out.reason === 'no-speech') {
      setErr('Ich habe nichts gehört – tippe und sprich gleich los.')
      setPhase('error')
      return
    }
    setUrl(URL.createObjectURL(out.wav))
    setPhase('check')
    try {
      const r = await assessPronunciation(out.wav, target, app.state.accent === 'gb' ? 'en-GB' : 'en-US')
      if (!alive.current) return
      if (r.status !== 'ok') {
        setErr(r.status === 'no-speech' ? 'Ich konnte nichts verstehen – sprich etwas lauter und deutlicher.' : 'Das hat nicht geklappt. Nochmal probieren!')
        setPhase('error')
        return
      }
      r.words = r.words.filter((w) => w.error !== 'Insertion')
      setRes(r)
      setPhase('done')
      let worst = -1
      r.words.forEach((w, i) => {
        if (worst < 0 || w.score < r.words[worst].score) worst = i
      })
      if (worst >= 0 && r.words[worst].score < 80) setOpen(worst)
      if (r.score >= 65) app?.count('spoken')
      onScore?.(r.score / 100)
    } catch {
      if (!alive.current) return
      setErr('Die Prüfung ist gerade nicht erreichbar – bitte Internet prüfen.')
      setPhase('error')
    }
  }

  function playMine() {
    const a = audioRef.current
    if (!a) return
    stopSpeaking()
    a.currentTime = 0
    a.play().catch(() => {})
  }

  const verdict = !res
    ? null
    : res.score >= 85
      ? ['Super ausgesprochen! 🎉', 'good']
      : res.score >= 65
        ? ['Gut! Ein paar Laute noch üben 👍', 'ok']
        : ['Nochmal – hör dir das Original langsam an 🐢', 'bad']

  return (
    <div className={`pron ${compact ? 'compact' : ''}`}>
      {phase === 'rec' ? (
        <button className="mic-btn on" onClick={() => cap.current?.stop()}>
          <span className="lvl" style={{ transform: `scale(${0.6 + level * 0.9})` }} />
          Ich höre zu … tippen, wenn fertig
        </button>
      ) : phase === 'check' ? (
        <button className="mic-btn" disabled>⏳ Prüfe deine Aussprache …</button>
      ) : (
        <button className="mic-btn" onClick={start}>{phase === 'done' ? '🔁 Nochmal sprechen' : '🎤 Tippen & sprechen'}</button>
      )}

      {phase === 'idle' && !compact && <p className="note center">Tippe, sprich den Satz – die App hört automatisch auf, wenn du fertig bist.</p>}
      {phase === 'error' && <p className="note warn">{err}</p>}

      {phase === 'done' && res && (
        <div className={`pron-result ${verdict[1]}`}>
          <div className="pron-top">
            <div className={`pron-score ${cls(res.score)}`}>
              <b>{res.score}</b>
              <small>von 100</small>
            </div>
            <div className="pron-text">
              <p className="mic-verdict">{verdict[0]}</p>
              <p className="pron-sub">Genau {res.accuracy} · Flüssig {res.fluency} · Vollständig {res.completeness}</p>
            </div>
          </div>
          <p className="pron-hint">Tippe auf ein Wort für Details:</p>
          <div className="pron-words">
            {res.words.map((w, i) => (
              <button
                key={i}
                className={`pw ${w.error === 'Omission' ? 'miss' : cls(w.score)} ${open === i ? 'sel' : ''}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {w.word}
              </button>
            ))}
          </div>
          {open !== null && res.words[open] && <WordDetail w={res.words[open]} />}
          <div className="rec-row">
            <button className="btn ghost" onClick={playMine}>▶ Ich</button>
            <button className="btn ghost" onClick={() => speak(target)}>🔊 Original</button>
            <button className="btn ghost" onClick={() => speak(target, { slow: true })}>🐢 Langsam</button>
          </div>
        </div>
      )}
      {url && <audio ref={audioRef} src={url} playsInline preload="auto" />}
    </div>
  )
}

function WordDetail({ w }) {
  const phones = w.phonemes.map((p) => ({ ...p, de: phonemeDe(p.p) })).filter((p) => p.de)
  const weak = [...phones].filter((p) => p.score < 70).sort((a, b) => a.score - b.score)[0]
  return (
    <div className="pron-detail">
      <div className="pd-head">
        <strong>{w.word}</strong>
        <span className={`pd-score ${w.error === 'Omission' ? 'miss' : cls(w.score)}`}>{w.error === 'Omission' ? 'fehlt' : `${w.score}/100`}</span>
        <button className="icon-btn" onClick={() => speak(w.word)} aria-label="Anhören">🔊</button>
        <button className="icon-btn slow" onClick={() => speak(w.word, { slow: true })} aria-label="Langsam">🐢</button>
      </div>
      {phones.length > 0 && w.error !== 'Omission' && (
        <div className="pd-phones">
          {phones.map((p, i) => (
            <span key={i} className={`ph ${cls(p.score)}`}>{p.de}</span>
          ))}
        </div>
      )}
      <p className="pd-tip">
        {w.error === 'Omission'
          ? 'Dieses Wort habe ich nicht gehört – sprich es deutlich mit.'
          : weak
            ? `💡 ${phonemeTip(weak.p)}`
            : w.score >= 80
              ? '✓ Klingt gut!'
              : '💡 Hör es dir langsam an 🐢 und sprich es Silbe für Silbe nach.'}
      </p>
    </div>
  )
}
