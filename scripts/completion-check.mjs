// Sanity check for src/shared/utils/dayCompletion.js — no test runner is
// configured, so this is a plain `node scripts/completion-check.mjs` script.
//
// The util is an ES module inside an app that Metro bundles (not Node), so it's
// loaded from source text via a data: URL rather than imported by path. That is
// also why dayCompletion.js deliberately has no imports of its own.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "src", "shared", "utils", "dayCompletion.js"), "utf8");
const {
  getDayCompletion, selectDayCompletionInput, renderProgressText, SEGMENT_KEYS,
  DEFAULT_CHECKLIST, normalizeDayStat, normalizeDayStats, macroGoalsMet,
} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

let failures = 0;
const check = (name, actual, expected) => {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL  ${name}\n      expected ${e}\n      got      ${a}`);
  }
};

const GOALS = { calories: 2400, protein: 150, carbs: 330, fats: 70 };
const ON_GOAL = { calories: 2400, protein: 150, carbs: 330, fats: 70 };
const SUPPS = [{ id: "a", name: "Vitamin D" }, { id: "b", name: "Fish Oil" }];
const LIST = DEFAULT_CHECKLIST;
const totals = (calories) => ({ calories, protein: 0, carbs: 0, fats: 0 });

// --- default checklist ------------------------------------------------------
check("default checklist is gym then abs", LIST.map((c) => c.id), ["gym", "abs"]);

// --- segment count varies with which lists are configured ------------------
check("nothing configured → 1 segment", getDayCompletion({ goals: GOALS }).totalCount, 1);
check(
  "supplements + checklist → 3 segments in order",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS, checklist: LIST }).segments.map((s) => s.key),
  [SEGMENT_KEYS.MACROS, SEGMENT_KEYS.SUPPLEMENTS, SEGMENT_KEYS.CHECKLIST]
);
check(
  "empty checklist → no checklist segment",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS, checklist: [] }).segments.map((s) => s.key),
  ["macros", "supplements"]
);

// --- macros: every macro within ±10% ---------------------------------------
check("all four on goal → met", macroGoalsMet(ON_GOAL, GOALS), true);
check("all four at +10% → met", macroGoalsMet({ calories: 2640, protein: 165, carbs: 363, fats: 77 }, GOALS), true);
check("calories only → not met", macroGoalsMet(totals(2400), GOALS), false);
check("protein 20% short → not met", macroGoalsMet({ ...ON_GOAL, protein: 120 }, GOALS), false);
check("calories 20% over → not met", macroGoalsMet({ ...ON_GOAL, calories: 2880 }, GOALS), false);
check("nothing logged → not met", macroGoalsMet(totals(0), GOALS), false);
check("no goals at all → not met", macroGoalsMet(ON_GOAL, {}), false);
check("zero-goal macro needs zero intake", macroGoalsMet({ ...ON_GOAL, fats: 0 }, { ...GOALS, fats: 0 }), true);

// --- supplements: all or nothing ------------------------------------------
const suppDone = (takenIds) =>
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS, takenIds }).segments[1].done;
check("no supplements taken → not done", suppDone([]), false);
check("some supplements taken → not done", suppDone(["a"]), false);
check("all supplements taken → done", suppDone(["a", "b"]), true);

// --- checklist: every item ticked -----------------------------------------
const listDone = (dayStat, checklist = LIST) =>
  getDayCompletion({ totals: totals(0), goals: GOALS, checklist, dayStat })
    .segments.find((s) => s.key === "checklist").done;
check("no dayStat → checklist undone", listDone(null), false);
check("one of two ticked → undone", listDone({ checked: ["gym"] }), false);
check("both ticked → done", listDone({ checked: ["gym", "abs"] }), true);
check("weight alone does not tick anything", listDone({ weight: 82.4, checked: [] }), false);
check(
  "custom item must be ticked too",
  listDone({ checked: ["gym", "abs"] }, [...LIST, { id: "x", name: "10k steps" }]),
  false
);
check("legacy { gym, abs } flags still count", listDone({ gym: true, abs: true }), true);
check("stale ids for deleted items are ignored", listDone({ checked: ["gym", "old"] }, [LIST[0]]), true);

// --- normalizeDayStat ------------------------------------------------------
check("legacy flags fold into checked", normalizeDayStat({ weight: 80, gym: true, abs: false }), { weight: 80, checked: ["gym"] });
check("empty legacy day → null", normalizeDayStat({ weight: null, gym: false, abs: false }), null);
check("already-normal stat is unchanged", normalizeDayStat({ weight: 80, checked: ["x"] }), { weight: 80, checked: ["x"] });
check("idempotent", normalizeDayStat(normalizeDayStat({ gym: true, abs: true })), { weight: null, checked: ["gym", "abs"] });
check("no duplicate when both shapes present", normalizeDayStat({ gym: true, checked: ["gym"] }).checked, ["gym"]);
check("normalizeDayStats drops empty days", normalizeDayStats({ a: { gym: false }, b: { abs: true } }), { b: { weight: null, checked: ["abs"] } });

// --- isComplete / remaining -----------------------------------------------
const full = getDayCompletion({
  totals: ON_GOAL, goals: GOALS, supplements: SUPPS, takenIds: ["a", "b"],
  checklist: LIST, dayStat: { checked: ["gym", "abs"] },
});
check("everything done → isComplete", full.isComplete, true);
check("everything done → 3/3", [full.completedCount, full.totalCount], [3, 3]);
check("everything done → nothing remaining", full.remaining, []);

const nearly = getDayCompletion({
  totals: ON_GOAL, goals: GOALS, supplements: SUPPS, takenIds: ["a", "b"],
  checklist: LIST, dayStat: { checked: ["gym"] },
});
check("one short → not complete", nearly.isComplete, false);
check("one short → remaining names it", nearly.remaining, ["checklist"]);

// --- empty / defensive input ----------------------------------------------
check("no arguments at all does not throw", getDayCompletion().totalCount, 1);
check("missing goals → macros not done", getDayCompletion({}).segments[0].done, false);

// --- selectDayCompletionInput --------------------------------------------
const STORE = {
  dailyLog: { "28/09/26": { items: {}, totals: totals(1800) } },
  goals: GOALS,
  supplements: SUPPS,
  supplementLog: { "28/09/26": ["a"] },
  checklist: LIST,
  dayStats: { "28/09/26": { weight: 82.4, checked: ["gym"] } },
};
const picked = selectDayCompletionInput("28/09/26", STORE);
check("selector pulls the day's totals", picked.totals.calories, 1800);
check("selector pulls the day's taken ids", picked.takenIds, ["a"]);
check("selector pulls the day's stat", picked.dayStat.checked, ["gym"]);
check("selector pulls the checklist", picked.checklist.length, 2);

const missing = selectDayCompletionInput("01/01/99", STORE);
check("selector on an unlogged day → zero totals", missing.totals.calories, 0);
check("selector on an unlogged day → no taken ids", missing.takenIds, []);
check("selector on an unlogged day → null stat", missing.dayStat, null);
check("selector tolerates an empty store", selectDayCompletionInput("28/09/26", {}).checklist, []);

// --- renderProgressText ---------------------------------------------------
check(
  "normal case",
  renderProgressText({ completedCount: 2, totalCount: 3, calories: 1840, calorieGoal: 2400 }),
  "2/3 done · 1840/2400 kcal."
);
check(
  "calories round to whole numbers, never 1840.4",
  renderProgressText({ completedCount: 1, totalCount: 3, calories: 1840.4, calorieGoal: 2400.6 }),
  "1/3 done · 1840/2401 kcal."
);
check(
  "no calorie goal → the kcal clause is dropped, not printed as /0",
  renderProgressText({ completedCount: 1, totalCount: 2, calories: 500, calorieGoal: 0 }),
  "1/2 done."
);
check(
  "missing goal entirely → same",
  renderProgressText({ completedCount: 0, totalCount: 2 }),
  "0/2 done."
);
check("no arguments does not throw", renderProgressText(), "0/0 done.");
check(
  "over the goal still reads sensibly",
  renderProgressText({ completedCount: 3, totalCount: 3, calories: 2650, calorieGoal: 2400 }),
  "3/3 done · 2650/2400 kcal."
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All day-completion checks passed.");
