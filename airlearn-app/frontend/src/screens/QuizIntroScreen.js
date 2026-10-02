import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useResponsive } from '../theme/responsive';
import { batches } from '../data/courses';
import { getQuiz } from '../data/quizzes';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';

// Maps each real skill this quiz can contain to an icon. Note: your Quiz_3.svg
// mockup lists "Listening" twice (once with a headphone icon, once with a mic
// icon that should logically read "Speech") — corrected here to the actual
// skill set rather than repeated verbatim.
const SKILL_ICONS = {
  Vocabulary: 'book-outline',
  Listening: 'headset-outline',
  Speech: 'mic-outline',
  Stroke: 'create-outline',
};

const CHECKLIST = [
  'Use headphones for listening.',
  'Allow microphone for speech.',
  'Stay on this screen until you finish.',
];

export default function QuizIntroScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { hasBatchAccess } = usePayment();
  const { batchId = 'foundation', quizId = 'quiz1' } = route?.params || {};
  const batch = batches.find((b) => b.id === batchId);
  const quiz = getQuiz(batchId, quizId);
  const hasQuestions = !!quiz?.questions?.length;

  // Gated at the "Start Quiz" action, per your instructions — browsing the
  // intro/checklist screen itself is fine unpurchased, same as Stroke's
  // gate-on-start-practice rather than gate-on-entry.
  const handleStartQuiz = () => {
    if (!hasBatchAccess(batchId)) {
      redirectToPaywall(navigation, route, batchId);
      return;
    }
    navigation.navigate('QuizPlay', { batchId, quizId });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.eyebrow}>{quiz?.name || 'Practice'}</Text>
            <View style={{ width: 26 }} />
          </View>

          <Text style={styles.title}>
            {batch?.name || 'Batch'} {quiz?.name || 'Practice'}
          </Text>
          <Text style={styles.subtitle}>Ready to take on this Chinese challenge?</Text>

          <Text style={styles.sectionTitle}>Skill Included</Text>
          <View style={styles.chipsRow}>
            {(quiz?.skillsIncluded?.length ? quiz.skillsIncluded : ['Vocabulary']).map((skill) => (
              <View key={skill} style={styles.chip}>
                <Ionicons
                  name={SKILL_ICONS[skill] || 'help-circle-outline'}
                  size={16}
                  color={colors.strokeAccent}
                />
                <Text style={styles.chipText}>{skill}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Before Start</Text>
          <View style={styles.checklistCard}>
            {CHECKLIST.map((line, i) => (
              <View key={i} style={[styles.checklistRow, i > 0 && styles.checklistDivider]}>
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <Text style={styles.checklistText}>{line}</Text>
              </View>
            ))}
          </View>

          {!hasQuestions && (
            <Text style={styles.emptyNote}>
              This quiz doesn't have questions yet — check back once content is added.
            </Text>
          )}

          <View style={{ flex: 1 }} />

          <Pressable
            style={[styles.startButton, !hasQuestions && styles.startButtonDisabled]}
            disabled={!hasQuestions}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startButtonText}>Start Challenge</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('QuizList', { batchId })} style={{ marginTop: 12 }}>
            <Text style={styles.returnLink}>Return to Practice</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, minHeight: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt },
  title: { fontSize: 26, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.textDark, textAlign: 'center', marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.accentRedAlt, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, color: colors.textDark },
  checklistCard: {
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  checklistDivider: { borderTopWidth: 1, borderTopColor: colors.navInactiveBg },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.strokeAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistText: { fontSize: 14, color: colors.textDark, flex: 1 },
  emptyNote: { fontSize: 13, color: colors.textLabel, textAlign: 'center', marginTop: 20 },
  startButton: {
    backgroundColor: colors.homeOrangeLight,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  returnLink: { color: colors.strokeAccent, fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
