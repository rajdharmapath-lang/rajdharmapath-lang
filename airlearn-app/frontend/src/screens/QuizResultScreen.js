import React, { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import ProgressRing from '../components/ProgressRing';
import BottomNav from '../components/BottomNav';
import { useProgress } from '../context/ProgressContext';

function formatElapsed(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function QuizResultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { recordActivity } = useProgress();
  useEffect(() => {
    recordActivity(); // finishing a practice session counts toward today's streak
  }, []);
  const { maxWidth } = useResponsive();
  const { batchId, quizId, total = 0, correctCount = 0, elapsedMs = 0 } = route?.params || {};

  const stats = useMemo(() => {
    const safeTotal = total || 1;
    const correctPct = Math.round((correctCount / safeTotal) * 100);
    const wrongPct = 100 - correctPct; // always complements correctPct — unlike the
    // mockup's placeholder numbers (60% correct / 85% wrong), these two always sum to 100.
    return { correctPct, wrongPct };
  }, [total, correctCount]);

  const handlePracticeAgain = () => {
    navigation.replace('QuizPlay', { batchId, quizId });
  };

  const handleBackToQuizList = () => {
    navigation.navigate('QuizList', { batchId });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Quiz</Text>

        <View style={styles.card}>
          <Text style={styles.great}>{stats.correctPct >= 60 ? 'Great!' : 'Keep practicing!'}</Text>
          <Text style={styles.subtitle}>
            {stats.correctPct >= 60 ? 'you did well' : "you'll get it next time"}
          </Text>

          <View style={styles.ringWrap}>
            <ProgressRing percent={stats.correctPct} size={140} strokeWidth={10} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Correct</Text>
              <Text style={styles.statValue}>{stats.correctPct}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Wrong</Text>
              <Text style={styles.statValue}>{stats.wrongPct}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time</Text>
              <Text style={styles.statValue}>{formatElapsed(elapsedMs)}</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBackToQuizList}>
          <Text style={styles.secondaryButtonText}>Back to Quiz</Text>
        </Pressable>
      </View>

      <BottomNav
        active="Home"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Language') navigation.navigate('Vocabulary');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 20 },
  card: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 28,
  },
  great: { fontSize: 24, fontWeight: '700', color: colors.accentRedAlt, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textDark, marginBottom: 20 },
  ringWrap: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 13, color: colors.textLabel, marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.textDark },
  primaryButton: {
    backgroundColor: colors.homeOrangeLight,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.strokeAccent, fontWeight: '700', fontSize: 16 },
});
