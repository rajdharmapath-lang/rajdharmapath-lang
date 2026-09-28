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
  Alert,
} from 'react-native';
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

  const isValid = phone.trim().length >= 6 && phone.trim().length <= country.maxLength + 1;

  const handleGetStarted = async () => {
    if (!isValid) {
      Alert.alert('Enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone.trim(), country.dialCode);
      navigation.navigate('OtpVerify');
    } catch (err) {
      Alert.alert('Could not send OTP', err?.response?.data?.message || err.message);
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
});
