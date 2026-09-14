import { View, Text, Alert } from "react-native";
import { safeNumber } from "shared/utils/numberUtils";
import { customFoodFields } from "../utils/macroUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

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
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const handleDelete = (food) => {
    Alert.alert(
      "Delete Food?",
      `Remove "${food.name}" from your custom foods? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCustomFoods((f) => f.filter((x) => x.id !== food.id));
            // Leaving the form in edit mode for a food that no longer exists
            // would silently re-create it on save.
            if (editingFoodId === food.id) {
              setEditingFoodId(null);
              setNewFood({ name: "", amount_g: "", calories: "", protein: "", carbs: "", fats: "" });
            }
          },
        },
      ]
    );
  };

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
          <Text style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md, color: colors.textDark, marginBottom: SPACING.sm }}>{food.name}</Text>
          {/* Leads with the gram amount: without it there's no telling whether
              these macros are per 100 g or per serving. */}
          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textLight, marginBottom: SPACING.sm }}>
            {`${food.amount_g || 0}g · ${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fats}g`}
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
            <Button variant="danger" size="sm" onPress={() => handleDelete(food)}>Delete</Button>
          </View>
        </Card>
      ))}

      <Text style={styles.sectionTitle}>{editingFoodId ? "Edit Food" : "Add New Food"}</Text>

      {customFoodFields.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
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
