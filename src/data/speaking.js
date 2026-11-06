// Laute, die für Deutschsprachige schwierig sind
export const SOUNDS = [
  {
    id: 'th',
    title: 'Das „th“',
    ipa: 'θ / ð',
    icon: '👅',
    explain:
      'Das th gibt es im Deutschen nicht. Viele sagen „s“ oder „d“ – dann wird aus „think“ (denken) schnell „sink“ (sinken).',
    how: [
      'Zungenspitze leicht zwischen die Zähne legen.',
      'Luft über die Zunge blasen – ohne Stimme: θ wie in „think“.',
      'Mit Stimme (summen): ð wie in „the“ oder „mother“.',
    ],
    pairs: [
      ['think', 'sink'],
      ['thank', 'sank'],
      ['three', 'free'],
      ['they', 'day'],
      ['mouth', 'mouse'],
    ],
    practice: ['I think so.', 'Thank you very much.', 'The weather is nice this Thursday.'],
  },
  {
    id: 'w',
    title: 'w und v',
    ipa: 'w / v',
    icon: '💋',
    explain:
      'Das englische w ist KEIN deutsches w. Es klingt eher wie ein kurzes „u“. Das englische v ist wie unser deutsches w.',
    how: [
      'w: Lippen rund machen wie beim Pfeifen, dann aufmachen – „u-ine“ = wine.',
      'v: obere Zähne auf die Unterlippe – wie das deutsche w in „Wasser“.',
    ],
    pairs: [
      ['wine', 'vine'],
      ['west', 'vest'],
      ['wet', 'vet'],
      ['while', 'vile'],
    ],
    practice: ['We want to win.', 'What a wonderful view!', 'Very well, we will wait.'],
  },
  {
    id: 'end',
    title: 'Weiche Endungen',
    ipa: 'd / z / v',
    icon: '🔚',
    explain:
      'Im Deutschen werden Endungen hart: „Rad“ klingt wie „Rat“. Im Englischen ändert das die Bedeutung! bed (Bett) ≠ bet (Wette).',
    how: [
      'Bei Wörtern mit d, b, g, z, v am Ende: den Laut weich und mit Stimme sprechen.',
      'Tipp: Der Vokal davor wird etwas länger gezogen – bed klingt länger als bet.',
    ],
    pairs: [
      ['bed', 'bet'],
      ['dog', 'dock'],
      ['eyes', 'ice'],
      ['prize', 'price'],
      ['have', 'half'],
    ],
    practice: ['Go to bed.', 'My dog is good.', 'Close your eyes.'],
  },
  {
    id: 'ae',
    title: 'Kurzes „ä“ (æ)',
    ipa: 'æ / e',
    icon: '😮',
    explain:
      'Der Laut in „cat“ oder „bad“ liegt zwischen a und ä – Mund weit offen! Sonst klingt „bad“ (schlecht) wie „bed“ (Bett).',
    how: [
      'Mund weit aufmachen, Kiefer nach unten.',
      'Dann ein kurzes „ä“ sagen – fast wie ein Schaf: „bäh“.',
    ],
    pairs: [
      ['bad', 'bed'],
      ['man', 'men'],
      ['sad', 'said'],
      ['pan', 'pen'],
    ],
    practice: ['The cat is sad.', 'That man has a black hat.', 'I am happy.'],
  },
  {
    id: 'ed',
    title: 'Die Endung -ed',
    ipa: 't / d / ɪd',
    icon: '⏪',
    explain:
      'Die -ed Endung (Vergangenheit) wird NICHT immer als „ed“ gesprochen. Es gibt drei Varianten.',
    how: [
      'Nach t oder d → „id“: wanted (WON-tid), needed.',
      'Nach p, k, s, sch, tsch, f → „t“: walked (wokt), stopped, washed.',
      'Sonst → „d“: played (pleid), called, lived.',
    ],
    pairs: [
      ['walked', 'wanted'],
      ['played', 'needed'],
      ['watched', 'started'],
    ],
    practice: ['I walked home.', 'She wanted to stay.', 'We played all evening.'],
  },
  {
    id: 'silent',
    title: 'Stumme Buchstaben',
    ipa: '—',
    icon: '🤫',
    explain: 'Viele Buchstaben werden einfach nicht gesprochen. Diese Wörter muss man sich merken.',
    how: [
      'k vor n ist stumm: knife, know, knee.',
      'w vor r ist stumm: write, wrong.',
      'Weitere Klassiker: listen (t), Wednesday (d), island (s), hour (h).',
    ],
    pairs: [
      ['knife', 'night'],
      ['write', 'right'],
      ['know', 'no'],
      ['hour', 'our'],
    ],
    practice: ['I know the answer.', 'Listen to me.', 'See you on Wednesday.'],
  },
]

// Sätze zum Nachsprechen
export const PHRASES = [
  { en: 'Hello, how are you?', de: 'Hallo, wie geht es dir?', lvl: 1 },
  { en: "I'm fine, thank you.", de: 'Mir geht es gut, danke.', lvl: 1 },
  { en: 'Nice to meet you.', de: 'Freut mich, dich kennenzulernen.', lvl: 1 },
  { en: 'Can you repeat that, please?', de: 'Kannst du das bitte wiederholen?', lvl: 1 },
  { en: 'Could you speak more slowly?', de: 'Könntest du langsamer sprechen?', lvl: 1 },
  { en: 'Where is the bathroom?', de: 'Wo ist die Toilette?', lvl: 1 },
  { en: "I'd like a coffee, please.", de: 'Ich hätte gern einen Kaffee, bitte.', lvl: 1 },
  { en: 'How much does it cost?', de: 'Wie viel kostet das?', lvl: 1 },
  { en: 'I live in Innsbruck, in Austria.', de: 'Ich wohne in Innsbruck, in Österreich.', lvl: 1 },
  { en: 'What do you do for a living?', de: 'Was machst du beruflich?', lvl: 2 },
  { en: 'I really love cats.', de: 'Ich liebe Katzen wirklich.', lvl: 1 },
  { en: 'I think this is a good idea.', de: 'Ich glaube, das ist eine gute Idee.', lvl: 2 },
  { en: 'What did you do last weekend?', de: 'Was hast du letztes Wochenende gemacht?', lvl: 2 },
  { en: 'I have never been to New York.', de: 'Ich war noch nie in New York.', lvl: 2 },
  { en: "I'm looking forward to it.", de: 'Ich freue mich darauf.', lvl: 2 },
  { en: "I'm going to visit my friends tomorrow.", de: 'Ich besuche morgen meine Freunde.', lvl: 2 },
  { en: 'Three thousand three hundred and thirty-three.', de: 'Dreitausenddreihundertdreiunddreißig (th-Training!)', lvl: 3 },
  { en: 'The weather was wonderful on Wednesday.', de: 'Das Wetter war am Mittwoch wunderbar.', lvl: 3 },
  { en: 'I was watching a scary movie when the lights went out.', de: 'Ich schaute einen Horrorfilm, als das Licht ausging.', lvl: 3 },
  { en: 'Have you ever thought about living abroad?', de: 'Hast du je daran gedacht, im Ausland zu leben?', lvl: 3 },
]
