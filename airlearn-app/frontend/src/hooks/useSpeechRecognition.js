import { useCallback, useEffect, useRef, useState } from 'react';
let speechRecognition;
try {
  speechRecognition = require('expo-speech-recognition');
} catch (error) {
  if (!String(error?.message).includes("Cannot find native module 'ExpoSpeechRecognition'")) {
    throw error;
  }
}

const nativeModule = speechRecognition?.ExpoSpeechRecognitionModule;
const nativeEmitter = speechRecognition?.ExpoSpeechRecognitionModuleEmitter;

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState(
    nativeModule ? '' : 'Speech recognition needs the updated custom app. Rebuild and reinstall it to use the microphone.'
  );
  const transcriptRef = useRef('');
  const recordingUriRef = useRef(null);
  const pressedRef = useRef(false);
  const activeRef = useRef(false);
  const startPromiseRef = useRef(null);
  const stopPromiseRef = useRef(null);

  useEffect(() => {
    if (!nativeEmitter) return undefined;

    const subscriptions = [
      nativeEmitter.addListener('start', () => setIsRecognizing(true)),
      nativeEmitter.addListener('result', (event) => {
        const recognizedText = event.results?.[0]?.transcript?.trim() || '';
        transcriptRef.current = recognizedText;
        setTranscript(recognizedText);
      }),
      nativeEmitter.addListener('audioend', (event) => {
        recordingUriRef.current = event.uri || recordingUriRef.current;
      }),
      nativeEmitter.addListener('end', () => {
        activeRef.current = false;
        setIsRecognizing(false);
        if (stopPromiseRef.current) {
          stopPromiseRef.current.resolve({
            transcript: transcriptRef.current,
            uri: recordingUriRef.current,
          });
          stopPromiseRef.current = null;
        }
      }),
      nativeEmitter.addListener('error', (event) => {
        const message = event.message || `Speech recognition failed (${event.error}).`;
        activeRef.current = false;
        setIsRecognizing(false);
        setError(message);
        if (stopPromiseRef.current) {
          stopPromiseRef.current.reject(new Error(message));
          stopPromiseRef.current = null;
        }
      }),
    ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  const start = useCallback((lang = 'zh-CN') => {
    pressedRef.current = true;
    if (!nativeModule) {
      pressedRef.current = false;
      const missingModuleError = new Error(
        'Speech recognition needs the updated custom app. Rebuild and reinstall it to use the microphone.'
      );
      setError(missingModuleError.message);
      return Promise.reject(missingModuleError);
    }
    setError('');
    transcriptRef.current = '';
    recordingUriRef.current = null;
    setTranscript('');

    const startPromise = (async () => {
      const permission = await nativeModule.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Allow microphone and speech recognition access to practice speaking.');
      }
      if (!pressedRef.current) return;
      if (!nativeModule.isRecognitionAvailable()) {
        throw new Error('Speech recognition is unavailable on this device.');
      }

      activeRef.current = true;
      try {
        nativeModule.start({
          lang,
          interimResults: true,
          maxAlternatives: 1,
          continuous: false,
          recordingOptions: { persist: true },
        });
      } catch (startError) {
        activeRef.current = false;
        throw startError;
      }
    })();
    startPromiseRef.current = startPromise;
    startPromise.catch((startError) => {
      pressedRef.current = false;
      setError(startError.message || 'Could not start speech recognition.');
    }).finally(() => {
      if (startPromiseRef.current === startPromise) startPromiseRef.current = null;
    });
    return startPromise;
  }, []);

  const stop = useCallback(async () => {
    pressedRef.current = false;
    if (startPromiseRef.current) await startPromiseRef.current;
    if (!activeRef.current) {
      return { transcript: transcriptRef.current, uri: recordingUriRef.current };
    }

    return new Promise((resolve, reject) => {
      stopPromiseRef.current = { resolve, reject };
      try {
        nativeModule.stop();
      } catch (stopError) {
        activeRef.current = false;
        stopPromiseRef.current = null;
        reject(stopError);
      }
    });
  }, []);

  const updateTranscript = useCallback((text) => {
    transcriptRef.current = text;
    setTranscript(text);
  }, []);

  useEffect(() => () => {
    pressedRef.current = false;
    if (activeRef.current) nativeModule?.abort();
  }, []);

  return { transcript, setTranscript: updateTranscript, isRecognizing, error, start, stop };
}
