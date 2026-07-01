import { View, Text } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { styles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { Stepper } from "shared/components/Stepper";
import { SPACING } from "shared/constants/styles";

const DailyLogItem = ({ item, count, gramValue, setGramValue, updateGrams, addItem, removeItem, clearItem }) => {
  const raw = item.raw || item;
  const baseG = safeNumber(raw.amount_g) || 1;

  const displayMacros = {
    calories: (safeNumber(raw.calories) * safeNumber(gramValue)) / baseG,
    protein: (safeNumber(raw.protein) * safeNumber(gramValue)) / baseG,
    carbs: (safeNumber(raw.carbs) * safeNumber(gramValue)) / baseG,
    fats: (safeNumber(raw.fats) * safeNumber(gramValue)) / baseG,
  };

  const commitGrams = (v) => {
    const g = parseFloat(v);
    if (!isNaN(g) && g > 0) updateGrams(item.id, g);
  };

  return (
    <Card style={styles.itemBlock}>
      <Text style={styles.itemName}>{item.name}</Text>

      <View style={styles.gramsRow}>
        <Stepper
          size="compact"
          value={String(gramValue)}
          onDraftChange={setGramValue}
          onCommit={commitGrams}
          onStep={(v) => { setGramValue(v); commitGrams(v); }}
          step={5}
          min={1}
          suffix="g"
        />
      </View>

      <Text style={styles.macros}>
        {fmt(displayMacros.calories)} kcal · P {fmt(displayMacros.protein)}g · C {fmt(displayMacros.carbs)}g · F {fmt(displayMacros.fats)}g
      </Text>

      <View style={styles.buttonRow}>
        <View style={styles.leftButtons}>
          <Button variant="success" size="sm" onPress={() => addItem(item)}>Add</Button>
          <Button variant="secondary" size="sm" disabled={count === 0} onPress={() => removeItem(item)}>Remove</Button>
        </View>
        <Button variant="outline" size="sm" onPress={() => clearItem(item)}>Clear</Button>
      </View>

      {count > 0 && <Text style={styles.addedText}>Added ×{count}</Text>}
      {item.assumption && <Text style={styles.assumption}>Note: {item.assumption}</Text>}
    </Card>
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
  <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
    <Button variant="primary" size="sm" fullWidth loading={loading} onPress={() => submit()}>Submit</Button>

    <Button variant="secondary" size="sm" fullWidth onPress={() => setFoodDbVisible(true)}>Custom Foods</Button>

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

    <Button variant="danger" size="sm" onPress={resetDay} style={{ alignSelf: "center", marginTop: SPACING.lg }}>Reset Day</Button>
  </View>
);
