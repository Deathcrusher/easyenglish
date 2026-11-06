import { useApp } from '../App.jsx'
import { Reader, ReadingList } from './Reader.jsx'

export default function Practice() {
  const { go, state } = useApp()
  const mistakes = Object.keys(state.gapMistakes || {}).filter((k) => k.includes(':')).length
  const items = [
    { icon: '🎤', title: 'Aussprache & Nachsprechen', sub: 'Knifflige Laute, Sätze nachsprechen mit Mikro', on: () => go('speak') },
    { icon: '📰', title: 'Lesen', sub: '30 Texte: die Geschichte von Mia – mit Vorlesen', on: () => go('reading') },
    { icon: '🧩', title: 'Sätze bauen & Diktat', sub: 'Wortstellung üben, hören und aufschreiben', on: () => go('sentences') },
    { icon: '⚡', title: 'Tagesmix', sub: '10 Minuten: Wörter, Grammatik, Sätze, Sprechen', on: () => go('home', { lesson: true }) },
    { icon: '🎲', title: 'Grammatik-Mix', sub: '10 Fragen quer durch alle Themen', on: () => go('grammar', { quiz: 'mix' }) },
    ...(mistakes ? [{ icon: '🎯', title: 'Fehler-Training', sub: `${mistakes} ${mistakes === 1 ? 'Frage, die' : 'Fragen, die'} noch nicht sitzt${mistakes === 1 ? '' : 'en'}`, on: () => go('grammar', { quiz: 'mistakes' }) }] : []),
  ]
  return (
    <div>
      <header className="page-head">
        <h1>Üben</h1>
        <p className="sub">Extra-Training neben dem Kurs – such dir aus, worauf du Lust hast.</p>
      </header>
      <div className="todo">
        {items.map((it) => (
          <button key={it.title} className="todo-item" onClick={it.on}>
            <span className="todo-icon">{it.icon}</span>
            <span className="todo-text">
              <strong>{it.title}</strong>
              <small>{it.sub}</small>
            </span>
            <span className="arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Reading() {
  const { route, setRoute } = useApp()
  if (route?.reading) return <Reader id={route.reading} onBack={() => setRoute(null)} />
  return <ReadingList onOpen={(id) => setRoute({ reading: id })} />
}
