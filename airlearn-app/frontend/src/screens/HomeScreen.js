import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import ProgressRing from '../components/ProgressRing';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { lessonsByBatch } from '../data/courses';

const ACCESS_ITEMS = [
  { key: 'stroke', label: 'Stroke', glyph: '学', destination: 'CharacterSelect', enabled: true },
  { key: 'speech', label: 'Speech', icon: 'mic', destination: 'VocabularyCategoryList', params: { mode: 'speech' }, enabled: true },
  { key: 'quiz', label: 'Quiz', icon: 'create-outline', destination: 'QuizBatchList', enabled: true },
  { key: 'listening', label: 'Listening', icon: 'headset-outline', enabled: false },
];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { wordsLearnedCount, videosCompletedCount, daysStreak } = useProgress();

  const foundationLessons = lessonsByBatch.foundation || [];
  const continueLesson = foundationLessons[0];
  // Real progress against the Foundation batch's actual lesson count — not a
  // hardcoded "10 videos" like the original mock, since only a handful of
  // lessons have real content right now (see data/courses.js).
  const batchPercent = foundationLessons.length
    ? Math.round((videosCompletedCount / foundationLessons.length) * 100)
    : 0;

  const handleAccessPress = (item) => {
    if (!item.enabled) return; // Listening has no screens built yet
    navigation.navigate(item.destination, item.params);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.greeting}>Hi, {user?.name || 'there'}</Text>
          <Text style={styles.subtitle}>Let's continue your Chinese Learning.</Text>

          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Your Progress</Text>
            <View style={styles.progressRow}>
              <Text style={styles.batchName}>Foundation Batch</Text>
              <ProgressRing percent={batchPercent} size={64} strokeWidth={6} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{videosCompletedCount}</Text>
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
          </View>

          <Text style={styles.sectionTitle}>Continue Learning</Text>
          {continueLesson && (
            <Pressable
              style={styles.continueCard}
              onPress={() =>
                navigation.navigate('VideoPlayer', {
                  batchId: 'foundation',
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

          <Text style={styles.sectionTitle}>Access</Text>
          <View style={styles.accessGrid}>
            {ACCESS_ITEMS.map((item, index) => (
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
  container: { paddingHorizontal: 20, paddingTop: 24 },
  greeting: { ...typography.h2, color: colors.accentRedAlt, marginBottom: 4 },
  subtitle: { ...typography.body, color: colors.textDark, marginBottom: 20 },
  progressCard: {
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  progressLabel: { fontSize: 16, color: colors.textDark, marginBottom: 4 },
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
    padding: 12,
    marginBottom: 28,
  },
  continueThumb: {
    width: 90,
    height: 66,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  accessTileAnimation: { width: '23%', aspectRatio: 0.85 },
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  accessGlyph: { fontSize: 26, color: colors.homeOrange, fontWeight: '600' },
  speechIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.homeOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessLabel: { fontSize: 12, color: colors.textDark, fontWeight: '600', textAlign: 'center' },
  comingSoon: { fontSize: 9, color: colors.textLabel, marginTop: 2, textAlign: 'center' },
});
