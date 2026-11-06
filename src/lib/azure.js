// Verbindung zu den Azure-Funktionen (Aussprache-Prüfung + natürliche Stimmen)

let status = null // null = unbekannt, true / false
let pending = null
const listeners = new Set()

export function speechServiceStatus() {
  return status
}

export function onSpeechServiceChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function checkSpeechService() {
  if (pending) return pending
  pending = fetch('/api/health', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { speech: false }))
    .then((d) => !!d.speech)
    .catch(() => false)
    .then((ok) => {
      status = ok
      listeners.forEach((fn) => fn(ok))
      return ok
    })
  return pending
}

// ---------- Mikrofon: aufnehmen, bis Connie fertig gesprochen hat ----------
export function startCapture({ onLevel, maxMs = 12000, silenceMs = 1100, noSpeechMs = 7000 } = {}) {
  let ctx = null
  let stream = null
  let proc = null
  let src = null
  let finished = false
  let resolveFn
  let rejectFn
  const chunks = []
  let t0 = 0 // startet erst, wenn wirklich Ton ankommt (nicht schon beim Erlauben-Dialog)
  let started = false
  let lastTick = 0
  let speech = false
  let lastLoud = 0
  let peak = 0
  let floor = 0
  let floorN = 0
  let watchdog = null

  const done = new Promise((res, rej) => {
    resolveFn = res
    rejectFn = rej
  })

  // iOS: Audio muss direkt beim Tippen gestartet werden, nicht erst nach dem Mikrofon-Dialog
  const AC = window.AudioContext || window.webkitAudioContext
  try {
    ctx = new AC()
  } catch {
    ctx = null
  }
  try {
    ctx?.resume?.()?.catch?.(() => {})
  } catch {
    /* ignore */
  }

  function cleanup() {
    clearInterval(watchdog)
    try { proc && (proc.onaudioprocess = null) } catch { /* ignore */ }
    try { src?.disconnect() } catch { /* ignore */ }
    try { proc?.disconnect() } catch { /* ignore */ }
    try { stream?.getTracks().forEach((t) => t.stop()) } catch { /* ignore */ }
    try { ctx?.close() } catch { /* ignore */ }
    try { if (navigator.audioSession) navigator.audioSession.type = 'auto' } catch { /* ignore */ }
  }

  function finish(reason) {
    if (finished) return
    finished = true
    const rate = ctx?.sampleRate || 48000
    cleanup()
    const pcm = mergeAndTrim(chunks, rate)
    if (reason === 'no-speech' || pcm.length < rate * 0.25) {
      resolveFn({ reason: 'no-speech' })
      return
    }
    const wav = encodeWav(downsample(pcm, rate, 16000), 16000)
    resolveFn({ reason, wav, seconds: pcm.length / rate })
  }

  ;(async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (finished) {
        cleanup()
        return
      }
      if (!ctx || ctx.state === 'closed') ctx = new AC()
      if (ctx.state === 'suspended') await Promise.resolve(ctx.resume?.()).catch(() => {})
      src = ctx.createMediaStreamSource(stream)
      proc = ctx.createScriptProcessor(4096, 1, 1)
      proc.onaudioprocess = (e) => {
        if (finished) return
        const now = performance.now()
        lastTick = now
        const d = e.inputBuffer.getChannelData(0)
        chunks.push(new Float32Array(d))
        let sum = 0
        for (let i = 0; i < d.length; i++) sum += d[i] * d[i]
        const rms = Math.sqrt(sum / d.length)
        peak = Math.max(peak, rms)
        const t = now - t0
        if (t < 350) floor = (floor * floorN + rms) / ++floorN
        // Schwelle: über dem Grundrauschen, aber nie so hoch, dass normales Sprechen nicht reicht
        const thr = Math.min(0.04, Math.max(0.012, floor * 2.5))
        onLevel?.(Math.min(1, rms / 0.12))
        if (rms > thr && t > 150) {
          speech = true
          lastLoud = t
        }
        if (speech && t - lastLoud > silenceMs) finish('auto')
        else if (!speech && t > noSpeechMs) finish('no-speech')
        else if (t > maxMs) finish('max')
      }
      src.connect(proc)
      proc.connect(ctx.destination)
      t0 = performance.now()
      lastTick = t0
      started = true
      // Sicherheitsnetz: falls das Audio hängt, trotzdem sauber beenden
      watchdog = setInterval(() => {
        if (finished || !started) return
        const now = performance.now()
        if (now - lastTick > 1500 && ctx?.state === 'suspended') Promise.resolve(ctx.resume?.()).catch(() => {})
        if (now - lastTick > 4000) finish(speech ? 'manual' : 'no-speech')
        else if (now - t0 > maxMs + 1000) finish(speech ? 'max' : 'no-speech')
      }, 500)
    } catch (err) {
      finished = true
      cleanup()
      rejectFn(err?.name === 'NotAllowedError' || err?.name === 'SecurityError' ? 'not-allowed' : 'no-mic')
    }
  })()

  return { done, stop: () => finish(speech || peak > 0.015 ? 'manual' : 'no-speech') }
}

function mergeAndTrim(chunks, rate) {
  const total = chunks.reduce((a, c) => a + c.length, 0)
  const all = new Float32Array(total)
  let o = 0
  for (const c of chunks) {
    all.set(c, o)
    o += c.length
  }
  // Stille am Anfang und Ende abschneiden (mit etwas Puffer)
  const thr = 0.01
  let a = 0
  let b = all.length - 1
  while (a < all.length && Math.abs(all[a]) < thr) a++
  while (b > a && Math.abs(all[b]) < thr) b--
  const pad = Math.floor(rate * 0.25)
  return all.slice(Math.max(0, a - pad), Math.min(all.length, b + pad))
}

function downsample(buf, inRate, outRate) {
  if (inRate === outRate) return buf
  const ratio = inRate / outRate
  const len = Math.floor(buf.length / ratio)
  const out = new Float32Array(len)
  for (let i = 0; i < len; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.min(buf.length, Math.floor((i + 1) * ratio))
    let s = 0
    for (let j = start; j < end; j++) s += buf[j]
    out[i] = s / Math.max(1, end - start)
  }
  return out
}

function encodeWav(samples, rate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const v = new DataView(buffer)
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)))
  str(0, 'RIFF')
  v.setUint32(4, 36 + samples.length * 2, true)
  str(8, 'WAVE')
  str(12, 'fmt ')
  v.setUint32(16, 16, true)
  v.setUint16(20, 1, true)
  v.setUint16(22, 1, true)
  v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true)
  v.setUint16(32, 2, true)
  v.setUint16(34, 16, true)
  str(36, 'data')
  v.setUint32(40, samples.length * 2, true)
  let o = 44
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

// ---------- Aussprache prüfen lassen ----------
export async function assessPronunciation(wav, text, lang = 'en-US') {
  const ref = text.replace(/[“”„"]/g, '').replace(/\s+/g, ' ').trim()
  const res = await fetch(`/api/assess?text=${encodeURIComponent(ref)}&lang=${lang}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: wav,
  })
  if (!res.ok) throw new Error('assess-failed')
  return res.json()
}
