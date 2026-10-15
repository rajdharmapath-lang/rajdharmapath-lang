import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function QuizProgressHeader({
  quizName,
  current,
  total,
  onPrevious,
  previousDisabled = false,
}) {
  const progress = total > 0 ? current / total : 0;
  const canGoPrevious = current > 1 && !previousDisabled;

  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={onPrevious}
          disabled={!canGoPrevious}
          hitSlop={8}
          style={[styles.previousButton, !canGoPrevious && styles.previousButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous question"
        >
          <Text style={styles.previousText}>Prev</Text>
        </Pressable>
        <Text style={styles.quizName} numberOfLines={1}>
          {quizName}
        </Text>
        <Text style={styles.counter} numberOfLines={1}>
          {current}/{total}
        </Text>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previousButton: { width: 48, paddingVertical: 6 },
  previousButtonDisabled: { opacity: 0.35 },
  previousText: { fontSize: 15, fontWeight: '700', color: colors.accentRedAlt },
  quizName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  counter: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accentRedAlt,
    width: 58,
    flexShrink: 0,
    textAlign: 'right',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: colors.quizTrackGray,
    borderRadius: 2,
  },
  fill: {
    height: 4,
    backgroundColor: colors.strokeAccent,
    borderRadius: 2,
  },
});
