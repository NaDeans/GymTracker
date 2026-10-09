import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { Button } from "shared/components/Button";
import { useTheme } from "shared/hooks/useTheme";
import { triggerImpact } from "shared/utils/haptics";

const OPTIONS = [
  { source: "camera", icon: "camera", title: "Take Photo", subtitle: "Snap the label with your camera" },
  { source: "library", icon: "images", title: "Choose from Library", subtitle: "Use a photo you've already taken" },
];

// Picks where a nutrition label photo comes from. Replaces an Alert.alert,
// which Android renders as a bare system dialog.
export const ScanLabelSheet = ({ visible, onClose, onPick }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Scan Nutrition Label"
      scrollable={false}
      footer={<Button variant="secondary" onPress={onClose} fullWidth>Cancel</Button>}
    >
      <Text style={styles.scanSheetHint}>Get the whole panel in frame — we'll read the macros off it for you to review.</Text>
      {OPTIONS.map(({ source, icon, title, subtitle }) => (
        <Pressable
          key={source}
          onPress={() => { triggerImpact("light"); onPick(source); }}
          style={({ pressed }) => [styles.scanOption, pressed && styles.scanOptionPressed]}
          accessibilityRole="button"
          accessibilityLabel={title}
        >
          <View style={styles.scanOptionIcon}>
            <Ionicons name={icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.scanOptionText}>
            <Text style={styles.scanOptionTitle}>{title}</Text>
            <Text style={styles.scanOptionSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </ModalSheet>
  );
};
