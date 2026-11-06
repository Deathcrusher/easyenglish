// Gemeinsame Helfer für die Azure-Speech-Funktionen. Der Schlüssel bleibt hier auf dem Server.
export function azureConfig() {
  const key = process.env.AZURE_SPEECH_KEY
  const region = (process.env.AZURE_SPEECH_REGION || '').trim()
  return key && region ? { key: key.trim(), region } : null
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

// Einfacher Schutz: nur Anfragen von der eigenen App (oder ohne Origin, z. B. direktes Aufrufen) erlauben
export function allowed(request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const host = new URL(origin).hostname
    const self = new URL(request.url).hostname
    return host === self || host === 'localhost' || host === '127.0.0.1'
  } catch {
    return false
  }
}
