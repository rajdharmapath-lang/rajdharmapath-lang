import React, { useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
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
  const {
    batchId,
    quizId,
    total = 0,
    correctCount = 0,
    answeredCount,
    elapsedMs = 0,
    startIndex = 0,
    answerReviews = [],
    language = 'english',
  } = route?.params || {};
  const isTamil = language === 'tamil';
  const incorrectReviews = answerReviews.filter((review) => !review.isCorrect);

  const stats = useMemo(() => {
    const answered = Math.min(answeredCount ?? total, total);
    const correctPct = answered > 0 ? Math.round((correctCount / answered) * 100) : 0;
    return { answered, correctPct };
  }, [total, answeredCount, correctCount]);

  const handlePracticeAgain = () => {
    navigation.replace('QuizPlay', { batchId, quizId, startIndex });
  };

  const handleBackToQuizList = () => {
    navigation.navigate('QuizBatchList');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>{isTamil ? 'பயிற்சி முடிந்தது' : 'Practice Complete'}</Text>

        <View style={styles.card}>
          <Text style={styles.great}>
            {stats.correctPct >= 60
              ? isTamil ? 'நன்று!' : 'Great!'
              : isTamil ? 'தொடர்ந்து பயிற்சி செய்யுங்கள்!' : 'Keep practicing!'}
          </Text>
          <Text style={styles.subtitle}>
            {stats.correctPct >= 60
              ? isTamil ? 'நன்றாக செய்தீர்கள்' : 'You did well'
              : isTamil ? 'அடுத்த முறை சிறப்பாக செய்வீர்கள்' : "You'll get it next time"}
          </Text>

          <View style={styles.ringWrap}>
            <ProgressRing percent={stats.correctPct} size={140} strokeWidth={10} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{isTamil ? 'பதிலளித்தவை' : 'Answered'}</Text>
              <Text style={styles.statValue}>{stats.answered}/{total}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{isTamil ? 'சரி' : 'Correct'}</Text>
              <Text style={styles.statValue}>{correctCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{isTamil ? 'தவறு' : 'Incorrect'}</Text>
              <Text style={styles.statValue}>{Math.max(0, stats.answered - correctCount)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{isTamil ? 'நேரம்' : 'Time'}</Text>
              <Text style={styles.statValue}>{formatElapsed(elapsedMs)}</Text>
            </View>
          </View>
        </View>

        {incorrectReviews.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>
              {isTamil ? 'சரியான பதில்கள்' : 'Review incorrect answers'}
            </Text>
            {incorrectReviews.map((review, index) => (
              <View key={`${review.question}-${index}`} style={styles.reviewCard}>
                <Text style={styles.reviewQuestion}>{review.question}</Text>
                <Text style={styles.reviewAnswer}>
                  {isTamil ? 'சரியான பதில்: ' : 'Correct answer: '}
                  <Text style={styles.correctAnswer}>{review.correctAnswer}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={handlePracticeAgain}>
          <Text style={styles.primaryButtonText}>{isTamil ? 'மீண்டும் பயிற்சி' : 'Play Again'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleBackToQuizList}>
          <Text style={styles.secondaryButtonText}>
            {isTamil ? 'பாதைக்குத் திரும்பு' : 'Back to Path'}
          </Text>
        </Pressable>
      </ScrollView>

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
  container: { flex: 1, paddingHorizontal: 20 },
  content: { flexGrow: 1, paddingTop: 24, paddingBottom: 20 },
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
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: colors.textLabel, marginBottom: 4, textAlign: 'center' },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.textDark },
  reviewSection: { marginBottom: 24 },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accentRedAlt,
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  reviewQuestion: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 8 },
  reviewAnswer: { fontSize: 14, color: colors.textLabel, marginTop: 3 },
  correctAnswer: { color: colors.successGreen, fontWeight: '700' },
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
