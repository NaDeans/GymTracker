import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useMacroTracker } from "../hooks/useMacroTracker";

// Two contexts over ONE hook instance.
//
// The hook has to be shared: a second screen calling useMacroTracker() would
// get an independent copy of every state slice, and saveMacroTrackerData
// overwrites all keys as one blob — so the two copies would clobber each other
// last-writer-wins (delete a saved food on one tab, touch anything on the
// other, and it comes back).
//
// But it returns a fresh ~50-key object every render and holds high-churn
// state (input, gramInputs, loading), so a single context would re-render
// every tab on every keystroke. Splitting keeps that cost where it already is:
//   MacroDataContext   — memoised, low-churn, what other tabs read
//   MacroScreenContext — the raw hook, consumed only by MacroTrackerScreen,
//                        which re-renders on every keystroke today anyway
const MacroDataContext = createContext(null);
const MacroScreenContext = createContext(null);

// Stable identity with an always-fresh closure. The handlers close over
// selectedDate and gramInputs, so leaving them out of the memo deps without
// this would log foods to whatever date was current when the app started.
const useEventFn = (fn) => {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args) => ref.current(...args), []);
};

export function MacroTrackerProvider({ children }) {
  const tracker = useMacroTracker();

  const addItem = useEventFn(tracker.addItem);
  const removeItem = useEventFn(tracker.removeItem);
  const clearItem = useEventFn(tracker.clearItem);
  const updateGrams = useEventFn(tracker.updateGrams);
  const addEditedFoodToLog = useEventFn(tracker.addEditedFoodToLog);
  const setGptCache = useEventFn(tracker.setGptCache);
  const setSelectedDate = useEventFn(tracker.setSelectedDate);

  const data = useMemo(
    () => ({
      selectedDate: tracker.selectedDate,
      dailyLog: tracker.dailyLog,
      historyByDate: tracker.historyByDate,
      gptCache: tracker.gptCache,
      meals: tracker.meals,
      mealPreps: tracker.mealPreps,
      goals: tracker.goals,
      // Stable via useEventFn, so deliberately not in the dependency list.
      setSelectedDate,
      setGptCache,
      addItem,
      removeItem,
      clearItem,
      updateGrams,
      addEditedFoodToLog,
    }),
    [
      tracker.selectedDate,
      tracker.dailyLog,
      tracker.historyByDate,
      tracker.gptCache,
      tracker.meals,
      tracker.mealPreps,
      tracker.goals,
    ]
  );

  return (
    <MacroDataContext.Provider value={data}>
      <MacroScreenContext.Provider value={tracker}>{children}</MacroScreenContext.Provider>
    </MacroDataContext.Provider>
  );
}

// Everything the macro tracker owns — for MacroTrackerScreen only.
export const useMacroScreen = () => useContext(MacroScreenContext);

// The shared, low-churn slice — for any other screen that reads macro data.
export const useMacroData = () => useContext(MacroDataContext);
