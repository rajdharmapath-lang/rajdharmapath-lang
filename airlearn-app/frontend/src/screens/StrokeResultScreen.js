import React, { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import ProgressRing from '../components/ProgressRing';
import BottomNav from '../components/BottomNav';
import { useProgress } from '../context/ProgressContext';

// Scoring is intentionally simple and easy to retune later:
// - accuracy: average of each character's (100 - mistakes*15), floored at 0
// - stroke order correct: characters finished with zero mistakes (first-try correct order)
// - overall score (ring): blend of the two above
function computeScore(characters, results) {
  const total = characters.length || 1;
  let accuracySum = 0;
  let perfectCount = 0;

  characters.forEach((_, i) => {
    const r = results?.[i] || { mistakes: 0, completed: false };
    const charAccuracy = Math.max(0, 100 - r.mistakes * 15);
    accuracySum += charAccuracy;
    if (r.completed && r.mistakes === 0) perfectCount += 1;
  });

  const accuracy = Math.round(accuracySum / total);
  const strokeOrderPct = Math.round((perfectCount / total) * 100);
  const overall = Math.round((accuracy + strokeOrderPct) / 2);

  return { accuracy, strokeOrderCorrect: perfectCount, total, overall };
}

export default function StrokeResultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { recordActivity } = useProgress();
  useEffect(() => {
    recordActivity(); // finishing a practice session counts toward today's streak
  }, []);
  const { maxWidth } = useResponsive();
  const characters = route?.params?.characters || [];
  const results = route?.params?.results || {};

  const score = useMemo(() => computeScore(characters, results), [characters, results]);

  const handlePracticeAgain = () => {
    navigation.replace('StrokePractice', { characters });
  };

  const handleBackToCharacters = () => {
    navigation.reset({ index: 0, routes: [{ name: 'CharacterSelect' }] });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Stroke Writing</Text>

        <View style={styles.card}>
          <Text style={styles.great}>Great!</Text>
          <Text style={styles.subtitle}>
            You completed all {characters.length} character{characters.length === 1 ? '' : 's'}
          </Text>

          <View style={styles.ringWrap}>
            <ProgressRing percent={score.overall} size={140} strokeWidth={10} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statValue}>{score.accuracy}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stroke order</Text>
              <Text style={styles.statValue}>
                {score.strokeOrderCorrect}/{score.total} Correct
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBackToCharacters}>
          <Text style={styles.secondaryButtonText}>Back to Characters</Text>
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
    backgroundColor: colors.homeOrangeBg,
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
  statLabel: { fontSize: 14, color: colors.textLabel, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textDark },
  primaryButton: {
    backgroundColor: colors.strokeAccent,
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
