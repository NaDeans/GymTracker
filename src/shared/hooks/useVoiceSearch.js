import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { triggerImpact } from "shared/utils/haptics";

const ERROR_MESSAGES = {
  "not-allowed": "Enable microphone and speech recognition access in your device settings to use voice search.",
  "service-not-allowed": "Speech recognition isn't available on this device right now.",
  network: "Voice search needs a network connection.",
};

export const useVoiceSearch = (onTranscript) => {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) onTranscript(transcript);
  });

  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    if (event.error === "no-speech" || event.error === "aborted") return;
    const message = ERROR_MESSAGES[event.error] || "Something went wrong with voice search.";
    Alert.alert("Voice Search", message);
  });

  const start = useCallback(async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert("Voice Search", ERROR_MESSAGES["not-allowed"]);
      return;
    }
    triggerImpact("light");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  }, []);

  const stop = useCallback(() => {
    triggerImpact("light");
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { listening, toggle };
};
