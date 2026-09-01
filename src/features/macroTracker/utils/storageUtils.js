import AsyncStorage from "@react-native-async-storage/async-storage";

import { formatFoodName, foodKey } from "shared/utils/textUtils";
import { migrateFoodData } from "./foodCacheUtils";

const DEFAULT_GOALS = { calories: 2400, protein: 150, carbs: 330, fats: 70 };

const withCleanName = (item) => (item ? { ...item, name: formatFoodName(item.name) } : item);

// Runs the name formatter over everything already on the device, so foods saved
// before a formatting rule existed don't stay misspelled or oddly capitalised.
// Cheap and idempotent — re-running it on already-clean data is a no-op — so it
// happens on every load rather than behind a one-shot migration flag.
//
// A meal's own name is the user's label for it ("Post-Gym", "Nan's Curry"), not
// a food name, so only the foods inside a meal are formatted.
const normalizeStoredNames = ({ meals, dailyLog, historyByDate, gptCache }) => {
  const cleanCache = {};
  Object.entries(gptCache).forEach(([key, entry]) => {
    const newKey = foodKey(entry?.searchKey || key);
    if (!newKey) return;
    const cleaned = { ...entry, searchKey: newKey, items: (entry?.items || []).map(withCleanName) };
    // Two old keys can normalize onto one ("Chiken Breast" and "chicken breast");
    // the first one wins, and any day already logged off the other keeps its own
    // copy of the items, so nothing disappears from a log.
    if (!cleanCache[newKey]) cleanCache[newKey] = cleaned;
  });

  const cleanHistory = {};
  Object.entries(historyByDate).forEach(([date, entries]) => {
    cleanHistory[date] = (entries || []).map((entry) => ({
      ...entry,
      key: entry?.key ? foodKey(entry.key) : entry?.key,
      items: (entry?.items || []).map(withCleanName),
    }));
  });

  const cleanDailyLog = {};
  Object.entries(dailyLog).forEach(([date, day]) => {
    const items = {};
    Object.entries(day?.items || {}).forEach(([id, logged]) => {
      items[id] = { ...logged, item: withCleanName(logged?.item) };
    });
    cleanDailyLog[date] = { ...day, items };
  });

  return {
    meals: (meals || []).map((meal) => ({ ...meal, items: (meal?.items || []).map(withCleanName) })),
    dailyLog: cleanDailyLog,
    historyByDate: cleanHistory,
    gptCache: cleanCache,
  };
};

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
    const [
      savedMeals,
      savedDailyLog,
      savedHistoryByDate,
      savedGoals,
      savedCache,
      savedSupplements,
      savedSupplementLog,
    ] = await Promise.all([
      AsyncStorage.getItem("MEALS"),
      AsyncStorage.getItem("DAILY_LOG"),
      AsyncStorage.getItem("HISTORY_BY_DATE"),
      AsyncStorage.getItem("GOALS"),
      AsyncStorage.getItem("GPT_CACHE"),
      AsyncStorage.getItem("SUPPLEMENTS"),
      AsyncStorage.getItem("SUPPLEMENT_LOG"),
    ]);

    // Convert any leftover custom foods first, so the formatter below sees the
    // meals they became rather than having to run over both shapes.
    const meals = await migrateCustomFoodsToMeals(savedMeals ? JSON.parse(savedMeals) : []);

    // Two idempotent passes, in this order: first tidy every stored name and
    // re-key off the corrected spelling, then split any legacy multi-food saved
    // food into one food per entry. Migrating second means it keys off names
    // that are already clean, so `foodKey(name) === key` holds after a load.
    const cleaned = normalizeStoredNames({
      meals,
      dailyLog: savedDailyLog ? JSON.parse(savedDailyLog) : {},
      historyByDate: savedHistoryByDate ? JSON.parse(savedHistoryByDate) : {},
      gptCache: savedCache ? JSON.parse(savedCache) : {},
    });

    const { gptCache, historyByDate } = migrateFoodData(cleaned.gptCache, cleaned.historyByDate);

    return {
      meals: cleaned.meals,
      dailyLog: cleaned.dailyLog,
      historyByDate,
      gptCache,
      goals: savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS,
      supplements: savedSupplements ? JSON.parse(savedSupplements) : [],
      supplementLog: savedSupplementLog ? JSON.parse(savedSupplementLog) : {},
    };
  } catch (err) {
    console.error("Error loading macro tracker data:", err);
    return {
      meals: [],
      dailyLog: {},
      historyByDate: {},
      goals: DEFAULT_GOALS,
      gptCache: {},
      supplements: [],
      supplementLog: {},
    };
  }
};

export const saveMacroTrackerData = async ({
  meals,
  dailyLog,
  historyByDate,
  goals,
  gptCache,
  supplements,
  supplementLog,
}) => {
  try {
    await Promise.all([
      AsyncStorage.setItem("MEALS", JSON.stringify(meals)),
      AsyncStorage.setItem("DAILY_LOG", JSON.stringify(dailyLog)),
      AsyncStorage.setItem("HISTORY_BY_DATE", JSON.stringify(historyByDate)),
      AsyncStorage.setItem("GOALS", JSON.stringify(goals)),
      AsyncStorage.setItem("GPT_CACHE", JSON.stringify(gptCache)),
      AsyncStorage.setItem("SUPPLEMENTS", JSON.stringify(supplements)),
      AsyncStorage.setItem("SUPPLEMENT_LOG", JSON.stringify(supplementLog)),
    ]);
  } catch (err) {
    console.error("Error saving macro tracker data:", err);
  }
};
