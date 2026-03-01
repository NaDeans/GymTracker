import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const EditCachedFoodModal = ({
  visible,
  setVisible,
  editingFood,
  setEditingFood,
  setGptCache,
  setSuggestions,
  styles
}) => {
  if (!editingFood) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => setVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalOverlay}>

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />

          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Cached Food</Text>

            <Text style={styles.searchTermLabel}>Search Term</Text>
            <TextInput
              value={editingFood.key}
              onChangeText={v =>
                setEditingFood(prev => ({ ...prev, key: v }))
              }
              style={styles.input}
            />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: 10 }}
              showsVerticalScrollIndicator={false}
            >
              {editingFood.items.map((item, index) => (
                <View key={index} style={styles.editItemCard}>
                  <Text style={styles.editItemNumber}>
                    Item {index + 1}
                  </Text>

                  {["name", "calories", "protein", "carbs", "fats"].map(field => (
                    <View key={field}>
                      <Text>{field}</Text>
                      <TextInput
                        value={
                          field === "name"
                            ? item.name
                            : item[field]?.toString() || ""
                        }
                        keyboardType={field === "name" ? "default" : "numeric"}
                        onChangeText={v => {
                          const items = [...editingFood.items];
                          items[index] = {
                            ...items[index],
                            [field]:
                              field === "name"
                                ? v
                                : Number(v) || 0
                          };
                          setEditingFood(prev => ({ ...prev, items }));
                        }}
                        style={styles.input}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <View style={styles.editButtonsRow}>
              {/* DELETE */}
              <Pressable
                onPress={async () => {
                  const raw = await AsyncStorage.getItem("GPT_CACHE");
                  const cache = raw ? JSON.parse(raw) : {};

                  delete cache[editingFood.originalKey];

                  await AsyncStorage.setItem("GPT_CACHE", JSON.stringify(cache));

                  setGptCache(cache);
                  setVisible(false);
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
                  const raw = await AsyncStorage.getItem("GPT_CACHE");
                  const cache = raw ? JSON.parse(raw) : {};

                  const oldKey = editingFood.originalKey;
                  const newKey = editingFood.key.trim().toLowerCase();

                  if (!newKey) {
                    Alert.alert("Error", "Search term cannot be empty");
                    return;
                  }

                  if (oldKey !== newKey && cache[newKey]) {
                    Alert.alert("Error", "Food already exists.");
                    return;
                  }

                  const existingEntry = cache[oldKey];
                  if (!existingEntry) return;

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
                  setVisible(false);
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
    </Modal>
  );
};