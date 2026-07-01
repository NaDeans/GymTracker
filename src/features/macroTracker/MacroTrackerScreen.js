import { View, ScrollView, Text, RefreshControl } from "react-native";
import { useMacroTracker } from "./hooks/useMacroTracker";
import { captureAndCompressLabelImage } from "./utils/imageUtils";
import { styles } from "./macroTrackerStyles";
import { Badge } from "shared/components/Badge";

import DatePicker from "./components/DatePicker";
import { MacroTotals } from "./components/MacroTotals";
import { FoodSearchInput } from "./components/FoodSearchInput";
import { DailyControls } from "./components/DailyControls";
import { GoalModal } from "./components/GoalModal";
import { CustomFoodsModal } from "./components/CustomFoodsModal";
import { EditCachedFoodModal } from "./components/EditCachedFoodModal";
import { ManualEntryModal } from "./components/ManualEntryModal";

export default function MacroTrackerScreen() {
  const {
    refreshing, onRefresh,
    foodDbVisible, setFoodDbVisible,
    editModalVisible, setEditModalVisible,
    goalModalVisible, setGoalModalVisible,
    customFoods, setCustomFoods,
    editingFood, setEditingFood,
    newFood, setNewFood,
    editingFoodId, setEditingFoodId,
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
    goals, setGoals,
    editingMacro, setEditingMacro,
    goalInput, setGoalInput,
    addItem, removeItem, clearItem, updateGrams, resetDay,
    addCustomFood, submit, submitFromImage,
    manualEntryVisible, setManualEntryVisible,
    manualEntryName, setManualEntryName,
    manualEntryInitialValues, closeManualEntry,
    saveManualEntry,
    addEditedFoodToLog,
  } = useMacroTracker();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.mainTitle}>Macro Tracker</Text>

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
          submit={submit}
          loading={loading}
          setFoodDbVisible={setFoodDbVisible}
        />

      </ScrollView>

      <GoalModal
        visible={goalModalVisible}
        setVisible={setGoalModalVisible}
        editingMacro={editingMacro}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        setGoals={setGoals}
      />

      <CustomFoodsModal
        visible={foodDbVisible}
        setVisible={setFoodDbVisible}
        customFoods={customFoods}
        setCustomFoods={setCustomFoods}
        addCustomFood={addCustomFood}
        newFood={newFood}
        setNewFood={setNewFood}
        editingFoodId={editingFoodId}
        setEditingFoodId={setEditingFoodId}
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
