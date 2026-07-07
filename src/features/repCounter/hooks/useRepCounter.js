import { useState, useEffect, useRef } from "react";
import { Alert, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { todayString, dmyToIso } from "shared/utils/dateUtils";

const DEFAULT_GROUPS = ["Back", "Chest", "Arms", "Legs", "Other"];
const STORAGE_KEY = "REP_COUNTER_DATA";
const SESSION_GAP_HOURS = 5;
const SESSION_GAP_MS = SESSION_GAP_HOURS * 60 * 60 * 1000;

// Legacy entries have no updatedAt, so they never look "open" — safe default.
const isSessionOpen = (entry) =>
  !!entry?.updatedAt && Date.now() - new Date(entry.updatedAt).getTime() < SESSION_GAP_MS;

export const useRepCounter = () => {
  const [data, setData] = useState({});
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showFullLog, setShowFullLog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newExerciseName, setNewExerciseName] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [titleDraft, setTitleDraft] = useState(null);
  const [dayNotes, setDayNotes] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [logsState, setLogsState] = useState([]);

  useEffect(() => {
    if (selectedGroup && selectedExercise) {
      setLogsState(data[selectedGroup]?.[selectedExercise] || []);
    }
  }, [selectedGroup, selectedExercise, data]);

  // Guards the save effect: without it, the first render saves the empty
  // initial state over the stored data before the load below resolves.
  const hasLoaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed.data || {});
        setGroups(parsed.groups || DEFAULT_GROUPS);
      } else {
        setGroups(DEFAULT_GROUPS);
      }
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ data, groups }));
  }, [data, groups]);

  useEffect(() => {
    setTitleDraft(null);
  }, [selectedGroup, selectedExercise]);

  useEffect(() => {
    AsyncStorage.getItem("DAY_NOTES")
      .then((stored) => { if (stored) setDayNotes(JSON.parse(stored)); })
      .catch((err) => console.log(err));
  }, []);

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (groups.includes(name)) {
      Alert.alert("Duplicate Category", `A category named "${name}" already exists.`);
      return;
    }
    setGroups((prev) => [...prev, name]);
    setNewGroupName("");
    setShowGroupModal(false);
  };

  const deleteGroup = (group) => {
    Alert.alert("Delete Category?", `Are you sure you want to delete "${group}" and all its exercises?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          setGroups((prev) => prev.filter((g) => g !== group));
          setData((prev) => { const d = { ...prev }; delete d[group]; return d; });
          setSelectedGroup(null);
        },
      },
    ]);
  };

  const renameGroup = (oldName, newName) => {
    setGroups((prev) => prev.map((g) => (g === oldName ? newName : g)));
    setData((prev) => {
      const updated = { ...prev, [newName]: prev[oldName] || {} };
      delete updated[oldName];
      return updated;
    });
    setSelectedGroup(newName);
    setTitleDraft(null);
  };

  const addExercise = () => {
    const name = newExerciseName.trim();
    if (!name) return;
    if (Object.keys(data[selectedGroup] || {}).includes(name)) {
      Alert.alert("Duplicate Exercise", `An exercise named "${name}" already exists in "${selectedGroup}".`);
      return;
    }
    setData((prev) => ({ ...prev, [selectedGroup]: { ...(prev[selectedGroup] || {}), [name]: [] } }));
    setNewExerciseName("");
    setShowExerciseModal(false);
  };

  const deleteExercise = (exercise) => {
    Alert.alert("Delete Exercise?", `Are you sure you want to delete "${exercise}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          setData((prev) => { const d = { ...prev }; delete d[selectedGroup][exercise]; return d; });
          setSelectedExercise(null);
        },
      },
    ]);
  };

  const renameExercise = (oldName, newName) => {
    setData((prev) => {
      const updated = { ...prev };
      updated[selectedGroup] = { ...updated[selectedGroup], [newName]: updated[selectedGroup][oldName] || [] };
      delete updated[selectedGroup][oldName];
      return updated;
    });
    setSelectedExercise(newName);
    setTitleDraft(null);
  };

  const logSet = () => {
    if (!reps || !weight) return;
    Keyboard.dismiss();
    const now = new Date();
    const nowIso = now.toISOString();

    setData((prev) => {
      const logs = prev[selectedGroup][selectedExercise] || [];

      if (isSessionOpen(logs[0])) {
        const updatedLogs = logs.map((day, i) =>
          i === 0
            ? { ...day, sets: [...day.sets, { reps: Number(reps), weight: Number(weight) }], updatedAt: nowIso }
            : day
        );
        return { ...prev, [selectedGroup]: { ...prev[selectedGroup], [selectedExercise]: updatedLogs } };
      }

      const today = dmyToIso(todayString());
      return {
        ...prev,
        [selectedGroup]: {
          ...prev[selectedGroup],
          [selectedExercise]: [
            { date: today, sets: [{ reps: Number(reps), weight: Number(weight) }], startedAt: nowIso, updatedAt: nowIso },
            ...logs,
          ],
        },
      };
    });

    setReps("");
    setWeight("");
  };

  const updateDayNotesByDate = (date, value) => {
    const newNotes = { ...dayNotes, [date]: value };
    setDayNotes(newNotes);
    AsyncStorage.setItem("DAY_NOTES", JSON.stringify(newNotes)).catch((err) => console.log(err));
  };

  const updateSet = (dayIndex, setIndex, key, value) => {
    setLogsState((prev) => {
      const newLogs = prev.map((day, dIndex) =>
        dIndex === dayIndex
          ? { ...day, sets: day.sets.map((set, sIndex) => (sIndex === setIndex ? { ...set, [key]: value } : set)) }
          : day
      );
      // Only persist confirmed values — never write temp input draft fields to storage
      if (key !== "repsInput" && key !== "weightInput") {
        const cleanLogs = newLogs.map((day) => ({
          ...day,
          sets: day.sets.map(({ repsInput: _r, weightInput: _w, ...s }) => s),
        }));
        setData((prevData) => ({
          ...prevData,
          [selectedGroup]: { ...prevData[selectedGroup], [selectedExercise]: cleanLogs },
        }));
      }
      return newLogs;
    });
  };

  const deleteSet = (dayIndex, setIndex) => {
    setData((prevData) => {
      const newData = { ...prevData };
      const exerciseLogs = [...newData[selectedGroup][selectedExercise]];
      const dayLogs = { ...exerciseLogs[dayIndex] };
      dayLogs.sets = dayLogs.sets.filter((_, sIndex) => sIndex !== setIndex);
      if (dayLogs.sets.length > 0) exerciseLogs[dayIndex] = dayLogs;
      else exerciseLogs.splice(dayIndex, 1);
      newData[selectedGroup][selectedExercise] = exerciseLogs;
      return newData;
    });
  };

  const exercises = Object.keys(data[selectedGroup] || {});

  const allLogs = {};
  Object.entries(data).forEach(([group, exs]) => {
    Object.entries(exs).forEach(([exercise, logs]) => {
      logs.forEach((day) => {
        if (!allLogs[day.date]) allLogs[day.date] = [];
        allLogs[day.date].push({ group, exercise, sets: day.sets });
      });
    });
  });
  const sortedDates = Object.keys(allLogs).sort((a, b) => new Date(b) - new Date(a));

  const previousSession = isSessionOpen(logsState[0]) ? logsState[1] : logsState[0];

  return {
    data, setData, groups, setGroups,
    selectedGroup, setSelectedGroup,
    selectedExercise, setSelectedExercise,
    showFullLog, setShowFullLog,
    newGroupName, setNewGroupName,
    newExerciseName, setNewExerciseName,
    reps, setReps, weight, setWeight,
    titleDraft, setTitleDraft,
    dayNotes, updateDayNotesByDate,
    showGroupModal, setShowGroupModal,
    showExerciseModal, setShowExerciseModal,
    logsState,
    previousSession,
    exercises,
    allLogs, sortedDates,
    addGroup, deleteGroup, renameGroup,
    addExercise, deleteExercise, renameExercise,
    logSet, updateSet, deleteSet,
  };
};
