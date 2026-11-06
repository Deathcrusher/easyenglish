import { azureConfig, json, allowed } from './_azure.js'

// Natürliche Stimme: /api/tts?t=Hello&v=us-f&s=1  → MP3 (wird im CDN zwischengespeichert)
const VOICES = {
  'us-f': ['en-US', 'en-US-AvaNeural', 'en-US-JennyNeural'],
  'us-m': ['en-US', 'en-US-AndrewNeural', 'en-US-GuyNeural'],
  'gb-f': ['en-GB', 'en-GB-SoniaNeural', 'en-GB-LibbyNeural'],
  'gb-m': ['en-GB', 'en-GB-RyanNeural', 'en-GB-ThomasNeural'],
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

async function synth(cfg, lang, voice, text, slow) {
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}"><prosody rate="${slow ? '-35%' : '-5%'}">${esc(text)}</prosody></voice></speak>`
  return fetch(`https://${cfg.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': cfg.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'easyenglish',
    },
    body: ssml,
  })
}

export async function GET(request) {
  const cfg = azureConfig()
  if (!cfg) return json({ error: 'not-configured' }, 503)
  if (!allowed(request)) return json({ error: 'forbidden' }, 403)

  const url = new URL(request.url)
  const text = (url.searchParams.get('t') || '').trim().slice(0, 400)
  if (!text) return json({ error: 'no-text' }, 400)
  const [lang, voice, fallback] = VOICES[url.searchParams.get('v')] || VOICES['us-f']
  const slow = url.searchParams.get('s') === '1'

  let res = await synth(cfg, lang, voice, text, slow)
  if (res.status === 400 && fallback) res = await synth(cfg, lang, fallback, text, slow)
  if (!res.ok) return json({ error: 'tts-failed', status: res.status }, 502)

  const audio = await res.arrayBuffer()
  return new Response(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      // Gleicher Text = gleiche Datei → einmal erzeugt, danach aus dem Zwischenspeicher
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  })
}
