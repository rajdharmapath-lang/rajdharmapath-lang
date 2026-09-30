import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import BottomNav from '../components/BottomNav';
import StaggeredSlideItem from '../components/StaggeredSlideItem';
import { batches } from '../data/courses';
import { getQuizzesForBatch } from '../data/quizzes';

export default function QuizListScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const batchId = route?.params?.batchId || 'foundation';
  const batch = batches.find((b) => b.id === batchId);
  const quizzes = getQuizzesForBatch(batchId);

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>{batch?.name || 'Batch'}</Text>
          <View style={{ width: 26 }} />
        </View>

        <FlatList
          data={quizzes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item, index }) => (
            <StaggeredSlideItem index={index} style={styles.rowEntry}>
              <Pressable
                style={styles.row}
                onPress={() => navigation.navigate('QuizIntro', { batchId, quizId: item.id })}
              >
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
              </Pressable>
            </StaggeredSlideItem>
          )}
        />
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
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt, fontSize: 20 },
  rowEntry: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  rowTitle: { fontSize: 17, color: colors.textDark },
});
