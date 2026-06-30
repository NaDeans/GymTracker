import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { styles } from "../macroTrackerStyles";

const DailyLogItem = ({ item, count, gramValue, setGramValue, updateGrams, addItem, removeItem, clearItem }) => {
  const raw = item.raw || item;
  const baseG = safeNumber(raw.amount_g) || 1;

  const displayMacros = {
    calories: (safeNumber(raw.calories) * safeNumber(gramValue)) / baseG,
    protein: (safeNumber(raw.protein) * safeNumber(gramValue)) / baseG,
    carbs: (safeNumber(raw.carbs) * safeNumber(gramValue)) / baseG,
    fats: (safeNumber(raw.fats) * safeNumber(gramValue)) / baseG,
  };

  return (
    <View style={styles.itemBlock}>
      <Text style={styles.itemName}>{item.name}</Text>

      <View style={styles.gramsRow}>
        <TextInput
          style={styles.gramsInput}
          keyboardType="numeric"
          value={String(gramValue)}
          onChangeText={setGramValue}
          onEndEditing={() => {
            const g = parseFloat(gramValue);
            if (!isNaN(g) && g > 0) updateGrams(item.id, g);
          }}
        />
        <Text>g</Text>
      </View>

      <Text style={styles.macros}>
        {fmt(displayMacros.calories)} kcal · P {fmt(displayMacros.protein)}g · C {fmt(displayMacros.carbs)}g · F {fmt(displayMacros.fats)}g
      </Text>

      <View style={styles.buttonRow}>
        <View style={styles.leftButtons}>
          <Pressable onPress={() => addItem(item)} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}>
            <Text style={styles.buttonText}>Add</Text>
          </Pressable>
          <Pressable
            onPress={() => removeItem(item)}
            disabled={count === 0}
            style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
          >
            <Text style={styles.buttonText}>Remove</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => clearItem(item)} style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}>
          <Text style={styles.buttonText}>Clear</Text>
        </Pressable>
      </View>

      {count > 0 && <Text style={styles.addedText}>Added ×{count}</Text>}
      {item.assumption && <Text style={styles.assumption}>Note: {item.assumption}</Text>}
    </View>
  );
};

export const DailyControls = ({
  selectedDate,
  historyByDate,
  dailyLog,
  gramInputs,
  setGramInputs,
  addItem,
  removeItem,
  clearItem,
  updateGrams,
  resetDay,
  submit,
  loading,
  setFoodDbVisible,
}) => (
  <ScrollView style={{ marginTop: 20 }}>
    <Pressable onPress={submit} style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
      <Text style={styles.buttonText}>{loading ? "Processing..." : "Submit"}</Text>
    </Pressable>

    <Pressable onPress={() => setFoodDbVisible(true)} style={({ pressed }) => [styles.customButton, pressed && styles.customButtonPressed]}>
      <Text style={styles.buttonText}>Custom Foods</Text>
    </Pressable>

    {(historyByDate[selectedDate] || []).map((entry, idx) => (
      <View key={idx} style={styles.historyBlock}>
        {entry.items.map((item) => (
          <DailyLogItem
            key={item.id}
            item={item}
            count={dailyLog[selectedDate]?.items[item.id]?.count || 0}
            gramValue={parseFloat(gramInputs[item.id] ?? item.amount_g)}
            setGramValue={(v) => setGramInputs((prev) => ({ ...prev, [item.id]: v }))}
            updateGrams={updateGrams}
            addItem={addItem}
            removeItem={removeItem}
            clearItem={clearItem}
          />
        ))}
      </View>
    ))}

    <Pressable onPress={resetDay} style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}>
      <Text style={styles.buttonText}>Reset Day</Text>
    </Pressable>
  </ScrollView>
);
