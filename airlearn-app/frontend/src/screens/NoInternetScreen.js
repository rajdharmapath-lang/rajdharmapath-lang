import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useNetwork } from '../context/NetworkContext';

/**
 * onBack: pass a handler only when this is reachable as a normal navigable
 * screen with something to go back to. When rendered as a root-level overlay
 * (the main use case — see App.js wiring notes), there's nothing to go back
 * to, so the back chevron is omitted rather than shown non-functional.
 */
export default function NoInternetScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { recheck } = useNetwork();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await recheck();
    setIsRetrying(false);
    // If still offline, this screen simply keeps rendering (the app root
    // decides whether to show it based on isConnected) — no error state needed.
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>
      )}

      <View style={styles.content}>
        <Ionicons name="wifi-outline" size={90} color={colors.homeOrangeLight} />
        <Text style={styles.title}>No Internet Connection</Text>

        <Pressable style={styles.retryButton} onPress={handleRetry} disabled={isRetrying}>
          <Text style={styles.retryText}>{isRetrying ? 'Checking...' : 'Retry'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 200 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foundationRedDark,
    marginTop: 24,
    marginBottom: 40,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.homeOrangeLight,
    borderRadius: 30,
    paddingHorizontal: 60,
    paddingVertical: 16,
  },
  retryText: { color: colors.homeOrangeLight, fontWeight: '600', fontSize: 16 },
});
