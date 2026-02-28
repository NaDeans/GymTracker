//---------- IMPORT COMPONENTS ----------//
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


//---------- CONSTANTS ----------//
const DEFAULT_GROUPS = ["Back", "Chest", "Arms", "Legs", "Other"];
const STORAGE_KEY = "REP_COUNTER_DATA";


//---------- DATE HELPERS ----------//

// Returns local date in YYYY-MM-DD for storage
export const getLocalYYYYMMDD = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Returns date in DD/MM/YY for display
export const formatDateForDisplay = (isoDate) => {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
};



//---------- REP COUNTER SCREEN ----------//
export default function RepCounter() {

  //---------- STATE ----------//

  // Core data
  const [data, setData] = useState({});
  const [groups, setGroups] = useState([]);

  // Navigation state
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showFullLog, setShowFullLog] = useState(false);

  // Input state
  const [newGroupName, setNewGroupName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");

  // Editing state
  const [titleDraft, setTitleDraft] = useState(null);
  const [dayNotes, setDayNotes] = useState({});

  // Modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Logs state
  const [logsState, setLogsState] = useState([]);



  //---------- EFFECTS ----------//

  // Sync selected logs when selection changes
  useEffect(() => {
    if (selectedGroup && selectedExercise) {
      setLogsState(data[selectedGroup]?.[selectedExercise] || []);
    }
  }, [selectedGroup, selectedExercise, data]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Persist data changes
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, groups })
    );
  }, [data, groups]);

  // Reset title draft when navigating
  useEffect(() => {
    setTitleDraft(null);
  }, [selectedGroup, selectedExercise]);

  // Load day notes
  useEffect(() => {
    AsyncStorage.getItem("DAY_NOTES")
      .then((stored) => {
        if (stored) setDayNotes(JSON.parse(stored));
      })
      .catch((err) => console.log(err));
  }, []);



  //---------- STORAGE FUNCTIONS ----------//

  //load set data and stored groups and exercises
  const loadData = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);
      setData(parsed.data || {});
      setGroups(parsed.groups || DEFAULT_GROUPS);
    } else {
      setGroups(DEFAULT_GROUPS);
    }
  };



  //---------- GROUP FUNCTIONS ----------//

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;

    if (groups.includes(name)) {
      Alert.alert(
        "Duplicate Category",
        `A category named "${name}" already exists. Please choose a different name.`
      );
      return;
    }

    setGroups((prev) => [...prev, name]);
    setNewGroupName("");
    setShowGroupModal(false);
  };

  const deleteGroup = (group) => {
    Alert.alert(
      "Delete Category?",
      `Are you sure you want to delete "${group}" and all its exercises?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setGroups((prev) => prev.filter((g) => g !== group));

            const newData = { ...data };
            delete newData[group];

            setData(newData);
            setSelectedGroup(null);
          },
        },
      ]
    );
  };



  //---------- EXERCISE FUNCTIONS ----------//

  const addExercise = () => {
    const name = newExerciseName.trim();
    if (!name) return;

    const existingExercises = Object.keys(data[selectedGroup] || {});

    if (existingExercises.includes(name)) {
      Alert.alert(
        "Duplicate Exercise",
        `An exercise named "${name}" already exists in "${selectedGroup}". Please choose a different name.`
      );
      return;
    }

    setData((prev) => ({
      ...prev,
      [selectedGroup]: {
        ...(prev[selectedGroup] || {}),
        [name]: [],
      },
    }));

    setNewExerciseName("");
    setShowExerciseModal(false);
  };

  const deleteExercise = (exercise) => {
    Alert.alert(
      "Delete Exercise?",
      `Are you sure you want to delete "${exercise}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newData = { ...data };
            delete newData[selectedGroup][exercise];

            setData(newData);
            setSelectedExercise(null);
          },
        },
      ]
    );
  };



  //---------- LOG FUNCTIONS ----------//

  //create the daily log with set information
  const logSet = () => {
    if (!reps || !weight) return;

    const today = getLocalYYYYMMDD();

    setData((prev) => {
      const logs = prev[selectedGroup][selectedExercise] || [];
      const existingDay = logs.find((l) => l.date === today);

      // If log for today already exists → append set
      if (existingDay) {
        const updatedSets = [
          ...existingDay.sets,
          { reps: Number(reps), weight: Number(weight) },
        ];

        const updatedDay = {
          ...existingDay,
          sets: updatedSets,
        };

        const updatedLogs = logs.map((day) =>
          day.date === today ? updatedDay : day
        );

        return {
          ...prev,
          [selectedGroup]: {
            ...prev[selectedGroup],
            [selectedExercise]: updatedLogs,
          },
        };
      }

      // Otherwise create new day entry
      return {
        ...prev,
        [selectedGroup]: {
          ...prev[selectedGroup],
          [selectedExercise]: [
            {
              date: today,
              sets: [
                { reps: Number(reps), weight: Number(weight) },
              ],
              notes: "",
            },
            ...logs,
          ],
        },
      };
    });

    setReps("");
    setWeight("");
  };

  //update the nodes for each day
  const updateDayNotesByDate = (date, value) => {
    const newNotes = { ...dayNotes, [date]: value };

    setDayNotes(newNotes);

    AsyncStorage.setItem(
      "DAY_NOTES",
      JSON.stringify(newNotes)
    ).catch((err) => console.log(err));
  };

  //update set data in the daily log
  const updateSet = (dayIndex, setIndex, key, value) => {
    setLogsState((prev) => {
      const newLogs = prev.map((day, dIndex) =>
        dIndex === dayIndex
          ? {
              ...day,
              sets: day.sets.map((set, sIndex) =>
                sIndex === setIndex
                  ? { ...set, [key]: value }
                  : set
              ),
            }
          : day
      );

      setData((prevData) => ({
        ...prevData,
        [selectedGroup]: {
          ...prevData[selectedGroup],
          [selectedExercise]: newLogs,
        },
      }));

      return newLogs;
    });
  };



  //---------- DERIVED DATA ----------//

  const exercises = Object.keys(data[selectedGroup] || {});

  const allLogs = {};

  Object.entries(data).forEach(([group, exercises]) => {
    Object.entries(exercises).forEach(([exercise, logs]) => {
      logs.forEach((day) => {
        if (!allLogs[day.date]) {
          allLogs[day.date] = [];
        }

        allLogs[day.date].push({
          group,
          exercise,
          sets: day.sets,
          notes: day.notes || "",
        });
      });
    });
  });

  const sortedDates = Object.keys(allLogs).sort(
    (a, b) => new Date(b) - new Date(a)
  );


  //---------- USER INTERFACE ----------//
  ////////////////////////////////////////

  //---------- FULL LOG MODAL ----------//
  if (showFullLog) {
    return (
      <View style={styles.container}>
        <View />
        <Pressable onPress={() => setShowFullLog(false)} style={styles.backButton}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Text style={styles.pageTitle}>Full Workout Log</Text>

        <FlatList
          data={sortedDates}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.historyDayCard}>
              <Text style={styles.historyDateText}>{formatDateForDisplay(item)}</Text>
              <TextInput
                value={dayNotes[item] || ""}
                onChangeText={(text) => updateDayNotesByDate(item, text)}
                placeholder="Write notes about this workout..."
                placeholderTextColor="#888"
                style={styles.notesInput}
                multiline
              />
              {allLogs[item].map((entry, index) => (
                <View key={index} style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: "600" }}>{entry.group} — {entry.exercise}</Text>
                  {entry.sets.map((set, i) => (
                    <Text key={i} style={styles.historyText}>
                      Set {i + 1}: {set.reps} reps of {set.weight} kg
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
        />
      </View>
    );
  }

  //---------- PAGE FOR SELECTING THE GROUP OR DAILY LOG ----------//
  if (!selectedGroup) {
    return (
      <View style={styles.container}>
        <View />
        <Text style={styles.pageTitle}>Categories</Text>

        <Pressable style={styles.viewLogButton} onPress={() => setShowFullLog(true)}>
          <Text style={styles.viewLogText}>View Full Log</Text>
        </Pressable>

        <FlatList
          data={groups}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => setSelectedGroup(item)}>
              <Text style={styles.cardText}>{item}</Text>
            </Pressable>
          )}
          ListFooterComponent={
            <Pressable style={styles.addButton} onPress={() => setShowGroupModal(true)}>
              <Text style={styles.addText}>＋ Add Category</Text>
            </Pressable>
          }
        />

        <Modal visible={showGroupModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowGroupModal(false)}>
            <Pressable style={styles.modal} onPress={() => {}}>
              <TextInput
                placeholder="Category name"
                placeholderTextColor="#888"
                value={newGroupName}
                onChangeText={setNewGroupName}
                style={styles.input}
              />
              <Pressable style={styles.saveAdditionButton} onPress={addGroup}>
                <Text style={styles.buttonText}>Save</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  //---------- PAGE FOR SELECTING EXERCISES WITHIN EACH GROUP ----------//
  if (!selectedExercise) {
    return (
      <View style={styles.container}>
        <View/>
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
                  const oldName = selectedGroup;
                  if (!trimmed || trimmed === oldName) { setTitleDraft(null); return; }
                  const duplicateExists = groups.some(g => g !== oldName && g === trimmed);
                  if (duplicateExists) { Alert.alert("Duplicate Category", `A category named "${trimmed}" already exists.`); return; }

                  setGroups(prev => prev.map(g => (g === oldName ? trimmed : g)));
                  setData(prev => {
                    const updated = { ...prev };
                    updated[trimmed] = updated[oldName] || {};
                    delete updated[oldName];
                    return updated;
                  });

                  setSelectedGroup(trimmed);
                  setTitleDraft(null);
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
                    {firstSet.reps} reps of {firstSet.weight} kg        ({formatDateForDisplay(mostRecentDay.date)})
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

  //---------- EXERCISE PAGE VIEW / SET LOGS FOR EXERCISES ----------//
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View/>

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
            <TextInput
              value={titleDraft}
              onChangeText={setTitleDraft}
              autoFocus
              style={[styles.titleInput, { flex: 1 }]}
            />
            <Pressable
              style={styles.saveTitleButton}
              onPress={() => {
                const trimmed = titleDraft.trim();
                const oldName = selectedExercise;
                if (!trimmed || trimmed === oldName) { setTitleDraft(null); return; }

                const existingExercises = Object.keys(data[selectedGroup] || {});
                const duplicateExists = existingExercises.some(ex => ex !== oldName && ex === trimmed);
                if (duplicateExists) {
                  Alert.alert("Duplicate Exercise", `An exercise named "${trimmed}" already exists in "${selectedGroup}".`);
                  return;
                }

                setData(prev => {
                  const updated = { ...prev };
                  updated[selectedGroup] = {
                    ...updated[selectedGroup],
                    [trimmed]: updated[selectedGroup][oldName] || [],
                  };
                  delete updated[selectedGroup][oldName];
                  return updated;
                });

                setSelectedExercise(trimmed);
                setTitleDraft(null);
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
          <TextInput
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            style={styles.bigInput}
            placeholder="0"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Kg</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="number-pad"
            style={styles.bigInput}
            placeholder="0"
            placeholderTextColor="#888"
          />
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
            <Text style={styles.historyDateText}>{formatDateForDisplay(item.date)}</Text>

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
                      const val = Number(s.repsInput) || 0;
                      updateSet(dayIndex, i, "reps", val);
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
                      const val = Number(s.weightInput) || 0;
                      updateSet(dayIndex, i, "weight", val);
                      updateSet(dayIndex, i, "weightInput", undefined);
                    }}
                  />

                  <Text style={styles.setText}>kg</Text>
                </View>

                <Pressable
                  style={styles.deleteSetBtn}
                  onPress={() => {
                    setData(prevData => {
                      const newData = { ...prevData };
                      const exerciseLogs = [...newData[selectedGroup][selectedExercise]];
                      const dayLogs = { ...exerciseLogs[dayIndex] };
                      dayLogs.sets = dayLogs.sets.filter((_, sIndex) => sIndex !== i);

                      if (dayLogs.sets.length > 0) exerciseLogs[dayIndex] = dayLogs;
                      else exerciseLogs.splice(dayIndex, 1);

                      newData[selectedGroup][selectedExercise] = exerciseLogs;
                      return newData;
                    });
                  }}
                >
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

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({

  //==================== UNIVERSAL LAYOUT ====================//
  container: { flexGrow: 1, paddingTop: 40, paddingHorizontal: 20, paddingBottom: 60, backgroundColor: "#fdfdfd" },
  pageTitle: { fontSize: 26, fontWeight: "700", paddingBottom: 20 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  //==================== NAVIGATION BUTTONS ====================//
  backButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#007AFF", alignItems: "center", marginBottom: 12, alignSelf: "flex-start" },

  //==================== CARD COMPONENTS ====================//
  card: { padding: 14, borderRadius: 14, backgroundColor: "#f5f5f5", marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardText: { fontSize: 16, fontWeight: "500" },

  //==================== ADD BUTTONS ====================//
  addButton: { marginTop: 6, marginBottom: 12 },
  addText: { fontSize: 16, color: "#007AFF", fontWeight: "600" },

  //==================== MODALS (ADD GROUP / EXERCISE) ====================//
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modal: { backgroundColor: "#fff", padding: 18, borderRadius: 16, width: "80%", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 12, marginBottom: 12, fontSize: 15 },
  saveAdditionButton: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#007AFF", alignItems: "center" },

  //==================== LOG / HISTORY MODAL ====================//
  historyDayCard: { marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: "#f5f5f5", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  historyDateText: { fontWeight: "600", marginBottom: 4 },
  historyText: { fontSize: 13, color: "#555" },
  notesInput: { color: "blue", fontSize: 16, marginVertical: 4 },

  //==================== CATEGORY SCREEN ====================//
  viewLogButton: { marginBottom: 20, padding: 10, borderRadius: 14, backgroundColor: "#f5f5f5", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  viewLogText: { fontSize: 16, fontWeight: "600", color: "#007AFF" },

  //==================== EDITABLE TITLES ====================//
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  titleInput: { fontSize: 20, fontWeight: "700", flex: 1, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: "#f5f5f5", borderRadius: 12, color: "#222" },
  deleteTitleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#ff3b30", alignItems: "center", marginLeft: 12 },
  cancelTitleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#ff3b30", alignItems: "center", marginLeft: 12 },
  saveTitleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "#007AFF", alignItems: "center", marginLeft: 12 },

  //==================== EXERCISE SCREEN ====================//
  exercisePreviewText: {fontSize: 17, color: "#222"},
  historySubtitle: { fontSize: 18, fontWeight: "600", marginTop: 20 },

  //==================== SET ROW COMPONENT ====================//
  setRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  setLabel: { fontWeight: "600", fontSize: 16 },
  setInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 2, fontSize: 16, minWidth: 50, textAlign: "center", backgroundColor: "#fff" },
  setText: { fontSize: 17, color: "#222" },
  deleteSetBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#ff3b30", alignItems: "center", justifyContent: "center", marginLeft: "auto" },

  //==================== EXERCISE INPUT SECTION ====================//
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  inputCard: { width: "48%", padding: 14, borderRadius: 14, backgroundColor: "#f5f5f5", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  inputLabel: { fontSize: 14, marginBottom: 4, fontWeight: "500" },
  bigInput: { fontSize: 24, fontWeight: "700", textAlign: "left", color: "#222" },

});