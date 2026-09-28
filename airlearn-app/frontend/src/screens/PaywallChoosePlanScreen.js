import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { batches } from '../data/courses';
import { plansByBatch } from '../data/plans';

export default function PaywallChoosePlanScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const returnTo = route?.params?.returnTo;

  const handleSelectPlan = (plan) => {
    navigation.navigate('Checkout', { planId: plan.id, returnTo });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView>
        <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.border} />
            </Pressable>
            <Text style={styles.title}>Choose Plan</Text>
            <View style={{ width: 26 }} />
          </View>

          {batches.map((batch) => (
            <View
              key={batch.id}
              style={[styles.batchSection, { backgroundColor: colors[batch.colorBg] }]}
            >
              <Text style={[styles.batchName, { color: colors[batch.colorAccent] }]}>
                {batch.name}
              </Text>

              {plansByBatch[batch.id].map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[styles.planRow, { borderColor: colors[batch.colorAccent] }]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <View style={styles.priceCol}>
                    <Text style={[styles.price, { color: colors[batch.colorAccent] }]}>
                      ₹{plan.price}
                    </Text>
                    <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>
                  </View>
                  <Text style={styles.duration}>{plan.duration}</Text>
                  <Text style={styles.features}>{plan.features}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav
        active="Home"
        onNavigate={(key) => {
          if (key === 'Home') navigation.navigate('Home');
          if (key === 'Videos') navigation.navigate('BatchList');
          if (key === 'Language') navigation.navigate('Vocabulary');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  batchSection: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  batchName: { fontSize: 19, fontWeight: '700', marginBottom: 12 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.card,
    gap: 8,
  },
  priceCol: { minWidth: 66 },
  price: { fontSize: 18, fontWeight: '700' },
  originalPrice: {
    fontSize: 12,
    color: colors.strikethroughGray,
    textDecorationLine: 'line-through',
  },
  duration: { fontSize: 13, color: colors.textDark, width: 66 },
  features: { fontSize: 13, color: colors.textDark, flex: 1 },
});
