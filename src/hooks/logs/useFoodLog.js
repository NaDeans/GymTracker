// src/hooks/logs/useFoodLog.js
import { useState } from "react";
import { parseNumberSafe, calculateTotalMacros } from "../../utils/macroUtils";

/**
 * Hook for managing daily food logs
 */
export const useFoodLog = (initialLogs = {}) => {
  const [logsByDate, setLogsByDate] = useState(initialLogs);

  const addItem = (date, food, gramsInput = null) => {
    const amount_g = parseNumberSafe(food.amount_g);
    const factor = (gramsInput ?? amount_g) / (amount_g || 1);

    const itemToAdd = {
      ...food,
      amount_g: gramsInput ?? amount_g,
      calories: +(food.calories * factor).toFixed(2),
      protein: +(food.protein * factor).toFixed(2),
      carbs: +(food.carbs * factor).toFixed(2),
      fats: +(food.fats * factor).toFixed(2),
      raw: { amount_g, calories: food.calories, protein: food.protein, carbs: food.carbs, fats: food.fats }
    };

    setLogsByDate(prev => {
      const day = prev[date] || { items: {} };
      const newItems = { ...day.items };

      if (newItems[food.id]) {
        newItems[food.id].count += 1;
        newItems[food.id].item = itemToAdd;
      } else {
        newItems[food.id] = { item: itemToAdd, count: 1 };
      }

      const totals = calculateTotalMacros(Object.values(newItems).map(e => ({ item: e.item, count: e.count })));
      return { ...prev, [date]: { items: newItems, totals } };
    });
  };

  const removeItem = (date, foodId) => {
    setLogsByDate(prev => {
      const day = prev[date];
      if (!day?.items[foodId]) return prev;

      const newItems = { ...day.items };
      newItems[foodId].count -= 1;
      if (newItems[foodId].count <= 0) delete newItems[foodId];

      const totals = calculateTotalMacros(Object.values(newItems).map(e => ({ item: e.item, count: e.count })));
      return { ...prev, [date]: { items: newItems, totals } };
    });
  };

  const updateGrams = (date, foodId, grams) => {
    setLogsByDate(prev => {
      const day = prev[date];
      if (!day?.items[foodId]) return prev;

      const oldEntry = day.items[foodId];
      const base = oldEntry.item.raw || oldEntry.item;
      const factor = grams / (base.amount_g || 1);

      const updatedItem = {
        ...base,
        amount_g: grams,
        calories: +(base.calories * factor).toFixed(2),
        protein: +(base.protein * factor).toFixed(2),
        carbs: +(base.carbs * factor).toFixed(2),
        fats: +(base.fats * factor).toFixed(2),
        raw: base
      };

      const newItems = { ...day.items, [foodId]: { ...oldEntry, item: updatedItem } };
      const totals = calculateTotalMacros(Object.values(newItems).map(e => ({ item: e.item, count: e.count })));

      return { ...prev, [date]: { items: newItems, totals } };
    });
  };

  return { logsByDate, setLogsByDate, addItem, removeItem, updateGrams };
};