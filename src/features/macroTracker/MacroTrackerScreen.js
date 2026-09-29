import { useState } from "react";
import { View, ScrollView, Text, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useMacroScreen } from "./context/MacroTrackerContext";
import { useFoodEditor } from "./hooks/useFoodEditor";
import { captureAndCompressLabelImage } from "./utils/imageUtils";
import { createThemedStyles } from "./macroTrackerStyles";
import { Badge } from "shared/components/Badge";
import { useTheme } from "shared/hooks/useTheme";
import { formatFoodName } from "shared/utils/textUtils";

import DatePicker from "./components/DatePicker";
import { MacroTotals } from "./components/MacroTotals";
import { FoodSearchInput } from "./components/FoodSearchInput";
import { DailyControls } from "./components/DailyControls";
import { GoalModal } from "./components/GoalModal";
import { MealsModal } from "./components/MealsModal";
import { MealEditorModal } from "./components/MealEditorModal";
import { EditCachedFoodModal } from "./components/EditCachedFoodModal";
import { ManualEntryModal } from "./components/ManualEntryModal";
import { MealPrepModal } from "./components/MealPrepModal";
import { SupplementsSection } from "./components/SupplementsSection";
import { DayStatsSection } from "./components/DayStatsSection";
import { DayCompletionBar } from "./components/DayCompletionBar";
import { useReminderSync } from "shared/notifications/useReminderSync";
import { NamedListModal } from "./components/NamedListModal";

export default function MacroTrackerScreen() {
  const {
    refreshing, onRefresh,
    mealsVisible, setMealsVisible,
    goalModalVisible, setGoalModalVisible,
    input, setInput,
    loading, scanLoading,
    gptCache, setGptCache,
    suggestions, setSuggestions,
    setSuppressSuggestions,
    selectedDate, setSelectedDate,
    historyByDate,
    dailyLog,
    gramInputs, setGramInputs,
    totalMacros,
    currentStreak,
    selectedDayGoalMet,
    supplements,
    supplementLog,
    supplementsTakenToday,
    supplementsModalVisible, setSupplementsModalVisible,
    toggleSupplement, addSupplement, renameSupplement, removeSupplement,
    selectedDayStat, previousDayWeight, setDayWeight,
    checklist, checklistModalVisible, setChecklistModalVisible,
    toggleChecklistItem, addChecklistItem, renameChecklistItem, removeChecklistItem,
    dayCompletion, todayCompletion, dayStats,
    goals, setGoals,
    editingMacro, setEditingMacro,
    goalInput, setGoalInput,
    addItem, removeItem, clearItem, updateGrams, resetDay, exportDay, exportRange,
    submit, submitFromImage,
    meals,
    mealPreps, saveMealPrep, deleteMealPrep, logMealPrepServing, loggedMealPrep, lookupFood,
    mealEditorVisible, editingMeal,
    openMealEditor, closeMealEditor, saveMeal, deleteMeal, addMealToLog,
    updateMealEditorName, addMealEditorItem, removeMealEditorItem, updateMealEditorItem,
    selectionMode, selectedItemIds,
    startMealSelection, cancelMealSelection, toggleItemSelection, createMealFromSelection,
    manualEntryVisible, setManualEntryVisible,
    manualEntryName, setManualEntryName,
    manualEntryInitialValues, closeManualEntry,
    saveManualEntry,
    addEditedFoodToLog,
    updateLoggedFoodEntry,
  } = useMacroScreen();

  const [mealPrepVisible, setMealPrepVisible] = useState(false);
  const [openMealPrepId, setOpenMealPrepId] = useState(null);

  // The edit modal is screen-local so it can't also pop open on the Saved
  // Foods tab; the food data it edits still comes from the shared store.
  const editor = useFoodEditor();

  const openMealPreps = (prepId = null) => {
    setOpenMealPrepId(prepId);
    setMealPrepVisible(true);
  };

  // Re-lays the reminder window whenever today's completion changes, so the
  // progress bar baked into each scheduled notification stays current. Passing
  // live state means the sync can't race the save effect the same tick started.
  useReminderSync(
    `${todayCompletion.completedCount}/${todayCompletion.totalCount}`,
    () => ({ dailyLog, goals, supplements, supplementLog, dayStats, checklist })
  );

  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const headerStyles = createThemedScreenStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.mainTitle}>Macro Tracker</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {(currentStreak > 0 || selectedDayGoalMet) && (
          <View style={styles.badgeRow}>
            {currentStreak > 0 && (
              <Badge icon="flame" label={`${currentStreak} day streak`} variant="primary" />
            )}
            {selectedDayGoalMet && (
              <Badge icon="checkmark-circle" label="Goal met" variant="success" />
            )}
          </View>
        )}

        <DatePicker
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          dailyLog={dailyLog}
          goals={goals}
        />

        <DayCompletionBar key={selectedDate} completion={dayCompletion} />

        <MacroTotals
          totalMacros={totalMacros}
          goals={goals}
          setEditingMacro={setEditingMacro}
          setGoalInput={setGoalInput}
          setGoalModalVisible={setGoalModalVisible}
          dailyLog={dailyLog}
          selectedDate={selectedDate}
        />

        <FoodSearchInput
          input={input}
          setInput={setInput}
          suggestions={suggestions}
          setSuggestions={setSuggestions}
          setSuppressSuggestions={setSuppressSuggestions}
          onEditSavedFood={(key) => editor.openSavedFood(key, gptCache[key])}
          gptCache={gptCache}
          submit={submit}
          loading={loading}
          scanLoading={scanLoading}
          onManualEntry={() => { closeManualEntry(); setManualEntryName(input.trim()); setManualEntryVisible(true); }}
          onScanLabel={async (source) => {
            const result = await captureAndCompressLabelImage(source);
            if (result) submitFromImage(result.base64);
          }}
        />

        <DailyControls
          selectedDate={selectedDate}
          historyByDate={historyByDate}
          dailyLog={dailyLog}
          gramInputs={gramInputs}
          setGramInputs={setGramInputs}
          addItem={addItem}
          removeItem={removeItem}
          clearItem={clearItem}
          updateGrams={updateGrams}
          resetDay={resetDay}
          exportDay={exportDay}
          exportRange={exportRange}
          submit={submit}
          loading={loading}
          setMealsVisible={setMealsVisible}
          setMealPrepVisible={() => openMealPreps()}
          onEditEntry={editor.openLogEntry}
          onEditPrep={(prepId) => openMealPreps(prepId)}
          selectionMode={selectionMode}
          selectedItemIds={selectedItemIds}
          startMealSelection={startMealSelection}
          cancelMealSelection={cancelMealSelection}
          toggleItemSelection={toggleItemSelection}
          createMealFromSelection={createMealFromSelection}
          supplementsSection={
            <SupplementsSection
              supplements={supplements}
              takenIds={supplementsTakenToday}
              toggleSupplement={toggleSupplement}
              onManage={() => setSupplementsModalVisible(true)}
            />
          }
          dayStatsSection={
            <DayStatsSection
              key={selectedDate}
              weight={selectedDayStat?.weight ?? null}
              previousWeight={previousDayWeight}
              onCommitWeight={setDayWeight}
              checklist={checklist}
              checkedIds={selectedDayStat?.checked || []}
              onToggleItem={toggleChecklistItem}
              onManage={() => setChecklistModalVisible(true)}
            />
          }
        />
      </ScrollView>
      </KeyboardAvoidingView>

      <GoalModal
        visible={goalModalVisible}
        setVisible={setGoalModalVisible}
        editingMacro={editingMacro}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        setGoals={setGoals}
      />

      <MealsModal
        visible={mealsVisible}
        setVisible={setMealsVisible}
        meals={meals}
        onAddToLog={addMealToLog}
        onEdit={openMealEditor}
        onDelete={deleteMeal}
        onNew={() => openMealEditor(null)}
      />

      <MealEditorModal
        visible={mealEditorVisible}
        meal={editingMeal}
        onChangeName={updateMealEditorName}
        onChangeItem={updateMealEditorItem}
        onAddItem={addMealEditorItem}
        onRemoveItem={removeMealEditorItem}
        onSave={saveMeal}
        onClose={closeMealEditor}
      />

      <EditCachedFoodModal
        visible={editor.visible}
        setVisible={editor.setVisible}
        editingFood={editor.editingFood}
        setEditingFood={editor.setEditingFood}
        gptCache={gptCache}
        setGptCache={setGptCache}
        setSuggestions={setSuggestions}
        onAddToLog={addEditedFoodToLog}
        onSaveLogEntry={updateLoggedFoodEntry}
      />

      <NamedListModal
        visible={supplementsModalVisible}
        setVisible={setSupplementsModalVisible}
        title="Supplements"
        addTitle="Add Supplement"
        emptyText="Add the supplements you take — they'll show up as a daily tick-list and in your exports."
        placeholder="e.g. Vitamin D"
        items={supplements}
        onAdd={addSupplement}
        onRename={renameSupplement}
        onRemove={removeSupplement}
      />

      <NamedListModal
        visible={checklistModalVisible}
        setVisible={setChecklistModalVisible}
        title="Daily Checklist"
        addTitle="Add Item"
        emptyText="Add the things you want to tick off each day — they count towards the progress bar and appear in your exports."
        placeholder="e.g. 10k steps"
        items={checklist}
        onAdd={addChecklistItem}
        onRename={renameChecklistItem}
        onRemove={removeChecklistItem}
      />

      <ManualEntryModal
        visible={manualEntryVisible}
        setVisible={closeManualEntry}
        initialName={manualEntryName}
        initialValues={manualEntryInitialValues}
        onSave={saveManualEntry}
      />

      <MealPrepModal
        visible={mealPrepVisible}
        setVisible={setMealPrepVisible}
        mealPreps={mealPreps}
        saveMealPrep={saveMealPrep}
        deleteMealPrep={deleteMealPrep}
        logMealPrepServing={logMealPrepServing}
        loggedMealPrep={loggedMealPrep}
        lookupFood={lookupFood}
        gptCache={gptCache}
        meals={meals}
        openMealPrepId={openMealPrepId}
        onConsumeOpenMealPrepId={() => setOpenMealPrepId(null)}
      />
    </View>
  );
}

function createThemedScreenStyles(colors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      backgroundColor: colors.background,
    },
    mainTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
    },
  });
}
