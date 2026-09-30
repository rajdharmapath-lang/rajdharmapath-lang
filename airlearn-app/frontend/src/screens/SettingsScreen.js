import React, { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import SettingsRow from '../components/SettingsRow';
import { useAuth } from '../context/AuthContext';
import { usePayment } from '../context/PaymentContext';

const PLAN_DURATION_DAYS = 90; // matches every plan's "3 months" in data/plans.js

function formatDate(ms) {
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { user, logout } = useAuth();
  const { purchasedBatches, hasAnyBatchAccess } = usePayment();

  const validTill = useMemo(() => {
    const entries = Object.values(purchasedBatches);
    if (!entries.length) return null;
    const latestPurchase = Math.max(...entries.map((b) => b.purchasedAt));
    return formatDate(latestPurchase + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  }, [purchasedBatches]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'PhoneEntry' }] });
        },
      },
    ]);
  };

  const handleComingSoon = (feature) => {
    Alert.alert(feature, "This section isn't available yet — check back soon.");
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Settings</Text>

          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#fff" />
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
                <Text style={styles.planSubtitle}>Valid till {validTill}</Text>
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
    backgroundColor: colors.avatarGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
