// Prüft, ob auf dem Server eine neuere Version der App liegt
/* global __BUILD_ID__ */
export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'

export async function checkForUpdate() {
  if (!import.meta.env.PROD) return false
  try {
    navigator.serviceWorker?.getRegistration?.().then((r) => r?.update?.()).catch(() => {})
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const { id } = await res.json()
    return !!id && id !== BUILD_ID
  } catch {
    return false
  }
}
