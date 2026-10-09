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
// that loader, so the numeric coercion and the macro goal test are inlined below.

export const SEGMENT_KEYS = {
  MACROS: "macros",
  SUPPLEMENTS: "supplements",
  CHECKLIST: "checklist",
};

// What a fresh install (or an upgrade from before the checklist was editable)
// starts with. The ids are the old DAY_STATS flag names on purpose, so a day
// logged as `{ gym: true, abs: false }` maps straight onto these items.
export const DEFAULT_CHECKLIST = [
  { id: "gym", name: "Went to the gym" },
  { id: "abs", name: "Hit abs" },
];

const LEGACY_FLAGS = ["gym", "abs"];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// One day's DAY_STATS entry in its current shape: `{ weight, checked: [id] }`,
// or null when nothing is recorded. Older builds stored the two fixed ticks as
// `gym` / `abs` booleans; those fold into `checked` here. Idempotent, so it runs
// on every load rather than behind a migration flag.
export const normalizeDayStat = (stat) => {
  if (!stat || typeof stat !== "object") return null;
  const checked = Array.isArray(stat.checked) ? [...stat.checked] : [];
  LEGACY_FLAGS.forEach((flag) => {
    if (stat[flag] && !checked.includes(flag)) checked.push(flag);
  });
  const weight = typeof stat.weight === "number" && Number.isFinite(stat.weight) ? stat.weight : null;
  if (weight == null && checked.length === 0) return null;
  return { weight, checked };
};

export const normalizeDayStats = (dayStats = {}) => {
  const out = {};
  Object.entries(dayStats || {}).forEach(([dmy, stat]) => {
    const clean = normalizeDayStat(stat);
    if (clean) out[dmy] = clean;
  });
  return out;
};

// Same test as isGoalMet in macroUtils (the "Goal met" badge), inlined because
// this file must stay import-free: every macro within ±15% of its goal, and
// something has to have been logged. Keeping the two identical means the badge
// and the first bar segment can never disagree.
const MACRO_KEYS = ["calories", "protein", "carbs", "fats"];
const MACRO_TOLERANCE = 0.15;
export const macroGoalsMet = (totals = {}, goals = {}) => {
  if (!MACRO_KEYS.some((k) => num(goals?.[k]) > 0)) return false;
  if (!MACRO_KEYS.some((k) => num(totals?.[k]) > 0)) return false;
  return MACRO_KEYS.every((k) => {
    const goal = num(goals?.[k]);
    if (!goal) return num(totals?.[k]) === 0;
    return Math.abs(num(totals?.[k]) - goal) / goal <= MACRO_TOLERANCE;
  });
};

// Narrows the whole-store shapes down to the single day getDayCompletion wants.
// The only place that knows how a day is addressed inside each map, so the
// in-app path and the scheduler path cannot disagree about where to look.
export const selectDayCompletionInput = (dmy, store = {}) => ({
  totals: store.dailyLog?.[dmy]?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 },
  goals: store.goals || {},
  supplements: store.supplements || [],
  takenIds: store.supplementLog?.[dmy] || [],
  checklist: store.checklist || [],
  dayStat: store.dayStats?.[dmy] || null,
});

// Up to three segments: calorie + macro goals, every supplement, every
// checklist item. The supplements and checklist segments are left out entirely
// when their list is empty, so the bar never shows one that can't be filled.
//
// Body weight is logged in the same card as the checklist but is not required.
export const getDayCompletion = ({
  totals,
  goals,
  supplements = [],
  takenIds = [],
  checklist = [],
  dayStat,
} = {}) => {
  const segments = [
    {
      key: SEGMENT_KEYS.MACROS,
      label: "Calorie and macro goals",
      shortLabel: "Macros",
      done: macroGoalsMet(totals, goals),
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

  if (checklist.length > 0) {
    const checked = normalizeDayStat(dayStat)?.checked || [];
    segments.push({
      key: SEGMENT_KEYS.CHECKLIST,
      label: "Daily checklist",
      shortLabel: "Checklist",
      done: checklist.every((c) => checked.includes(c.id)),
    });
  }

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
