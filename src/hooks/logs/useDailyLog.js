// src/hooks/logs/useDailyLog.js
import { useMemo } from "react";
import { calculateTotalMacros } from "../../utils/macroUtils";

/**
 * Hook to manage a single day log
 * @param {object} dayData - { items: {id: {item, count}}, totals }
 */
export const useDailyLog = (dayData) => {
  const totals = dayData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const macroPercentages = useMemo(() => {
    const sum = totals.protein + totals.carbs + totals.fats;
    if (!sum) return { protein: 0, carbs: 0, fats: 0 };
    return {
      protein: Math.round((totals.protein / sum) * 100),
      carbs: Math.round((totals.carbs / sum) * 100),
      fats: Math.round((totals.fats / sum) * 100),
    };
  }, [totals]);

  return { totals, macroPercentages };
};