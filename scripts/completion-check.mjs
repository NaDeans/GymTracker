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
const { getDayCompletion, selectDayCompletionInput, renderProgressBar } = await import(
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

// --- segment count varies with whether supplements are configured ----------
check(
  "no supplements configured → 3 segments",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [] }).totalCount,
  3
);
check(
  "supplements configured → 4 segments",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS }).totalCount,
  4
);
check(
  "segment keys, no supplements",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [] }).segments.map((s) => s.key),
  ["calories", "gym", "abs"]
);
check(
  "segment keys, with supplements",
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: SUPPS }).segments.map((s) => s.key),
  ["calories", "supplements", "gym", "abs"]
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

// --- gym / abs ------------------------------------------------------------
const flags = (dayStat) =>
  getDayCompletion({ totals: totals(0), goals: GOALS, supplements: [], dayStat })
    .segments.filter((s) => s.key === "gym" || s.key === "abs")
    .map((s) => s.done);
check("no dayStat → gym and abs both undone", flags(null), [false, false]);
check("gym only", flags({ gym: true, abs: false }), [true, false]);
check("both", flags({ gym: true, abs: true }), [true, true]);
check("weight alone does not count toward completion", flags({ weight: 82.4 }), [false, false]);

// --- isComplete -----------------------------------------------------------
const full = getDayCompletion({
  totals: totals(2500),
  goals: GOALS,
  supplements: SUPPS,
  takenIds: ["a", "b"],
  dayStat: { gym: true, abs: true },
});
check("everything done → isComplete", full.isComplete, true);
check("everything done → 4/4", [full.completedCount, full.totalCount], [4, 4]);
check("everything done → nothing remaining", full.remaining, []);

const nearly = getDayCompletion({
  totals: totals(2500),
  goals: GOALS,
  supplements: SUPPS,
  takenIds: ["a", "b"],
  dayStat: { gym: true, abs: false },
});
check("one short → not complete", nearly.isComplete, false);
check("one short → remaining names it", nearly.remaining, ["abs"]);

check(
  "no supplements + other three done → complete at 3/3",
  (() => {
    const c = getDayCompletion({
      totals: totals(2500), goals: GOALS, supplements: [], dayStat: { gym: true, abs: true },
    });
    return [c.isComplete, c.completedCount, c.totalCount];
  })(),
  [true, 3, 3]
);

// --- empty / defensive input ----------------------------------------------
check("no arguments at all does not throw", getDayCompletion().totalCount, 3);
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

// --- renderProgressBar ----------------------------------------------------
// Width must be constant regardless of ratio, or the notification text jumps.
for (const [done, total] of [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [0, 3], [1, 3], [2, 3], [3, 3]]) {
  const bar = renderProgressBar(done, total).split(" ")[0];
  check(`bar width constant at ${done}/${total}`, [...bar].length, 8);
}
check("empty bar", renderProgressBar(0, 4), "░░░░░░░░ 0/4");
check("full bar", renderProgressBar(4, 4), "▓▓▓▓▓▓▓▓ 4/4");
check("half bar", renderProgressBar(2, 4), "▓▓▓▓░░░░ 2/4");
check("thirds round sensibly", renderProgressBar(1, 3), "▓▓▓░░░░░ 1/3");
check("zero total does not divide by zero", renderProgressBar(0, 0), "░░░░░░░░ 0/0");

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All day-completion checks passed.");
