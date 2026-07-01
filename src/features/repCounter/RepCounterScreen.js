import { useRepCounter } from "./hooks/useRepCounter";
import { CategoryList } from "./components/CategoryList";
import { ExerciseList } from "./components/ExerciseList";
import { SetLogger } from "./components/SetLogger";
import { FullLog } from "./components/FullLog";

export default function RepCounterScreen() {
  const rc = useRepCounter();

  if (rc.showFullLog) {
    return (
      <FullLog
        setShowFullLog={rc.setShowFullLog}
        sortedDates={rc.sortedDates}
        allLogs={rc.allLogs}
        dayNotes={rc.dayNotes}
        updateDayNotesByDate={rc.updateDayNotesByDate}
      />
    );
  }

  if (!rc.selectedGroup) {
    return (
      <CategoryList
        groups={rc.groups}
        newGroupName={rc.newGroupName}
        setNewGroupName={rc.setNewGroupName}
        showGroupModal={rc.showGroupModal}
        setShowGroupModal={rc.setShowGroupModal}
        setShowFullLog={rc.setShowFullLog}
        setSelectedGroup={rc.setSelectedGroup}
        addGroup={rc.addGroup}
        dayNotes={rc.dayNotes}
        updateDayNotesByDate={rc.updateDayNotesByDate}
      />
    );
  }

  if (!rc.selectedExercise) {
    return (
      <ExerciseList
        selectedGroup={rc.selectedGroup}
        setSelectedGroup={rc.setSelectedGroup}
        exercises={rc.exercises}
        data={rc.data}
        titleDraft={rc.titleDraft}
        setTitleDraft={rc.setTitleDraft}
        groups={rc.groups}
        deleteGroup={rc.deleteGroup}
        renameGroup={rc.renameGroup}
        addExercise={rc.addExercise}
        deleteExercise={rc.deleteExercise}
        showExerciseModal={rc.showExerciseModal}
        setShowExerciseModal={rc.setShowExerciseModal}
        newExerciseName={rc.newExerciseName}
        setNewExerciseName={rc.setNewExerciseName}
        setSelectedExercise={rc.setSelectedExercise}
      />
    );
  }

  return (
    <SetLogger
      selectedGroup={rc.selectedGroup}
      selectedExercise={rc.selectedExercise}
      setSelectedExercise={rc.setSelectedExercise}
      data={rc.data}
      logsState={rc.logsState}
      previousSession={rc.previousSession}
      reps={rc.reps}
      setReps={rc.setReps}
      weight={rc.weight}
      setWeight={rc.setWeight}
      logSet={rc.logSet}
      updateSet={rc.updateSet}
      deleteSet={rc.deleteSet}
      titleDraft={rc.titleDraft}
      setTitleDraft={rc.setTitleDraft}
      deleteExercise={rc.deleteExercise}
      renameExercise={rc.renameExercise}
    />
  );
}
