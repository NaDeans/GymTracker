import { Alert, View, Text, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { isoToDmy } from "shared/utils/dateUtils";
import { styles } from "../repCounterStyles";

export function SetLogger({
  selectedGroup, selectedExercise, setSelectedExercise,
  data,
  logsState,
  reps, setReps, weight, setWeight,
  logSet, updateSet, deleteSet,
  titleDraft, setTitleDraft,
  deleteExercise, renameExercise,
}) {
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View />

      <Pressable onPress={() => setSelectedExercise(null)} style={styles.backButton}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>

      <View style={styles.titleRow}>
        {titleDraft === null ? (
          <>
            <Pressable style={{ flex: 1 }} onPress={() => setTitleDraft(selectedExercise)}>
              <Text style={styles.titleInput}>{selectedExercise}</Text>
            </Pressable>
            <Pressable style={styles.deleteTitleButton} onPress={() => deleteExercise(selectedExercise)}>
              <Text style={styles.buttonText}>Delete</Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput value={titleDraft} onChangeText={setTitleDraft} autoFocus style={[styles.titleInput, { flex: 1 }]} />
            <Pressable
              style={styles.saveTitleButton}
              onPress={() => {
                const trimmed = titleDraft.trim();
                if (!trimmed || trimmed === selectedExercise) { setTitleDraft(null); return; }
                const existing = Object.keys(data[selectedGroup] || {});
                if (existing.some((ex) => ex !== selectedExercise && ex === trimmed)) {
                  Alert.alert("Duplicate Exercise", `An exercise named "${trimmed}" already exists.`);
                  return;
                }
                renameExercise(selectedExercise, trimmed);
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

      <View style={styles.inputRow}>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput value={reps} onChangeText={setReps} keyboardType="number-pad" style={styles.bigInput} placeholder="0" placeholderTextColor="#888" />
        </View>
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Kg</Text>
          <TextInput value={weight} onChangeText={setWeight} keyboardType="number-pad" style={styles.bigInput} placeholder="0" placeholderTextColor="#888" />
        </View>
      </View>

      <Pressable style={styles.saveAdditionButton} onPress={logSet}>
        <Text style={styles.buttonText}>Add Set</Text>
      </Pressable>

      <Text style={styles.historySubtitle}>History</Text>

      <FlatList
        data={logsState}
        keyExtractor={(item) => item.date}
        renderItem={({ item, index: dayIndex }) => (
          <View style={styles.historyDayCard}>
            <Text style={styles.historyDateText}>{isoToDmy(item.date)}</Text>
            {item.sets.map((s, i) => (
              <View key={i} style={styles.setRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.setLabel}>Set {i + 1}:</Text>
                  <TextInput
                    style={styles.setInput}
                    keyboardType="number-pad"
                    value={s.repsInput ?? s.reps?.toString() ?? ""}
                    onChangeText={(v) => updateSet(dayIndex, i, "repsInput", v)}
                    onEndEditing={() => {
                      updateSet(dayIndex, i, "reps", Number(s.repsInput) || 0);
                      updateSet(dayIndex, i, "repsInput", undefined);
                    }}
                  />
                  <Text style={styles.setText}>reps of</Text>
                  <TextInput
                    style={styles.setInput}
                    keyboardType="number-pad"
                    value={s.weightInput ?? s.weight?.toString() ?? ""}
                    onChangeText={(v) => updateSet(dayIndex, i, "weightInput", v)}
                    onEndEditing={() => {
                      updateSet(dayIndex, i, "weight", Number(s.weightInput) || 0);
                      updateSet(dayIndex, i, "weightInput", undefined);
                    }}
                  />
                  <Text style={styles.setText}>kg</Text>
                </View>
                <Pressable style={styles.deleteSetBtn} onPress={() => deleteSet(dayIndex, i)}>
                  <Text style={styles.buttonText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}
