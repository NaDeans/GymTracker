import { ModalSheet } from "shared/components/ModalSheet";
import { Stepper } from "shared/components/Stepper";
import { Button } from "shared/components/Button";
import { SPACING } from "shared/constants/styles";
import { View, Keyboard } from "react-native";

export const GoalModal = ({ visible, setVisible, editingMacro, goalInput, setGoalInput, setGoals }) => {
  const step = editingMacro === "calories" ? 50 : 5;
  const suffix = editingMacro === "calories" ? "kcal" : "g";
  // Capitalised inline rather than through formatFoodName — these are macro
  // names, not foods, and have no business going near the spelling table.
  const label = editingMacro ? editingMacro.charAt(0).toUpperCase() + editingMacro.slice(1) : "";

  const handleSave = () => {
    Keyboard.dismiss();
    setGoals((prev) => ({ ...prev, [editingMacro]: parseFloat(goalInput) || prev[editingMacro] }));
    setVisible(false);
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title={`Set ${label} Goal`}
      scrollable={false}
      footer={
        <View style={{ flexDirection: "row", gap: SPACING.sm }}>
          <Button variant="secondary" style={{ flex: 1 }} onPress={() => setVisible(false)}>Cancel</Button>
          <Button variant="primary" style={{ flex: 1 }} onPress={handleSave}>Save</Button>
        </View>
      }
    >
      <Stepper
        value={goalInput}
        onStep={setGoalInput}
        onDraftChange={setGoalInput}
        onCommit={setGoalInput}
        step={step}
        // A goal of 0 makes the progress bar divide by its `|| 1` fallback and
        // makes "goal met" demand a total of exactly zero.
        min={1}
        suffix={suffix}
      />
    </ModalSheet>
  );
};
