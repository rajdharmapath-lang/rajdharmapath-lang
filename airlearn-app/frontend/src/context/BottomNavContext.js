import React, { createContext, useCallback, useContext, useState } from 'react';

const BottomNavContext = createContext(null);

export function BottomNavProvider({ children }) {
  const [navigation, setNavigation] = useState(null);

  const registerNavigation = useCallback((config) => {
    const registration = Symbol('bottom-navigation');
    setNavigation({ ...config, registration });
    return () => {
      setNavigation((current) => (
        current?.registration === registration ? null : current
      ));
    };
  }, []);

  return (
    <BottomNavContext.Provider value={{ navigation, registerNavigation }}>
      {children}
    </BottomNavContext.Provider>
  );
}

export function useBottomNavContext() {
  return useContext(BottomNavContext);
}
