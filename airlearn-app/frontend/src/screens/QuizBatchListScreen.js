import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import { batches } from '../data/courses';

export default function QuizBatchListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={styles.title}>Quiz</Text>

          {batches.map((batch) => (
            <Pressable
              key={batch.id}
              style={[styles.card, { backgroundColor: colors[batch.colorBg] }]}
              onPress={() => navigation.navigate('QuizList', { batchId: batch.id })}
            >
              <View style={styles.cardText}>
                <Text style={[styles.cardName, { color: colors[batch.colorAccent] }]}>
                  {batch.name}
                </Text>
                <Text style={styles.cardSubtitle}>{batch.subtitle}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors[batch.colorAccent] }]}>
                <Text style={styles.badgeGlyph}>{batch.glyph}</Text>
              </View>
            </Pressable>
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
  container: { paddingHorizontal: 20, paddingTop: 24 },
  title: { ...typography.h2, color: colors.accentRedAlt, textAlign: 'center', marginBottom: 24 },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
