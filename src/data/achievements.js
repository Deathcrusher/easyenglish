import { ALL_WORDS, TOPICS } from './vocab.js'
import { TENSES } from './grammar.js'
import { LEARNED_BOX, streakOf } from '../lib/storage.js'

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

  return [
    { id: 'first', icon: '👣', title: 'Erste Schritte', desc: '10 XP sammeln', v: totalXp, max: 10 },
    { id: 'lesson1', icon: '📅', title: 'Lektion geschafft', desc: 'Eine Tageslektion abschließen', v: s.lessons || 0, max: 1 },
    { id: 'goal', icon: '🎯', title: 'Zielstrebig', desc: 'Tagesziel 5-mal erreichen', v: goalDays, max: 5 },
    { id: 'streak3', icon: '🔥', title: 'Am Ball', desc: '3 Tage in Folge', v: streak, max: 3 },
    { id: 'streak7', icon: '🌋', title: 'Eine ganze Woche', desc: '7 Tage in Folge', v: streak, max: 7 },
    { id: 'words10', icon: '🌱', title: 'Wortsammlerin', desc: '10 Wörter sicher können', v: learned, max: 10 },
    { id: 'words50', icon: '🌳', title: 'Wortschatz-Profi', desc: '50 Wörter sicher können', v: learned, max: 50 },
    { id: 'seenall', icon: '🗺️', title: 'Entdeckerin', desc: 'Alle Wörter einmal gesehen', v: seen, max: ALL_WORDS.length },
    { id: 'topic', icon: '🏅', title: 'Themen-Meisterin', desc: 'Ein ganzes Thema sicher', v: topicsDone, max: 1 },
    { id: 'tenses', icon: '⏳', title: 'Zeitreisende', desc: 'Alle Zeiten mit 4/5 oder besser', v: tensesDone, max: TENSES.length },
    { id: 'speak', icon: '🎤', title: 'Gut gesprochen', desc: '20-mal gut nachsprechen', v: s.spoken || 0, max: 20 },
    { id: 'build', icon: '🧩', title: 'Satzbaumeisterin', desc: '25 Sätze richtig bauen', v: s.sentences || 0, max: 25 },
    { id: 'dict', icon: '✍️', title: 'Gutes Gehör', desc: '10 Diktate richtig', v: s.dictation || 0, max: 10 },
    { id: 'write', icon: '⌨️', title: 'Rechtschreib-Ass', desc: '30 Wörter richtig geschrieben', v: s.written || 0, max: 30 },
    { id: 'big', icon: '⚡', title: 'Power-Tag', desc: '100 XP an einem Tag', v: bestDay, max: 100 },
    { id: 'xp1000', icon: '👑', title: 'Englisch-Queen', desc: '1000 XP insgesamt', v: totalXp, max: 1000 },
  ].map((a) => ({ ...a, done: a.v >= a.max }))
}
