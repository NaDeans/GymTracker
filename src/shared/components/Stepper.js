import { View, Text, TextInput, StyleSheet } from "react-native";
import { IconButton } from "./IconButton";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const SIZES = {
  hero: { buttonSize: "md", fontSize: FONT_SIZE.lg, minWidth: 68, height: 48, suffixExtra: 34 },
  compact: { buttonSize: "sm", fontSize: FONT_SIZE.md, minWidth: 40, height: 36, suffixExtra: 22 },
};

const clamp = (n, min, max) => {
  let v = n;
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
};

const formatValue = (n, decimal) => (decimal ? (Math.round(n * 10) / 10).toString() : Math.round(n).toString());

export const Stepper = ({
  label,
  value,
  onStep,
  onDraftChange,
  onCommit,
  step = 1,
  min = 0,
  max,
  decimal = false,
  suffix,
  size = "hero",
}) => {
  const { colors } = useTheme();
  const s = SIZES[size] || SIZES.hero;
  const numeric = parseFloat(value) || 0;
  const boxWidth = suffix ? s.minWidth + s.suffixExtra : s.minWidth;
  const styles = createThemedStyles(colors);

  const step_ = (direction) => {
    const next = clamp(numeric + direction * step, min, max);
    onStep?.(formatValue(next, decimal));
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <IconButton icon="remove" variant="secondary" size={s.buttonSize} onPress={() => step_(-1)} />
        <View style={[styles.valueBox, { width: boxWidth, height: s.height }]}>
          <TextInput
            style={[styles.value, { fontSize: s.fontSize, flex: 1 }]}
            value={value}
            onChangeText={onDraftChange}
            onEndEditing={() => onCommit?.(value)}
            keyboardType={decimal ? "decimal-pad" : "number-pad"}
            textAlign="center"
            placeholder="0"
            placeholderTextColor={colors.textPlaceholder}
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>
        <IconButton icon="add" variant="secondary" size={s.buttonSize} onPress={() => step_(1)} />
      </View>
    </View>
  );
};

const createThemedStyles = (colors) => StyleSheet.create({
  container: { alignItems: "center" },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: colors.textMedium, marginBottom: SPACING.xs },
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  valueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    backgroundColor: colors.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: SPACING.sm,
  },
  value: { fontWeight: FONT_WEIGHT.bold, color: colors.textDark, minWidth: 30, padding: 0 },
  suffix: { fontSize: FONT_SIZE.xs, color: colors.textMuted },
});
