import { useRef } from "react";
import { Pressable, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { BORDER_RADIUS } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";
import { useTheme } from "shared/hooks/useTheme";

const createVariants = (colors) => ({
  primary: { bg: colors.primary, pressedBg: colors.primaryDark, icon: colors.textOnPrimary },
  secondary: { bg: colors.neutralSurface, pressedBg: colors.border, icon: colors.neutralDark },
  danger: { bg: colors.dangerSurface, pressedBg: colors.redLight, icon: colors.danger },
  ghost: { bg: "transparent", pressedBg: colors.neutralSurface, icon: colors.neutralDark },
});

const SIZES = { sm: 32, md: 40, lg: 48 };

export const IconButton = ({
  icon,
  onPress,
  variant = "ghost",
  size = "md",
  disabled = false,
  haptic = true,
  hapticStyle = "light",
  style,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const VARIANTS = createVariants(colors);
  const v = VARIANTS[variant] || VARIANTS.ghost;
  const dim = SIZES[size] || SIZES.md;

  const animateTo = (toValue) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (haptic) triggerImpact(hapticStyle);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => !disabled && animateTo(0.9)}
      onPressOut={() => !disabled && animateTo(1)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Animated.View
        style={[
          styles.base,
          {
            width: dim,
            height: dim,
            borderRadius: BORDER_RADIUS.pill,
            backgroundColor: disabled ? colors.neutralSurface : v.bg,
            transform: [{ scale }],
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Ionicons name={icon} size={Math.round(dim * 0.5)} color={disabled ? colors.textDisabled : v.icon} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
