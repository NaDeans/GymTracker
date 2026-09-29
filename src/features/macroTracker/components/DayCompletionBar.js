import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createThemedStyles } from "../macroTrackerStyles";
import { useTheme } from "shared/hooks/useTheme";
import { triggerNotification } from "shared/utils/haptics";

// How much of the day is done: macro goals, every supplement, the checklist. One thin
// line under the date — deliberately quiet, since the checkboxes below are
// where the day actually gets filled in.
//
// Takes the whole completion object rather than the raw state it came from, so
// the rule stays in shared/utils/dayCompletion.js where the reminder scheduler
// can use the same one.
//
// The caller passes key={selectedDate}, so switching to an already-complete past
// day remounts rather than re-firing the medal pop and haptic.
export const DayCompletionBar = ({ completion }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const { segments, isComplete, remaining } = completion;

  const medalScale = useRef(new Animated.Value(isComplete ? 1 : 0.6)).current;
  const wasComplete = useRef(isComplete);

  useEffect(() => {
    if (!wasComplete.current && isComplete) {
      triggerNotification("success");
      Animated.spring(medalScale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    }
    wasComplete.current = isComplete;
  }, [isComplete, medalScale]);

  return (
    <View style={styles.completionRow}>
      <View style={styles.completionTrack}>
        {segments.map((seg) => (
          <View
            key={seg.key}
            style={[
              styles.completionSegment,
              { backgroundColor: seg.done ? (isComplete ? colors.warning : colors.success) : colors.chart.track },
            ]}
          />
        ))}
      </View>

      {isComplete ? (
        <Animated.View style={[styles.completionStatusRow, { transform: [{ scale: medalScale }] }]}>
          <Ionicons name="medal" size={13} color={colors.warning} />
          <Text style={styles.completionStatusDone}>done</Text>
        </Animated.View>
      ) : (
        <Text style={styles.completionStatus} numberOfLines={1}>
          {remaining.join(", ")} to go
        </Text>
      )}
    </View>
  );
};
