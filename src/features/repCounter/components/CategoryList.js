import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { todayString, dmyToIso } from "shared/utils/dateUtils";
import { styles } from "../repCounterStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { COLORS } from "shared/constants/colors";

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
  const today = dmyToIso(todayString());

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Categories</Text>

      <Card onPress={() => setShowFullLog(true)} surface="raised" elevation="sm" style={styles.viewLogCard}>
        <View style={styles.viewLogRow}>
          <Text style={styles.viewLogText}>View Full Log</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </View>
      </Card>

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
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Card onPress={() => setSelectedGroup(item)} style={styles.categoryCardSpacing}>
            <View style={styles.viewLogRow}>
              <Text style={styles.cardText}>{item}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </View>
          </Card>
        )}
        ListFooterComponent={
          <Button variant="ghost" icon="add" onPress={() => setShowGroupModal(true)}>
            Add Category
          </Button>
        }
      />

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
