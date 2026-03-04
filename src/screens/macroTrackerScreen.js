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

import DatePicker from "components/macroTrackerComponents/DatePicker";
import { MacroTotals } from "components/macroTrackerComponents/MacroTotals";
import { FoodSearchInput } from "components/macroTrackerComponents/FoodSearchInput";
import { CustomFoodsModal } from "components/macroTrackerComponents/CustomFoodsModal";
import { GoalModal } from "components/macroTrackerComponents/GoalModal";
import { EditCachedFoodModal } from "components/macroTrackerComponents/EditCachedFoodModal";
import { DailyControls } from "components/macroTrackerComponents/DailyControls";


import { fetchNutritionFromGPT } from "../services/gptService";
import { loadMacroTrackerData } from "../utils/storageUtils";
import { saveMacroTrackerData } from "../utils/storageUtils";

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



  // Load data on startup
  useEffect(() => {
    const loadData = async () => {
      const data = await loadMacroTrackerData();
      setCustomFoods(data.customFoods);
      setDailyLog(data.dailyLog);
      setHistoryByDate(data.historyByDate);
      setGoals(data.goals);
      setGptCache(data.gptCache);
    };
    loadData();
  }, []);

  // refresh control
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

  // Macro Calculations
  const dayData = dailyLog[selectedDate] || {
    items: {},
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 }
  };
  const totalMacros = dayData.totals;

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
  useEffect(() => {
    saveMacroTrackerData({ customFoods, dailyLog, historyByDate, goals, gptCache });
  }, [customFoods, dailyLog, historyByDate, goals, gptCache]);




  //---------------------DAILY FOOD LOG-----------------------//
  // add food to daily log
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





  //-------------------OPENAI CALL----------------------//
  const submit = async () => {
    if (!input.trim()) return;
    setLoading(true);

    let rawText;

    try {
      const key = input.trim().toLowerCase();

      // Load GPT cache
      const savedCache = await AsyncStorage.getItem("GPT_CACHE");
      const cache = savedCache ? JSON.parse(savedCache) : {};

      if (cache[key]) {
        // Use cached data
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
              amount_g: i.amount_g,
            },
          }));

          const newEntry = {
            foodId: data.foodId,
            key,
            items: newItems,
          };

          return { ...prev, [selectedDate]: [newEntry, ...dayHistory] };
        });
      } else {

        // No cache, call GPT
        const items = await fetchNutritionFromGPT(input, OPENAI_API_KEY);
        rawText = JSON.stringify(items);

        const uniqueFoodId = Date.now().toString() + Math.random().toString(36).slice(2);

        // Save to cache
        cache[key] = { searchKey: key, foodId: uniqueFoodId, items };
        await AsyncStorage.setItem("GPT_CACHE", JSON.stringify(cache));

        // Add food to daily log
        setHistoryByDate(prev => {
          const dayHistory = prev[selectedDate] || [];
          if (entryExistsForDay(dayHistory, uniqueFoodId)) {
            Alert.alert("Already added", "This food is already in today's log.");
            return prev;
          }

          const newItems = items.map(i => ({
            ...i,
            raw: { calories: i.calories, protein: i.protein, carbs: i.carbs, fats: i.fats, amount_g: i.amount_g },
          }));

          const newEntry = {
            foodId: uniqueFoodId,
            key,
            items: newItems,
          };

          return { ...prev, [selectedDate]: [newEntry, ...dayHistory] };
        });
      }
    } catch (err) {
      console.error("❌ GPT error:", err);
      if (rawText) console.log("⚠️ GPT raw text:", rawText);
      Alert.alert("Error", "Failed to fetch nutrition data. Check your API key or input.");
    } finally {
      setLoading(false);
      setInput("");
    }
  };


  

  //-------------------RENDER USER INTERFACE----------------------//
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