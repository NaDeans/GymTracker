import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const triggerImpact = (style = "light") => {
  if (Platform.OS === "web") return;
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };
  try {
    Haptics.impactAsync(map[style] || Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

export const triggerSelection = () => {
  if (Platform.OS === "web") return;
  try {
    Haptics.selectionAsync();
  } catch {}
};
