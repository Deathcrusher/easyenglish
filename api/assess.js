import { azureConfig, json, allowed } from './_azure.js'

// Aussprache-Prüfung: POST /api/assess?text=Hello%20world  (Body: WAV, 16 kHz, mono, 16 bit)
export async function POST(request) {
  const cfg = azureConfig()
  if (!cfg) return json({ error: 'not-configured' }, 503)
  if (!allowed(request)) return json({ error: 'forbidden' }, 403)

  const url = new URL(request.url)
  const text = (url.searchParams.get('text') || '').trim().slice(0, 300)
  const lang = url.searchParams.get('lang') === 'en-GB' ? 'en-GB' : 'en-US'
  if (!text) return json({ error: 'no-text' }, 400)

  const audio = await request.arrayBuffer()
  if (audio.byteLength < 2000) return json({ error: 'too-short' }, 400)
  if (audio.byteLength > 1_500_000) return json({ error: 'too-long' }, 413)

  const config = {
    ReferenceText: text,
    GradingSystem: 'HundredMark',
    Granularity: 'Phoneme',
    Dimension: 'Comprehensive',
    EnableMiscue: true,
  }
  const res = await fetch(
    `https://${cfg.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': cfg.key,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Pronunciation-Assessment': Buffer.from(JSON.stringify(config), 'utf8').toString('base64'),
      },
      body: audio,
    }
  )
  if (!res.ok) return json({ error: 'azure-failed', status: res.status }, 502)
  const data = await res.json()
  return json(simplify(data))
}

// Azure-Antwort auf das Nötigste reduzieren (beide bekannten Antwort-Formate)
export function simplify(data) {
  if (data.RecognitionStatus && data.RecognitionStatus !== 'Success') {
    return { status: data.RecognitionStatus === 'NoMatch' || data.RecognitionStatus === 'InitialSilenceTimeout' ? 'no-speech' : 'error' }
  }
  const best = data.NBest?.[0]
  if (!best) return { status: 'no-speech' }
  const pa = (x) => x?.PronunciationAssessment || x || {}
  const top = pa(best)
  const words = (best.Words || []).map((w) => {
    const s = pa(w)
    return {
      word: w.Word,
      score: Math.round(s.AccuracyScore ?? 0),
      error: s.ErrorType || 'None',
      phonemes: (w.Phonemes || []).map((p) => ({ p: p.Phoneme, score: Math.round(pa(p).AccuracyScore ?? 0) })),
    }
  })
  return {
    status: 'ok',
    heard: data.DisplayText || best.Display || '',
    score: Math.round(top.PronScore ?? top.AccuracyScore ?? 0),
    accuracy: Math.round(top.AccuracyScore ?? 0),
    fluency: Math.round(top.FluencyScore ?? 0),
    completeness: Math.round(top.CompletenessScore ?? 0),
    words,
  }
}
