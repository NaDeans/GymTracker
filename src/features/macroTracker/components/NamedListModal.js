import { useState } from "react";
import { View, Text } from "react-native";
import { createThemedStyles } from "../macroTrackerStyles";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

// Add / rename / delete a user-editable list of `{ id, name }` — the
// supplements and the daily checklist both use it.
export const NamedListModal = ({
  visible,
  setVisible,
  title,
  addTitle,
  emptyText,
  placeholder,
  items,
  onAdd,
  onRename,
  onRemove,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [newName, setNewName] = useState("");
  // Names are edited locally and committed on blur so a half-typed (or empty)
  // name never overwrites the stored one.
  const [drafts, setDrafts] = useState({});

  const commitRename = (item) => {
    const draft = drafts[item.id];
    setDrafts((prev) => { const u = { ...prev }; delete u[item.id]; return u; });
    if (draft === undefined) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.name) return;
    onRename(item.id, trimmed);
  };

  const handleAdd = () => {
    if (onAdd(newName)) setNewName("");
  };

  return (
    <ModalSheet visible={visible} onClose={() => setVisible(false)} title={title}>
      {items.length === 0 ? (
        <Text style={styles.supplementsEmpty}>{emptyText}</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.supplementEditRow}>
            <TextField
              size="sm"
              style={{ flex: 1 }}
              value={drafts[item.id] ?? item.name}
              onChangeText={(v) => setDrafts((prev) => ({ ...prev, [item.id]: v }))}
              onEndEditing={() => commitRename(item)}
            />
            <IconButton icon="trash" variant="danger" size="sm" onPress={() => onRemove(item.id)} />
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>{addTitle}</Text>

      <View style={styles.supplementAddRow}>
        <TextField
          size="sm"
          style={{ flex: 1 }}
          placeholder={placeholder}
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
