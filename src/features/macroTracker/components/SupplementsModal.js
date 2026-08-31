import { useState } from "react";
import { View, Text } from "react-native";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

// Add / rename / delete the supplements that appear on the daily tick-list.
export const SupplementsModal = ({
  visible,
  setVisible,
  supplements,
  addSupplement,
  renameSupplement,
  removeSupplement,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [newName, setNewName] = useState("");
  // Names are edited locally and committed on blur so a half-typed (or empty)
  // name never overwrites the stored one.
  const [drafts, setDrafts] = useState({});

  const commitRename = (supplement) => {
    const draft = drafts[supplement.id];
    setDrafts((prev) => { const u = { ...prev }; delete u[supplement.id]; return u; });
    if (draft === undefined) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === supplement.name) return;
    renameSupplement(supplement.id, trimmed);
  };

  const handleAdd = () => {
    if (addSupplement(newName)) setNewName("");
  };

  return (
    <ModalSheet visible={visible} onClose={() => setVisible(false)} title="Supplements">
      {supplements.length === 0 ? (
        <Text style={styles.supplementsEmpty}>
          Add the supplements you take — they'll show up as a daily tick-list and in your exports.
        </Text>
      ) : (
        supplements.map((supplement) => (
          <View key={supplement.id} style={styles.supplementEditRow}>
            <TextField
              size="sm"
              style={{ flex: 1 }}
              value={drafts[supplement.id] ?? supplement.name}
              onChangeText={(v) => setDrafts((prev) => ({ ...prev, [supplement.id]: v }))}
              onEndEditing={() => commitRename(supplement)}
            />
            <IconButton icon="trash" variant="danger" size="sm" onPress={() => removeSupplement(supplement.id)} />
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Add Supplement</Text>

      <View style={styles.supplementAddRow}>
        <TextField
          size="sm"
          style={{ flex: 1 }}
          placeholder="e.g. Vitamin D"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
        />
        <Button variant="primary" size="sm" icon="add" onPress={handleAdd}>Add</Button>
      </View>

      <View style={{ marginTop: SPACING.lg }}>
        <Button variant="secondary" fullWidth onPress={() => setVisible(false)}>Done</Button>
      </View>
    </ModalSheet>
  );
};
