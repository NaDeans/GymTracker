import { useMemo, useState } from "react";
import { View, Text, Alert } from "react-native";
import { fmt, safeNumber } from "shared/utils/numberUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const sumMacros = (items) =>
  items.reduce(
    (acc, i) => ({
      calories: acc.calories + safeNumber(i.calories),
      protein: acc.protein + safeNumber(i.protein),
      carbs: acc.carbs + safeNumber(i.carbs),
      fats: acc.fats + safeNumber(i.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

export const CacheManagerModal = ({ visible, setVisible, gptCache, setGptCache, setEditingFood, setEditModalVisible }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const keys = Object.keys(gptCache).sort((a, b) => a.localeCompare(b));
    const q = query.trim().toLowerCase();
    return (q ? keys.filter((k) => k.includes(q)) : keys).map((key) => ({ key, data: gptCache[key] }));
  }, [gptCache, query]);

  const handleEdit = (key) => {
    const entry = gptCache[key];
    if (!entry?.items?.length) return;
    setEditingFood({ key, originalKey: key, foodId: entry.foodId, items: entry.items });
    setEditModalVisible(true);
  };

  const handleDelete = (key) => {
    Alert.alert(
      "Delete Food?",
      `Remove "${titleCase(key)}" from your saved foods? This can't be undone.`,
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

  return (
    <ModalSheet visible={visible} onClose={() => setVisible(false)} title="Saved Foods">
      <TextField
        icon="search"
        placeholder="Search saved foods"
        value={query}
        onChangeText={setQuery}
        style={{ marginBottom: SPACING.md }}
      />

      {entries.length === 0 && (
        <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textMuted, textAlign: "center", marginTop: SPACING.lg }}>
          {Object.keys(gptCache).length === 0 ? "No saved foods yet." : "No foods match your search."}
        </Text>
      )}

      {entries.map(({ key, data }) => {
        const items = data.items || [];
        const macros = sumMacros(items);
        return (
          <Card key={key} style={{ marginBottom: SPACING.md }}>
            <View style={styles.foodActionsRow}>
              <Text style={{ flex: 1, fontWeight: FONT_WEIGHT.semibold, fontSize: FONT_SIZE.md, color: colors.textDark }} numberOfLines={1}>
                {titleCase(key)}
              </Text>
              {data.source === "manual" && (
                <View style={styles.manualTag}>
                  <Text style={styles.manualTagText}>✎</Text>
                </View>
              )}
              {data.source === "scan" && (
                <View style={styles.scanTag}>
                  <Text style={styles.scanTagText}>📷</Text>
                </View>
              )}
            </View>

            {items.length > 1 && (
              <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textMuted, marginTop: SPACING.xs }} numberOfLines={1}>
                {items.map((i) => i.name).join(", ")}
              </Text>
            )}

            <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textLight, marginTop: SPACING.xs, marginBottom: SPACING.sm }}>
              {`Cal: ${fmt(macros.calories)} kcal | P: ${fmt(macros.protein)}g | C: ${fmt(macros.carbs)}g | F: ${fmt(macros.fats)}g`}
            </Text>

            <View style={styles.foodActionsRow}>
              <View style={styles.foodActionsLeft}>
                <IconButton icon="pencil" variant="secondary" size="sm" onPress={() => handleEdit(key)} />
                <IconButton icon="trash" variant="danger" size="sm" onPress={() => handleDelete(key)} />
              </View>
            </View>
          </Card>
        );
      })}
    </ModalSheet>
  );
};
