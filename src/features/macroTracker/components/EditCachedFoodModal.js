import { View, Text, Alert } from "react-native";
import { safeNumber } from "shared/utils/numberUtils";
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
// numbers are coerced only when saving.
const normalizeItems = (items) =>
  items.map((item) => ({
    ...item,
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

  const handleDelete = () => {
    setGptCache((prev) => {
      const updated = { ...prev };
      delete updated[editingFood.originalKey];
      return updated;
    });
    setSuggestions([]);
    setVisible(false);
  };

  // Returns the normalized items on success, or false if validation failed.
  const handleSave = () => {
    const oldKey = editingFood.originalKey;
    let newKey = editingFood.key.trim().toLowerCase();

    if (!newKey) { Alert.alert("Error", "Search term cannot be empty"); return false; }

    const normalized = normalizeItems(editingFood.items);
    const existingEntry = oldKey ? gptCache[oldKey] : undefined;

    if (existingEntry) {
      // If the first food item's name changed and the search key hasn't been manually updated,
      // automatically update the search key to match the new food name
      const originalFirstItemName = existingEntry.items?.[0]?.name?.toLowerCase() || oldKey;
      const editedFirstItemName = editingFood.items?.[0]?.name?.toLowerCase() || editingFood.key.toLowerCase();
      const keyWasNotManuallyChanged = editingFood.key.toLowerCase() === oldKey;

      if (keyWasNotManuallyChanged && editedFirstItemName !== originalFirstItemName) {
        newKey = editedFirstItemName;
      }

      if (oldKey !== newKey && gptCache[newKey]) { Alert.alert("Error", "A food with that name already exists."); return false; }

      setGptCache((prev) => {
        const updated = { ...prev };
        if (oldKey !== newKey) delete updated[oldKey];
        updated[newKey] = { ...existingEntry, searchKey: newKey, items: normalized };
        return updated;
      });
    }

    if (isLogEdit) onSaveLogEntry(editingFood.logEntryIndex, { ...editingFood, key: newKey, items: normalized });

    setSuggestions([]);
    setVisible(false);
    return normalized;
  };

  const handleAddToLog = () => {
    const normalized = handleSave();
    if (!normalized) return;
    onAddToLog({ ...editingFood, items: normalized });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title={isLogEdit ? "Edit Food" : "Edit Cached Food"}
      footer={
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            <Button variant="danger" onPress={handleDelete} style={{ flex: 1 }}>Delete</Button>
            <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>Save</Button>
          </View>
          {!isLogEdit && <Button variant="success" onPress={handleAddToLog} fullWidth>Add to Log</Button>}
        </View>
      }
    >
      <TextField
        label="Search Term"
        value={editingFood.key}
        onChangeText={(v) => setEditingFood((prev) => ({ ...prev, key: v }))}
        style={{ marginBottom: SPACING.md }}
      />

      {editingFood.items.map((item, index) => (
        <Card key={index} style={{ marginBottom: SPACING.md }}>
          <Text style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: colors.textDark, marginBottom: SPACING.sm }}>
            Item {index + 1}
          </Text>
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
