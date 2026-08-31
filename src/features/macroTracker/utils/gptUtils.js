import { formatFoodName } from "shared/utils/textUtils";

export const safeParseJSON = (text) => {
  let parsed;
  try {
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("JSON parse error:", err);
    throw new Error("Failed to parse GPT JSON output");
  }
  if (!parsed.items || parsed.items.length === 0) throw new Error("No nutrition items returned");
  return parsed;
};

export const normalizeAndValidateItem = (i) => {
  const protein = Number(i.protein_g ?? i.protein ?? 0);
  const carbs = Number(i.carbs_g ?? i.carbs ?? 0);
  const fats = Number(i.fat_g ?? i.fats ?? 0);
  const amount_g = i.amount_g != null ? Number(i.amount_g) : null;

  // Trust the returned calorie value — real foods don't perfectly follow 4,4,9.
  // Only fall back to calculation if the field is missing or zero.
  const rawCals = Number(i.calories_kcal ?? i.calories ?? 0);
  const calories = rawCals > 0 ? Math.round(rawCals) : Math.round(protein * 4 + carbs * 4 + fats * 9);

  return {
    id: Date.now().toString() + Math.random(),
    name: formatFoodName(i.name),
    amount_g,
    calories,
    protein,
    carbs,
    fats,
    assumption: i.assumption?.trim() ? i.assumption : null,
  };
};
