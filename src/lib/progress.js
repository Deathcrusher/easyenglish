// Fortschritt pro Lektion berechnen
import { UNITS, LEVELS } from '../data/units.js'
import { GRAMMAR_BY_ID } from '../data/grammar-all.js'
import { READING_BY_ID } from '../data/readings.js'

export const PASS_TEST = 7 // von 10
export const SENTENCES_NEEDED = 5

export function unitStatus(unit, state) {
  const seen = unit.words.filter((w) => state.cards[w.id]).length
  const g = GRAMMAR_BY_ID[unit.grammar]
  const gBest = state.tenseDone[unit.grammar] || 0
  const gNeed = Math.ceil(g.ex.length * 0.6)
  const u = state.units?.[unit.id] || {}
  const reading = READING_BY_ID[unit.reading]
  const steps = [
    {
      key: 'words', icon: '📚', title: 'Wörter lernen',
      sub: `${seen} von ${unit.words.length} Wörtern gelernt`,
      done: seen >= unit.words.length, progress: seen / unit.words.length,
    },
    {
      key: 'grammar', icon: '📖', title: `Grammatik: ${g.en}`,
      sub: gBest ? `Bestes Ergebnis: ${gBest} von ${g.ex.length}` : g.de,
      done: gBest >= gNeed, progress: Math.min(1, gBest / gNeed),
    },
    {
      key: 'reading', icon: '📰', title: `Lesen: ${reading.title}`,
      sub: u.reading !== undefined ? `${u.reading} von ${reading.q.length} Fragen richtig` : reading.titleDe,
      done: (u.reading || 0) >= 2, progress: Math.min(1, (u.reading || 0) / 2),
    },
    {
      key: 'sentences', icon: '🧩', title: 'Sätze bauen',
      sub: `${Math.min(u.sentences || 0, SENTENCES_NEEDED)} von ${SENTENCES_NEEDED} Sätzen`,
      done: (u.sentences || 0) >= SENTENCES_NEEDED, progress: Math.min(1, (u.sentences || 0) / SENTENCES_NEEDED),
    },
    {
      key: 'test', icon: '🏁', title: 'Lektionstest',
      sub: u.test !== undefined ? `Bestes Ergebnis: ${u.test} von 10${u.test >= PASS_TEST ? ' ✓' : ''}` : `Ab ${PASS_TEST} von 10 bestanden`,
      done: (u.test || 0) >= PASS_TEST, progress: Math.min(1, (u.test || 0) / PASS_TEST),
    },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done) || null
  return { steps, doneCount, complete: steps[4].done, next, progress: steps.reduce((a, s) => a + s.progress, 0) / steps.length }
}

export function startIndex(state) {
  const lvl = state.startLevel || 'A1'
  return Math.max(0, UNITS.findIndex((u) => u.level === lvl))
}

// Aktuelle Lektion: erste nicht bestandene ab dem gewählten Startniveau
export function currentUnit(state) {
  const from = startIndex(state)
  for (let i = from; i < UNITS.length; i++) if (!unitStatus(UNITS[i], state).complete) return UNITS[i]
  for (let i = 0; i < from; i++) if (!unitStatus(UNITS[i], state).complete) return UNITS[i]
  return UNITS[UNITS.length - 1]
}

export function levelStats(state) {
  return LEVELS.map((l) => {
    const units = UNITS.filter((u) => u.level === l.id)
    const done = units.filter((u) => unitStatus(u, state).complete).length
    return { ...l, units, done }
  })
}
