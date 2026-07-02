import { useRef } from "react";
import { Pressable, Animated, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, CONTROL_HEIGHT } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";
import { useTheme } from "shared/hooks/useTheme";

const createVariants = (colors) => ({
  primary: { bg: colors.primary, pressedBg: colors.primaryDark, text: colors.textOnPrimary, border: null },
  secondary: { bg: colors.primarySurface, pressedBg: colors.border, text: colors.primary, border: null },
  success: { bg: colors.success, pressedBg: colors.successDark, text: colors.textOnPrimary, border: null },
  danger: { bg: colors.danger, pressedBg: colors.dangerDark, text: colors.textOnPrimary, border: null },
  ghost: { bg: "transparent", pressedBg: colors.neutralSurface, text: colors.primary, border: null },
  outline: { bg: "transparent", pressedBg: colors.primarySurface, text: colors.primary, border: colors.border },
});

const SIZES = {
  sm: { height: CONTROL_HEIGHT.sm, paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.sm, iconSize: 16 },
  md: { height: CONTROL_HEIGHT.md, paddingHorizontal: SPACING.xl, fontSize: FONT_SIZE.md, iconSize: 18 },
  lg: { height: CONTROL_HEIGHT.md + 8, paddingHorizontal: SPACING.xxl, fontSize: FONT_SIZE.lg, iconSize: 20 },
};

export const Button = ({
  children,
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  haptic = true,
  hapticStyle = "light",
  style,
  textStyle,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;
  const VARIANTS = createVariants(colors);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;

  const animateTo = (toValue) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const handlePress = () => {
    if (isDisabled) return;
    if (haptic) triggerImpact(hapticStyle);
    onPress?.();
  };

  return (
    <Pressable
      style={style}
      onPress={handlePress}
      onPressIn={() => !isDisabled && animateTo(0.96)}
      onPressOut={() => !isDisabled && animateTo(1)}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      <Animated.View
        style={[
          styles.base,
          {
            height: s.height,
            paddingHorizontal: s.paddingHorizontal,
            backgroundColor: isDisabled ? colors.neutralSurface : v.bg,
            borderWidth: v.border ? 1 : 0,
            borderColor: v.border || "transparent",
            width: fullWidth ? "100%" : undefined,
            transform: [{ scale }],
            opacity: isDisabled ? 0.7 : 1,
          },
        ]}
      >
        {icon && !loading && (
          <Ionicons name={icon} size={s.iconSize} color={isDisabled ? colors.textDisabled : v.text} style={styles.icon} />
        )}
        {loading ? (
          <ActivityIndicator size="small" color={isDisabled ? colors.textDisabled : v.text} />
        ) : (
          <Text
            style={[
              styles.label,
              { fontSize: s.fontSize, color: isDisabled ? colors.textDisabled : v.text },
              textStyle,
            ]}
          >
            {children ?? label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
  },
  label: {
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.3,
  },
  icon: {
    marginRight: SPACING.xs,
  },
});
