import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { batches } from '../data/courses';
import { getQuizzesForBatch } from '../data/quizzes';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';

const CHAPTERS = [
  { id: 1, title: 'First Conversations', subtitle: 'Words and meaning' },
  { id: 2, title: 'Listen & Speak', subtitle: 'Train your ear and voice' },
  { id: 3, title: 'Character Writing', subtitle: 'Practice each stroke' },
  { id: 4, title: 'Complete the Sentence', subtitle: 'Build simple Chinese sentences' },
];

const SKILL_LABELS = {
  vocabulary: 'VOCABULARY',
  image: 'PICTURE CLUE',
  listening: 'LISTENING',
  speech: 'SPEAKING',
  stroke: 'WRITING',
  sentence: 'SENTENCE BUILDING',
  sentencePair: 'TWO-BLANK SENTENCE',
};

const SKILL_ICONS = {
  vocabulary: 'book-outline',
  image: 'image-outline',
  listening: 'headset-outline',
  speech: 'mic-outline',
  stroke: 'create-outline',
  sentence: 'chatbubble-ellipses-outline',
  sentencePair: 'chatbubble-ellipses-outline',
};

export default function QuizListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { loaded, hasPrimeAccess } = usePayment();
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const quizzes = getQuizzesForBatch(batchId).filter((quiz) => quiz.questions?.length);
  const quiz = quizzes[0];
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
            {CHAPTERS.map((chapter, chapterIndex) => {
              const chapterQuestions = quiz.questions
                .map((question, questionIndex) => ({ question, questionIndex }))
                .filter(({ question }) => question.chapter === chapter.id);

              if (!chapterQuestions.length) return null;

              return (
                <View key={chapter.id} style={styles.chapter}>
                  <View style={styles.chapterHeader}>
                    <View style={styles.chapterHeading}>
                      <Text style={styles.chapterEyebrow}>CHAPTER {chapterIndex + 1}</Text>
                      <Text style={styles.chapterTitle}>{chapter.title}</Text>
                      <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
                    </View>
                    <Text style={styles.chapterCount}>{chapterQuestions.length} STEPS</Text>
                  </View>
                  <View style={styles.chapterRule} />

                  <View style={styles.pathTrack}>
                    <View style={styles.pathLine} />
                    {chapterQuestions.map(({ question, questionIndex }) => {
                      const locked = questionIndex > 0 && (!loaded || !hasPrimeAccess());
                      return (
                        <StaggeredSlideItem
                          key={question.id}
                          index={questionIndex}
                          style={styles.pathEntry}
                        >
                          <Pressable
                            style={[styles.pathStep, locked && styles.pathStepLocked]}
                            onPress={() => startQuestion(questionIndex)}
                            accessibilityRole="button"
                            accessibilityLabel={`Practice step ${questionIndex + 1}: ${question.pathTitle}${locked ? ', Prime members only' : ''}`}
                            accessibilityState={{ disabled: questionIndex > 0 && !loaded }}
                          >
                            <View
                              style={[
                                styles.pathNode,
                                questionIndex === 0 && styles.pathNodeActive,
                                locked && styles.pathNodeLocked,
                              ]}
                            >
                              {locked ? (
                                <Ionicons name="lock-closed" size={16} color={colors.textLabel} />
                              ) : questionIndex === 0 ? (
                                <Ionicons name="play" size={17} color="#fff" />
                              ) : (
                                <Ionicons
                                  name={SKILL_ICONS[question.type] || 'ellipse'}
                                  size={17}
                                  color={colors.accentRedAlt}
                                />
                              )}
                            </View>
                            <View style={styles.pathStepText}>
                              <View style={styles.pathTitleRow}>
                                <Text style={[styles.pathStepTitle, locked && styles.pathStepTextLocked]}>
                                  {question.pathTitle}
                                </Text>
                                <Text style={styles.pathStepNumber}>{questionIndex + 1}/{quiz.questions.length}</Text>
                              </View>
                              <Text style={styles.pathSkill}>{SKILL_LABELS[question.type]}</Text>
                            </View>
                            <Ionicons
                              name={locked ? 'lock-closed-outline' : 'chevron-forward'}
                              size={18}
                              color={locked ? colors.textLabel : colors.border}
                            />
                          </Pressable>
                        </StaggeredSlideItem>
                      );
                    })}
                  </View>
                </View>
              );
            })}
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
  chapter: { marginBottom: 24 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chapterHeading: { flex: 1 },
  chapterEyebrow: { fontSize: 10, fontWeight: '700', color: colors.homeOrange, marginBottom: 4 },
  chapterTitle: { fontSize: 19, fontWeight: '700', color: colors.textDark },
  chapterSubtitle: { fontSize: 12, color: colors.textLabel, marginTop: 3 },
  chapterCount: { fontSize: 11, fontWeight: '700', color: colors.textLabel, marginLeft: 10 },
  chapterRule: { height: 3, borderRadius: 2, backgroundColor: colors.homeOrangeLight, marginTop: 12, marginBottom: 10 },
  pathTrack: { position: 'relative' },
  pathLine: {
    position: 'absolute',
    top: 24,
    bottom: 24,
    left: 21,
    width: 2,
    backgroundColor: colors.homeOrangeLight,
  },
  pathEntry: { marginVertical: 3 },
  pathStep: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  pathStepLocked: { opacity: 0.72 },
  pathNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.homeOrangeBgAlt,
    borderWidth: 1,
    borderColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pathNodeActive: {
    backgroundColor: colors.homeOrange,
    borderColor: colors.homeOrangeLight,
    borderWidth: 3,
  },
  pathNodeLocked: { backgroundColor: colors.background, borderColor: colors.borderLight },
  pathStepText: { flex: 1 },
  pathTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pathStepTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textDark },
  pathStepTextLocked: { color: colors.textLabel },
  pathStepNumber: { fontSize: 11, color: colors.textLabel, marginLeft: 8 },
  pathSkill: { fontSize: 10, fontWeight: '700', color: colors.textLabel, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center', marginTop: 14 },
  emptyMessage: { fontSize: 14, lineHeight: 20, color: colors.textLabel, textAlign: 'center', marginTop: 8 },
});
