import React, { useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { lessonsByBatch } from '../data/courses';
import { useProgress } from '../context/ProgressContext';
import { usePayment } from '../context/PaymentContext';
import { useAccessGate } from '../utils/paywall';

export default function VideoPlayerScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { recordVideoCompleted } = useProgress();
  const { hasBatchAccess } = usePayment();
  const { batchId = 'foundation', lessonId } = route?.params || {};
  const lessons = lessonsByBatch[batchId] || [];
  const currentIndex = Math.max(0, lessons.findIndex((l) => l.id === lessonId));
  const lesson = lessons[currentIndex] || lessons[0];
  const upNext = lessons.filter((_, i) => i !== currentIndex);

  useAccessGate(navigation, route, hasBatchAccess(batchId), batchId);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStatusUpdate = (status) => {
    if (status.isLoaded && status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }
    if (status.didJustFinish) {
      setIsPlaying(false);
      if (lesson) recordVideoCompleted(lesson.id);
    }
  };

  const handleOpenLesson = (target) => {
    navigation.push('VideoPlayer', { batchId, lessonId: target.id });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Lesson {currentIndex + 1}</Text>

        <View style={styles.playerCard}>
          {lesson?.videoUrl ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: lesson.videoUrl }}
                style={styles.videoSurface}
                resizeMode={ResizeMode.COVER}
                onPlaybackStatusUpdate={handleStatusUpdate}
                useNativeControls={false}
              />
              {!isPlaying && (
                <Pressable style={styles.playOverlay} onPress={togglePlay}>
                  <View style={styles.playCircle}>
                    <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 3 }} />
                  </View>
                </Pressable>
              )}
            </>
          ) : (
            <Pressable style={styles.playOverlay} onPress={togglePlay}>
              <View style={styles.playCircle}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" style={!isPlaying && { marginLeft: 3 }} />
              </View>
            </Pressable>
          )}

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 1) * 100}%` }]} />
          </View>
        </View>

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
      </View>

      <BottomNav
        active="Videos"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 16 },
  playerCard: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 20,
    height: 220,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  videoSurface: { ...StyleSheetAbsoluteFill() },
  playOverlay: {
    ...StyleSheetAbsoluteFill(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.playerCircle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F3D9D6',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.playerCircle,
    borderRadius: 2,
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
