// --- Azure integration point -------------------------------------------------
// Azure Speech's Pronunciation Assessment API scores a recorded audio clip
// against a reference sentence. Once you have a key, replace the body of
// assessPronunciation with something like:
//
//   const pronunciationConfig = {
//     referenceText: word.hanzi,
//     gradingSystem: 'HundredMark',
//     granularity: 'Phoneme',
//     enableMiscue: true,
//   };
//   // Use the Speech SDK (via a small native/WebView bridge, similar to how
//   // ChineseStrokeWriter bridges HanziWriter) or the REST scoring endpoint,
//   // uploading the recorded audioUri and reference text, then map the
//   // response's AccuracyScore / FluencyScore / (Mandarin) tone scoring onto
//   // the { pronunciation, fluency, tone } shape below.
//
// Keep the assessPronunciation(audioUri, word) call signature the same in the
// screens — only this file needs to change when Azure is wired in.
// ------------------------------------------------------------------------------

/**
 * Scores a recorded pronunciation attempt against a target word.
 * Currently returns simulated (but plausible, non-zero-effort) scores so the
 * practice flow and results screen are fully functional before Azure is wired in.
 *
 * @param {string} audioUri - local file URI of the user's recording
 * @param {{ hanzi: string }} word - the word being practiced
 * @returns {Promise<{ pronunciation: number, fluency: number, tone: number }>}
 */
export async function assessPronunciation(audioUri, word) {
  // Simulated network delay so the UI's loading state is exercised realistically.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const randomScore = (min, max) => Math.round(min + Math.random() * (max - min));

  return {
    pronunciation: randomScore(70, 95),
    fluency: randomScore(70, 95),
    tone: randomScore(55, 90), // Mandarin tone accuracy tends to be the hardest for learners
  };
}
