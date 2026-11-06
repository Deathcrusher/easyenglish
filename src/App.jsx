import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, resetState, dayKey, gradeCard } from './lib/storage.js'
import { setAccent, setVoice, setNatural, stopSpeaking } from './lib/speech.js'
import { checkSpeechService } from './lib/azure.js'
import { checkForUpdate } from './lib/update.js'
import Home from './components/Home.jsx'
import Course from './components/Course.jsx'
import Vocab from './components/Vocab.jsx'
import Grammar from './components/Grammar.jsx'
import Speak from './components/Speak.jsx'
import Sentences from './components/Sentences.jsx'
import Practice, { Reading } from './components/Practice.jsx'
import Me from './components/Me.jsx'
import Lesson from './components/Lesson.jsx'

const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

// Nur drei Bereiche: Lernen (Kurs), Üben (freiwillig), Ich (Fortschritt & Einstellungen)
const TABS = [
  { id: 'home', label: 'Lernen', icon: '🏠' },
  { id: 'practice', label: 'Üben', icon: '🎯' },
  { id: 'me', label: 'Ich', icon: '👤' },
]

// Unterseiten – in der Leiste bleibt der übergeordnete Bereich markiert
const SUB_TABS = {
  course: 'home',
  vocab: 'practice', grammar: 'practice', speak: 'practice', sentences: 'practice', reading: 'practice', mix: 'practice',
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('home')
  const [route, setRoute] = useState(null) // Unterseite innerhalb eines Tabs
  const [toast, setToast] = useState(null)
  const [updateReady, setUpdateReady] = useState(false)
  const where = useRef({ tab: 'home', route: null })
  where.current = { tab, route }

  // Neue Version? Beim Öffnen, beim Zurückkehren in die App und alle 30 Minuten prüfen.
  // Auf der Startseite wird sofort neu geladen, mitten in einer Übung nur ein Hinweis gezeigt.
  useEffect(() => {
    let alive = true
    const run = async () => {
      if (!(await checkForUpdate()) || !alive) return
      const { tab: t, route: r } = where.current
      if (t === 'home' && !r) window.location.reload()
      else setUpdateReady(true)
    }
    const onVisible = () => document.visibilityState === 'visible' && run()
    const first = setTimeout(run, 4000)
    const every = setInterval(run, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      clearTimeout(first)
      clearInterval(every)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => saveState(state), [state])
  useEffect(() => setAccent(state.accent), [state.accent])
  useEffect(() => setVoice(state.voice), [state.voice])
  useEffect(() => setNatural(state.voiceNatural !== false, `${state.accent === 'gb' ? 'gb' : 'us'}-${state.voiceGender || 'f'}`), [state.voiceNatural, state.voiceGender, state.accent])
  useEffect(() => {
    checkSpeechService()
  }, [])

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
    home: Home, course: Course, practice: Practice, me: Me,
    vocab: Vocab, grammar: Grammar, speak: Speak, sentences: Sentences, reading: Reading, mix: Lesson,
  }[tab]
  const activeTab = SUB_TABS[tab] || tab

  return (
    <AppCtx.Provider value={api}>
      <div className="app">
        <main className="page" key={tab}>
          {SUB_TABS[tab] === 'practice' && !route && tab !== 'mix' && (
            <button className="back" onClick={() => api.go('practice')}>← Üben</button>
          )}
          <Page />
        </main>
        {toast && <div className="toast">{toast}</div>}
        {updateReady && (
          <div className="update-bar">
            <span>✨ Neue Version ist da</span>
            <button className="btn primary" onClick={() => window.location.reload()}>Aktualisieren</button>
          </div>
        )}
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
