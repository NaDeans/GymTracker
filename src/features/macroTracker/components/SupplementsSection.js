import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";
import { triggerImpact } from "shared/utils/haptics";

// Tick-list of the user's supplements for the selected day. The list itself is
// edited in SupplementsModal — this only records what was taken.
export const SupplementsSection = ({ supplements, takenIds, toggleSupplement, onManage }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const takenCount = supplements.filter((s) => takenIds.includes(s.id)).length;

  return (
    <Card padding={SPACING.md} style={styles.supplementsCard}>
      <View style={styles.supplementsHeaderRow}>
        <View>
          <Text style={styles.supplementsTitle}>Supplements</Text>
          {supplements.length > 0 && (
            <Text style={styles.supplementsCount}>{takenCount} of {supplements.length} taken</Text>
          )}
        </View>
        <IconButton icon="settings-outline" variant="ghost" size="sm" onPress={onManage} />
      </View>

      {supplements.length === 0 ? (
        <>
          <Text style={styles.supplementsEmpty}>
            No supplements yet. Add the ones you take (e.g. Vitamin D, Fish Oil) and tick them off each day.
          </Text>
          <Button variant="secondary" size="sm" icon="add" fullWidth onPress={onManage}>Add Supplements</Button>
        </>
      ) : (
        supplements.map((supplement, idx) => {
          const taken = takenIds.includes(supplement.id);
          return (
            <Pressable
              key={supplement.id}
              style={[styles.supplementRow, idx > 0 && styles.supplementRowDivider]}
              onPress={() => { triggerImpact("light"); toggleSupplement(supplement.id); }}
              hitSlop={4}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: taken }}
              accessibilityLabel={supplement.name}
            >
              <Ionicons
                name={taken ? "checkbox" : "square-outline"}
                size={24}
                color={taken ? colors.success : colors.textMuted}
              />
              <Text style={[styles.supplementName, taken && styles.supplementNameTaken]}>{supplement.name}</Text>
            </Pressable>
          );
        })
      )}
    </Card>
  );
};
