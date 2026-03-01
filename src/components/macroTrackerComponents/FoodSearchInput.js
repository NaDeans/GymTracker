import React from "react";
import { View, TextInput, ViewPropTypes, Text, Pressable, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PropTypes from "prop-types";

export const FoodSearchInput = ({
  input,
  setInput,
  suggestions,
  setSuggestions,
  setSuppressSuggestions,
  setEditingFood,
  setEditModalVisible,
  submit,
  styles
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

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((s) => (
            <View key={s} style={styles.suggestionRow}>
              {/* Select suggestion */}
              <Pressable
                onPress={() => handleSelectSuggestion(s)}
                style={{ flex: 1 }}
              >
                <Text>{s}</Text>
              </Pressable>

              {/* Edit button */}
              <Pressable
                onPress={() => handleEditSuggestion(s)}
                style={styles.suggestionEditButton}
              >
                <Text>Edit</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

FoodSearchInput.propTypes = {
  input: PropTypes.string.isRequired,
  setInput: PropTypes.func.isRequired,
  suggestions: PropTypes.array.isRequired,
  setSuggestions: PropTypes.func.isRequired,
  setSuppressSuggestions: PropTypes.func.isRequired,
  setEditingFood: PropTypes.func.isRequired,
  setEditModalVisible: PropTypes.func.isRequired,
  submit: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired
};