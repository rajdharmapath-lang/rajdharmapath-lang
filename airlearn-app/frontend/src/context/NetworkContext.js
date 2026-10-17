import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext(null);
const OFFLINE_CONFIRMATION_DELAY_MS = 2500;

function isAppActive() {
  return AppState.currentState === 'active' || AppState.currentState === null;
}

export function NetworkProvider({ children }) {
  // Starts optimistic (true) so the app doesn't flash "No Internet" before the
  // first NetInfo event arrives.
  const [isConnected, setIsConnected] = useState(true);
  const offlineTimer = useRef(null);

  useEffect(() => {
    const updateConnectivity = (state) => {
      if (!isAppActive()) return;

      const reachable = state.isInternetReachable ?? state.isConnected;
      if (reachable) {
        if (offlineTimer.current) {
          clearTimeout(offlineTimer.current);
          offlineTimer.current = null;
        }
        setIsConnected(true);
        return;
      }

      if (!offlineTimer.current) {
        offlineTimer.current = setTimeout(() => {
          offlineTimer.current = null;
          if (isAppActive()) {
            setIsConnected(false);
          }
        }, OFFLINE_CONFIRMATION_DELAY_MS);
      }
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null while NetInfo is still determining it —
      // in that case fall back to isConnected (device has a network interface up).
      updateConnectivity(state);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;

      NetInfo.fetch().then(updateConnectivity).catch((error) => {
        console.warn('[network] Could not refresh connection state', error);
      });
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      if (offlineTimer.current) {
        clearTimeout(offlineTimer.current);
      }
    };
  }, []);

  const recheck = async () => {
    const state = await NetInfo.fetch();
    const reachable = state.isInternetReachable ?? state.isConnected;
    if (reachable) {
      if (offlineTimer.current) {
        clearTimeout(offlineTimer.current);
        offlineTimer.current = null;
      }
      setIsConnected(true);
    } else if (!offlineTimer.current) {
      offlineTimer.current = setTimeout(() => {
        offlineTimer.current = null;
        if (isAppActive()) {
          setIsConnected(false);
        }
      }, OFFLINE_CONFIRMATION_DELAY_MS);
    }
    return !!reachable;
  };

  return (
    <NetworkContext.Provider value={{ isConnected, recheck }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
