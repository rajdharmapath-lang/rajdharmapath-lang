import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * state: 'idle' | 'correct' | 'wrong' | 'reveal' (reveal = this is the right
 * answer, shown after the user picked a different, wrong option)
 */
export default function QuizOption({ index, label, state = 'idle', onPress, disabled }) {
  const style = [
    styles.option,
    state === 'correct' && styles.correct,
    state === 'wrong' && styles.wrong,
    state === 'reveal' && styles.reveal,
  ];
  const textStyle = [
    styles.label,
    (state === 'correct' || state === 'wrong' || state === 'reveal') && styles.labelAnswered,
  ];

  return (
    <Pressable style={style} onPress={onPress} disabled={disabled}>
      <View style={styles.letterCircle}>
        <Text style={styles.letter}>{LETTERS[index]}</Text>
      </View>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  correct: { backgroundColor: '#E4F6E9', borderColor: '#2E9B4F' },
  wrong: { backgroundColor: '#FBE7E6', borderColor: '#C23B32' },
  reveal: { backgroundColor: '#E4F6E9', borderColor: '#2E9B4F' },
  letterCircle: { width: 26, marginRight: 6 },
  letter: { fontSize: 15, color: colors.strokeAccent, fontWeight: '600' },
  label: { fontSize: 16, color: colors.strokeAccent },
  labelAnswered: { color: colors.textDark, fontWeight: '600' },
});
