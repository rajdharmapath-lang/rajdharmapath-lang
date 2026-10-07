import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { paymentApi } from '../api/client';
import { useAuth } from './AuthContext';

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  // Shape: { [batchId]: { tier, planId, purchasedAt, validUntil } }
  const { user } = useAuth();
  const [purchasedBatches, setPurchasedBatches] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setPurchasedBatches({});
    setLoaded(false);

    (async () => {
      if (!user?.id) {
        setLoaded(true);
        return;
      }

      try {
        const { data } = await paymentApi.getEntitlements();
        if (active) setPurchasedBatches(data.purchasedBatches || {});
      } catch (error) {
        if (active) setPurchasedBatches({});
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const grantBatchAccess = useCallback((batchId, plan, entitlement = {}) => {
    setPurchasedBatches((prev) => {
      return {
        ...prev,
        [batchId]: {
          tier: plan.tier,
          planId: plan.id,
          purchasedAt: entitlement.purchasedAt || Date.now(),
          validUntil: entitlement.validUntil || null,
        },
      };
    });
  }, []);

  const clearPurchasedBatches = useCallback(async () => {
    setPurchasedBatches({});
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
