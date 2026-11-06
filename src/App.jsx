import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { loadState, saveState, resetState, dayKey, gradeCard } from './lib/storage.js'
import { setAccent, setVoice, stopSpeaking } from './lib/speech.js'
import Home from './components/Home.jsx'
import Course from './components/Course.jsx'
import Vocab from './components/Vocab.jsx'
import Grammar from './components/Grammar.jsx'
import Speak from './components/Speak.jsx'
import Sentences from './components/Sentences.jsx'
import Practice, { Reading } from './components/Practice.jsx'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const TABS = [
  { id: 'home', label: 'Start', icon: '🏠' },
  { id: 'course', label: 'Kurs', icon: '🗺️' },
  { id: 'vocab', label: 'Wörter', icon: '📚' },
  { id: 'grammar', label: 'Grammatik', icon: '📖' },
  { id: 'practice', label: 'Üben', icon: '🎯' },
]

// Unterbereiche von „Üben“ – in der Leiste bleibt „Üben“ markiert
const SUB_TABS = { speak: 'practice', sentences: 'practice', reading: 'practice' }

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('home')
  const [route, setRoute] = useState(null) // Unterseite innerhalb eines Tabs
  const [toast, setToast] = useState(null)

  useEffect(() => saveState(state), [state])
  useEffect(() => setAccent(state.accent), [state.accent])
  useEffect(() => setVoice(state.voice), [state.voice])

  const api = useMemo(
    () => ({
      state,
      update: (patch) => setState((s) => ({ ...s, ...patch })),
      addXp: (n) =>
        setState((s) => {
          const k = dayKey()
          const before = s.days[k] || 0
          const after = before + n
          if (before < s.goal && after >= s.goal) {
            setToast('🎉 Tagesziel geschafft! Super gemacht!')
            setTimeout(() => setToast(null), 3200)
          }
          return { ...s, days: { ...s.days, [k]: after } }
        }),
      grade: (id, g) =>
        setState((s) => ({ ...s, cards: { ...s.cards, [id]: gradeCard(s.cards[id], g) } })),
      markGap: (id, ok) =>
        setState((s) => {
          const m = { ...(s.gapMistakes || {}) }
          if (ok) delete m[id]
          else m[id] = true
          return { ...s, gapMistakes: m }
        }),
      count: (key, n = 1) =>
        setState((s) => ({ ...s, stats: { ...s.stats, [key]: (s.stats?.[key] || 0) + n } })),
      replace: (next) => setState(next),
      reset: () => setState(resetState()),
      go: (t, r = null) => {
        stopSpeaking()
        setTab(t)
        setRoute(r)
        window.scrollTo({ top: 0 })
      },
      route,
      setRoute: (r) => {
        setRoute(r)
        window.scrollTo({ top: 0 })
      },
    }),
    [state, route]
  )

  const Page = {
    home: Home, course: Course, vocab: Vocab, grammar: Grammar, practice: Practice,
    speak: Speak, sentences: Sentences, reading: Reading,
  }[tab]
  const activeTab = SUB_TABS[tab] || tab

  return (
    <AppCtx.Provider value={api}>
      <div className="app">
        <main className="page" key={tab}>
          {SUB_TABS[tab] && !route && (
            <button className="back" onClick={() => api.go('practice')}>← Üben</button>
          )}
          <Page />
        </main>
        {toast && <div className="toast">{toast}</div>}
        <nav className="tabbar">
          {TABS.map((t) => (
            <button key={t.id} className={activeTab === t.id ? 'active' : ''} onClick={() => api.go(t.id)}>
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </AppCtx.Provider>
  )
}
