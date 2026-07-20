import { useRef } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { todayString, dmyToIso } from "shared/utils/dateUtils";
import { createThemedStyles } from "../repCounterStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { useTheme } from "shared/hooks/useTheme";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";

export function CategoryList({
  groups,
  newGroupName, setNewGroupName,
  showGroupModal, setShowGroupModal,
  setShowFullLog,
  setSelectedGroup,
  addGroup,
  dayNotes,
  updateDayNotesByDate,
}) {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const today = dmyToIso(todayString());
  const listRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.pageTitle}>Categories</Text>

      <Card onPress={() => setShowFullLog(true)} surface="raised" elevation="sm" style={styles.viewLogCard}>
        <View style={styles.viewLogRow}>
          <Text style={styles.viewLogText}>View Full Log</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      </Card>

      <KeyboardScrollProvider scrollRef={listRef}>
      <Card style={styles.todayNotesCard}>
        <Text style={styles.todayNotesLabel}>Today's Notes (shared across all exercises)</Text>
        <TextField
          value={dayNotes[today] || ""}
          onChangeText={(text) => updateDayNotesByDate(today, text)}
          placeholder="Good session, gym location, how you felt..."
          multiline
        />
      </Card>

      <FlatList
        ref={listRef}
        data={groups}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => (
          <Card onPress={() => setSelectedGroup(item)} style={styles.categoryCardSpacing}>
            <View style={styles.viewLogRow}>
              <Text style={styles.cardText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        )}
        ListFooterComponent={
          <Button variant="ghost" icon="add" onPress={() => setShowGroupModal(true)}>
            Add Category
          </Button>
        }
      />
      </KeyboardScrollProvider>
    </KeyboardAvoidingView>

      <ModalSheet
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        title="New Category"
        scrollable={false}
        footer={<Button variant="primary" fullWidth onPress={addGroup}>Save</Button>}
      >
        <TextField
          placeholder="Category name"
          value={newGroupName}
          onChangeText={setNewGroupName}
          autoFocus
        />
      </ModalSheet>
    </View>
  );
}
