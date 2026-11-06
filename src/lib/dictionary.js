// Kleines Wörterbuch für die Lesetexte: Wort antippen → deutsche Bedeutung
import { WORD_BY_EN } from '../data/units.js'
import { IRREGULAR } from '../data/grammar.js'

// unregelmäßige Formen → Grundform
const IRR = {}
for (const [base, past, pp] of IRREGULAR) {
  for (const f of [...past.split(' / '), ...pp.split(' / ')]) IRR[f] = base
}
Object.assign(IRR, {
  flew: 'fly', flown: 'fly', met: 'meet', spoke: 'speak', taught: 'teach', ran: 'run', fell: 'fall',
  fallen: 'fall', heard: 'hear', sat: 'sit', swam: 'swim', sang: 'sing', won: 'win', hid: 'hide',
  caught: 'catch', became: 'become', kept: 'keep', woke: 'wake', stole: 'steal', broke: 'break',
  broken: 'break', understood: 'understand', grew: 'grow', fed: 'feed', paid: 'pay', sold: 'sell',
  built: 'build', felt: 'feel', made: 'make', is: 'be', are: 'be', am: 'be', was: 'be', were: 'be',
  been: 'be', has: 'have', had: 'have', does: 'do', did: 'do', children: 'child', men: 'man',
  women: 'woman', better: 'good', best: 'good', worse: 'bad', worst: 'bad', teeth: 'teeth',
})

// häufige kleine Wörter, die nicht im Vokabeltrainer stehen
const BASIC = {
  the: 'der / die / das', a: 'ein(e)', an: 'ein(e)', and: 'und', or: 'oder', to: 'zu / nach', of: 'von',
  at: 'an / um / bei', with: 'mit', from: 'von / aus', by: 'von / mit / bis', about: 'über / ungefähr',
  i: 'ich', you: 'du / Sie / ihr', he: 'er', she: 'sie', it: 'es', we: 'wir', they: 'sie', me: 'mich / mir',
  him: 'ihn / ihm', her: 'sie / ihr', us: 'uns', them: 'sie / ihnen', my: 'mein(e)', your: 'dein(e) / Ihr(e)',
  his: 'sein(e)', its: 'sein(e)', our: 'unser(e)', their: 'ihr(e)', not: 'nicht', very: 'sehr', too: 'auch / zu',
  also: 'auch', all: 'alle / alles', some: 'etwas / einige', any: 'irgendein / kein', many: 'viele', much: 'viel',
  there: 'dort / da', here: 'hier', these: 'diese (hier)', those: 'jene (dort)', which: 'welche(r) / die / das',
  whose: 'wessen / deren', if: 'wenn / ob', up: 'hinauf / auf', down: 'hinunter', out: 'hinaus / aus',
  off: 'aus / ab', into: 'in … hinein', only: 'nur', every: 'jede(r)', other: 'andere(r)', again: 'wieder',
  one: 'eins / man', just: 'gerade / nur', will: 'werden', would: 'würde', could: 'könnte', can: 'können',
  should: 'sollte', must: 'müssen', get: 'bekommen / werden', got: 'bekam / wurde', go: 'gehen / fahren',
  make: 'machen', take: 'nehmen', say: 'sagen', says: 'sagt', said: 'sagte', come: 'kommen', know: 'wissen / kennen',
  think: 'denken / glauben', want: 'wollen', like: 'mögen / wie', look: 'schauen', next: 'nächste(r)',
  last: 'letzte(r)', first: 'erste(r) / zuerst', many: 'viele', most: 'die meisten', such: 'so ein(e)',
  everybody: 'alle / jeder', someone: 'jemand', nobody: 'niemand', no: 'nein / kein', yes: 'ja', ok: 'okay',
  "i'm": 'ich bin', "you're": 'du bist / ihr seid', "he's": 'er ist / er hat', "she's": 'sie ist / sie hat',
  "it's": 'es ist', "we're": 'wir sind', "they're": 'sie sind', "that's": 'das ist', "there's": 'es gibt',
  "let's": 'lass uns', "don't": 'nicht (do not)', "doesn't": 'nicht (does not)', "didn't": 'nicht (did not)',
  "isn't": 'ist nicht', "aren't": 'sind nicht', "wasn't": 'war nicht', "weren't": 'waren nicht',
  "can't": 'kann nicht', "couldn't": 'konnte nicht', "won't": 'wird nicht', "haven't": 'habe nicht',
  "hasn't": 'hat nicht', "i've": 'ich habe', "we've": 'wir haben', "i'll": 'ich werde', "we'll": 'wir werden',
  "i'd": 'ich würde / ich hätte', "you'll": 'du wirst', "it'll": 'es wird',
}

const NAMES = new Set(['mia', 'leo', 'sarah', 'pixel', 'jakob', 'anna', 'tom', 'lisa', 'huber', 'weber', 'berger', 'alpenhof', 'innsbruck', 'london', 'salzburg', 'vienna', 'austria', 'britain', 'sweden', 'japan', 'canada', 'italy', 'croatia', 'tyrol', 'graz', 'paris', 'rome', 'spain', 'ireland', 'hawaii'])

const RULES = [
  [/'s$/, ''], [/s'$/, 's'], [/ies$/, 'y'], [/ied$/, 'y'], [/(ss|sh|ch|x|o)es$/, '$1'], [/s$/, ''],
  [/([^aeiou])\1ed$/, '$1'], [/ed$/, 'e'], [/ed$/, ''], [/([^aeiou])\1ing$/, '$1'], [/ing$/, 'e'], [/ing$/, ''],
  [/ier$/, 'y'], [/iest$/, 'y'], [/([^aeiou])\1er$/, '$1'], [/([^aeiou])\1est$/, '$1'], [/er$/, ''], [/est$/, ''],
  [/r$/, ''], [/st$/, ''], [/ily$/, 'y'], [/ly$/, ''],
]

export function lemmas(word) {
  const w = word.toLowerCase().replace(/[’‘]/g, "'")
  const out = [w]
  if (IRR[w]) out.push(IRR[w])
  for (const [re, rep] of RULES) if (re.test(w)) out.push(w.replace(re, rep))
  return [...new Set(out)]
}

function entryFor(key, gloss) {
  if (gloss && gloss[key]) return { de: gloss[key] }
  const w = WORD_BY_EN[key]
  if (w) return { de: w.de, word: w }
  return null
}

// Sucht für das angetippte Wort (Index i in words) den längsten passenden Eintrag
export function lookupAt(words, i, gloss) {
  // Wendungen mit 2–4 Wörtern, die das angetippte Wort enthalten (längste zuerst,
  // bevorzugt die, die beim angetippten Wort beginnt) – z. B. „in front of“, „of course“
  for (let n = 4; n >= 2; n--) {
    for (let start = i; start >= i - n + 1; start--) {
      if (start < 0 || start + n > words.length) continue
      const phrase = words.slice(start, start + n).join(' ').toLowerCase()
      const e = entryFor(phrase, gloss)
      if (e) return { text: words.slice(start, start + n).join(' '), ...e }
    }
  }
  const word = words[i]
  const low = word.toLowerCase().replace(/[’‘]/g, "'")
  const bare = low.replace(/'s$/, '')
  if (NAMES.has(bare)) return { text: word, de: low.endsWith("'s") ? `Name (${word} = von ${word.slice(0, -2)})` : 'Name / Ort' }
  if (gloss && gloss[low]) return { text: word, de: gloss[low] }
  for (const l of lemmas(word)) {
    const e = entryFor(l, gloss)
    if (e) return { text: word, base: l !== low ? l : null, ...e }
  }
  if (BASIC[low]) return { text: word, de: BASIC[low] }
  for (const l of lemmas(word)) if (BASIC[l]) return { text: word, base: l, de: BASIC[l] }
  return { text: word, de: null }
}
