import { useRef } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { SPACING, BORDER_RADIUS, SHADOW } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";
import { useTheme } from "shared/hooks/useTheme";

const createSurfaces = (colors) => ({
  surface1: colors.surface1,
  surface2: colors.surface2,
  raised: colors.surfaceRaised,
});

const ELEVATIONS = { none: null, sm: SHADOW.sm, md: SHADOW.md, lg: SHADOW.lg };

export const Card = ({
  children,
  onPress,
  elevation = "sm",
  surface = "surface1",
  padding = SPACING.lg,
  style,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const shadow = ELEVATIONS[elevation] || null;
  const SURFACES = createSurfaces(colors);
  const bg = SURFACES[surface] || colors.surface1;

  const cardStyle = [
    styles.base,
    { backgroundColor: bg, padding, borderRadius: BORDER_RADIUS.lg },
    shadow,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  const animateTo = (toValue) => {
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  return (
    <Pressable
      onPress={() => { triggerImpact("light"); onPress(); }}
      onPressIn={() => animateTo(0.98)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
});
