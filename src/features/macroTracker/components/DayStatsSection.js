import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { TextField } from "shared/components/TextField";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { fmt } from "shared/utils/numberUtils";
import { useTheme } from "shared/hooks/useTheme";
import { triggerImpact } from "shared/utils/haptics";

// Body weight and the user's daily checklist for the selected day. Sits under
// the supplements tick-list and follows the same shape: one card, one row per
// thing, with the list itself edited in NamedListModal via the gear.
//
// The caller passes key={selectedDate}, so changing day remounts this and the
// weight draft resets with it — no resync effect needed.
export const DayStatsSection = ({
  weight,
  previousWeight,
  onCommitWeight,
  checklist,
  checkedIds,
  onToggleItem,
  onManage,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [draft, setDraft] = useState(() => (weight != null ? fmt(weight) : ""));

  // Committed on blur rather than per keystroke: every write here rewrites all
  // ten AsyncStorage keys (saveMacroTrackerData persists them as one blob), and
  // a half-typed "7" should never be recorded as a body weight.
  const commit = () => {
    const raw = draft.trim().replace(",", ".");
    if (raw === "") {
      setDraft("");
      onCommitWeight(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      setDraft(weight != null ? fmt(weight) : "");
      return;
    }
    const rounded = Math.round(n * 10) / 10;
    setDraft(fmt(rounded));
    onCommitWeight(rounded);
  };

  const checkRow = (label, done, onToggle, withDivider) => (
    <Pressable
      style={[styles.dayStatsCheckRow, withDivider && styles.dayStatsCheckRowDivider]}
      onPress={() => { triggerImpact("light"); onToggle(); }}
      hitSlop={4}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
    >
      <Ionicons
        name={done ? "checkbox" : "square-outline"}
        size={24}
        color={done ? colors.success : colors.textMuted}
      />
      <Text style={[styles.dayStatsCheckLabel, done && styles.dayStatsCheckLabelDone]}>{label}</Text>
    </Pressable>
  );

  return (
    <Card padding={SPACING.md} style={styles.dayStatsCard}>
      <View style={styles.supplementsHeaderRow}>
        <Text style={styles.dayStatsTitle}>Today</Text>
        <IconButton icon="settings-outline" variant="ghost" size="sm" onPress={onManage} />
      </View>

      <TextField
        label="Body weight"
        value={draft}
        onChangeText={setDraft}
        onEndEditing={commit}
        keyboardType="decimal-pad"
        suffix="kg"
        size="sm"
        // Hint only — the placeholder renders in textPlaceholder grey and
        // nothing is recorded until something is actually typed.
        placeholder={previousWeight != null ? fmt(previousWeight) : "0.0"}
      />
      {previousWeight != null && weight == null && (
        <Text style={styles.dayStatsHint}>Yesterday: {fmt(previousWeight)} kg</Text>
      )}

      <View style={{ marginTop: SPACING.sm }}>
        {checklist.length === 0 ? (
          <Text style={styles.supplementsEmpty}>
            No checklist items. Tap the gear to add things to tick off each day.
          </Text>
        ) : (
          checklist.map((c, idx) => (
            <View key={c.id}>
              {checkRow(c.name, checkedIds.includes(c.id), () => onToggleItem(c.id), idx > 0)}
            </View>
          ))
        )}
      </View>
    </Card>
  );
};
