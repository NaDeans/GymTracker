
import AsyncStorage from "@react-native-async-storage/async-storage";

export const loadAppData = async () => {
  const [cache, dailyLog, customFoods] = await Promise.all([
    AsyncStorage.getItem("GPT_CACHE"),
    AsyncStorage.getItem("DAILY_LOG"),
    AsyncStorage.getItem("CUSTOM_FOODS"),
  ]);

  return {
    gptCache: cache ? JSON.parse(cache) : null,
    dailyLog: dailyLog ? JSON.parse(dailyLog) : null,
    customFoods: customFoods ? JSON.parse(customFoods) : null,
  };
};