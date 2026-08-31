import { View, Text, TextInput, Modal, KeyboardAvoidingView, Platform } from "react-native";

import { IconButton } from "shared/components/IconButton";
import { useTheme } from "shared/hooks/useTheme";
import { createThemedStyles } from "../recipesStyles";

const BODY_PLACEHOLDER = [
  "Write whatever you need — steps, times, amounts.",
  "",
  "e.g.",
  "1/2 cup oats",
  "180 ml milk",
  "Microwave 2:30, stir, then 0:30 more",
].join("\n");

export const RecipeEditor = ({
  visible,
  isNewRecipe,
  title,
  body,
  onChangeTitle,
  onChangeBody,
  onClose,
  onDelete,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.editorRoot}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.editorHeader}>
          <IconButton icon="chevron-back" variant="ghost" onPress={onClose} />
          <Text style={styles.editorHint}>Saves automatically</Text>
          {isNewRecipe ? (
            <View style={styles.editorHeaderSpacer} />
          ) : (
            <IconButton icon="trash-outline" variant="danger" onPress={onDelete} />
          )}
        </View>

        <TextInput
          style={styles.editorTitleInput}
          value={title}
          onChangeText={onChangeTitle}
          placeholder="Recipe name"
          placeholderTextColor={colors.textPlaceholder}
          autoFocus={isNewRecipe}
        />

        <View style={styles.editorDivider} />

        <TextInput
          style={styles.editorBodyInput}
          value={body}
          onChangeText={onChangeBody}
          placeholder={BODY_PLACEHOLDER}
          placeholderTextColor={colors.textPlaceholder}
          multiline
          textAlignVertical="top"
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};
