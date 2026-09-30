import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LEARNED_WORDS_KEY = 'progressLearnedWordIds';
const COMPLETED_VIDEOS_KEY = 'progressCompletedVideoIds';
const STREAK_KEY = 'progressStreak';

const ProgressContext = createContext(null);

function todayString() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
}

export function ProgressProvider({ children }) {
  const [learnedWordIds, setLearnedWordIds] = useState([]);
  const [completedVideoIds, setCompletedVideoIds] = useState([]);
  const [streak, setStreak] = useState({ lastActiveDate: null, currentStreak: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [wordsRaw, videosRaw, streakRaw] = await Promise.all([
          AsyncStorage.getItem(LEARNED_WORDS_KEY),
          AsyncStorage.getItem(COMPLETED_VIDEOS_KEY),
          AsyncStorage.getItem(STREAK_KEY),
        ]);
        if (wordsRaw) setLearnedWordIds(JSON.parse(wordsRaw));
        if (videosRaw) setCompletedVideoIds(JSON.parse(videosRaw));
        if (streakRaw) setStreak(JSON.parse(streakRaw));
      } catch (e) {
        // start fresh
      }
    })();
  }, []);

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
      AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const recordWordLearned = useCallback(
    (wordId) => {
      setLearnedWordIds((prev) => {
        if (prev.includes(wordId)) return prev;
        const next = [...prev, wordId];
        AsyncStorage.setItem(LEARNED_WORDS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      recordActivity();
    },
    [recordActivity]
  );

  const recordVideoCompleted = useCallback(
    (lessonId) => {
      setCompletedVideoIds((prev) => {
        if (prev.includes(lessonId)) return prev;
        const next = [...prev, lessonId];
        AsyncStorage.setItem(COMPLETED_VIDEOS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      recordActivity();
    },
    [recordActivity]
  );

  const clearProgress = useCallback(async () => {
    setLearnedWordIds([]);
    setCompletedVideoIds([]);
    setStreak({ lastActiveDate: null, currentStreak: 0 });
    await AsyncStorage.multiRemove([LEARNED_WORDS_KEY, COMPLETED_VIDEOS_KEY, STREAK_KEY]).catch(
      () => {}
    );
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        wordsLearnedCount: learnedWordIds.length,
        videosCompletedCount: completedVideoIds.length,
        completedVideoIds,
        daysStreak: streak.currentStreak,
        recordWordLearned,
        recordVideoCompleted,
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
