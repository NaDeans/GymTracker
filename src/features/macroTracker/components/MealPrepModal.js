import { useState, useEffect, useMemo } from "react";
import { View, Text, Alert, Keyboard, FlatList, Pressable, useWindowDimensions } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { triggerImpact } from "shared/utils/haptics";
import { formatFoodName } from "shared/utils/textUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import {
  emptyMealPrep,
  blankIngredient,
  ingredientFromItem,
  sumIngredients,
  perServingMacros,
} from "../utils/mealPrepUtils";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Badge } from "shared/components/Badge";
import { Stepper } from "shared/components/Stepper";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const NUMBER_FIELDS = [
  { key: "amount_g", label: "Amount (g)" },
  { key: "calories", label: "Calories" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fats", label: "Fats (g)" },
];

// Ingredient numbers are held as raw strings while editing so partial input
// like "1." survives a keystroke; they are coerced on save. Same reasoning as
// EditCachedFoodModal.
const toDraft = (ing) => ({
  ...ing,
  amount_g: String(ing.amount_g ?? ""),
  calories: String(ing.calories ?? ""),
  protein: String(ing.protein ?? ""),
  carbs: String(ing.carbs ?? ""),
  fats: String(ing.fats ?? ""),
});

const fromDraft = (ing) => ({
  id: ing.id,
  name: (ing.name || "").trim(),
  amount_g: safeNumber(ing.amount_g),
  calories: safeNumber(ing.calories),
  protein: safeNumber(ing.protein),
  carbs: safeNumber(ing.carbs),
  fats: safeNumber(ing.fats),
  assumption: ing.assumption || null,
});

const macroLine = (m) =>
  `${fmt(m.calories)} kcal · P ${fmt(m.protein)}g · C ${fmt(m.carbs)}g · F ${fmt(m.fats)}g`;

export const MealPrepModal = ({
  visible,
  setVisible,
  mealPreps,
  saveMealPrep,
  deleteMealPrep,
  logMealPrepServing,
  loggedMealPrep,
  lookupFood,
  gptCache,
  meals,
  openMealPrepId,
  onConsumeOpenMealPrepId,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const { height: windowHeight } = useWindowDimensions();

  const [mode, setMode] = useState("list");
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState("");
  const [servingDrafts, setServingDrafts] = useState({});

  const [ingQuery, setIngQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedIng, setExpandedIng] = useState(null);

  const openBuilder = (prep) => {
    const base = prep || emptyMealPrep();
    setDraft({
      ...base,
      servings: String(base.servings ?? 1),
      ingredients: (base.ingredients || []).map(toDraft),
    });
    setIngQuery("");
    setExpandedIng(null);
    setMode("builder");
  };

  // Opening straight into a prep, from the pencil on a logged prep card.
  useEffect(() => {
    if (!visible || !openMealPrepId) return;
    const found = mealPreps.find((r) => r.id === openMealPrepId);
    if (found) openBuilder(found);
    onConsumeOpenMealPrepId?.();
  }, [visible, openMealPrepId]);

  useEffect(() => {
    if (visible) return;
    setMode("list");
    setDraft(null);
    setQuery("");
    setIngQuery("");
  }, [visible]);

  const close = () => setVisible(false);

  /* ------------------------------- LIST MODE ------------------------------ */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...mealPreps].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return q ? sorted.filter((r) => (r.name || "").toLowerCase().includes(q)) : sorted;
  }, [mealPreps, query]);

  const confirmDelete = (prep, after) => {
    Alert.alert(
      "Delete Meal Prep?",
      `Remove "${prep.name}"? Servings already logged will stay in your diary.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { deleteMealPrep(prep.id); after?.(); } },
      ]
    );
  };

  const handleLog = (prep) => {
    const servings = parseFloat(servingDrafts[prep.id] ?? "1");
    if (isNaN(servings) || servings <= 0) {
      Alert.alert("Invalid servings", "Enter how many servings you are eating.");
      return;
    }

    const commit = (mode) => {
      logMealPrepServing(prep, servings, mode);
      triggerImpact("medium");
      close();
    };

    // Already on the day at a different serving size, so "add" is ambiguous:
    // another helping of the logged size, or resize every helping? Resizing
    // changes what's already on the plate, so it's asked rather than guessed.
    const logged = loggedMealPrep(prep.id);
    if (logged && Math.abs(logged.servings - servings) > 0.01) {
      Alert.alert(
        "Already logged",
        `"${prep.name}" is on this day at ${fmt(logged.servings)} servings ×${logged.count}.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: `Another ×${fmt(logged.servings)}`, onPress: () => commit("addHelping") },
          { text: `Change to ${fmt(servings)}`, onPress: () => commit("resize") },
        ]
      );
      return;
    }

    commit("addHelping");
  };

  const renderMealPrep = ({ item: prep }) => {
    const per = perServingMacros(prep);
    const servings = servingDrafts[prep.id] ?? "1";
    return (
      <Card padding={SPACING.md} style={{ marginBottom: SPACING.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
          <Text
            style={{ flex: 1, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md, color: colors.textDark }}
            numberOfLines={1}
          >
            {prep.name}
          </Text>
          <IconButton icon="pencil" variant="secondary" size="sm" onPress={() => openBuilder(prep)} />
          <IconButton icon="trash" variant="danger" size="sm" onPress={() => confirmDelete(prep)} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs, marginTop: SPACING.xs }}>
          <Badge label={`${prep.servings} meals`} variant="primary" />
          <Text style={styles.mealPrepMeta} numberOfLines={1}>≈{fmt(per.amount_g)} g raw each</Text>
        </View>

        <Text style={[styles.mealPrepMeta, { marginTop: SPACING.xs }]}>{macroLine(per)} per serving</Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: SPACING.sm,
            gap: SPACING.sm,
          }}
        >
          <Stepper
            size="compact"
            value={servings}
            onDraftChange={(v) => setServingDrafts((prev) => ({ ...prev, [prep.id]: v }))}
            onStep={(v) => setServingDrafts((prev) => ({ ...prev, [prep.id]: v }))}
            step={0.5}
            min={0.5}
            decimal
            suffix="srv"
          />
          <Button variant="success" size="sm" onPress={() => handleLog(prep)}>Add to Log</Button>
        </View>
      </Card>
    );
  };

  /* ------------------------------ BUILDER MODE ---------------------------- */

  const bulk = draft ? sumIngredients(draft.ingredients) : null;
  const per = draft ? perServingMacros({ servings: draft.servings, ingredients: draft.ingredients }) : null;
  const isExisting = draft ? mealPreps.some((r) => r.id === draft.id) : false;

  // Saved foods and saved meals, offered as ingredients without an API call.
  const ingSuggestions = useMemo(() => {
    const q = ingQuery.trim().toLowerCase();
    if (!q) return [];
    const cacheHits = Object.keys(gptCache)
      .filter((k) => k.includes(q))
      .map((k) => ({
        id: `cache:${k}`,
        label: gptCache[k].items?.[0]?.name || formatFoodName(k),
        tag: "Saved",
        items: gptCache[k].items || [],
      }));
    // A meal drops all of its foods in at once — handy when a prep reuses one.
    const mealHits = (meals || [])
      .filter((m) => (m.name || "").toLowerCase().includes(q))
      .map((m) => ({ id: `meal:${m.id}`, label: m.name, tag: "Meal", items: m.items || [] }));
    return [...cacheHits, ...mealHits].slice(0, 6);
  }, [ingQuery, gptCache, meals]);

  const addIngredients = (items) => {
    const added = items.map((i) => toDraft(ingredientFromItem(i)));
    setDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, ...added] }));
    setIngQuery("");
    if (added.some((i) => safeNumber(i.amount_g) === 0)) {
      Alert.alert("Check the amount", "One of those came back without an amount — set its grams before saving.");
    }
  };

  const handleLookup = async () => {
    const q = ingQuery.trim();
    if (!q) return;
    Keyboard.dismiss();
    setBusy(true);
    try {
      const result = await lookupFood(q);
      if (!result?.items?.length) throw new Error("No nutrition items returned");
      addIngredients(result.items);
    } catch (err) {
      console.error("Ingredient lookup error:", err);
      if (err.message === "No nutrition items returned") {
        Alert.alert("Not found", "Could not find that. Add a blank ingredient and type the macros in yourself.");
      } else {
        Alert.alert("Error", "Something went wrong fetching nutrition data. Check your connection and API key.");
      }
    } finally {
      setBusy(false);
    }
  };

  const updateIngredient = (index, field, value) => {
    setDraft((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = { ...ingredients[index], [field]: value };
      return { ...prev, ingredients };
    });
  };

  const removeIngredient = (id) => {
    setDraft((prev) => ({ ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) }));
  };

  const handleSaveMealPrep = () => {
    const name = (draft.name || "").trim();
    const servings = Math.max(1, Math.round(safeNumber(draft.servings)));
    if (!name) { Alert.alert("Name required", "Give this meal prep a name."); return; }
    if (!draft.ingredients.length) { Alert.alert("No ingredients", "Add at least one ingredient."); return; }
    Keyboard.dismiss();
    saveMealPrep({ ...draft, name, servings, ingredients: draft.ingredients.map(fromDraft) });
    setMode("list");
    setDraft(null);
  };

  const renderIngredient = (ing, index) => {
    const expanded = expandedIng === ing.id;
    return (
      <Card key={ing.id} padding={SPACING.sm} style={{ marginBottom: SPACING.xs }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
          <Pressable style={{ flex: 1 }} onPress={() => setExpandedIng(expanded ? null : ing.id)}>
            <Text
              style={{ fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: colors.textDark }}
              numberOfLines={1}
            >
              {ing.name || "Untitled ingredient"}
            </Text>
            <Text style={styles.mealPrepMeta} numberOfLines={1}>
              {fmt(safeNumber(ing.amount_g))} g · {fmt(safeNumber(ing.calories))} kcal
            </Text>
          </Pressable>
          <IconButton
            icon={expanded ? "chevron-up" : "chevron-down"}
            variant="ghost"
            size="sm"
            onPress={() => setExpandedIng(expanded ? null : ing.id)}
          />
          <IconButton icon="trash" variant="danger" size="sm" onPress={() => removeIngredient(ing.id)} />
        </View>

        {expanded && (
          <View style={{ marginTop: SPACING.sm }}>
            <TextField
              label="Name"
              size="sm"
              value={ing.name}
              onChangeText={(v) => updateIngredient(index, "name", v)}
              style={{ marginBottom: SPACING.xs }}
            />
            {NUMBER_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                size="sm"
                keyboardType="decimal-pad"
                value={ing[key]}
                onChangeText={(v) => updateIngredient(index, key, v)}
                style={{ marginBottom: SPACING.xs }}
              />
            ))}
          </View>
        )}
      </Card>
    );
  };

  /* -------------------------------- RENDER -------------------------------- */

  if (mode === "builder" && draft) {
    return (
      <ModalSheet
        visible={visible}
        onClose={close}
        title={isExisting ? "Edit Meal Prep" : "New Meal Prep"}
        footer={
          <View style={{ flexDirection: "row", gap: SPACING.sm }}>
            {isExisting && (
              <Button
                variant="danger"
                size="sm"
                onPress={() => confirmDelete(draft, () => { setMode("list"); setDraft(null); })}
              >
                Delete
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => { setMode("list"); setDraft(null); }}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" style={{ flex: 1 }} onPress={handleSaveMealPrep}>Save</Button>
          </View>
        }
      >
        <TextField
          label="Name"
          placeholder="Chicken & Rice Prep"
          value={draft.name}
          onChangeText={(v) => setDraft((prev) => ({ ...prev, name: v }))}
          style={{ marginBottom: SPACING.sm }}
        />

        <View style={{ alignItems: "flex-start", marginBottom: SPACING.sm }}>
          <Stepper
            label="Meals it makes"
            size="compact"
            value={String(draft.servings)}
            onDraftChange={(v) => setDraft((prev) => ({ ...prev, servings: v }))}
            onStep={(v) => setDraft((prev) => ({ ...prev, servings: v }))}
            step={1}
            min={1}
          />
        </View>

        <Text style={styles.sectionTitle}>Bulk Ingredients</Text>
        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginBottom: SPACING.sm }}>
          Enter the amounts for the whole cook, e.g. "1.2kg chicken breast". The macros get divided by the number of meals.
        </Text>

        <TextField
          icon="search"
          placeholder="Search or look up an ingredient"
          value={ingQuery}
          onChangeText={setIngQuery}
          onSubmitEditing={handleLookup}
          style={{ marginBottom: SPACING.xs }}
        />

        {ingSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { marginBottom: SPACING.xs }]}>
            {ingSuggestions.map((s, i) => (
              <Pressable
                key={s.id}
                style={[styles.suggestionRow, i > 0 && styles.suggestionDivider]}
                onPress={() => addIngredients(s.items)}
              >
                <Text style={[styles.suggestionText, { flex: 1 }]} numberOfLines={1}>{s.label}</Text>
                <View style={styles.customFoodTag}>
                  <Text style={styles.customFoodTagText}>{s.tag}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ flexDirection: "row", gap: SPACING.xs, marginBottom: SPACING.sm }}>
          <Button variant="primary" size="sm" style={{ flex: 1 }} loading={busy} onPress={handleLookup}>
            Look Up
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            style={{ flex: 1 }}
            onPress={() => {
              const blank = toDraft(blankIngredient());
              setDraft((prev) => ({ ...prev, ingredients: [...prev.ingredients, blank] }));
              setExpandedIng(blank.id);
            }}
          >
            Blank
          </Button>
        </View>

        {draft.ingredients.length === 0 ? (
          <Text
            style={{ fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", marginVertical: SPACING.md }}
          >
            No ingredients yet.
          </Text>
        ) : (
          draft.ingredients.map(renderIngredient)
        )}

        <View style={styles.perServingBox}>
          <Text style={styles.perServingLabel}>WHOLE BATCH</Text>
          <Text style={styles.perServingValue}>{macroLine(bulk)}</Text>
          <Text style={styles.mealPrepMeta}>{fmt(bulk.amount_g)} g of raw ingredients</Text>

          <Text style={[styles.perServingLabel, { marginTop: SPACING.sm }]}>
            PER SERVING (÷ {Math.max(1, Math.round(safeNumber(draft.servings))) || 1} meals)
          </Text>
          <Text style={styles.perServingValue}>{macroLine(per)}</Text>
          <Text style={styles.mealPrepMeta}>≈{fmt(per.amount_g)} g of raw ingredients</Text>
        </View>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      visible={visible}
      onClose={close}
      title="Meal Preps"
      showCloseButton
      scrollable={false}
      footer={
        <Button variant="primary" fullWidth icon="add" onPress={() => openBuilder(null)}>
          New Meal Prep
        </Button>
      }
    >
      {mealPreps.length > 3 && (
        <TextField
          icon="search"
          placeholder="Search meal preps"
          value={query}
          onChangeText={setQuery}
          style={{ marginBottom: SPACING.sm }}
        />
      )}

      {filtered.length === 0 ? (
        <Text
          style={{ fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", marginVertical: SPACING.lg }}
        >
          {mealPreps.length === 0
            ? "No meal preps yet. Add the bulk ingredients of a cook and how many meals it makes."
            : "No meal preps match your search."}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderMealPrep}
          style={{ maxHeight: windowHeight * 0.5 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </ModalSheet>
  );
};
