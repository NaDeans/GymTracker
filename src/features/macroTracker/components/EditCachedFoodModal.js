import { View, Text, Alert } from "react-native";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { SPACING, FONT_WEIGHT, FONT_SIZE } from "shared/constants/styles";
import { COLORS } from "shared/constants/colors";

const FIELD_LABELS = {
  name: "Name",
  amount_g: "Amount (g)",
  calories: "Calories",
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fats: "Fats (g)",
};

export const EditCachedFoodModal = ({ visible, setVisible, editingFood, setEditingFood, gptCache, setGptCache, setSuggestions, onAddToLog }) => {
  if (!editingFood) return null;

  const handleDelete = () => {
    setGptCache((prev) => {
      const updated = { ...prev };
      delete updated[editingFood.originalKey];
      return updated;
    });
    setSuggestions([]);
    setVisible(false);
  };

  const handleSave = () => {
    const oldKey = editingFood.originalKey;
    let newKey = editingFood.key.trim().toLowerCase();

    if (!newKey) { Alert.alert("Error", "Search term cannot be empty"); return false; }

    const existingEntry = gptCache[oldKey];
    if (!existingEntry) { setVisible(false); return true; }

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
      updated[newKey] = { ...existingEntry, searchKey: newKey, items: editingFood.items };
      return updated;
    });

    setSuggestions([]);
    setVisible(false);
    return true;
  };

  const handleAddToLog = () => {
    if (!handleSave()) return;
    onAddToLog();
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Edit Cached Food"
      footer={
        <View style={{ gap: SPACING.sm }}>
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            <Button variant="danger" onPress={handleDelete} style={{ flex: 1 }}>Delete</Button>
            <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>Save</Button>
          </View>
          <Button variant="success" onPress={handleAddToLog} fullWidth>Add to Log</Button>
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
          <Text style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: COLORS.textDark, marginBottom: SPACING.sm }}>
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
                items[index] = { ...items[index], [field]: field === "name" ? v : Number(v) || 0 };
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
