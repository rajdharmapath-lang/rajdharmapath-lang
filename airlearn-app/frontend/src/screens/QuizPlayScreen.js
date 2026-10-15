import React, { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, Pressable } from 'react-native';
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
  const [answersByIndex, setAnswersByIndex] = useState({});
  const [answerPending, setAnswerPending] = useState(false);
  const startTimeRef = useRef(Date.now());

  const question = questions[index];

  const finishQuiz = (finalAnswers) => {
    const answers = Object.values(finalAnswers);
    const finalCorrectCount = answers.filter((answer) => answer.isCorrect).length;
    const finalAnsweredCount = answers.length;
    const finalReviews = answers.map(({ review, isCorrect }) => ({ ...review, isCorrect }));
    const elapsedMs = Date.now() - startTimeRef.current;
    navigation.replace('QuizResult', {
      batchId,
      quizId,
      total: questionsInRun,
      correctCount: finalCorrectCount,
      answeredCount: finalAnsweredCount,
      elapsedMs,
      startIndex,
      answerReviews: finalReviews,
      language,
    });
  };

  const handleAnswered = (questionIndex, isCorrect, review) => {
    const nextAnswers = {
      ...answersByIndex,
      [questionIndex]: { isCorrect, review },
    };
    const nextAnsweredCount = Object.keys(nextAnswers).length;
    if (!hasPrimeAccess() && nextAnsweredCount >= 1) {
      redirectToPaywall(navigation, route, batchId);
      return;
    }
    setAnswersByIndex(nextAnswers);

    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      finishQuiz(nextAnswers);
    }
  };

  const handlePrevious = () => {
    if (index > firstQuestionIndex) setIndex(index - 1);
  };

  const handleFinishQuiz = () => {
    finishQuiz(answersByIndex);
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
          onPrevious={handlePrevious}
          previousDisabled={answerPending}
        />

        <View style={styles.questionArea}>
          <QuizQuestionRenderer
            key={`${question.id}-${index}`}
            question={question}
            language={language}
            onAnswered={(isCorrect, review) => handleAnswered(index, isCorrect, review)}
            onAnswerPending={setAnswerPending}
          />
        </View>

        <Pressable
          style={[styles.finishButton, answerPending && styles.finishButtonDisabled]}
          onPress={handleFinishQuiz}
          disabled={answerPending}
          accessibilityRole="button"
        >
          <Text style={styles.finishButtonText}>
            {language === 'tamil' ? 'சோதனையை முடிக்கவும்' : 'Finish Test'}
          </Text>
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  questionArea: { flex: 1, justifyContent: 'center' },
  finishButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  finishButtonDisabled: { opacity: 0.5 },
  finishButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
