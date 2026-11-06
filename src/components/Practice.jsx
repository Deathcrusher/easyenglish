import { useApp } from '../App.jsx'
import { ALL_WORDS } from '../data/units.js'
import { isDue } from '../lib/storage.js'
import { Reader, ReadingList } from './Reader.jsx'

// „Üben“: alles Freiwillige an einem Ort
export default function Practice() {
  const { go, state } = useApp()
  const due = ALL_WORDS.filter((w) => isDue(state.cards[w.id])).length
  const mistakes = Object.keys(state.gapMistakes || {}).filter((k) => k.includes(':')).length
  const tiles = [
    { icon: '📚', title: 'Wörter', sub: `${ALL_WORDS.length} Wörter · Suche`, tab: 'vocab' },
    { icon: '📖', title: 'Grammatik', sub: '30 Themen erklärt', tab: 'grammar' },
    { icon: '🎤', title: 'Aussprache', sub: 'Laute & Nachsprechen', tab: 'speak' },
    { icon: '📰', title: 'Lesen', sub: '30 kurze Texte', tab: 'reading' },
    { icon: '🧩', title: 'Sätze', sub: 'Bauen & Diktat', tab: 'sentences' },
    { icon: '⚡', title: 'Tagesmix', sub: '10 Min. gemischt', tab: 'mix' },
  ]
  return (
    <div>
      <header className="page-head">
        <h1>Üben</h1>
        <p className="sub">Freies Training – alles freiwillig.</p>
      </header>

      {due > 0 && (
        <button className="review-row" onClick={() => go('vocab', { mode: 'cards', topic: 'all' })}>
          <span className="rr-icon">🔁</span>
          <span className="rr-text">
            <strong>{due} {due === 1 ? 'Wort' : 'Wörter'} wiederholen</strong>
            <small>Heute fällig</small>
          </span>
          <span className="arrow">→</span>
        </button>
      )}
      {mistakes > 0 && (
        <button className="review-row" onClick={() => go('grammar', { quiz: 'mistakes' })}>
          <span className="rr-icon">🎯</span>
          <span className="rr-text">
            <strong>Fehler-Training</strong>
            <small>{mistakes} {mistakes === 1 ? 'Frage sitzt' : 'Fragen sitzen'} noch nicht</small>
          </span>
          <span className="arrow">→</span>
        </button>
      )}

      <div className="tile-grid">
        {tiles.map((t) => (
          <button key={t.tab} className="tile" onClick={() => go(t.tab)}>
            <span className="tile-icon">{t.icon}</span>
            <strong>{t.title}</strong>
            <small>{t.sub}</small>
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
