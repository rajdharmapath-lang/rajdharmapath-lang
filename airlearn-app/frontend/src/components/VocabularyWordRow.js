import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { openChineseVoiceInstaller, playWordAudio } from '../services/audio';
import { useVocabulary } from '../context/VocabularyContext';
import { useProgress } from '../context/ProgressContext';

/**
 * language: 'tamil' | 'english' — decides which translation column shows.
 * stacked: when true, renders pinyin + translation below the hanzi (used by the
 * Speech word list) instead of side-by-side columns (used by Vocabulary lists).
 */
export default function VocabularyWordRow({ word, language, onPress, stacked = false }) {
  const { isFavorite, toggleFavorite, recordRecentWord } = useVocabulary();
  const { recordWordLearned } = useProgress();
  const favorited = isFavorite(word.id);
  const translation = language === 'tamil' ? word.ta : word.en;

  const handlePlayAudio = async () => {
    recordRecentWord(word.id);
    recordWordLearned(word.id);
    try {
      await playWordAudio(word);
    } catch (error) {
      console.warn('Vocabulary pronunciation failed:', error);
      const buttons = [{ text: 'Cancel', style: 'cancel' }];
      if (Platform.OS === 'android') {
        buttons.push({
          text: 'Install Chinese voice',
          onPress: () => openChineseVoiceInstaller().catch((installError) => {
            console.warn('Could not open Chinese voice settings:', installError);
            Alert.alert('Could not open settings', installError.message || 'Open Text-to-speech settings on your device.');
          }),
        });
      }
      Alert.alert(
        'Could not play pronunciation',
        error.message || 'Please try again.',
        buttons
      );
    }
  };

  const handlePress = () => {
    recordRecentWord(word.id);
    recordWordLearned(word.id);
    onPress?.(word);
  };

  if (stacked) {
    return (
      <Pressable style={styles.stackedRow} onPress={handlePress}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stackedHanzi}>{word.hanzi}</Text>
          <Text style={styles.stackedCaption}>{word.pinyin}</Text>
          <Text style={styles.stackedCaption}>{translation || '—'}</Text>
        </View>
        <Pressable hitSlop={10} onPress={handlePlayAudio} style={styles.iconButton}>
          <Ionicons name="volume-medium-outline" size={20} color={colors.navInactive} />
        </Pressable>
        <Pressable hitSlop={10} onPress={() => toggleFavorite(word.id)} style={styles.iconButton}>
          <Ionicons
            name={favorited ? 'star' : 'star-outline'}
            size={20}
            color={colors.starYellow}
          />
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.row} onPress={handlePress}>
      <Text style={styles.hanzi}>{word.hanzi}</Text>
      <Text style={styles.pinyin}>{word.pinyin}</Text>
      <Text style={styles.translation} numberOfLines={1}>
        {translation || '—'}
      </Text>
      <Pressable hitSlop={10} onPress={handlePlayAudio} style={styles.iconButton}>
        <Ionicons name="volume-medium-outline" size={20} color={colors.navInactive} />
      </Pressable>
      <Pressable hitSlop={10} onPress={() => toggleFavorite(word.id)} style={styles.iconButton}>
        <Ionicons
          name={favorited ? 'star' : 'star-outline'}
          size={20}
          color={colors.starYellow}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.navInactiveBg,
    gap: 8,
  },
  hanzi: { fontSize: 16, fontWeight: '600', color: colors.textDark, width: 64 },
  pinyin: { fontSize: 13, color: colors.textLabel, width: 84 },
  translation: { flex: 1, fontSize: 13, color: colors.textLabel },
  iconButton: { paddingHorizontal: 4 },
  stackedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.navInactiveBg,
    gap: 8,
  },
  stackedHanzi: { fontSize: 20, fontWeight: '600', color: colors.textDark, marginBottom: 2 },
  stackedCaption: { fontSize: 13, color: colors.textLabel },
});
