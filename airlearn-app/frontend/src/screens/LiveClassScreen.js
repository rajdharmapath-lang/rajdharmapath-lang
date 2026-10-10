import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import BottomNav from '../components/BottomNav';

// TEMPORARY: Aswin hasn't sent the Live Class screen design yet. This exists
// only so "Join Live" has somewhere real to go instead of crashing the app.
// Replace with the real screen once that design arrives.
export default function LiveClassScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
        <Ionicons name="chevron-back" size={26} color={colors.border} />
      </Pressable>
      <View style={styles.content}>
        <Ionicons name="videocam-outline" size={64} color={colors.homeOrangeLight} />
        <Text style={styles.text}>Live Class screen coming soon</Text>
      </View>
      <BottomNav
        active="Videos"
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
  flex: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100, gap: 16 },
  text: { ...typography.bodyBold, color: colors.textLabel, textAlign: 'center' },
});
