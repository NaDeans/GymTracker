import { Alert, View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { isoToDmy } from "shared/utils/dateUtils";
import { fmt } from "shared/utils/numberUtils";
import { createThemedStyles } from "../repCounterStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { EditableTitle } from "shared/components/EditableTitle";
import { ModalSheet } from "shared/components/ModalSheet";
import { TextField } from "shared/components/TextField";
import { useTheme } from "shared/hooks/useTheme";

export function ExerciseList({
  selectedGroup, setSelectedGroup,
  exercises, data,
  titleDraft, setTitleDraft,
  groups,
  deleteGroup, renameGroup,
  addExercise, deleteExercise,
  showExerciseModal, setShowExerciseModal,
  newExerciseName, setNewExerciseName,
  setSelectedExercise,
}) {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const handleSave = (trimmed) => {
    if (!trimmed || trimmed === selectedGroup) { setTitleDraft(null); return; }
    if (groups.some((g) => g !== selectedGroup && g === trimmed)) {
      Alert.alert("Duplicate Category", `A category named "${trimmed}" already exists.`);
      return;
    }
    renameGroup(selectedGroup, trimmed);
  };

  return (
    <View style={styles.container}>
      <IconButton icon="chevron-back" variant="secondary" onPress={() => setSelectedGroup(null)} style={styles.backButtonSpacing} />

      <EditableTitle
        value={selectedGroup}
        draft={titleDraft}
        setDraft={setTitleDraft}
        onSave={handleSave}
        onDelete={() => deleteGroup(selectedGroup)}
      />

      <FlatList
        data={exercises}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const logs = data[selectedGroup]?.[item] || [];
          const mostRecentDay = logs[0];
          const firstSet = mostRecentDay?.sets?.[0];
          return (
            <Card onPress={() => setSelectedExercise(item)} style={styles.categoryCardSpacing}>
              <View style={styles.viewLogRow}>
                <View>
                  <Text style={styles.cardText}>{item}</Text>
                  {firstSet && (
                    <Text style={styles.exercisePreviewText}>
                      {firstSet.reps} reps of {fmt(firstSet.weight)} kg  ({isoToDmy(mostRecentDay.date)})
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          );
        }}
        ListFooterComponent={
          <Button variant="ghost" icon="add" onPress={() => setShowExerciseModal(true)}>
            Add Exercise
          </Button>
        }
      />

      <ModalSheet
        visible={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title="New Exercise"
        scrollable={false}
        footer={<Button variant="primary" fullWidth onPress={addExercise}>Save</Button>}
      >
        <TextField
          placeholder="Exercise name"
          value={newExerciseName}
          onChangeText={setNewExerciseName}
          autoFocus
        />
      </ModalSheet>
    </View>
  );
}
