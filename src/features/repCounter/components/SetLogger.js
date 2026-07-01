import { Alert, View, Text, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { isoToDmy } from "shared/utils/dateUtils";
import { styles } from "../repCounterStyles";
import { Card } from "shared/components/Card";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Stepper } from "shared/components/Stepper";
import { EditableTitle } from "shared/components/EditableTitle";

export function SetLogger({
  selectedGroup, selectedExercise, setSelectedExercise,
  data,
  logsState,
  reps, setReps, weight, setWeight,
  logSet, updateSet, deleteSet,
  titleDraft, setTitleDraft,
  deleteExercise, renameExercise,
}) {
  const canAddSet = reps.trim().length > 0 && weight.trim().length > 0;

  const handleSave = (trimmed) => {
    if (!trimmed || trimmed === selectedExercise) { setTitleDraft(null); return; }
    const existing = Object.keys(data[selectedGroup] || {});
    if (existing.some((ex) => ex !== selectedExercise && ex === trimmed)) {
      Alert.alert("Duplicate Exercise", `An exercise named "${trimmed}" already exists.`);
      return;
    }
    renameExercise(selectedExercise, trimmed);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <IconButton icon="chevron-back" variant="secondary" onPress={() => setSelectedExercise(null)} style={styles.backButtonSpacing} />

      <EditableTitle
        value={selectedExercise}
        draft={titleDraft}
        setDraft={setTitleDraft}
        onSave={handleSave}
        onDelete={() => deleteExercise(selectedExercise)}
      />

      <View style={styles.heroStepperRow}>
        <Stepper
          label="Reps"
          value={reps}
          onStep={setReps}
          onDraftChange={setReps}
          onCommit={setReps}
          step={1}
          min={0}
        />
        <Stepper
          label="Kg"
          value={weight}
          onStep={setWeight}
          onDraftChange={setWeight}
          onCommit={setWeight}
          step={2.5}
          min={0}
          decimal
        />
      </View>

      <Button variant="primary" fullWidth disabled={!canAddSet} onPress={logSet}>Add Set</Button>

      <Text style={styles.historySubtitle}>History</Text>

      <FlatList
        data={logsState}
        keyExtractor={(item) => item.date}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index: dayIndex }) => (
          <Card style={styles.dayCardSpacing}>
            <Text style={styles.historyDateText}>{isoToDmy(item.date)}</Text>
            {item.sets.map((s, i) => (
              <View key={i} style={styles.setRow}>
                <View style={styles.setRowFields}>
                  <Stepper
                    size="compact"
                    value={s.repsInput ?? s.reps?.toString() ?? ""}
                    onStep={(v) => updateSet(dayIndex, i, "reps", Number(v) || 0)}
                    onDraftChange={(v) => updateSet(dayIndex, i, "repsInput", v)}
                    onCommit={(v) => {
                      updateSet(dayIndex, i, "reps", Number(v) || 0);
                      updateSet(dayIndex, i, "repsInput", undefined);
                    }}
                    step={1}
                    min={0}
                  />
                  <Text style={styles.setText}>reps of</Text>
                  <Stepper
                    size="compact"
                    value={s.weightInput ?? s.weight?.toString() ?? ""}
                    onStep={(v) => updateSet(dayIndex, i, "weight", Number(v) || 0)}
                    onDraftChange={(v) => updateSet(dayIndex, i, "weightInput", v)}
                    onCommit={(v) => {
                      updateSet(dayIndex, i, "weight", Number(v) || 0);
                      updateSet(dayIndex, i, "weightInput", undefined);
                    }}
                    step={2.5}
                    min={0}
                    decimal
                  />
                  <Text style={styles.setText}>kg</Text>
                </View>
                <IconButton icon="trash" variant="danger" size="sm" hapticStyle="medium" onPress={() => deleteSet(dayIndex, i)} />
              </View>
            ))}
          </Card>
        )}
      />
    </KeyboardAvoidingView>
  );
}
