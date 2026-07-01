import { Alert, View, Text, Pressable, FlatList, Modal, TextInput } from "react-native";
import { isoToDmy } from "shared/utils/dateUtils";
import { styles } from "../repCounterStyles";

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
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setSelectedGroup(null)} style={styles.backButton}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>

      <View style={styles.titleRow}>
        {titleDraft === null ? (
          <>
            <Pressable style={{ flex: 1 }} onPress={() => setTitleDraft(selectedGroup)}>
              <Text style={styles.titleInput}>{selectedGroup}</Text>
            </Pressable>
            <Pressable style={styles.deleteTitleButton} onPress={() => deleteGroup(selectedGroup)}>
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput value={titleDraft} onChangeText={setTitleDraft} autoFocus style={styles.titleInput} />
            <Pressable
              style={styles.saveTitleButton}
              onPress={() => {
                const trimmed = titleDraft.trim();
                if (!trimmed || trimmed === selectedGroup) { setTitleDraft(null); return; }
                if (groups.some((g) => g !== selectedGroup && g === trimmed)) {
                  Alert.alert("Duplicate Category", `A category named "${trimmed}" already exists.`);
                  return;
                }
                renameGroup(selectedGroup, trimmed);
              }}
            >
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
            <Pressable style={styles.cancelTitleButton} onPress={() => setTitleDraft(null)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const logs = data[selectedGroup]?.[item] || [];
          const mostRecentDay = logs[0];
          const firstSet = mostRecentDay?.sets?.[0];
          return (
            <Pressable style={styles.card} onPress={() => setSelectedExercise(item)}>
              <Text style={styles.cardText}>{item}</Text>
              {firstSet && (
                <Text style={styles.exercisePreviewText}>
                  {firstSet.reps} reps of {firstSet.weight} kg  ({isoToDmy(mostRecentDay.date)})
                </Text>
              )}
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Pressable style={styles.addButton} onPress={() => setShowExerciseModal(true)}>
            <Text style={styles.addText}>＋ Add Exercise</Text>
          </Pressable>
        }
      />

      <Modal visible={showExerciseModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowExerciseModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <TextInput
              placeholder="Exercise name"
              placeholderTextColor="#888"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              style={styles.input}
              autoFocus
            />
            <Pressable style={styles.saveAdditionButton} onPress={addExercise}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
