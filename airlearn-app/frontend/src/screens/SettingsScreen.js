import React, { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import SettingsRow from '../components/SettingsRow';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';

function formatDate(ms) {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) || [];
  return parts.length
    ? parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('')
    : 'RD';
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user, logout } = useAuth();
  const { purchasedBatches, hasAnyBatchAccess } = usePayment();
  const [profileDialog, setProfileDialog] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const validTill = useMemo(() => {
    const dates = Object.values(purchasedBatches)
      .map((entitlement) => entitlement.validUntil)
      .filter(Number.isFinite);
    return dates.length ? formatDate(Math.max(...dates)) : null;
  }, [purchasedBatches]);

  const handleLogout = () => {
    setProfileDialog({ type: 'logout', title: 'Log out?', message: 'Are you sure you want to log out?' });
  };

  const handleComingSoon = (feature) => {
    setProfileDialog({ type: 'notice', title: feature });
  };

  const dismissProfileDialog = () => {
    if (loggingOut) return;
    setProfileDialog(null);
  };

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'PhoneEntry' }] });
    } catch (err) {
      setProfileDialog({
        type: 'notice',
        title: 'Could not log out',
        message: err.message,
      });
      setLoggingOut(false);
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.profileLine}>{user?.name || 'Name'}</Text>
              <Text style={styles.profileLine}>{user?.phone || 'Phone Number'}</Text>
              <Text style={styles.profileLine}>{user?.email || 'Email'}</Text>
            </View>
          </View>

          {hasAnyBatchAccess() ? (
            <View style={styles.planBanner}>
              <View style={styles.memberContent}>
                <View style={styles.memberTitleRow}>
                  <MaterialCommunityIcons
                    name="crown"
                    size={22}
                    color={colors.accentRedAlt}
                    style={styles.crownIcon}
                  />
                  <Text style={styles.planTitle}>Prime Member</Text>
                </View>
                <Text style={styles.planSubtitle}>
                  {validTill ? `Valid till ${validTill}` : 'Validity date unavailable'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.planBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>No Active Plan</Text>
                <Text style={styles.planSubtitle}>Choose Plan to start learning</Text>
              </View>
              <Pressable
                style={styles.joinButton}
                onPress={() => navigation.navigate('PaywallChoosePlan', {})}
              >
                <Text style={styles.joinButtonText}>Join Plan</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.menuCard}>
            <SettingsRow
              icon="person-outline"
              label="Account"
              onPress={() => navigation.navigate('SettingsAccount')}
            />
            <SettingsRow
              icon="globe-outline"
              label="App Language"
              onPress={() => navigation.navigate('SettingsLanguage')}
            />
            <SettingsRow
              icon="book-outline"
              label="Learning Preference"
              onPress={() => navigation.navigate('SettingsLearningPreference')}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notification"
              onPress={() => handleComingSoon('Notifications')}
            />
            <SettingsRow
              icon="information-circle-outline"
              label="Support & About"
              onPress={() => handleComingSoon('Support & About')}
              isLast
            />
          </View>

          <Pressable style={styles.logoutRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.accentRedAlt} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(profileDialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismissProfileDialog}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismissProfileDialog}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Dismiss dialog"
          />
          <View
            style={[styles.noticeModal, { maxWidth: Math.min(maxWidth - 48, 420) }]}
            accessibilityViewIsModal
          >
            <View style={styles.noticeIcon}>
              <Ionicons
                name={
                  profileDialog?.type === 'logout'
                    ? 'log-out-outline'
                    : profileDialog?.title === 'Notifications'
                      ? 'notifications-outline'
                      : 'information-circle-outline'
                }
                size={26}
                color={profileDialog?.type === 'logout' ? colors.primary : colors.homeOrange}
              />
            </View>
            <Text style={styles.noticeTitle}>{profileDialog?.title}</Text>
            <Text style={styles.noticeMessage}>
              {profileDialog?.message || "This section isn't available yet. Check back soon."}
            </Text>
            {profileDialog?.type === 'logout' ? (
              <View style={styles.dialogActions}>
                <Pressable
                  style={[styles.dialogButton, styles.cancelButton]}
                  onPress={dismissProfileDialog}
                  disabled={loggingOut}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.dialogButton, styles.logoutButton]}
                  onPress={confirmLogout}
                  disabled={loggingOut}
                >
                  <Text style={styles.logoutButtonText}>
                    {loggingOut ? 'Logging out...' : 'Log Out'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.noticeButton} onPress={dismissProfileDialog} accessibilityRole="button">
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 24 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.homeOrangeBg,
    borderWidth: 2,
    borderColor: colors.homeOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 28, fontWeight: '700', color: colors.accentRedAlt },
  profileLine: { fontSize: 16, color: colors.textDark, marginBottom: 4 },
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.homeOrangeLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  memberContent: { flex: 1 },
  memberTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  crownIcon: { marginRight: 8 },
  planTitle: { fontSize: 19, fontWeight: '700', color: colors.accentRedAlt },
  planSubtitle: { fontSize: 13, color: '#fff' },
  joinButton: {
    backgroundColor: colors.playerCircle,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  joinButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  menuCard: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 24,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoutText: { fontSize: 17, fontWeight: '700', color: colors.accentRedAlt },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  noticeModal: {
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
  noticeIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noticeTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  noticeMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
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
  logoutButton: { backgroundColor: colors.primary },
  logoutButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
