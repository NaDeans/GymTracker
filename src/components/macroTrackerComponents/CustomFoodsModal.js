import React from "react";
import {
  View,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from "react-native";
import { safeNumber } from "../../utils/numberUtils";
import { customFoodFields } from "../../utils/macroUtils";

export const CustomFoodsModal = ({
  visible,
  setVisible,
  customFoods,
  setCustomFoods,
  addCustomFood,
  newFood,
  setNewFood,
  editingFoodId,
  setEditingFoodId,
  styles
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              Keyboard.dismiss();
              setVisible(false);
            }}
          />

          <View style={styles.modalContainer}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ padding: 10 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Custom Foods</Text>

              {/* Existing Foods */}
              {customFoods.map(food => (
                <View key={food.id} style={styles.foodCard}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMacros}>
                    {`C: ${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fats}g`}
                  </Text>

                  <View style={styles.foodActionsRow}>
                    <View style={styles.foodActionsLeft}>
                      <Pressable
                        onPress={() => addCustomFood(food)}
                        style={({ pressed }) => [
                          styles.customAdd,
                          pressed && styles.customAddPressed
                        ]}
                      >
                        <Text style={styles.buttonText}>Add</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
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
                        style={({ pressed }) => [
                          styles.customEdit,
                          pressed && styles.customEditPressed
                        ]}
                      >
                        <Text style={styles.buttonText}>Edit</Text>
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() =>
                        setCustomFoods(f =>
                          f.filter(x => x.id !== food.id)
                        )
                      }
                      style={({ pressed }) => [
                        styles.customDelete,
                        pressed && styles.customDeletePressed
                      ]}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Add / Edit Section */}
              <Text style={styles.sectionTitle}>
                {editingFoodId ? "Edit Food" : "Add New Food"}
              </Text>

              {customFoodFields.map(f => (
                <TextInput
                  key={f.key}
                  style={styles.input}
                  placeholder={f.label}
                  placeholderTextColor="#888"
                  keyboardType={f.keyboardType}
                  value={newFood[f.key]}
                  onChangeText={v =>
                    setNewFood(prev => ({
                      ...prev,
                      [f.key]: v
                    }))
                  }
                />
              ))}

              <Pressable
                onPress={() => {
                  const newItem = {
                    ...newFood,
                    id: editingFoodId || Date.now().toString(),
                    amount_g: safeNumber(newFood.amount_g),
                    calories: safeNumber(newFood.calories),
                    protein: safeNumber(newFood.protein),
                    carbs: safeNumber(newFood.carbs),
                    fats: safeNumber(newFood.fats)
                  };

                  if (editingFoodId) {
                    setCustomFoods(f =>
                      f.map(food =>
                        food.id === editingFoodId
                          ? { ...newItem, id: editingFoodId }
                          : food
                      )
                    );
                  } else {
                    setCustomFoods(f => [...f, newItem]);
                  }

                  setNewFood({
                    name: "",
                    amount_g: "",
                    calories: "",
                    protein: "",
                    carbs: "",
                    fats: ""
                  });

                  setEditingFoodId(null);
                }}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                  styles.saveFoodButton
                ]}
              >
                <Text style={styles.buttonText}>
                  {editingFoodId ? "Save Changes" : "Save"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};