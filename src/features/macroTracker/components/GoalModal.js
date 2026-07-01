import { ModalSheet } from "shared/components/ModalSheet";
import { Stepper } from "shared/components/Stepper";
import { Button } from "shared/components/Button";
import { Keyboard } from "react-native";

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
      title={`Set goal for ${editingMacro}`}
      scrollable={false}
      footer={<Button variant="primary" fullWidth onPress={handleSave}>Save</Button>}
    >
      <Stepper
        value={goalInput}
        onStep={setGoalInput}
        onDraftChange={setGoalInput}
        onCommit={setGoalInput}
        step={step}
        min={0}
        suffix={suffix}
      />
    </ModalSheet>
  );
};
