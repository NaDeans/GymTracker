//----------IMPORT COMPONENTS----------//
import { useState, useEffect } from "react";
import {
  Text,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { OPENAI_API_KEY } from '@env';

import { styles } from "styles/macroTrackerStyles";

import { todayString } from "../utils/dateUtils";
import { safeNumber } from "../utils/numberUtils";
import { calcTotals, entryExistsForDay } from "../utils/macroUtils";
import { safeParseJSON, normalizeAndValidateItem } from "../utils/gptUtils";

import DatePicker from "components/macroTrackerComponents/DatePicker";
import { MacroTotals } from "components/macroTrackerComponents/MacroTotals";
import { FoodSearchInput } from "components/macroTrackerComponents/FoodSearchInput";
import { CustomFoodsModal } from "components/macroTrackerComponents/CustomFoodsModal";
import { GoalModal } from "components/macroTrackerComponents/GoalModal";
import { EditCachedFoodModal } from "components/macroTrackerComponents/EditCachedFoodModal";
import { DailyControls } from "components/macroTrackerComponents/DailyControls";

//----------------APP FUNCTION---------------------//
/////////////////////////////////////////////////////

export default function MacroTrackerScreen() {

  //---------------STATE INITIALISATION--------------//
  //UI / Models
  const [refreshing, setRefreshing] = useState(false);
  const [foodDbVisible, setFoodDbVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  //Food form / Editing
  const [customFoods, setCustomFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [newFood, setNewFood] = useState({name: "",amount_g: "",calories: "",protein: "",carbs: "",fats: ""});
  const [editingFoodId, setEditingFoodId] = useState(null);

  //Search / Suggestions
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gptCache, setGptCache] = useState({});    
  const [suggestions, setSuggestions] = useState([]); 
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  //Logs / dates
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [historyByDate, setHistoryByDate] = useState({});
  const [dailyLog, setDailyLog] = useState({});
  const [gramInputs, setGramInputs] = useState({});

  //Goals / Macros
  const [goals, setGoals] = useState({calories: 2400, protein: 150, carbs: 330, fats: 70});
  const [editingMacro, setEditingMacro] = useState("");
  const [goalInput, setGoalInput] = useState("");



  //----------HELPERS WITHIN APP FUNCTION----------//
  ///////////////////////////////////////////////////

  // Refresh Handler
   const onRefresh = async () => {
     setRefreshing(true);
     try {
       setInput("");
       setSuggestions([]);
 
       const savedCache = await AsyncStorage.getItem("GPT_CACHE");
       if (savedCache) setGptCache(JSON.parse(savedCache));
 
       const savedDailyLog = await AsyncStorage.getItem("DAILY_LOG");
       if (savedDailyLog) setDailyLog(JSON.parse(savedDailyLog));
 
       const savedCustomFoods = await AsyncStorage.getItem("CUSTOM_FOODS");
       if (savedCustomFoods) setCustomFoods(JSON.parse(savedCustomFoods));
     } catch (err) {
       console.error("Refresh error:", err);
     }
     setRefreshing(false);
   };

  // Macro Calculations
  const dayData = dailyLog[selectedDate] || {
    items: {},
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 }
  };
  const totalMacros = dayData.totals;
  const totalSum = totalMacros.protein + totalMacros.carbs + totalMacros.fats;
  const perc = totalSum
    ? {
        protein: Math.round((100 * totalMacros.protein) / totalSum),
        carbs:   Math.round((100 * totalMacros.carbs) / totalSum),
        fats:    Math.round((100 * totalMacros.fats) / totalSum)
      }
    : { protein: 0, carbs: 0, fats: 0 };


////////////////////////////////////////////////////////////////////////////////////////////////////
  //---------------STARTUP INITIALISATION------------------//
  useEffect(() => {
    const loadData = async () => {
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

        if (savedCustomFoods) setCustomFoods(JSON.parse(savedCustomFoods));
        if (savedDailyLog) setDailyLog(JSON.parse(savedDailyLog));
        if (savedHistoryByDate) setHistoryByDate(JSON.parse(savedHistoryByDate));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedCache) setGptCache(JSON.parse(savedCache));
      } catch (err) {
        console.error("Error loading saved data:", err);
      }
    };

    loadData();
  }, []);


  //-------------------SYNCING FUNCTIONALITY------------------//

  // Update cache suggestions as the user types
  useEffect(() => {
    if (suppressSuggestions) {
      setSuppressSuggestions(false);
      return;
    }
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const keys = Object.keys(gptCache);
    const matches = keys.filter(k => k.toLowerCase().includes(input.toLowerCase()));
    setSuggestions(matches.slice(0, 5));
  }, [input, gptCache]);

  // Sync gram inputs as they update
  useEffect(() => {
    const dayItems = dailyLog[selectedDate]?.items || {};
    const newGramInputs = {};
    Object.values(dayItems).forEach(({ item }) => {
      newGramInputs[item.id] = String(item.amount_g);
    });
    setGramInputs(newGramInputs);
  }, [dailyLog, selectedDate]);

  // Save data when it changes
  useEffect(() => { AsyncStorage.setItem("CUSTOM_FOODS", JSON.stringify(customFoods)); }, [customFoods]);
  useEffect(() => { AsyncStorage.setItem("DAILY_LOG", JSON.stringify(dailyLog)); }, [dailyLog]);
  useEffect(() => { AsyncStorage.setItem("HISTORY_BY_DATE", JSON.stringify(historyByDate)); }, [historyByDate]);
  useEffect(() => { AsyncStorage.setItem("GOALS", JSON.stringify(goals)); }, [goals]);

//////////////////////////////////////////////////////////////////////////////////////////////////////
  //---------------------DAILY FOOD LOG-----------------------//

  // add food to daily log and calculate scaled macros
  const addItem = (item) => {
    const raw = item.raw || item;
    const amount_g = safeNumber(raw.amount_g);
    const calories = safeNumber(raw.calories);
    const protein  = safeNumber(raw.protein);
    const carbs    = safeNumber(raw.carbs);
    const fats     = safeNumber(raw.fats);

    let gramsToAdd = safeNumber(item.amount_g);

    if (gramInputs[item.id] !== undefined) {
      const parsed = parseFloat(gramInputs[item.id]);
      if (!isNaN(parsed) && parsed > 0) {
        gramsToAdd = parsed;
      }
    }

    const itemToAdd = {
      ...item,
      amount_g: gramsToAdd,
      calories: calories * gramsToAdd / (amount_g || 1),
      protein:  protein * gramsToAdd / (amount_g || 1),
      carbs:    carbs * gramsToAdd / (amount_g || 1),
      fats:     fats * gramsToAdd / (amount_g || 1),
      raw: { amount_g, calories, protein, carbs, fats }
    };

    setDailyLog(prev => {
      const day = prev[selectedDate] || { items: {} };
      const newItems = { ...day.items };

      if (newItems[item.id]) {
        newItems[item.id] = {
          item: itemToAdd,          
          count: newItems[item.id].count + 1
        };
      } else {
        newItems[item.id] = { item: itemToAdd, count: 1 };
      }

      const totals = calcTotals(newItems);
      return { ...prev, [selectedDate]: { items: newItems, totals } };
    });
  };

  // remove one serving of a food from daily log
  const removeItem = (item) => {
    setDailyLog(prev => {
      const day = prev[selectedDate];
      if (!day || !day.items[item.id]) return prev;

      const newItems = { ...day.items };
      newItems[item.id].count -= 1;
      if (newItems[item.id].count <= 0) delete newItems[item.id];

      const totals = calcTotals(newItems);
      return { ...prev, [selectedDate]: { items: newItems, totals } };
    });
  };

  // clear food from daily log
  const clearItem = (item) => {
    setDailyLog(prev => {
      const day = prev[selectedDate];
      if (!day || !day.items[item.id]) return prev;

      const newItems = { ...day.items };
      delete newItems[item.id];
      const totals = calcTotals(newItems);
      return { ...prev, [selectedDate]: { items: newItems, totals } };
    });

    setHistoryByDate(prev => {
      const dayHistory = prev[selectedDate] || [];
      const cleaned = dayHistory
        .map(entry => ({ items: entry.items.filter(i => i.id !== item.id) }))
        .filter(entry => entry.items.length > 0);
      return { ...prev, [selectedDate]: cleaned };
    });
  };

  // update food portion size, recalculate macros and update history
  const updateGrams = (itemId, grams) => {
    setDailyLog(prev => {
      const day = prev[selectedDate];
      if (!day || !day.items[itemId]) return prev;

      const oldEntry = day.items[itemId];
      const baseItem = oldEntry.item.raw || oldEntry.item;
      const factor = grams / (baseItem.amount_g || 1);

      const updatedItem = {
        ...baseItem,
        amount_g: grams,
        calories: baseItem.calories * factor,
        protein:  baseItem.protein * factor,
        carbs:    baseItem.carbs * factor,
        fats:     baseItem.fats * factor,
        raw: baseItem
      };

      const newItems = { ...day.items, [itemId]: { ...oldEntry, item: updatedItem } };

      const totals = Object.values(newItems).reduce(
        (acc, { item, count }) => {
          acc.calories += item.calories * count;
          acc.protein  += item.protein * count;
          acc.carbs    += item.carbs * count;
          acc.fats     += item.fats * count;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      return { ...prev, [selectedDate]: { items: newItems, totals } };
    });

    setHistoryByDate(prev => {
      const dayHistory = prev[selectedDate] || [];

      const updated = dayHistory.map(entry => ({
        ...entry,
        items: entry.items.map(i =>
          i.id === itemId ? { ...i, amount_g: grams } : i
        )
      }));

      return { ...prev, [selectedDate]: updated };
    });
  };

  // Adding custom foods to daily log
  const addCustomFood = (food) => {
    const item = {
      ...food,
      id: Date.now().toString(),
      amount_g: safeNumber(food.amount_g),
      calories: safeNumber(food.calories),
      protein:  safeNumber(food.protein),
      carbs:    safeNumber(food.carbs),
      fats:     safeNumber(food.fats),
      assumption: null
    };

    setHistoryByDate(prev => {
      const dayHistory = prev[selectedDate] || [];
      const newItem = {
        ...item,
        raw: { calories: item.calories, protein: item.protein, carbs: item.carbs, fats: item.fats, amount_g: item.amount_g }
      };
      return { ...prev, [selectedDate]: [{ items: [newItem] }, ...dayHistory] };
    });

    setFoodDbVisible(false);
  };


  //--------------OPENAI CALL-----------------//

  const submit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    let rawText; // for error logging

    try {
      // Normalize input for GPT
      const key = input.trim().toLowerCase();

      // Load cache
      const savedCache = await AsyncStorage.getItem("GPT_CACHE");
      const cache = savedCache ? JSON.parse(savedCache) : {};

      if (cache[key]) {
        // Use cached response
        const data = cache[key];

        setHistoryByDate(prev => {
          const dayHistory = prev[selectedDate] || [];
          if (entryExistsForDay(dayHistory, data.foodId)) {
            Alert.alert("Already added", "This food is already in today's log.");
            return prev;
          }

          const newItems = data.items.map(i => ({
            ...i,
            raw: {
              calories: i.calories,
              protein: i.protein,
              carbs: i.carbs,
              fats: i.fats,
              amount_g: i.amount_g
            }
          }));

          const newEntry = {
            foodId: data.foodId,
            key,
            items: newItems
          };

          return { ...prev, [selectedDate]: [newEntry, ...dayHistory] };
        });
      } else {
        // GPT system prompt
        const systemPrompt = `
          You are a nutrition calculation engine.
          Return ONLY valid JSON.
          Do not include markdown, code fences, commentary.

          Rules:
          - Calculate calories, protein, carbs, fats.
          - Percentages (e.g., "10%") mean fat unless stated.
          - "Lean X%" means fat = 100 - X.
          - Always estimate a realistic weight in grams based on common household units and the macros you provide
          - Always provide a weight in grams for each item that matches the macros you are returning.
          - For vague descriptors (e.g., "small", "medium", "large"), use typical weight for that food.
          - Multiple foods? Split into separate items.
          - Make reasonable assumptions if needed; else assumption: null.
          - Never return empty or negative values.
          - Always return at least one item.
          - Calories MUST match macros: calories ≈ protein*4 + carbs*4 + fat*9. Correct if mismatch >10%.
          - Beef mince references per 100g raw: 
              5% fat: 21p/5f/130kcal
              10% fat: 20p/10f/176kcal
              15% fat: 18p/15f/215kcal
          - Scale all values linearly by weight.

          JSON schema:
          {
            "items": [
              {
                "name": string,
                "amount_g": number,
                "calories_kcal": number,
                "protein_g": number,
                "carbs_g": number,
                "fat_g": number,
                "assumption": string | null
              }
            ]
          }`;

        // Call GPT
        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input }
            ]
          })
        });

        const gptData = await res.json();
        rawText = gptData.output_text || gptData.output?.[0]?.content?.[0]?.text;
        if (!rawText) throw new Error("No response from GPT");

        // Clean & parse JSON safely
        const parsed = safeParseJSON(rawText);

        // Normalize and validate each item
        const items = parsed.items.map(normalizeAndValidateItem);

        // Save to cache
        const uniqueFoodId = Date.now().toString() + Math.random().toString(36).slice(2);
        cache[key] = {
          searchKey: key,
          foodId: uniqueFoodId,
          items: items
        };
        await AsyncStorage.setItem("GPT_CACHE", JSON.stringify(cache));

        // Add to history
        setHistoryByDate(prev => {
          const dayHistory = prev[selectedDate] || [];
          if (entryExistsForDay(dayHistory, uniqueFoodId)) {
            Alert.alert("Already added", "This food is already in today's log.");
            return prev;
          }

          const newItems = items.map(i => ({
            ...i,
            raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g }
          }));

          const newEntry = {
            foodId: uniqueFoodId,
            key,
            items: newItems
          }

          return { ...prev, [selectedDate]: [newEntry, ...dayHistory] };
        });
      }
    } 
    // Catch errors
    catch (err) {
      console.error("❌ GPT error:", err);
      if (rawText) console.log("⚠️ GPT raw text (even if parsing failed):", rawText);
      Alert.alert("Error", "Failed to fetch nutrition data. Check your API key or input.");
    } 
    finally {
      setLoading(false);
      setInput("");
    }
  };


  //-----------------------APP USER INTERFACE-----------------------//
  ////////////////////////////////////////////////////////////////////
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      >

      {/* title */}
      <Text style={styles.mainTitle}>Macro Tracker</Text>

      {/* date row */}
      <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* macro totals and wheel */}
      <MacroTotals
        totalMacros={totalMacros}
        goals={goals}
        setEditingMacro={setEditingMacro}
        setGoalInput={setGoalInput}
        setGoalModalVisible={setGoalModalVisible}
      />

      {/* food input with suggestions from async storage */}
      <FoodSearchInput
        input={input}
        setInput={setInput}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        setSuppressSuggestions={setSuppressSuggestions}
        setEditingFood={setEditingFood}
        setEditModalVisible={setEditModalVisible}
        submit={submit}
        styles={styles}
      />

      {/* daily log with macros and edit options */}
      <DailyControls
        selectedDate={selectedDate}
        dailyLog={dailyLog}
        historyByDate={historyByDate}
        gramInputs={gramInputs}
        setGramInputs={setGramInputs}
        addItem={addItem}
        removeItem={removeItem}
        clearItem={clearItem}
        setFoodDbVisible={setFoodDbVisible}
        submit={submit}
        loading={loading}
        setDailyLog={setDailyLog}
        setHistoryByDate={setHistoryByDate}
        styles={styles}
      />

      {/* ------------------------------ MODELS WITHIN APP FUNCTIONALITY --------------------------------- */}

      {/* MACRO GOAL MODAL */}
      <GoalModal
        visible={goalModalVisible}
        setVisible={setGoalModalVisible}
        editingMacro={editingMacro}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        setGoals={setGoals}
        styles={styles}
      />


      {/* FOOD DATABASE MODAL */}
      <CustomFoodsModal
        visible={foodDbVisible}
        setVisible={setFoodDbVisible}
        customFoods={customFoods}
        setCustomFoods={setCustomFoods}
        addCustomFood={addCustomFood}
        newFood={newFood}
        setNewFood={setNewFood}
        editingFoodId={editingFoodId}
        setEditingFoodId={setEditingFoodId}
        styles={styles}
      />



      {/* EDITING GPT CACHED FOOD MODAL */}
      <EditCachedFoodModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        editingFood={editingFood}
        setEditingFood={setEditingFood}
        setGptCache={setGptCache}
        setSuggestions={setSuggestions}
        styles={styles}
      />
    </ScrollView>
  );
}