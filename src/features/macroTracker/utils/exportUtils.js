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
    entry.items.forEach((historyItem) => {
      const logged = dayItems[historyItem.id];
      if (!logged || seen.has(historyItem.id)) return;
      seen.add(historyItem.id);
      const { item, count } = logged;
      const countSuffix = count > 1 ? ` ×${count}` : "";
      foodLines.push(
        `- ${item.name} (${fmt(item.amount_g)}g)${countSuffix}: ${fmt(item.calories * count)} kcal, P ${fmt(item.protein * count)}g, C ${fmt(item.carbs * count)}g, F ${fmt(item.fats * count)}g`
      );
    });
  });

  return { foodLines, totals, hasLog: foodLines.length > 0 };
};

// Builds a plain-text summary of a day's food log — good enough to paste
// into a chat/AI app for feedback. Pure function: no state, no I/O.
export const formatDayForExport = (selectedDate, historyByDate, dailyLog, goals) => {
  const { foodLines, totals } = buildDayLines(selectedDate, historyByDate, dailyLog);

  const lines = [`GymTracker — ${selectedDate}`, ""];

  if (foodLines.length === 0) {
    lines.push("No foods logged for this day.");
  } else {
    lines.push("Foods:", ...foodLines);
  }

  lines.push(
    "",
    `Totals: ${fmt(totals.calories)} kcal, P ${fmt(totals.protein)}g, C ${fmt(totals.carbs)}g, F ${fmt(totals.fats)}g`,
    `Goals: ${fmt(goals.calories)} kcal, P ${fmt(goals.protein)}g, C ${fmt(goals.carbs)}g, F ${fmt(goals.fats)}g`,
    "",
    "Based on the foods listed above, how did I do on my macros (calories, protein, carbs, fats) versus my goals, and how did I do on micronutrients (vitamins, minerals, fiber, etc.)? Point out any deficiencies and tell me specifically how I could improve tomorrow."
  );

  return lines.join("\n");
};

// Builds a plain-text summary of the last `days` calendar days (today
// inclusive), day-by-day with full food breakdowns, plus period totals/
// averages — enough detail for a full trend analysis. Pure function: no
// state, no I/O.
export const formatRangeForExport = (endDmy, days, historyByDate, dailyLog, goals) => {
  const dates = [];
  let cursor = endDmy;
  for (let i = 0; i < days; i++) {
    dates.unshift(cursor);
    cursor = shiftDmy(cursor, -1);
  }

  const lines = [`GymTracker — Last ${days} Days (${dates[0]} to ${dates[dates.length - 1]})`, ""];

  const periodSums = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  let daysLogged = 0;

  dates.forEach((date) => {
    const { foodLines, totals, hasLog } = buildDayLines(date, historyByDate, dailyLog);

    lines.push(`--- ${date} ---`);
    if (!hasLog) {
      lines.push("No foods logged.", "");
      return;
    }

    daysLogged += 1;
    periodSums.calories += totals.calories;
    periodSums.protein += totals.protein;
    periodSums.carbs += totals.carbs;
    periodSums.fats += totals.fats;

    lines.push(
      ...foodLines,
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
    "Based on the daily logs above, how have I trended against my macro goals (calories, protein, carbs, fats) over this period, and how did I likely do on micronutrients (vitamins, minerals, fiber, etc.)? Point out any patterns, deficiencies, or inconsistencies, and tell me specifically how I could improve going forward."
  );

  return lines.join("\n");
};
