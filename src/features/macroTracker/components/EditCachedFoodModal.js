import { View, Text, Alert } from "react-native";
import { safeNumber } from "shared/utils/numberUtils";
import { formatFoodName, foodKey } from "shared/utils/textUtils";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { SPACING, FONT_WEIGHT, FONT_SIZE } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const FIELD_LABELS = {
  name: "Name",
  amount_g: "Amount (g)",
  calories: "Calories",
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fats: "Fats (g)",
};

// Fields are edited as raw strings (so partial input like "2." survives typing);
// numbers are coerced and the name is tidied only when saving.
const normalizeItems = (items) =>
  items.map((item) => ({
    ...item,
    name: formatFoodName(item.name),
    amount_g: safeNumber(item.amount_g),
    calories: safeNumber(item.calories),
    protein: safeNumber(item.protein),
    carbs: safeNumber(item.carbs),
    fats: safeNumber(item.fats),
  }));

export const EditCachedFoodModal = ({ visible, setVisible, editingFood, setEditingFood, gptCache, setGptCache, setSuggestions, onAddToLog, onSaveLogEntry }) => {
  const { colors } = useTheme();
  if (!editingFood) return null;

  const isLogEdit = editingFood.logEntryIndex !== undefined;
  // Meal entries logged from the Meals tab have no saved-foods row behind them,
  // so there is nothing for Delete to remove.
  const isCached = !!gptCache[editingFood.originalKey];
  const isMealEntry = editingFood.mealName !== undefined;

  // A log entry edited long after it was saved may hold a stale key (the food
  // was renamed since), so fall back to matching the saved food by its id.
  const cacheKey =
    editingFood.originalKey && gptCache[editingFood.originalKey]
      ? editingFood.originalKey
      : editingFood.foodId
        ? Object.keys(gptCache).find((k) => gptCache[k].foodId === editingFood.foodId)
        : undefined;

  const handleDelete = () => {
    if (cacheKey) {
      setGptCache((prev) => {
        const updated = { ...prev };
        delete updated[cacheKey];
        return updated;
      });
    }
    setSuggestions([]);
    setVisible(false);
  };

  // A saved food's name IS its search key, so there is nothing else to edit:
  // renaming here renames the food everywhere and re-keys the cache entry.
  // Returns the normalized items on success, or false if validation failed.
  const handleSave = () => {
    const normalized = normalizeItems(editingFood.items);

    // A meal is keyed by its own name; a saved food has no separate search term,
    // so its key is simply the food's name.
    if (isMealEntry && !editingFood.mealName.trim()) {
      Alert.alert("Error", "Meal name cannot be empty");
      return false;
    }

    const newKey = isMealEntry ? foodKey(editingFood.mealName) : foodKey(normalized[0]?.name);

    if (!newKey) { Alert.alert("Error", "Name cannot be empty"); return false; }

    const existingEntry = cacheKey ? gptCache[cacheKey] : undefined;

    if (existingEntry) {
      if (cacheKey !== newKey && gptCache[newKey]) { Alert.alert("Error", `"${normalized[0].name}" is already one of your saved foods.`); return false; }

      setGptCache((prev) => {
        const updated = { ...prev };
        if (cacheKey !== newKey) delete updated[cacheKey];
        updated[newKey] = { ...existingEntry, searchKey: newKey, items: normalized };
        return updated;
      });
    }

    if (isLogEdit) {
      onSaveLogEntry(editingFood.logEntryIndex, {
        ...editingFood,
        key: newKey,
        items: normalized,
        ...(isMealEntry && { mealName: editingFood.mealName.trim() }),
      });
    }

    setSuggestions([]);
    setVisible(false);
    return normalized;
  };

  const handleAddToLog = () => {
    const normalized = handleSave();
    if (!normalized) return;
    onAddToLog({ ...editingFood, key: foodKey(normalized[0]?.name), items: normalized });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title={isLogEdit ? "Edit Food" : "Edit Saved Food"}
      footer={
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            {isCached && <Button variant="danger" onPress={handleDelete} style={{ flex: 1 }}>Delete</Button>}
            <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>Save</Button>
          </View>
          {!isLogEdit && <Button variant="success" onPress={handleAddToLog} fullWidth>Add to Log</Button>}
        </View>
      }
    >
      {isMealEntry ? (
        <TextField
          label="Meal Name"
          value={editingFood.mealName}
          onChangeText={(v) => setEditingFood((prev) => ({ ...prev, mealName: v }))}
          style={{ marginBottom: SPACING.md }}
        />
      ) : (
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginBottom: SPACING.md }}>
          The name is how you search for this food — include the portion if it matters, like "200g Chicken Breast".
        </Text>
      )}

      {editingFood.items.map((item, index) => (
        <Card key={index} style={{ marginBottom: SPACING.md }}>
          {editingFood.items.length > 1 && (
            <Text style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: colors.textDark, marginBottom: SPACING.sm }}>
              Item {index + 1}
            </Text>
          )}
          {["name", "amount_g", "calories", "protein", "carbs", "fats"].map((field) => (
            <TextField
              key={field}
              label={FIELD_LABELS[field]}
              value={field === "name" ? item.name : item[field]?.toString() || ""}
              keyboardType={field === "name" ? "default" : "numeric"}
              onChangeText={(v) => {
                const items = [...editingFood.items];
                items[index] = { ...items[index], [field]: v };
                setEditingFood((prev) => ({ ...prev, items }));
              }}
              style={{ marginBottom: SPACING.sm }}
            />
          ))}
        </Card>
      ))}
    </ModalSheet>
  );
};
