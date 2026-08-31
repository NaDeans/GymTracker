import AsyncStorage from "@react-native-async-storage/async-storage";

export const loadRecipes = async () => {
  try {
    const saved = await AsyncStorage.getItem("RECIPES");
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error("Error loading recipes:", err);
    return [];
  }
};

export const saveRecipes = async (recipes) => {
  try {
    await AsyncStorage.setItem("RECIPES", JSON.stringify(recipes));
  } catch (err) {
    console.error("Error saving recipes:", err);
  }
};
