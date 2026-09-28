import React, { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import LogoMark from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';

const MIN_DISPLAY_MS = 1200; // keep the splash visible briefly even if auth check is instant

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    const startedAt = Date.now();

    const proceed = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(MIN_DISPLAY_MS - elapsed, 0);
      setTimeout(() => {
        if (user) {
          navigation.replace('Home');
        } else {
          navigation.replace('PhoneEntry');
        }
      }, remaining);
    };

    if (!isLoading) {
      proceed();
    }
    // If isLoading is still true, the effect re-runs when it flips to false
    // (AuthContext resolves its stored-token check), since isLoading is a dep.
  }, [isLoading]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LogoMark size={180} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
