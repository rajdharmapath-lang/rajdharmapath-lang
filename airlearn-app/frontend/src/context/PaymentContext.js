import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { paymentApi } from '../api/client';
import { useAuth } from './AuthContext';

const PaymentContext = createContext(null);
export const FOUNDATION_FREE_TRIAL_LIMIT = 3;

export function PaymentProvider({ children }) {
  // Shape: { [batchId]: { tier, planId, purchasedAt, validUntil } }
  const { user } = useAuth();
  const [purchasedBatches, setPurchasedBatches] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [foundationTrialLessonIds, setFoundationTrialLessonIds] = useState([]);
  const [foundationTrialsLoaded, setFoundationTrialsLoaded] = useState(false);
  const [foundationTrialLoadError, setFoundationTrialLoadError] = useState(null);
  const foundationTrialLessonIdsRef = React.useRef([]);
  const foundationTrialQueueRef = React.useRef(Promise.resolve());
  const foundationTrialStorageKey = `foundationFreeTrialLessonIds:${user?.id || 'guest'}`;

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

  useEffect(() => {
    let active = true;
    foundationTrialLessonIdsRef.current = [];
    foundationTrialQueueRef.current = Promise.resolve();
    setFoundationTrialLessonIds([]);
    setFoundationTrialsLoaded(false);
    setFoundationTrialLoadError(null);

    AsyncStorage.getItem(foundationTrialStorageKey)
      .then((storedIds) => {
        const lessonIds = storedIds ? JSON.parse(storedIds) : [];
        if (
          !Array.isArray(lessonIds) ||
          lessonIds.some((lessonId) => typeof lessonId !== 'string')
        ) {
          throw new Error('Stored Foundation preview data is invalid.');
        }
        if (active) {
          foundationTrialLessonIdsRef.current = lessonIds;
          setFoundationTrialLessonIds(lessonIds);
        }
      })
      .catch((error) => {
        console.error('Could not load Foundation free preview history:', error);
        if (active) setFoundationTrialLoadError(error);
      })
      .finally(() => {
        if (active) setFoundationTrialsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [foundationTrialStorageKey]);

  const claimFoundationTrial = useCallback(
    (lessonId) => {
      const claim = foundationTrialQueueRef.current.then(async () => {
        if (!foundationTrialsLoaded) {
          throw new Error('Foundation preview access is still loading.');
        }
        if (foundationTrialLoadError) {
          throw new Error('Foundation preview access could not be verified.');
        }
        if (foundationTrialLessonIdsRef.current.includes(lessonId)) return true;
        if (foundationTrialLessonIdsRef.current.length >= FOUNDATION_FREE_TRIAL_LIMIT) {
          return false;
        }

        const nextLessonIds = [...foundationTrialLessonIdsRef.current, lessonId];
        await AsyncStorage.setItem(
          foundationTrialStorageKey,
          JSON.stringify(nextLessonIds)
        );
        foundationTrialLessonIdsRef.current = nextLessonIds;
        setFoundationTrialLessonIds(nextLessonIds);
        return true;
      });
      foundationTrialQueueRef.current = claim.catch(() => undefined);
      return claim;
    },
    [foundationTrialLoadError, foundationTrialStorageKey, foundationTrialsLoaded]
  );

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

  const hasPrimeAccess = useCallback(
    () => !loaded || hasAnyBatchAccess(),
    [loaded, hasAnyBatchAccess]
  );

  const hasBatchAccess = useCallback(
    (batchId) => hasPrimeAccess() || !!purchasedBatches[batchId],
    [hasPrimeAccess, purchasedBatches]
  );

  const hasLiveAccess = useCallback(
    (batchId) => purchasedBatches[batchId]?.tier === 'videos_live',
    [purchasedBatches]
  );

  const hasAnyLiveAccess = useCallback(
    () => Object.values(purchasedBatches).some((batch) => batch.tier === 'videos_live'),
    [purchasedBatches]
  );

  return (
    <PaymentContext.Provider
      value={{
        loaded,
        purchasedBatches,
        foundationTrialLessonIds,
        foundationTrialsLoaded,
        foundationTrialLoadError,
        claimFoundationTrial,
        grantBatchAccess,
        clearPurchasedBatches,
        hasAnyBatchAccess,
        hasPrimeAccess,
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
