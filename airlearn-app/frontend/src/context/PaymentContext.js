import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTITLEMENTS_KEY = 'purchasedBatches';

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  // Shape: { [batchId]: { tier: 'videos' | 'videos_live', planId, purchasedAt } }
  const [purchasedBatches, setPurchasedBatches] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ENTITLEMENTS_KEY);
        if (raw) setPurchasedBatches(JSON.parse(raw));
      } catch (e) {
        // no persisted entitlements yet — start fresh
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const grantBatchAccess = useCallback((batchId, plan, purchasedAt = Date.now()) => {
    setPurchasedBatches((prev) => {
      const next = {
        ...prev,
        [batchId]: { tier: plan.tier, planId: plan.id, purchasedAt },
      };
      AsyncStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify(next)).catch(() => {});
      // TODO once backend exists: this should really be driven by a server-side
      // entitlements check (after Razorpay payment verification), not just local
      // storage — a user could otherwise "unlock" content by clearing app data
      // the other way, or lose access if they reinstall. Fine for development.
      return next;
    });
  }, []);

  const clearPurchasedBatches = useCallback(async () => {
    setPurchasedBatches({});
    await AsyncStorage.removeItem(ENTITLEMENTS_KEY).catch(() => {});
  }, []);

  const hasAnyBatchAccess = useCallback(
    () => Object.keys(purchasedBatches).length > 0,
    [purchasedBatches]
  );

  const hasBatchAccess = useCallback(
    (batchId) => !!purchasedBatches[batchId],
    [purchasedBatches]
  );

  const hasLiveAccess = useCallback(
    (batchId) => purchasedBatches[batchId]?.tier === 'videos_live',
    [purchasedBatches]
  );

  const hasAnyLiveAccess = useCallback(
    () => Object.values(purchasedBatches).some((b) => b.tier === 'videos_live'),
    [purchasedBatches]
  );

  return (
    <PaymentContext.Provider
      value={{
        loaded,
        purchasedBatches,
        grantBatchAccess,
        clearPurchasedBatches,
        hasAnyBatchAccess,
        hasBatchAccess,
        hasLiveAccess,
        hasAnyLiveAccess,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePayment must be used within PaymentProvider');
  return ctx;
}
