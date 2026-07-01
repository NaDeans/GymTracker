import { Modal, Text, TextInput, Pressable, Keyboard } from "react-native";
import { styles } from "../macroTrackerStyles";

export const GoalModal = ({ visible, setVisible, editingMacro, goalInput, setGoalInput, setGoals }) => (
  <Modal visible={visible} transparent animationType="fade">
    <Pressable style={styles.modalOverlay} onPress={() => { Keyboard.dismiss(); setVisible(false); }}>
      <Pressable style={styles.modalContainer} onPress={() => {}}>
        <Text style={styles.modalTitle}>Set goal for {editingMacro}</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goalInput}
          onChangeText={setGoalInput}
          autoFocus
        />

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setGoals((prev) => ({ ...prev, [editingMacro]: parseFloat(goalInput) || prev[editingMacro] }));
            setVisible(false);
          }}
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  </Modal>
);
