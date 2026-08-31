import { safeNumber } from "shared/utils/numberUtils";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const createEmptyMealItem = () => ({
  id: uid(),
  name: "",
  amount_g: "",
  calories: "",
  protein: "",
  carbs: "",
  fats: "",
  assumption: "",
});

export const createEmptyMeal = () => ({ id: null, name: "", items: [createEmptyMealItem()] });

// Meals are edited as raw strings (so partial input like "2." survives typing);
// numbers are coerced only on save — same convention as EditCachedFoodModal.
export const mealToDraft = (meal) => ({
  id: meal.id ?? null,
  name: meal.name || "",
  items: (meal.items || []).map((item) => ({
    id: item.id || uid(),
    name: item.name || "",
    amount_g: item.amount_g?.toString() ?? "",
    calories: item.calories?.toString() ?? "",
    protein: item.protein?.toString() ?? "",
    carbs: item.carbs?.toString() ?? "",
    fats: item.fats?.toString() ?? "",
    assumption: item.assumption || "",
  })),
});

export const normalizeMeal = (draft) => ({
  id: draft.id || uid(),
  name: draft.name.trim(),
  items: draft.items.map((item) => ({
    id: item.id || uid(),
    name: (item.name || "").trim(),
    amount_g: safeNumber(item.amount_g),
    calories: safeNumber(item.calories),
    protein: safeNumber(item.protein),
    carbs: safeNumber(item.carbs),
    fats: safeNumber(item.fats),
    assumption: item.assumption?.trim() ? item.assumption.trim() : null,
  })),
});

// Builds the daily-log items for one logging of a meal. Ids are minted fresh on
// every add so the same meal logged twice in a day stays two separate blocks
// instead of collapsing onto one entry, and so a meal's foods never collide
// with the same food logged on its own.
export const mealToLogItems = (meal) => {
  const stamp = uid();
  return meal.items.map((item, index) => {
    const base = {
      id: `${stamp}-${index}`,
      name: item.name,
      amount_g: safeNumber(item.amount_g),
      calories: safeNumber(item.calories),
      protein: safeNumber(item.protein),
      carbs: safeNumber(item.carbs),
      fats: safeNumber(item.fats),
      assumption: item.assumption || null,
    };
    return {
      ...base,
      raw: {
        amount_g: base.amount_g,
        calories: base.calories,
        protein: base.protein,
        carbs: base.carbs,
        fats: base.fats,
      },
    };
  });
};

// Snapshots the selected foods of a day exactly as they are logged — current
// grams and macros, multiplied by how many times each was added — so a saved
// meal reproduces what was actually eaten. Returned in daily-log order.
export const logItemsToMealItems = (selectedIds, historyEntries = [], dayItems = {}) => {
  const selected = new Set(selectedIds);
  const seen = new Set();
  const items = [];

  historyEntries.forEach((entry) => {
    entry.items.forEach((historyItem) => {
      if (!selected.has(historyItem.id) || seen.has(historyItem.id)) return;
      seen.add(historyItem.id);

      const logged = dayItems[historyItem.id];
      const source = logged ? logged.item : historyItem;
      const count = logged ? logged.count : 1;

      items.push({
        id: uid(),
        name: source.name,
        amount_g: safeNumber(source.amount_g) * count,
        calories: safeNumber(source.calories) * count,
        protein: safeNumber(source.protein) * count,
        carbs: safeNumber(source.carbs) * count,
        fats: safeNumber(source.fats) * count,
        assumption: source.assumption || null,
      });
    });
  });

  return items;
};
