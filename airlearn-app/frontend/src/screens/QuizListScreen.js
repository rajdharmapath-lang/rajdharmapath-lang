import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches } from '../data/courses';
import { getQuizzesForBatch } from '../data/quizzes';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';

export default function QuizListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { loaded, hasPrimeAccess } = usePayment();
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const quizzes = getQuizzesForBatch(batchId).filter((quiz) => quiz.questions?.length);
  const quiz = quizzes[0];
  const questionCount = quiz?.questions?.length || 0;
  const emptyCopy = batchId === 'elevation'
    ? {
        title: 'Your next practice path is taking shape',
        message: 'New exercises are being prepared to help you take your Chinese higher.',
      }
    : {
        title: 'A bigger challenge is in the works',
        message: 'We are crafting advanced practice for your next stage of Chinese learning.',
      };

  const startQuestion = (questionIndex) => {
    if (questionIndex > 0) {
      if (!loaded) return;
      if (!hasPrimeAccess()) {
        redirectToPaywall(navigation, route, batchId);
        return;
      }
    }

    navigation.navigate('QuizPlay', {
      batchId,
      quizId: quiz.id,
      startIndex: questionIndex,
    });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Practice</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.batchTitle}>{batch?.name || 'Batch'}</Text>

        {quiz ? (
          <ScrollView contentContainerStyle={styles.pathContent}>
            <Pressable
              style={styles.topicRow}
              onPress={() => startQuestion(0)}
              accessibilityRole="button"
              accessibilityLabel={`Start ${quiz.topicName || quiz.name}, ${questionCount} questions`}
            >
              <View style={styles.topicNode}>
                <Ionicons name="play" size={17} color="#fff" />
              </View>
              <View style={styles.topicText}>
                <Text style={styles.topicTitle}>{quiz.topicName || quiz.name}</Text>
                <Text style={styles.questionCount}>
                  {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
            </Pressable>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={38} color={colors.homeOrange} />
            <Text style={styles.emptyTitle}>{emptyCopy.title}</Text>
            <Text style={styles.emptyMessage}>{emptyCopy.message}</Text>
          </View>
        )}
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, fontSize: 20 },
  batchTitle: { fontSize: 15, color: colors.textLabel, marginBottom: 20 },
  pathContent: { paddingBottom: 24 },
  topicRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  topicNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeOrange,
    borderWidth: 3,
    borderColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topicText: { flex: 1 },
  topicTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark },
  questionCount: { fontSize: 12, color: colors.textLabel, marginTop: 3 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center', marginTop: 14 },
  emptyMessage: { fontSize: 14, lineHeight: 20, color: colors.textLabel, textAlign: 'center', marginTop: 8 },
});
