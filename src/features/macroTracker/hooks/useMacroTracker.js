import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Keyboard, Share } from "react-native";
import { ANTHROPIC_API_KEY } from "@env";

import { todayString } from "shared/utils/dateUtils";
import { safeNumber } from "shared/utils/numberUtils";
import { formatFoodName, foodKey } from "shared/utils/textUtils";
import { calcCurrentStreak, dayHasLog } from "shared/utils/streakUtils";
import { calcTotals, entryExistsForDay, isGoalMet } from "../utils/macroUtils";
import { newFoodId, resolveFromCache, withAlias } from "../utils/foodCacheUtils";
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

  // Supplements
  const [supplements, setSupplements] = useState([]);
  const [supplementLog, setSupplementLog] = useState({});
  const [supplementsModalVisible, setSupplementsModalVisible] = useState(false);

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
      setSupplements(data.supplements);
      setSupplementLog(data.supplementLog);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveMacroTrackerData({ customFoods, dailyLog, historyByDate, goals, gptCache, supplements, supplementLog });
  }, [customFoods, dailyLog, historyByDate, goals, gptCache, supplements, supplementLog]);

  // How often each cached food has been logged, used to break ties between
  // suggestions that match the search term equally well.
  const foodUsageCounts = useMemo(() => countFoodUsage(historyByDate), [historyByDate]);

  useEffect(() => {
    if (suppressSuggestions) { setSuppressSuggestions(false); return; }
    if (!input.trim()) { setSuggestions([]); return; }
    // Rank on the corrected form of what's being typed, so a typo still finds
    // the saved food ("chiken" → "chicken breast") and the ranking tiers see
    // the same spelling the cache is keyed by.
    const query = foodKey(input);
    if (!query) { setSuggestions([]); return; }
    setSuggestions(rankFoodSuggestions(Object.keys(gptCache), query, foodUsageCounts, 5));
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
      setSupplements(data.supplements);
      setSupplementLog(data.supplementLog);
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
      "Are you sure you want to clear all foods, macros and supplements for this day? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setDailyLog((prev) => { const u = { ...prev }; delete u[selectedDate]; return u; });
            setHistoryByDate((prev) => { const u = { ...prev }; delete u[selectedDate]; return u; });
            setSupplementLog((prev) => { const u = { ...prev }; delete u[selectedDate]; return u; });
          },
        },
      ]
    );
  };

  // Ticks/unticks one supplement for the selected day. The log stores only the
  // ids taken that day; names are resolved from `supplements` when displaying
  // or exporting, so a rename shows up everywhere.
  const toggleSupplement = (id) => {
    setSupplementLog((prev) => {
      const takenToday = prev[selectedDate] || [];
      const next = takenToday.includes(id)
        ? takenToday.filter((x) => x !== id)
        : [...takenToday, id];
      if (next.length === 0) { const u = { ...prev }; delete u[selectedDate]; return u; }
      return { ...prev, [selectedDate]: next };
    });
  };

  const addSupplement = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (supplements.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Already added", `"${trimmed}" is already in your supplements.`);
      return false;
    }
    setSupplements((prev) => [...prev, { id: Date.now().toString(), name: trimmed }]);
    return true;
  };

  const renameSupplement = (id, name) => {
    setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const removeSupplement = (id) => {
    const supplement = supplements.find((s) => s.id === id);
    Alert.alert(
      "Delete Supplement?",
      `Remove "${supplement?.name || "this supplement"}"? It will also be removed from the days you ticked it off.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSupplements((prev) => prev.filter((s) => s.id !== id));
            setSupplementLog((prev) => {
              const cleaned = {};
              Object.entries(prev).forEach(([date, ids]) => {
                const kept = ids.filter((x) => x !== id);
                if (kept.length > 0) cleaned[date] = kept;
              });
              return cleaned;
            });
          },
        },
      ]
    );
  };

  const exportDay = async () => {
    try {
      const message = formatDayForExport(selectedDate, historyByDate, dailyLog, goals, supplements, supplementLog);
      await Share.share({ message });
    } catch (err) {
      console.error("Export day error:", err);
    }
  };

  const exportRange = async (days = 14) => {
    try {
      const message = formatRangeForExport(selectedDate, days, historyByDate, dailyLog, goals, supplements, supplementLog);
      await Share.share({ message });
    } catch (err) {
      console.error("Export range error:", err);
    }
  };

  const addCustomFood = (food) => {
    const item = {
      ...food,
      id: Date.now().toString(),
      name: formatFoodName(food.name),
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

  // Turns freshly fetched items into saved foods — one entry per food, keyed by
  // that food's own name. A name already in the cache reuses the saved entry
  // (with whatever the user edited into it) rather than duplicating it, and the
  // raw search string is recorded on every entry it produced so retyping it
  // later resolves from the cache.
  const cacheItemsAsFoods = (items, term) => {
    const updated = { ...gptCache };
    const entries = items.map((item, i) => {
      const key = foodKey(item.name) || term;
      const entry = withAlias(updated[key] || { searchKey: key, foodId: newFoodId(), items: [item] }, term, i, items.length);
      updated[key] = entry;
      return entry;
    });
    setGptCache(updated);
    return entries;
  };

  // Adds one day-log entry per saved food, skipping any already logged today.
  const logSavedFoods = (entries) => {
    const dayHistory = historyByDate[selectedDate] || [];
    const seen = new Set();
    const fresh = entries.filter(
      (entry) => !entryExistsForDay(dayHistory, entry.foodId) && !seen.has(entry.foodId) && seen.add(entry.foodId)
    );

    if (fresh.length === 0) {
      Alert.alert("Already added", entries.length > 1 ? "Those foods are already in this day's log." : "This food is already in this day's log.");
      return;
    }

    const newEntries = fresh.map((entry) => ({
      foodId: entry.foodId,
      key: entry.searchKey,
      items: entry.items.map((i) => ({ ...i, raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g } })),
    }));

    setHistoryByDate((prev) => ({ ...prev, [selectedDate]: [...newEntries, ...(prev[selectedDate] || [])] }));
  };

  const submit = async (inputOverride) => {
    const rawInput = inputOverride ?? input;
    if (!rawInput.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Everything is looked up under the tidied, spell-corrected form of what
      // was typed or dictated, so "chiken breast" and "Chicken Breast" hit the
      // same saved food instead of costing a second API call.
      const term = foodKey(rawInput);
      const cached = resolveFromCache(term, gptCache);

      // Update state — the save effect persists this to AsyncStorage automatically
      const entries = cached || cacheItemsAsFoods(await fetchNutritionFromGPT(rawInput, ANTHROPIC_API_KEY), term);
      logSavedFoods(entries);
    } catch (err) {
      console.error("GPT error:", err);
      if (err.message === "No nutrition items returned") {
        Alert.alert(
          "Food not found",
          "Couldn't find nutrition data for that. Enter macros manually?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Enter manually", onPress: () => { setManualEntryName(formatFoodName(rawInput)); setManualEntryVisible(true); } },
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
        name: formatFoodName(item.name),
        amount_g: String(item.amount_g ?? ""),
        calories: String(item.calories),
        protein: String(item.protein),
        carbs: String(item.carbs),
        fats: String(item.fats),
        assumption: item.assumption,
      });
      setManualEntryName(formatFoodName(item.name));
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

  const saveManualEntry = ({ name: rawName, amount_g, calories, protein, carbs, fats }) => {
    // Whatever was typed here — including a name edited over a scanned label —
    // is tidied before it reaches the log, the cache or storage.
    const name = formatFoodName(rawName);
    const key = foodKey(name);
    const uniqueFoodId = newFoodId();
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
    // A saved food's name is its key, so prefer the item's own name and fall
    // back to the stored key only for entries that have no items.
    const key = foodKey(food.items[0]?.name) || foodKey(food.key);

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
    supplements, supplementLog,
    supplementsTakenToday: supplementLog[selectedDate] || [],
    supplementsModalVisible, setSupplementsModalVisible,
    toggleSupplement, addSupplement, renameSupplement, removeSupplement,
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
