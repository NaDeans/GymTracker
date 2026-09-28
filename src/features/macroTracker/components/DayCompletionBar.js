import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";
import { triggerNotification } from "shared/utils/haptics";

// How much of the day is done: calorie goal, every supplement, gym, abs.
//
// Takes the whole completion object rather than the raw state it was derived
// from, so the rule stays in shared/utils/dayCompletion.js where the reminder
// scheduler can use the same one.
//
// The caller passes key={selectedDate}, so switching to an already-complete past
// day remounts rather than re-firing the medal animation and haptic.
export const DayCompletionBar = ({ completion }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const { segments, completedCount, totalCount, isComplete, remaining } = completion;

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
    <Card padding={SPACING.md} style={styles.completionCard}>
      <View style={styles.completionHeaderRow}>
        <Text style={styles.completionTitle}>{isComplete ? "Day complete" : "Day progress"}</Text>
        {isComplete ? (
          <Animated.View style={[styles.completionMedalPill, { transform: [{ scale: medalScale }] }]}>
            <Ionicons name="medal" size={14} color={colors.warning} />
            <Text style={styles.completionMedalText}>{completedCount}/{totalCount}</Text>
          </Animated.View>
        ) : (
          <Text style={styles.completionCount}>{completedCount} of {totalCount}</Text>
        )}
      </View>

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

      <View style={styles.completionLabelsRow}>
        {segments.map((seg) => (
          <Text
            key={seg.key}
            style={[styles.completionLabel, seg.done && styles.completionLabelDone]}
            numberOfLines={1}
          >
            {seg.shortLabel}
          </Text>
        ))}
      </View>

      {!isComplete && remaining.length > 0 && (
        <Text style={styles.completionHint}>Still to go: {remaining.join(", ")}</Text>
      )}
    </Card>
  );
};
