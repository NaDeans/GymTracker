import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, CONTROL_HEIGHT } from "shared/constants/styles";

export const TextField = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  placeholder,
  error,
  disabled = false,
  autoFocus = false,
  multiline = false,
  onSubmitEditing,
  onEndEditing,
  size = "md",
  suffix,
  prefix,
  icon,
  rightIcon,
  onRightIconPress,
  rightIconActive = false,
  style,
  inputStyle,
}) => {
  const [focused, setFocused] = useState(false);
  const height = size === "sm" ? CONTROL_HEIGHT.sm : CONTROL_HEIGHT.md;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.fieldRow,
          {
            height: multiline ? undefined : height,
            minHeight: multiline ? height : undefined,
            borderColor: error ? COLORS.danger : focused ? COLORS.primary : COLORS.border,
            backgroundColor: disabled ? COLORS.neutralSurface : COLORS.inputBackground,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.leadingIcon} /> : null}
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          style={[
            styles.input,
            { fontSize: size === "sm" ? FONT_SIZE.sm : FONT_SIZE.md, color: disabled ? COLORS.textDisabled : COLORS.textPrimary },
            multiline && { minHeight: height, textAlignVertical: "top", paddingVertical: SPACING.sm },
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          autoFocus={autoFocus}
          multiline={multiline}
          editable={!disabled}
          onSubmitEditing={onSubmitEditing}
          onEndEditing={onEndEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={styles.trailingIcon}>
            <Ionicons name={rightIcon} size={20} color={rightIconActive ? COLORS.danger : COLORS.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textMedium, marginBottom: SPACING.xs },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: { flex: 1, minWidth: 0, paddingVertical: 0 },
  affix: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginHorizontal: SPACING.xs },
  leadingIcon: { marginRight: SPACING.xs },
  trailingIcon: { marginLeft: SPACING.xs },
  error: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: SPACING.xs },
});
