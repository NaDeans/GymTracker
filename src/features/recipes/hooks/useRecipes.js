import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Keyboard } from "react-native";

import { triggerNotification } from "shared/utils/haptics";
import { UNTITLED, matchesSearch } from "../utils/recipeUtils";
import { loadRecipes, saveRecipes } from "../utils/storageUtils";

export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");

  // Editor state. `editingId` is null while writing a brand-new recipe.
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  // Guards the save effect: without it, the first render saves the empty
  // initial state over the stored recipes before the load below resolves.
  const hasLoaded = useRef(false);

  useEffect(() => {
    loadRecipes().then((saved) => {
      setRecipes(saved);
      hasLoaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (!hasLoaded.current) return;
    saveRecipes(recipes);
  }, [recipes]);

  // Most recently edited first, so whatever you just wrote sits at the top.
  const visibleRecipes = useMemo(
    () =>
      recipes
        .filter((recipe) => matchesSearch(recipe, search))
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [recipes, search]
  );

  const openNewRecipe = () => {
    setEditingId(null);
    setDraftTitle("");
    setDraftBody("");
    setEditorVisible(true);
  };

  const openRecipe = (recipe) => {
    setEditingId(recipe.id);
    setDraftTitle(recipe.title === UNTITLED ? "" : recipe.title);
    setDraftBody(recipe.body);
    setEditorVisible(true);
  };

  // The editor has no cancel button — leaving it commits whatever is on screen,
  // so nothing typed can be lost by tapping the wrong thing. Delete undoes.
  const closeEditor = () => {
    const title = draftTitle.trim();
    const body = draftBody.trim();
    const now = Date.now();

    if (editingId) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === editingId
            ? { ...recipe, title: title || UNTITLED, body: draftBody, updatedAt: now }
            : recipe
        )
      );
    } else if (title || body) {
      // An empty new recipe is simply discarded rather than saved blank.
      setRecipes((prev) => [
        { id: String(now), title: title || UNTITLED, body: draftBody, createdAt: now, updatedAt: now },
        ...prev,
      ]);
    }

    Keyboard.dismiss();
    setEditorVisible(false);
  };

  const deleteEditingRecipe = () => {
    if (!editingId) return;
    Alert.alert("Delete recipe?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setRecipes((prev) => prev.filter((recipe) => recipe.id !== editingId));
          triggerNotification("success");
          Keyboard.dismiss();
          setEditorVisible(false);
        },
      },
    ]);
  };

  return {
    recipes,
    visibleRecipes,
    search,
    setSearch,
    editorVisible,
    isNewRecipe: editingId === null,
    draftTitle,
    setDraftTitle,
    draftBody,
    setDraftBody,
    openNewRecipe,
    openRecipe,
    closeEditor,
    deleteEditingRecipe,
  };
};
