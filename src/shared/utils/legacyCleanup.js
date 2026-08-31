import AsyncStorage from "@react-native-async-storage/async-storage";

// Keys left behind by the removed rep-counter feature. Cleared on every launch —
// multiRemove is a no-op once they are gone, so no "already ran" flag is needed.
const REMOVED_FEATURE_KEYS = ["REP_COUNTER_DATA", "DAY_NOTES"];

export const purgeRemovedFeatureData = async () => {
  try {
    await AsyncStorage.multiRemove(REMOVED_FEATURE_KEYS);
  } catch (err) {
    console.error("Error purging removed feature data:", err);
  }
};
