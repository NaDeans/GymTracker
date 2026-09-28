import { View, Text, Pressable, Keyboard, Alert } from "react-native";
import { createThemedStyles } from "../macroTrackerStyles";
import { TextField } from "shared/components/TextField";
import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { Card } from "shared/components/Card";
import { useTheme } from "shared/hooks/useTheme";
import { useVoiceSearch } from "shared/hooks/useVoiceSearch";
import { formatFoodName } from "shared/utils/textUtils";
import { SPACING } from "shared/constants/styles";

export const FoodSearchInput = ({
  input,
  setInput,
  suggestions,
  setSuggestions,
  setSuppressSuggestions,
  onEditSavedFood,
  gptCache,
  submit,
  onManualEntry,
  onScanLabel,
  loading,
  scanLoading,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const { available: voiceAvailable, listening, toggle: toggleVoiceSearch } = useVoiceSearch(setInput);

  const handleSelectSuggestion = (s) => {
    setSuggestions([]);
    setSuppressSuggestions(true);
    setInput("");
    Keyboard.dismiss();
    submit(s);
  };

  const handleEditSuggestion = (s) => {
    if (!gptCache[s]?.items?.length) return;
    onEditSavedFood(s);
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
      <TextField
        icon="search"
        placeholder={listening ? "Listening..." : "Search Foods"}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => submit()}
        rightIcon={voiceAvailable ? (listening ? "mic" : "mic-outline") : undefined}
        onRightIconPress={toggleVoiceSearch}
        rightIconActive={listening}
        // Not multiline: on Android the return key inserts a newline instead of
        // firing onSubmitEditing, so the search never runs from the keyboard.
        returnKeyType="search"
        style={{ marginBottom: SPACING.sm }}
      />
      <View style={styles.searchButtonRow}>
        <Button variant="secondary" size="md" icon="add" disabled={loading || scanLoading} onPress={onManualEntry} style={{ flex: 1 }}>Manual</Button>
        <Button variant="secondary" size="md" icon="camera" loading={scanLoading} disabled={scanLoading} onPress={handleScanLabel} style={{ flex: 1 }}>Scan Label</Button>
      </View>

      {suggestions.length > 0 && (
        <Card surface="raised" elevation="md" padding={0} style={styles.suggestionsContainer}>
          {suggestions.map((s, i) => (
            <View key={s} style={[styles.suggestionRow, i > 0 && styles.suggestionDivider]}>
              <Pressable style={styles.suggestionTouchable} onPress={() => handleSelectSuggestion(s)}>
                <Text style={styles.suggestionText}>{gptCache[s]?.items?.[0]?.name || formatFoodName(s)}</Text>
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
