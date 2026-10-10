import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { HSK500_CHARACTERS } from '../vendor/chinese-stroke-rn/src';
import { getCharacterMeta } from '../data/characterMeta';
import { userApi } from '../api/client';
import { redirectToPaywall } from '../utils/paywall';

export default function CharacterSelectScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';
  const [query, setQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState([]); // array of characters, in the order picked
  const [isStartingPractice, setIsStartingPractice] = useState(false);

  // Lead with characters we have captions for so the grid reads well; the rest of
  // HSK500 still works for practice, it just shows without a pinyin/meaning caption.
  const orderedCharacters = useMemo(() => {
    const withMeta = HSK500_CHARACTERS.filter((c) => getCharacterMeta(c, language));
    const withoutMeta = HSK500_CHARACTERS.filter((c) => !getCharacterMeta(c, language));
    return [...withMeta, ...withoutMeta];
  }, [language]);

  const filtered = useMemo(() => {
    if (!query.trim()) return orderedCharacters;
    const q = query.trim().toLowerCase();
    return orderedCharacters.filter((c) => {
      const meta = getCharacterMeta(c, language);
      return (
        c.includes(query.trim()) ||
        meta?.pinyin?.toLowerCase().includes(q) ||
        meta?.englishMeaning?.toLowerCase().includes(q) ||
        meta?.tamilMeaning?.toLowerCase().includes(q)
      );
    });
  }, [query, orderedCharacters, language]);

  const toggleSelect = (char) => {
    setSelected((prev) =>
      prev.includes(char) ? prev.filter((c) => c !== char) : [...prev, char]
    );
  };

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      setSelected([]);
    }
    setSelectionMode((v) => !v);
  };

  const startPracticeWith = async (characters) => {
    if (isStartingPractice) return;

    setIsStartingPractice(true);
    try {
      const { data } = await userApi.claimStrokePreview();
      if (!data.hasPrimeAccess && !data.previewClaimed) {
        redirectToPaywall(navigation, route);
        return;
      }
      navigation.navigate('StrokePractice', { characters });
    } catch (error) {
      Alert.alert(
        'Could not check access',
        error.response?.data?.message || 'Please try again when your connection is available.'
      );
    } finally {
      setIsStartingPractice(false);
    }
  };

  const handleCardPress = (char) => {
    if (selectionMode) {
      toggleSelect(char);
    } else {
      // Tapping a single character outside selection mode practices just that one
      startPracticeWith([char]);
    }
  };

  const handleStartPractice = () => {
    if (selected.length === 0) return;
    startPracticeWith(selected);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Choose Characters</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.subtitle}>Select words to practice writing</Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Words"
            placeholderTextColor={colors.strokeAccent}
            value={query}
            onChangeText={setQuery}
          />
          <Ionicons name="search" size={20} color={colors.strokeAccent} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Characters</Text>
          <Pressable onPress={handleToggleSelectionMode}>
            <Text style={styles.selectLink}>
              {selectionMode ? `${selected.length} Select` : 'Select'}
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          numColumns={3}
          contentContainerStyle={{ paddingBottom: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          renderItem={({ item }) => {
            const meta = getCharacterMeta(item, language);
            const isSelected = selected.includes(item);
            return (
              <Pressable
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleCardPress(item)}
                disabled={isStartingPractice}
                onLongPress={() => {
                  if (!selectionMode) setSelectionMode(true);
                  toggleSelect(item);
                }}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                  </View>
                )}
                <Text style={styles.hanzi}>{item}</Text>
                <Text style={styles.pinyin} numberOfLines={1} adjustsFontSizeToFit>
                  {meta?.pinyin || ' '}
                </Text>
                <Text style={styles.meaning} numberOfLines={2} ellipsizeMode="tail">
                  {meta?.meaning || ' '}
                </Text>
              </Pressable>
            );
          }}
        />

        <Pressable
          style={[styles.startButton, selected.length === 0 && styles.startButtonDisabled]}
          disabled={selected.length === 0 || isStartingPractice}
          onPress={handleStartPractice}
        >
          <Text style={styles.startButtonText}>Start Practice</Text>
        </Pressable>
      </View>

      <BottomNav
        active="Home"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', flex: 1 },
  headerSpacer: { width: 26 },
  subtitle: { ...typography.body, color: colors.textDark, textAlign: 'center', marginBottom: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.strokeAccent, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { ...typography.bodyBold, color: colors.accentRedAlt, fontSize: 17 },
  selectLink: { ...typography.bodyBold, color: colors.accentRedAlt, fontSize: 14 },
  card: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginBottom: 14,
    backgroundColor: colors.card,
  },
  cardSelected: {
    backgroundColor: colors.homeOrangeBg,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.strokeAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hanzi: { fontSize: 30, color: colors.textDark, marginBottom: 4 },
  pinyin: { width: '100%', fontSize: 13, color: colors.textLabel, textAlign: 'center' },
  meaning: {
    width: '100%',
    fontSize: 12,
    lineHeight: 15,
    color: colors.textLabel,
    textAlign: 'center',
    flexShrink: 1,
  },
  startButton: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: colors.strokeAccent, fontWeight: '700', fontSize: 16 },
});
