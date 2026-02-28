// Compute total macros for all items
export const calcTotals = (items) =>
  Object.values(items).reduce((tot, { item: { calories, protein, carbs, fats }, count }) => {
    tot.calories += calories * count;
    tot.protein  += protein * count;
    tot.carbs    += carbs * count;
    tot.fats     += fats * count;
    return tot;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });

// checks if food is in daily log
export const entryExistsForDay = (dayHistory, foodId) =>
  dayHistory.some(entry => entry.foodId === foodId);

// Input fields for custom foods
export const customFoodFields = [
  { key: "name", label: "Food Name", keyboardType: "default" },
  { key: "amount_g", label: "Weight (g)", keyboardType: "numeric" },
  { key: "calories", label: "Calories", keyboardType: "numeric" },
  { key: "protein", label: "Protein", keyboardType: "numeric" },
  { key: "carbs", label: "Carbs", keyboardType: "numeric" },
  { key: "fats", label: "Fats", keyboardType: "numeric" }
];