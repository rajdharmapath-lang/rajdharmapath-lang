import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import VocabularyWordRow from '../components/VocabularyWordRow';
import { getCategoryById } from '../data/vocabulary';
import { useAuth } from '../context/AuthContext';

export default function FullVocabularyScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const categoryId = route?.params?.categoryId || 'numbers';
  const category = getCategoryById(categoryId);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>{category?.name || 'Vocabulary'}</Text>
          <View style={{ width: 26 }} />
        </View>

        {category?.words?.length ? (
          <FlatList
            data={category.words}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <VocabularyWordRow word={item} language={language} />}
          />
        ) : (
          <Text style={styles.emptyText}>
            Words for this category haven't been added yet.
          </Text>
        )}
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
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  emptyText: { fontSize: 14, color: colors.textLabel, textAlign: 'center', marginTop: 40 },
});
