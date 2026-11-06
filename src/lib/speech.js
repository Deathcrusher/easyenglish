let voices = []
let accent = 'us'

function loadVoices() {
  try {
    voices = window.speechSynthesis?.getVoices() || []
  } catch {
    voices = []
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

let voiceURI = ''

export function setAccent(a) {
  accent = a
}

export function setVoice(uri) {
  voiceURI = uri || ''
}

export function englishVoices() {
  if (!voices.length) loadVoices()
  return voices.filter((v) => v.lang?.replace('_', '-').startsWith('en'))
}

const NICE = /Google|Natural|Neural|Samantha|Daniel|Serena|Aria|Jenny|Guy|Libby|Sonia|Ava|Allison/i

function pickVoice() {
  if (!voices.length) loadVoices()
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI)
    if (chosen) return chosen
  }
  const want = accent === 'gb' ? 'en-GB' : 'en-US'
  const en = voices.filter((v) => v.lang?.replace('_', '-').startsWith('en'))
  const same = en.filter((v) => v.lang.replace('_', '-') === want)
  return same.find((v) => NICE.test(v.name)) || same[0] || en.find((v) => NICE.test(v.name)) || en[0]
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text, { slow = false } = {}) {
  if (!canSpeak()) return
  const s = window.speechSynthesis
  s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice()
  if (v) {
    u.voice = v
    u.lang = v.lang
  } else {
    u.lang = accent === 'gb' ? 'en-GB' : 'en-US'
  }
  u.rate = slow ? 0.55 : 0.92
  s.speak(u)
}

// Mehrere Sätze nacheinander vorlesen. Gibt eine Stopp-Funktion zurück.
export function speakSequence(texts, { slow = false, onIndex, onEnd } = {}) {
  if (!canSpeak()) return () => {}
  const s = window.speechSynthesis
  s.cancel()
  let stopped = false
  let i = 0
  const v = pickVoice()
  const next = () => {
    if (stopped) return
    if (i >= texts.length) {
      onEnd?.()
      return
    }
    onIndex?.(i)
    const u = new SpeechSynthesisUtterance(texts[i])
    if (v) {
      u.voice = v
      u.lang = v.lang
    } else u.lang = accent === 'gb' ? 'en-GB' : 'en-US'
    u.rate = slow ? 0.6 : 0.92
    u.onend = () => {
      i++
      setTimeout(next, 250)
    }
    u.onerror = () => {
      stopped = true
      onEnd?.()
    }
    s.speak(u)
  }
  next()
  return () => {
    stopped = true
    s.cancel()
    onEnd?.()
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* ignore */
  }
}

export const canListen = () =>
  typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

export function listen() {
  return new Promise((resolve, reject) => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!R) return reject('unsupported')
    const r = new R()
    r.lang = accent === 'gb' ? 'en-GB' : 'en-US'
    r.interimResults = false
    r.maxAlternatives = 5
    let done = false
    r.onresult = (e) => {
      done = true
      resolve(Array.from(e.results[0]).map((a) => a.transcript))
    }
    r.onerror = (e) => {
      done = true
      reject(e.error || 'error')
    }
    r.onend = () => {
      if (!done) reject('no-speech')
    }
    try {
      r.start()
    } catch (err) {
      reject('busy')
    }
  })
}

const NUMS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
}

export function words(text) {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUMS[w] || w)
}

// Vergleicht Zielsatz mit dem Gehörten – Wort für Wort
export function compareSpeech(target, alternatives) {
  const t = words(target)
  let best = { score: 0, marks: t.map((w) => ({ w, ok: false })), heard: alternatives[0] || '' }
  for (const alt of alternatives) {
    const pool = words(alt)
    const marks = t.map((w) => {
      const i = pool.indexOf(w)
      if (i >= 0) {
        pool.splice(i, 1)
        return { w, ok: true }
      }
      return { w, ok: false }
    })
    const score = marks.filter((m) => m.ok).length / Math.max(1, t.length)
    if (score > best.score) best = { score, marks, heard: alt }
  }
  return best
}
