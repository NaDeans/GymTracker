import { useCallback, useRef, useState } from "react";
import { Alert } from "react-native";
import { triggerImpact } from "shared/utils/haptics";

// expo-speech-recognition is a native module: importing it calls requireNativeModule
// at load time, which throws in Expo Go and on web. Resolve it defensively so those
// environments simply hide the mic instead of crashing the whole screen.
let SpeechModule = null;
let useSpeechEvent = () => {};
try {
  const mod = require("expo-speech-recognition");
  if (mod?.ExpoSpeechRecognitionModule) {
    SpeechModule = mod.ExpoSpeechRecognitionModule;
    useSpeechEvent = mod.useSpeechRecognitionEvent;
  }
} catch {
  // native module unavailable (Expo Go / web) — voice search stays hidden
}

const ERROR_MESSAGES = {
  "not-allowed": "Enable microphone and speech recognition access in your device settings to use voice search.",
  "service-not-allowed": "Speech recognition isn't available on this device right now.",
  network: "Voice search needs a network connection.",
};

export const useVoiceSearch = (onTranscript) => {
  const [listening, setListening] = useState(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useSpeechEvent("start", () => setListening(true));
  useSpeechEvent("end", () => setListening(false));

  useSpeechEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) onTranscriptRef.current(transcript);
  });

  useSpeechEvent("error", (event) => {
    setListening(false);
    if (event.error === "no-speech" || event.error === "aborted") return;
    const message = ERROR_MESSAGES[event.error] || "Something went wrong with voice search.";
    Alert.alert("Voice Search", message);
  });

  const start = useCallback(async () => {
    try {
      const result = await SpeechModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert("Voice Search", ERROR_MESSAGES["not-allowed"]);
        return;
      }
      triggerImpact("light");
      SpeechModule.start({ lang: "en-AU", interimResults: true, continuous: false });
    } catch (err) {
      console.error("Voice search error:", err);
      setListening(false);
      Alert.alert("Voice Search", ERROR_MESSAGES["service-not-allowed"]);
    }
  }, []);

  const stop = useCallback(() => {
    triggerImpact("light");
    try {
      SpeechModule.stop();
    } catch {
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { available: Boolean(SpeechModule), listening, toggle };
};
