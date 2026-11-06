const KEY = 'easy-english-v1'

const DEFAULTS = {
  name: 'Connie',
  goal: 30,
  accent: 'us',
  newPerSession: 8,
  cards: {}, // id -> { box, due }
  days: {}, // 'YYYY-MM-DD' -> xp
  tenseDone: {}, // tenseId -> best score
  gapMistakes: {}, // Index der falsch beantworteten Lückentexte
  stats: {}, // Zähler für Erfolge (sentences, spoken, dictation, lessons, written)
}

export const STATE_KEYS = Object.keys(DEFAULTS)

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Speicher nicht verfügbar – App läuft trotzdem */
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS }
}

export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

// Wiederholungs-Abstände in Tagen je Box (Leitner-System)
const INTERVALS = [0, 1, 2, 4, 8, 16, 30]
export const LEARNED_BOX = 4

export function gradeCard(card, grade) {
  const today = dayKey()
  const box = card?.box ?? 0
  if (grade === 'again') return { box: 0, due: today }
  if (grade === 'hard') {
    const nb = Math.max(1, box)
    return { box: nb, due: addDays(today, 1) }
  }
  const nb = Math.min(box + 1, INTERVALS.length - 1)
  return { box: nb, due: addDays(today, INTERVALS[nb]) }
}

export function isDue(card) {
  return card && card.due <= dayKey()
}

export function streakOf(days, goal) {
  const today = dayKey()
  let d = (days[today] || 0) >= goal ? today : addDays(today, -1)
  let n = 0
  while ((days[d] || 0) >= goal) {
    n++
    d = addDays(d, -1)
  }
  return n
}
