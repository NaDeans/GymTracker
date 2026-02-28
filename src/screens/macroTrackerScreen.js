//----------IMPORT COMPONENTS----------//
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Keyboard,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";


import { Donut } from "../components/donut";
import { todayString, dmyToIso, isoToDmy } from "../utils/dateUtils";
import { fmt, safeNumber } from "../utils/numberUtils";
import { calcTotals, entryExistsForDay, customFoodFields } from "../utils/macroUtils";
import { safeParseJSON, normalizeAndValidateItem } from "../utils/gptUtils";

import { styles } from "styles/macroTrackerStyles";

import { OPENAI_API_KEY } from '@env';

//----------------APP FUNCTION---------------------//
/////////////////////////////////////////////////////

export default function App() {

  //---------------STATE INITIALISATION--------------//
  //UI / Models
  const [refreshing, setRefreshing] = useState(false);
  const [foodDbVisible, setFoodDbVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
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


  //----------------DATE HANDLERS-----------------//

  // Checks if date selected is today
  const today = todayString();
  const isToday = selectedDate === today;

  // Convert "DD/MM/YY" string → Date object
  const parseDMY = (dmy) => {
    const [d, m, y] = dmy.split("/");
    return new Date(`20${y}-${m}-${d}T00:00:00`);
  };

  // Convert Date object → "DD/MM/YY" string
  const formatDMY = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-2);
    return `${d}/${m}/${y}`;
  };

  // Move selected date forward/backward by N days
  const changeDate = (delta) => {
    const current = parseDMY(selectedDate);
    current.setDate(current.getDate() + delta);
    setSelectedDate(formatDMY(current));
  };

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
      <View style={styles.dateRow}>

        <Pressable onPress={() => changeDate(-1)} style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
          <Text style={styles.buttonText}>◀</Text>
        </Pressable>

        <Pressable onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateText, isToday && styles.dateTextToday]}>{selectedDate}</Text>
        </Pressable>

        <Pressable onPress={() => changeDate(1)} style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
          <Text style={styles.buttonText}>▶</Text>
        </Pressable>
        
        <Pressable onPress={() => setSelectedDate(today)} style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}>
          <Text style={styles.buttonText}>Today</Text>
        </Pressable>
      </View>


      {/* macro totals and wheel */}
      <View style={styles.totalsContainer}>

        {/* totals */}
        <View style={styles.totalsColumn}>
          {["calories","protein","carbs","fats"].map(macro => (
            <Pressable
              key={macro}
              onPress={() => {
                setEditingMacro(macro);
                setGoalInput(String(goals[macro]));
                setGoalModalVisible(true);
              }}
              style={styles.macroBox}
            >
              <Text style={styles.macroText}>
                {macro === "calories" ? "Calories" : macro.charAt(0).toUpperCase() + macro.slice(1)}
                : {fmt(totalMacros[macro])}/{goals[macro]}{macro === "calories" ? " kcal" : " g"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* wheel */}
        <View style={styles.wheelContainer}>
          {totalMacros.protein + totalMacros.carbs + totalMacros.fats > 0 && (
            <>
              <Donut
                macros={totalMacros}
                size={140}
                strokeWidth={18}
                colors={{ protein:"#e74c3c", carbs:"#f1c40f", fats:"#3498db", background:"#ddd" }}
              />

              {/* Percentages */}
              <View style={styles.percOverlay}>
                <Text style={[styles.percText, styles.proteinColor]}>P {perc.protein}%</Text>
                <Text style={[styles.percText, styles.carbsColor]}>C {perc.carbs}%</Text>
                <Text style={[styles.percText, styles.fatsColor]}>F {perc.fats}%</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* food input with suggestions from async storage */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search Foods"
          placeholderTextColor="#888"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
        />

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((s) => (
              <View key={s} style={styles.suggestionRow}>
                {/* Select suggestion */}
                <Pressable
                  onPress={() => {
                    setSuppressSuggestions(true);
                    setInput(s);
                    setSuggestions([]);
                    Keyboard.dismiss();
                  }}
                  style={{flex:1}}
                >
                  <Text>{s}</Text>
                </Pressable>

                {/* Edit button */}
                <Pressable
                  onPress={async () => {
                    const raw = await AsyncStorage.getItem("GPT_CACHE");
                    const cache = raw ? JSON.parse(raw) : {};
                    const entry = cache[s];
                    if (!entry?.items?.length) return;

                    setEditingFood({ key: s, originalKey: s, foodId: entry.foodId, items: entry.items });
                    setEditModalVisible(true);
                  }}
                  style={styles.suggestionEditButton}
                >
                  <Text>Edit</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* submit button */}
      <Pressable
        onPress={submit}
        style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "Submit"}
        </Text>
      </Pressable>

      {/* custom foods button */}
      <Pressable
        onPress={() => setFoodDbVisible(true)}
        style={({ pressed }) => [styles.customButton, pressed && styles.customButtonPressed]}
      >
        <Text style={styles.buttonText}>Custom Foods</Text>
      </Pressable>

      {/* History (food log for that day) */}
      <View style={{marginTop: 20}}>
        {(historyByDate[selectedDate] || []).map((entry, idx) => (
          <View key={idx} style={styles.historyBlock}>
            {entry.items.map(item => {
              const count = dayData.items[item.id]?.count || 0;
              const gramsValue = parseFloat(gramInputs[item.id] ?? item.amount_g);
              const raw = item.raw || item;
              const baseG = safeNumber(raw.amount_g) || 1;

              const displayMacros = {
                calories: safeNumber(raw.calories) * safeNumber(gramsValue) / baseG,
                protein:  safeNumber(raw.protein)  * safeNumber(gramsValue) / baseG,
                carbs:    safeNumber(raw.carbs)    * safeNumber(gramsValue) / baseG,
                fats:     safeNumber(raw.fats)     * safeNumber(gramsValue) / baseG
              };

              return (
                <View key={item.id} style={styles.itemBlock}>
                  <Text style={styles.itemName}>{item.name}</Text>

                  {/* Logic for editing grams */}
                  <View style={styles.gramsRow}>
                    <TextInput
                      style={styles.gramsInput}
                      keyboardType="numeric"
                      value={gramInputs[item.id] ?? String(item.amount_g)}
                      onChangeText={v => setGramInputs(prev => ({ ...prev, [item.id]: v }))}
                      onEndEditing={() => {
                        const g = parseFloat(gramInputs[item.id]);
                        if (!isNaN(g) && g > 0) updateGrams(item.id, g);
                        setGramInputs(prev => { const copy = { ...prev }; delete copy[item.id]; return copy; });
                      }}
                    />
                    <Text>g</Text>
                  </View>

                  {/* display scaled macro previews for food items */}
                  <Text style={styles.macros}>
                    {fmt(displayMacros.calories)} kcal · P {fmt(displayMacros.protein)}g · C {fmt(displayMacros.carbs)}g · F {fmt(displayMacros.fats)}g
                  </Text>

                  {/* button layout for food items */}
                  <View style={styles.buttonRow}>
                    <View style={styles.leftButtons}>
                      <Pressable onPress={() => addItem(item)} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
                        <Text style={styles.buttonText}>Add</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => removeItem(item)}
                        disabled={count === 0}
                        style={({ pressed }) => [styles.removeButton, count === 0 ? styles.removeButton : pressed && styles.removeButtonPressed]}
                      >
                        <Text style={styles.buttonText}>Remove</Text>
                      </Pressable>
                    </View>

                    <Pressable onPress={() => clearItem(item)} style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}>
                      <Text style={styles.buttonText}>Clear</Text>
                    </Pressable>
                  </View>


                  {/* show how many servings have been added */}
                  {count > 0 && <Text style={styles.addedText}>Added ×{count}</Text>}
                  {item.assumption && <Text style={styles.assumption}>Note: {item.assumption}</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Reset day button */}
      <Pressable
        onPress={() => {
          Alert.alert(
            "Reset Day?",
            "Are you sure you want to clear all foods and macros for today? This cannot be undone.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Reset",
                style: "destructive",
                onPress: () => {
                  setDailyLog(prev => ({
                    ...prev,
                    [selectedDate]: { items: {}, totals: { calories: 0, protein: 0, carbs: 0, fats: 0 } }
                  }));
                  setHistoryByDate(prev => ({ ...prev, [selectedDate]: [] }));
                  setGramInputs({});
                }
              }
            ]
          );
        }}
        style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
      >
        <Text style={styles.buttonText}>Reset Day</Text>
      </Pressable>


      {/* ------------------------------ MODELS WITHIN APP FUNCTIONALITY --------------------------------- */}
      
      {/* CALENDAR MODAL */}
      <Modal visible={calendarVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarVisible(false)}>
          <View style={styles.modalContainer}>
            <Calendar
              current={dmyToIso(selectedDate)}
              onDayPress={day => {
                setSelectedDate(isoToDmy(day.dateString));
                setCalendarVisible(false);
              }}
              markedDates={{
                [dmyToIso(selectedDate)]: { selected: true, selectedColor: "#3498db" },
                [dmyToIso(today)]: { marked: true, dotColor: "green" }
              }}
            />
          </View>
        </Pressable>
      </Modal>


      {/* MACRO GOAL MODAL */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setGoalModalVisible(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Set goal for {editingMacro}
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
            />

            <Pressable
              onPress={() => {
                setGoals(prev => ({
                  ...prev,
                  [editingMacro]: parseFloat(goalInput) || prev[editingMacro]
                }));
                setGoalModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.saveGoalButton,
                pressed && styles.saveGoalButtonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>


      {/* FOOD DATABASE MODAL */}
      <Modal visible={foodDbVisible} transparent animationType="fade">
        <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === "ios" ? "padding" : undefined}>

          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => {Keyboard.dismiss(),setFoodDbVisible(false)}} />

            {/* Modal container */}
            <View style={styles.modalContainer}>
              <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ padding: 10 }}
              showsVerticalScrollIndicator={false}
              bounces
              alwaysBounceVertical
              overScrollMode="always"
              >
                <Text style={styles.modalTitle}>Custom Foods</Text>

                {customFoods.map(food => (
                  <View key={food.id} style={styles.foodCard}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMacros}>
                      {`C: ${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fats}g`}
                    </Text>

                    <View style={styles.foodActionsRow}>
                      <View style={styles.foodActionsLeft}>
                        <Pressable onPress={() => addCustomFood(food)} style={({ pressed }) => [styles.customAdd, pressed && styles.customAddPressed]}>
                          <Text style={styles.buttonText}>Add</Text>
                        </Pressable>

                        <Pressable onPress={() => {
                          setNewFood({
                            ...food,
                            amount_g: food.amount_g?.toString() || "",
                            calories: food.calories?.toString() || "",
                            protein: food.protein?.toString() || "",
                            carbs: food.carbs?.toString() || "",
                            fats: food.fats?.toString() || "",
                          });
                          setEditingFoodId(food.id);
                          }} 
                          style={({ pressed }) => [styles.customEdit, pressed && styles.customEditPressed]}>
                          <Text style={styles.buttonText}>Edit</Text>
                        </Pressable>
                      </View>

                      <Pressable onPress={() => setCustomFoods(f => f.filter(x => x.id !== food.id))} style={({ pressed }) => [styles.customDelete, pressed && styles.customDeletePressed]}>
                        <Text style={styles.buttonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <View/>
                <Text style={styles.sectionTitle}>{editingFoodId ? "Edit Food" : "Add New Food"}</Text>

                {customFoodFields.map(f => (
                  <TextInput key={f.key} style={styles.input} placeholder={f.label} placeholderTextColor="#888" keyboardType={f.keyboardType} value={newFood[f.key]} onChangeText={v => setNewFood(prev => ({ ...prev, [f.key]: v }))} />
                ))}

                <Pressable
                  onPress={() => {
                    const newItem = { ...newFood, id: editingFoodId || Date.now().toString(), amount_g: safeNumber(newFood.amount_g), calories: safeNumber(newFood.calories), protein: safeNumber(newFood.protein), carbs: safeNumber(newFood.carbs), fats: safeNumber(newFood.fats) };
                    if (editingFoodId) setCustomFoods(f => f.map(food => food.id === editingFoodId ? { ...newItem, id: editingFoodId } : food));
                    else setCustomFoods(f => [...f, { ...newItem, id: newItem.id }]);
                    setNewFood({ name: "", amount_g: "", calories: "", protein: "", carbs: "", fats: "" });
                    setEditingFoodId(null);
                  }}
                  style={({ pressed }) => [styles.saveGoalButton, pressed && styles.saveGoalButtonPressed, styles.saveFoodButton]}
                >
                  <Text style={styles.buttonText}>{editingFoodId ? "Save Changes" : "Save"}</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>



      {/* EDITING GPT CACHED FOOD MODAL */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
        >
        {editingFood && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>

              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setEditModalVisible(false)}
              />

              <View style={styles.modalContainer}>

              {/* Modal title */}
              <Text style={styles.modalTitle}>Edit Cached Food</Text>

              {/* --- Search Term (once) --- */}
              <Text style={styles.searchTermLabel}>Search Term</Text>
              <TextInput
                value={editingFood.key}
                onChangeText={v =>
                  setEditingFood(prev => ({ ...prev, key: v }))
                }
                style={[styles.input]}
              />

              {/* --- Scrollable items --- */}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ padding: 10 }}
                showsVerticalScrollIndicator={false}
                bounces
                alwaysBounceVertical
                overScrollMode="always"
                >

                {editingFood.items.map((item, index) => (
                  <View key={index} style={styles.editItemCard}>
                    <Text style={styles.editItemNumber}>
                      Item {index + 1}
                    </Text>

                    <Text>Name</Text>
                    <TextInput
                      value={item.name}
                      onChangeText={v => {
                        const items = [...editingFood.items];
                        items[index] = { ...items[index], name: v };
                        setEditingFood(prev => ({ ...prev, items }));
                      }}
                      style={[styles.input]}
                    />

                    <Text>Calories</Text>
                    <TextInput
                      value={item.calories?.toString() || ""}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const items = [...editingFood.items];
                        items[index] = { ...items[index], calories: Number(v) || 0 };
                        setEditingFood(prev => ({ ...prev, items }));
                      }}
                      style={[styles.input]}
                    />

                    <Text>Protein (g)</Text>
                    <TextInput
                      value={item.protein?.toString() || ""}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const items = [...editingFood.items];
                        items[index] = { ...items[index], protein: Number(v) || 0 };
                        setEditingFood(prev => ({ ...prev, items }));
                      }}
                      style={[styles.input]}
                    />

                    <Text>Carbs (g)</Text>
                    <TextInput
                      value={item.carbs?.toString() || ""}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const items = [...editingFood.items];
                        items[index] = { ...items[index], carbs: Number(v) || 0 };
                        setEditingFood(prev => ({ ...prev, items }));
                      }}
                      style={[styles.input]}
                    />

                    <Text>Fats (g)</Text>
                    <TextInput
                      value={item.fats?.toString() || ""}
                      keyboardType="numeric"
                      onChangeText={v => {
                        const items = [...editingFood.items];
                        items[index] = { ...items[index], fats: Number(v) || 0 };
                        setEditingFood(prev => ({ ...prev, items }));
                      }}
                      style={styles.input}
                    />
                  </View>
                ))}
              </ScrollView>
              

              {/* --- Buttons --- */}
              <View style={styles.editButtonsRow}>
                {/* DELETE */}
                <Pressable
                  onPress={async () => {
                    const raw = await AsyncStorage.getItem("GPT_CACHE");
                    const cache = raw ? JSON.parse(raw) : {};

                    delete cache[editingFood.originalKey];

                    await AsyncStorage.setItem("GPT_CACHE", JSON.stringify(cache));

                    setGptCache(cache);
                    setEditModalVisible(false);
                    setSuggestions([]);
                  }}
                  style={({ pressed }) => [
                    styles.editModalDelete,
                    pressed && styles.editModalDeletePressed
                  ]}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </Pressable>

                {/* SAVE */}
                <Pressable
                  onPress={async () => {                 

                    // Load the cache
                    const raw = await AsyncStorage.getItem("GPT_CACHE");
                    const cache = raw ? JSON.parse(raw) : {};

                    const oldKey = editingFood.originalKey;
                    const newKey = editingFood.key.trim().toLowerCase();
                    if (oldKey !== newKey && cache[newKey]) {
                      Alert.alert("Error", "A food with this search term already exists.");
                      return;
                    }

                    const existingEntry = cache[oldKey];

                    if (!newKey) {
                      Alert.alert("Error", "Search term cannot be empty");
                      return;
                    }

                    if (!existingEntry) return;

                    // Keep the SAME foodId
                    const permanentFoodId = existingEntry.foodId;

                    if (oldKey !== newKey) {
                      delete cache[oldKey];
                    }

                    cache[newKey] = {
                      foodId: permanentFoodId,
                      searchKey: newKey,
                      items: editingFood.items
                    };

                    await AsyncStorage.setItem("GPT_CACHE", JSON.stringify(cache));

                    setGptCache(cache);
                    setEditModalVisible(false);
                    setSuggestions([]);
                  }}
                  style={({ pressed }) => [
                    styles.editModalSave,
                    pressed && styles.editModalSavePressed
                  ]}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
        )}
      </Modal>
    </ScrollView>
  );
}