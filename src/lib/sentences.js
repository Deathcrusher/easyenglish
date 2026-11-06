// Beispielsätze einer Lektion als Satzbau-Aufgaben
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function sentenceItems(unit, n) {
  const ok = unit.words.filter((w) => {
    if (!w.ex || /["„“]/.test(w.ex)) return false
    const len = w.ex.split(' ').length
    return len >= 3 && len <= 9
  })
  return shuffle(ok)
    .slice(0, n)
    .map((w) => ({ en: w.ex, de: w.exDe, tip: `Neues Wort: ${w.en} = ${w.de}` }))
}
