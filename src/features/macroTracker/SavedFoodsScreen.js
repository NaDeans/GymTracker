import { useMemo, useState } from "react";
import { View, Text, Alert, FlatList, StyleSheet } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { formatFoodName } from "shared/utils/textUtils";
import { sumItemMacros } from "./utils/macroUtils";
import { createThemedStyles } from "./macroTrackerStyles";
import { useMacroData } from "./context/MacroTrackerContext";
import { useFoodEditor } from "./hooks/useFoodEditor";
import { EditCachedFoodModal } from "./components/EditCachedFoodModal";
import { TextField } from "shared/components/TextField";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

// One food per saved entry, and its name is the key — so the name is the label.
// The key is only a fallback for an entry that somehow has no items.
const displayName = (key, data) => data?.items?.[0]?.name || formatFoodName(key);

// A screen rather than a modal, because the list was the problem: inside a
// ModalSheet it was a FlatList capped at half the window height nested in a
// sheet capped at another height, with no flexShrink, and two ancestor
// Pressables competing for the drag. Here the FlatList owns the screen and all
// of that goes away.
export default function SavedFoodsScreen() {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const screenStyles = createScreenStyles(colors);
  const { gptCache, setGptCache, addEditedFoodToLog, selectedDate } = useMacroData();
  const editor = useFoodEditor();
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const keys = Object.keys(gptCache).sort((a, b) => a.localeCompare(b));
    const q = query.trim().toLowerCase();
    return (q ? keys.filter((k) => k.includes(q)) : keys).map((key) => ({ key, data: gptCache[key] }));
  }, [gptCache, query]);

  const handleDelete = (key) => {
    Alert.alert(
      "Delete Food?",
      `Remove "${displayName(key, gptCache[key])}" from your saved foods? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setGptCache((prev) => { const updated = { ...prev }; delete updated[key]; return updated; }),
        },
      ]
    );
  };

  const handleAdd = (key) => {
    const entry = gptCache[key];
    if (!entry?.items?.length) return;
    addEditedFoodToLog({ key, foodId: entry.foodId, items: entry.items });
    Alert.alert("Added", `"${displayName(key, entry)}" added to ${selectedDate}.`);
  };

  const renderItem = ({ item: { key, data } }) => {
    const items = data.items || [];
    const macros = sumItemMacros(items);
    return (
      <Card padding={SPACING.sm} style={{ marginBottom: SPACING.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
          <Text style={{ flex: 1, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.sm, color: colors.textDark }} numberOfLines={1}>
            {displayName(key, data)}
          </Text>
          {data.source === "manual" && (
            <View style={styles.manualTag}><Text style={styles.manualTagText}>✎</Text></View>
          )}
          {data.source === "scan" && (
            <View style={styles.scanTag}><Text style={styles.scanTagText}>📷</Text></View>
          )}
          <IconButton icon="add" variant="primary" size="sm" onPress={() => handleAdd(key)} />
          <IconButton icon="pencil" variant="secondary" size="sm" onPress={() => editor.openSavedFood(key, data)} />
          <IconButton icon="trash" variant="danger" size="sm" onPress={() => handleDelete(key)} />
        </View>

        <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
          {items[0]?.amount_g ? `${Math.round(safeNumber(items[0].amount_g))}g · ` : ""}
          {`${fmt(macros.calories)} kcal · P ${fmt(macros.protein)}g · C ${fmt(macros.carbs)}g · F ${fmt(macros.fats)}g`}
        </Text>
      </Card>
    );
  };

  return (
    <View style={screenStyles.screen}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.key}
        renderItem={renderItem}
        contentContainerStyle={screenStyles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={screenStyles.mainTitle}>Saved Foods</Text>
            {/* The date lives on the Macros tab, so say where Add will land. */}
            <Text style={screenStyles.hint}>Adding goes to {selectedDate}</Text>
            <TextField
              icon="search"
              placeholder="Search saved foods"
              value={query}
              onChangeText={setQuery}
              rightIcon={query ? "close-circle" : undefined}
              onRightIconPress={() => setQuery("")}
              style={{ marginBottom: SPACING.lg }}
            />
          </>
        }
        ListEmptyComponent={
          <Text style={screenStyles.empty}>
            {Object.keys(gptCache).length === 0
              ? "No saved foods yet. Anything you search for gets saved here."
              : "No foods match your search."}
          </Text>
        }
      />

      <EditCachedFoodModal
        visible={editor.visible}
        setVisible={editor.setVisible}
        editingFood={editor.editingFood}
        setEditingFood={editor.setEditingFood}
        gptCache={gptCache}
        setGptCache={setGptCache}
        onAddToLog={addEditedFoodToLog}
      />
    </View>
  );
}

function createScreenStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    listContent: { flexGrow: 1, paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.screenBottom },
    mainTitle: { fontSize: FONT_SIZE.title, fontWeight: FONT_WEIGHT.bold, color: colors.textPrimary },
    hint: { fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: SPACING.xs, marginBottom: SPACING.lg },
    empty: { fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", marginTop: SPACING.xl },
  });
}
