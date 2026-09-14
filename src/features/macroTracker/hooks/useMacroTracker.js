import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Keyboard, Share } from "react-native";
import { ANTHROPIC_API_KEY } from "@env";

import { todayString } from "shared/utils/dateUtils";
import { safeNumber } from "shared/utils/numberUtils";
import { calcCurrentStreak, dayHasLog } from "shared/utils/streakUtils";
import { calcTotals, entryExistsForDay, isGoalMet } from "../utils/macroUtils";
import { loadMacroTrackerData, saveMacroTrackerData } from "../utils/storageUtils";
import { fetchNutritionFromGPT, fetchNutritionFromImage } from "../services/gptService";
import { buildRecipeLogItem } from "../utils/recipeUtils";
import { formatDayForExport, formatRangeForExport } from "../utils/exportUtils";

// Snapshots an item's values as its unscaled base serving, so later gram edits
// always rescale from the original rather than compounding.
const withRaw = (i) => ({
  ...i,
  raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g },
});

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
  // Separate flags: a text search in flight shouldn't spin the Scan button.
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
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

  // Meal prep recipes
  const [recipes, setRecipes] = useState([]);

  // Goals
  const [goals, setGoals] = useState({ calories: 2400, protein: 150, carbs: 330, fats: 70 });
  const [editingMacro, setEditingMacro] = useState("");
  const [goalInput, setGoalInput] = useState("");

  // Guards the save effect: without it, the first render saves the empty
  // initial state over the stored data before the load below resolves.
  const hasLoaded = useRef(false);

  // `submit` awaits the API before checking for a duplicate, by which point its
  // captured `historyByDate` can be a render or two behind. Reading the check
  // through a ref keeps it current without putting it inside a state updater,
  // which has to stay pure.
  const historyRef = useRef(historyByDate);
  historyRef.current = historyByDate;

  useEffect(() => {
    loadMacroTrackerData().then((data) => {
      setCustomFoods(data.customFoods);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGoals(data.goals);
      setGptCache(data.gptCache);
      setRecipes(data.recipes);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveMacroTrackerData({ customFoods, dailyLog, historyByDate, goals, gptCache, recipes });
  }, [customFoods, dailyLog, historyByDate, goals, gptCache, recipes]);

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
      setCustomFoods(data.customFoods);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGptCache(data.gptCache);
      setRecipes(data.recipes);
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
      // Replace rather than decrement in place — the { item, count } object is
      // shared with the previous state object until it's copied.
      const nextCount = newItems[item.id].count - 1;
      if (nextCount <= 0) delete newItems[item.id];
      else newItems[item.id] = { ...newItems[item.id], count: nextCount };
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
    // The day entry is keyed by the custom food's own id, so adding the same
    // one twice bumps the count instead of stacking a second card. `foodId`
    // stays absent — that's what marks the entry as custom in DailyControls.
    const dayHistory = historyByDate[selectedDate] || [];
    if (dayHistory.some((entry) => entry.customFoodId === food.id)) {
      Alert.alert("Already added", "This food is already in today's log.");
      return;
    }

    const item = withRaw({
      ...food,
      id: `custom_${food.id}`,
      amount_g: safeNumber(food.amount_g),
      calories: safeNumber(food.calories),
      protein: safeNumber(food.protein),
      carbs: safeNumber(food.carbs),
      fats: safeNumber(food.fats),
      assumption: null,
    });

    setHistoryByDate((prev) => ({
      ...prev,
      [selectedDate]: [{ customFoodId: food.id, items: [item] }, ...(prev[selectedDate] || [])],
    }));
    addItem(item);
    setFoodDbVisible(false);
  };

  const saveRecipe = (recipe) => {
    const stamped = { ...recipe, updatedAt: Date.now() };
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === recipe.id);
      if (idx === -1) return [{ createdAt: Date.now(), ...stamped }, ...prev];
      const updated = [...prev];
      updated[idx] = { ...updated[idx], ...stamped };
      return updated;
    });
  };

  const deleteRecipe = (recipeId) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  // Logs `servings` of a prep as a SINGLE synthetic item whose `raw` is the
  // per-serving macros — so amount_g / raw.amount_g is the serving count and
  // the existing gram machinery (updateGrams, calcTotals) handles fractional
  // servings unchanged. Deliberately bypasses addItem, which would apply a
  // stale gramInputs draft left over from an earlier log of the same recipe.
  const logRecipeServing = (recipe, servings) => {
    const n = safeNumber(servings);
    if (!recipe || n <= 0) return;
    const id = `recipe_${recipe.id}`;
    const fresh = buildRecipeLogItem(recipe, n);

    setDailyLog((prev) => {
      const day = prev[selectedDate] || { items: {} };
      const existing = day.items[id];
      // A prep already logged today keeps the per-serving rate it was logged
      // at, so editing the recipe mid-day never rewrites what's on the plate.
      const base = existing?.item?.raw || fresh.raw;
      const baseG = safeNumber(base.amount_g) || 1;
      const grams = (existing ? safeNumber(existing.item.amount_g) : 0) + baseG * n;
      const item = {
        ...(existing?.item || fresh),
        amount_g: grams,
        calories: (safeNumber(base.calories) * grams) / baseG,
        protein: (safeNumber(base.protein) * grams) / baseG,
        carbs: (safeNumber(base.carbs) * grams) / baseG,
        fats: (safeNumber(base.fats) * grams) / baseG,
        raw: base,
      };
      const newItems = { ...day.items, [id]: { item, count: 1 } };
      return { ...prev, [selectedDate]: { items: newItems, totals: calcTotals(newItems) } };
    });

    setHistoryByDate((prev) => {
      const dayHistory = prev[selectedDate] || [];
      // The card is already on screen; dailyLog carries the updated servings.
      if (dayHistory.some((entry) => entry.recipeId === recipe.id)) return prev;
      const entry = { recipeId: recipe.id, key: (recipe.name || "").trim().toLowerCase(), items: [fresh] };
      return { ...prev, [selectedDate]: [entry, ...dayHistory] };
    });
  };

  // Resolves a search string to nutrition items, from the cache when possible
  // and from the API otherwise, and caches an API result. Deliberately does NOT
  // touch historyByDate and never shows an Alert — it throws instead — so the
  // recipe builder can look foods up without logging them. `submit` owns the
  // logging and all the user-facing error handling.
  const lookupFood = async (query) => {
    const key = (query || "").trim().toLowerCase();
    if (!key) return null;

    if (gptCache[key]) {
      const data = gptCache[key];
      return { key, foodId: data.foodId, items: data.items };
    }

    const items = await fetchNutritionFromGPT(query, ANTHROPIC_API_KEY);
    const foodId = Date.now().toString() + Math.random().toString(36).slice(2);
    // Update state — the save effect persists this to AsyncStorage automatically
    setGptCache((prev) => ({ ...prev, [key]: { searchKey: key, foodId, items } }));
    return { key, foodId, items };
  };

  const submit = async (inputOverride) => {
    const rawInput = inputOverride ?? input;
    if (!rawInput.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const { key, foodId, items } = await lookupFood(rawInput);

      // Checked out here, not inside the updater: state updaters must be pure,
      // and React dev mode invokes them twice — which fired this alert twice.
      if (entryExistsForDay(historyRef.current[selectedDate] || [], foodId)) {
        Alert.alert("Already added", "This food is already in today's log.");
        return;
      }

      const itemsWithRaw = items.map((i) => withRaw(i));
      setHistoryByDate((prev) => ({
        ...prev,
        [selectedDate]: [{ foodId, key, items: itemsWithRaw }, ...(prev[selectedDate] || [])],
      }));
      // Logging a food counts it straight away — a multi-food search is one
      // meal, so every item lands at ×1.
      itemsWithRaw.forEach((item) => addItem(item));
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
    setScanLoading(true);
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
      setScanLoading(false);
    }
  };

  const saveManualEntry = ({ name, amount_g, calories, protein, carbs, fats }) => {
    const key = name.toLowerCase();
    const uniqueFoodId = Date.now().toString() + Math.random().toString(36).slice(2);
    const item = { id: uniqueFoodId, name, amount_g, calories, protein, carbs, fats, assumption: null };
    const itemWithRaw = withRaw(item);
    const source = manualEntryInitialValues ? "scan" : "manual";

    // Checked before the updater runs — see the note in `submit`.
    if ((historyByDate[selectedDate] || []).some((entry) => entry.key === key)) {
      Alert.alert("Already added", "This food is already in today's log.");
      return;
    }

    setHistoryByDate((prev) => ({
      ...prev,
      [selectedDate]: [{ foodId: uniqueFoodId, key, items: [itemWithRaw] }, ...(prev[selectedDate] || [])],
    }));
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
    const itemsWithRaw = food.items.map((i) => withRaw(i));
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
    const itemsWithRaw = editedFood.items.map((i) => withRaw(i));

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
    loading, scanLoading,
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
    recipes, saveRecipe, deleteRecipe, logRecipeServing, lookupFood,
    manualEntryVisible, setManualEntryVisible,
    manualEntryName, setManualEntryName,
    manualEntryInitialValues, closeManualEntry,
    saveManualEntry,
    addEditedFoodToLog,
    updateLoggedFoodEntry,
  };
};
