import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import VocabularyWordRow from '../components/VocabularyWordRow';
import { vocabularyCategories, getAllWords, findWordById } from '../data/vocabulary';
import { useVocabulary } from '../context/VocabularyContext';
import { useAuth } from '../context/AuthContext';

// Grid shows the first 7 categories + a "More..." tile, matching the mockup's 4x2 layout.
const GRID_LIMIT = 7;

export default function VocabularyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { recentIds } = useVocabulary();
  const [query, setQuery] = useState('');

  // Falls back to 'english' if language hasn't been set yet (shouldn't normally happen
  // since LanguageChooseScreen runs before Home, but keeps this screen crash-safe).
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const gridCategories = vocabularyCategories.slice(0, GRID_LIMIT);
  const hasMore = vocabularyCategories.length > GRID_LIMIT;

  const recentWords = useMemo(
    () => recentIds.map((id) => findWordById(id)).filter(Boolean),
    [recentIds]
  );

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    return getAllWords().filter(
      (w) =>
        w.hanzi.includes(query.trim()) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.en.toLowerCase().includes(q) ||
        w.ta.includes(query.trim())
    );
  }, [query]);

  const openCategory = (category) => {
    navigation.navigate('FullVocabulary', { categoryId: category.id });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Vocabulary</Text>

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

          {searchResults ? (
            <>
              <Text style={styles.sectionTitle}>Results</Text>
              {searchResults.length === 0 ? (
                <Text style={styles.emptyText}>No words match "{query}"</Text>
              ) : (
                searchResults.map((w) => (
                  <VocabularyWordRow key={w.id} word={w} language={language} />
                ))
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.grid}>
                {gridCategories.map((cat, index) => (
                  <StaggeredSlideItem
                    key={cat.id}
                    index={index}
                    style={styles.categoryCardEntry}
                  >
                    <Pressable style={styles.categoryCard} onPress={() => openCategory(cat)}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      <Text style={styles.categoryCount}>{cat.declaredWordCount} Words</Text>
                    </Pressable>
                  </StaggeredSlideItem>
                ))}
                {hasMore && (
                  <StaggeredSlideItem
                    index={gridCategories.length}
                    style={styles.categoryCardEntry}
                  >
                    <Pressable
                      style={styles.categoryCard}
                      onPress={() => navigation.navigate('VocabularyCategoryList')}
                    >
                      <Text style={styles.categoryName}>More...</Text>
                    </Pressable>
                  </StaggeredSlideItem>
                )}
              </View>

              <Text style={styles.sectionTitle}>Recent Words</Text>
              {recentWords.length === 0 ? (
                <Text style={styles.emptyText}>
                  Words you look up or play audio for will show up here.
                </Text>
              ) : (
                <View style={styles.recentCard}>
                  {recentWords.map((w) => (
                    <VocabularyWordRow key={w.id} word={w} language={language} />
                  ))}
                </View>
              )}

              <Pressable
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('VocabularyCategoryList')}
              >
                <Text style={styles.viewAllText}>View All Vocabulary</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

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
  container: { paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 20 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.homeOrangeBg,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.strokeAccent, fontWeight: '600' },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.accentRedAlt,
    fontSize: 19,
    marginBottom: 14,
  },
  emptyText: { fontSize: 13, color: colors.textLabel, marginBottom: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  categoryCardEntry: { width: '48%', marginBottom: 14 },
  categoryCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryName: { fontSize: 16, fontWeight: '600', color: colors.textDark, marginBottom: 4 },
  categoryCount: { fontSize: 13, color: colors.textLabel },
  recentCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  viewAllButton: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: { color: colors.strokeAccent, fontWeight: '700', fontSize: 16 },
});
