import { View, Text, Alert } from "react-native";
import { safeNumber } from "shared/utils/numberUtils";
import { customFoodFields } from "../utils/macroUtils";
import { styles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { COLORS } from "shared/constants/colors";

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
}) => {
  const handleSave = () => {
    if (!newFood.name.trim()) {
      Alert.alert("Missing Name", "Please enter a name for this food.");
      return;
    }

    const newItem = {
      ...newFood,
      id: editingFoodId || Date.now().toString(),
      amount_g: safeNumber(newFood.amount_g),
      calories: safeNumber(newFood.calories),
      protein: safeNumber(newFood.protein),
      carbs: safeNumber(newFood.carbs),
      fats: safeNumber(newFood.fats),
    };

    if (editingFoodId) {
      setCustomFoods((f) => f.map((food) => food.id === editingFoodId ? { ...newItem, id: editingFoodId } : food));
    } else {
      setCustomFoods((f) => [...f, newItem]);
    }

    setNewFood({ name: "", amount_g: "", calories: "", protein: "", carbs: "", fats: "" });
    setEditingFoodId(null);
  };

  return (
    <ModalSheet visible={visible} onClose={() => setVisible(false)} title="Custom Foods">
      {customFoods.map((food) => (
        <Card key={food.id} style={{ marginBottom: SPACING.md }}>
          <Text style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md, marginBottom: SPACING.sm }}>{food.name}</Text>
          <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.textLight, marginBottom: SPACING.sm }}>
            {`Cal: ${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fats}g`}
          </Text>
          <View style={styles.foodActionsRow}>
            <View style={styles.foodActionsLeft}>
              <Button variant="success" size="sm" onPress={() => addCustomFood(food)}>Add</Button>
              <Button
                variant="secondary"
                size="sm"
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
              >
                Edit
              </Button>
            </View>
            <Button variant="danger" size="sm" onPress={() => setCustomFoods((f) => f.filter((x) => x.id !== food.id))}>Delete</Button>
          </View>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>{editingFoodId ? "Edit Food" : "Add New Food"}</Text>

      {customFoodFields.map((f) => (
        <TextField
          key={f.key}
          placeholder={f.label}
          keyboardType={f.keyboardType}
          value={newFood[f.key]}
          onChangeText={(v) => setNewFood((prev) => ({ ...prev, [f.key]: v }))}
          style={{ marginBottom: SPACING.sm }}
        />
      ))}

      <Button variant="primary" fullWidth onPress={handleSave}>
        {editingFoodId ? "Save Changes" : "Save"}
      </Button>
    </ModalSheet>
  );
};
