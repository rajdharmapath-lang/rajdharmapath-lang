import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

/**
 * A plain, reusable full-screen loading state — not a route most of the app
 * navigates to directly, but a component any screen can render in place of
 * its content while waiting on something (e.g. an initial data fetch once a
 * backend exists). onBack is optional, same reasoning as NoInternetScreen.
 */
export default function LoadingScreen({ onBack, message = 'Loading....' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.border} />
        </Pressable>
      )}
      <View style={styles.content}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  text: { fontSize: 18, fontWeight: '700', color: colors.foundationRedDark },
});
