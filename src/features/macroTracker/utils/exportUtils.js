import { fmt } from "shared/utils/numberUtils";
import { shiftDmy } from "shared/utils/dateUtils";

// Builds the food-line list + totals for a single day. Shared by the
// single-day and multi-day export formatters.
//
// historyByDate keeps each entry's originally-entered values (name/order only,
// for our purposes); the current, possibly-edited grams and macros live in
// dailyLog. We use historyByDate for ordering and dailyLog for the numbers so
// the export reflects any gram edits made after a food was first logged.
const buildDayLines = (date, historyByDate, dailyLog) => {
  const entries = historyByDate[date] || [];
  const dayItems = dailyLog[date]?.items || {};
  const totals = dailyLog[date]?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const seen = new Set();
  const foodLines = [];
  entries.forEach((entry) => {
    const entryLines = [];
    entry.items.forEach((historyItem) => {
      const logged = dayItems[historyItem.id];
      if (!logged || seen.has(historyItem.id)) return;
      seen.add(historyItem.id);
      const { item, count } = logged;
      const countSuffix = count > 1 ? ` ×${count}` : "";
      entryLines.push(
        `- ${item.name} (${fmt(item.amount_g)}g)${countSuffix}: ${fmt(item.calories * count)} kcal, P ${fmt(item.protein * count)}g, C ${fmt(item.carbs * count)}g, F ${fmt(item.fats * count)}g`
      );
    });

    if (entryLines.length === 0) return;
    // Foods logged together as a meal stay grouped under the meal's name.
    if (entry.mealName) {
      foodLines.push(`- ${entry.mealName} (meal):`, ...entryLines.map((line) => `  ${line}`));
    } else {
      foodLines.push(...entryLines);
    }
  });

  return { foodLines, totals, hasLog: foodLines.length > 0 };
};

// Resolves a day's ticked supplement ids into names, in the order the
// supplements are listed in the manager. Returns null when the user has no
// supplements set up at all, so the caller can omit the line entirely.
const buildSupplementLine = (date, supplements = [], supplementLog = {}) => {
  if (supplements.length === 0) return null;
  const takenIds = new Set(supplementLog[date] || []);
  const taken = supplements.filter((s) => takenIds.has(s.id)).map((s) => s.name);
  return taken.length > 0
    ? `Supplements taken: ${taken.join(", ")}`
    : "Supplements taken: none";
};

// Builds a plain-text summary of a day's food log — good enough to paste
// into a chat/AI app for feedback. Pure function: no state, no I/O.
export const formatDayForExport = (selectedDate, historyByDate, dailyLog, goals, supplements, supplementLog) => {
  const { foodLines, totals } = buildDayLines(selectedDate, historyByDate, dailyLog);
  const supplementLine = buildSupplementLine(selectedDate, supplements, supplementLog);

  const lines = [`MacroTracker — ${selectedDate}`, ""];

  if (foodLines.length === 0) {
    lines.push("No foods logged for this day.");
  } else {
    lines.push("Foods:", ...foodLines);
  }

  if (supplementLine) lines.push("", supplementLine);

  lines.push(
    "",
    `Totals: ${fmt(totals.calories)} kcal, P ${fmt(totals.protein)}g, C ${fmt(totals.carbs)}g, F ${fmt(totals.fats)}g`,
    `Goals: ${fmt(goals.calories)} kcal, P ${fmt(goals.protein)}g, C ${fmt(goals.carbs)}g, F ${fmt(goals.fats)}g`,
    "",
    "Based on the foods and supplements listed above, how did I do on my macros (calories, protein, carbs, fats) versus my goals, and how did I do on micronutrients (vitamins, minerals, fiber, etc.)? Take the supplements into account when judging micronutrient coverage. Point out any deficiencies and tell me specifically how I could improve tomorrow."
  );

  return lines.join("\n");
};

// Builds a plain-text summary of the last `days` calendar days (today
// inclusive), day-by-day with full food breakdowns, plus period totals/
// averages — enough detail for a full trend analysis. Pure function: no
// state, no I/O.
export const formatRangeForExport = (endDmy, days, historyByDate, dailyLog, goals, supplements, supplementLog) => {
  const dates = [];
  let cursor = endDmy;
  for (let i = 0; i < days; i++) {
    dates.unshift(cursor);
    cursor = shiftDmy(cursor, -1);
  }

  const lines = [`MacroTracker — Last ${days} Days (${dates[0]} to ${dates[dates.length - 1]})`, ""];

  const periodSums = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  let daysLogged = 0;

  dates.forEach((date) => {
    const { foodLines, totals, hasLog } = buildDayLines(date, historyByDate, dailyLog);
    const supplementLine = buildSupplementLine(date, supplements, supplementLog);

    lines.push(`--- ${date} ---`);
    if (!hasLog) {
      lines.push("No foods logged.");
      if (supplementLine) lines.push(supplementLine);
      lines.push("");
      return;
    }

    daysLogged += 1;
    periodSums.calories += totals.calories;
    periodSums.protein += totals.protein;
    periodSums.carbs += totals.carbs;
    periodSums.fats += totals.fats;

    lines.push(...foodLines);
    if (supplementLine) lines.push(supplementLine);
    lines.push(
      `Totals: ${fmt(totals.calories)} kcal, P ${fmt(totals.protein)}g, C ${fmt(totals.carbs)}g, F ${fmt(totals.fats)}g`,
      ""
    );
  });

  lines.push(`Goals: ${fmt(goals.calories)} kcal, P ${fmt(goals.protein)}g, C ${fmt(goals.carbs)}g, F ${fmt(goals.fats)}g`, "");

  if (daysLogged === 0) {
    lines.push("No data logged in this period.");
  } else {
    lines.push(
      `=== ${days}-Day Summary ===`,
      `Days logged: ${daysLogged}/${days}`,
      `Average: ${fmt(periodSums.calories / daysLogged)} kcal, P ${fmt(periodSums.protein / daysLogged)}g, C ${fmt(periodSums.carbs / daysLogged)}g, F ${fmt(periodSums.fats / daysLogged)}g`
    );
  }

  lines.push(
    "",
    "Based on the daily logs above (foods and supplements), how have I trended against my macro goals (calories, protein, carbs, fats) over this period, and how did I likely do on micronutrients (vitamins, minerals, fiber, etc.)? Take the supplements into account when judging micronutrient coverage, including how consistently I took them. Point out any patterns, deficiencies, or inconsistencies, and tell me specifically how I could improve going forward."
  );

  return lines.join("\n");
};
