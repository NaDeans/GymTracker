import { useState, useEffect } from "react";
import { View, Text, Alert, Keyboard } from "react-native";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { SPACING, FONT_SIZE } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const FIELDS = [
  { key: "name", label: "Name", keyboard: "default" },
  { key: "amount_g", label: "Amount (g)", keyboard: "decimal-pad" },
  { key: "calories", label: "Calories", keyboard: "decimal-pad" },
  { key: "protein", label: "Protein (g)", keyboard: "decimal-pad" },
  { key: "carbs", label: "Carbs (g)", keyboard: "decimal-pad" },
  { key: "fats", label: "Fats (g)", keyboard: "decimal-pad" },
];

const EMPTY = { name: "", amount_g: "100", calories: "", protein: "", carbs: "", fats: "" };

export const ManualEntryModal = ({ visible, setVisible, initialName, initialValues, onSave }) => {
  const { colors } = useTheme();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (visible) setForm(initialValues ? { ...EMPTY, ...initialValues } : { ...EMPTY, name: initialName || "" });
  }, [visible, initialName, initialValues]);

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert("Name required", "Enter a name for this food.");
      return;
    }
    const calories = Number(form.calories) || 0;
    const protein = Number(form.protein) || 0;
    const carbs = Number(form.carbs) || 0;
    const fats = Number(form.fats) || 0;
    if (calories === 0 && protein === 0 && carbs === 0 && fats === 0) {
      Alert.alert("No values", "Enter at least one macro or calorie value.");
      return;
    }
    Keyboard.dismiss();
    onSave({
      name: form.name.trim(),
      amount_g: Number(form.amount_g) || 100,
      calories,
      protein,
      carbs,
      fats,
    });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Manual Entry"
      footer={
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          <Button variant="secondary" onPress={() => setVisible(false)} style={{ flex: 1 }}>Cancel</Button>
          <Button variant="primary" onPress={handleSave} style={{ flex: 1 }}>Add to Log</Button>
        </View>
      }
    >
      <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginBottom: SPACING.md }}>
        {initialValues?.assumption
          ? `Scanned from photo — GPT noted: "${initialValues.assumption}". Review before adding to your log.`
          : "Adds this food to today's log and saves it to your search history with a ✎ tag so you can find it again."}
      </Text>

      {FIELDS.map(({ key, label, keyboard }, i) => (
        <TextField
          key={key}
          label={label}
          value={form[key]}
          keyboardType={keyboard}
          autoFocus={i === 0}
          onChangeText={(v) => setForm((prev) => ({ ...prev, [key]: v }))}
          style={{ marginBottom: SPACING.sm }}
        />
      ))}
    </ModalSheet>
  );
};
