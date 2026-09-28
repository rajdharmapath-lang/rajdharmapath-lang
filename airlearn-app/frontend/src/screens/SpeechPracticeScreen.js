import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { useAuth } from '../context/AuthContext';
import { assessPronunciation } from '../services/pronunciation';

export default function SpeechPracticeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const words = route?.params?.words?.length ? route.params.words : [];
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({}); // { [index]: { pronunciation, fluency, tone } }
  const [isRecording, setIsRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const recordingRef = useRef(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const word = words[index];
  const translation = language === 'tamil' ? word?.ta : word?.en;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Microphone permission needed', 'Enable microphone access to practice speaking.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Could not start recording', err.message);
    }
  };

  const stopRecordingAndScore = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsScoring(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      const score = await assessPronunciation(uri, word);
      setResults((prev) => ({ ...prev, [index]: score }));
    } catch (err) {
      Alert.alert('Could not score your attempt', err.message);
    } finally {
      setIsScoring(false);
    }
  };

  const goToResults = () => {
    navigation.navigate('SpeechResult', {
      categoryId: route?.params?.categoryId,
      words,
      results,
    });
  };

  const handleNext = () => {
    if (index < words.length - 1) {
      setIndex(index + 1);
    } else {
      goToResults();
    }
  };

  const handlePrevious = () => {
    if (index > 0) setIndex(index - 1);
  };

  if (!word) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>No words to practice.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>

        <Text style={styles.title}>Speak this sentence</Text>

        <View style={styles.content}>
          <Text style={styles.hanzi}>{word.hanzi}</Text>
          <Text style={styles.pinyin}>{word.pinyin}</Text>
          <Text style={styles.translation}>{translation}</Text>
        </View>

        <View style={styles.micSection}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Pressable
              style={[styles.micCircle, isRecording && styles.micCircleRecording]}
              onPressIn={startRecording}
              onPressOut={stopRecordingAndScore}
              disabled={isScoring}
            >
              <Ionicons name="mic" size={32} color={isRecording ? colors.homeOrangeLight : '#fff'} />
            </Pressable>
          </Animated.View>
          <Text style={styles.micLabel}>
            {isScoring ? 'Scoring...' : isRecording ? 'Listening...' : 'Hold and Speak'}
          </Text>
          {results[index] && !isRecording && !isScoring && (
            <Text style={styles.scoreHint}>
              Last attempt: {Math.round((results[index].pronunciation + results[index].fluency + results[index].tone) / 3)}%
            </Text>
          )}
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            style={[styles.controlItem, index === 0 && styles.controlDisabled]}
            onPress={handlePrevious}
            disabled={index === 0}
          >
            <Ionicons name="arrow-back-circle-outline" size={26} color={colors.strokeAccent} />
            <Text style={styles.controlLabel}>Previous</Text>
          </Pressable>

          <Pressable style={styles.controlItem} onPress={handleNext}>
            <Ionicons name="arrow-forward-circle-outline" size={26} color={colors.strokeAccent} />
            <Text style={styles.controlLabel}>Next</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: {
    ...typography.h2,
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginTop: -32,
    marginBottom: 30,
  },
  content: { alignItems: 'center', marginBottom: 40 },
  hanzi: { fontSize: 42, color: colors.textDark, marginBottom: 16 },
  pinyin: { fontSize: 22, color: colors.textDark, marginBottom: 8 },
  translation: { fontSize: 20, color: colors.textDark },
  micSection: { alignItems: 'center', marginBottom: 50 },
  micCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  micCircleRecording: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.homeOrangeLight,
  },
  micLabel: { fontSize: 16, color: colors.textDark },
  scoreHint: { fontSize: 13, color: colors.textLabel, marginTop: 8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  controlItem: { alignItems: 'center', gap: 4 },
  controlDisabled: { opacity: 0.35 },
  controlLabel: { fontSize: 13, color: colors.strokeAccent, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
