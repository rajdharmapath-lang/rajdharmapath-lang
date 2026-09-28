import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
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
      Alert.alert('Verification failed', err?.response?.data?.message || err.message);
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
      Alert.alert('Could not resend code', err?.response?.data?.message || err.message);
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
});
