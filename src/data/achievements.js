import { ALL_WORDS, TOPICS } from './vocab.js'
import { TENSES } from './grammar.js'
import { LEARNED_BOX, streakOf } from '../lib/storage.js'
import { UNITS } from './units.js'
import { unitStatus } from '../lib/progress.js'

// Erfolge werden aus dem Fortschritt berechnet – nichts extra zu speichern
export function achievements(state) {
  const learned = ALL_WORDS.filter((w) => (state.cards[w.id]?.box || 0) >= LEARNED_BOX).length
  const seen = ALL_WORDS.filter((w) => state.cards[w.id]).length
  const totalXp = Object.values(state.days).reduce((a, b) => a + b, 0)
  const bestDay = Math.max(0, ...Object.values(state.days))
  const goalDays = Object.values(state.days).filter((x) => x >= state.goal).length
  const streak = streakOf(state.days, state.goal)
  const tensesDone = TENSES.filter((t) => (state.tenseDone[t.id] || 0) >= 4).length
  const topicsDone = TOPICS.filter((t) => t.words.every((w) => (state.cards[w.id]?.box || 0) >= LEARNED_BOX)).length
  const s = state.stats || {}
  const unitsDone = UNITS.filter((u) => unitStatus(u, state).complete)
  const levelDone = (l) => UNITS.filter((u) => u.level === l).every((u) => unitsDone.includes(u))
  const readingsGood = UNITS.filter((u) => (state.units?.[u.id]?.reading || 0) >= 2).length

  return [
    { id: 'first', icon: '👣', title: 'Erste Schritte', desc: '10 XP sammeln', v: totalXp, max: 10 },
    { id: 'unit1', icon: '🎓', title: 'Erste Lektion', desc: 'Eine Kurs-Lektion abschließen', v: unitsDone.length, max: 1 },
    { id: 'unit5', icon: '🧗', title: 'Dranbleiberin', desc: '5 Lektionen abschließen', v: unitsDone.length, max: 5 },
    { id: 'a1', icon: '🥉', title: 'A1 geschafft', desc: 'Alle A1-Lektionen', v: levelDone('A1') ? 1 : 0, max: 1 },
    { id: 'a2', icon: '🥈', title: 'A2 geschafft', desc: 'Alle A2-Lektionen', v: levelDone('A2') ? 1 : 0, max: 1 },
    { id: 'b1', icon: '🥇', title: 'B1 geschafft', desc: 'Alle B1-Lektionen', v: levelDone('B1') ? 1 : 0, max: 1 },
    { id: 'read10', icon: '📰', title: 'Leseratte', desc: '10 Texte gut verstanden', v: readingsGood, max: 10 },
    { id: 'lesson1', icon: '⚡', title: 'Tagesmix', desc: 'Einen Tagesmix abschließen', v: s.lessons || 0, max: 1 },
    { id: 'goal', icon: '🎯', title: 'Zielstrebig', desc: 'Tagesziel 5-mal erreichen', v: goalDays, max: 5 },
    { id: 'streak3', icon: '🔥', title: 'Am Ball', desc: '3 Tage in Folge', v: streak, max: 3 },
    { id: 'streak7', icon: '🌋', title: 'Eine ganze Woche', desc: '7 Tage in Folge', v: streak, max: 7 },
    { id: 'words10', icon: '🌱', title: 'Wortsammlerin', desc: '10 Wörter sicher können', v: learned, max: 10 },
    { id: 'words50', icon: '🌿', title: 'Wortschatz wächst', desc: '50 Wörter sicher können', v: learned, max: 50 },
    { id: 'words250', icon: '🌳', title: 'Wortschatz-Profi', desc: '250 Wörter sicher können', v: learned, max: 250 },
    { id: 'words500', icon: '🏔️', title: 'Wortschatz-Gipfel', desc: '500 Wörter sicher können', v: learned, max: 500 },
    { id: 'seenall', icon: '🗺️', title: 'Entdeckerin', desc: 'Alle Wörter einmal gesehen', v: seen, max: ALL_WORDS.length },
    { id: 'topic', icon: '🏅', title: 'Wort-Meisterin', desc: 'Alle Wörter einer Lektion sicher', v: topicsDone, max: 1 },
    { id: 'tenses', icon: '⏳', title: 'Zeitreisende', desc: 'Alle 8 Zeiten mit 4/5 oder besser', v: tensesDone, max: TENSES.length },
    { id: 'speak', icon: '🎤', title: 'Gut gesprochen', desc: '20-mal gut nachsprechen', v: s.spoken || 0, max: 20 },
    { id: 'build', icon: '🧩', title: 'Satzbaumeisterin', desc: '25 Sätze richtig bauen', v: s.sentences || 0, max: 25 },
    { id: 'dict', icon: '✍️', title: 'Gutes Gehör', desc: '10 Diktate richtig', v: s.dictation || 0, max: 10 },
    { id: 'write', icon: '⌨️', title: 'Rechtschreib-Ass', desc: '30 Wörter richtig geschrieben', v: s.written || 0, max: 30 },
    { id: 'big', icon: '⚡', title: 'Power-Tag', desc: '100 XP an einem Tag', v: bestDay, max: 100 },
    { id: 'xp1000', icon: '👑', title: 'Englisch-Queen', desc: '1000 XP insgesamt', v: totalXp, max: 1000 },
  ].map((a) => ({ ...a, done: a.v >= a.max }))
}
