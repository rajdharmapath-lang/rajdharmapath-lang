import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { vocabularyCategories } from '../data/vocabulary';

export default function VocabularyCategoryListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const mode = route?.params?.mode === 'speech' ? 'speech' : 'vocabulary';
  const destination = mode === 'speech' ? 'SpeechWordList' : 'FullVocabulary';

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Categories</Text>
          <View style={{ width: 26 }} />
        </View>

        <FlatList
          data={vocabularyCategories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <StaggeredSlideItem index={index} style={styles.rowEntry}>
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate(destination, { categoryId: item.id })}
              >
                <View>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.declaredWordCount} Words</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
              </Pressable>
            </StaggeredSlideItem>
          )}
        />
      </View>

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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  rowEntry: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  rowTitle: { fontSize: 17, color: colors.textDark, marginBottom: 4 },
  rowSubtitle: { fontSize: 13, color: colors.textLabel },
});
