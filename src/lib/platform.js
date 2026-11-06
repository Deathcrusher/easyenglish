// Geräte-Erkennung für iPhone / installierte App
import { canListen } from './speech.js'

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.navigator.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches)

export const canRecord = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined'

// Apple bietet in Apps vom Home-Bildschirm keine Spracherkennung an → dort aufnehmen & vergleichen
export const recognitionUsable = () => canListen() && !(isIOS() && isStandalone())
