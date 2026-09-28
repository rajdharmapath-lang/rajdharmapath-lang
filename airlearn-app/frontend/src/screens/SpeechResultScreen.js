import React, { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import ProgressRing from '../components/ProgressRing';
import BottomNav from '../components/BottomNav';
import { useProgress } from '../context/ProgressContext';

function averageScore(words, results, key) {
  const total = words.length || 1;
  const sum = words.reduce((acc, _, i) => acc + (results?.[i]?.[key] || 0), 0);
  return Math.round(sum / total);
}

export default function SpeechResultScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { recordActivity } = useProgress();
  useEffect(() => {
    recordActivity(); // finishing a practice session counts toward today's streak
  }, []);
  const { maxWidth } = useResponsive();
  const words = route?.params?.words || [];
  const results = route?.params?.results || {};
  const categoryId = route?.params?.categoryId;

  const scores = useMemo(
    () => ({
      pronunciation: averageScore(words, results, 'pronunciation'),
      fluency: averageScore(words, results, 'fluency'),
      tone: averageScore(words, results, 'tone'),
    }),
    [words, results]
  );
  const overall = Math.round((scores.pronunciation + scores.fluency + scores.tone) / 3);

  const handlePracticeAgain = () => {
    navigation.replace('SpeechPractice', { categoryId, words });
  };

  const handleBackToList = () => {
    // Note: your speech_score.svg mockup labels this button "Back to Characters",
    // which looks like it was copied from the stroke-writing result screen — but
    // you've confirmed the intended destination is the Categories list (speech2.svg),
    // not this category's word list.
    navigation.navigate('VocabularyCategoryList', { mode: 'speech' });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Speech Practice</Text>

        <View style={styles.card}>
          <Text style={styles.great}>Great!</Text>
          <Text style={styles.subtitle}>you pronounced it well</Text>

          <View style={styles.ringWrap}>
            <ProgressRing percent={overall} size={140} strokeWidth={10} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pronunciation</Text>
              <Text style={styles.statValue}>{scores.pronunciation}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Fluency</Text>
              <Text style={styles.statValue}>{scores.fluency}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tone</Text>
              <Text style={styles.statValue}>{scores.tone}%</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Text style={styles.primaryButtonText}>Practice Again</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBackToList}>
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
