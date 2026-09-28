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
const { getDayCompletion, selectDayCompletionInput, renderProgressText, SEGMENT_KEYS } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

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
const SUPPS = [{ id: "a", name: "Vitamin D" }, { id: "b", name: "Fish Oil" }];
const totals = (calories) => ({ calories, protein: 0, carbs: 0, fats: 0 });

// --- abs is not part of completion ----------------------------------------
// It is still ticked on the day and still exported; it just doesn't gate the
// bar. Guard both the key table and the produced segments.
check("SEGMENT_KEYS has no abs", Object.keys(SEGMENT_KEYS).includes("ABS"), false);
check(
  "abs never appears as a segment, even when ticked",
  getDayCompletion({
    totals: totals(0), goals: GOALS, supplements: SUPPS, dayStat: { gym: false, abs: true },
  }).segments.some((s) => s.key === "abs"),
  false
);
check(
  "ticking abs does not advance the count",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [], dayStat: { abs: true } }).completedCount,
  0
);
check(
  "a day with abs never ticked can still be complete",
  getDayCompletion({
    totals: totals(2500), goals: GOALS, supplements: SUPPS, takenIds: ["a", "b"],
    dayStat: { gym: true, abs: false },
  }).isComplete,
  true
);

// --- segment count varies with whether supplements are configured ----------
check(
  "no supplements configured → 2 segments",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [] }).totalCount,
  2
);
check(
  "supplements configured → 3 segments",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS }).totalCount,
  3
);
check(
  "segment keys, no supplements",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [] }).segments.map((s) => s.key),
  ["calories", "gym"]
);
check(
  "segment keys, with supplements",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS }).segments.map((s) => s.key),
  ["calories", "supplements", "gym"]
);

// --- calories: met OR exceeded --------------------------------------------
const calDone = (cals) =>
  getDayCompletion({ totals: totals(cals), goals: GOALS, supplements: [] }).segments[0].done;
check("calories under goal → not done", calDone(2399), false);
check("calories exactly at goal → done", calDone(2400), true);
check("calories over goal → done", calDone(3000), true);
check(
  "zero calorie goal → never done (avoids 0 >= 0)",
  getDayCompletion({ totals: totals(0), goals: { calories: 0 }, supplements: [] }).segments[0].done,
  false
);

// --- supplements: all or nothing ------------------------------------------
const suppDone = (takenIds) =>
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS, takenIds }).segments[1].done;
check("no supplements taken → not done", suppDone([]), false);
check("some supplements taken → not done", suppDone(["a"]), false);
check("all supplements taken → done", suppDone(["a", "b"]), true);

// --- gym ------------------------------------------------------------------
const gymDone = (dayStat) =>
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [], dayStat })
    .segments.find((s) => s.key === "gym").done;
check("no dayStat → gym undone", gymDone(null), false);
check("gym ticked", gymDone({ gym: true }), true);
check("weight alone does not tick gym", gymDone({ weight: 82.4 }), false);

// --- isComplete / remaining -----------------------------------------------
const full = getDayCompletion({
  totals: totals(2500), goals: GOALS, supplements: SUPPS, takenIds: ["a", "b"],
  dayStat: { gym: true },
});
check("everything done → isComplete", full.isComplete, true);
check("everything done → 3/3", [full.completedCount, full.totalCount], [3, 3]);
check("everything done → nothing remaining", full.remaining, []);

const nearly = getDayCompletion({
  totals: totals(2500), goals: GOALS, supplements: SUPPS, takenIds: ["a", "b"],
  dayStat: { gym: false },
});
check("one short → not complete", nearly.isComplete, false);
check("one short → remaining names it", nearly.remaining, ["gym"]);

check(
  "no supplements + other two done → complete at 2/2",
  (() => {
    const c = getDayCompletion({
      totals: totals(2500), goals: GOALS, supplements: [], dayStat: { gym: true },
    });
    return [c.isComplete, c.completedCount, c.totalCount];
  })(),
  [true, 2, 2]
);

// --- empty / defensive input ----------------------------------------------
check("no arguments at all does not throw", getDayCompletion().totalCount, 2);
check("missing goals → calories not done", getDayCompletion({}).segments[0].done, false);

// --- selectDayCompletionInput --------------------------------------------
const STORE = {
  dailyLog: { "28/09/26": { items: {}, totals: totals(1800) } },
  goals: GOALS,
  supplements: SUPPS,
  supplementLog: { "28/09/26": ["a"] },
  dayStats: { "28/09/26": { weight: 82.4, gym: true, abs: false } },
};
const picked = selectDayCompletionInput("28/09/26", STORE);
check("selector pulls the day's totals", picked.totals.calories, 1800);
check("selector pulls the day's taken ids", picked.takenIds, ["a"]);
check("selector pulls the day's stat", picked.dayStat.gym, true);

const missing = selectDayCompletionInput("01/01/99", STORE);
check("selector on an unlogged day → zero totals", missing.totals.calories, 0);
check("selector on an unlogged day → no taken ids", missing.takenIds, []);
check("selector on an unlogged day → null stat", missing.dayStat, null);
check("selector tolerates an empty store", selectDayCompletionInput("28/09/26", {}).takenIds, []);

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
