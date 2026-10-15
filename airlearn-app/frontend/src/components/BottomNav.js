import React, { useCallback, useRef } from 'react';
import { View, Pressable, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useBottomNavContext } from '../context/BottomNavContext';

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
  const bottomNavContext = useBottomNavContext();
  const registerNavigation = bottomNavContext?.registerNavigation;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;

  const handleNavigate = useCallback((key) => {
    onNavigateRef.current?.(key);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!registerNavigation) return undefined;
      return registerNavigation({ active, onNavigate: handleNavigate });
    }, [active, registerNavigation, handleNavigate])
  );

  if (bottomNavContext) return null;
  return <BottomNavBar active={active} onNavigate={onNavigate} />;
}

function BottomNavBar({ active, onNavigate, bottomInset = 0 }) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset, height: 68 + bottomInset }]}>
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

export function PersistentBottomNav() {
  const bottomNavContext = useBottomNavContext();
  const insets = useSafeAreaInsets();
  if (!bottomNavContext?.navigation) return null;

  return (
    <BottomNavBar
      active={bottomNavContext.navigation.active}
      onNavigate={bottomNavContext.navigation.onNavigate}
      bottomInset={insets.bottom}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.navInactiveBg,
    flexShrink: 0,
    backgroundColor: colors.background,
    elevation: 8,
    zIndex: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 30, height: 30 },
});
