import { View, Text, TextInput, Pressable, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../macroTrackerStyles";

export const FoodSearchInput = ({
  input,
  setInput,
  suggestions,
  setSuggestions,
  setSuppressSuggestions,
  setEditingFood,
  setEditModalVisible,
  submit,
}) => {
  const handleSelectSuggestion = (s) => {
    setSuppressSuggestions(true);
    setInput(s);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleEditSuggestion = async (s) => {
    const raw = await AsyncStorage.getItem("GPT_CACHE");
    const cache = raw ? JSON.parse(raw) : {};
    const entry = cache[s];
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
        onSubmitEditing={submit}
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
