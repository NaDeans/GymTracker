import { useState, useEffect } from "react";
import {
  View, Text, Pressable, ScrollView,
  Platform, Keyboard, BackHandler, useWindowDimensions,
} from "react-native";
import { COLORS } from "shared/constants/colors";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from "shared/constants/styles";

export const ModalSheet = ({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
  dismissOnBackdropPress = true,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (!visible || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose?.();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  const maxHeight = keyboardHeight > 0
    ? windowHeight - keyboardHeight - SPACING.xxxl
    : undefined;

  const handleBackdropPress = () => {
    if (!dismissOnBackdropPress) return;
    Keyboard.dismiss();
    onClose?.();
  };

  const body = scrollable ? (
    <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Pressable
      style={[
        styles.overlay,
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, elevation: 999 },
        keyboardHeight > 0 && { paddingBottom: keyboardHeight },
      ]}
      onPress={handleBackdropPress}
    >
      <Pressable style={[styles.container, maxHeight != null && { maxHeight }]} onPress={() => {}}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Pressable>
    </Pressable>
  );
};

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  container: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: "100%",
    marginHorizontal: SPACING.xl,
    ...SHADOW.lg,
  },
  title: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },
  footer: {
    marginTop: SPACING.sm,
  },
};
