import { useEffect, useRef } from "react";

import { syncDayReminders } from "./reminderScheduler";

// Rebuilds the reminder window whenever the day's completion changes, so the
// progress bar baked into the scheduled notifications stays current.
//
// Keyed on a short signature rather than the state itself: the point is to
// re-sync when the *answer* changes, not on every keystroke. The live state is
// read through a ref so it is always fresh without widening the dependency.
export const useReminderSync = (signature, getLiveStore) => {
  const storeRef = useRef(getLiveStore);
  storeRef.current = getLiveStore;

  useEffect(() => {
    syncDayReminders(storeRef.current());
  }, [signature]);
};
