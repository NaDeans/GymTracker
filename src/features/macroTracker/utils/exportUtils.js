import { fmt } from "shared/utils/numberUtils";

// Builds a plain-text summary of a day's food log — good enough to paste
// into a chat/AI app for feedback. Pure function: no state, no I/O.
//
// historyByDate keeps each entry's originally-entered values (name/order only,
// for our purposes); the current, possibly-edited grams and macros live in
// dailyLog. We use historyByDate for ordering and dailyLog for the numbers so
// the export reflects any gram edits made after a food was first logged.
export const formatDayForExport = (selectedDate, historyByDate, dailyLog, goals) => {
  const entries = historyByDate[selectedDate] || [];
  const dayItems = dailyLog[selectedDate]?.items || {};
  const totals = dailyLog[selectedDate]?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const lines = [`GymTracker — ${selectedDate}`, ""];

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
