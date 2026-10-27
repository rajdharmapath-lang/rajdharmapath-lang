import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

function getProgressStorageKeys(userId) {
  const userKey = userId ? encodeURIComponent(String(userId)) : 'guest';
  const prefix = `progress:${userKey}`;

  return {
    scope: userKey,
    learnedWords: `${prefix}:learnedWordIds`,
    completedVideos: `${prefix}:completedVideoIds`,
    completedCharacters: `${prefix}:completedStrokeCharacters`,
    streak: `${prefix}:streak`,
  };
}

const ProgressContext = createContext(null);

function todayString() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
}

export function ProgressProvider({ children }) {
  const { user } = useAuth();
  const storageKeys = useMemo(() => getProgressStorageKeys(user?.id), [user?.id]);
  const [learnedWordIds, setLearnedWordIds] = useState([]);
  const [completedVideoIds, setCompletedVideoIds] = useState([]);
  const [completedStrokeCharacters, setCompletedStrokeCharacters] = useState([]);
  const [streak, setStreak] = useState({ lastActiveDate: null, currentStreak: 0 });
  const [loadedScope, setLoadedScope] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const progressLoaded = loadedScope === storageKeys.scope;

  useEffect(() => {
    let active = true;
    setLearnedWordIds([]);
    setCompletedVideoIds([]);
    setCompletedStrokeCharacters([]);
    setStreak({ lastActiveDate: null, currentStreak: 0 });
    setLoadedScope(null);
    setLoadError(null);

    (async () => {
      try {
        const [wordsRaw, videosRaw, charactersRaw, streakRaw] = await Promise.all([
          AsyncStorage.getItem(storageKeys.learnedWords),
          AsyncStorage.getItem(storageKeys.completedVideos),
          AsyncStorage.getItem(storageKeys.completedCharacters),
          AsyncStorage.getItem(storageKeys.streak),
        ]);
        if (!active) return;

        const words = wordsRaw ? JSON.parse(wordsRaw) : [];
        const videos = videosRaw ? JSON.parse(videosRaw) : [];
        const characters = charactersRaw ? JSON.parse(charactersRaw) : [];
        const storedStreak = streakRaw ? JSON.parse(streakRaw) : { lastActiveDate: null, currentStreak: 0 };
        if (
          !Array.isArray(words) ||
          !Array.isArray(videos) ||
          !Array.isArray(characters) ||
          typeof storedStreak.currentStreak !== 'number'
        ) {
          throw new Error('Stored learning progress has an invalid format.');
        }

        setLearnedWordIds(words);
        setCompletedVideoIds(videos);
        setCompletedStrokeCharacters(characters);
        setStreak(storedStreak);
      } catch (error) {
        console.error('Could not load learning progress:', error);
        if (active) setLoadError(error);
      } finally {
        if (active) setLoadedScope(storageKeys.scope);
      }
    })();
    return () => {
      active = false;
    };
  }, [storageKeys]);

  // Call whenever the user does something that counts as "practiced today" —
  // learning a word, finishing a video, or completing a Stroke/Speech/Quiz
  // session. Streak = consecutive calendar days with at least one such action,
  // same definition most language-learning apps use (not just "opened the app").
  const recordActivity = useCallback(() => {
    setStreak((prev) => {
      const today = todayString();
      if (prev.lastActiveDate === today) return prev; // already counted today

      let nextStreak;
      if (prev.lastActiveDate && daysBetween(prev.lastActiveDate, today) === 1) {
        nextStreak = prev.currentStreak + 1; // practiced yesterday too — extend it
      } else {
        nextStreak = 1; // first-ever activity, or the streak was broken
      }

      const next = { lastActiveDate: today, currentStreak: nextStreak };
      AsyncStorage.setItem(storageKeys.streak, JSON.stringify(next)).catch((error) => {
        console.error('Could not save learning streak:', error);
      });
      return next;
    });
  }, [storageKeys.streak]);

  const recordWordLearned = useCallback(
    (wordId) => {
      setLearnedWordIds((prev) => {
        if (prev.includes(wordId)) return prev;
        const next = [...prev, wordId];
        AsyncStorage.setItem(storageKeys.learnedWords, JSON.stringify(next)).catch((error) => {
          console.error('Could not save learned vocabulary:', error);
        });
        return next;
      });
      recordActivity();
    },
    [recordActivity, storageKeys.learnedWords]
  );

  const recordVideoCompleted = useCallback(
    (lessonId) => {
      setCompletedVideoIds((prev) => {
        if (prev.includes(lessonId)) return prev;
        const next = [...prev, lessonId];
        AsyncStorage.setItem(storageKeys.completedVideos, JSON.stringify(next)).catch((error) => {
          console.error('Could not save completed video:', error);
        });
        return next;
      });
      recordActivity();
    },
    [recordActivity, storageKeys.completedVideos]
  );

  const recordStrokeCharacterCompleted = useCallback(
    (character) => {
      setCompletedStrokeCharacters((prev) => {
        if (prev.includes(character)) return prev;
        const next = [...prev, character];
        AsyncStorage.setItem(storageKeys.completedCharacters, JSON.stringify(next)).catch((error) => {
          console.error('Could not save completed stroke character:', error);
        });
        return next;
      });
      recordActivity();
    },
    [recordActivity, storageKeys.completedCharacters]
  );

  const clearProgress = useCallback(async () => {
    setLearnedWordIds([]);
    setCompletedVideoIds([]);
    setCompletedStrokeCharacters([]);
    setStreak({ lastActiveDate: null, currentStreak: 0 });
    await AsyncStorage.multiRemove([
      storageKeys.learnedWords,
      storageKeys.completedVideos,
      storageKeys.completedCharacters,
      storageKeys.streak,
    ]).catch((error) => {
      console.error('Could not clear learning progress:', error);
    });
  }, [storageKeys]);

  return (
    <ProgressContext.Provider
      value={{
        progressLoaded,
        progressLoadError: progressLoaded ? loadError : null,
        wordsLearnedCount: progressLoaded ? learnedWordIds.length : 0,
        videosCompletedCount: progressLoaded ? completedVideoIds.length : 0,
        completedVideoIds: progressLoaded ? completedVideoIds : [],
        completedStrokeCharacters: progressLoaded ? completedStrokeCharacters : [],
        daysStreak: progressLoaded ? streak.currentStreak : 0,
        recordWordLearned,
        recordVideoCompleted,
        recordStrokeCharacterCompleted,
        recordActivity,
        clearProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
