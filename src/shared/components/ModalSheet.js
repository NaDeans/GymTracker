import { useState, useEffect, useRef } from "react";
import {
  View, Text, Pressable, ScrollView, Modal,
  Platform, Keyboard, BackHandler, useWindowDimensions,
} from "react-native";
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";
import { IconButton } from "shared/components/IconButton";

export const ModalSheet = ({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
  dismissOnBackdropPress = true,
  showCloseButton = false,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef(null);

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

  const maxHeight = windowHeight - keyboardHeight - SPACING.xxxl;

  const handleBackdropPress = () => {
    if (!dismissOnBackdropPress) return;
    Keyboard.dismiss();
    onClose?.();
  };

  const body = scrollable ? (
    <ScrollView
      ref={scrollRef}
      style={{ flexShrink: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
    >
      <KeyboardScrollProvider scrollRef={scrollRef}>
        {children}
      </KeyboardScrollProvider>
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.overlay, keyboardHeight > 0 && { paddingBottom: keyboardHeight }]}
        onPress={handleBackdropPress}
      >
        <Pressable style={[styles.container, { maxHeight }]} onPress={() => {}}>
          {(title || showCloseButton) ? (
            <View style={styles.titleRow}>
              {title ? <Text style={[styles.title, { flex: 1 }]} numberOfLines={1}>{title}</Text> : <View style={{ flex: 1 }} />}
              {showCloseButton && <IconButton icon="close" variant="ghost" size="sm" onPress={onClose} />}
            </View>
          ) : null}
          {body}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createThemedStyles = (colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  container: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: "100%",
    marginHorizontal: SPACING.xl,
    ...SHADOW.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.lg,
    color: colors.textDark,
  },
  footer: {
    marginTop: SPACING.sm,
  },
});
