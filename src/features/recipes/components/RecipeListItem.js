import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Card } from "shared/components/Card";
import { useTheme } from "shared/hooks/useTheme";
import { createThemedStyles } from "../recipesStyles";
import { previewOf, formatUpdated } from "../utils/recipeUtils";

export const RecipeListItem = ({ recipe, onPress }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const preview = previewOf(recipe.body);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>{recipe.title}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>

      {preview ? (
        <Text style={styles.cardPreview} numberOfLines={2}>{preview}</Text>
      ) : null}

      <Text style={styles.cardMeta}>{formatUpdated(recipe.updatedAt)}</Text>
    </Card>
  );
};
