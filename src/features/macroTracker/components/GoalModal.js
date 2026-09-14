import { ModalSheet } from "shared/components/ModalSheet";
import { Stepper } from "shared/components/Stepper";
import { Button } from "shared/components/Button";
import { titleCase } from "../utils/macroUtils";
import { SPACING } from "shared/constants/styles";
import { View, Keyboard } from "react-native";

export const GoalModal = ({ visible, setVisible, editingMacro, goalInput, setGoalInput, setGoals }) => {
  const step = editingMacro === "calories" ? 50 : 5;
  const suffix = editingMacro === "calories" ? "kcal" : "g";

  const handleSave = () => {
    Keyboard.dismiss();
    setGoals((prev) => ({ ...prev, [editingMacro]: parseFloat(goalInput) || prev[editingMacro] }));
    setVisible(false);
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title={`Set ${titleCase(editingMacro)} Goal`}
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
