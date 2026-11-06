// Erzeugt src/data/pron.json: Aussprache (CMU-Wörterbuch) für alle Wörter der App.
// Aufruf: node scripts/pron.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dictionary } from 'cmu-pronouncing-dictionary'
import { ALL_WORDS } from '../src/data/vocab.js'

const overrides = existsSync('scripts/pron-overrides.json')
  ? JSON.parse(readFileSync('scripts/pron-overrides.json', 'utf8'))
  : {}

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z' -]/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)

const tokens = new Set()
for (const w of ALL_WORDS) tokenize(w.en).forEach((t) => tokens.add(t))

const out = {}
const missing = []
for (const t of [...tokens].sort()) {
  const p = overrides[t] || dictionary[t]
  if (p) out[t] = p
  else missing.push(t)
}
writeFileSync('src/data/pron.json', JSON.stringify(out))
console.log(`${Object.keys(out).length} Wörter, fehlend: ${missing.length}`, missing.join(', '))
