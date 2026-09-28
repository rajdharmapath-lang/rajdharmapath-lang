import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import QuizOption from './QuizOption';
import { ChineseStrokeWriter } from '../vendor/chinese-stroke-rn/src';
import { findWordById } from '../data/vocabulary';
import { playWordAudio } from '../services/audio';
import { assessPronunciation } from '../services/pronunciation';
import { shuffleArray } from '../utils/shuffle';

const ADVANCE_DELAY = 900;
const SPEECH_PASS_THRESHOLD = 60;

export default function QuizQuestionRenderer({ question, language, onAnswered }) {
  // --- shared / MCQ state (vocabulary, image, listening) -------------------
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- speech state ----------------------------------------------------------
  const [isRecording, setIsRecording] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const recordingRef = useRef(null);

  const isMcq = question.type === 'vocabulary' || question.type === 'image' || question.type === 'listening';

  const word = question.wordId ? findWordById(question.wordId) : null;

  const shuffledOptions = useMemo(() => {
    if (!isMcq || !question.optionWordIds) return [];
    return shuffleArray(question.optionWordIds).map((id) => findWordById(id)).filter(Boolean);
  }, [question.id]);

  const correctWordId = question.optionWordIds?.[0];

  const handleSelectOption = (optionWord) => {
    if (selectedId) return; // already answered
    setSelectedId(optionWord.id);
    const correct = optionWord.id === correctWordId;
    setTimeout(() => onAnswered(correct), ADVANCE_DELAY);
  };

  const optionState = (optionWord) => {
    if (!selectedId) return 'idle';
    if (optionWord.id === correctWordId) return selectedId === optionWord.id ? 'correct' : 'reveal';
    return optionWord.id === selectedId ? 'wrong' : 'idle';
  };

  const handleToggleListen = () => {
    if (!word) return;
    setIsPlaying(true);
    playWordAudio(word);
    // expo-speech has no reliable finish callback wired here; assume a short
    // utterance and flip the icon back after a beat so it reads as "playing".
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      // Permission or hardware issue — fail silently into idle state; the
      // question simply stays unanswered until the user tries again.
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
      const avg = (score.pronunciation + score.fluency + score.tone) / 3;
      setTimeout(() => onAnswered(avg >= SPEECH_PASS_THRESHOLD), ADVANCE_DELAY);
    } catch (e) {
      setTimeout(() => onAnswered(false), ADVANCE_DELAY);
    } finally {
      setIsScoring(false);
    }
  };

  const handleStrokeComplete = () => {
    setTimeout(() => onAnswered(true), ADVANCE_DELAY);
  };

  if (isMcq) {
    return (
      <View>
        {question.type === 'vocabulary' && (
          <>
            <Text style={styles.prompt}>What does this mean?</Text>
            <Text style={styles.hanziPrompt}>
              {word?.hanzi} - {word?.pinyin}
            </Text>
          </>
        )}
        {question.type === 'image' && (
          <>
            <Text style={styles.prompt}>What does this image mean?</Text>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color={colors.strokeAccent} />
            </View>
          </>
        )}
        {question.type === 'listening' && (
          <>
            <Text style={styles.prompt}>Listen</Text>
            <Pressable style={styles.listenCircle} onPress={handleToggleListen}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color={colors.homeOrangeLight} />
            </Pressable>
          </>
        )}

        <View style={{ marginTop: 24 }}>
          {shuffledOptions.map((optionWord, i) => (
            <QuizOption
              key={optionWord.id}
              index={i}
              label={language === 'tamil' ? optionWord.ta : optionWord.en}
              state={optionState(optionWord)}
              disabled={!!selectedId}
              onPress={() => handleSelectOption(optionWord)}
            />
          ))}
        </View>
      </View>
    );
  }

  if (question.type === 'speech') {
    return (
      <View style={styles.centered}>
        <Text style={styles.speechPinyin}>{word?.pinyin}</Text>
        <Pressable
          style={[styles.micCircle, isRecording && styles.micCircleRecording]}
          onPressIn={startRecording}
          onPressOut={stopRecordingAndScore}
          disabled={isScoring}
        >
          <Ionicons name="mic" size={32} color={isRecording ? colors.homeOrangeLight : '#fff'} />
        </Pressable>
        <Text style={styles.micLabel}>
          {isScoring ? 'Scoring...' : isRecording ? 'Listening...' : 'Hold and Speak'}
        </Text>
      </View>
    );
  }

  if (question.type === 'stroke') {
    return (
      <View style={styles.centered}>
        <View style={styles.strokeBox}>
          <ChineseStrokeWriter
            character={question.character}
            mode="trace"
            size={260}
            showOutline
            showGuide
            onComplete={handleStrokeComplete}
            onError={(message) => console.warn('Quiz stroke question failed to render:', message)}
            theme={{
              background: colors.background,
              guide: colors.strokeTrackLight,
              outline: colors.navInactive,
              stroke: colors.textDark,
              highlight: colors.strokeAccent,
              drawing: colors.primary,
            }}
          />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  prompt: { fontSize: 22, color: colors.textDark, textAlign: 'center', marginBottom: 20 },
  hanziPrompt: { fontSize: 32, color: colors.textDark, textAlign: 'center', marginBottom: 8 },
  imagePlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 20,
    backgroundColor: colors.homeOrangeBgAlt,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.homeOrangeLight,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { alignItems: 'center', paddingTop: 40 },
  speechPinyin: { fontSize: 30, color: colors.textDark, marginBottom: 60 },
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
  strokeBox: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 16,
    padding: 10,
  },
});
