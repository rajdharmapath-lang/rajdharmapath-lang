import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import QuizOption from './QuizOption';
import { ChineseStrokeWriter } from '../vendor/chinese-stroke-rn/src';
import { findWordById } from '../data/vocabulary';
import { openChineseVoiceInstaller, playWordAudio } from '../services/audio';
import { assessPronunciation } from '../services/pronunciation';
import { shuffleArray } from '../utils/shuffle';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ADVANCE_DELAY = 900;
const SPEECH_PASS_THRESHOLD = 60;

function DraggableNumberOption({ option, onDrop, disabled }) {
  const translation = useRef(new Animated.ValueXY()).current;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !disabled && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
      onPanResponderMove: Animated.event(
        [null, { dx: translation.x, dy: translation.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        onDropRef.current(option, gesture.moveX, gesture.moveY);
        translation.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminate: () => translation.setValue({ x: 0, y: 0 }),
    })
  ).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.dragOption,
        disabled && styles.dragOptionDisabled,
        { transform: translation.getTranslateTransform() },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Drag ${option.label}. ${option.hanzi}, ${option.pinyin}`}
    >
      <Text style={styles.dragOptionLetter}>{option.label}.</Text>
      <Text style={styles.dragOptionHanzi}>{option.hanzi}</Text>
      <Text style={styles.dragOptionPinyin}>{option.pinyin}</Text>
    </Animated.View>
  );
}

export default function QuizQuestionRenderer({ question, language, onAnswered, onAnswerPending }) {
  // --- shared / MCQ state (vocabulary, image, listening) -------------------
  const [selectedId, setSelectedId] = useState(null);
  const [numberAnswer, setNumberAnswer] = useState('');
  const answerSubmittedRef = useRef(false);
  const answerTimerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [selectedBlankOptionIds, setSelectedBlankOptionIds] = useState([]);
  const [sentencePairResult, setSentencePairResult] = useState(null);
  const [dragDropAnswers, setDragDropAnswers] = useState([]);
  const dragDropAnswersRef = useRef([]);
  const dragDropTargetsRef = useRef([]);
  const dragDropTargetNodesRef = useRef([]);
  const [selectedNumberMatch, setSelectedNumberMatch] = useState(null);
  const [numberMatches, setNumberMatches] = useState([]);

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
    question.type === 'sentence' ||
    question.type === 'meaningChoice' ||
    question.type === 'spokenNumberChoice';

  const word = question.wordId ? findWordById(question.wordId) : null;

  const localizedQuestion = () =>
    language === 'tamil'
      ? question.promptTamil || question.pathTitle
      : question.promptEnglish || question.pathTitle;

  const getOptionLabel = (option) => {
    if (!option) return '';
    if (question.type === 'meaningChoice') {
      return language === 'tamil' ? option.labelTamil : option.labelEnglish;
    }
    if (question.type === 'spokenNumberChoice') return option.digit;
    if (question.type === 'sentence') return `${option.hanzi} · ${option.pinyin}`;
    return language === 'tamil' ? option.ta : option.en;
  };

  const queueAnswer = (isCorrect, review) => {
    onAnswerPending?.(true);
    answerTimerRef.current = setTimeout(() => {
      answerTimerRef.current = null;
      onAnswerPending?.(false);
      onAnswered(isCorrect, review);
    }, ADVANCE_DELAY);
  };

  useEffect(
    () => () => {
      if (answerTimerRef.current) clearTimeout(answerTimerRef.current);
    },
    []
  );

  const shuffledOptions = useMemo(() => {
    if (!isMcq) return [];
    if (question.type === 'sentence') return shuffleArray(question.options || []);
    if (question.type === 'meaningChoice' || question.type === 'spokenNumberChoice') {
      return question.options || [];
    }
    if (!question.optionWordIds) return [];
    return shuffleArray(question.optionWordIds).map((id) => findWordById(id)).filter(Boolean);
  }, [question.id]);

  const correctWordId =
    question.correctOptionId || question.optionWordIds?.[0] || question.options?.[0]?.id;

  const handleSelectOption = (optionWord) => {
    if (selectedId) return; // already answered
    setSelectedId(optionWord.id);
    const correct = optionWord.id === correctWordId;
    const correctOption = shuffledOptions.find((option) => option.id === correctWordId);
    queueAnswer(correct, {
      question: localizedQuestion(),
      userAnswer: getOptionLabel(optionWord),
      correctAnswer: getOptionLabel(correctOption),
    });
  };

  const handleSubmitNumber = (value = numberAnswer) => {
    if (answerSubmittedRef.current || !value.trim()) return;
    answerSubmittedRef.current = true;
    setSelectedId('submitted');
    queueAnswer(Number(value.trim()) === Number(question.answer), {
      question: localizedQuestion(),
      userAnswer: value.trim(),
      correctAnswer: question.answer,
    });
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

  const handleDropNumberOption = (option, x, y) => {
    if (answerSubmittedRef.current) return;
    const blankIndex = dragDropTargetsRef.current.findIndex(
      (target) =>
        target &&
        x >= target.x - 32 &&
        x <= target.x + target.width + 32 &&
        y >= target.y - 28 &&
        y <= target.y + target.height + 28
    );
    if (blankIndex < 0) return;

    const nextAnswers = [...dragDropAnswersRef.current];
    nextAnswers[blankIndex] = option.id;
    dragDropAnswersRef.current = nextAnswers;
    setDragDropAnswers(nextAnswers);

    if (question.correctOptionIds.every((_, index) => nextAnswers[index])) {
      answerSubmittedRef.current = true;
      const isCorrect = question.correctOptionIds.every(
        (correctId, index) => nextAnswers[index] === correctId
      );
      const labelFor = (optionId) => {
        const answerOption = question.options.find((item) => item.id === optionId);
        return answerOption
          ? `${answerOption.label}. ${answerOption.hanzi} (${answerOption.pinyin})`
          : '';
      };
      queueAnswer(isCorrect, {
        question: localizedQuestion(),
        userAnswer: nextAnswers.map(labelFor).join('; '),
        correctAnswer: question.correctOptionIds.map(labelFor).join('; '),
      });
    }
  };

  const numberMatchPairs = useMemo(
    () => (question.type === 'numberMatching' ? question.pairs || [] : []),
    [question.id]
  );
  const shuffledChineseNumbers = useMemo(
    () => shuffleArray(numberMatchPairs),
    [numberMatchPairs]
  );
  const shuffledDigits = useMemo(
    () => shuffleArray(numberMatchPairs),
    [numberMatchPairs]
  );

  const handleNumberMatchSelect = (side, pair) => {
    if (answerSubmittedRef.current) return;
    const existingMatchIndex = numberMatches.findIndex((match) =>
      side === 'chinese' ? match.chineseId === pair.id : match.digitId === pair.id
    );
    if (existingMatchIndex >= 0) {
      setNumberMatches((matches) => matches.filter((_, index) => index !== existingMatchIndex));
      setSelectedNumberMatch({ side, id: pair.id });
      return;
    }

    if (!selectedNumberMatch || selectedNumberMatch.side === side) {
      setSelectedNumberMatch(
        selectedNumberMatch?.side === side && selectedNumberMatch.id === pair.id
          ? null
          : { side, id: pair.id }
      );
      return;
    }

    const nextMatch =
      side === 'chinese'
        ? { chineseId: pair.id, digitId: selectedNumberMatch.id }
        : { chineseId: selectedNumberMatch.id, digitId: pair.id };
    const nextMatches = [...numberMatches, nextMatch];
    setNumberMatches(nextMatches);
    setSelectedNumberMatch(null);

    if (nextMatches.length === numberMatchPairs.length) {
      answerSubmittedRef.current = true;
      const isCorrect = nextMatches.every((match) => match.chineseId === match.digitId);
      const pairLabel = (id) => {
        const matchedPair = numberMatchPairs.find((item) => item.id === id);
        return `${matchedPair.hanzi} (${matchedPair.pinyin}) — ${matchedPair.digit}`;
      };
      queueAnswer(isCorrect, {
        question: localizedQuestion(),
        userAnswer: nextMatches.map((match) => pairLabel(match.chineseId)).join('; '),
        correctAnswer: numberMatchPairs.map((item) => pairLabel(item.id)).join('; '),
      });
    }
  };

  const optionState = (optionWord) => {
    if (!selectedId) return 'idle';
    if (optionWord.id === correctWordId) return selectedId === optionWord.id ? 'correct' : 'reveal';
    return optionWord.id === selectedId ? 'wrong' : 'idle';
  };

  const handleToggleListen = async () => {
    const audioWord = word || (question.character ? { hanzi: question.character } : null);
    if (!audioWord) return;
    setIsPlaying(true);
    try {
      await playWordAudio(audioWord);
    } catch (error) {
      console.warn('Quiz pronunciation failed:', error);
      const buttons = [{ text: 'Cancel', style: 'cancel' }];
      if (Platform.OS === 'android') {
        buttons.push({
          text: 'Install Chinese voice',
          onPress: () => openChineseVoiceInstaller().catch((installError) => {
            console.warn('Could not open Chinese voice settings:', installError);
            Alert.alert(
              'Could not open settings',
              installError.message || 'Open Text-to-speech settings on your device.'
            );
          }),
        });
      }
      Alert.alert('Could not play pronunciation', error.message || 'Please try again.', buttons);
    } finally {
      setIsPlaying(false);
    }
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

  if (question.type === 'dragDropBlanks') {
    const prompt = language === 'tamil' ? question.promptTamil : question.promptEnglish;
    const segments = prompt.split(/_{1,}/);
    const renderedOption = (index) =>
      question.options.find((option) => option.id === dragDropAnswers[index]);
    const dropTarget = (index) => (
      <View
        key={`drop-${index}`}
        ref={(ref) => {
          dragDropTargetNodesRef.current[index] = ref;
        }}
        onLayout={() => {
          dragDropTargetNodesRef.current[index]?.measureInWindow((x, y, width, height) => {
            dragDropTargetsRef.current[index] = { x, y, width, height };
          });
        }}
        style={[styles.numberDropTarget, dragDropAnswers[index] && styles.numberDropTargetFilled]}
        accessibilityRole="text"
        accessibilityLabel={`Blank ${index + 1}${renderedOption(index) ? `: ${renderedOption(index).hanzi}` : ''}`}
      >
        <Text style={styles.numberDropTargetText}>
          {renderedOption(index)?.hanzi || '___'}
        </Text>
      </View>
    );
    return (
      <View style={styles.dragDropContainer}>
        <Text style={styles.prompt}>
          {language === 'tamil'
            ? 'சரியான பதிலை காலியிடத்தில் இழுத்து விடுங்கள்'
            : 'Drag each answer into the matching blank'}
        </Text>
        <View style={styles.sumPrompt}>
          <View style={styles.sumLine}>
            {segments.map((segment, index) => (
              <React.Fragment key={`segment-${index}`}>
                <Text style={styles.sumPromptText}>{segment}</Text>
                {index < segments.length - 1 && dropTarget(index)}
              </React.Fragment>
            ))}
          </View>
        </View>
        <View style={styles.dragOptions}>
          {question.options.map((option) => (
            <DraggableNumberOption
              key={option.id}
              option={option}
              onDrop={handleDropNumberOption}
              disabled={answerSubmittedRef.current}
            />
          ))}
        </View>
      </View>
    );
  }

  if (question.type === 'numberMatching') {
    const isTamil = language === 'tamil';
    const matchFor = (side, id) =>
      numberMatches.find((match) => (side === 'chinese' ? match.chineseId : match.digitId) === id);
    const isMatchCorrect = (match) => match?.chineseId === match?.digitId;
    const renderChoice = (side, pair) => {
      const match = matchFor(side, pair.id);
      const isSelected = selectedNumberMatch?.side === side && selectedNumberMatch.id === pair.id;
      return (
        <Pressable
          key={`${side}-${pair.id}`}
          style={[
            styles.numberMatchChoice,
            isSelected && styles.numberMatchChoiceSelected,
            match && (isMatchCorrect(match) ? styles.numberMatchChoiceCorrect : styles.numberMatchChoiceWrong),
          ]}
          onPress={() => handleNumberMatchSelect(side, pair)}
          disabled={answerSubmittedRef.current}
          accessibilityRole="button"
          accessibilityLabel={side === 'chinese' ? `${pair.hanzi}, ${pair.pinyin}` : pair.digit}
        >
          {side === 'chinese' ? (
            <>
              <Text style={styles.numberMatchHanzi}>{pair.hanzi}</Text>
              <Text style={styles.numberMatchPinyin}>{pair.pinyin}</Text>
            </>
          ) : (
            <Text style={styles.numberMatchDigit}>{pair.digit}</Text>
          )}
        </Pressable>
      );
    };

    return (
      <View style={styles.numberMatchingContainer}>
        <Text style={styles.prompt}>{localizedQuestion()}</Text>
        <View style={styles.numberMatchingColumns}>
          <View style={styles.numberMatchingColumn}>
            <Text style={styles.numberMatchingHeading}>
              {isTamil ? question.chineseHeadingTamil : question.chineseHeadingEnglish}
            </Text>
            {shuffledChineseNumbers.map((pair) => renderChoice('chinese', pair))}
          </View>
          <View style={styles.numberMatchingColumn}>
            <Text style={styles.numberMatchingHeading}>
              {isTamil ? question.digitHeadingTamil : question.digitHeadingEnglish}
            </Text>
            {shuffledDigits.map((pair) => renderChoice('digit', pair))}
          </View>
        </View>
        <Text style={styles.numberMatchingHint}>
          {isTamil
            ? 'ஒரு சீன எண்ணையும் அதற்குரிய எண்ணையும் தேர்ந்தெடுக்கவும். எந்தப் பக்கத்திலிருந்தும் தொடங்கலாம்.'
            : 'Select a Chinese number and its matching digit. You can start from either side.'}
        </Text>
      </View>
    );
  }

  if (question.type === 'numberInput') {
    return (
      <View style={styles.numberQuestion}>
        <Text style={styles.prompt}>
          {language === 'tamil' ? question.promptTamil : question.promptEnglish}
        </Text>
        <Text style={styles.numberCharacterLine}>
          {question.character} ({question.pinyin})
        </Text>
        <TextInput
          style={styles.numberInput}
          value={numberAnswer}
          onChangeText={(value) => {
            setNumberAnswer(value);
            if (
              /^\d+$/.test(value) &&
              value.trim().length >= String(question.answer).length
            ) {
              handleSubmitNumber(value);
            }
          }}
          placeholder={language === 'tamil' ? question.placeholderTamil : question.placeholder}
          placeholderTextColor={colors.textLabel}
          keyboardType="number-pad"
          returnKeyType="done"
          onSubmitEditing={handleSubmitNumber}
          maxLength={String(question.answer).length}
          editable={!selectedId}
          accessibilityLabel="Enter the number"
        />
      </View>
    );
  }

  if (isMcq) {
    return (
      <View>
        {question.type === 'meaningChoice' && (
          <>
            <Text style={styles.prompt}>{localizedQuestion()}</Text>
            {question.character && (
              <Text style={styles.numberCharacterLine}>
                {question.character} ({question.pinyin})
              </Text>
            )}
          </>
        )}
        {question.type === 'spokenNumberChoice' && (
          <>
            <Text style={styles.prompt}>{localizedQuestion()}</Text>
            <Pressable
              style={styles.spokenNumberAudioButton}
              onPress={handleToggleListen}
              accessibilityRole="button"
              accessibilityLabel={language === 'tamil' ? 'சீன எண்ணின் ஒலியைக் கேளுங்கள்' : 'Play Chinese number pronunciation'}
            >
              <Ionicons
                name={isPlaying ? 'volume-high' : 'volume-medium'}
                size={34}
                color={colors.accentRedAlt}
              />
            </Pressable>
          </>
        )}
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
              label={
                question.type === 'meaningChoice'
                  ? getOptionLabel(optionWord)
                  : question.type === 'sentence'
                    ? `${optionWord.hanzi} · ${optionWord.pinyin}`
                    : question.type === 'spokenNumberChoice'
                      ? getOptionLabel(optionWord)
                      : language === 'tamil' ? optionWord.ta : optionWord.en
              }
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
  numberQuestion: { alignItems: 'stretch' },
  numberCharacterLine: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 24,
  },
  spokenNumberAudioButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  numberInput: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.textDark,
    textAlign: 'center',
  },
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
  dragDropContainer: { paddingBottom: 24 },
  sumPrompt: {
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 24,
    marginBottom: 24,
  },
  sumPromptText: {
    fontSize: 19,
    lineHeight: 38,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  sumLine: {
    minHeight: 58,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberDropTarget: {
    minWidth: 52,
    paddingHorizontal: 8,
    minHeight: 48,
    borderBottomWidth: 2,
    borderColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  numberDropTargetFilled: {
    backgroundColor: colors.card,
    borderRadius: 6,
    borderColor: colors.primary,
  },
  numberDropTargetText: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.accentRedAlt,
    textAlign: 'center',
  },
  dragOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  dragOption: {
    width: '47%',
    minHeight: 84,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 2,
  },
  dragOptionDisabled: { opacity: 0.6 },
  dragOptionLetter: { fontSize: 14, fontWeight: '700', color: colors.textLabel },
  dragOptionHanzi: { fontSize: 23, fontWeight: '700', color: colors.textDark },
  dragOptionPinyin: { fontSize: 13, color: colors.textLabel },
  numberMatchingContainer: { paddingBottom: 24 },
  numberMatchingColumns: { flexDirection: 'row', gap: 14, marginTop: 8 },
  numberMatchingColumn: { flex: 1, alignItems: 'stretch', gap: 12 },
  numberMatchingHeading: {
    minHeight: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.accentRedAlt,
  },
  numberMatchChoice: {
    minHeight: 72,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberMatchChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.homeOrangeBg },
  numberMatchChoiceCorrect: { borderColor: colors.successGreen, backgroundColor: colors.homeOrangeBg },
  numberMatchChoiceWrong: { borderColor: colors.failRed },
  numberMatchHanzi: { fontSize: 25, fontWeight: '700', color: colors.textDark },
  numberMatchPinyin: { fontSize: 13, color: colors.textLabel, marginTop: 2 },
  numberMatchDigit: { fontSize: 25, fontWeight: '700', color: colors.textDark },
  numberMatchingHint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 18,
  },
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
