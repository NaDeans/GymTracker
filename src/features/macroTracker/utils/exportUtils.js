import { fmt } from "shared/utils/numberUtils";

// Builds a plain-text summary of a day's food log — good enough to paste
// into a chat/AI app for feedback. Pure function: no state, no I/O.
export const formatDayForExport = (selectedDate, historyByDate, dailyLog, goals) => {
  const entries = historyByDate[selectedDate] || [];
  const totals = dailyLog[selectedDate]?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const lines = [`GymTracker — ${selectedDate}`, ""];

  const foodLines = entries.flatMap((entry) =>
    entry.items.map(
      (item) =>
        `- ${item.name} (${fmt(item.amount_g)}g): ${fmt(item.calories)} kcal, P ${fmt(item.protein)}g, C ${fmt(item.carbs)}g, F ${fmt(item.fats)}g`
    )
  );

  if (foodLines.length === 0) {
    lines.push("No foods logged for this day.");
  } else {
    lines.push("Foods:", ...foodLines);
  }

  lines.push(
    "",
    `Totals: ${fmt(totals.calories)} kcal, P ${fmt(totals.protein)}g, C ${fmt(totals.carbs)}g, F ${fmt(totals.fats)}g`,
    `Goals: ${fmt(goals.calories)} kcal, P ${fmt(goals.protein)}g, C ${fmt(goals.carbs)}g, F ${fmt(goals.fats)}g`
  );

  return lines.join("\n");
};
