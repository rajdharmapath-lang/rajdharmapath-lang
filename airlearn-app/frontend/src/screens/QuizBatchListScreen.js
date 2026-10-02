import React, { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches } from '../data/courses';

const BATCH_ARTWORK = {
  foundation: require('../../assets/foundatin Batch asset.png'),
  elevation: require('../../assets/Elevation Batch asset.png'),
  distinction: require('../../assets/Distinction Batch asset.png'),
};

export default function QuizBatchListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const cardAnimations = useRef(batches.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      120,
      cardAnimations.map((animation) =>
        Animated.timing(animation, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [cardAnimations]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.title}>Practice</Text>
            <View style={styles.headerSpacer} />
          </View>

          {batches.map((batch, index) => (
            <Animated.View
              key={batch.id}
              style={[
                styles.cardAnimation,
                {
                  opacity: cardAnimations[index],
                  transform: [
                    {
                      translateX: cardAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-24, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable
                style={[styles.card, { backgroundColor: colors[batch.colorBg] }]}
                onPress={() => navigation.navigate('QuizList', { batchId: batch.id })}
              >
                <Image
                  source={BATCH_ARTWORK[batch.id]}
                  style={styles.batchArtwork}
                  resizeMode="stretch"
                  accessible={false}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardText}>
                    <Text style={[styles.cardName, { color: colors[batch.colorAccent] }]}>
                      {batch.name}
                    </Text>
                    <Text style={styles.cardSubtitle}>{batch.subtitle}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors[batch.colorAccent] }]}>
                    <Text style={styles.badgeGlyph}>{batch.glyph}</Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

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
  scrollContent: { flexGrow: 1 },
  cardAnimation: { flexGrow: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', flex: 1 },
  headerSpacer: { width: 26 },
  card: {
    flexGrow: 1,
    minHeight: 164,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 54,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  batchArtwork: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 58,
  },
  cardText: { flex: 1 },
  cardName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: colors.textDark },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
