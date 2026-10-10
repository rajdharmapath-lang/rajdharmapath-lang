import characterMetadata from './characterMetadata.json';

export const characterMeta = Object.fromEntries(
  characterMetadata.map((entry) => [
    entry.character,
    {
      pinyin: entry.pinyin,
      englishMeaning: entry.english || entry.meanings?.[0] || '',
      tamilMeaning: entry.tamil || entry.tamilMeanings?.[0] || '',
    },
  ])
);

export function getCharacterMeta(character, language = 'english') {
  const meta = characterMeta[character];
  if (!meta) return null;

  return {
    ...meta,
    meaning: language === 'tamil' && meta.tamilMeaning ? meta.tamilMeaning : meta.englishMeaning,
  };
}
