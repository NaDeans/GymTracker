import { useRef } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, BORDER_RADIUS, SHADOW } from "shared/constants/styles";
import { triggerImpact } from "shared/utils/haptics";

const SURFACES = {
  surface1: COLORS.surface1,
  surface2: COLORS.surface2,
  raised: COLORS.surfaceRaised,
};

const ELEVATIONS = { none: null, sm: SHADOW.sm, md: SHADOW.md, lg: SHADOW.lg };

export const Card = ({
  children,
  onPress,
  elevation = "sm",
  surface = "surface1",
  padding = SPACING.lg,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shadow = ELEVATIONS[elevation] || null;
  const bg = SURFACES[surface] || COLORS.surface1;

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
