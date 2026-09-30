import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import OtpInput from '../components/OtpInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';

const RESEND_SECONDS = 60;

export default function OtpVerifyScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { pendingPhone, verifyOtp, sendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    setSecondsLeft(RESEND_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleVerify = async (fullCode) => {
    if (fullCode.length !== 6) return;
    setLoading(true);
    try {
      const { isNewUser } = await verifyOtp(fullCode);
      if (isNewUser) {
        navigation.reset({ index: 0, routes: [{ name: 'CreateAccount' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
    } catch (err) {
      setDialog({
        title: 'Verification failed',
        message: err?.response?.data?.message || err.message,
      });
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (text) => {
    setCode(text);
    if (text.length === 6) handleVerify(text);
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || !pendingPhone) return;
    try {
      await sendOtp(pendingPhone.phone, pendingPhone.dialCode);
      startTimer();
    } catch (err) {
      setDialog({
        title: 'Could not resend code',
        message: err?.response?.data?.message || err.message,
      });
    }
  };

  const maskedNumber = pendingPhone ? `${pendingPhone.dialCode} ${pendingPhone.phone}` : '';

  return (
    <KeyboardAvoidingView style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>

        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
        <Text style={styles.phoneText}>{maskedNumber}</Text>

        <View style={styles.whatsappCircle}>
          <Ionicons name="logo-whatsapp" size={34} color="#fff" />
        </View>

        <OtpInput length={6} value={code} onChange={handleChange} />

        <Pressable onPress={handleResend} style={{ marginTop: 20 }}>
          <Text style={[styles.resend, secondsLeft > 0 && { color: colors.textPlaceholder }]}>
            {secondsLeft > 0 ? `Resend code in 0:${String(secondsLeft).padStart(2, '0')}` : 'Resend code'}
          </Text>
        </Pressable>

        <PrimaryButton
          title="Verify"
          onPress={() => handleVerify(code)}
          disabled={code.length !== 6}
          loading={loading}
          style={{ marginTop: 40 }}
        />
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
              <Ionicons name="alert-circle-outline" size={26} color={colors.homeOrange} />
            </View>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMessage}>{dialog?.message}</Text>
            <Pressable style={styles.dialogButton} onPress={() => setDialog(null)}>
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
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 60 },
  title: { ...typography.h2, color: colors.accentRed, textAlign: 'center', marginBottom: 6 },
  subtitle: { ...typography.body, color: colors.textDark, textAlign: 'center' },
  phoneText: { ...typography.bodyBold, color: colors.textDark, textAlign: 'center', marginBottom: 30 },
  whatsappCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.whatsapp,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  resend: { ...typography.body, color: colors.textDark, textAlign: 'center' },
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
