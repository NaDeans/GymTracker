import { shiftDmy } from "shared/utils/dateUtils";

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};

const lerpColor = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

// Proximity gradient: green at the goal, shifting through orange to red the
// further away `ratio` (value / goal) gets, in either direction.
export const macroBarColor = (ratio, colors) => {
  const distance = Math.min(1, Math.abs(ratio - 1));
  if (distance <= 0.5) {
    return lerpColor(colors.success, colors.warning, distance / 0.5);
  }
  return lerpColor(colors.warning, colors.danger, (distance - 0.5) / 0.5);
};

// Averages calories/protein/carbs/fats over the `days` calendar days before
// `endDmy` (today is excluded — this is a look-back average, not today's own
// number), counting only days that have any log — a partial day still counts
// as one full day, same convention as dayHasLog/isGoalMet elsewhere. Returns
// null if no day in the window has a log.
export const calcTrailingAverages = (dailyLog, endDmy, days = 7) => {
  let cursor = shiftDmy(endDmy, -1);
  const sums = { calories: 0, protein: 0, carbs: 0, fats: 0 };
  let daysCounted = 0;

  for (let i = 0; i < days; i++) {
    const day = dailyLog[cursor];
    if (day && day.items && Object.keys(day.items).length > 0) {
      sums.calories += day.totals.calories;
      sums.protein += day.totals.protein;
      sums.carbs += day.totals.carbs;
      sums.fats += day.totals.fats;
      daysCounted += 1;
    }
    cursor = shiftDmy(cursor, -1);
  }

  if (daysCounted === 0) return null;
  return {
    daysCounted,
    calories: sums.calories / daysCounted,
    protein: sums.protein / daysCounted,
    carbs: sums.carbs / daysCounted,
    fats: sums.fats / daysCounted,
  };
};

export const calcTotals = (items) =>
  Object.values(items).reduce(
    (tot, { item: { calories, protein, carbs, fats }, count }) => {
      tot.calories += calories * count;
      tot.protein += protein * count;
      tot.carbs += carbs * count;
      tot.fats += fats * count;
      return tot;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

export const entryExistsForDay = (dayHistory, foodId) =>
  dayHistory.some((entry) => entry.foodId === foodId);

export const isGoalMet = (totals, goals, hasItems, tolerancePct = 0.10) => {
  if (!hasItems) return false;
  return ["calories", "protein", "carbs", "fats"].every((k) => {
    const goal = goals[k];
    if (!goal) return totals[k] === 0;
    return Math.abs(totals[k] - goal) / goal <= tolerancePct;
  });
};

export const customFoodFields = [
  { key: "name", label: "Food Name", keyboardType: "default" },
  { key: "amount_g", label: "Weight (g)", keyboardType: "numeric" },
  { key: "calories", label: "Calories", keyboardType: "numeric" },
  { key: "protein", label: "Protein", keyboardType: "numeric" },
  { key: "carbs", label: "Carbs", keyboardType: "numeric" },
  { key: "fats", label: "Fats", keyboardType: "numeric" },
];
