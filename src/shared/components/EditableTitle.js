import { View, Text, Pressable, StyleSheet } from "react-native";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { SPACING, FONT_SIZE, FONT_WEIGHT } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

export const EditableTitle = ({ value, draft, setDraft, onSave, onDelete }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);

  if (draft === null) {
    return (
      <View style={styles.row}>
        <Pressable style={styles.titleTouchable} onPress={() => setDraft(value)}>
          <Text style={styles.titleText} numberOfLines={1}>{value}</Text>
        </Pressable>
        <Button variant="danger" size="sm" onPress={onDelete}>Delete</Button>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TextField value={draft} onChangeText={setDraft} autoFocus size="sm" style={styles.field} />
      <Button variant="primary" size="sm" onPress={() => onSave(draft.trim())} style={styles.actionSpacing}>Save</Button>
      <Button variant="secondary" size="sm" onPress={() => setDraft(null)}>Cancel</Button>
    </View>
  );
};

const createThemedStyles = (colors) => StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: SPACING.sm, marginBottom: SPACING.lg },
  titleTouchable: { flex: 1 },
  titleText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: colors.textDark },
  field: { flex: 1 },
  actionSpacing: {},
});
