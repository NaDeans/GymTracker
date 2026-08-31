import AsyncStorage from "@react-native-async-storage/async-storage";

import { formatFoodName, foodKey } from "shared/utils/textUtils";

const DEFAULT_GOALS = { calories: 2400, protein: 150, carbs: 330, fats: 70 };

const withCleanName = (item) => (item ? { ...item, name: formatFoodName(item.name) } : item);

// Runs the name formatter over everything already on the device, so foods saved
// before a formatting rule existed don't stay misspelled or oddly capitalised.
// Cheap and idempotent — re-running it on already-clean data is a no-op — so it
// happens on every load rather than behind a one-shot migration flag.
const normalizeStoredNames = ({ customFoods, dailyLog, historyByDate, gptCache }) => {
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
    customFoods: (customFoods || []).map(withCleanName),
    dailyLog: cleanDailyLog,
    historyByDate: cleanHistory,
    gptCache: cleanCache,
  };
};

export const loadMacroTrackerData = async () => {
  try {
    const [savedCustomFoods, savedDailyLog, savedHistoryByDate, savedGoals, savedCache] =
      await Promise.all([
        AsyncStorage.getItem("CUSTOM_FOODS"),
        AsyncStorage.getItem("DAILY_LOG"),
        AsyncStorage.getItem("HISTORY_BY_DATE"),
        AsyncStorage.getItem("GOALS"),
        AsyncStorage.getItem("GPT_CACHE"),
      ]);

    return {
      ...normalizeStoredNames({
        customFoods: savedCustomFoods ? JSON.parse(savedCustomFoods) : [],
        dailyLog: savedDailyLog ? JSON.parse(savedDailyLog) : {},
        historyByDate: savedHistoryByDate ? JSON.parse(savedHistoryByDate) : {},
        gptCache: savedCache ? JSON.parse(savedCache) : {},
      }),
      goals: savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS,
    };
  } catch (err) {
    console.error("Error loading macro tracker data:", err);
    return { customFoods: [], dailyLog: {}, historyByDate: {}, goals: DEFAULT_GOALS, gptCache: {} };
  }
};

export const saveMacroTrackerData = async ({ customFoods, dailyLog, historyByDate, goals, gptCache }) => {
  try {
    await Promise.all([
      AsyncStorage.setItem("CUSTOM_FOODS", JSON.stringify(customFoods)),
      AsyncStorage.setItem("DAILY_LOG", JSON.stringify(dailyLog)),
      AsyncStorage.setItem("HISTORY_BY_DATE", JSON.stringify(historyByDate)),
      AsyncStorage.setItem("GOALS", JSON.stringify(goals)),
      AsyncStorage.setItem("GPT_CACHE", JSON.stringify(gptCache)),
    ]);
  } catch (err) {
    console.error("Error saving macro tracker data:", err);
  }
};
