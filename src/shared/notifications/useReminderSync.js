import { useEffect, useRef } from "react";

import { syncDayReminders } from "./reminderScheduler";

// Rebuilds the reminder window whenever the day's completion changes, so the
// progress text baked into the scheduled notifications — and the one already
// on screen — stays current.
//
// Keyed on a short signature rather than the state itself: the point is to
// re-sync when the *answer* changes, not on every keystroke. The live state is
// read through a ref so it is always fresh without widening the dependency.
//
// Debounced, because the signature now includes today's calories and a burst
// of logging would otherwise queue a full rebuild per food.
const DEBOUNCE_MS = 1500;

export const useReminderSync = (signature, getLiveStore) => {
  const storeRef = useRef(getLiveStore);
  storeRef.current = getLiveStore;

  useEffect(() => {
    const timer = setTimeout(() => syncDayReminders(storeRef.current()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [signature]);
};
