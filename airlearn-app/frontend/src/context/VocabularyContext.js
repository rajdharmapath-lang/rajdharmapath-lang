import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'vocabFavorites';
const RECENTS_KEY = 'vocabRecentWordIds';
const MAX_RECENTS = 5;

const VocabularyContext = createContext(null);

export function VocabularyProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [favRaw, recentRaw] = await Promise.all([
          AsyncStorage.getItem(FAVORITES_KEY),
          AsyncStorage.getItem(RECENTS_KEY),
        ]);
        if (favRaw) setFavoriteIds(JSON.parse(favRaw));
        if (recentRaw) setRecentIds(JSON.parse(recentRaw));
      } catch (e) {
        // no persisted data yet — start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggleFavorite = useCallback((wordId) => {
    setFavoriteIds((prev) => {
      const next = prev.includes(wordId) ? prev.filter((id) => id !== wordId) : [...prev, wordId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch(() => {});
      // TODO once backend exists: POST the updated favorites list so it syncs across devices.
      return next;
    });
  }, []);

  const recordRecentWord = useCallback((wordId) => {
    setRecentIds((prev) => {
      const next = [wordId, ...prev.filter((id) => id !== wordId)].slice(0, MAX_RECENTS);
      AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((wordId) => favoriteIds.includes(wordId), [favoriteIds]);

  return (
    <VocabularyContext.Provider
      value={{ loaded, favoriteIds, recentIds, toggleFavorite, recordRecentWord, isFavorite }}
    >
      {children}
    </VocabularyContext.Provider>
  );
}

export function useVocabulary() {
  const ctx = useContext(VocabularyContext);
  if (!ctx) throw new Error('useVocabulary must be used within VocabularyProvider');
  return ctx;
}
