import { Platform } from "react-native";

// expo-notifications is a native module: importing it calls requireNativeModule
// at load time. Resolve it defensively, exactly as useVoiceSearch.js does for
// expo-speech-recognition.
//
// This is load-bearing rather than merely cautious — Expo Go on Android dropped
// local notification support in SDK 53, so a bare top-level import breaks
// `npm start` outright. Every caller must check `notificationsAvailable` first;
// one unguarded call and the app stops booting in Expo Go.
let Notify = null;
try {
  const mod = require("expo-notifications");
  if (mod?.scheduleNotificationAsync) Notify = mod;
} catch {
  // native module unavailable (Expo Go / web) — reminders stay off
}

export const notificationsAvailable = Boolean(Notify) && Platform.OS !== "web";

// Must run at module scope, before anything can be delivered while the app is
// foregrounded. shouldShowBanner/shouldShowList are the SDK 54 names;
// shouldShowAlert is deprecated.
if (Notify) {
  Notify.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export { Notify };
