import React, { useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { ChineseStrokeWriter } from '../vendor/chinese-stroke-rn/src';
import { getCharacterMeta } from '../data/characterMeta';

export default function StrokePracticeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth, width } = useResponsive();
  const characters = route?.params?.characters?.length ? route.params.characters : ['学'];

  const [index, setIndex] = useState(0);
  // Per-character result, keyed by index: { mistakes, totalStrokes, completed }
  const [results, setResults] = useState({});

  const writerRef = useRef(null);
  const character = characters[index];
  const meta = getCharacterMeta(character);
  const canvasSize = Math.min(width - 80, 320);

  const currentResult = results[index] || { mistakes: 0, totalStrokes: 0, completed: false };

  const updateResult = (patch) => {
    setResults((prev) => ({
      ...prev,
      [index]: { ...(prev[index] || { mistakes: 0, totalStrokes: 0, completed: false }), ...patch },
    }));
  };

  const goToResults = (finalResults) => {
    navigation.navigate('StrokeResult', {
      characters,
      results: finalResults,
    });
  };

  const handleNext = () => {
    if (index < characters.length - 1) {
      setIndex(index + 1);
    } else {
      goToResults(results);
    }
  };

  const handlePrevious = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleReplay = () => {
    writerRef.current?.reset();
    updateResult({ mistakes: 0, completed: false });
    setTimeout(() => writerRef.current?.start(), 50);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>

        <Text style={styles.title}>Stroke Writing</Text>

        <View style={styles.infoBar}>
          <Text style={styles.infoHanzi}>{character}</Text>
          <Text style={styles.infoCaption}>
            {meta ? `${meta.pinyin} - ${meta.meaning}` : character}
          </Text>
        </View>

        <View style={[styles.practiceBox, { minHeight: canvasSize + 40 }]}>
          <ChineseStrokeWriter
            key={`${character}-${index}`}
            ref={writerRef}
            character={character}
            mode="trace"
            size={canvasSize}
            showOutline
            showGuide
            onReady={(totalStrokes) => updateResult({ totalStrokes })}
            onMistake={(e) => updateResult({ mistakes: e.mistakes })}
            onComplete={() => updateResult({ completed: true })}
            onError={(message) => {
              console.warn('Stroke practice failed to render:', message);
              Alert.alert('Stroke practice error (dev)', message);
            }}
            theme={{
              background: colors.homeOrangeBgAlt,
              guide: colors.strokeTrackLight,
              // Was strokeTrackLight here too — nearly the same color as the
              // background above, so the character outline you're supposed to
              // trace was barely visible even when rendering worked correctly.
              // A proper mid-gray gives real contrast against the cream background.
              outline: colors.navInactive,
              stroke: colors.textDark,
              highlight: colors.strokeAccent,
              drawing: colors.primary,
            }}
          />
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

          <Pressable style={styles.controlItem} onPress={handleReplay}>
            <Ionicons name="refresh" size={26} color={colors.strokeAccent} />
            <Text style={styles.controlLabel}>Replay</Text>
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: {
    ...typography.h2,
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginTop: -32,
    marginBottom: 20,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.homeOrangeBg,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 20,
  },
  infoHanzi: { fontSize: 24, color: colors.textDark },
  infoCaption: { fontSize: 15, color: colors.textDark, fontWeight: '500' },
  practiceBox: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 24,
  },
  controlItem: { alignItems: 'center', gap: 4 },
  controlDisabled: { opacity: 0.35 },
  controlLabel: { fontSize: 13, color: colors.strokeAccent, fontWeight: '600' },
});
