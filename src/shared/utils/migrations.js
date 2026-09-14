import AsyncStorage from "@react-native-async-storage/async-storage";

// One pre-release build stored meal preps under the RECIPES key, which the
// Recipes tab owns for free-form notes. A device that ran it holds prep-shaped
// objects there, and `useRecipes` does no shape checking: it would render them
// as blank notes and then write note-shaped data back over them, destroying
// preps that dailyLog still references by id.
//
// A prep is a bulk cook (ingredients + servings); a note is free text (body).
const isMealPrep = (r) => !!r && Array.isArray(r.ingredients) && r.servings !== undefined;

// Idempotent: once RECIPES holds only notes the early return makes re-running
// this a no-op, which is why it needs no "already ran" flag.
export const migrateMealPrepsOffRecipesKey = async () => {
  try {
    const [[, rawRecipes], [, rawPreps]] = await AsyncStorage.multiGet(["RECIPES", "MEAL_PREPS"]);
    const stored = JSON.parse(rawRecipes || "[]");
    if (!Array.isArray(stored)) return;

    const strays = stored.filter(isMealPrep);
    if (strays.length === 0) return;

    const notes = stored.filter((r) => !isMealPrep(r));
    const existing = JSON.parse(rawPreps || "[]");
    // Anything already under MEAL_PREPS is the newer write, so it wins on id.
    const byId = new Map([...strays, ...(Array.isArray(existing) ? existing : [])].map((p) => [p.id, p]));

    await AsyncStorage.multiSet([
      ["MEAL_PREPS", JSON.stringify([...byId.values()])],
      ["RECIPES", JSON.stringify(notes)],
    ]);
  } catch (err) {
    console.error("Error migrating meal preps off the RECIPES key:", err);
  }
};
