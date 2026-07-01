import { useRef } from "react";
import { Pressable, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { BORDER_RADIUS } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";

const VARIANTS = {
  primary: { bg: COLORS.primary, pressedBg: COLORS.primaryDark, icon: COLORS.textOnPrimary },
  secondary: { bg: COLORS.neutralSurface, pressedBg: COLORS.border, icon: COLORS.neutralDark },
  danger: { bg: COLORS.dangerSurface, pressedBg: COLORS.redLight, icon: COLORS.danger },
  ghost: { bg: "transparent", pressedBg: COLORS.neutralSurface, icon: COLORS.neutralDark },
};

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
  const scale = useRef(new Animated.Value(1)).current;
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
            backgroundColor: disabled ? COLORS.neutralSurface : v.bg,
            transform: [{ scale }],
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Ionicons name={icon} size={Math.round(dim * 0.5)} color={disabled ? COLORS.textDisabled : v.icon} />
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
