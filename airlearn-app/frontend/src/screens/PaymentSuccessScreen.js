import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';

export default function PaymentSuccessScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const returnTo = route?.params?.returnTo;

  const handleContinue = () => {
    if (returnTo?.name) {
      navigation.replace(returnTo.name, returnTo.params);
    } else {
      navigation.replace('Home');
    }
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Ionicons name="chevron-back" size={26} color={colors.border} onPress={() => navigation.goBack()} />
        </View>

        <Text style={styles.title}>Payment Successful</Text>

        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={70} color="#fff" />
        </View>

        <Text style={styles.bigText}>Payment Successful</Text>

        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </Pressable>
      </View>

      <BottomNav
        active="Home"
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, alignItems: 'center' },
  header: { width: '100%', marginBottom: 20 },
  title: { ...typography.h2, color: colors.accentRedAlt, marginBottom: 50 },
  iconCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  bigText: { fontSize: 26, fontWeight: '700', color: colors.successGreen },
  continueButton: {
    backgroundColor: colors.successGreen,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 30,
  },
  continueButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
