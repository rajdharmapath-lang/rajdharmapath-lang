// Word shape: { id, hanzi, pinyin, en, ta }
// Category shape: { id, name, declaredWordCount, words }
//
// IMPORTANT: only "greetings" is populated below. The 8-word set comes from your
// speech_3_english.svg / speech_3_tamil.svg mockups (a superset of what was in
// Vocabulary.svg / full_vocabulary.svg — merged here so Vocabulary and Speech
// practice draw from one consistent list instead of two overlapping ones).
// Every word/translation here is transcribed directly from your own SVGs, not
// invented by me.
//
// One flag: your speech_3 mockup shows 不客气 (Bú kèqi, "You're welcome") with the
// Tamil translation நன்றி — which is also the Tamil given for 谢谢 (Thank you) two
// rows above. That looks like a copy/paste duplicate in the source design rather
// than the intended translation for "you're welcome". I kept it exactly as shown
// rather than guess a correction — worth checking with your Tamil content source.
//
// The other categories are wired up with the names + word counts shown in your
// Vocabulary_category_list.svg design, but with an empty `words` array. I didn't
// fill these in because getting Tamil translations wrong in a language-learning
// app is a real trust/accuracy problem — that content should come from you or
// your content team. Add entries in the same shape and everything (search,
// audio, favorites, recents, speech practice) works immediately with no code changes.
export const vocabularyCategories = [
  {
    id: 'greetings',
    name: 'Greetings',
    declaredWordCount: 20,
    words: [
      { id: 'g1', hanzi: '你好', pinyin: 'Nǐ hǎo', en: 'Hello', ta: 'வணக்கம்' },
      { id: 'g2', hanzi: '早', pinyin: 'Zǎo', en: 'Good morning', ta: 'காலை வணக்கம்' },
      { id: 'g3', hanzi: '下午好', pinyin: 'Xiàwǔ hǎo', en: 'Good afternoon', ta: 'மதிய வணக்கம்' },
      { id: 'g4', hanzi: '晚上好', pinyin: 'Wǎnshàng hǎo', en: 'Good evening', ta: 'மாலை வணக்கம்' },
      { id: 'g5', hanzi: '晚安', pinyin: "Wǎn'ān", en: 'Good night', ta: 'இனிய இரவு' },
      { id: 'g6', hanzi: '欢迎', pinyin: 'Huānyíng', en: 'Welcome', ta: 'வரவேற்கிறோம்' },
      { id: 'g7', hanzi: '谢谢', pinyin: 'Xièxie', en: 'Thank you', ta: 'நன்றி' },
      { id: 'g8', hanzi: '不客气', pinyin: 'Bú kèqi', en: "You're welcome", ta: 'நன்றி' }, // see flag above
      { id: 'g9', hanzi: '多少钱？', pinyin: 'Duōshao qián?', en: 'How much?', ta: 'எவ்வளவு?' },
      { id: 'g10', hanzi: '请问', pinyin: 'Qǐngwèn', en: 'Excuse me', ta: 'கேட்கலாமா' },
      { id: 'g11', hanzi: '对不起', pinyin: 'Duìbuqǐ', en: 'Sorry', ta: 'மன்னிக்கவும்' },
    ],
  },
  { id: 'numbers', name: 'Numbers', declaredWordCount: 15, words: [] },
  { id: 'food', name: 'Food', declaredWordCount: 25, words: [] },
  { id: 'orders', name: 'Orders', declaredWordCount: 18, words: [] },
  { id: 'family', name: 'Family', declaredWordCount: 20, words: [] },
  { id: 'travel', name: 'Travel', declaredWordCount: 16, words: [] },
  { id: 'time_date', name: 'Time & Date', declaredWordCount: 24, words: [] },
];

export function getCategoryById(id) {
  return vocabularyCategories.find((c) => c.id === id) || null;
}

export function getAllWords() {
  return vocabularyCategories.flatMap((c) => c.words);
}

export function findWordById(id) {
  return getAllWords().find((w) => w.id === id) || null;
}
