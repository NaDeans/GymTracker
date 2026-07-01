import { View, Text, Pressable, FlatList, TextInput } from "react-native";
import { isoToDmy } from "shared/utils/dateUtils";
import { styles } from "../repCounterStyles";

export function FullLog({ setShowFullLog, sortedDates, allLogs, dayNotes, updateDayNotesByDate }) {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => setShowFullLog(false)} style={styles.backButton}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Full Workout Log</Text>

      <FlatList
        data={sortedDates}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.historyDayCard}>
            <Text style={styles.historyDateText}>{isoToDmy(item)}</Text>
            <TextInput
              value={dayNotes[item] || ""}
              onChangeText={(text) => updateDayNotesByDate(item, text)}
              placeholder="Write notes about this workout..."
              placeholderTextColor="#888"
              style={styles.notesInput}
              multiline
            />
            {allLogs[item].map((entry, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "600" }}>{entry.group} — {entry.exercise}</Text>
                {entry.sets.map((set, i) => (
                  <Text key={i} style={styles.historyText}>
                    Set {i + 1}: {set.reps} reps of {set.weight} kg
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}
