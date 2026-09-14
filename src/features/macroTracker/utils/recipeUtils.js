import { safeNumber } from "shared/utils/numberUtils";

// A recipe is a bulk cook: the ingredients hold the FULL batch amounts and
// `servings` says how many meals it divides into. Macros are divided by the
// serving count rather than tracked by weight — cooking changes water content,
// not calories, so 1/8 of the cook is exactly 1/8 of the macros. The gram
// figure that falls out of this is a raw-ingredient sum, not plate weight, so
// the UI must always label it "raw".

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const newRecipeId = () => `rcp_${uid()}`;
export const newIngredientId = () => `ing_${uid()}`;

export const emptyRecipe = () => ({
  id: newRecipeId(),
  name: "",
  servings: 1,
  ingredients: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// Ingredients reuse the <Item> field names so a gptCache hit drops straight in,
// but they must be cloned and re-id'd: cache items are shared objects and their
// ids can collide in the flat dailyLog.items map.
export const ingredientFromItem = (item) => ({
  id: newIngredientId(),
  name: item.name || "",
  amount_g: safeNumber(item.amount_g),
  calories: safeNumber(item.calories),
  protein: safeNumber(item.protein),
  carbs: safeNumber(item.carbs),
  fats: safeNumber(item.fats),
  assumption: item.assumption || null,
});

export const blankIngredient = () => ({
  id: newIngredientId(),
  name: "",
  amount_g: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
  assumption: null,
});

export const sumIngredients = (ingredients = []) =>
  ingredients.reduce(
    (t, i) => ({
      amount_g: t.amount_g + safeNumber(i.amount_g),
      calories: t.calories + safeNumber(i.calories),
      protein: t.protein + safeNumber(i.protein),
      carbs: t.carbs + safeNumber(i.carbs),
      fats: t.fats + safeNumber(i.fats),
    }),
    { amount_g: 0, calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

export const perServingMacros = (recipe) => {
  const n = Math.max(1, safeNumber(recipe?.servings) || 1);
  const t = sumIngredients(recipe?.ingredients);
  return {
    // The `|| 1` keeps every downstream `value * g / raw.amount_g` finite even
    // when the API returned a null amount_g for every ingredient.
    amount_g: t.amount_g / n || 1,
    calories: t.calories / n,
    protein: t.protein / n,
    carbs: t.carbs / n,
    fats: t.fats / n,
  };
};

export const isRecipeItem = (item) => !!item?.recipe;

// Servings are a view over grams: because `raw` is the PER-SERVING base,
// amount_g / raw.amount_g is exactly the serving count, so the existing
// gram-scaling machinery (addItem, updateGrams, calcTotals) carries fractional
// servings with no changes.
export const servingsFromItem = (item, grams) => {
  const base = safeNumber(item?.raw?.amount_g) || 1;
  const g = grams === undefined ? safeNumber(item?.amount_g) : safeNumber(grams);
  return g / base;
};

// One synthetic item stands in for the whole prep, so the day log shows a
// single collapsed card. `recipe` is an immutable snapshot: editing the recipe
// later never rewrites already-logged servings.
export const buildRecipeLogItem = (recipe, servings) => {
  const per = perServingMacros(recipe);
  const n = safeNumber(servings) || 1;
  return {
    id: `recipe_${recipe.id}`,
    name: recipe.name,
    amount_g: per.amount_g * n,
    calories: per.calories * n,
    protein: per.protein * n,
    carbs: per.carbs * n,
    fats: per.fats * n,
    assumption: null,
    raw: per,
    recipe: {
      recipeId: recipe.id,
      name: recipe.name,
      servings: Math.max(1, safeNumber(recipe.servings) || 1),
      updatedAt: recipe.updatedAt,
      perServing: per,
      ingredients: (recipe.ingredients || []).map((i) => ({
        name: i.name,
        amount_g: safeNumber(i.amount_g),
        calories: safeNumber(i.calories),
        protein: safeNumber(i.protein),
        carbs: safeNumber(i.carbs),
        fats: safeNumber(i.fats),
      })),
    },
  };
};
