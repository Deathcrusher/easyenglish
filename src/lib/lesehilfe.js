// Macht aus der Wörterbuch-Aussprache (CMU / ARPAbet, amerikanisch) eine
// deutsche Lesehilfe – so geschrieben, wie man es auf Deutsch lesen würde.
import PRON from '../data/pron.json'

const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'])

// Konsonantengruppen, mit denen eine Silbe im Wortinneren beginnen darf
const ONSETS = new Set([
  'P R', 'P L', 'B R', 'B L', 'T R', 'D R', 'K R', 'K L', 'G R', 'G L', 'F R', 'F L', 'TH R', 'SH R',
  'K W', 'T W', 'D W', 'G W', 'S W', 'S L', 'P Y', 'B Y', 'K Y', 'F Y', 'M Y', 'HH Y', 'V Y', 'G Y',
])

function parse(arpa) {
  return arpa
    .trim()
    .split(/\s+/)
    .map((p) => {
      const m = p.match(/^([A-Z]+)([012])?$/)
      return { ph: m[1], stress: m[2] === undefined ? null : Number(m[2]) }
    })
}

function syllabify(phones) {
  const vIdx = phones.map((p, i) => (VOWELS.has(p.ph) ? i : -1)).filter((i) => i >= 0)
  if (!vIdx.length) return [{ phones, stress: 0 }]
  const out = []
  let start = 0
  for (let k = 0; k < vIdx.length; k++) {
    const next = vIdx[k + 1]
    if (next === undefined) {
      out.push(phones.slice(start))
      break
    }
    const cluster = phones.slice(vIdx[k] + 1, next)
    let onset = 0
    if (cluster.length === 1) onset = cluster[0].ph === 'NG' ? 0 : 1
    else if (cluster.length >= 2) {
      const last2 = cluster.slice(-2).map((c) => c.ph).join(' ')
      onset = ONSETS.has(last2) ? 2 : 1
      if (cluster[cluster.length - 1].ph === 'NG') onset = 0
    }
    const end = next - onset
    out.push(phones.slice(start, end))
    start = end
  }
  return out.map((s) => ({ phones: s, stress: s.find((p) => p.stress !== null)?.stress ?? 0 }))
}

function phoneToDe(p, i, all, wordStart) {
  const next = all[i + 1]?.ph
  switch (p.ph) {
    case 'AA': return 'a'
    case 'AE': return 'ä'
    case 'AH': return p.stress === 0 ? 'e' : 'a'
    case 'AO': return 'o'
    case 'AW': return 'au'
    case 'AY': return 'ai'
    case 'EH': return 'e'
    case 'ER': return p.stress === 0 ? 'er' : 'ör'
    case 'EY': return 'ej'
    case 'IH': return 'i'
    case 'IY': return p.stress === 1 ? 'ii' : 'i'
    case 'OW': return 'ou'
    case 'OY': return 'eu'
    case 'UH': return 'u'
    case 'UW': return p.stress === 0 ? 'u' : 'uu'
    case 'CH': return 'tsch'
    case 'JH': return 'dsch'
    case 'SH': return 'sch'
    case 'ZH': return 'sch'
    case 'TH': return 'th'
    case 'DH': return 'dh'
    case 'HH': return 'h'
    case 'NG': return next === 'K' || next === 'G' ? 'n' : 'ng'
    case 'V': return 'w'
    case 'W': return 'u'
    case 'Y': return 'j'
    case 'Z': return 's'
    // „st“ / „sp“ am Wortanfang würde man auf Deutsch „scht“ lesen → ß
    case 'S': return i === 0 && wordStart && (next === 'T' || next === 'P') ? 'ß' : 's'
    default: return p.ph.toLowerCase()
  }
}

const IPA = {
  AA: 'ɑ', AE: 'æ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
  B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ',
  P: 'p', R: 'r', S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ',
}
const ipaOf = (p) => (p.ph === 'AH' ? (p.stress === 0 ? 'ə' : 'ʌ') : p.ph === 'ER' ? (p.stress === 0 ? 'ɚ' : 'ɝ') : IPA[p.ph] || '')

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z' -]/g, ' ')
    .split(/[\s-]+/)
    .map((w) => w.replace(/^'+|'+$/g, ''))
    .filter(Boolean)
}

export function lookup(word) {
  return PRON[word] || null
}

// Liefert pro Wort die Silben: [{ text, stress }]
export function lesehilfe(text) {
  let tokens = tokenize(text)
  if (tokens.length > 1 && tokens[0] === 'to') tokens = tokens.slice(1) // „to“ vor Verben weglassen
  const words = []
  const phonesAll = []
  for (const t of tokens) {
    const arpa = lookup(t)
    if (!arpa) continue
    const phones = parse(arpa)
    phonesAll.push({ word: t, phones })
    const sylls = syllabify(phones)
    let pos = 0
    const syl = sylls.map((s) => {
      const txt = s.phones.map((p) => phoneToDe(p, pos++, phones, true)).join('')
      return { text: txt, stress: s.stress === 1 && sylls.length > 1 }
    })
    const ipa = sylls.map((s) => (s.stress === 1 && sylls.length > 1 ? 'ˈ' : '') + s.phones.map(ipaOf).join('')).join('')
    words.push({ word: t, syllables: syl, ipa })
  }
  if (!words.length) return null
  return { words, tips: tipsFor(text, phonesAll) }
}

export function plainLesehilfe(text) {
  const r = lesehilfe(text)
  if (!r) return ''
  return r.words.map((w) => w.syllables.map((s) => (s.stress ? s.text.toUpperCase() : s.text)).join('·')).join(' ')
}

// ---------- Laut-Tipps ----------
const SILENT = [
  [/\bkn/, 'k ist stumm'],
  [/\bwr/, 'w ist stumm'],
  [/mb\b/, 'b ist stumm'],
  [/igh/, 'gh ist stumm'],
  [/(alk|alf)\b/, 'l ist stumm'],
  [/ould\b/, 'l ist stumm'],
  [/(stle|sten)\b/, 't ist stumm'],
  [/\bh(our|onest)/, 'h ist stumm'],
  [/\bpsych/, 'p ist stumm'],
  [/wednesday/, 'erstes d ist stumm'],
  [/receipt/, 'p ist stumm'],
  [/island/, 's ist stumm'],
  [/doubt|debt/, 'b ist stumm'],
  [/\bclothes/, 'klingt fast wie „klous“'],
  [/alm\b/, 'l ist stumm'],
  [/mn\b/, 'n ist stumm'],
  [/stm/, 't ist stumm'],
  [/ften\b/, 't ist meist stumm'],
  [/gn\b/, 'g ist stumm'],
  [/answer/, 'w ist stumm'],
]

const TIP_TEXT = {
  TH: ['th', 'Zungenspitze zwischen die Zähne und pusten – nicht „s“ oder „f“'],
  DH: ['dh', 'Zunge zwischen die Zähne und dabei summen – nicht „d“'],
  W: ['u', '„u“ am Silbenanfang = englisches w: Lippen spitz und rund, dann öffnen'],
  AE: ['ä', 'ä = Mund weit auf, Kiefer nach unten'],
  ER: ['ör', 'ör / er = Zunge nach hinten biegen, nicht rollen'],
  ZH: ['sch', 'weiches „sch“ wie in „Garage“'],
  R: ['r', 'r = Zunge nach hinten, nicht rollen'],
  Z: ['s', '„s“ hier summend sprechen wie eine Biene'],
  END: ['Ende', 'Ende weich lassen: b, d, g nicht zu p, t, k machen'],
}

function tipsFor(text, phonesAll) {
  const out = []
  const low = text.toLowerCase()
  for (const [re, t] of SILENT) if (re.test(low)) out.push({ key: '🤫', text: t })
  const has = (ph) => phonesAll.some((w) => w.phones.some((p) => p.ph === ph))
  for (const k of ['TH', 'DH', 'W', 'AE', 'ZH']) {
    if (has(k)) out.push({ key: TIP_TEXT[k][0], text: TIP_TEXT[k][1] })
  }
  if (phonesAll.some((w) => w.phones.some((p) => p.ph === 'ER' && p.stress > 0))) out.push({ key: 'ör', text: TIP_TEXT.ER[1] })
  if (phonesAll.some((w) => w.phones[0]?.ph === 'R')) out.push({ key: 'r', text: TIP_TEXT.R[1] })
  if (phonesAll.some((w) => w.phones[0]?.ph === 'Z')) out.push({ key: 's', text: TIP_TEXT.Z[1] })
  if (phonesAll.some((w) => ['B', 'D', 'G', 'V', 'Z'].includes(w.phones[w.phones.length - 1]?.ph) && w.word.length > 2))
    out.push({ key: 'Ende', text: TIP_TEXT.END[1] })
  // doppelte entfernen, max. 2
  const seen = new Set()
  return out.filter((t) => (seen.has(t.text) ? false : seen.add(t.text))).slice(0, 2)
}
