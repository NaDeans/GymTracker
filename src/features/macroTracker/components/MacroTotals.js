import { View, Text } from "react-native";
import { Donut } from "./Donut";
import { fmt } from "shared/utils/numberUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const MACRO_LABEL = { calories: "Calories", protein: "Protein", carbs: "Carbs", fats: "Fats" };

// The progress bar's full width represents 0 -> goal * BAR_MAX_RATIO, so the
// goal itself lands at 1/BAR_MAX_RATIO along the track (2/3 with 1.5), leaving
// room to visualize overshoot past the goal.
const BAR_MAX_RATIO = 1.5;
const GOAL_ZONE_RATIO_MIN = 0.9;
const GOAL_ZONE_RATIO_MAX = 1.1;

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};

const lerpColor = (hexA, hexB, t) => {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
};

// Proximity gradient: green at the goal, shifting through orange to red the
// further away `ratio` (value / goal) gets, in either direction.
const macroBarColor = (ratio, colors) => {
  const distance = Math.min(1, Math.abs(ratio - 1));
  if (distance <= 0.5) {
    return lerpColor(colors.success, colors.warning, distance / 0.5);
  }
  return lerpColor(colors.warning, colors.danger, (distance - 0.5) / 0.5);
};

export const MacroTotals = ({ totalMacros, goals, setEditingMacro, setGoalInput, setGoalModalVisible }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const totalSum = totalMacros.protein + totalMacros.carbs + totalMacros.fats;
  const goalZoneLeft = (GOAL_ZONE_RATIO_MIN / BAR_MAX_RATIO) * 100;
  const goalZoneWidth = ((GOAL_ZONE_RATIO_MAX - GOAL_ZONE_RATIO_MIN) / BAR_MAX_RATIO) * 100;

  const perc = totalSum
    ? {
        protein: Math.round((100 * totalMacros.protein) / totalSum),
        carbs: Math.round((100 * totalMacros.carbs) / totalSum),
        fats: Math.round((100 * totalMacros.fats) / totalSum),
      }
    : { protein: 0, carbs: 0, fats: 0 };

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
        {totalSum > 0 && (
          <>
            <Donut
              macros={totalMacros}
              size={140}
              strokeWidth={18}
              colors={{
                protein: colors.chart.protein,
                carbs: colors.chart.carbs,
                fats: colors.chart.fats,
                background: colors.chart.track,
              }}
            />
            <View style={styles.percOverlay}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.chart.protein }]} />
                <Text style={styles.percText}>P {perc.protein}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.chart.carbs }]} />
                <Text style={styles.percText}>C {perc.carbs}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: colors.chart.fats }]} />
                <Text style={styles.percText}>F {perc.fats}%</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
