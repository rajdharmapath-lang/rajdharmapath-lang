import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PaymentProvider } from './src/context/PaymentContext';
import { VocabularyProvider } from './src/context/VocabularyContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { NetworkProvider, useNetwork } from './src/context/NetworkContext';
import { loadVoiceSpeed } from './src/services/audio';

import NoInternetScreen from './src/screens/NoInternetScreen';

// --- Onboarding / auth -------------------------------------------------------
import PhoneEntryScreen from './src/screens/PhoneEntryScreen';
import OtpVerifyScreen from './src/screens/OtpVerifyScreen';
import CreateAccountScreen from './src/screens/CreateAccountScreen';
import LanguageChooseScreen from './src/screens/LanguageChooseScreen';

// --- Home ---------------------------------------------------------------------
import HomeScreen from './src/screens/HomeScreen';

// --- Videos ---------------------------------------------------------------------
import BatchListScreen from './src/screens/BatchListScreen';
import VideoListScreen from './src/screens/VideoListScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import LiveClassScreen from './src/screens/LiveClassScreen';

// --- Stroke ---------------------------------------------------------------------
import CharacterSelectScreen from './src/screens/CharacterSelectScreen';
import StrokePracticeScreen from './src/screens/StrokePracticeScreen';
import StrokeResultScreen from './src/screens/StrokeResultScreen';

// --- Vocabulary ---------------------------------------------------------------------
import VocabularyScreen from './src/screens/VocabularyScreen';
import VocabularyCategoryListScreen from './src/screens/VocabularyCategoryListScreen';
import FullVocabularyScreen from './src/screens/FullVocabularyScreen';

// --- Speech ---------------------------------------------------------------------
import SpeechWordListScreen from './src/screens/SpeechWordListScreen';
import SpeechPracticeScreen from './src/screens/SpeechPracticeScreen';
import SpeechResultScreen from './src/screens/SpeechResultScreen';

// --- Quiz ---------------------------------------------------------------------
import QuizBatchListScreen from './src/screens/QuizBatchListScreen';
import QuizListScreen from './src/screens/QuizListScreen';
import QuizIntroScreen from './src/screens/QuizIntroScreen';
import QuizPlayScreen from './src/screens/QuizPlayScreen';
import QuizResultScreen from './src/screens/QuizResultScreen';

// --- Payment / paywall ---------------------------------------------------------------------
import PaywallChoosePlanScreen from './src/screens/PaywallChoosePlanScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';
import PaymentFailedScreen from './src/screens/PaymentFailedScreen';

// --- Settings ---------------------------------------------------------------------
import SettingsScreen from './src/screens/SettingsScreen';
import SettingsAccountScreen from './src/screens/SettingsAccountScreen';
import SettingsLanguageScreen from './src/screens/SettingsLanguageScreen';
import SettingsLearningPreferenceScreen from './src/screens/SettingsLearningPreferenceScreen';

const Stack = createNativeStackNavigator();

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="LanguageChoose" component={LanguageChooseScreen} />

      <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />

      <Stack.Screen name="BatchList" component={BatchListScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="VideoList" component={VideoListScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="LiveClass" component={LiveClassScreen} />

      <Stack.Screen name="CharacterSelect" component={CharacterSelectScreen} />
      <Stack.Screen name="StrokePractice" component={StrokePracticeScreen} />
      <Stack.Screen name="StrokeResult" component={StrokeResultScreen} />

      <Stack.Screen name="Vocabulary" component={VocabularyScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="VocabularyCategoryList" component={VocabularyCategoryListScreen} />
      <Stack.Screen name="FullVocabulary" component={FullVocabularyScreen} />

      <Stack.Screen name="SpeechWordList" component={SpeechWordListScreen} />
      <Stack.Screen name="SpeechPractice" component={SpeechPracticeScreen} />
      <Stack.Screen name="SpeechResult" component={SpeechResultScreen} />

      <Stack.Screen name="QuizBatchList" component={QuizBatchListScreen} />
      <Stack.Screen name="QuizList" component={QuizListScreen} />
      <Stack.Screen name="QuizIntro" component={QuizIntroScreen} />
      <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />

      <Stack.Screen name="PaywallChoosePlan" component={PaywallChoosePlanScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="PaymentFailed" component={PaymentFailedScreen} />

      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="SettingsAccount" component={SettingsAccountScreen} />
      <Stack.Screen name="SettingsLanguage" component={SettingsLanguageScreen} />
      <Stack.Screen
        name="SettingsLearningPreference"
        component={SettingsLearningPreferenceScreen}
      />
    </Stack.Navigator>
  );
}

function AppNavigation() {
  const { isLoading, user } = useAuth();

  if (isLoading) return null;

  return (
    <NavigationContainer onReady={() => ExpoSplashScreen.hideAsync().catch(() => {})}>
      <RootNavigator initialRouteName={user ? 'Home' : 'PhoneEntry'} />
    </NavigationContainer>
  );
}

// Shows the No Internet screen as a full-screen overlay on top of whatever the
// user was doing the moment connectivity drops, then returns them to it once
// back online — rather than a route you navigate to and lose your place.
function ConnectivityGate({ children }) {
  const { isConnected } = useNetwork();
  if (!isConnected) {
    return <NoInternetScreen />;
  }
  return children;
}

export default function App() {
  useEffect(() => {
    loadVoiceSpeed();
  }, []);

  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <PaymentProvider>
            <VocabularyProvider>
              <ProgressProvider>
                <ConnectivityGate>
                  <AppNavigation />
                </ConnectivityGate>
              </ProgressProvider>
            </VocabularyProvider>
          </PaymentProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
