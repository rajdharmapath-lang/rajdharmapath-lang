import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
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

export default function SettingsLanguageScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user, setLanguage } = useAuth();
  const [saving, setSaving] = useState(null); // which key is currently saving

  const handleSelect = async (langKey) => {
    if (langKey === user?.language || saving) return;
    setSaving(langKey);
    try {
      await setLanguage(langKey);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not update language', err?.response?.data?.message || err.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Language</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.cards}>
          {LANGUAGES.map((lang) => {
            const isCurrent = user?.language === lang.key;
            return (
              <Pressable
                key={lang.key}
                onPress={() => handleSelect(lang.key)}
                style={[
                  styles.card,
                  { backgroundColor: lang.bg, borderColor: lang.border },
                  isCurrent && styles.cardCurrent,
                ]}
              >
                {isCurrent && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
                <View style={styles.circle}>
                  <Text style={styles.glyph}>{lang.glyph}</Text>
                </View>
                <Text style={styles.cardLabel}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BottomNav
        active="Profile"
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  cards: { gap: 24 },
  card: {
    borderWidth: 2,
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: 'center',
  },
  cardCurrent: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
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
