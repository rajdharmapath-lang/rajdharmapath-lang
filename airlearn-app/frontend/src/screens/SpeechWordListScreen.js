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
import { usePayment } from '../context/PaymentContext';
import { useAccessGate } from '../utils/paywall';
import { pickRandom } from '../utils/shuffle';

const WORDS_PER_SESSION = 5;

export default function SpeechWordListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user } = useAuth();
  const { hasAnyBatchAccess } = usePayment();
  const language = user?.language === 'tamil' ? 'tamil' : 'english';

  const categoryId = route?.params?.categoryId || 'greetings';
  const category = getCategoryById(categoryId);
  const hasWords = !!category?.words?.length;

  // Same gate as the Categories list and Vocabulary's word list — entering
  // this screen at all requires having purchased at least one batch.
  useAccessGate(navigation, route, hasAnyBatchAccess());

  const handleStartPractice = () => {
    if (!hasWords) return;
    // A fresh random 5-word (or fewer, if the category has less) selection each
    // time practice starts — "Practice Again" on the results screen re-uses this
    // exact set rather than reshuffling, so this is the only place a new shuffle happens.
    const sessionWords = pickRandom(category.words, WORDS_PER_SESSION);
    navigation.navigate('SpeechPractice', { categoryId, words: sessionWords });
  };

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

        {hasWords ? (
          <FlatList
            data={category.words}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VocabularyWordRow word={item} language={language} stacked />
            )}
          />
        ) : (
          <Text style={styles.emptyText}>
            Words for this category haven't been added yet.
          </Text>
        )}

        <Pressable
          style={[styles.startButton, !hasWords && styles.startButtonDisabled]}
          disabled={!hasWords}
          onPress={handleStartPractice}
        >
          <Text style={styles.startButtonText}>Start Practice</Text>
        </Pressable>
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
    marginBottom: 16,
  },
  title: { ...typography.h2, color: colors.textDark, fontSize: 20 },
  emptyText: { fontSize: 14, color: colors.textLabel, textAlign: 'center', marginTop: 40 },
  startButton: {
    borderWidth: 1.5,
    borderColor: colors.strokeAccent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  startButtonDisabled: { opacity: 0.5 },
  startButtonText: { color: colors.strokeAccent, fontWeight: '700', fontSize: 16 },
});
