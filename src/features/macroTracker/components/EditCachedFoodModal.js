import {
  Modal, View, Text, TextInput, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet, Alert, Keyboard,
} from "react-native";
import { styles } from "../macroTrackerStyles";

const FIELD_LABELS = {
  name: "Name",
  amount_g: "Amount (g)",
  calories: "Calories",
  protein: "Protein (g)",
  carbs: "Carbs (g)",
  fats: "Fats (g)",
};

export const EditCachedFoodModal = ({ visible, setVisible, editingFood, setEditingFood, gptCache, setGptCache, setSuggestions }) => {
  if (!editingFood) return null;

  const handleDelete = () => {
    setGptCache((prev) => {
      const updated = { ...prev };
      delete updated[editingFood.originalKey];
      return updated;
    });
    setSuggestions([]);
    setVisible(false);
    Keyboard.dismiss();
  };

  const handleSave = () => {
    const oldKey = editingFood.originalKey;
    const newKey = editingFood.key.trim().toLowerCase();

    if (!newKey) { Alert.alert("Error", "Search term cannot be empty"); return; }
    if (oldKey !== newKey && gptCache[newKey]) { Alert.alert("Error", "A food with that name already exists."); return; }

    const existingEntry = gptCache[oldKey];
    if (!existingEntry) { setVisible(false); return; }

    setGptCache((prev) => {
      const updated = { ...prev };
      if (oldKey !== newKey) delete updated[oldKey];
      updated[newKey] = { foodId: existingEntry.foodId, searchKey: newKey, items: editingFood.items };
      return updated;
    });

    setSuggestions([]);
    setVisible(false);
    Keyboard.dismiss();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Cached Food</Text>

            <Text style={styles.searchTermLabel}>Search Term</Text>
            <TextInput
              value={editingFood.key}
              onChangeText={(v) => setEditingFood((prev) => ({ ...prev, key: v }))}
              style={styles.input}
            />

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 10 }} showsVerticalScrollIndicator={false}>
              {editingFood.items.map((item, index) => (
                <View key={index} style={styles.editItemCard}>
                  <Text style={styles.editItemNumber}>Item {index + 1}</Text>
                  {["name", "amount_g", "calories", "protein", "carbs", "fats"].map((field) => (
                    <View key={field}>
                      <Text>{FIELD_LABELS[field]}</Text>
                      <TextInput
                        value={field === "name" ? item.name : item[field]?.toString() || ""}
                        keyboardType={field === "name" ? "default" : "numeric"}
                        onChangeText={(v) => {
                          const items = [...editingFood.items];
                          items[index] = { ...items[index], [field]: field === "name" ? v : Number(v) || 0 };
                          setEditingFood((prev) => ({ ...prev, items }));
                        }}
                        style={styles.input}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.editButtonsRow}>
              <Pressable onPress={handleDelete} style={({ pressed }) => [styles.editModalDelete, pressed && styles.editModalDeletePressed]}>
                <Text style={styles.buttonText}>Delete</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={({ pressed }) => [styles.editModalSave, pressed && styles.editModalSavePressed]}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
