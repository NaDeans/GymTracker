import AsyncStorage from "@react-native-async-storage/async-storage";

export const loadMacroTrackerData = async () => {
  try {
    const [
      savedCustomFoods,
      savedDailyLog,
      savedHistoryByDate,
      savedGoals,
      savedCache
    ] = await Promise.all([
      AsyncStorage.getItem("CUSTOM_FOODS"),
      AsyncStorage.getItem("DAILY_LOG"),
      AsyncStorage.getItem("HISTORY_BY_DATE"),
      AsyncStorage.getItem("GOALS"),
      AsyncStorage.getItem("GPT_CACHE")
    ]);

    return {
      customFoods: savedCustomFoods ? JSON.parse(savedCustomFoods) : [],
      dailyLog: savedDailyLog ? JSON.parse(savedDailyLog) : {},
      historyByDate: savedHistoryByDate ? JSON.parse(savedHistoryByDate) : {},
      goals: savedGoals ? JSON.parse(savedGoals) : { calories: 2400, protein: 150, carbs: 330, fats: 70 },
      gptCache: savedCache ? JSON.parse(savedCache) : {},
    };
  } catch (err) {
    console.error("Error loading macro tracker data:", err);
    return {
      customFoods: [],
      dailyLog: {},
      historyByDate: {},
      goals: { calories: 2400, protein: 150, carbs: 330, fats: 70 },
      gptCache: {},
    };
  }
};

export const saveMacroTrackerData = async ({
  customFoods,
  dailyLog,
  historyByDate,
  goals,
  gptCache
}) => {
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