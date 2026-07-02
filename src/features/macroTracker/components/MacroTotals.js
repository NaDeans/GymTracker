import { View, Text } from "react-native";
import { Donut } from "./Donut";
import { fmt } from "shared/utils/numberUtils";
import { createThemedStyles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { SPACING } from "shared/constants/styles";
import { useTheme } from "shared/hooks/useTheme";

const MACRO_LABEL = { calories: "Calories", protein: "Protein", carbs: "Carbs", fats: "Fats" };

export const MacroTotals = ({ totalMacros, goals, setEditingMacro, setGoalInput, setGoalModalVisible }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const MACRO_COLOR = {
    calories: colors.primary,
    protein: colors.chart.protein,
    carbs: colors.chart.carbs,
    fats: colors.chart.fats,
  };
  const totalSum = totalMacros.protein + totalMacros.carbs + totalMacros.fats;

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
          const pct = (value / goal) * 100;
          const displayPct = Math.min(150, pct);
          const color = MACRO_COLOR[macro];
          const isOvershot = pct > 100;

          return (
            <Card key={macro} onPress={() => openGoalModal(macro)} elevation="sm" padding={SPACING.sm} style={styles.macroBox}>
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{MACRO_LABEL[macro]}</Text>
                <Text style={styles.macroValue}>
                  {fmt(value)}/{goals[macro]}{macro === "calories" ? " kcal" : " g"}
                </Text>
              </View>
              <View style={styles.macroProgressTrack}>
                <View style={[styles.macroSafeZone, { left: `${(90 / 150) * 100}%`, width: `${(20 / 150) * 100}%` }]} />
                <View
                  style={[
                    styles.macroProgressFill,
                    {
                      width: `${displayPct}%`,
                      backgroundColor: isOvershot ? colors.danger : color,
                      opacity: isOvershot ? 0.7 : 1,
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
