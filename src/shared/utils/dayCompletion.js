// How "done" a single day is — the one rule shared by the in-app progress bar
// and the reminder scheduler.
//
// Those two live in different worlds: the bar reads React state out of
// useMacroTracker, the scheduler reads AsyncStorage from outside React. If each
// decided for itself what a complete day looked like they would drift, and the
// notification would congratulate a day the app still showed as unfinished. So
// the rule lives here, as pure functions that know about neither.
//
// Deliberately import-free: scripts/completion-check.mjs loads this module by
// reading its source and importing it through a data: URL (the same trick
// scripts/format-name-check.mjs uses), because these are ES modules Metro
// bundles rather than modules Node can resolve. An aliased import would break
// that loader, so the one numeric coercion needed is inlined below.

export const SEGMENT_KEYS = {
  CALORIES: "calories",
  SUPPLEMENTS: "supplements",
  GYM: "gym",
  ABS: "abs",
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Narrows the whole-store shapes down to the single day getDayCompletion wants.
// The only place that knows how a day is addressed inside each map, so the
// in-app path and the scheduler path cannot disagree about where to look.
export const selectDayCompletionInput = (dmy, store = {}) => ({
  totals: store.dailyLog?.[dmy]?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 },
  goals: store.goals || {},
  supplements: store.supplements || [],
  takenIds: store.supplementLog?.[dmy] || [],
  dayStat: store.dayStats?.[dmy] || null,
});

// Note this is a LOOSER test than isGoalMet/selectedDayGoalMet, which wants all
// four macros inside ±10%. This one only asks whether the calorie goal was
// reached, so the two can legitimately disagree — the "Goal met" badge and a
// full completion bar are answering different questions.
//
// The supplements segment is left out entirely when none are configured, so
// totalCount is 3 or 4 and the bar renders equal segments either way rather
// than showing one that can never be filled.
export const getDayCompletion = ({ totals, goals, supplements = [], takenIds = [], dayStat } = {}) => {
  const calorieGoal = num(goals?.calories);

  const segments = [
    {
      key: SEGMENT_KEYS.CALORIES,
      label: "Calorie goal",
      shortLabel: "Calories",
      done: calorieGoal > 0 && num(totals?.calories) >= calorieGoal,
    },
  ];

  if (supplements.length > 0) {
    segments.push({
      key: SEGMENT_KEYS.SUPPLEMENTS,
      label: "All supplements",
      shortLabel: "Supps",
      done: supplements.every((s) => takenIds.includes(s.id)),
    });
  }

  segments.push(
    { key: SEGMENT_KEYS.GYM, label: "Went to the gym", shortLabel: "Gym", done: Boolean(dayStat?.gym) },
    { key: SEGMENT_KEYS.ABS, label: "Hit abs", shortLabel: "Abs", done: Boolean(dayStat?.abs) }
  );

  const completedCount = segments.filter((s) => s.done).length;
  const totalCount = segments.length;

  return {
    segments,
    completedCount,
    totalCount,
    ratio: totalCount === 0 ? 0 : completedCount / totalCount,
    isComplete: totalCount > 0 && completedCount === totalCount,
    remaining: segments.filter((s) => !s.done).map((s) => s.shortLabel.toLowerCase()),
  };
};

// "▓▓▓▓▓▓░░ 3/4" for the notification body. expo-notifications does not expose
// Android's native progress bar, so the bar is drawn with block characters.
// Kept to 8 cells: the collapsed notification shows one line, and a longer bar
// pushes the count off the end on narrow devices.
export const renderProgressBar = (completedCount, totalCount, width = 8) => {
  const filled = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * width);
  const clamped = Math.max(0, Math.min(width, filled));
  return `${"▓".repeat(clamped)}${"░".repeat(width - clamped)} ${completedCount}/${totalCount}`;
};
