import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches, liveClass } from '../data/courses';
import { usePayment } from '../context/PaymentContext';
import { redirectToPaywall } from '../utils/paywall';

export default function BatchListScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { hasAnyLiveAccess } = usePayment();

  // Note: liveClass isn't tied to a specific batch in the current data model
  // (one global banner, not one per batch), so this checks "any batch with the
  // Live tier" rather than a specific batch's live access. Once live classes
  // become per-batch, this should switch to hasLiveAccess(thatBatchId).
  const handleJoinLive = () => {
    if (!hasAnyLiveAccess()) {
      redirectToPaywall(navigation, route, undefined);
      return;
    }
    navigation.navigate('LiveClass');
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Videos</Text>

          {batches.map((batch) => (
            <Pressable
              key={batch.id}
              style={[styles.card, { backgroundColor: colors[batch.colorBg] }]}
              onPress={() => navigation.navigate('VideoList', { batchId: batch.id })}
            >
              <View style={styles.cardText}>
                <Text style={[styles.cardName, { color: colors[batch.colorAccent] }]}>
                  {batch.name}
                </Text>
                <Text style={styles.cardSubtitle}>{batch.subtitle}</Text>
                <Text style={styles.cardCount}>{batch.videoCount} Videos</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors[batch.colorAccent] }]}>
                <Text style={styles.badgeGlyph}>{batch.glyph}</Text>
              </View>
            </Pressable>
          ))}

          {liveClass.status ? (
            <View style={styles.liveBanner}>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>
                  LIVE CLASS <Text style={styles.liveUpcoming}>({liveClass.status})</Text>
                </Text>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.joinButton} onPress={handleJoinLive}>
                  <Text style={styles.joinButtonText}>Join Live</Text>
                </Pressable>
              </View>
              <View style={styles.scheduleRow}>
                <View style={styles.videoIconCircle}>
                  <Ionicons name="videocam" size={14} color="#fff" />
                </View>
                <Text style={styles.scheduleText}>{liveClass.scheduleLabel}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.liveBanner, styles.liveBannerEmpty]}>
              <View style={styles.videoIconCircle}>
                <Ionicons name="videocam" size={14} color="#fff" />
              </View>
              <Text style={styles.noLiveText}>No live class scheduled</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav
        active="Videos"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Profile') navigation.navigate('Settings');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    justifyContent: 'flex-start',
    gap: 16,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center' },
  card: {
    flexGrow: 1,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardText: { flex: 1 },
  cardName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.textDark, marginBottom: 14 },
  cardCount: { fontSize: 13, color: colors.textLabel },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  liveBanner: {
    flexGrow: 1,
    backgroundColor: colors.liveClassBg,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'center',
  },
  liveBannerEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noLiveText: { fontSize: 14, color: colors.textDark, marginLeft: 10 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.liveDot, marginRight: 8 },
  liveText: { fontSize: 14, fontWeight: '700', color: colors.textDark },
  liveUpcoming: { fontWeight: '400', color: colors.textLabel },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center' },
  videoIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  scheduleText: { fontSize: 13, color: colors.textLabel, flexShrink: 1 },
});
