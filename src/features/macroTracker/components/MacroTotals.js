import { useMemo } from "react";
import { View, Text } from "react-native";
import { Donut } from "./Donut";
import { fmt } from "shared/utils/numberUtils";
import { macroBarColor, calcTrailingAverages } from "../utils/macroUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const MACRO_LABEL = { calories: "Calories", protein: "Protein", carbs: "Carbs", fats: "Fats" };
const TRAILING_DAYS = 7;

// The progress bar's full width represents 0 -> goal * BAR_MAX_RATIO, so the
// goal itself lands at 1/BAR_MAX_RATIO along the track (2/3 with 1.5), leaving
// room to visualize overshoot past the goal.
const BAR_MAX_RATIO = 1.5;
const GOAL_ZONE_RATIO_MIN = 0.9;
const GOAL_ZONE_RATIO_MAX = 1.1;

export const MacroTotals = ({ totalMacros, goals, setEditingMacro, setGoalInput, setGoalModalVisible, dailyLog, selectedDate }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const goalZoneLeft = (GOAL_ZONE_RATIO_MIN / BAR_MAX_RATIO) * 100;
  const goalZoneWidth = ((GOAL_ZONE_RATIO_MAX - GOAL_ZONE_RATIO_MIN) / BAR_MAX_RATIO) * 100;

  const trailing = useMemo(
    () => calcTrailingAverages(dailyLog, selectedDate, TRAILING_DAYS),
    [dailyLog, selectedDate]
  );

  // Outer ring: what you've actually averaged this week. Inner ring: the
  // shape implied by your goals — constant unless goals change. Same fixed
  // macro colors in both, so a drifted wedge boundary is visible at a glance.
  const rings = useMemo(() => {
    const goalWedges = [
      { value: goals.protein || 0, color: colors.chart.protein },
      { value: goals.carbs || 0, color: colors.chart.carbs },
      { value: goals.fats || 0, color: colors.chart.fats },
    ];
    const avgWedges = trailing
      ? [
          { value: trailing.protein, color: colors.chart.protein },
          { value: trailing.carbs, color: colors.chart.carbs },
          { value: trailing.fats, color: colors.chart.fats },
        ]
      : [];

    return [
      { wedges: avgWedges, opacity: 1 },
      { wedges: goalWedges, opacity: 0.4 },
    ];
  }, [trailing, goals, colors]);

  const openGoalModal = (macro) => {
    setEditingMacro(macro);
    setGoalInput(goals[macro]?.toString() || "");
    setGoalModalVisible(true);
  };

  return (
    <View style={styles.totalsContainer}>
      <View style={styles.totalsColumn}>
        {["calories", "protein", "carbs", "fats"].map((macro) => {
          const value = totalMacros[macro];
          const goal = goals[macro] || 1;
          const ratio = value / goal;
          const fillPct = Math.min(100, (value / (goal * BAR_MAX_RATIO)) * 100);
          const fillColor = macroBarColor(ratio, colors);

          return (
            <Card key={macro} onPress={() => openGoalModal(macro)} elevation="sm" padding={SPACING.sm} style={styles.macroBox}>
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{MACRO_LABEL[macro]}</Text>
                <Text style={styles.macroValue}>
                  {fmt(value)}/{goals[macro]}{macro === "calories" ? " kcal" : " g"}
                </Text>
              </View>
              <View style={styles.macroProgressTrack}>
                <View style={[styles.macroSafeZone, { left: `${goalZoneLeft}%`, width: `${goalZoneWidth}%` }]} />
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      width: `${fillPct}%`,
                      backgroundColor: fillColor,
                    },
                  ]}
                />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.wheelContainer}>
        <Donut rings={rings} />
        <View style={styles.wheelCenterOverlay}>
          <Text style={styles.wheelCenterValue}>{trailing ? Math.round(trailing.calories) : "–"}</Text>
          <Text style={styles.wheelCenterLabel}>kcal/day</Text>
          <Text style={styles.wheelCenterLabel}>{trailing?.daysCounted ?? 0}/{TRAILING_DAYS} days</Text>
        </View>
      </View>
    </View>
  );
};
