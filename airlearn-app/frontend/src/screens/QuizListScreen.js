import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { batches } from '../data/courses';
import { getQuizzesForBatch } from '../data/quizzes';

export default function QuizListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const quizzes = getQuizzesForBatch(batchId).filter((quiz) => quiz.questions?.length);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Challenges</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.batchTitle}>{batch?.name || 'Batch'}</Text>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={(
            <View style={styles.emptyState}>
              <Ionicons name="game-controller-outline" size={38} color={colors.homeOrange} />
              <Text style={styles.emptyTitle}>New challenges are on the way</Text>
              <Text style={styles.emptyMessage}>This batch doesn't have a playable challenge yet.</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <StaggeredSlideItem index={index} style={styles.rowEntry}>
              <Pressable
                style={styles.challengeCard}
                onPress={() => navigation.navigate('QuizIntro', { batchId, quizId: item.id })}
              >
                <View style={styles.challengeHeading}>
                  <View style={styles.challengeIcon}>
                    <Ionicons name="flash" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.challengeText}>
                    <Text style={styles.challengeTitle}>{item.name}</Text>
                    <Text style={styles.challengeSubtitle}>A mixed-skills Chinese challenge</Text>
                  </View>
                </View>
                <View style={styles.challengeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="help-circle-outline" size={16} color={colors.textLabel} />
                    <Text style={styles.metaText}>{item.questions.length} questions</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.textLabel} />
                    <Text style={styles.metaText}>{item.skillsIncluded.length} skills</Text>
                  </View>
                </View>
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>Play challenge</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </View>
              </Pressable>
            </StaggeredSlideItem>
          )}
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, fontSize: 20 },
  batchTitle: { fontSize: 15, color: colors.textLabel, marginBottom: 20 },
  rowEntry: { marginBottom: 16 },
  challengeCard: {
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.homeOrangeLight,
    padding: 18,
  },
  challengeHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeText: { flex: 1 },
  challengeTitle: { fontSize: 18, fontWeight: '700', color: colors.accentRedAlt, marginBottom: 3 },
  challengeSubtitle: { fontSize: 13, color: colors.textLabel },
  challengeMeta: { flexDirection: 'row', gap: 18, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: colors.textLabel },
  playButton: {
    minHeight: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center', marginTop: 14 },
  emptyMessage: { fontSize: 14, lineHeight: 20, color: colors.textLabel, textAlign: 'center', marginTop: 8 },
});
