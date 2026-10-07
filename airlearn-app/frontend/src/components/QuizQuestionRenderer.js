import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import QuizOption from './QuizOption';
import { ChineseStrokeWriter } from '../vendor/chinese-stroke-rn/src';
import { findWordById } from '../data/vocabulary';
import { playWordAudio } from '../services/audio';
import { assessPronunciation } from '../services/pronunciation';
import { shuffleArray } from '../utils/shuffle';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ADVANCE_DELAY = 900;
const SPEECH_PASS_THRESHOLD = 60;

export default function QuizQuestionRenderer({ question, language, onAnswered, onAnswerPending }) {
  // --- shared / MCQ state (vocabulary, image, listening) -------------------
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [selectedBlankOptionIds, setSelectedBlankOptionIds] = useState([]);
  const [sentencePairResult, setSentencePairResult] = useState(null);

  // --- speech state ----------------------------------------------------------
  const [isScoring, setIsScoring] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const {
    transcript,
    setTranscript,
    isRecognizing,
    error: recognitionError,
    start,
    stop,
  } = useSpeechRecognition();

  const isMcq =
    question.type === 'vocabulary' ||
    question.type === 'image' ||
    question.type === 'listening' ||
    question.type === 'sentence';

  const word = question.wordId ? findWordById(question.wordId) : null;

  const queueAnswer = (isCorrect) => {
    onAnswerPending?.(true);
    setTimeout(() => {
      onAnswerPending?.(false);
      onAnswered(isCorrect);
    }, ADVANCE_DELAY);
  };

  const shuffledOptions = useMemo(() => {
    if (!isMcq) return [];
    if (question.type === 'sentence') return shuffleArray(question.options || []);
    if (!question.optionWordIds) return [];
    return shuffleArray(question.optionWordIds).map((id) => findWordById(id)).filter(Boolean);
  }, [question.id]);

  const correctWordId = question.optionWordIds?.[0] || question.options?.[0]?.id;

  const handleSelectOption = (optionWord) => {
    if (selectedId) return; // already answered
    setSelectedId(optionWord.id);
    const correct = optionWord.id === correctWordId;
    queueAnswer(correct);
  };

  const handleSelectSentenceOption = (option) => {
    if (sentencePairResult !== null) return;
    setSelectedBlankOptionIds((previous) => {
      const next = [...previous];
      next[activeBlankIndex] = option.id;
      return next;
    });
    if (activeBlankIndex < question.blanks.length - 1) {
      setActiveBlankIndex(activeBlankIndex + 1);
    }
  };

  const handleCheckSentencePair = () => {
    if (sentencePairResult !== null || selectedBlankOptionIds.length !== question.blanks.length) return;
    const isCorrect = question.blanks.every(
      (blank, index) => selectedBlankOptionIds[index] === blank.correctOptionId
    );
    setSentencePairResult(isCorrect);
    queueAnswer(isCorrect);
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

  const startRecording = () => {
    onAnswerPending?.(true);
    setSpeechError('');
    start('zh-CN').catch(() => {
      onAnswerPending?.(false);
    });
  };

  const stopRecordingAndScore = async () => {
    try {
      const attempt = await stop();
      if (!attempt.transcript) {
        setSpeechError('No speech was recognized. Hold the microphone and try again.');
        onAnswerPending?.(false);
        return;
      }
      setIsScoring(true);
      const score = await assessPronunciation(attempt.uri, word);
      const avg = (score.pronunciation + score.fluency + score.tone) / 3;
      queueAnswer(avg >= SPEECH_PASS_THRESHOLD);
    } catch (e) {
      setSpeechError(e.message || 'Could not process your speech. Please try again.');
      onAnswerPending?.(false);
    } finally {
      setIsScoring(false);
    }
  };

  const handleStrokeComplete = () => {
    queueAnswer(true);
  };

  if (question.type === 'sentencePair') {
    const selectedOptions = question.blanks.map((blank, index) =>
      blank.options.find((option) => option.id === selectedBlankOptionIds[index])
    );
    const correctOptions = question.blanks.map((blank) =>
      blank.options.find((option) => option.id === blank.correctOptionId)
    );
    const activeBlank = question.blanks[activeBlankIndex];
    const activeChoices = activeBlank?.options || [];
    const canCheck = selectedOptions.every(Boolean);
    const correctSentence = question.sentenceParts
      .map((part, index) => `${part}${correctOptions[index]?.hanzi || ''}`)
      .join('');
    const correctPinyin = question.pinyinParts
      .map((part, index) => `${part}${correctOptions[index]?.pinyin || ''}`)
      .join('');

    return (
      <View style={styles.sentencePairContainer}>
        <Text style={styles.prompt}>Complete both blanks</Text>
        <View style={styles.sentenceCard}>
          <View style={styles.sentencePartsRow}>
            {question.sentenceParts.map((part, index) => (
              <React.Fragment key={`part-${index}`}>
                <Text style={styles.sentenceText}>{part}</Text>
                {index < question.blanks.length && (
                  <Pressable
                    style={[
                      styles.sentenceBlank,
                      activeBlankIndex === index && styles.sentenceBlankActive,
                      selectedOptions[index] && styles.sentenceBlankFilled,
                      sentencePairResult === true && styles.sentenceBlankCorrect,
                      sentencePairResult === false && styles.sentenceBlankWrong,
                    ]}
                    onPress={() => setActiveBlankIndex(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose word for blank ${index + 1}`}
                  >
                    <Text style={styles.sentenceBlankText}>
                      {selectedOptions[index]?.hanzi || '___'}
                    </Text>
                  </Pressable>
                )}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.sentencePinyin}>
            {question.pinyinParts.map((part, index) => (
              <React.Fragment key={`pinyin-${index}`}>
                {part}{selectedOptions[index]?.pinyin || '___'}
              </React.Fragment>
            ))}
          </Text>
          <Text style={styles.sentenceMeaning}>{question.meaning}</Text>
        </View>

        <View style={styles.blankTabs}>
          {question.blanks.map((blank, index) => (
            <Pressable
              key={blank.correctOptionId}
              style={[
                styles.blankTab,
                activeBlankIndex === index && styles.blankTabActive,
                selectedOptions[index] && styles.blankTabFilled,
              ]}
              onPress={() => setActiveBlankIndex(index)}
            >
              <Text style={styles.blankTabLabel}>Blank {index + 1}</Text>
              <Text style={styles.blankTabValue}>{selectedOptions[index]?.hanzi || 'Choose'}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.choosePrompt}>Choose a word for blank {activeBlankIndex + 1}</Text>
        <View style={styles.sentenceChoices}>
          {activeChoices.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.sentenceChoice,
                selectedBlankOptionIds[activeBlankIndex] === option.id && styles.sentenceChoiceSelected,
              ]}
              onPress={() => handleSelectSentenceOption(option)}
              disabled={sentencePairResult !== null}
            >
              <Text style={styles.sentenceChoiceHanzi}>{option.hanzi}</Text>
              <Text style={styles.sentenceChoicePinyin}>{option.pinyin}</Text>
            </Pressable>
          ))}
        </View>

        {sentencePairResult !== null && (
          <View>
            <Text style={[
              styles.sentenceFeedback,
              sentencePairResult ? styles.sentenceFeedbackCorrect : styles.sentenceFeedbackWrong,
            ]}>
              {sentencePairResult ? 'Great job!' : 'Not quite. Keep practicing!'}
            </Text>
            {!sentencePairResult && (
              <View style={styles.correctSentenceCard}>
                <Text style={styles.correctSentenceLabel}>Correct answer</Text>
                <Text style={styles.correctSentenceText}>{correctSentence}</Text>
                <Text style={styles.correctSentencePinyin}>{correctPinyin}</Text>
              </View>
            )}
          </View>
        )}

        <Pressable
          style={[styles.sentenceCheckButton, !canCheck && styles.sentenceCheckButtonDisabled]}
          onPress={handleCheckSentencePair}
          disabled={!canCheck || sentencePairResult !== null}
        >
          <Text style={styles.sentenceCheckText}>Check Answer</Text>
        </Pressable>
      </View>
    );
  }

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
        {question.type === 'sentence' && (
          <>
            <Text style={styles.prompt}>Complete the sentence</Text>
            <Text style={styles.sentencePrompt}>{question.sentence}</Text>
            <Text style={styles.sentencePinyin}>{question.pinyin}</Text>
            <Text style={styles.sentenceMeaning}>{question.meaning}</Text>
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
              label={question.type === 'sentence'
                ? `${optionWord.hanzi} · ${optionWord.pinyin}`
                : language === 'tamil' ? optionWord.ta : optionWord.en}
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
          style={[styles.micCircle, isRecognizing && styles.micCircleRecording]}
          onPressIn={startRecording}
          onPressOut={stopRecordingAndScore}
          disabled={isScoring}
        >
          <Ionicons name="mic" size={32} color={isRecognizing ? colors.homeOrangeLight : '#fff'} />
        </Pressable>
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
        {!!(speechError || recognitionError) && (
          <Text style={styles.speechError}>{speechError || recognitionError}</Text>
        )}
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
  sentencePrompt: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginBottom: 10,
  },
  sentencePinyin: { fontSize: 15, color: colors.textLabel, textAlign: 'center', marginBottom: 6 },
  sentenceMeaning: { fontSize: 14, color: colors.textLabel, textAlign: 'center' },
  sentencePairContainer: { paddingBottom: 24 },
  sentenceCard: {
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },
  sentencePartsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  sentenceText: { fontSize: 25, fontWeight: '700', color: colors.accentRedAlt },
  sentenceBlank: {
    minWidth: 48,
    minHeight: 42,
    borderBottomWidth: 2,
    borderColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  sentenceBlankActive: { borderColor: colors.primary, borderBottomWidth: 3 },
  sentenceBlankFilled: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 6 },
  sentenceBlankCorrect: { borderColor: colors.successGreen },
  sentenceBlankWrong: { borderColor: colors.failRed },
  sentenceBlankText: { fontSize: 22, fontWeight: '700', color: colors.textDark },
  sentencePinyin: { fontSize: 14, color: colors.textLabel, textAlign: 'center', marginTop: 12 },
  sentenceMeaning: { fontSize: 14, color: colors.textLabel, textAlign: 'center', marginTop: 6 },
  blankTabs: { flexDirection: 'row', gap: 10, marginTop: 18 },
  blankTab: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blankTabActive: { borderColor: colors.primary, backgroundColor: colors.homeOrangeBg },
  blankTabFilled: { borderColor: colors.homeOrangeLight },
  blankTabLabel: { fontSize: 11, color: colors.textLabel },
  blankTabValue: { fontSize: 16, fontWeight: '700', color: colors.accentRedAlt, marginTop: 3 },
  choosePrompt: { fontSize: 14, fontWeight: '700', color: colors.textDark, marginTop: 18, marginBottom: 10 },
  sentenceChoices: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  sentenceChoice: {
    width: '48%',
    minHeight: 66,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentenceChoiceSelected: { backgroundColor: colors.homeOrangeBg, borderColor: colors.primary },
  sentenceChoiceHanzi: { fontSize: 20, fontWeight: '700', color: colors.textDark },
  sentenceChoicePinyin: { fontSize: 12, color: colors.textLabel, marginTop: 2 },
  sentenceFeedback: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 14 },
  sentenceFeedbackCorrect: { color: colors.successGreen },
  sentenceFeedbackWrong: { color: colors.failRed },
  correctSentenceCard: {
    alignItems: 'center',
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  correctSentenceLabel: { fontSize: 11, fontWeight: '700', color: colors.textLabel, marginBottom: 4 },
  correctSentenceText: { fontSize: 19, fontWeight: '700', color: colors.accentRedAlt },
  correctSentencePinyin: { fontSize: 12, color: colors.textLabel, marginTop: 3 },
  sentenceCheckButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  sentenceCheckButtonDisabled: { opacity: 0.45 },
  sentenceCheckText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  speechError: { color: colors.failRed, textAlign: 'center', fontSize: 13, marginTop: 8 },
  strokeBox: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 16,
    padding: 10,
  },
});
