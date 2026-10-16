import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches } from '../data/courses';
import { getQuizzesForBatch } from '../data/quizzes';

const BATCH_ARTWORK = {
  foundation: require('../../assets/foundatin Batch asset.png'),
  elevation: require('../../assets/Elevation Batch asset.png'),
  distinction: require('../../assets/Distinction Batch asset.png'),
};

const TOPIC_GROUPS = [
  {
    title: 'Numbers',
    color: colors.homeOrange,
    background: '#FFF4EA',
    icon: '123',
    topics: [
      ['quiz2', 'Numbers'],
      ['quiz3', 'Phone Numbers and Number Recognition'],
      ['quiz11', 'Hundreds and Thousands'],
      ['quiz4', 'Age, Prices and Counting Objects'],
      ['quiz1', 'Basic Numbers'],
    ],
  },
  {
    title: 'Greetings and Basic Expressions',
    color: '#8D5BC7',
    background: '#F7F1FC',
    icon: 'chatbubble-ellipses',
    topics: [
      ['quiz10', 'Greetings and Basic Expressions'],
      ['quiz14', 'Name and Personal Information'],
      ['quiz15', 'Nationality and Hometown'],
      ['quiz7', 'Complete Self-introduction'],
    ],
  },
  {
    title: 'Family and Relationships',
    color: '#329B84',
    background: '#EFF9F6',
    icon: 'people',
    topics: [
      ['quiz12', 'Immediate Family Members'],
      ['quiz13', 'Introducing Your Family'],
      ['quiz9', 'Family Size and Age'],
      ['quiz8', 'Extended Family Relationships'],
      ['quiz16', 'Talking About Parents and Siblings'],
    ],
  },
  {
    title: 'Vegetables and Shopping',
    color: '#E65F75',
    background: '#FFF1F3',
    icon: 'leaf',
    topics: [
      ['quiz5', 'Asking Vegetable Prices'],
      ['quiz6', 'Common Vegetables'],
      ['quiz17', 'Vegetable Names Image Recognition'],
    ],
  },
];

const TOPIC_TITLE_OVERRIDES = Object.fromEntries(
  TOPIC_GROUPS.flatMap((group) => group.topics.map(([id, title]) => [id, title]))
);

function getTopicIcon(quizId) {
  if (quizId === 'quiz11' || quizId === 'quiz2' || quizId === 'quiz1') return 'calculator';
  if (quizId === 'quiz4') return 'gift';
  if (quizId === 'quiz7') return 'person-add';
  if (quizId === 'quiz14') return 'person';
  if (quizId === 'quiz15') return 'globe-outline';
  if (quizId === 'quiz12' || quizId === 'quiz13' || quizId === 'quiz9' || quizId === 'quiz8' || quizId === 'quiz16') return 'people';
  if (quizId === 'quiz5') return 'pricetag';
  if (quizId === 'quiz6' || quizId === 'quiz17') return 'leaf';
  return 'chatbubble-ellipses';
}

export default function QuizBatchListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const [search, setSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const batchAnimations = useRef(batches.map(() => new Animated.Value(0))).current;
  const groupAnimations = useRef(TOPIC_GROUPS.map(() => new Animated.Value(0))).current;
  const quizzes = selectedBatchId ? getQuizzesForBatch(selectedBatchId) : [];

  useEffect(() => {
    const animations = selectedBatchId ? groupAnimations : batchAnimations;
    animations.forEach((animation) => animation.setValue(0));
    const entrance = Animated.stagger(
      120,
      animations.map((animation) =>
        Animated.timing(animation, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        })
      )
    );
    entrance.start();
    return () => entrance.stop();
  }, [batchAnimations, groupAnimations, selectedBatchId]);

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (selectedBatchId !== 'foundation') return [];
    return TOPIC_GROUPS.map((group) => ({
      ...group,
      quizzes: group.topics
        .map(([quizId]) => quizzes.find((quiz) => quiz.id === quizId))
        .filter((quiz) => quiz?.questions?.length)
        .map((quiz) => ({
          ...quiz,
          displayTitle: TOPIC_TITLE_OVERRIDES[quiz.id] || quiz.topicName || quiz.name,
        }))
        .filter((quiz) => (
          !query ||
          quiz.displayTitle.toLocaleLowerCase().includes(query) ||
          group.title.toLocaleLowerCase().includes(query)
        )),
    })).filter((group) => group.quizzes.length);
  }, [quizzes, search, selectedBatchId]);

  const startTopic = (quiz) => {
    navigation.navigate('QuizPlay', {
      batchId: selectedBatchId,
      quizId: quiz.id,
    });
  };

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId);
  const topicCount = (batchId) =>
    getQuizzesForBatch(batchId).filter((quiz) => quiz.questions?.length).length;

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (
              selectedBatchId ? setSelectedBatchId(null) : navigation.goBack()
            )}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Practice</Text>
          <View style={styles.headerSpacer} />
        </View>
        {!selectedBatchId ? (
          <>
            <Text style={styles.subtitle}>Choose a batch to explore its practice path.</Text>
            <ScrollView style={styles.topicScroll} contentContainerStyle={styles.batchContent}>
              {batches.map((batch, index) => {
                const count = topicCount(batch.id);
                return (
                  <Animated.View
                    key={batch.id}
                    style={[
                      styles.batchCardAnimation,
                      {
                        opacity: batchAnimations[index],
                        transform: [
                          {
                            translateX: batchAnimations[index].interpolate({
                              inputRange: [0, 1],
                              outputRange: [-24, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Pressable
                      style={[styles.batchCard, { backgroundColor: colors[batch.colorBg] }]}
                      onPress={() => setSelectedBatchId(batch.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`${batch.name}, ${count ? `${count} practice topics` : 'coming soon'}`}
                    >
                      {count > 0 ? (
                        <View style={styles.availableBatchContent}>
                          <View style={[styles.batchBadge, { backgroundColor: colors[batch.colorAccent] }]}>
                            <Text style={styles.batchGlyph}>{batch.glyph}</Text>
                          </View>
                          <View style={styles.batchText}>
                            <Text style={[styles.batchName, { color: colors[batch.colorAccent] }]}>
                              {batch.name}
                            </Text>
                            <Text style={styles.batchSubtitle}>{batch.subtitle}</Text>
                            <Text style={styles.batchAvailability}>
                              {count} {count === 1 ? 'practice topic' : 'practice topics'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.unavailableContent}>
                          <View style={[styles.unavailableIcon, { backgroundColor: colors.card }]}>
                            <Ionicons name="game-controller-outline" size={24} color={colors[batch.colorAccent]} />
                          </View>
                          <Text style={[styles.batchName, styles.unavailableTitle, { color: colors[batch.colorAccent] }]}>
                            {batch.name}
                          </Text>
                          <Text style={[styles.batchAvailability, styles.unavailableMessage]}>
                            {batch.subtitle} · Coming soon
                          </Text>
                        </View>
                      )}
                      <Image
                        source={BATCH_ARTWORK[batch.id]}
                        style={styles.batchArtwork}
                        resizeMode="stretch"
                        accessible={false}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </>
        ) : selectedBatchId !== 'foundation' ? (
          <View style={styles.emptyState}>
            <Ionicons name="game-controller-outline" size={38} color={colors.homeOrange} />
            <Text style={styles.emptyTitle}>Practice topics coming soon</Text>
            <Text style={styles.emptyText}>
              {selectedBatch?.name} practice topics will be available soon.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              {selectedBatch?.name} · Choose a topic and practice what you've learned.
            </Text>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={23} color={colors.homeOrange} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search practice topics"
                placeholderTextColor={colors.textPlaceholder}
                returnKeyType="search"
                accessibilityLabel="Search practice topics"
              />
              {search.length > 0 && (
                <Pressable
                  onPress={() => setSearch('')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={20} color={colors.textPlaceholder} />
                </Pressable>
              )}
            </View>
            <ScrollView
              style={styles.topicScroll}
              contentContainerStyle={styles.topicContent}
              keyboardShouldPersistTaps="handled"
            >
              {visibleGroups.map((group, index) => (
                <Animated.View
                  key={group.title}
                  style={[
                    styles.groupAnimation,
                    {
                      opacity: groupAnimations[index],
                      transform: [
                        {
                          translateX: groupAnimations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [-24, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.groupHeading}>
                    <View style={[styles.groupAccent, { backgroundColor: group.color }]} />
                    <Text style={styles.groupTitle}>{group.title}</Text>
                  </View>
                  <View style={[styles.topicCard, { borderColor: `${group.color}22` }]}>
                    {group.quizzes.map((quiz) => (
                      <Pressable
                        key={quiz.id}
                        style={[styles.topicRow, { backgroundColor: group.background }]}
                        onPress={() => startTopic(quiz)}
                        accessibilityRole="button"
                        accessibilityLabel={`Start ${quiz.displayTitle}, ${quiz.questions.length} questions`}
                      >
                        <View style={[styles.topicIcon, { backgroundColor: group.color }]}>
                          {group.icon === '123' ? (
                            <Text style={styles.numberIcon}>123</Text>
                          ) : quiz.id === 'quiz3' ? (
                            <View style={styles.phoneNumberIcon}>
                              <Ionicons name="call" size={22} color="#fff" />
                              <Ionicons name="keypad" size={13} color="#fff" style={styles.phoneKeypadIcon} />
                            </View>
                          ) : (
                            <Ionicons name={getTopicIcon(quiz.id)} size={22} color="#fff" />
                          )}
                        </View>
                        <Text style={styles.topicTitle}>{quiz.displayTitle}</Text>
                        <Ionicons name="chevron-forward" size={22} color={group.color} />
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              ))}
              {visibleGroups.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={34} color={colors.textPlaceholder} />
                  <Text style={styles.emptyText}>No practice topics match your search.</Text>
                </View>
              )}
            </ScrollView>
          </>
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
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', flex: 1 },
  headerSpacer: { width: 26 },
  batchContent: { flexGrow: 1, paddingBottom: 24, gap: 16 },
  batchCardAnimation: { flexGrow: 1 },
  batchCard: {
    flexGrow: 1,
    minHeight: 164,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 54,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  availableBatchContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
  },
  unavailableContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 12 },
  batchBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  batchGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  batchText: { width: '100%', alignItems: 'center' },
  batchName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  batchSubtitle: { fontSize: 14, color: colors.textDark, textAlign: 'center' },
  batchAvailability: { fontSize: 11, fontWeight: '600', color: colors.textLabel, textAlign: 'center', marginTop: 5 },
  unavailableIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  unavailableTitle: { textAlign: 'center' },
  unavailableMessage: { textAlign: 'center', maxWidth: 240 },
  batchArtwork: { position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 58 },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPlaceholder,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 28,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textDark, marginLeft: 12, paddingVertical: 10 },
  topicScroll: { flex: 1 },
  topicContent: { paddingBottom: 24 },
  groupAnimation: { flexGrow: 1 },
  group: { marginBottom: 22 },
  groupHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  groupAccent: { width: 6, height: 32, borderRadius: 4, marginRight: 12 },
  groupTitle: { fontSize: 19, fontWeight: '700', color: colors.accentRedAlt, flex: 1 },
  topicCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    gap: 8,
  },
  topicRow: {
    minHeight: 64,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  topicIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  numberIcon: { color: '#fff', fontSize: 15, fontWeight: '800' },
  phoneNumberIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneKeypadIcon: { position: 'absolute', right: 5, bottom: 5 },
  topicTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.textDark, marginRight: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.accentRedAlt, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.textLabel, textAlign: 'center' },
});
