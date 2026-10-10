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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import PrimaryButton from '../components/PrimaryButton';
import Dropdown from '../components/Dropdown';
import { occupations } from '../data/occupations';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';
import { useProgress } from '../context/ProgressContext';
import { useVocabulary } from '../context/VocabularyContext';
import BottomNav from '../components/BottomNav';

export default function SettingsAccountScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user, updateAccount, deleteAccount } = useAuth();
  const { clearPurchasedBatches } = usePayment();
  const { clearProgress } = useProgress();
  const { clearVocabulary } = useVocabulary();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [occupation, setOccupation] = useState(user?.occupation || null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountDialog, setAccountDialog] = useState(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = name.trim().length > 1 && emailValid && !!occupation;

  const handleSave = async () => {
    if (!isValid) {
      setAccountDialog({
        type: 'notice',
        title: 'Check your details',
        message: 'Please fill all fields correctly.',
      });
      return;
    }
    setLoading(true);
    try {
      await updateAccount({ name: name.trim(), email: email.trim(), occupation });
      setAccountDialog({
        type: 'notice',
        title: 'Saved',
        message: 'Your account details have been updated.',
        onClose: () => navigation.goBack(),
      });
    } catch (err) {
      setAccountDialog({
        type: 'notice',
        title: 'Could not save changes',
        message: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setAccountDialog({
      type: 'confirm',
      title: 'Delete account permanently?',
      message: 'Your account and saved learning data will be permanently deleted. This action cannot be undone.',
    });
  };

  const dismissAccountDialog = () => {
    if (deleting) return;
    const onClose = accountDialog?.onClose;
    setAccountDialog(null);
    onClose?.();
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await Promise.all([clearPurchasedBatches(), clearProgress(), clearVocabulary()]);
      navigation.reset({ index: 0, routes: [{ name: 'PhoneEntry' }] });
    } catch (err) {
      setDeleting(false);
      setAccountDialog({
        type: 'notice',
        title: 'Could not delete account',
        message: err?.response?.data?.message || err.message,
      });
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

          <View style={styles.accountFarewell}>
            <Text style={styles.accountFarewellTitle}>We'd be sorry to see you go</Text>
            <Text style={styles.accountFarewellDescription}>
              Deleting your account will permanently remove your profile and saved learning data.
            </Text>
            <Pressable
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
              disabled={deleting}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteAccountText}>
                {deleting ? 'Deleting Account...' : 'Delete Account'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(accountDialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismissAccountDialog}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissAccountDialog}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel="Dismiss dialog"
          />
          <View
            style={[styles.dialog, { maxWidth: Math.min(maxWidth - 48, 420) }]}
            accessibilityViewIsModal
          >
            <View style={[styles.dialogIcon, accountDialog?.type === 'confirm' && styles.dialogIconDanger]}>
              <Ionicons
                name={accountDialog?.type === 'confirm' ? 'trash-outline' : 'alert-circle-outline'}
                size={26}
                color={accountDialog?.type === 'confirm' ? colors.failRed : colors.homeOrange}
              />
            </View>
            <Text style={styles.dialogTitle}>{accountDialog?.title}</Text>
            <Text style={styles.dialogMessage}>{accountDialog?.message}</Text>
            {accountDialog?.type === 'confirm' ? (
              <View style={styles.dialogActions}>
                <Pressable
                  style={[styles.dialogButton, styles.cancelButton]}
                  onPress={dismissAccountDialog}
                  disabled={deleting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogButton, styles.confirmButton]}
                  onPress={confirmDeleteAccount}
                  disabled={deleting}
                >
                  <Text style={styles.confirmButtonText}>
                    {deleting ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.noticeButton} onPress={dismissAccountDialog}>
                <Text style={styles.noticeButtonText}>Got it</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
      <BottomNav
        active="Profile"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Language') navigation.navigate('Vocabulary');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
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
  accountFarewell: {
    borderWidth: 1,
    borderColor: colors.homeOrangeLight,
    borderRadius: 16,
    backgroundColor: colors.homeOrangeBgAlt,
    padding: 16,
    marginTop: 32,
    marginBottom: 32,
  },
  accountFarewellTitle: { fontSize: 16, fontWeight: '700', color: colors.accentRedAlt, marginBottom: 6 },
  accountFarewellDescription: { fontSize: 13, lineHeight: 19, color: colors.textLabel, marginBottom: 14 },
  deleteAccountButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  deleteAccountText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  dialogIconDanger: { backgroundColor: '#FDEBEC' },
  dialogTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  dialogMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
  dialogActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 22 },
  dialogButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelButton: { borderWidth: 1, borderColor: colors.border },
  cancelButtonText: { color: colors.textDark, fontSize: 15, fontWeight: '700' },
  confirmButton: { backgroundColor: colors.primary },
  confirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noticeButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  noticeButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
