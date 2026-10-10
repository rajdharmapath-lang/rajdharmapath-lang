import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import PrimaryButton from '../components/PrimaryButton';
import CountryCodePicker from '../components/CountryCodePicker';
import { defaultCountry } from '../data/countryCodes';
import { useAuth } from '../context/AuthContext';

export default function PhoneEntryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { sendOtp } = useAuth();
  const [country, setCountry] = useState(defaultCountry);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(null);

  const isValid = phone.trim().length >= 6 && phone.trim().length <= country.maxLength + 1;

  const handleGetStarted = async () => {
    if (!isValid) {
      setDialog({
        title: 'Invalid phone number',
        message: 'Please enter a valid phone number to receive your verification code.',
      });
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim(), country.dialCode);
      navigation.navigate('OtpVerify');
    } catch (err) {
      setDialog({
        title: 'Could not send OTP',
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Text style={styles.greeting}>Nǐ hǎo,</Text>
            <Text style={styles.chinese}>欢迎学习中文</Text>
            <Text style={styles.subtitle}>Learn Chinese with Rajdharma</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Enter your Phone Number</Text>
            <Text style={styles.formSubtitle}>We will send you a verification code</Text>

            <View style={styles.inputRow}>
              <CountryCodePicker selected={country} onSelect={setCountry} />
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter Phone Number"
                placeholderTextColor={colors.textPlaceholder}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                maxLength={country.maxLength + 2}
              />
            </View>

            <PrimaryButton
              title="Get Started"
              onPress={handleGetStarted}
              disabled={!isValid}
              loading={loading}
              style={{ marginTop: 40 }}
            />
          </View>
        </View>
      </ScrollView>

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
          <View
            style={[styles.dialog, { maxWidth: Math.min(maxWidth - 48, 420) }]}
            accessibilityViewIsModal
          >
            <View style={styles.dialogIcon}>
              <Ionicons name="alert-circle-outline" size={26} color={colors.homeOrange} />
            </View>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMessage}>{dialog?.message}</Text>
            <Pressable
              style={styles.dialogButton}
              onPress={() => setDialog(null)}
              accessibilityRole="button"
            >
              <Text style={styles.dialogButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  header: { marginBottom: 60 },
  greeting: { ...typography.h1, color: colors.textDark, marginBottom: 4 },
  chinese: { ...typography.h1, color: colors.accentRed, marginBottom: 10 },
  subtitle: { ...typography.bodyBold, color: colors.textDark },
  formSection: { marginTop: 20 },
  formTitle: { ...typography.h2, color: colors.accentRed, textAlign: 'center', marginBottom: 6 },
  formSubtitle: { ...typography.body, color: colors.textDark, textAlign: 'center', marginBottom: 32 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.textDark,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
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
