import { useRef } from "react";
import { Pressable, Animated, Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, CONTROL_HEIGHT } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";

const VARIANTS = {
  primary: { bg: COLORS.primary, pressedBg: COLORS.primaryDark, text: COLORS.textOnPrimary, border: null },
  secondary: { bg: COLORS.primarySurface, pressedBg: COLORS.border, text: COLORS.primary, border: null },
  success: { bg: COLORS.success, pressedBg: COLORS.successDark, text: COLORS.textOnPrimary, border: null },
  danger: { bg: COLORS.danger, pressedBg: COLORS.dangerDark, text: COLORS.textOnPrimary, border: null },
  ghost: { bg: "transparent", pressedBg: COLORS.neutralSurface, text: COLORS.primary, border: null },
  outline: { bg: "transparent", pressedBg: COLORS.primarySurface, text: COLORS.primary, border: COLORS.border },
};

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
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;
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
            backgroundColor: isDisabled ? COLORS.neutralSurface : v.bg,
            borderWidth: v.border ? 1 : 0,
            borderColor: v.border || "transparent",
            width: fullWidth ? "100%" : undefined,
            transform: [{ scale }],
            opacity: isDisabled ? 0.7 : 1,
          },
          style,
        ]}
      >
        {icon && !loading && (
          <Ionicons name={icon} size={s.iconSize} color={isDisabled ? COLORS.textDisabled : v.text} style={styles.icon} />
        )}
        {loading ? (
          <ActivityIndicator size="small" color={isDisabled ? COLORS.textDisabled : v.text} />
        ) : (
          <Text
            style={[
              styles.label,
              { fontSize: s.fontSize, color: isDisabled ? COLORS.textDisabled : v.text },
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
