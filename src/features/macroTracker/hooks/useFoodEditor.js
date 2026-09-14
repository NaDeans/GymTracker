import { useState } from "react";
import { formatFoodName } from "shared/utils/textUtils";

// Which food the edit modal is showing, and whether it's open. This is screen
// state, not app state: Saved Foods and Macros each render their own copy of
// EditCachedFoodModal, so sharing these would open both at once. The food data
// itself still comes from the one shared store.
export const useFoodEditor = () => {
  const [editingFood, setEditingFood] = useState(null);
  const [visible, setVisible] = useState(false);

  const openSavedFood = (key, entry) => {
    if (!entry?.items?.length) return;
    setEditingFood({ key: formatFoodName(key), originalKey: key, foodId: entry.foodId, items: entry.items });
    setVisible(true);
  };

  // A log entry carries its index so the modal knows to write back to the day
  // rather than only to the saved food.
  const openLogEntry = (entry, idx) => {
    setEditingFood({
      key: formatFoodName(entry.key || entry.items[0]?.name || ""),
      originalKey: entry.key,
      foodId: entry.foodId,
      items: entry.items,
      logEntryIndex: idx,
      ...(entry.mealName !== undefined && { mealName: entry.mealName }),
    });
    setVisible(true);
  };

  return { editingFood, setEditingFood, visible, setVisible, openSavedFood, openLogEntry };
};
