import A1 from './words-a1.js'
import A2 from './words-a2.js'
import B1 from './words-b1.js'

export const LEVELS = [
  { id: 'A1', title: 'A1 · Einstieg', short: 'A1', desc: 'Die Basics: vorstellen, Alltag, Essen, Wohnen, Einkaufen.', color: '#0f766e' },
  { id: 'A2', title: 'A2 · Grundlagen', short: 'A2', desc: 'Von früher erzählen, Reisen, Gesundheit, Arbeit, Pläne.', color: '#b45309' },
  { id: 'B1', title: 'B1 · Mittelstufe', short: 'B1', desc: 'Meinung sagen, Bewerbung, Wünsche, Geschichten erzählen.', color: '#7c3aed' },
]

// Jede Lektion: Thema + Grammatik (+ Lesetext mit derselben Nummer)
export const UNIT_META = [
  { id: 'u01', level: 'A1', icon: '👋', title: 'Hallo!', desc: 'Begrüßen, vorstellen, Zahlen 1–10', grammar: 'g-be' },
  { id: 'u02', level: 'A1', icon: '👨‍👩‍👧', title: 'Familie & Freunde', desc: 'Familie, Haustiere, Menschen beschreiben', grammar: 'g-have' },
  { id: 'u03', level: 'A1', icon: '🕒', title: 'Zahlen, Zeit & Tage', desc: 'Uhrzeit, Wochentage, Fragewörter', grammar: 'g-questions' },
  { id: 'u04', level: 'A1', icon: '☀️', title: 'Mein Alltag', desc: 'Tagesablauf und Gewohnheiten', grammar: 'present-simple' },
  { id: 'u05', level: 'A1', icon: '🍝', title: 'Essen & Trinken', desc: 'Lebensmittel, im Restaurant bestellen', grammar: 'g-some-any' },
  { id: 'u06', level: 'A1', icon: '🏠', title: 'Zuhause', desc: 'Räume, Möbel, wo etwas ist', grammar: 'g-there-is' },
  { id: 'u07', level: 'A1', icon: '🏙️', title: 'In der Stadt', desc: 'Orte, Wege, Verkehrsmittel', grammar: 'g-can' },
  { id: 'u08', level: 'A1', icon: '🛍️', title: 'Einkaufen & Kleidung', desc: 'Preise, Kleidung, Farben', grammar: 'g-this-that' },
  { id: 'u09', level: 'A1', icon: '🎮', title: 'Hobbys & Freizeit', desc: 'Was du gern machst', grammar: 'g-like-ing' },
  { id: 'u10', level: 'A1', icon: '🌦️', title: 'Gerade jetzt', desc: 'Was gerade passiert, Wetter', grammar: 'present-progressive' },
  { id: 'u11', level: 'A2', icon: '📼', title: 'Gestern & früher', desc: 'Über Vergangenes erzählen', grammar: 'past-simple' },
  { id: 'u12', level: 'A2', icon: '✈️', title: 'Urlaub & Reisen', desc: 'Flughafen, Hotel, Ausflüge', grammar: 'g-past-irregular' },
  { id: 'u13', level: 'A2', icon: '🩺', title: 'Körper & Gesundheit', desc: 'Beim Arzt, Ratschläge geben', grammar: 'g-must-should' },
  { id: 'u14', level: 'A2', icon: '💼', title: 'Arbeit & Berufe', desc: 'Berufe, Erfahrungen, Büro', grammar: 'present-perfect' },
  { id: 'u15', level: 'A2', icon: '💛', title: 'Gefühle & Beziehungen', desc: 'Wie es dir geht, Beziehungen', grammar: 'g-adj-adv' },
  { id: 'u16', level: 'A2', icon: '🏞️', title: 'Stadt & Land', desc: 'Orte vergleichen', grammar: 'g-comparison' },
  { id: 'u17', level: 'A2', icon: '📅', title: 'Pläne & Zukunft', desc: 'Was du vorhast', grammar: 'going-to' },
  { id: 'u18', level: 'A2', icon: '📱', title: 'Handy & Internet', desc: 'Technik im Alltag', grammar: 'g-already-yet' },
  { id: 'u19', level: 'A2', icon: '🦊', title: 'Natur & Tiere', desc: 'Tiere, Wald, Wetter erzählen', grammar: 'past-progressive' },
  { id: 'u20', level: 'A2', icon: '🎉', title: 'Feste & Termine', desc: 'Feiertage, Monate, Jahreszeiten', grammar: 'g-prep-time' },
  { id: 'u21', level: 'B1', icon: '🧘', title: 'Gesund leben', desc: 'Lebensstil, Stress, Gewohnheiten', grammar: 'g-pp-progressive' },
  { id: 'u22', level: 'B1', icon: '🎬', title: 'Medien & Gaming', desc: 'Serien, Spiele, Nachrichten', grammar: 'g-passive' },
  { id: 'u23', level: 'B1', icon: '📝', title: 'Job & Bewerbung', desc: 'Bewerben, Vorstellungsgespräch', grammar: 'g-gerund-inf' },
  { id: 'u24', level: 'B1', icon: '📦', title: 'Wohnen & Umziehen', desc: 'Miete, Umzug, Nachbarn', grammar: 'g-if1' },
  { id: 'u25', level: 'B1', icon: '🌠', title: 'Träume & Wünsche', desc: 'Was wäre, wenn …', grammar: 'g-if2' },
  { id: 'u26', level: 'B1', icon: '🧑‍🤝‍🧑', title: 'Menschen beschreiben', desc: 'Aussehen und Charakter', grammar: 'g-relative' },
  { id: 'u27', level: 'B1', icon: '🌍', title: 'Umwelt & Zukunft', desc: 'Klima, Technik, Vorhersagen', grammar: 'will-future' },
  { id: 'u28', level: 'B1', icon: '💬', title: 'Meinung & Diskussion', desc: 'Argumentieren, zustimmen, widersprechen', grammar: 'g-linking' },
  { id: 'u29', level: 'B1', icon: '📖', title: 'Geschichten erzählen', desc: 'Spannend erzählen, was passiert war', grammar: 'past-perfect' },
  { id: 'u30', level: 'B1', icon: '🧳', title: 'Im Ausland zurechtkommen', desc: 'Höflich fragen, Probleme lösen', grammar: 'g-indirect' },
]

export const slug = (en) =>
  en
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function parse(...texts) {
  const out = {}
  let current = null
  for (const text of texts) {
    for (const raw of text.split('\n')) {
      const line = raw.trim()
      if (!line) continue
      if (line.startsWith('#')) {
        current = line.slice(1).trim()
        out[current] = []
        continue
      }
      const [en, de, ex, exDe] = line.split('|')
      out[current].push({ en, de, ex, exDe })
    }
  }
  return out
}

const PARSED = parse(A1, A2, B1)

export const UNITS = UNIT_META.map((m, i) => ({
  ...m,
  num: i + 1,
  reading: `r${String(i + 1).padStart(2, '0')}`,
  words: (PARSED[m.id] || []).map((w) => ({ ...w, id: slug(w.en), topic: m.id })),
}))

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]))
export const ALL_WORDS = UNITS.flatMap((u) => u.words)
export const WORD_BY_ID = Object.fromEntries(ALL_WORDS.map((w) => [w.id, w]))

// Wörterbuch für Lesetexte: englisches Wort (klein) → Eintrag
export const WORD_BY_EN = Object.fromEntries(
  ALL_WORDS.map((w) => [w.en.toLowerCase().replace(/^to /, '').replace(/[.!?]$/, ''), w])
)
