import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_SPEED_KEY = 'pronunciationVoiceSpeed';
const DEFAULT_VOICE_SPEED = 0.95;

// Allowed stops, matching Setting__Learning_Preference.svg exactly.
export const VOICE_SPEED_OPTIONS = [0.75, 0.8, 0.9, 0.95, 1.0];

let currentVoiceSpeed = DEFAULT_VOICE_SPEED;

/**
 * Loads the persisted voice speed preference. Call once at app startup
 * (before any playWordAudio calls need to reflect the saved value).
 */
export async function loadVoiceSpeed() {
  try {
    const raw = await AsyncStorage.getItem(VOICE_SPEED_KEY);
    if (raw) currentVoiceSpeed = JSON.parse(raw);
  } catch (e) {
    // fall back to default
  }
  return currentVoiceSpeed;
}

export function getVoiceSpeed() {
  return currentVoiceSpeed;
}

export async function setVoiceSpeed(rate) {
  currentVoiceSpeed = rate;
  try {
    await AsyncStorage.setItem(VOICE_SPEED_KEY, JSON.stringify(rate));
  } catch (e) {
    // best-effort persistence — the in-memory value is already updated either way
  }
}

// --- Azure integration point -------------------------------------------------
// Once you have an Azure Speech key, replace the body of playWordAudio with a
// call to Azure's TTS REST endpoint, e.g.:
//
//   const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
//     method: 'POST',
//     headers: {
//       'Ocp-Apim-Subscription-Key': AZURE_KEY,
//       'Content-Type': 'application/ssml+xml',
//       'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
//     },
//     body: `<speak version='1.0' xml:lang='zh-CN'>
//              <voice xml:lang='zh-CN' xml:gender='Female' name='zh-CN-XiaoxiaoNeural'>${hanzi}</voice>
//            </speak>`,
//   });
//   const blob = await res.blob(); // then play via expo-av Audio.Sound from a local file/data URI
//
// Keep the playWordAudio(word) call signature the same in the screens — only
// this file needs to change when Azure is wired in. The voice speed preference
// (getVoiceSpeed()) should still apply — map it onto SSML's <prosody rate="">.
// ------------------------------------------------------------------------------

/**
 * Plays pronunciation audio for a vocabulary word.
 * Currently uses on-device text-to-speech (works offline, no API key needed)
 * as a functional placeholder until Azure Speech is connected.
 */
export function playWordAudio(word) {
  if (!word?.hanzi) return;
  Speech.stop();
  Speech.speak(word.hanzi, {
    language: 'zh-CN',
    pitch: 1,
    rate: currentVoiceSpeed,
  });
}

export function stopWordAudio() {
  Speech.stop();
}

