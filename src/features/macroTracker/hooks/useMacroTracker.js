import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Keyboard, Share } from "react-native";
import { ANTHROPIC_API_KEY } from "@env";

import { todayString } from "shared/utils/dateUtils";
import { safeNumber } from "shared/utils/numberUtils";
import { calcCurrentStreak, dayHasLog } from "shared/utils/streakUtils";
import { calcTotals, entryExistsForDay, isGoalMet } from "../utils/macroUtils";
import { loadMacroTrackerData, saveMacroTrackerData } from "../utils/storageUtils";
import { countFoodUsage, rankFoodSuggestions } from "../utils/searchUtils";
import { fetchNutritionFromGPT, fetchNutritionFromImage } from "../services/gptService";
import { formatDayForExport, formatRangeForExport } from "../utils/exportUtils";

export const useMacroTracker = () => {
  // UI
  const [refreshing, setRefreshing] = useState(false);
  const [foodDbVisible, setFoodDbVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  // Food form / editing
  const [customFoods, setCustomFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [newFood, setNewFood] = useState({ name: "", amount_g: "", calories: "", protein: "", carbs: "", fats: "" });
  const [editingFoodId, setEditingFoodId] = useState(null);

  // Search / suggestions
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gptCache, setGptCache] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  // Manual entry modal
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualEntryName, setManualEntryName] = useState("");
  const [manualEntryInitialValues, setManualEntryInitialValues] = useState(null);

  // Logs / dates
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [historyByDate, setHistoryByDate] = useState({});
  const [dailyLog, setDailyLog] = useState({});
  const [gramInputs, setGramInputs] = useState({});

  // Goals
  const [goals, setGoals] = useState({ calories: 2400, protein: 150, carbs: 330, fats: 70 });
  const [editingMacro, setEditingMacro] = useState("");
  const [goalInput, setGoalInput] = useState("");

  // Guards the save effect: without it, the first render saves the empty
  // initial state over the stored data before the load below resolves.
  const hasLoaded = useRef(false);

  useEffect(() => {
    loadMacroTrackerData().then((data) => {
      setCustomFoods(data.customFoods);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGoals(data.goals);
      setGptCache(data.gptCache);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveMacroTrackerData({ customFoods, dailyLog, historyByDate, goals, gptCache });
  }, [customFoods, dailyLog, historyByDate, goals, gptCache]);

  // How often each cached food has been logged, used to break ties between
  // suggestions that match the search term equally well.
  const foodUsageCounts = useMemo(() => countFoodUsage(historyByDate), [historyByDate]);

  useEffect(() => {
    if (suppressSuggestions) { setSuppressSuggestions(false); return; }
    if (!input.trim()) { setSuggestions([]); return; }
    setSuggestions(rankFoodSuggestions(Object.keys(gptCache), input, foodUsageCounts, 5));
  }, [input, gptCache, foodUsageCounts]);

  useEffect(() => {
    const dayItems = dailyLog[selectedDate]?.items || {};
    const synced = {};
    Object.values(dayItems).forEach(({ item }) => { synced[item.id] = String(item.amount_g); });
    setGramInputs(synced);
  }, [dailyLog, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setInput("");
      setSuggestions([]);
      const data = await loadMacroTrackerData();
      setCustomFoods(data.customFoods);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGptCache(data.gptCache);
    } catch (err) {
      console.error("Refresh error:", err);
    }
    setRefreshing(false);
  };

  const addItem = (item) => {
    const raw = item.raw || item;
    const amount_g = safeNumber(raw.amount_g);
    const calories = safeNumber(raw.calories);
    const protein = safeNumber(raw.protein);
    const carbs = safeNumber(raw.carbs);
    const fats = safeNumber(raw.fats);

    let gramsToAdd = safeNumber(item.amount_g);
    const parsed = parseFloat(gramInputs[item.id]);
    if (!isNaN(parsed) && parsed > 0) gramsToAdd = parsed;

    const itemToAdd = {
      ...item,
      amount_g: gramsToAdd,
      calories: (calories * gramsToAdd) / (amount_g || 1),
      protein: (protein * gramsToAdd) / (amount_g || 1),
      carbs: (carbs * gramsToAdd) / (amount_g || 1),
      fats: (fats * gramsToAdd) / (amount_g || 1),
      raw: { amount_g, calories, protein, carbs, fats },
    };

    setDailyLog((prev) => {
      const day = prev[selectedDate] || { items: {} };
      const newItems = { ...day.items };
      if (newItems[item.id]) {
        newItems[item.id] = { item: itemToAdd, count: newItems[item.id].count + 1 };
      } else {
        newItems[item.id] = { item: itemToAdd, count: 1 };
      }
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });
  };

  const removeItem = (item) => {
    setDailyLog((prev) => {
      const day = prev[selectedDate];
      if (!day?.items[item.id]) return prev;
      const newItems = { ...day.items };
      newItems[item.id].count -= 1;
      if (newItems[item.id].count <= 0) delete newItems[item.id];
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });
  };

  const clearItem = (item) => {
    setDailyLog((prev) => {
      const day = prev[selectedDate];
      if (!day?.items[item.id]) return prev;
      const newItems = { ...day.items };
      delete newItems[item.id];
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });
    setHistoryByDate((prev) => {
      const cleaned = (prev[selectedDate] || [])
        .map((entry) => ({ ...entry, items: entry.items.filter((i) => i.id !== item.id) }))
        .filter((entry) => entry.items.length > 0);
      return { ...prev, [selectedDate]: cleaned };
    });
  };

  const updateGrams = (id, grams) => {
    setDailyLog((prev) => {
      const day = prev[selectedDate];
      if (!day?.items?.[id]) return prev;
      const { item } = day.items[id];
      const raw = item.raw || item;
      const baseG = safeNumber(raw.amount_g) || 1;
      const scaled = {
        ...item,
        amount_g: grams,
        calories: (safeNumber(raw.calories) * grams) / baseG,
        protein: (safeNumber(raw.protein) * grams) / baseG,
        carbs: (safeNumber(raw.carbs) * grams) / baseG,
        fats: (safeNumber(raw.fats) * grams) / baseG,
      };
      const newItems = { ...day.items, [id]: { ...day.items[id], item: scaled } };
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });
  };

  const resetDay = () => {
    Alert.alert(
      "Reset Day?",
      "Are you sure you want to clear all foods and macros for this day? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setDailyLog((prev) => { const u = { ...prev }; delete u[selectedDate]; return u; });
            setHistoryByDate((prev) => { const u = { ...prev }; delete u[selectedDate]; return u; });
          },
        },
      ]
    );
  };

  const exportDay = async () => {
    try {
      const message = formatDayForExport(selectedDate, historyByDate, dailyLog, goals);
      await Share.share({ message });
    } catch (err) {
      console.error("Export day error:", err);
    }
  };

  const exportRange = async (days = 14) => {
    try {
      const message = formatRangeForExport(selectedDate, days, historyByDate, dailyLog, goals);
      await Share.share({ message });
    } catch (err) {
      console.error("Export range error:", err);
    }
  };

  const addCustomFood = (food) => {
    const item = {
      ...food,
      id: Date.now().toString(),
      amount_g: safeNumber(food.amount_g),
      calories: safeNumber(food.calories),
      protein: safeNumber(food.protein),
      carbs: safeNumber(food.carbs),
      fats: safeNumber(food.fats),
      assumption: null,
    };
    setHistoryByDate((prev) => {
      const newItem = { ...item, raw: { calories: item.calories, protein: item.protein, carbs: item.carbs, fats: item.fats, amount_g: item.amount_g } };
      return { ...prev, [selectedDate]: [{ items: [newItem] }, ...(prev[selectedDate] || [])] };
    });
    setFoodDbVisible(false);
  };

  const submit = async (inputOverride) => {
    const rawInput = inputOverride ?? input;
    if (!rawInput.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const key = rawInput.trim().toLowerCase();

      if (gptCache[key]) {
        const data = gptCache[key];
        setHistoryByDate((prev) => {
          const dayHistory = prev[selectedDate] || [];
          if (entryExistsForDay(dayHistory, data.foodId)) {
            Alert.alert("Already added", "This food is already in today's log.");
            return prev;
          }
          const newItems = data.items.map((i) => ({ ...i, raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g } }));
          return { ...prev, [selectedDate]: [{ foodId: data.foodId, key, items: newItems }, ...dayHistory] };
        });
      } else {
        const items = await fetchNutritionFromGPT(rawInput, ANTHROPIC_API_KEY);
        const uniqueFoodId = Date.now().toString() + Math.random().toString(36).slice(2);

        // Update state — the save effect persists this to AsyncStorage automatically
        setGptCache((prev) => ({ ...prev, [key]: { searchKey: key, foodId: uniqueFoodId, items } }));

        setHistoryByDate((prev) => {
          const dayHistory = prev[selectedDate] || [];
          if (entryExistsForDay(dayHistory, uniqueFoodId)) {
            Alert.alert("Already added", "This food is already in today's log.");
            return prev;
          }
          const newItems = items.map((i) => ({ ...i, raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g } }));
          return { ...prev, [selectedDate]: [{ foodId: uniqueFoodId, key, items: newItems }, ...dayHistory] };
        });
      }
    } catch (err) {
      console.error("GPT error:", err);
      if (err.message === "No nutrition items returned") {
        Alert.alert(
          "Food not found",
          "Couldn't find nutrition data for that. Enter macros manually?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Enter manually", onPress: () => { setManualEntryName(rawInput.trim()); setManualEntryVisible(true); } },
          ]
        );
      } else {
        Alert.alert("Error", "Something went wrong fetching nutrition data. Check your connection and API key.");
      }
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  const submitFromImage = async (base64Image) => {
    setLoading(true);
    try {
      const items = await fetchNutritionFromImage(base64Image, ANTHROPIC_API_KEY);
      const item = items[0];
      setManualEntryInitialValues({
        name: item.name,
        amount_g: String(item.amount_g ?? ""),
        calories: String(item.calories),
        protein: String(item.protein),
        carbs: String(item.carbs),
        fats: String(item.fats),
        assumption: item.assumption,
      });
      setManualEntryName(item.name);
      setManualEntryVisible(true);
    } catch (err) {
      console.error("GPT image error:", err);
      if (err.message === "No nutrition items returned") {
        Alert.alert(
          "Couldn't read label",
          "Enter the values manually instead?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Enter manually", onPress: () => { setManualEntryInitialValues(null); setManualEntryName(""); setManualEntryVisible(true); } },
          ]
        );
      } else {
        Alert.alert("Error", "Something went wrong reading that photo. Check your connection and API key.");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveManualEntry = ({ name, amount_g, calories, protein, carbs, fats }) => {
    const key = name.toLowerCase();
    const uniqueFoodId = Date.now().toString() + Math.random().toString(36).slice(2);
    const item = { id: uniqueFoodId, name, amount_g, calories, protein, carbs, fats, assumption: null };
    const itemWithRaw = { ...item, raw: { calories, protein, carbs, fats, amount_g } };
    const source = manualEntryInitialValues ? "scan" : "manual";

    let duplicate = false;
    setHistoryByDate((prev) => {
      const dayHistory = prev[selectedDate] || [];
      if (dayHistory.some((entry) => entry.key === key)) {
        duplicate = true;
        return prev;
      }
      return { ...prev, [selectedDate]: [{ foodId: uniqueFoodId, key, items: [itemWithRaw] }, ...dayHistory] };
    });

    if (duplicate) {
      Alert.alert("Already added", "This food is already in today's log.");
      return;
    }

    setGptCache((prev) => ({ ...prev, [key]: { searchKey: key, foodId: uniqueFoodId, items: [item], source } }));
    addItem(itemWithRaw);
    setManualEntryVisible(false);
    setManualEntryInitialValues(null);
    setInput("");
  };

  // Accepts the edited food from the modal (which has already normalized the
  // number fields) rather than reading this hook's not-yet-updated state.
  const addEditedFoodToLog = (foodOverride) => {
    const food = foodOverride || editingFood;
    if (!food) return;
    const itemsWithRaw = food.items.map((i) => ({
      ...i,
      raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g },
    }));
    const foodId = food.foodId;
    const key = food.key.trim().toLowerCase();

    setHistoryByDate((prev) => {
      const dayHistory = prev[selectedDate] || [];
      const idx = dayHistory.findIndex((entry) => entry.foodId === foodId);
      if (idx === -1) {
        return { ...prev, [selectedDate]: [{ foodId, key, items: itemsWithRaw }, ...dayHistory] };
      }
      const updated = [...dayHistory];
      updated[idx] = { ...updated[idx], key, items: itemsWithRaw };
      return { ...prev, [selectedDate]: updated };
    });

    itemsWithRaw.forEach((item) => addItem(item));
  };

  // Applies an edit made via EditCachedFoodModal back onto an already-logged
  // day entry: keeps today's serving size/count but refreshes the name and
  // per-serving macros for every item, matched by id.
  const updateLoggedFoodEntry = (entryIndex, editedFood) => {
    const itemsWithRaw = editedFood.items.map((i) => ({
      ...i,
      raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g },
    }));

    setHistoryByDate((prev) => {
      const dayHistory = prev[selectedDate] || [];
      if (!dayHistory[entryIndex]) return prev;
      const updated = [...dayHistory];
      updated[entryIndex] = { ...updated[entryIndex], key: editedFood.key, items: itemsWithRaw };
      return { ...prev, [selectedDate]: updated };
    });

    setDailyLog((prev) => {
      const day = prev[selectedDate];
      if (!day) return prev;
      const newItems = { ...day.items };
      itemsWithRaw.forEach((newItem) => {
        const existing = newItems[newItem.id];
        if (!existing) return;
        const currentGrams = safeNumber(existing.item.amount_g) || safeNumber(newItem.amount_g) || 1;
        const baseG = safeNumber(newItem.amount_g) || 1;
        newItems[newItem.id] = {
          ...existing,
          item: {
            ...newItem,
            amount_g: currentGrams,
            calories: (safeNumber(newItem.calories) * currentGrams) / baseG,
            protein: (safeNumber(newItem.protein) * currentGrams) / baseG,
            carbs: (safeNumber(newItem.carbs) * currentGrams) / baseG,
            fats: (safeNumber(newItem.fats) * currentGrams) / baseG,
          },
        };
      });
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });
  };

  const closeManualEntry = () => {
    setManualEntryVisible(false);
    setManualEntryInitialValues(null);
  };

  const dayData = dailyLog[selectedDate] || { items: {}, totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } };

  const currentStreak = useMemo(() => calcCurrentStreak(dailyLog), [dailyLog]);
  const selectedDayGoalMet = useMemo(
    () => isGoalMet(dayData.totals, goals, dayHasLog(dailyLog, selectedDate)),
    [dayData.totals, goals, dailyLog, selectedDate]
  );

  return {
    refreshing, onRefresh,
    foodDbVisible, setFoodDbVisible,
    editModalVisible, setEditModalVisible,
    goalModalVisible, setGoalModalVisible,
    customFoods, setCustomFoods,
    editingFood, setEditingFood,
    newFood, setNewFood,
    editingFoodId, setEditingFoodId,
    input, setInput,
    loading,
    gptCache, setGptCache,
    suggestions, setSuggestions,
    setSuppressSuggestions,
    selectedDate, setSelectedDate,
    historyByDate,
    dailyLog,
    gramInputs, setGramInputs,
    totalMacros: dayData.totals,
    currentStreak,
    selectedDayGoalMet,
    goals, setGoals,
    editingMacro, setEditingMacro,
    goalInput, setGoalInput,
    addItem, removeItem, clearItem, updateGrams, resetDay, exportDay, exportRange,
    addCustomFood, submit, submitFromImage,
    manualEntryVisible, setManualEntryVisible,
    manualEntryName, setManualEntryName,
    manualEntryInitialValues, closeManualEntry,
    saveManualEntry,
    addEditedFoodToLog,
    updateLoggedFoodEntry,
  };
};
