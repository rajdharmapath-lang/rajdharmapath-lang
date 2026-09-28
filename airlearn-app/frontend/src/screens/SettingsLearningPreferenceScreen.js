import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { VOICE_SPEED_OPTIONS, getVoiceSpeed, setVoiceSpeed } from '../services/audio';

export default function SettingsLearningPreferenceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const [selectedSpeed, setSelectedSpeed] = useState(getVoiceSpeed());

  const handleSelectSpeed = (speed) => {
    setSelectedSpeed(speed);
    setVoiceSpeed(speed);
  };

  const handleResetHistory = () => {
    Alert.alert(
      'Reset Practice History',
      'This clears your Stroke and Speech practice progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Done', 'Your practice history has been reset.');
          },
        },
      ]
    );
  };

  const handleMicPermission = () => {
    Linking.openSettings();
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Learning Preference</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="pulse-outline" size={20} color={colors.homeOrange} style={{ marginRight: 10 }} />
            <Text style={styles.cardTitle}>Pronunciation Voice Speed</Text>
          </View>

          <View style={styles.speedRow}>
            {VOICE_SPEED_OPTIONS.map((speed) => {
              const isSelected = speed === selectedSpeed;
              return (
                <Pressable
                  key={speed}
                  style={styles.speedStop}
                  onPress={() => handleSelectSpeed(speed)}
                >
                  <View style={[styles.dot, isSelected && styles.dotSelected]} />
                  <Text style={[styles.speedLabel, isSelected && styles.speedLabelSelected]}>
                    {speed.toFixed(2).replace(/0$/, '')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="refresh" size={20} color={colors.homeOrange} style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.cardTitle}>Reset Practice History</Text>
              <Text style={styles.cardSubtitle}>Clear your Stroke and Speech practice progress</Text>
            </View>
          </View>
          <Pressable style={styles.actionButton} onPress={handleResetHistory}>
            <Text style={styles.actionButtonText}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="mic-outline" size={20} color={colors.homeOrange} style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.cardTitle}>Microphone permission</Text>
              <Text style={styles.cardSubtitle}>Required for Speech Practice</Text>
            </View>
          </View>
          <Pressable style={styles.actionButton} onPress={handleMicPermission}>
            <Text style={styles.actionButtonText}>Settings</Text>
          </Pressable>
        </View>
      </View>

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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, fontSize: 20 },
  card: {
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, color: colors.textDark, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, color: colors.textLabel, marginTop: 2 },
  speedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  speedStop: { alignItems: 'center', width: 44 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.homeOrangeLight,
    marginBottom: 8,
  },
  dotSelected: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  speedLabel: { fontSize: 12, color: colors.textLabel },
  speedLabelSelected: { color: colors.textDark, fontWeight: '700' },
  actionButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.homeOrangeLight,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
  },
  actionButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
