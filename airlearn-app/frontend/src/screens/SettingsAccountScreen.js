import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  Pressable,
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

export default function SettingsAccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user, updateAccount } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [occupation, setOccupation] = useState(user?.occupation || null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = name.trim().length > 1 && emailValid && !!occupation;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Please fill all fields correctly');
      return;
    }
    setLoading(true);
    try {
      await updateAccount({ name: name.trim(), email: email.trim(), occupation });
      Alert.alert('Saved', 'Your account details have been updated.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save changes', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView  keyboardShouldPersistTaps="handled">
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.title}>Account</Text>
            <View style={{ width: 26 }} />
          </View>

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

            <View style={[styles.fieldRow, styles.fieldRowDisabled]}>
              <Ionicons name="call-outline" size={20} color={colors.textPlaceholder} style={styles.icon} />
              <Text style={styles.disabledText}>
                {user?.phone || 'Phone number'}
              </Text>
            </View>
            <Text style={styles.helperText}>Phone number can't be changed here.</Text>

            <PrimaryButton
              title="Save Changes"
              onPress={handleSave}
              disabled={!isValid}
              loading={loading}
              style={{ marginTop: 30 }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, fontSize: 20 },
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
  fieldRowDisabled: {
    backgroundColor: colors.navInactiveBg,
    borderColor: colors.navInactiveBg,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.textDark },
  disabledText: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.textPlaceholder },
  helperText: { fontSize: 12, color: colors.textLabel, marginTop: -8 },
});
