import { useState } from "react";
import { View, Text } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { isRecipeItem, servingsFromItem } from "../utils/recipeUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Stepper } from "shared/components/Stepper";
import { SPACING, FONT_SIZE } from "shared/constants/styles";
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

// A meal prep collapses to one card. Its `raw` is the PER-SERVING base, so
// grams / raw.amount_g is the serving count and the existing gram machinery
// carries fractional servings — the stepper just speaks in servings.
const RecipeLogItem = ({ item, gramValue, updateGrams, clearItem, onEditRecipe }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [expanded, setExpanded] = useState(false);
  // null means "follow the logged value"; a string is an uncommitted keystroke,
  // kept raw so partial input like "1." survives.
  const [draftServings, setDraftServings] = useState(null);

  const raw = item.raw || item;
  const baseG = safeNumber(raw.amount_g) || 1;
  const loggedServings = servingsFromItem(item, gramValue);
  const servings = draftServings === null ? loggedServings : safeNumber(parseFloat(draftServings));
  const snapshot = item.recipe;
  const batchServings = Math.max(1, safeNumber(snapshot.servings) || 1);

  const displayMacros = {
    calories: safeNumber(raw.calories) * servings,
    protein: safeNumber(raw.protein) * servings,
    carbs: safeNumber(raw.carbs) * servings,
    fats: safeNumber(raw.fats) * servings,
  };

  const commitServings = (v) => {
    const s = parseFloat(v);
    if (!isNaN(s) && s > 0) updateGrams(item.id, s * baseG);
    setDraftServings(null);
  };

  const servingDisplay =
    draftServings === null ? String(Math.round(loggedServings * 10) / 10) : draftServings;

  return (
    <Card padding={SPACING.md} style={styles.itemBlock}>
      <View style={styles.itemHeaderRow}>
        <Text style={[styles.itemName, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
        <View style={styles.recipeTag}>
          <Text style={styles.recipeTagText}>Prep</Text>
        </View>
        <IconButton icon="pencil" variant="ghost" size="sm" onPress={onEditRecipe} />
        <IconButton
          icon={expanded ? "chevron-up" : "chevron-down"}
          variant="ghost"
          size="sm"
          onPress={() => setExpanded((e) => !e)}
        />
      </View>

      <View style={styles.gramsRow}>
        <Stepper
          size="compact"
          value={servingDisplay}
          onDraftChange={setDraftServings}
          onCommit={commitServings}
          onStep={commitServings}
          step={0.5}
          min={0.5}
          decimal
          suffix="srv"
          scrollOnFocus={false}
        />
      </View>

      <Text style={styles.macros}>
        {fmt(displayMacros.calories)} kcal · P {fmt(displayMacros.protein)}g · C {fmt(displayMacros.carbs)}g · F {fmt(displayMacros.fats)}g
      </Text>

      {expanded && (
        <View style={styles.ingredientList}>
          {snapshot.ingredients.map((ing, i) => (
            <View key={`${item.id}-ing-${i}`} style={styles.ingredientRow}>
              <Text style={styles.ingredientText} numberOfLines={1}>{ing.name}</Text>
              <Text style={[styles.ingredientText, { flex: 0, textAlign: "right" }]} numberOfLines={1}>
                {fmt((safeNumber(ing.amount_g) / batchServings) * servings)} g ·{" "}
                {fmt((safeNumber(ing.calories) / batchServings) * servings)} kcal
              </Text>
            </View>
          ))}
          <Text style={[styles.assumption, { marginTop: SPACING.xs }]}>
            From a batch of {batchServings} meals · ≈{fmt(baseG)} g raw ingredients per serving
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <View style={styles.leftButtons} />
        <Button variant="outline" size="sm" style={styles.logActionButton} onPress={() => clearItem(item)}>Clear</Button>
      </View>
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
  onOpenMealPreps,
  onEditRecipe,
  onEditEntry,
}) => (
  <View style={{ marginTop: SPACING.lg, gap: SPACING.xs }}>
    <Button variant="primary" size="sm" fullWidth loading={loading} onPress={() => submit()}>Submit</Button>

    {/* Three across: the icons and full-size labels no longer fit, so these
        drop to the small label size to keep every word on one line. */}
    <View style={{ flexDirection: "row", gap: SPACING.xs }}>
      <Button variant="secondary" size="sm" textStyle={{ fontSize: FONT_SIZE.xs }} style={{ flex: 1 }} onPress={() => setFoodDbVisible(true)}>Custom Foods</Button>
      <Button variant="secondary" size="sm" textStyle={{ fontSize: FONT_SIZE.xs }} style={{ flex: 1 }} onPress={() => setCacheManagerVisible(true)}>Saved Foods</Button>
      <Button variant="secondary" size="sm" textStyle={{ fontSize: FONT_SIZE.xs }} style={{ flex: 1 }} onPress={() => onOpenMealPreps()}>Meal Preps</Button>
    </View>

    {(historyByDate[selectedDate] || []).map((entry, idx) =>
      entry.items.map((item) => {
        const draft = gramInputs[item.id];
        const gramValue = draft === undefined ? safeNumber(item.amount_g) : safeNumber(parseFloat(draft));
        const setGramValue = (v) => setGramInputs((prev) => ({ ...prev, [item.id]: v }));

        if (isRecipeItem(item)) {
          return (
            <RecipeLogItem
              key={item.id}
              item={item}
              gramValue={gramValue}
              updateGrams={updateGrams}
              clearItem={clearItem}
              onEditRecipe={() => onEditRecipe(item.recipe.recipeId)}
            />
          );
        }

        return (
          <DailyLogItem
            key={item.id}
            item={item}
            count={dailyLog[selectedDate]?.items[item.id]?.count || 0}
            gramValue={gramValue}
            setGramValue={setGramValue}
            updateGrams={updateGrams}
            addItem={addItem}
            removeItem={removeItem}
            clearItem={clearItem}
            onEdit={() => onEditEntry(entry, idx)}
            isCustom={!entry.foodId && !entry.recipeId}
          />
        );
      })
    )}

    <View style={{ flexDirection: "row", gap: SPACING.xs, marginTop: SPACING.lg }}>
      <Button variant="outline" size="sm" style={{ flex: 2 }} onPress={exportDay}>Export Day</Button>
      <Button variant="outline" size="sm" style={{ flex: 1 }} onPress={() => exportRange(14)}>14 Days</Button>
    </View>

    <Button variant="danger" size="sm" onPress={resetDay} style={{ alignSelf: "center", marginTop: SPACING.sm }}>Reset Day</Button>
  </View>
);
