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
// totalCount is 2 or 3 and the bar renders equal segments either way rather
// than showing one that can never be filled.
//
// Abs is deliberately NOT a segment. It is still ticked on the day and still
// exported — it just isn't something the day has to clear to count as done.
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

  segments.push({
    key: SEGMENT_KEYS.GYM,
    label: "Went to the gym",
    shortLabel: "Gym",
    done: Boolean(dayStat?.gym),
  });

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

// "2/3 done · 1840/2400 kcal." for the notification body.
//
// Plain text rather than a drawn bar: expo-notifications does not expose
// Android's native progress bar, and block characters render inconsistently
// across launchers, so the numbers carry it instead.
//
// Calories are rounded to whole numbers — a notification saying "1840.0 kcal"
// reads like a bug. With no calorie goal set the clause is dropped rather than
// printing "/0".
export const renderProgressText = ({ completedCount, totalCount, calories, calorieGoal } = {}) => {
  const done = `${num(completedCount)}/${num(totalCount)} done`;
  const goal = num(calorieGoal);
  if (goal <= 0) return `${done}.`;
  return `${done} · ${Math.round(num(calories))}/${Math.round(goal)} kcal.`;
};
