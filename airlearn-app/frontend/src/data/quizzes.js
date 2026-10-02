// Question shape by type:
// - 'vocabulary' | 'listening': { id, type, wordId, optionWordIds: [correctId, ...3 distractor ids] }
//     Label shown for each option is resolved at render time from the word's
//     en/ta field based on the user's chosen app language — kept out of this
//     data so Tamil/English stay in sync with one source (data/vocabulary.js).
// - 'image': same shape as vocabulary/listening. The SVG mockup's own "image"
//     placeholder is a generic picture icon, not a real photo — so a generic
//     icon here matches the design, not a shortcut.
// - 'speech': { id, type, wordId } — user holds mic, we score via assessPronunciation.
// - 'stroke': { id, type, character } — user traces the character; completing
//     the trace counts as correct (no separate "wrong" state, since HanziWriter's
//     trace mode requires eventual correct order rather than accepting a bad one).
//
// The available Foundation challenge uses verified Greetings words and
// characters with real stroke data. Add more challenges when their question
// content is ready rather than showing empty numbered entries.
//
// IMPORTANT: the question count per quiz is NOT fixed anywhere in the app.
// QuizPlayScreen, QuizProgressHeader, and QuizResultScreen all derive "total"
// from questions.length — this sample quiz happens to have 10, but a quiz with
// 4 or 40 questions works identically with no code changes. Once the admin
// panel/backend exists, each quiz's `questions` array is expected to come from
// there with whatever length the admin sets — nothing here should be read as
// "quizzes must have 10 questions."
export const quizzesByBatch = {
  foundation: [
    {
      id: 'quiz1',
      name: 'Foundation Practice',
      skillsIncluded: ['Vocabulary', 'Listening', 'Speech', 'Stroke', 'Sentence Building'],
      questions: [
        {
          id: 'q1',
          type: 'vocabulary',
          pathTitle: 'Say Hello',
          chapter: 1,
          wordId: 'g1',
          optionWordIds: ['g1', 'g7', 'g11', 'g10'],
        },
        {
          id: 'q2',
          type: 'vocabulary',
          pathTitle: 'Say Thank You',
          chapter: 1,
          wordId: 'g7',
          optionWordIds: ['g7', 'g1', 'g9', 'g8'],
        },
        {
          id: 'q3',
          type: 'image',
          pathTitle: 'Picture Clue',
          chapter: 1,
          wordId: 'g9',
          optionWordIds: ['g9', 'g1', 'g5', 'g6'],
        },
        {
          id: 'q4',
          type: 'listening',
          pathTitle: 'Listen: Excuse Me',
          chapter: 2,
          wordId: 'g10',
          optionWordIds: ['g10', 'g2', 'g3', 'g4'],
        },
        {
          id: 'q5',
          type: 'listening',
          pathTitle: 'Listen: Sorry',
          chapter: 2,
          wordId: 'g11',
          optionWordIds: ['g11', 'g6', 'g7', 'g8'],
        },
        { id: 'q6', type: 'speech', pathTitle: 'Speak: Hello', chapter: 2, wordId: 'g1' },
        { id: 'q7', type: 'speech', pathTitle: 'Speak: Thank You', chapter: 2, wordId: 'g7' },
        { id: 'q8', type: 'stroke', pathTitle: 'Write 你', chapter: 3, character: '你' },
        { id: 'q9', type: 'stroke', pathTitle: 'Write 好', chapter: 3, character: '好' },
        { id: 'q10', type: 'stroke', pathTitle: 'Write 学', chapter: 3, character: '学' },
        {
          id: 'q11',
          type: 'sentence',
          pathTitle: 'Can You Help Me?',
          chapter: 4,
          sentence: '你 ___ 帮我吗？',
          pinyin: 'Nǐ ___ bāng wǒ ma?',
          meaning: 'Can you help me?',
          options: [
            { id: 's11a', hanzi: '能', pinyin: 'néng' },
            { id: 's11b', hanzi: '我', pinyin: 'wǒ' },
            { id: 's11c', hanzi: '是', pinyin: 'shì' },
            { id: 's11d', hanzi: '好', pinyin: 'hǎo' },
          ],
        },
        {
          id: 'q12',
          type: 'sentence',
          pathTitle: 'I Am a Student',
          chapter: 4,
          sentence: '我 ___ 学生。',
          pinyin: 'Wǒ ___ xuésheng.',
          meaning: 'I am a student.',
          options: [
            { id: 's12a', hanzi: '是', pinyin: 'shì' },
            { id: 's12b', hanzi: '叫', pinyin: 'jiào' },
            { id: 's12c', hanzi: '吗', pinyin: 'ma' },
            { id: 's12d', hanzi: '谢谢', pinyin: 'xièxie' },
          ],
        },
        {
          id: 'q13',
          type: 'sentence',
          pathTitle: 'What Is Your Name?',
          chapter: 4,
          sentence: '你 ___ 什么名字？',
          pinyin: 'Nǐ ___ shénme míngzi?',
          meaning: 'What is your name?',
          options: [
            { id: 's13a', hanzi: '叫', pinyin: 'jiào' },
            { id: 's13b', hanzi: '喝', pinyin: 'hē' },
            { id: 's13c', hanzi: '吃', pinyin: 'chī' },
            { id: 's13d', hanzi: '在', pinyin: 'zài' },
          ],
        },
        {
          id: 'q14',
          type: 'sentence',
          pathTitle: 'I Want Tea',
          chapter: 4,
          sentence: '我想 ___ 茶。',
          pinyin: 'Wǒ xiǎng ___ chá.',
          meaning: 'I want to drink tea.',
          options: [
            { id: 's14a', hanzi: '喝', pinyin: 'hē' },
            { id: 's14b', hanzi: '吃', pinyin: 'chī' },
            { id: 's14c', hanzi: '叫', pinyin: 'jiào' },
            { id: 's14d', hanzi: '是', pinyin: 'shì' },
          ],
        },
        {
          id: 'q15',
          type: 'sentence',
          pathTitle: 'Do You Speak Chinese?',
          chapter: 4,
          sentence: '你会说中文 ___？',
          pinyin: 'Nǐ huì shuō Zhōngwén ___?',
          meaning: 'Can you speak Chinese?',
          options: [
            { id: 's15a', hanzi: '吗', pinyin: 'ma' },
            { id: 's15b', hanzi: '我', pinyin: 'wǒ' },
            { id: 's15c', hanzi: '好', pinyin: 'hǎo' },
            { id: 's15d', hanzi: '谢谢', pinyin: 'xièxie' },
          ],
        },
        {
          id: 'q16',
          type: 'sentence',
          pathTitle: 'Where Is the Bathroom?',
          chapter: 4,
          sentence: '请问，厕所 ___ 哪儿？',
          pinyin: 'Qǐngwèn, cèsuǒ ___ nǎr?',
          meaning: 'Excuse me, where is the bathroom?',
          options: [
            { id: 's16a', hanzi: '在', pinyin: 'zài' },
            { id: 's16b', hanzi: '叫', pinyin: 'jiào' },
            { id: 's16c', hanzi: '是', pinyin: 'shì' },
            { id: 's16d', hanzi: '喝', pinyin: 'hē' },
          ],
        },
        {
          id: 'q17',
          type: 'sentencePair',
          pathTitle: 'Can You Help Me?',
          chapter: 4,
          sentenceParts: ['你 ', ' 帮 ', ' 吗？'],
          pinyinParts: ['Nǐ ', ' bāng ', ' ma?'],
          meaning: 'Can you help me?',
          blanks: [
            {
              correctOptionId: 's17a',
              options: [
                { id: 's17a', hanzi: '能', pinyin: 'néng' },
                { id: 's17b', hanzi: '很', pinyin: 'hěn' },
                { id: 's17c', hanzi: '是', pinyin: 'shì' },
                { id: 's17d', hanzi: '好', pinyin: 'hǎo' },
              ],
            },
            {
              correctOptionId: 's17e',
              options: [
                { id: 's17e', hanzi: '我', pinyin: 'wǒ' },
                { id: 's17f', hanzi: '水', pinyin: 'shuǐ' },
                { id: 's17g', hanzi: '吗', pinyin: 'ma' },
                { id: 's17h', hanzi: '是', pinyin: 'shì' },
              ],
            },
          ],
        },
      ],
    },
  ],
  elevation: [],
  distinction: [],
};

export function getQuizzesForBatch(batchId) {
  return quizzesByBatch[batchId] || [];
}

export function getQuiz(batchId, quizId) {
  return getQuizzesForBatch(batchId).find((q) => q.id === quizId) || null;
}
