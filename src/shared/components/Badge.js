import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const createVariants = (colors) => ({
  primary: { bg: colors.primarySurface, fg: colors.primary },
  success: { bg: colors.successSurface, fg: colors.success },
});

export const Badge = ({ icon, label, variant = "primary", style }) => {
  const { colors } = useTheme();
  const VARIANTS = createVariants(colors);
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <View style={[styles.base, { backgroundColor: v.bg }, style]}>
      {icon && <Ionicons name={icon} size={14} color={v.fg} style={styles.icon} />}
      <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.pill,
    alignSelf: "flex-start",
  },
  icon: { marginRight: 4 },
  label: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
});
