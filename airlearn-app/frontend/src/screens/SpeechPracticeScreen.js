import React, { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';
import { assessPronunciation } from '../services/pronunciation';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import BottomNav from '../components/BottomNav';

export default function SpeechPracticeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { hasPrimeAccess } = usePayment();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const words = route?.params?.words?.length ? route.params.words : [];
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState({}); // { [index]: { pronunciation, fluency, tone } }
  const [isScoring, setIsScoring] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState('');
  const { transcript, setTranscript, isRecognizing, error, start, stop } = useSpeechRecognition();
  const pulse = useRef(new Animated.Value(1)).current;

  const word = words[index];
  const translation = language === 'tamil' ? word?.ta : word?.en;

  useEffect(() => {
    if (isRecognizing) {
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
  }, [isRecognizing]);

  const startRecording = () => {
    setPracticeMessage('');
    start('zh-CN').catch(() => {});
  };

  const stopRecordingAndScore = async () => {
    try {
      const attempt = await stop();
      if (!attempt.transcript) {
        setPracticeMessage('No speech was recognized. Hold the microphone and try again.');
        return;
      }
      setIsScoring(true);
      const score = await assessPronunciation(attempt.uri, word);
      setResults((prev) => ({ ...prev, [index]: score }));
    } catch (err) {
      setPracticeMessage(err.message || 'Could not process your speech. Please try again.');
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
    if (!hasPrimeAccess()) {
      if (!results[index]) {
        setPracticeMessage('Record and finish practicing this word before continuing.');
        return;
      }
      redirectToPaywall(navigation, route);
      return;
    }
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
        <BottomNav
          active="Language"
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
              style={[styles.micCircle, isRecognizing && styles.micCircleRecording]}
              onPressIn={startRecording}
              onPressOut={stopRecordingAndScore}
              disabled={isScoring}
            >
              <Ionicons name="mic" size={32} color={isRecognizing ? colors.homeOrangeLight : '#fff'} />
            </Pressable>
          </Animated.View>
          <Text style={styles.micLabel}>
            {isScoring ? 'Scoring...' : isRecognizing ? 'Listening...' : 'Hold and Speak'}
          </Text>
          <TextInput
            style={styles.transcriptInput}
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Your recognized speech will appear here"
            placeholderTextColor={colors.textLabel}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Recognized speech"
          />
          {!!(practiceMessage || error) && (
            <Text style={styles.errorText}>{practiceMessage || error}</Text>
          )}
          {results[index] && !isRecognizing && !isScoring && (
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

      <BottomNav
        active="Language"
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
  micSection: { alignItems: 'center', marginBottom: 24 },
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
  transcriptInput: {
    width: '100%',
    minHeight: 76,
    maxHeight: 112,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
    color: colors.textDark,
    backgroundColor: colors.card,
    fontSize: 15,
  },
  errorText: { color: colors.failRed, textAlign: 'center', fontSize: 13, marginTop: 8 },
  scoreHint: { fontSize: 13, color: colors.textLabel, marginTop: 8 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  controlItem: { alignItems: 'center', gap: 4 },
  controlDisabled: { opacity: 0.35 },
  controlLabel: { fontSize: 13, color: colors.strokeAccent, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
