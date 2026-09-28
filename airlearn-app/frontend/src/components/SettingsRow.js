import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function SettingsRow({ icon, label, onPress, isLast, showChevron = true }) {
  return (
    <Pressable style={[styles.row, !isLast && styles.divider]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.homeOrange} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      {showChevron && <Ionicons name="chevron-forward" size={18} color={colors.textLabel} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.strokeTrackLight,
  },
  icon: { marginRight: 14 },
  label: { flex: 1, fontSize: 16, color: colors.textDark },
});
