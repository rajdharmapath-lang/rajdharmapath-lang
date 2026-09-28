import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  // Starts optimistic (true) so the app doesn't flash "No Internet" before the
  // first NetInfo event arrives.
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable can be null while NetInfo is still determining it —
      // in that case fall back to isConnected (device has a network interface up).
      const reachable = state.isInternetReachable ?? state.isConnected;
      setIsConnected(!!reachable);
    });
    return () => unsubscribe();
  }, []);

  const recheck = async () => {
    const state = await NetInfo.fetch();
    const reachable = state.isInternetReachable ?? state.isConnected;
    setIsConnected(!!reachable);
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
