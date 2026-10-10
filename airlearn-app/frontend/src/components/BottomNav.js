import React from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/colors';

const TABS = [
  { key: 'Home', image: require('../../assets/home.png'), label: 'Home' },
  {
    key: 'Language',
    image: require('../../assets/Vocabulary.png'),
    inactiveImage: require('../../assets/Vocabulary1.png'),
    label: 'Language',
  },
  { key: 'Videos', image: require('../../assets/video.png'), label: 'Videos' },
  { key: 'Profile', image: require('../../assets/profile.png'), label: 'Profile' },
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
            <Image
              source={isActive ? tab.image : tab.inactiveImage || tab.image}
              style={[
                styles.icon,
                tab.key !== 'Language' && {
                  tintColor: isActive ? colors.homeOrange : colors.navInactive,
                },
              ]}
              resizeMode="contain"
              accessibilityLabel={tab.label}
            />
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
    height: 68,
    flexShrink: 0,
    backgroundColor: colors.background,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 30, height: 30 },
});
