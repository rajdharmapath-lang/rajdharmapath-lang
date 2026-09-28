import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';

export default function PaymentFailedScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { planId, returnTo } = route?.params || {};

  const handleTryAgain = () => {
    // Per your instructions: retry goes back to Checkout (payment_2) with the
    // same plan, not back to Choose Plan.
    navigation.replace('Checkout', { planId, returnTo });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Ionicons name="chevron-back" size={26} color={colors.border} onPress={() => navigation.goBack()} />
        </View>

        <Text style={styles.title}>Payment Failed</Text>

        <View style={styles.iconCircle}>
          <Ionicons name="close" size={70} color="#fff" />
        </View>

        <Text style={styles.bigText}>Payment failed</Text>

        <Pressable style={styles.retryButton} onPress={handleTryAgain}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>

      <BottomNav
        active="Home"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Language') navigation.navigate('Vocabulary');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
  header: { width: '100%', marginBottom: 20 },
  title: { ...typography.h2, color: colors.accentRedAlt, marginBottom: 50 },
  iconCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.failRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  bigText: { fontSize: 26, fontWeight: '700', color: colors.failRed, marginBottom: 50 },
  retryButton: {
    backgroundColor: colors.purchaseAccent,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 60,
  },
  retryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
