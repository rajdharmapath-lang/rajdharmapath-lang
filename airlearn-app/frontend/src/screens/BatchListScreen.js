import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Alert,
  Linking,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches, lessonsByBatch, liveClass } from '../data/courses';
import { usePayment } from '../context/PaymentContext';
import { getLiveClassSchedule } from '../utils/liveClassSchedule';
import { redirectToPaywall } from '../utils/paywall';
import { userApi } from '../api/client';

const BATCH_ARTWORK = {
  foundation: require('../../assets/foundatin Batch asset.png'),
  elevation: require('../../assets/Elevation Batch asset.png'),
  distinction: require('../../assets/Distinction Batch asset.png'),
};

export default function BatchListScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { loaded: entitlementsLoaded, hasAnyLiveAccess } = usePayment();
  const cardAnimations = useRef(batches.map(() => new Animated.Value(0))).current;
  const [liveSchedule, setLiveSchedule] = useState(() => getLiveClassSchedule());
  const hasLivePackage = entitlementsLoaded && hasAnyLiveAccess();
  const isLiveActionDisabled =
    !entitlementsLoaded || (hasLivePackage && !liveSchedule.isAvailable);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveSchedule(getLiveClassSchedule());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.stagger(
      120,
      cardAnimations.map((animation) =>
        Animated.timing(animation, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [cardAnimations]);

  const handleJoinLive = async () => {
    if (!entitlementsLoaded) {
      return;
    }
    if (!hasLivePackage) {
      redirectToPaywall(
        navigation,
        route,
        undefined,
        'Upgrade to a Live Class package to join live classes.'
      );
      return;
    }
    if (!liveSchedule.isAvailable) return;

    try {
      const { data } = await userApi.getLiveClassMeetingLink();
      if (typeof data?.meetingUrl !== 'string' || !data.meetingUrl.startsWith('https://')) {
        throw new Error('The Zoom meeting link is not configured correctly.');
      }
      await Linking.openURL(data.meetingUrl);
    } catch (error) {
      Alert.alert(
        'Unable to join live class',
        error.response?.data?.message || error.message || 'Please try again later.'
      );
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Videos</Text>

          {batches.map((batch, index) => {
            const videoCount = batch.contentComingSoon
              ? 0
              : (lessonsByBatch[batch.id] || []).length;
            return (
              <Animated.View
                key={batch.id}
                style={[
                  styles.cardAnimation,
                  {
                    opacity: cardAnimations[index],
                    transform: [
                      {
                        translateX: cardAnimations[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-24, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Pressable
                  style={[styles.card, { backgroundColor: colors[batch.colorBg] }]}
                  onPress={() => navigation.navigate('VideoList', { batchId: batch.id })}
                >
                  <Image
                    source={BATCH_ARTWORK[batch.id]}
                    style={styles.batchArtwork}
                    resizeMode="stretch"
                    accessible={false}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardName, { color: colors[batch.colorAccent] }]}>
                        {batch.name}
                      </Text>
                      <Text style={styles.cardSubtitle}>{batch.subtitle}</Text>
                      <Text style={styles.cardCount}>
                        {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors[batch.colorAccent] }]}>
                      <Text style={styles.badgeGlyph}>{batch.glyph}</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {liveClass.status ? (
            <View style={styles.liveBanner}>
              <View style={styles.liveRow}>
                <View style={[styles.liveDot, !hasLivePackage && styles.liveDotInactive]} />
                <Text style={styles.liveText}>
                  {hasLivePackage ? 'LIVE CLASS' : entitlementsLoaded ? 'NO LIVE' : 'LIVE CLASS'}
                  <Text style={styles.liveUpcoming}>
                    {' '}({hasLivePackage ? liveSchedule.status : entitlementsLoaded ? 'Upgrade required' : 'Checking access'})
                  </Text>
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  style={[styles.joinButton, isLiveActionDisabled && styles.joinButtonDisabled]}
                  onPress={handleJoinLive}
                  disabled={isLiveActionDisabled}
                  accessibilityState={{ disabled: isLiveActionDisabled }}
                >
                  <Text style={styles.joinButtonText}>
                    {hasLivePackage ? 'Join Live' : 'Upgrade for Live'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.scheduleRow}>
                <View style={styles.videoIconCircle}>
                  <Ionicons name="videocam" size={14} color="#fff" />
                </View>
                <Text style={styles.scheduleText}>
                  {hasLivePackage
                    ? liveSchedule.scheduleLabel
                    : entitlementsLoaded
                      ? 'Upgrade to a Live Class package to get access (available from the 1st–10th each month).'
                      : 'Checking your package access…'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.liveBanner, styles.liveBannerEmpty]}>
              <View style={styles.videoIconCircle}>
                <Ionicons name="videocam" size={14} color="#fff" />
              </View>
              <Text style={styles.noLiveText}>No live class scheduled</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav
        active="Videos"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Language') navigation.navigate('Vocabulary');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  cardAnimation: { flexGrow: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    gap: 16,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center' },
  card: {
    flexGrow: 1,
    minHeight: 164,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 54,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  batchArtwork: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 58,
  },
  cardText: { flex: 1 },
  cardName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.textDark, marginBottom: 14 },
  cardCount: { fontSize: 13, color: colors.textLabel },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  liveBanner: {
    flexGrow: 1,
    backgroundColor: colors.liveClassBg,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'center',
  },
  liveBannerEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noLiveText: { fontSize: 14, color: colors.textDark, marginLeft: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.liveDot, marginRight: 8 },
  liveDotInactive: { backgroundColor: colors.textLabel },
  liveText: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  liveUpcoming: { fontWeight: '400', color: colors.textLabel },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonDisabled: { opacity: 0.5 },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center' },
  videoIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  scheduleText: { fontSize: 13, color: colors.textLabel, flexShrink: 1 },
});
