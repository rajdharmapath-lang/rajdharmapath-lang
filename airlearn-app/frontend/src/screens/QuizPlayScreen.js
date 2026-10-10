import React, { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';
import { useResponsive } from '../theme/responsive';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';
import QuizProgressHeader from '../components/QuizProgressHeader';
import QuizQuestionRenderer from '../components/QuizQuestionRenderer';
import { getQuiz } from '../data/quizzes';
import BottomNav from '../components/BottomNav';

export default function QuizPlayScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { hasPrimeAccess } = usePayment();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const {
    batchId = 'foundation',
    quizId = 'quiz1',
    startIndex = 0,
  } = route?.params || {};
  const quiz = getQuiz(batchId, quizId);
  const questions = quiz?.questions || [];
  const firstQuestionIndex = hasPrimeAccess()
    ? Math.min(Math.max(startIndex, 0), Math.max(questions.length - 1, 0))
    : 0;
  const questionsInRun = questions.length - firstQuestionIndex;

  const [index, setIndex] = useState(firstQuestionIndex);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answerPending, setAnswerPending] = useState(false);
  const startTimeRef = useRef(Date.now());

  const question = questions[index];

  const finishQuiz = (finalCorrectCount, finalAnsweredCount) => {
    const elapsedMs = Date.now() - startTimeRef.current;
    navigation.replace('QuizResult', {
      batchId,
      quizId,
      total: questionsInRun,
      correctCount: finalCorrectCount,
      answeredCount: finalAnsweredCount,
      elapsedMs,
      startIndex,
    });
  };

  const handleAnswered = (isCorrect) => {
    const nextCorrectCount = correctCount + (isCorrect ? 1 : 0);
    const nextAnsweredCount = answeredCount + 1;
    if (!hasPrimeAccess() && nextAnsweredCount >= 1) {
      redirectToPaywall(navigation, route, batchId);
      return;
    }
    setCorrectCount(nextCorrectCount);
    setAnsweredCount(nextAnsweredCount);

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      finishQuiz(nextCorrectCount, nextAnsweredCount);
    }
  };

  const handleFinishTest = () => {
    if (answerPending) return;
    finishQuiz(correctCount, answeredCount);
  };

  if (!question) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>This challenge has no questions yet.</Text>
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

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <QuizProgressHeader
          quizName={quiz.name}
          current={index - firstQuestionIndex + 1}
          total={questionsInRun}
          onBack={() => navigation.goBack()}
          onFinish={handleFinishTest}
          finishDisabled={answerPending}
        />

        <QuizQuestionRenderer
          key={question.id}
          question={question}
          language={language}
          onAnswered={handleAnswered}
          onAnswerPending={setAnswerPending}
        />
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
