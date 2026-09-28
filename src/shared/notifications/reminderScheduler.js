import AsyncStorage from "@react-native-async-storage/async-storage";

import { todayString, shiftDmy, dmyToDateAt } from "shared/utils/dateUtils";
import { getDayCompletion, selectDayCompletionInput, renderProgressText } from "shared/utils/dayCompletion";
import { loadDayCompletionInputs } from "features/macroTracker/utils/storageUtils";
import { Notify, notificationsAvailable } from "./notificationsModule";

// Reminders to log the day, on a fixed schedule rather than a snooze: nothing
// runs when a local notification fires, so there is no dismissal hook to hang a
// "come back in two hours" off. Clearing one simply means the next still comes.
export const REMINDER_HOURS = [7, 9, 12, 15, 18, 21];

const CHANNEL_ID = "daily-reminders";
const TAG = "gymtracker-reminder";
// How many days ahead to lay down reminders, so they keep arriving if the app
// isn't opened for a while. Rebuilt from scratch on every sync.
const WINDOW_DAYS = 7;

// Its own key, touched only by this module. Deliberately NOT part of the
// saveMacroTrackerData blob, which rewrites every macro key at once — routing
// this through there would risk a background write landing on live state.
const STATE_KEY = "REMINDER_STATE";

const readState = async () => {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeState = async (next) => {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch (err) {
    console.error("Error saving reminder state:", err);
  }
};

// Cancels only what this module scheduled, rather than everything, so anything
// else that ever schedules a notification survives a sync.
const cancelTagged = async () => {
  const all = await Notify.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content?.data?.kind === TAG)
      .map((n) => Notify.cancelScheduledNotificationAsync(n.identifier))
  );
};

const ensureChannel = async () => {
  await Notify.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Daily reminders",
    importance: Notify.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#4F46E5",
  });
};

const scheduleAt = async (dmy, hour, body) => {
  await Notify.scheduleNotificationAsync({
    content: {
      title: "Log your day",
      body,
      data: { kind: TAG, dmy, hour },
    },
    trigger: {
      type: Notify.SchedulableTriggerInputTypes.DATE,
      date: dmyToDateAt(dmy, hour),
      channelId: CHANNEL_ID,
    },
  });
};

// Asked once, ever. There is no natural gesture that means "I want reminders",
// so the prompt goes up on the first launch that has the feature, and a refusal
// is remembered rather than re-asked. canAskAgain mirrors imageUtils.js.
export const ensureNotificationPermission = async () => {
  try {
    if (!notificationsAvailable) return false;
    const current = await Notify.getPermissionsAsync();
    if (current.status === "granted") return true;
    if (!current.canAskAgain) return false;

    const state = await readState();
    if (state.permissionAskedDate) return false;

    const result = await Notify.requestPermissionsAsync();
    await writeState({ ...state, permissionAskedDate: todayString() });
    return result.status === "granted";
  } catch (err) {
    console.error("Notification permission error:", err);
    return false;
  }
};

// Rebuilds the whole reminder window.
//
// `liveStore` lets the app pass the state it already holds instead of re-reading
// AsyncStorage, so a sync triggered by a tick can't race the save effect that
// tick just started.
export const syncDayReminders = async (liveStore) => {
  try {
    if (!notificationsAvailable) return;
    const perm = await Notify.getPermissionsAsync();
    if (perm.status !== "granted") return; // silent no-op, never a nag

    await ensureChannel();
    await cancelTagged();

    const store = liveStore || (await loadDayCompletionInputs());
    const today = todayString();
    const dayInput = selectDayCompletionInput(today, store);
    const completion = getDayCompletion(dayInput);
    const state = await readState();

    if (completion.isComplete) {
      // One congratulation per day, then silence. The guard is a date string
      // compared against today, so rollover resets it for free — no timer, no
      // cleanup job. Un-ticking something later can bring the nags back but
      // can never earn a second medal.
      if (state.congratulatedDate !== today) {
        await Notify.scheduleNotificationAsync({
          content: {
            title: "Day complete 🏅",
            body: `${completion.completedCount}/${completion.totalCount}: ${completion.segments
              .map((s) => s.shortLabel.toLowerCase())
              .join(", ")}. Nice work.`,
            data: { kind: TAG, dmy: today, congrats: true },
          },
          trigger: null, // fire now
        });
        await writeState({ ...state, congratulatedDate: today });
      }
      // Nothing further today either way.
    } else {
      // Today's remaining slots carry the live counts. The text is frozen at
      // schedule time — nothing runs when it fires — which is why every
      // foreground and every completion change rebuilds this.
      const body = renderProgressText({
        completedCount: completion.completedCount,
        totalCount: completion.totalCount,
        calories: dayInput.totals?.calories,
        calorieGoal: dayInput.goals?.calories,
      });
      const cutoff = Date.now() + 60_000;
      await Promise.all(
        REMINDER_HOURS.filter((h) => dmyToDateAt(today, h).getTime() > cutoff).map((h) =>
          scheduleAt(today, h, body)
        )
      );
    }

    // Future days get generic copy: tomorrow's progress is unknowable today, and
    // a baked-in "0/4" would simply be wrong by the time it showed up.
    const futureBody = "Log your macros, supplements and training.";
    for (let i = 1; i < WINDOW_DAYS; i++) {
      const dmy = shiftDmy(today, i);
      await Promise.all(REMINDER_HOURS.map((h) => scheduleAt(dmy, h, futureBody)));
    }
  } catch (err) {
    console.error("Reminder sync error:", err);
  }
};

// Dev helper: fires shortly after being called, so the notification path can be
// checked without waiting for a real slot.
export const scheduleTestReminderIn = async (seconds = 10) => {
  if (!notificationsAvailable) return;
  await ensureChannel();
  await Notify.scheduleNotificationAsync({
    content: { title: "Test reminder", body: "If you can see this, reminders work.", data: { kind: TAG } },
    trigger: {
      type: Notify.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
      channelId: CHANNEL_ID,
    },
  });
};
