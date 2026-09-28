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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import PrimaryButton from '../components/PrimaryButton';
import Dropdown from '../components/Dropdown';
import { occupations } from '../data/occupations';
import { useAuth } from '../context/AuthContext';

export default function CreateAccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { createAccount } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = name.trim().length > 1 && emailValid && !!occupation;

  const handleCreate = async () => {
    if (!isValid) {
      Alert.alert('Please fill all fields correctly');
      return;
    }
    setLoading(true);
    try {
      await createAccount({ name: name.trim(), email: email.trim(), occupation });
      navigation.reset({ index: 0, routes: [{ name: 'LanguageChoose' }] });
    } catch (err) {
      Alert.alert('Could not create account', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView  keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={26}
              color={colors.border}
              onPress={() => navigation.goBack()}
            />
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your learning</Text>

          <View style={styles.form}>
            <View style={styles.fieldRow}>
              <Ionicons name="person-outline" size={20} color={colors.textLabel} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={colors.textPlaceholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.fieldRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textLabel} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={colors.textPlaceholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Dropdown
              icon="briefcase-outline"
              placeholder="Occupation"
              options={occupations}
              value={occupation}
              onChange={setOccupation}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleCreate}
              disabled={!isValid}
              loading={loading}
              style={{ marginTop: 50 }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginBottom: 40 },
  title: { ...typography.h2, color: colors.accentRed, textAlign: 'center', marginBottom: 6 },
  subtitle: { ...typography.body, color: colors.textDark, textAlign: 'center', marginBottom: 40 },
  form: { gap: 16 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.textDark },
});
