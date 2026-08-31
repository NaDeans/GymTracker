import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_GOALS = { calories: 2400, protein: 150, carbs: 330, fats: 70 };

export const loadMacroTrackerData = async () => {
  try {
    const [
      savedCustomFoods,
      savedDailyLog,
      savedHistoryByDate,
      savedGoals,
      savedCache,
      savedSupplements,
      savedSupplementLog,
    ] = await Promise.all([
      AsyncStorage.getItem("CUSTOM_FOODS"),
      AsyncStorage.getItem("DAILY_LOG"),
      AsyncStorage.getItem("HISTORY_BY_DATE"),
      AsyncStorage.getItem("GOALS"),
      AsyncStorage.getItem("GPT_CACHE"),
      AsyncStorage.getItem("SUPPLEMENTS"),
      AsyncStorage.getItem("SUPPLEMENT_LOG"),
    ]);

    return {
      customFoods: savedCustomFoods ? JSON.parse(savedCustomFoods) : [],
      dailyLog: savedDailyLog ? JSON.parse(savedDailyLog) : {},
      historyByDate: savedHistoryByDate ? JSON.parse(savedHistoryByDate) : {},
      goals: savedGoals ? JSON.parse(savedGoals) : DEFAULT_GOALS,
      gptCache: savedCache ? JSON.parse(savedCache) : {},
      supplements: savedSupplements ? JSON.parse(savedSupplements) : [],
      supplementLog: savedSupplementLog ? JSON.parse(savedSupplementLog) : {},
    };
  } catch (err) {
    console.error("Error loading macro tracker data:", err);
    return {
      customFoods: [],
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
  customFoods,
  dailyLog,
  historyByDate,
  goals,
  gptCache,
  supplements,
  supplementLog,
}) => {
  try {
    await Promise.all([
      AsyncStorage.setItem("CUSTOM_FOODS", JSON.stringify(customFoods)),
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
