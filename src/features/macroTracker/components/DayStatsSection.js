import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, Keyboard, AppState } from "react-native";
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
// How long typing has to pause before the weight is saved without a blur.
const WEIGHT_SAVE_DELAY_MS = 800;

export const DayStatsSection = ({
  date,
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

  // Saving used to hang off onEndEditing alone, and Android often never sends
  // it: hiding the keyboard with the back button leaves the field focused, and
  // switching tab, changing day or backgrounding the app tears it down first.
  // The typed weight was then silently dropped. So the draft is now flushed
  // from every exit — a pause in typing, blur, end-editing, keyboard hide, app
  // backgrounding and unmount. A debounce rather than per-keystroke saving,
  // because each write rewrites all ten AsyncStorage keys.
  //
  // Refs, because the keyboard/AppState listeners and the unmount cleanup are
  // registered once and must still see the latest draft and handler. `date` is
  // pinned per mount (the caller keys this on it), so an unmount flush lands on
  // the day that was being edited, not the one just switched to.
  const draftRef = useRef(draft);
  const savedRef = useRef(weight);
  const onCommitRef = useRef(onCommitWeight);
  onCommitRef.current = onCommitWeight;
  const timerRef = useRef(null);

  const parseDraft = (text) => {
    const raw = text.trim().replace(",", ".");
    if (raw === "") return { value: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return { value: Math.round(n * 10) / 10 };
  };

  const flush = () => {
    clearTimeout(timerRef.current);
    const parsed = parseDraft(draftRef.current);
    if (!parsed || parsed.value === savedRef.current) return parsed;
    savedRef.current = parsed.value;
    onCommitRef.current(parsed.value, date);
    return parsed;
  };

  // Leaving the field: save, then tidy what's shown ("72,46" → "72.5").
  const commit = () => {
    const parsed = flush();
    const shown = parsed ? parsed.value : savedRef.current;
    const text = shown != null ? fmt(shown) : "";
    draftRef.current = text;
    setDraft(text);
  };

  const onChangeText = (text) => {
    draftRef.current = text;
    setDraft(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, WEIGHT_SAVE_DELAY_MS);
  };

  // The stored weight changed under us (e.g. "Reset day") — show that instead.
  useEffect(() => {
    if (weight === savedRef.current) return;
    savedRef.current = weight;
    const text = weight != null ? fmt(weight) : "";
    draftRef.current = text;
    setDraft(text);
  }, [weight]);

  useEffect(() => {
    const keyboardSub = Keyboard.addListener("keyboardDidHide", flush);
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    return () => {
      keyboardSub.remove();
      appStateSub.remove();
      flush();
    };
  }, []);

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
        onChangeText={onChangeText}
        onEndEditing={commit}
        onBlur={commit}
        onSubmitEditing={commit}
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
