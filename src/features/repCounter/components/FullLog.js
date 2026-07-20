import { useRef } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { isoToDmy } from "shared/utils/dateUtils";
import { fmt } from "shared/utils/numberUtils";
import { createThemedStyles } from "../repCounterStyles";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { TextField } from "shared/components/TextField";
import { useTheme } from "shared/hooks/useTheme";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";

export function FullLog({ setShowFullLog, sortedDates, allLogs, dayNotes, updateDayNotesByDate }) {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const listRef = useRef(null);
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <IconButton icon="chevron-back" variant="secondary" onPress={() => setShowFullLog(false)} style={styles.backButtonSpacing} />
      <Text style={styles.pageTitle}>Full Workout Log</Text>

      <KeyboardScrollProvider scrollRef={listRef}>
      <FlatList
        ref={listRef}
        data={sortedDates}
        keyExtractor={(item) => item}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => (
          <Card style={styles.dayCardSpacing}>
            <Text style={styles.historyDateText}>{isoToDmy(item)}</Text>
            <TextField
              value={dayNotes[item] || ""}
              onChangeText={(text) => updateDayNotesByDate(item, text)}
              placeholder="Write notes about this workout..."
              multiline
              style={{ marginBottom: 12 }}
            />
            {allLogs[item].map((entry, index) => (
              <View key={index} style={styles.logEntryBlock}>
                <Text style={styles.logEntryHeader}>{entry.group} — {entry.exercise}</Text>
                {entry.sets.map((set, i) => (
                  <Text key={i} style={styles.historyText}>
                    Set {i + 1}: {set.reps} reps of {fmt(set.weight)} kg
                  </Text>
                ))}
              </View>
            ))}
          </Card>
        )}
      />
      </KeyboardScrollProvider>
    </KeyboardAvoidingView>
  );
}
