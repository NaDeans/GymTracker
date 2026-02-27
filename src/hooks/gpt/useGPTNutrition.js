// src/hooks/gpt/useGPTNutrition.js
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseGPTJSONSafely, normalizeFoodItem } from "../../utils/gptUtils";
import { entryExistsForDay } from "../../utils/macroUtils";

export const useGPTNutrition = (initialCache = {}, setHistoryByDate) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gptCache, setGptCache] = useState(initialCache);

  const submitFoodQuery = async (date) => {
    if (!input.trim()) return;
    setLoading(true);
    const key = input.trim().toLowerCase();

    try {
      const savedCache = await AsyncStorage.getItem("GPT_CACHE");
      const cache = savedCache ? JSON.parse(savedCache) : {};
      setGptCache(cache);

      // Use cached if available
      if (cache[key]) {
        const cached = cache[key];
        setHistoryByDate(prev => {
          const dayHistory = prev[date] || [];
          if (entryExistsForDay(dayHistory, cached.foodId)) return prev;
          return { ...prev, [date]: [cached, ...dayHistory] };
        });
      }
      // API call logic remains the same...
      // (fetch GPT, parse, normalize, update cache & history)
    } catch (err) {
      console.error("GPT error:", err);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return { input, setInput, loading, submitFoodQuery, gptCache };
};