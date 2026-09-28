import { useEffect, useState } from "react";
import { AppState } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { purgeRemovedFeatureData } from "./src/shared/utils/legacyCleanup";
import { migrateMealPrepsOffRecipesKey } from "./src/shared/utils/migrations";
import { ensureNotificationPermission, syncDayReminders } from "./src/shared/notifications/reminderScheduler";

export default function App() {
  // Gated rather than fire-and-forget: the Recipes hook would otherwise be free
  // to load — and then save over — meal preps still sitting under its key.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([purgeRemovedFeatureData(), migrateMealPrepsOffRecipesKey()]).finally(() => setReady(true));
  }, []);

  // Deliberately not part of the gate above: that one exists for meal-prep data
  // integrity, and blocking first paint on notification scheduling would change
  // how the app starts. Re-syncing on every foreground is what catches midnight
  // rollover, permission changes made in system settings, and days the app was
  // left in the background.
  useEffect(() => {
    ensureNotificationPermission().then(() => syncDayReminders());
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") syncDayReminders();
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null;

  return <AppNavigator />;
}
