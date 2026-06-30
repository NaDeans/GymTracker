import { View, Text, TextInput, Pressable, Keyboard } from "react-native";
import { styles } from "../macroTrackerStyles";

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
}) => {
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

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Search Foods"
        placeholderTextColor="#888"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => submit()}
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((s) => (
            <View key={s} style={styles.suggestionRow}>
              <Pressable onPress={() => handleSelectSuggestion(s)} style={{ flex: 1 }}>
                <Text>{s}</Text>
              </Pressable>
              <Pressable onPress={() => handleEditSuggestion(s)} style={styles.suggestionEditButton}>
                <Text>Edit</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
