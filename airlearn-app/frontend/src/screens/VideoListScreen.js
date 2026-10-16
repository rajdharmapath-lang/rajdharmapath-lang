import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches, lessonsByBatch } from '../data/courses';
import { FOUNDATION_FREE_TRIAL_LIMIT, usePayment } from '../context/PaymentContext';
import { FOUNDATION_TRIAL_UPGRADE_MESSAGE, redirectToPaywall } from '../utils/paywall';

export default function VideoListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const {
    loaded,
    hasPrimeAccess,
    foundationTrialLessonIds,
    foundationTrialsLoaded,
    claimFoundationTrial,
  } = usePayment();
  const [noticeMessage, setNoticeMessage] = useState(null);
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const lessons = lessonsByBatch[batchId] || [];
  const rowAnimations = useRef(lessons.map(() => new Animated.Value(0))).current;
  const isComingSoon = batchId === 'elevation' || batchId === 'distinction';

  useEffect(() => {
    Animated.stagger(
      120,
      rowAnimations.map((animation) =>
        Animated.timing(animation, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [rowAnimations]);

  const handleOpenLesson = async (lesson) => {
    const isPreviewLesson = lessons[0]?.id === lesson.id;
    if (!loaded) {
      setNoticeMessage('Checking your plan access. Please try again in a moment.');
      return;
    }

    if (hasPrimeAccess()) {
      navigation.push('VideoPlayer', { batchId, lessonId: lesson.id });
      return;
    }

    if (batchId === 'foundation') {
      if (!foundationTrialsLoaded) {
        setNoticeMessage('Checking your free preview access. Please try again in a moment.');
        return;
      }
      try {
        const allowed = await claimFoundationTrial(lesson.id);
        if (!allowed) {
          redirectToPaywall(
            navigation,
            route,
            batchId,
            FOUNDATION_TRIAL_UPGRADE_MESSAGE
          );
          return;
        }
      } catch (error) {
        console.error('Could not verify Foundation free preview access:', error);
        setNoticeMessage('Unable to verify your free preview access. Please try again.');
        return;
      }
    } else if (!isPreviewLesson) {
      redirectToPaywall(navigation, route, batchId);
      return;
    }

    navigation.push('VideoPlayer', { batchId, lessonId: lesson.id });
  };

  const isLessonLocked = (lessonId, index) => {
    const hasAccess = hasPrimeAccess();
    const isFoundationPreview =
      batchId === 'foundation' &&
      foundationTrialsLoaded &&
      (foundationTrialLessonIds.includes(lessonId) ||
        foundationTrialLessonIds.length < FOUNDATION_FREE_TRIAL_LIMIT);
    const isFreePreview = batchId !== 'foundation' && index === 0 && !hasAccess;
    return !hasAccess && !isFoundationPreview && !isFreePreview;
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>{batch?.name || 'Batch'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isComingSoon ? (
          <View style={styles.comingSoon}>
            <Ionicons name="time-outline" size={42} color={colors.homeOrange} />
            <Text style={styles.comingSoonTitle}>Videos coming soon</Text>
            <Text style={styles.comingSoonMessage}>
              Lessons for this batch will be available soon.
            </Text>
          </View>
        ) : (
          <FlatList
            data={lessons}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => (
              <Animated.View style={{ opacity: rowAnimations[index] }}>
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
                    name={isLessonLocked(item.id, index) ? 'lock-closed-outline' : 'lock-open-outline'}
                    size={20}
                    color={colors.lockGray}
                  />
                </Pressable>
              </Animated.View>
            )}
          />
        )}
      </View>

      <Modal
        visible={Boolean(noticeMessage)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setNoticeMessage(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setNoticeMessage(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          />
          <View
            style={[styles.noticeModal, { maxWidth: Math.min(maxWidth - 48, 420) }]}
            accessibilityViewIsModal
          >
            <View style={styles.noticeIcon}>
              <Ionicons name="lock-closed-outline" size={26} color={colors.homeOrange} />
            </View>
            <Text style={styles.noticeTitle}>Access notice</Text>
            <Text style={styles.noticeMessage}>{noticeMessage}</Text>
            <Pressable
              style={styles.noticeButton}
              onPress={() => setNoticeMessage(null)}
              accessibilityRole="button"
            >
              <Text style={styles.noticeButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BottomNav
        active="Videos"
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center' },
  headerSpacer: { width: 26 },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  comingSoonTitle: {
    ...typography.h2,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 16,
  },
  comingSoonMessage: {
    ...typography.body,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  noticeModal: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  noticeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noticeTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  noticeMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
  noticeButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  noticeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
