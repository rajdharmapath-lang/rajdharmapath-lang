import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  {
    key: 'tamil',
    glyph: 'த',
    label: 'Learn Chinese\nin தமிழ்',
    bg: colors.tamilCardBg,
    border: colors.tamilCardBorder,
  },
  {
    key: 'english',
    glyph: '中文',
    label: 'Learn Chinese\nin English',
    bg: colors.englishCardBg,
    border: colors.englishCardBorder,
  },
];

export default function LanguageChooseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { setLanguage } = useAuth();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await setLanguage(selected);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      Alert.alert('Could not save language', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Choose Your Language</Text>

        <View style={styles.cards}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.key;
            return (
              <Pressable
                key={lang.key}
                onPress={() => setSelected(lang.key)}
                style={[
                  styles.card,
                  { backgroundColor: lang.bg, borderColor: lang.border },
                  isSelected && styles.cardSelected,
                ]}
              >
                <View style={styles.circle}>
                  <Text style={styles.glyph}>{lang.glyph}</Text>
                </View>
                <Text style={styles.cardLabel}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
          loading={loading}
          style={{ marginTop: 50 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 80 },
  title: {
    ...typography.h2,
    color: colors.accentRedAlt,
    textAlign: 'center',
    marginBottom: 50,
  },
  cards: { gap: 24 },
  card: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: 'center',
  },
  cardSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  circle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentRedAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  glyph: { fontSize: 28, color: '#fff', fontWeight: '600' },
  cardLabel: {
    ...typography.bodyBold,
    color: colors.accentRedAlt,
    textAlign: 'center',
    lineHeight: 24,
  },
});
