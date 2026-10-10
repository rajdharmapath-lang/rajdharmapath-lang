import importedWords from './vocabularyWords.json';

const TOPICS = [
  ['numbers', 'Numbers'],
  ['self-introduction', 'Self Introduction'],
  ['family', 'Family'],
  ['vegetable', 'Vegetable'],
  ['metro', 'Metro'],
  ['restaurant', 'Restaurant'],
  ['shopping', 'Shopping'],
  ['canton-fair', 'Canton Fair'],
  ['taxi', 'Taxi'],
  ['colours', 'Colours'],
  ['weather', 'Weather'],
  ['countries', 'Countries'],
  ['hotel', 'Hotel'],
  ['technology', 'Technology'],
  ['fruits', 'Fruits'],
  ['travel', 'Travel'],
  ['business', 'Business'],
  ['communication', 'Communication'],
  ['tastes', 'Tastes'],
  ['household', 'Household'],
  ['food', 'Food'],
];

export const vocabularyCategories = TOPICS.map(([id, name]) => {
  const words = importedWords.filter((word) => word.categoryId === id);
  return { id, name, declaredWordCount: words.length, words };
});

export function getCategoryById(id) {
  return vocabularyCategories.find((category) => category.id === id) || null;
}

export function getAllWords() {
  return vocabularyCategories.flatMap((category) => category.words);
}

export function findWordById(id) {
  return getAllWords().find((word) => word.id === id) || null;
}
