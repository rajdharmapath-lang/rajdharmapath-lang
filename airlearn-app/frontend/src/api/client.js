import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const API_BASE_URL = 'https://vq9xhqu79r.c35.airoapp.ai/api';

async function resolveBaseUrl() {
  return API_BASE_URL;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export async function getAuthenticatedDownloadRequest(path) {
  const token = await AsyncStorage.getItem('authToken');
  return {
    url: `${API_BASE_URL}${path}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

client.interceptors.request.use(async (config) => {
  config.baseURL = await resolveBaseUrl();
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendOtp: (phone, dialCode) => client.post('/auth/send-otp', { phone, dialCode }),
  verifyOtp: (phone, dialCode, code, reqId) =>
    client.post('/auth/verify-otp', { phone, dialCode, code, reqId }),
  resendOtp: (phone, dialCode) => client.post('/auth/send-otp', { phone, dialCode }),
};

export const userApi = {
  createAccount: (payload) => client.post('/user/create-account', payload),
  updateProfile: (payload) => client.patch('/user/profile', payload),
  setLanguage: (language) => client.post('/user/set-language', { language }),
  getMe: () => client.get('/user/me'),
  claimStrokePreview: () => client.post('/user/practice-previews/stroke/claim'),
  deleteAccount: () => client.delete('/user/account'),
  getFoundationWelcomeVideo: () => client.get('/user/videos/foundation-welcome'),
};

export const paymentApi = {
  createOrder: (payload) => client.post('/payments/create-order', payload),
  verifyPayment: (payload) => client.post('/payments/verify', payload),
  getEntitlements: () => client.get('/payments/entitlements'),
};

export default client;
