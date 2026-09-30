import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
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
  const [dialog, setDialog] = useState(null);

  const handleSelectLanguage = async (language) => {
    if (loading) return;
    setSelected(language);
    setLoading(true);
    try {
      await setLanguage(language);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      setSelected(null);
      setDialog({
        title: 'Could not save language',
        message: err?.response?.data?.message || err.message,
      });
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
                onPress={() => handleSelectLanguage(lang.key)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: loading }}
                style={[
                  styles.card,
                  { backgroundColor: lang.bg, borderColor: lang.border },
                  isSelected && styles.cardSelected,
                ]}
              >
                <View style={styles.circle}>
                  {loading && isSelected ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.glyph}>{lang.glyph}</Text>
                  )}
                </View>
                <Text style={styles.cardLabel}>{lang.label}</Text>
              </Pressable>
            );
          })}
        </View>

      </View>

      <Modal
        visible={Boolean(dialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDialog(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss dialog"
          />
          <View style={[styles.dialog, { maxWidth: Math.min(maxWidth - 48, 420) }]} accessibilityViewIsModal>
            <View style={styles.dialogIcon}>
              <Text style={styles.dialogIconText}>!</Text>
            </View>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMessage}>{dialog?.message}</Text>
            <Pressable style={styles.dialogButton} onPress={() => setDialog(null)}>
              <Text style={styles.dialogButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    elevation: 10,
  },
  dialogIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogIconText: { color: colors.homeOrange, fontSize: 24, fontWeight: '700' },
  dialogTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  dialogMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
  dialogButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  dialogButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
