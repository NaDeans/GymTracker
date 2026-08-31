import { View, Text } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Stepper } from "shared/components/Stepper";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const DailyLogItem = ({ item, count, gramValue, setGramValue, updateGrams, addItem, removeItem, clearItem, onEdit, isCustom }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
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
    <Card padding={SPACING.md} style={styles.itemBlock}>
      <View style={styles.itemHeaderRow}>
        <Text style={styles.itemName}>{item.name}</Text>
        {isCustom ? (
          <View style={styles.customFoodTag}>
            <Text style={styles.customFoodTagText}>Custom</Text>
          </View>
        ) : (
          <IconButton icon="pencil" variant="ghost" size="sm" onPress={onEdit} />
        )}
      </View>

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
          scrollOnFocus={false}
        />
      </View>

      <Text style={styles.macros}>
        {fmt(displayMacros.calories)} kcal · P {fmt(displayMacros.protein)}g · C {fmt(displayMacros.carbs)}g · F {fmt(displayMacros.fats)}g
      </Text>

      <View style={styles.buttonRow}>
        <View style={styles.leftButtons}>
          <Button variant="success" size="sm" style={styles.logActionButton} onPress={() => addItem(item)}>Add</Button>
          <Button variant="secondary" size="sm" style={styles.logActionButton} disabled={count === 0} onPress={() => removeItem(item)}>Remove</Button>
        </View>
        <Button variant="outline" size="sm" style={styles.logActionButton} onPress={() => clearItem(item)}>Clear</Button>
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
  exportDay,
  exportRange,
  submit,
  loading,
  setFoodDbVisible,
  setCacheManagerVisible,
  onEditEntry,
  supplementsSection,
}) => (
  <View style={{ marginTop: SPACING.lg, gap: SPACING.xs }}>
    <Button variant="primary" size="sm" fullWidth loading={loading} onPress={() => submit()}>Submit</Button>

    <View style={{ flexDirection: "row", gap: SPACING.xs }}>
      <Button variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => setFoodDbVisible(true)}>Custom Foods</Button>
      <Button variant="secondary" size="sm" icon="bookmarks" style={{ flex: 1 }} onPress={() => setCacheManagerVisible(true)}>Saved Foods</Button>
    </View>

    {(historyByDate[selectedDate] || []).map((entry, idx) =>
      entry.items.map((item) => {
        const draft = gramInputs[item.id];
        const gramValue = draft === undefined ? safeNumber(item.amount_g) : safeNumber(parseFloat(draft));
        return (
          <DailyLogItem
            key={item.id}
            item={item}
            count={dailyLog[selectedDate]?.items[item.id]?.count || 0}
            gramValue={gramValue}
            setGramValue={(v) => setGramInputs((prev) => ({ ...prev, [item.id]: v }))}
            updateGrams={updateGrams}
            addItem={addItem}
            removeItem={removeItem}
            clearItem={clearItem}
            onEdit={() => onEditEntry(entry, idx)}
            isCustom={!entry.foodId}
          />
        );
      })
    )}

    {supplementsSection}

    <View style={{ flexDirection: "row", gap: SPACING.xs, marginTop: SPACING.lg }}>
      <Button variant="outline" size="sm" style={{ flex: 2 }} onPress={exportDay}>Export Day</Button>
      <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => exportRange(14)}>14 Days</Button>
    </View>

    <Button variant="danger" size="sm" onPress={resetDay} style={{ alignSelf: "center", marginTop: SPACING.sm }}>Reset Day</Button>
  </View>
);
