import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function QuizProgressHeader({
  quizName,
  current,
  total,
  onBack,
  onFinish,
  finishDisabled = false,
}) {
  const progress = total > 0 ? current / total : 0;

  return (
    <View>
      <View style={styles.row}>
        <Pressable onPress={onBack} hitSlop={12} style={{ width: 26 }}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>
        <Text style={styles.quizName}>{quizName}</Text>
        <Text style={styles.counter}>
          {current}/{total}
        </Text>
      </View>
      <View style={styles.progressRow}>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%` }]} />
        </View>
        <Pressable
          style={[styles.finishButton, finishDisabled && styles.finishButtonDisabled]}
          onPress={onFinish}
          disabled={finishDisabled}
          accessibilityRole="button"
        >
          <Text style={styles.finishButtonText}>Finish Test</Text>
        </Pressable>
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
  quizName: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt },
  counter: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt, width: 44, textAlign: 'right' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
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
  finishButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: { opacity: 0.45 },
  finishButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
