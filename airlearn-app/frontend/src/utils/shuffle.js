/**
 * Returns a new array with the same items in random order (Fisher-Yates).
 * Does not mutate the input.
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns up to `count` random, non-repeating items from the array.
 */
export function pickRandom(array, count) {
  return shuffleArray(array).slice(0, count);
}
