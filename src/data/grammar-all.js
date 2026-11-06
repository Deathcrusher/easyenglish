// Alle Grammatikthemen (Zeiten + weitere) mit Niveau und Übungen
import { TENSES, GAPS } from './grammar.js'
import { EXTRA } from './grammar2.js'
import { UNITS } from './units.js'

const TENSE_LEVEL = {
  'present-simple': 'A1',
  'present-progressive': 'A1',
  'past-simple': 'A2',
  'past-progressive': 'A2',
  'present-perfect': 'A2',
  'going-to': 'A2',
  'will-future': 'B1',
  'past-perfect': 'B1',
}

const tenses = TENSES.map((t) => ({
  ...t,
  level: TENSE_LEVEL[t.id],
  signalsTitle: 'Signalwörter – daran erkennst du sie',
  ex: GAPS.filter((g) => g.t === t.id).map(({ t: _t, ...rest }) => rest),
}))

const ALL = [...tenses, ...EXTRA]
const byId = Object.fromEntries(ALL.map((g) => [g.id, g]))

// Reihenfolge wie im Kurs (Lektion 1 → 30)
export const GRAMMAR = UNITS.map((u) => ({ ...byId[u.grammar], unit: u.id, unitNum: u.num })).filter((g) => g.id)

export const GRAMMAR_BY_ID = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]))

export const EXERCISES = GRAMMAR.flatMap((g) => g.ex.map((e, i) => ({ ...e, t: g.id, id: `${g.id}:${i}` })))
export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]))
