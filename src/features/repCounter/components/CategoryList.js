import { View, Text, Pressable, FlatList, Modal, TextInput } from "react-native";
import { styles } from "../repCounterStyles";

export function CategoryList({
  groups,
  newGroupName, setNewGroupName,
  showGroupModal, setShowGroupModal,
  setShowFullLog,
  setSelectedGroup,
  addGroup,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Categories</Text>

      <Pressable style={styles.viewLogButton} onPress={() => setShowFullLog(true)}>
        <Text style={styles.viewLogText}>View Full Log</Text>
      </Pressable>

      <FlatList
        data={groups}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSelectedGroup(item)}>
            <Text style={styles.cardText}>{item}</Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable style={styles.addButton} onPress={() => setShowGroupModal(true)}>
            <Text style={styles.addText}>＋ Add Category</Text>
          </Pressable>
        }
      />

      <Modal visible={showGroupModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowGroupModal(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <TextInput
              placeholder="Category name"
              placeholderTextColor="#888"
              value={newGroupName}
              onChangeText={setNewGroupName}
              style={styles.input}
              autoFocus
            />
            <Pressable style={styles.saveAdditionButton} onPress={addGroup}>
              <Text style={styles.buttonText}>Save</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
