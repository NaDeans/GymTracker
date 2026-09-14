import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const requestPermission = async (source) => {
  const { status, canAskAgain } =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      source === "camera" ? "Camera access needed" : "Photo access needed",
      canAskAgain
        ? "MacroTracker needs permission to continue."
        : "MacroTracker needs permission to continue. Enable it in Settings."
    );
    return false;
  }
  return true;
};

export const captureAndCompressLabelImage = async (source) => {
  const granted = await requestPermission(source);
  if (!granted) return null;

  const launch = source === "camera" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const result = await launch({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
  if (result.canceled || !result.assets?.length) return null;

  // Contextual API — manipulateAsync is deprecated as of expo-image-manipulator 14.
  const rendered = await ImageManipulator
    .manipulate(result.assets[0].uri)
    .resize({ width: 1600 })
    .renderAsync();

  const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });

  if (!saved.base64) return null;
  return { base64: saved.base64 };
};
