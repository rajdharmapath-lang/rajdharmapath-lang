import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches, lessonsByBatch } from '../data/courses';
import { usePayment } from '../context/PaymentContext';
import { useAccessGate } from '../utils/paywall';

export default function VideoListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { hasBatchAccess } = usePayment();
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const lessons = lessonsByBatch[batchId] || [];

  // Batch-specific gate: this batch's own tier must be purchased, unlike the
  // "any batch unlocks it" gate used for Stroke/Speech/Vocabulary.
  useAccessGate(navigation, route, hasBatchAccess(batchId), batchId);

  const handleOpenLesson = (lesson) => {
    if (lesson.locked) {
      Alert.alert('Locked', 'Complete the previous lesson to unlock this one.');
      return;
    }
    navigation.navigate('VideoPlayer', { batchId, lessonId: lesson.id });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>{batch?.name || 'Batch'}</Text>

        <FlatList
          data={lessons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => handleOpenLesson(item)}
            >
              <View style={styles.thumb}>
                <Ionicons name="play-circle-outline" size={30} color={colors.navInactive} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name={item.locked ? 'lock-closed-outline' : 'lock-open-outline'}
                size={20}
                color={colors.lockGray}
              />
            </Pressable>
          )}
        />
      </View>

      <BottomNav
        active="Videos"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  thumb: {
    width: 64,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.homeCardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowText: { flex: 1 },
  rowTitle: { ...typography.bodyBold, color: colors.textDark, marginBottom: 2 },
  rowSubtitle: { ...typography.small, color: colors.textLabel },
});
