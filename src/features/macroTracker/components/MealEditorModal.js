import { View, Text } from "react-native";
import { fmt } from "shared/utils/numberUtils";
import { mealItemFields, sumItemMacros } from "../utils/macroUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

// Edits every parameter of a meal: its name, and for each food its name,
// amount, macros and note. Values are held as strings by the caller and only
// coerced to numbers on save.
export const MealEditorModal = ({
  visible,
  meal,
  onChangeName,
  onChangeItem,
  onAddItem,
  onRemoveItem,
  onSave,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  if (!meal) return null;

  const macros = sumItemMacros(meal.items);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={meal.id ? "Edit Meal" : "New Meal"}
      footer={
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" onPress={onSave} style={{ flex: 1 }}>Save Meal</Button>
        </View>
      }
    >
      <TextField
        label="Meal Name"
        placeholder="e.g. Post-gym breakfast"
        value={meal.name}
        onChangeText={onChangeName}
        style={{ marginBottom: SPACING.sm }}
      />

      <Text style={styles.mealEditorTotals}>
        {`Meal total: ${fmt(macros.calories)} kcal · P ${fmt(macros.protein)}g · C ${fmt(macros.carbs)}g · F ${fmt(macros.fats)}g`}
      </Text>

      {meal.items.map((item, index) => (
        <Card key={item.id} style={{ marginBottom: SPACING.md }}>
          <View style={styles.mealCardHeader}>
            <Text style={styles.mealEditorItemTitle} numberOfLines={1}>
              {item.name.trim() || `Food ${index + 1}`}
            </Text>
            <IconButton icon="trash" variant="danger" size="sm" onPress={() => onRemoveItem(index)} />
          </View>

          {mealItemFields.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              keyboardType={field.keyboardType}
              value={item[field.key] ?? ""}
              onChangeText={(v) => onChangeItem(index, field.key, v)}
              style={{ marginBottom: SPACING.sm }}
            />
          ))}
        </Card>
      ))}

      <Button variant="outline" icon="add" fullWidth onPress={onAddItem}>Add Food</Button>
    </ModalSheet>
  );
};
