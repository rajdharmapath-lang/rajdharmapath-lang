import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PORT = 4000;

// Override without editing code: EXPO_PUBLIC_API_BASE_URL=http://192.168.1.34:4000/api
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Tried in order on first request; the first that answers /health wins.
// localhost comes first on Android because `adb reverse tcp:4000 tcp:4000`
// tunnels over adb and works even when the emulator has no working network.
const CANDIDATE_HOSTS =
  Platform.OS === 'android'
    ? ['localhost', '10.0.2.2', '192.168.1.34']
    : ['localhost', '127.0.0.1'];

const FALLBACK_BASE_URL = `http://localhost:${PORT}/api`;

export const API_CANDIDATES = CANDIDATE_HOSTS.map(
  (host) => `http://${host}:${PORT}/api`
);

export let API_BASE_URL = ENV_BASE_URL || FALLBACK_BASE_URL;

let resolvedBaseUrl = null;

async function isReachable(baseUrl) {
  try {
    const healthUrl = baseUrl.replace(/\/api\/?$/, '') + '/health';
    const res = await axios.get(healthUrl, { timeout: 3000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function resolveBaseUrl() {
  if (resolvedBaseUrl) return resolvedBaseUrl;
  if (ENV_BASE_URL) {
    resolvedBaseUrl = ENV_BASE_URL;
  } else {
    for (const candidate of API_CANDIDATES) {
      if (await isReachable(candidate)) {
        resolvedBaseUrl = candidate;
        break;
      }
    }
    if (!resolvedBaseUrl) resolvedBaseUrl = FALLBACK_BASE_URL;
  }
  API_BASE_URL = resolvedBaseUrl;
  return resolvedBaseUrl;
}

const client = axios.create({
  baseURL: FALLBACK_BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const baseURL = await resolveBaseUrl();
  config.baseURL = baseURL;
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  sendOtp: (phone, dialCode) => client.post('/auth/send-otp', { phone, dialCode }),
  verifyOtp: (phone, dialCode, code) =>
    client.post('/auth/verify-otp', { phone, dialCode, code }),
  resendOtp: (phone, dialCode) => client.post('/auth/send-otp', { phone, dialCode }),
};

export const userApi = {
  createAccount: (payload) => client.post('/user/create-account', payload),
  updateProfile: (payload) => client.patch('/user/profile', payload),
  setLanguage: (language) => client.post('/user/set-language', { language }),
  getMe: () => client.get('/user/me'),
  deleteAccount: () => client.delete('/user/account'),
};

export default client;
