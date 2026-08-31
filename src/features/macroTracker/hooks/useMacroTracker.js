import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Keyboard, Share } from "react-native";
import { ANTHROPIC_API_KEY } from "@env";

import { todayString } from "shared/utils/dateUtils";
import { safeNumber } from "shared/utils/numberUtils";
import { calcCurrentStreak, dayHasLog } from "shared/utils/streakUtils";
import { calcTotals, entryExistsForDay, isGoalMet } from "../utils/macroUtils";
import {
  createEmptyMeal,
  createEmptyMealItem,
  logItemsToMealItems,
  mealToDraft,
  mealToLogItems,
  normalizeMeal,
} from "../utils/mealUtils";
import { loadMacroTrackerData, saveMacroTrackerData } from "../utils/storageUtils";
import { fetchNutritionFromGPT, fetchNutritionFromImage } from "../services/gptService";
import { formatDayForExport, formatRangeForExport } from "../utils/exportUtils";

export const useMacroTracker = () => {
  // UI
  const [refreshing, setRefreshing] = useState(false);
  const [mealsVisible, setMealsVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  // Food editing
  const [editingFood, setEditingFood] = useState(null);

  // Meals
  const [meals, setMeals] = useState([]);
  const [mealEditorVisible, setMealEditorVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editorReturnsToMeals, setEditorReturnsToMeals] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

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
      setMeals(data.meals);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGoals(data.goals);
      setGptCache(data.gptCache);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveMacroTrackerData({ meals, dailyLog, historyByDate, goals, gptCache });
  }, [meals, dailyLog, historyByDate, goals, gptCache]);

  useEffect(() => {
    if (suppressSuggestions) { setSuppressSuggestions(false); return; }
    if (!input.trim()) { setSuggestions([]); return; }
    const matches = Object.keys(gptCache).filter((k) => k.toLowerCase().includes(input.toLowerCase()));
    setSuggestions(matches.slice(0, 5));
  }, [input, gptCache]);

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
      setMeals(data.meals);
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

  /* ================= MEALS ================= */

  // Logs every food of a meal as one grouped day entry. Adding the same meal
  // twice makes two blocks rather than bumping counts, because each add mints
  // fresh item ids.
  const addMealToLog = (meal) => {
    const items = mealToLogItems(meal);
    if (items.length === 0) {
      Alert.alert("Empty meal", "This meal has no foods in it yet.");
      return;
    }

    setHistoryByDate((prev) => ({
      ...prev,
      [selectedDate]: [
        { foodId: `meal-${items[0].id}`, key: meal.name.toLowerCase(), mealId: meal.id, mealName: meal.name, items },
        ...(prev[selectedDate] || []),
      ],
    }));

    items.forEach((item) => addItem(item));
    setMealsVisible(false);
  };

  // The editor is opened either from the meals list or straight from a log
  // selection; only the first case should drop the user back on the list.
  const openMealEditor = (meal) => {
    setEditingMeal(meal ? mealToDraft(meal) : createEmptyMeal());
    setEditorReturnsToMeals(mealsVisible);
    setMealsVisible(false);
    setMealEditorVisible(true);
  };

  const closeMealEditor = () => {
    setMealEditorVisible(false);
    setEditingMeal(null);
    if (editorReturnsToMeals) setMealsVisible(true);
    setEditorReturnsToMeals(false);
  };

  const updateMealEditorName = (name) => {
    setEditingMeal((prev) => (prev ? { ...prev, name } : prev));
  };

  const addMealEditorItem = () => {
    setEditingMeal((prev) => (prev ? { ...prev, items: [...prev.items, createEmptyMealItem()] } : prev));
  };

  const removeMealEditorItem = (index) => {
    setEditingMeal((prev) => (prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : prev));
  };

  const updateMealEditorItem = (index, field, value) => {
    setEditingMeal((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const saveMeal = () => {
    if (!editingMeal) return;
    if (!editingMeal.name.trim()) {
      Alert.alert("Missing Name", "Please give this meal a name.");
      return;
    }
    if (editingMeal.items.length === 0) {
      Alert.alert("No Foods", "Add at least one food to this meal.");
      return;
    }
    if (editingMeal.items.some((item) => !item.name.trim())) {
      Alert.alert("Missing Name", "Every food in the meal needs a name.");
      return;
    }

    const meal = normalizeMeal(editingMeal);
    setMeals((prev) => {
      const idx = prev.findIndex((m) => m.id === meal.id);
      if (idx === -1) return [...prev, meal];
      const updated = [...prev];
      updated[idx] = meal;
      return updated;
    });
    closeMealEditor();
  };

  const deleteMeal = (meal) => {
    Alert.alert(
      "Delete Meal?",
      `Remove "${meal.name}" from your meals? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setMeals((prev) => prev.filter((m) => m.id !== meal.id)),
        },
      ]
    );
  };

  /* ---- Building a meal out of foods already in the day's log ---- */

  const startMealSelection = () => {
    setSelectionMode(true);
    setSelectedItemIds([]);
  };

  const cancelMealSelection = () => {
    setSelectionMode(false);
    setSelectedItemIds([]);
  };

  const toggleItemSelection = (id) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createMealFromSelection = () => {
    const items = logItemsToMealItems(
      selectedItemIds,
      historyByDate[selectedDate] || [],
      dailyLog[selectedDate]?.items || {}
    );
    if (items.length === 0) {
      Alert.alert("Nothing selected", "Pick at least one food from the log to save as a meal.");
      return;
    }
    setEditingMeal(mealToDraft({ id: null, name: "", items }));
    setMealEditorVisible(true);
    setSelectionMode(false);
    setSelectedItemIds([]);
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
      updated[entryIndex] = {
        ...updated[entryIndex],
        key: editedFood.key,
        items: itemsWithRaw,
        ...(editedFood.mealName !== undefined && { mealName: editedFood.mealName }),
      };
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
    mealsVisible, setMealsVisible,
    editModalVisible, setEditModalVisible,
    goalModalVisible, setGoalModalVisible,
    editingFood, setEditingFood,
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
    submit, submitFromImage,
    meals,
    mealEditorVisible, editingMeal,
    openMealEditor, closeMealEditor, saveMeal, deleteMeal, addMealToLog,
    updateMealEditorName, addMealEditorItem, removeMealEditorItem, updateMealEditorItem,
    selectionMode, selectedItemIds,
    startMealSelection, cancelMealSelection, toggleItemSelection, createMealFromSelection,
    manualEntryVisible, setManualEntryVisible,
    manualEntryName, setManualEntryName,
    manualEntryInitialValues, closeManualEntry,
    saveManualEntry,
    addEditedFoodToLog,
    updateLoggedFoodEntry,
  };
};
