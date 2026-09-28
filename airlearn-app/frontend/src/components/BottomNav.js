import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const TABS = [
  { key: 'Home', icon: 'home', label: 'Home' },
  { key: 'Language', glyph: 'A文', label: 'Language' },
  { key: 'Videos', icon: 'play-circle-outline', label: 'Videos' },
  { key: 'Profile', icon: 'person-outline', label: 'Profile' },
];

export default function BottomNav({ active, onNavigate }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate && onNavigate(tab.key)}
          >
            {tab.glyph ? (
              <View
                style={[
                  styles.glyphBox,
                  { backgroundColor: isActive ? 'transparent' : colors.navInactiveBg },
                ]}
              >
                <Text style={[styles.glyphText, isActive && { color: colors.homeOrange }]}>
                  {tab.glyph}
                </Text>
              </View>
            ) : (
              <Ionicons
                name={tab.icon}
                size={26}
                color={isActive ? colors.homeOrange : colors.navInactive}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.navInactiveBg,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glyphBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  glyphText: { fontSize: 14, fontWeight: '700', color: colors.navInactive },
});
