import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useResponsive } from '../theme/responsive';
import { getPlan, mockCoupons } from '../data/plans';
import { processPayment } from '../services/payment';
import { usePayment } from '../context/PaymentContext';

export default function CheckoutScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { maxWidth } = useResponsive();
  const { grantBatchAccess } = usePayment();
  const { planId, returnTo } = route?.params || {};
  const plan = getPlan(planId);

  const [couponInput, setCouponInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isPaying, setIsPaying] = useState(false);

  const total = Math.max((plan?.price || 0) - discount, 0);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = mockCoupons[code];
    if (!coupon) {
      Alert.alert('Invalid coupon', 'That coupon code is not valid.');
      return;
    }
    setDiscount(coupon.amountOff);
  };

  const handleProceedToPay = async () => {
    if (!plan) return;
    setIsPaying(true);
    try {
      // TODO once Razorpay key is available: this is where the real order
      // gets created and the Razorpay checkout sheet opens — see the comment
      // block in services/payment.js for the exact integration steps.
      const result = await processPayment({ planId: plan.id, amount: total });
      if (result.success) {
        grantBatchAccess(plan.batchId, plan);
        navigation.replace('PaymentSuccess', { planId: plan.id, returnTo });
      } else {
        navigation.replace('PaymentFailed', { planId: plan.id, returnTo });
      }
    } finally {
      setIsPaying(false);
    }
  };

  if (!plan) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.emptyText}>Plan not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.container, { maxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.border} />
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.sectionLabel}>Coupon Code</Text>
        <TextInput
          style={styles.couponInput}
          placeholder="Enter coupon code"
          placeholderTextColor={colors.strokeAccent}
          value={couponInput}
          onChangeText={setCouponInput}
          autoCapitalize="characters"
        />
        <Pressable style={styles.applyButton} onPress={handleApplyCoupon}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </Pressable>

        <View style={styles.priceCard}>
          <Text style={styles.priceCardTitle}>Price Details</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Plan price</Text>
            <Text style={styles.priceValue}>₹ {plan.price}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Coupon discount</Text>
              <Text style={styles.priceValue}>- ₹ {discount}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total price</Text>
            <Text style={styles.totalValue}>₹ {total}</Text>
          </View>
        </View>

        <Pressable style={styles.payButton} onPress={handleProceedToPay} disabled={isPaying}>
          <Text style={styles.payButtonText}>{isPaying ? 'Processing...' : 'Proceed to Pay'}</Text>
        </Pressable>
      </View>
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
    marginBottom: 30,
  },
  title: { ...typography.h2, color: colors.accentRedAlt },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 14 },
  couponInput: {
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: colors.homeOrangeLight,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 30,
  },
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  priceCard: {
    borderWidth: 1,
    borderColor: colors.strokeAccent,
    backgroundColor: colors.homeOrangeBgAlt,
    borderRadius: 16,
    padding: 18,
    marginBottom: 40,
  },
  priceCardTitle: { fontSize: 17, fontWeight: '700', color: colors.strokeAccent, marginBottom: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  priceLabel: { fontSize: 14, color: colors.textDark },
  priceValue: { fontSize: 14, color: colors.textDark, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.strokeTrackLight, marginVertical: 4 },
  totalLabel: { fontSize: 15, color: colors.textDark, fontWeight: '700', marginTop: 6 },
  totalValue: { fontSize: 15, color: colors.textDark, fontWeight: '700', marginTop: 6 },
  payButton: {
    backgroundColor: colors.purchaseAccent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  payButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
