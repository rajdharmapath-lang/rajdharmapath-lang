import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, userApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true); // bootstrapping (checking stored token)
  const [user, setUser] = useState(null); // { name, email, occupation, language, progress... }
  const [pendingPhone, setPendingPhone] = useState(null); // { phone, dialCode } while mid-OTP-flow

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          const res = await userApi.getMe();
          setUser(res.data.user);
        }
      } catch (e) {
        // token invalid/expired — fall through to logged-out state
        await AsyncStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const sendOtp = useCallback(async (phone, dialCode) => {
    const res = await authApi.sendOtp(phone, dialCode);
    setPendingPhone({ phone, dialCode, reqId: res.data.reqId });
  }, []);

  const verifyOtp = useCallback(
    async (code) => {
      if (!pendingPhone) throw new Error('No phone number pending verification');
      const res = await authApi.verifyOtp(
        pendingPhone.phone,
        pendingPhone.dialCode,
        code,
        pendingPhone.reqId
      );
      const { token, isNewUser, user: verifiedUser } = res.data;
      await AsyncStorage.setItem('authToken', token);
      setUser(verifiedUser || null);
      return { isNewUser };
    },
    [pendingPhone]
  );

  const createAccount = useCallback(async ({ name, email, occupation }) => {
    const res = await userApi.createAccount({ name, email, occupation });
    setUser(res.data.user);
  }, []);

  const updateAccount = useCallback(async ({ name, email, occupation }) => {
    const res = await userApi.updateProfile({ name, email, occupation });
    setUser(res.data.user);
  }, []);

  const setLanguage = useCallback(async (language) => {
    const res = await userApi.setLanguage(language);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('authToken');
    setUser(null);
    setPendingPhone(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    await userApi.deleteAccount();
    await AsyncStorage.removeItem('authToken');
    setUser(null);
    setPendingPhone(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        pendingPhone,
        sendOtp,
        verifyOtp,
        createAccount,
        updateAccount,
        setLanguage,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
