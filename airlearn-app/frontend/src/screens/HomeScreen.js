import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import ProgressRing from '../components/ProgressRing';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { useProgress } from '../context/ProgressContext';
import { batches, lessonsByBatch } from '../data/courses';

const ACCESS_ITEMS = [
  { key: 'stroke', label: 'Stroke', glyph: '学', destination: 'CharacterSelect', enabled: true },
  { key: 'speech', label: 'Speech', icon: 'mic', destination: 'VocabularyCategoryList', params: { mode: 'speech' }, enabled: true },
  {
    key: 'quiz',
    label: 'Practice',
    image: require('../../assets/Quiz.png'),
    destination: 'QuizBatchList',
    enabled: true,
  },
  {
    key: 'pdf',
    label: 'Notes',
    image: require('../../assets/Pdf_Icon.png'),
    destination: 'LearningPdf',
    enabled: true,
  },
];

const HIDDEN_ACCESS_ITEM_KEYS = new Set(['speech']);

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { purchasedBatches } = usePayment();
  const { wordsLearnedCount, completedVideoIds, daysStreak, progressLoadError } = useProgress();

  const enrolledBatchId =
    Object.entries(purchasedBatches)
      .sort(([, first], [, second]) => (second.purchasedAt || 0) - (first.purchasedAt || 0))[0]?.[0] ||
    'foundation';
  const enrolledBatch = batches.find((batch) => batch.id === enrolledBatchId) ||
    batches.find((batch) => batch.id === 'foundation');
  const enrolledLessons = enrolledBatch?.contentComingSoon
    ? []
    : lessonsByBatch[enrolledBatchId] || [];
  const completedEnrolledVideos = enrolledLessons.filter((lesson) =>
    completedVideoIds.includes(lesson.id)
  ).length;
  const continueLesson = enrolledLessons[0];
  const batchPercent = enrolledLessons.length
    ? Math.round((completedEnrolledVideos / enrolledLessons.length) * 100)
    : 0;

  const handleAccessPress = (item) => {
    if (!item.enabled) return;
    navigation.navigate(item.destination, item.params);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name || 'there'}</Text>
            <Text style={styles.subtitle}>Let's continue your Chinese Learning.</Text>
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.learningSections}>
            <View style={styles.progressCard}>
              <Text style={styles.progressLabel}>Your Progress</Text>
              <View style={styles.progressRow}>
                <Text style={styles.batchName}>{enrolledBatch?.name || 'Foundation Batch'}</Text>
                <ProgressRing percent={batchPercent} size={72} strokeWidth={7} />
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{completedEnrolledVideos}</Text>
                  <Text style={styles.statLabel}>Videos Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{wordsLearnedCount}</Text>
                  <Text style={styles.statLabel}>Words Learned</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{daysStreak}</Text>
                  <Text style={styles.statLabel}>Days Streak</Text>
                </View>
              </View>
              {progressLoadError && (
                <Text style={styles.progressError}>
                  Your progress could not be loaded. Please try again later.
                </Text>
              )}
            </View>

            <View style={styles.sectionDivider} />

            <View>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              {continueLesson && (
                <Pressable
                  style={styles.continueCard}
                  onPress={() =>
                    navigation.navigate('VideoPlayer', {
                      batchId: enrolledBatchId,
                      lessonId: continueLesson.id,
                    })
                  }
                >
                  <View style={styles.continueThumb}>
                    <Ionicons name="play-circle-outline" size={36} color={colors.homeOrange} />
                  </View>
                  <View style={styles.continueText}>
                    <Text style={styles.continueTitle}>{continueLesson.title}</Text>
                    <Text style={styles.continueSubtitle}>{continueLesson.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={colors.textDark} />
                </Pressable>
              )}
            </View>

            <View style={styles.sectionDivider} />

            <View>
              <Text style={styles.sectionTitle}>Access</Text>
              <View style={styles.accessGrid}>
                {ACCESS_ITEMS.filter((item) => !HIDDEN_ACCESS_ITEM_KEYS.has(item.key)).map((item, index) => (
                  <StaggeredSlideItem
                    key={item.key}
                    index={index}
                    style={styles.accessTileAnimation}
                  >
                    <Pressable
                      style={[styles.accessTile, !item.enabled && styles.accessTileDisabled]}
                      onPress={() => handleAccessPress(item)}
                    >
                      {item.glyph ? (
                        <View style={styles.accessIconSlot}>
                          <Text style={styles.accessGlyph}>{item.glyph}</Text>
                        </View>
                      ) : item.key === 'speech' ? (
                        <View style={styles.accessIconSlot}>
                          <View style={styles.speechIconCircle}>
                            <Ionicons name={item.icon} size={20} color="#fff" />
                          </View>
                        </View>
                      ) : item.image ? (
                        <View style={styles.accessIconSlot}>
                          <Image source={item.image} style={styles.accessImage} resizeMode="contain" />
                        </View>
                      ) : (
                        <View style={styles.accessIconSlot}>
                          <Ionicons name={item.icon} size={26} color={colors.homeOrange} />
                        </View>
                      )}
                      <Text style={styles.accessLabel}>{item.label}</Text>
                      {!item.enabled && <Text style={styles.comingSoon}>Coming soon</Text>}
                    </Pressable>
                  </StaggeredSlideItem>
                ))}
              </View>
            </View>
          </View>
        </View>
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
  scrollContent: { flexGrow: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  learningSections: { marginTop: 8, gap: 8 },
  greeting: { ...typography.h2, color: colors.accentRedAlt, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textDark, marginBottom: 12 },
  sectionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.homeOrangeLight,
    alignSelf: 'center',
  },
  progressCard: {
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 18,
    padding: 22,
    marginBottom: 8,
  },
  progressLabel: { fontSize: 16, color: colors.textDark, marginBottom: 4 },
  progressError: { fontSize: 12, color: colors.textLabel, marginTop: 8 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  batchName: { fontSize: 20, fontWeight: '700', color: colors.accentRedAlt },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.textDark, marginBottom: 2 },
  statLabel: { fontSize: 12, color: colors.textLabel, textAlign: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.strokeTrackLight },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.accentRedAlt, marginBottom: 14 },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 14,
    minHeight: 108,
    marginBottom: 8,
  },
  continueThumb: {
    width: 100,
    height: 74,
    borderRadius: 10,
    backgroundColor: colors.navInactiveBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  continueText: { flex: 1 },
  continueTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 2 },
  continueSubtitle: { fontSize: 13, color: colors.textLabel },
  accessGrid: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: 12,
  },
  accessTileAnimation: { flex: 1, aspectRatio: 0.9 },
  accessTile: {
    flex: 1,
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  accessTileDisabled: { opacity: 0.5 },
  accessIconSlot: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  accessGlyph: { fontSize: 32, color: colors.homeOrange, fontWeight: '600' },
  accessImage: { width: 42, height: 42 },
  speechIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 18,
    backgroundColor: colors.homeOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessLabel: { fontSize: 12, color: colors.textDark, fontWeight: '600', textAlign: 'center' },
  comingSoon: { fontSize: 9, color: colors.textLabel, marginTop: 2, textAlign: 'center' },
});
