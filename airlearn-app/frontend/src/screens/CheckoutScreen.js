import React, { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
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
  const [dialog, setDialog] = useState(null);

  const total = Math.max((plan?.price || 0) - discount, 0);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = mockCoupons[code];
    if (!coupon) {
      setDialog({ title: 'Invalid coupon', message: 'That coupon code is not valid.' });
      return;
    }
    setDiscount(coupon.amountOff);
  };

  const handleProceedToPay = async () => {
    if (!plan) return;
    setIsPaying(true);
    try {
      const result = await processPayment({
        planId: plan.id,
        couponCode: discount > 0 ? couponInput.trim().toUpperCase() : undefined,
      });
      if (result.cancelled) return;
      if (result.success) {
        grantBatchAccess(plan.batchId, plan, result.entitlement.purchasedAt);
        navigation.replace('PaymentSuccess', { planId: plan.id, returnTo });
      } else {
        navigation.replace('PaymentFailed', { planId: plan.id, returnTo });
      }
    } catch (error) {
      setDialog({
        title: 'Could not complete payment',
        message: error?.response?.data?.message || error.message,
      });
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

      <Modal
        visible={Boolean(dialog)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDialog(null)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss dialog"
          />
          <View
            style={[styles.dialog, { maxWidth: Math.min(maxWidth - 48, 420) }]}
            accessibilityViewIsModal
          >
            <View style={styles.dialogIcon}>
              <Ionicons name="alert-circle-outline" size={26} color={colors.homeOrange} />
            </View>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMessage}>{dialog?.message}</Text>
            <Pressable
              style={styles.dialogButton}
              onPress={() => setDialog(null)}
              accessibilityRole="button"
            >
              <Text style={styles.dialogButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  dialog: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  dialogIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.homeOrangeBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: { fontSize: 20, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  dialogMessage: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textLabel,
    textAlign: 'center',
    marginTop: 8,
  },
  dialogButton: {
    minHeight: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  dialogButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptyText: { textAlign: 'center', marginTop: 60, color: colors.textLabel },
});
