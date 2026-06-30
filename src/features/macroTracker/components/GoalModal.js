import { Modal, View, Text, TextInput, Pressable } from "react-native";
import { styles } from "../macroTrackerStyles";

export const GoalModal = ({ visible, setVisible, editingMacro, goalInput, setGoalInput, setGoals }) => (
  <Modal visible={visible} transparent animationType="fade">
    <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Set goal for {editingMacro}</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={goalInput}
          onChangeText={setGoalInput}
        />

        <Pressable
          onPress={() => {
            setGoals((prev) => ({ ...prev, [editingMacro]: parseFloat(goalInput) || prev[editingMacro] }));
            setVisible(false);
          }}
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
        >
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </Pressable>
  </Modal>
);
