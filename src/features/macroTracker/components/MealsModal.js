import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { fmt } from "shared/utils/numberUtils";
import { sumItemMacros } from "../utils/macroUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

export const MealsModal = ({ visible, setVisible, meals, onAddToLog, onEdit, onDelete, onNew }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...meals].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (meal) =>
        meal.name.toLowerCase().includes(q) ||
        meal.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [meals, query]);

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Meals"
      showCloseButton
      footer={<Button variant="primary" icon="add" fullWidth onPress={onNew}>New Meal</Button>}
    >
      {meals.length > 1 && (
        <TextField
          icon="search"
          placeholder="Search meals"
          value={query}
          onChangeText={setQuery}
          style={{ marginBottom: SPACING.sm }}
        />
      )}

      {shown.length === 0 ? (
        <Text style={styles.mealsEmptyText}>
          {meals.length === 0
            ? "No meals yet. Tick foods in the day's log and tap \"Save as Meal\", or create one from scratch below."
            : "No meals match your search."}
        </Text>
      ) : (
        shown.map((meal) => {
          const macros = sumItemMacros(meal.items);
          return (
            <Card key={meal.id} padding={SPACING.md} style={{ marginBottom: SPACING.sm }}>
              <View style={styles.mealCardHeader}>
                <Text style={styles.mealCardTitle} numberOfLines={1}>{meal.name}</Text>
                <IconButton icon="pencil" variant="secondary" size="sm" onPress={() => onEdit(meal)} />
                <IconButton icon="trash" variant="danger" size="sm" onPress={() => onDelete(meal)} />
              </View>

              <Text style={styles.mealCardMacros}>
                {`${fmt(macros.calories)} kcal · P ${fmt(macros.protein)}g · C ${fmt(macros.carbs)}g · F ${fmt(macros.fats)}g`}
              </Text>

              <Text style={styles.mealCardFoods} numberOfLines={2}>
                {meal.items.length === 0
                  ? "No foods yet"
                  : `${meal.items.length} food${meal.items.length === 1 ? "" : "s"} · ${meal.items.map((i) => i.name).join(", ")}`}
              </Text>

              <Button
                variant="success"
                size="sm"
                fullWidth
                style={{ marginTop: SPACING.sm }}
                onPress={() => onAddToLog(meal)}
              >
                Add to Log
              </Button>
            </Card>
          );
        })
      )}
    </ModalSheet>
  );
};
