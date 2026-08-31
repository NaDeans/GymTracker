import { useRef } from "react";
import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useRecipes } from "./hooks/useRecipes";
import { createThemedStyles } from "./recipesStyles";
import { RecipeListItem } from "./components/RecipeListItem";
import { RecipeEditor } from "./components/RecipeEditor";

import { Button } from "shared/components/Button";
import { IconButton } from "shared/components/IconButton";
import { TextField } from "shared/components/TextField";
import { useTheme } from "shared/hooks/useTheme";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";

export default function RecipesScreen() {
  const r = useRecipes();
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const listRef = useRef(null);

  const hasRecipes = r.recipes.length > 0;

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={r.visibleRecipes}
        keyExtractor={(recipe) => recipe.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        renderItem={({ item }) => (
          <RecipeListItem recipe={item} onPress={() => r.openRecipe(item)} />
        )}
        ListHeaderComponent={
          <KeyboardScrollProvider scrollRef={listRef}>
            <View style={styles.headerRow}>
              <Text style={styles.mainTitle}>Recipes</Text>
              <IconButton icon="add" variant="primary" onPress={r.openNewRecipe} />
            </View>

            {hasRecipes ? (
              <TextField
                style={styles.searchField}
                value={r.search}
                onChangeText={r.setSearch}
                placeholder="Search recipes"
                icon="search"
                rightIcon={r.search ? "close-circle" : undefined}
                onRightIconPress={() => r.setSearch("")}
              />
            ) : null}
          </KeyboardScrollProvider>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={hasRecipes ? "search-outline" : "book-outline"}
              size={44}
              color={colors.textDisabled}
            />
            <Text style={styles.emptyTitle}>
              {hasRecipes ? "No matches" : "No recipes yet"}
            </Text>
            <Text style={styles.emptyText}>
              {hasRecipes
                ? "Nothing here matches that search."
                : "Somewhere to keep the things you always forget — oat timings, rice ratios, how much milk."}
            </Text>
            {hasRecipes ? null : (
              <Button label="Add a recipe" icon="add" onPress={r.openNewRecipe} />
            )}
          </View>
        }
      />

      <RecipeEditor
        visible={r.editorVisible}
        isNewRecipe={r.isNewRecipe}
        title={r.draftTitle}
        body={r.draftBody}
        onChangeTitle={r.setDraftTitle}
        onChangeBody={r.setDraftBody}
        onClose={r.closeEditor}
        onDelete={r.deleteEditingRecipe}
      />
    </View>
  );
}
