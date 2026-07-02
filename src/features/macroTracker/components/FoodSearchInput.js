import { View, Text, Pressable, Keyboard, Alert } from "react-native";
import { styles } from "../macroTrackerStyles";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Card } from "shared/components/Card";
import { useVoiceSearch } from "shared/hooks/useVoiceSearch";

export const FoodSearchInput = ({
  input,
  setInput,
  suggestions,
  setSuggestions,
  setSuppressSuggestions,
  setEditingFood,
  setEditModalVisible,
  gptCache,
  submit,
  onManualEntry,
  onScanLabel,
  loading,
}) => {
  const { listening, toggle: toggleVoiceSearch } = useVoiceSearch(setInput);

  const handleSelectSuggestion = (s) => {
    setSuggestions([]);
    setSuppressSuggestions(true);
    setInput("");
    Keyboard.dismiss();
    submit(s);
  };

  const handleEditSuggestion = (s) => {
    const entry = gptCache[s];
    if (!entry?.items?.length) return;
    setEditingFood({ key: s, originalKey: s, foodId: entry.foodId, items: entry.items });
    setEditModalVisible(true);
  };

  const handleScanLabel = () => {
    Alert.alert("Scan Nutrition Label", undefined, [
      { text: "Take Photo", onPress: () => onScanLabel("camera") },
      { text: "Choose from Library", onPress: () => onScanLabel("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.searchRow}>
        <TextField
          icon="search"
          placeholder={listening ? "Listening..." : "Search Foods"}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => submit()}
          rightIcon={listening ? "mic" : "mic-outline"}
          onRightIconPress={toggleVoiceSearch}
          rightIconActive={listening}
          style={{ flex: 1 }}
        />
        <Button variant="secondary" size="md" icon="add" onPress={onManualEntry}>Manual</Button>
        <Button variant="secondary" size="md" icon="camera" loading={loading} disabled={loading} onPress={handleScanLabel}>Scan</Button>
      </View>

      {suggestions.length > 0 && (
        <Card surface="raised" elevation="md" padding={0} style={styles.suggestionsContainer}>
          {suggestions.map((s, i) => (
            <View key={s} style={[styles.suggestionRow, i > 0 && styles.suggestionDivider]}>
              <Pressable style={styles.suggestionTouchable} onPress={() => handleSelectSuggestion(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
              {gptCache[s]?.source === "manual" && (
                <View style={styles.manualTag}>
                  <Text style={styles.manualTagText}>✎</Text>
                </View>
              )}
              {gptCache[s]?.source === "scan" && (
                <View style={styles.scanTag}>
                  <Text style={styles.scanTagText}>📷</Text>
                </View>
              )}
              <IconButton icon="pencil" variant="ghost" size="sm" onPress={() => handleEditSuggestion(s)} />
            </View>
          ))}
        </Card>
      )}
    </View>
  );
};
