import React, { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { useResponsive } from '../theme/responsive';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { useAccessGate } from '../utils/paywall';
import QuizProgressHeader from '../components/QuizProgressHeader';
import QuizQuestionRenderer from '../components/QuizQuestionRenderer';
import { getQuiz } from '../data/quizzes';

export default function QuizPlayScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { hasBatchAccess } = usePayment();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const { batchId = 'foundation', quizId = 'quiz1' } = route?.params || {};
  const quiz = getQuiz(batchId, quizId);
  const questions = quiz?.questions || [];

  // Safety net in case this screen is ever reached without going through
  // QuizIntroScreen's own gate (e.g. a deep link) — same batch-specific check.
  useAccessGate(navigation, route, hasBatchAccess(batchId), batchId);

  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const startTimeRef = useRef(Date.now());

  const question = questions[index];

  const finishQuiz = (finalCorrectCount) => {
    const elapsedMs = Date.now() - startTimeRef.current;
    navigation.replace('QuizResult', {
      batchId,
      quizId,
      total: questions.length,
      correctCount: finalCorrectCount,
      elapsedMs,
    });
  };

  const handleAnswered = (isCorrect) => {
    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);
    setCorrectCount(nextCorrectCount);

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      finishQuiz(nextCorrectCount);
    }
  };

  if (!question) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>This quiz has no questions yet.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <QuizProgressHeader
          quizName={quiz.name}
          current={index + 1}
          total={questions.length}
          onBack={() => navigation.goBack()}
        />

        <QuizQuestionRenderer
          key={question.id}
          question={question}
          language={language}
          onAnswered={handleAnswered}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
