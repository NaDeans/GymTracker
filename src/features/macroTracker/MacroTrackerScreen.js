import { ScrollView, Text, RefreshControl } from "react-native";
import { useMacroTracker } from "./hooks/useMacroTracker";
import { styles } from "./macroTrackerStyles";

import DatePicker from "./components/DatePicker";
import { MacroTotals } from "./components/MacroTotals";
import { FoodSearchInput } from "./components/FoodSearchInput";
import { DailyControls } from "./components/DailyControls";
import { GoalModal } from "./components/GoalModal";
import { CustomFoodsModal } from "./components/CustomFoodsModal";
import { EditCachedFoodModal } from "./components/EditCachedFoodModal";

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
    goals, setGoals,
    editingMacro, setEditingMacro,
    goalInput, setGoalInput,
    addItem, removeItem, clearItem, updateGrams, resetDay,
    addCustomFood, submit,
  } = useMacroTracker();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.mainTitle}>Macro Tracker</Text>

      <DatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

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
        submit={submit}
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
        setGptCache={setGptCache}
        setSuggestions={setSuggestions}
      />
    </ScrollView>
  );
}
