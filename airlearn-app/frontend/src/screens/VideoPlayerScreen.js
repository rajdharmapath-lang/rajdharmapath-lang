import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { lessonsByBatch } from '../data/courses';
import { useProgress } from '../context/ProgressContext';
import { usePayment } from '../context/PaymentContext';
import { FOUNDATION_TRIAL_UPGRADE_MESSAGE, redirectToPaywall } from '../utils/paywall';
import { userApi } from '../api/client';

export default function VideoPlayerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { recordVideoCompleted } = useProgress();
  const {
    loaded,
    hasPrimeAccess,
    foundationTrialsLoaded,
    claimFoundationTrial,
  } = usePayment();
  const { batchId = 'foundation', lessonId } = route?.params || {};
  const lessons = lessonsByBatch[batchId] || [];
  const currentIndex = Math.max(0, lessons.findIndex((l) => l.id === lessonId));
  const lesson = lessons[currentIndex] || lessons[0];
  const upNext = lessons.filter((_, i) => i !== currentIndex);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [landscapeLocked, setLandscapeLocked] = useState(false);
  const [videoUrl, setVideoUrl] = useState(lesson?.videoUrl || null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [accessReady, setAccessReady] = useState(false);
  const [accessError, setAccessError] = useState(null);
  const [accessNotice, setAccessNotice] = useState(null);

  useEffect(() => {
    let active = true;
    setAccessReady(false);
    setAccessError(null);

    const checkAccess = async () => {
      if (!loaded) return;
      if (hasPrimeAccess()) {
        setAccessReady(true);
        return;
      }
      if (batchId === 'foundation' && lesson) {
        if (!foundationTrialsLoaded) return;
        try {
          const allowed = await claimFoundationTrial(lesson.id);
          if (!active) return;
          if (allowed) {
            setAccessReady(true);
          } else {
            redirectToPaywall(
              navigation,
              route,
              batchId,
              FOUNDATION_TRIAL_UPGRADE_MESSAGE
            );
          }
        } catch (error) {
          console.error('Could not verify Foundation free preview access:', error);
          if (active) setAccessError('Unable to verify your free preview access. Please go back and try again.');
        }
        return;
      }
      if (currentIndex === 0) {
        setAccessReady(true);
        return;
      }
      redirectToPaywall(navigation, route, batchId);
    };

    checkAccess();
    return () => {
      active = false;
    };
  }, [
    batchId,
    claimFoundationTrial,
    currentIndex,
    foundationTrialsLoaded,
    hasPrimeAccess,
    lesson,
    loaded,
    navigation,
    route,
  ]);

  useFocusEffect(
    useCallback(() => {
      setLandscapeLocked(false);
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT)
        .catch((error) => console.error('Could not enable video screen rotation:', error));

      return () => {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
          .catch((error) => console.error('Could not restore portrait orientation:', error));
      };
    }, [])
  );

  const loadVideoUrl = useCallback(async () => {
    if (!accessReady || batchId !== 'foundation' || !lesson || lesson.videoUrl) return;
    setVideoLoading(true);
    setVideoError(null);
    try {
      const { data } = await userApi.getFoundationLessonVideo(lesson.id);
      if (typeof data?.videoUrl !== 'string' || !data.videoUrl) {
        throw new Error('The video service returned an invalid URL.');
      }
      setVideoUrl(data.videoUrl);
    } catch {
      setVideoError('Unable to load this video. Check your connection and try again.');
    } finally {
      setVideoLoading(false);
    }
  }, [accessReady, batchId, lesson]);

  useEffect(() => {
    if (!accessReady) return;
    if (lesson?.videoUrl) {
      setVideoUrl(lesson.videoUrl);
      setVideoError(null);
      return;
    }
    if (batchId === 'foundation' && lesson) {
      setVideoUrl(null);
      loadVideoUrl();
    }
  }, [accessReady, batchId, lesson, loadVideoUrl]);

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLandscape = async () => {
    const nextLandscapeLocked = !landscapeLocked;
    await ScreenOrientation.lockAsync(
      nextLandscapeLocked
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.DEFAULT
    );
    setLandscapeLocked(nextLandscapeLocked);
  };

  const seekTo = async (seconds) => {
    const nextPosition = Math.max(0, Math.min(seconds * 1000, durationMillis));
    setPositionMillis(nextPosition);
    await videoRef.current?.setPositionAsync(nextPosition);
  };

  const handleStatusUpdate = (status) => {
    if (status.isLoaded) {
      if (status.durationMillis) setDurationMillis(status.durationMillis);
      if (!isSeeking) setPositionMillis(status.positionMillis);
      setIsPlaying(status.isPlaying);
    }
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPositionMillis(status.durationMillis || durationMillis);
      if (lesson) recordVideoCompleted(lesson.id);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const handleOpenLesson = async (target) => {
    const targetIndex = lessons.findIndex((item) => item.id === target.id);
    if (!loaded) {
      setAccessNotice('Checking your plan access. Please try again in a moment.');
      return;
    }

    if (!hasPrimeAccess()) {
      if (batchId === 'foundation') {
        if (!foundationTrialsLoaded) {
          setAccessNotice('Checking your free preview access. Please try again in a moment.');
          return;
        }
        try {
          const allowed = await claimFoundationTrial(target.id);
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
          setAccessNotice('Unable to verify your free preview access. Please try again.');
          return;
        }
      } else if (targetIndex !== 0) {
        redirectToPaywall(navigation, route, batchId);
        return;
      }
    }
    navigation.push('VideoPlayer', { batchId, lessonId: target.id });
  };

  return (
    <View
      style={[
        styles.flex,
        isLandscape && styles.landscapeRoot,
        {
          paddingTop: isLandscape ? 0 : insets.top,
          paddingBottom: isLandscape ? 0 : insets.bottom,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          isLandscape && styles.landscapeContainer,
          { maxWidth: isLandscape ? undefined : maxWidth, alignSelf: 'center', width: '100%' },
        ]}
      >
        {!isLandscape && (
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back to video topics"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.title}>Lesson {currentIndex + 1}</Text>
            <View style={styles.headerSpacer} />
          </View>
        )}

        <View style={[styles.playerCard, isLandscape && styles.landscapePlayerCard]}>
          {!accessReady ? (
            <View style={styles.videoMessage}>
              <ActivityIndicator color={colors.playerCircle} />
              <Text style={styles.videoMessageText}>
                {accessError || 'Checking course access...'}
              </Text>
            </View>
          ) : videoLoading ? (
            <View style={styles.videoMessage}>
              <ActivityIndicator color={colors.playerCircle} />
              <Text style={styles.videoMessageText}>Loading video...</Text>
            </View>
          ) : videoError ? (
            <Pressable style={styles.videoMessage} onPress={loadVideoUrl}>
              <Text style={styles.videoMessageText}>{videoError}</Text>
              <Text style={styles.retryText}>Tap to retry</Text>
            </Pressable>
          ) : videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={styles.videoSurface}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handleStatusUpdate}
              onError={() => {
                setIsPlaying(false);
                setVideoError('Unable to play this video. Tap to try again.');
              }}
              isMuted={false}
              useNativeControls={false}
            />
          ) : null}

          {isLandscape && (
            <Pressable style={styles.landscapeBack} onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </Pressable>
          )}

          {accessReady && videoUrl && !videoError && (
            <View style={styles.controls}>
              <Pressable
                style={styles.controlButton}
                onPress={() => seekTo(positionMillis / 1000 - 10)}
                disabled={!durationMillis}
                accessibilityLabel="Rewind 10 seconds"
              >
                <Ionicons name="play-back" size={20} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.controlButton}
                onPress={togglePlay}
                accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
              </Pressable>
              <Text style={styles.timeLabel}>{formatTime(positionMillis)}</Text>
              <Slider
                style={styles.seekSlider}
                minimumValue={0}
                maximumValue={durationMillis ? durationMillis / 1000 : 1}
                value={durationMillis ? positionMillis / 1000 : 0}
                disabled={!durationMillis}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#a9a9a9"
                thumbTintColor="#fff"
                onSlidingStart={() => setIsSeeking(true)}
                onValueChange={(seconds) => setPositionMillis(seconds * 1000)}
                onSlidingComplete={(seconds) => {
                  setIsSeeking(false);
                  seekTo(seconds);
                }}
              />
              <Text style={styles.timeLabel}>{formatTime(durationMillis)}</Text>
              <Pressable
                style={styles.controlButton}
                onPress={() => seekTo(positionMillis / 1000 + 10)}
                disabled={!durationMillis}
                accessibilityLabel="Forward 10 seconds"
              >
                <Ionicons name="play-forward" size={20} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.controlButton}
                onPress={toggleLandscape}
                accessibilityLabel={landscapeLocked ? 'Unlock screen rotation' : 'Lock landscape'}
              >
                <Ionicons
                  name={landscapeLocked ? 'phone-portrait-outline' : 'phone-landscape-outline'}
                  size={22}
                  color="#fff"
                />
              </Pressable>
            </View>
          )}
        </View>

        {!isLandscape && (
          <>
            {lesson?.description ? (
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionTitle}>About this video</Text>
                <Text style={styles.descriptionText}>{lesson.description}</Text>
              </View>
            ) : null}
            <FlatList
              data={upNext}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => handleOpenLesson(item)}>
                  <View style={styles.thumb}>
                    <Ionicons name="play-circle-outline" size={28} color={colors.navInactive} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                  </View>
                </Pressable>
              )}
            />
          </>
        )}
      </View>

      {!isLandscape && (
        <BottomNav
          active="Videos"
          onNavigate={(key) => {
            if (key === 'Home') navigation.navigate('Home');
            if (key === 'Videos') navigation.navigate('BatchList');
            if (key === 'Language') navigation.navigate('Vocabulary');
            if (key === 'Profile') navigation.navigate('Settings');
          }}
        />
      )}

      <Modal
        visible={Boolean(accessNotice)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAccessNotice(null)}
      >
        <View style={styles.noticeOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAccessNotice(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss access notice"
          />
          <View style={styles.noticeCard} accessibilityViewIsModal>
            <View style={styles.noticeIcon}>
              <Ionicons name="information-circle-outline" size={26} color={colors.homeOrange} />
            </View>
            <Text style={styles.noticeTitle}>Access notice</Text>
            <Text style={styles.noticeMessage}>{accessNotice}</Text>
            <Pressable
              style={styles.noticeButton}
              onPress={() => setAccessNotice(null)}
              accessibilityRole="button"
            >
              <Text style={styles.noticeButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  landscapeRoot: { backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  landscapeContainer: { paddingHorizontal: 0, paddingTop: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: { width: 36, alignItems: 'flex-start' },
  headerSpacer: { width: 36 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center' },
  playerCard: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 20,
    height: 280,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  landscapePlayerCard: { flex: 1, height: undefined, borderRadius: 0, backgroundColor: '#000' },
  descriptionCard: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  descriptionTitle: { ...typography.bodyBold, color: colors.textDark, marginBottom: 6 },
  descriptionText: { ...typography.small, color: colors.textLabel, lineHeight: 21 },
  videoSurface: { ...StyleSheetAbsoluteFill() },
  videoMessage: {
    ...StyleSheetAbsoluteFill(),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  videoMessageText: { ...typography.small, color: colors.textLabel, textAlign: 'center' },
  retryText: { ...typography.bodyBold, color: colors.accentRedAlt, marginTop: 8 },
  noticeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noticeCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
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
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.playerCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 58,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  controlButton: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  timeLabel: { color: '#fff', fontSize: 12, minWidth: 38, textAlign: 'center' },
  seekSlider: { flex: 1, height: 40, marginHorizontal: 4 },
  landscapeBack: {
    position: 'absolute',
    left: 12,
    top: 8,
    zIndex: 1,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 20,
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
});

// Small helper kept local so this file has no extra import surface for a one-liner.
function StyleSheetAbsoluteFill() {
  return { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
}
