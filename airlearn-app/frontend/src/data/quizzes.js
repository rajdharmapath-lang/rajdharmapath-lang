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
      name: 'Greetings Quest',
      skillsIncluded: ['Vocabulary', 'Listening', 'Speech', 'Stroke'],
      questions: [
        { id: 'q1', type: 'vocabulary', wordId: 'g1', optionWordIds: ['g1', 'g7', 'g11', 'g10'] },
        { id: 'q2', type: 'vocabulary', wordId: 'g7', optionWordIds: ['g7', 'g1', 'g9', 'g8'] },
        { id: 'q3', type: 'image', wordId: 'g9', optionWordIds: ['g9', 'g1', 'g5', 'g6'] },
        { id: 'q4', type: 'listening', wordId: 'g10', optionWordIds: ['g10', 'g2', 'g3', 'g4'] },
        { id: 'q5', type: 'listening', wordId: 'g11', optionWordIds: ['g11', 'g6', 'g7', 'g8'] },
        { id: 'q6', type: 'speech', wordId: 'g1' },
        { id: 'q7', type: 'speech', wordId: 'g7' },
        { id: 'q8', type: 'stroke', character: '你' },
        { id: 'q9', type: 'stroke', character: '好' },
        { id: 'q10', type: 'stroke', character: '学' },
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
