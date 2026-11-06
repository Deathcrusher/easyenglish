import A from './readings-a.js'
import B from './readings-b.js'

export const READINGS = [...A, ...B]
export const READING_BY_ID = Object.fromEntries(READINGS.map((r) => [r.id, r]))
