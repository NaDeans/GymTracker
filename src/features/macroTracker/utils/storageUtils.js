import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_GOALS = { calories: 2400, protein: 150, carbs: 330, fats: 70 };

// The old "custom foods" list was replaced by meals (manual entry already
// covers one-off foods). Each stored custom food becomes a one-item meal so
// nothing the user typed is lost; the old key is removed once converted, which
// is what keeps this from running twice.
const migrateCustomFoodsToMeals = async (meals) => {
  const saved = await AsyncStorage.getItem("CUSTOM_FOODS");
  if (!saved) return meals;

  let migrated = [];
  try {
    migrated = (JSON.parse(saved) || []).map((food) => ({
      id: `meal-${food.id}`,
      name: food.name,
      items: [{
        id: `${food.id}-0`,
        name: food.name,
        amount_g: food.amount_g,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        assumption: null,
      }],
    }));
  } catch (err) {
    console.error("Error migrating custom foods to meals:", err);
  }

  await AsyncStorage.removeItem("CUSTOM_FOODS");
  if (migrated.length === 0) return meals;

  const combined = [...meals, ...migrated];
  await AsyncStorage.setItem("MEALS", JSON.stringify(combined));
  return combined;
};

export const loadMacroTrackerData = async () => {
  try {
    const [savedMeals, savedDailyLog, savedHistoryByDate, savedGoals, savedCache] =
      await Promise.all([
        AsyncStorage.getItem("MEALS"),
        AsyncStorage.getItem("DAILY_LOG"),
        AsyncStorage.getItem("HISTORY_BY_DATE"),
        AsyncStorage.getItem("GOALS"),
        AsyncStorage.getItem("GPT_CACHE"),
      ]);

    return {
      meals: await migrateCustomFoodsToMeals(savedMeals ? JSON.parse(savedMeals) : []),
      dailyLog: savedDailyLog ? JSON.parse(savedDailyLog) : {},
      historyByDate: savedHistoryByDate ? JSON.parse(savedHistoryByDate) : {},
      goals: savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS,
      gptCache: savedCache ? JSON.parse(savedCache) : {},
    };
  } catch (err) {
    console.error("Error loading macro tracker data:", err);
    return { meals: [], dailyLog: {}, historyByDate: {}, goals: DEFAULT_GOALS, gptCache: {} };
  }
};

export const saveMacroTrackerData = async ({ meals, dailyLog, historyByDate, goals, gptCache }) => {
  try {
    await Promise.all([
      AsyncStorage.setItem("MEALS", JSON.stringify(meals)),
      AsyncStorage.setItem("DAILY_LOG", JSON.stringify(dailyLog)),
      AsyncStorage.setItem("HISTORY_BY_DATE", JSON.stringify(historyByDate)),
      AsyncStorage.setItem("GOALS", JSON.stringify(goals)),
      AsyncStorage.setItem("GPT_CACHE", JSON.stringify(gptCache)),
    ]);
  } catch (err) {
    console.error("Error saving macro tracker data:", err);
  }
};
