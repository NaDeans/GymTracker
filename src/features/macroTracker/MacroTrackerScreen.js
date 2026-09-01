import { useRef, useState } from "react";
import { View, ScrollView, Text, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useMacroTracker } from "./hooks/useMacroTracker";
import { captureAndCompressLabelImage } from "./utils/imageUtils";
import { createThemedStyles } from "./macroTrackerStyles";
import { Badge } from "shared/components/Badge";
import { useTheme } from "shared/hooks/useTheme";
import { formatFoodName } from "shared/utils/textUtils";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";

import DatePicker from "./components/DatePicker";
import { MacroTotals } from "./components/MacroTotals";
import { FoodSearchInput } from "./components/FoodSearchInput";
import { DailyControls } from "./components/DailyControls";
import { GoalModal } from "./components/GoalModal";
import { MealsModal } from "./components/MealsModal";
import { MealEditorModal } from "./components/MealEditorModal";
import { EditCachedFoodModal } from "./components/EditCachedFoodModal";
import { CacheManagerModal } from "./components/CacheManagerModal";
import { ManualEntryModal } from "./components/ManualEntryModal";
import { SupplementsSection } from "./components/SupplementsSection";
import { SupplementsModal } from "./components/SupplementsModal";

export default function MacroTrackerScreen() {
  const {
    refreshing, onRefresh,
    mealsVisible, setMealsVisible,
    editModalVisible, setEditModalVisible,
    goalModalVisible, setGoalModalVisible,
    editingFood, setEditingFood,
    input, setInput,
    loading,
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
    supplementsTakenToday,
    supplementsModalVisible, setSupplementsModalVisible,
    toggleSupplement, addSupplement, renameSupplement, removeSupplement,
    goals, setGoals,
    editingMacro, setEditingMacro,
    goalInput, setGoalInput,
    addItem, removeItem, clearItem, updateGrams, resetDay, exportDay, exportRange,
    submit, submitFromImage,
    meals,
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
  } = useMacroTracker();

  const [cacheManagerVisible, setCacheManagerVisible] = useState(false);

  const handleEditLogEntry = (entry, idx) => {
    setEditingFood({
      key: formatFoodName(entry.key || entry.items[0]?.name || ""),
      originalKey: entry.key,
      foodId: entry.foodId,
      items: entry.items,
      logEntryIndex: idx,
      ...(entry.mealName !== undefined && { mealName: entry.mealName }),
    });
    setEditModalVisible(true);
  };

  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const headerStyles = createThemedScreenStyles(colors);
  const scrollRef = useRef(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.mainTitle}>Macro Tracker</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.container]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <KeyboardScrollProvider scrollRef={scrollRef}>
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
          setEditingFood={setEditingFood}
          setEditModalVisible={setEditModalVisible}
          gptCache={gptCache}
          submit={submit}
          loading={loading}
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
          setCacheManagerVisible={setCacheManagerVisible}
          onEditEntry={handleEditLogEntry}
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
        />
      </KeyboardScrollProvider>
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
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        editingFood={editingFood}
        setEditingFood={setEditingFood}
        gptCache={gptCache}
        setGptCache={setGptCache}
        setSuggestions={setSuggestions}
        onAddToLog={addEditedFoodToLog}
        onSaveLogEntry={updateLoggedFoodEntry}
      />

      <CacheManagerModal
        visible={cacheManagerVisible}
        setVisible={setCacheManagerVisible}
        gptCache={gptCache}
        setGptCache={setGptCache}
        setEditingFood={setEditingFood}
        setEditModalVisible={setEditModalVisible}
      />

      <SupplementsModal
        visible={supplementsModalVisible}
        setVisible={setSupplementsModalVisible}
        supplements={supplements}
        addSupplement={addSupplement}
        renameSupplement={renameSupplement}
        removeSupplement={removeSupplement}
      />

      <ManualEntryModal
        visible={manualEntryVisible}
        setVisible={closeManualEntry}
        initialName={manualEntryName}
        initialValues={manualEntryInitialValues}
        onSave={saveManualEntry}
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
