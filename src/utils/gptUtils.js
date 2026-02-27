/**
 * Safely parses GPT-generated JSON text into an object.
 * Removes code block formatting and validates that items exist.
 *
 * @param {string} gptText - Raw GPT output
 * @returns {object} Parsed object containing nutrition items
 * @throws {Error} If parsing fails or no items are returned
 */
export const parseGPTJSONSafely = (gptText) => {
  try {
    const cleanedText = gptText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    if (!parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      throw new Error("No nutrition items returned");
    }

    return parsed;
  } catch (err) {
    console.error("❌ GPT JSON parse error:", err);
    throw new Error("Failed to parse GPT JSON output");
  }
};



/**
 * Normalizes a nutrition item object into a consistent format.
 *
 * Accepts various possible keys from GPT output and ensures numbers are safe.
 *
 * @param {object} rawItem - Raw item from GPT
 * @returns {object} Normalized food item with consistent keys
 */
import { parseNumberSafe, formatFoodName } from "./macroUtils";
import { roundToTwo } from "./numberUtils";

export const normalizeFoodItem = (rawItem = {}) => {
  if (!rawItem || typeof rawItem !== "object") {
    console.warn("Invalid raw item, returning empty food item");
    return {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: "",
      grams: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      assumption: null
    };
  }

  const protein = roundToTwo(parseNumberSafe(rawItem.protein_g ?? rawItem.protein ?? 0));
  const carbs   = roundToTwo(parseNumberSafe(rawItem.carbs_g ?? rawItem.carbs ?? 0));
  const fats    = roundToTwo(parseNumberSafe(rawItem.fat_g ?? rawItem.fats ?? 0));
  const grams   = roundToTwo(rawItem.amount_g != null ? parseNumberSafe(rawItem.amount_g) : 0);

  // Calories = 4*protein + 4*carbs + 9*fats, rounded to 2 decimals
  const calories = roundToTwo(protein * 4 + carbs * 4 + fats * 9);

  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: formatFoodName(rawItem.name),
    grams,
    calories,
    protein,
    carbs,
    fats,
    assumption: rawItem.assumption?.trim() || null
  };
};