import { View, Text } from "react-native";
import { Donut } from "./Donut";
import { fmt } from "shared/utils/numberUtils";
import { styles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { COLORS } from "shared/constants/colors";

const MACRO_COLOR = {
  calories: COLORS.primary,
  protein: COLORS.chart.protein,
  carbs: COLORS.chart.carbs,
  fats: COLORS.chart.fats,
};

const MACRO_LABEL = { calories: "Calories", protein: "Protein", carbs: "Carbs", fats: "Fats" };

export const MacroTotals = ({ totalMacros, goals, setEditingMacro, setGoalInput, setGoalModalVisible }) => {
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
          const pct = Math.min(100, (value / goal) * 100);
          const color = MACRO_COLOR[macro];
          return (
            <Card key={macro} onPress={() => openGoalModal(macro)} elevation="sm" style={styles.macroBox}>
              <Text style={styles.macroText}>
                {MACRO_LABEL[macro]}: {fmt(value)}/{goals[macro]}{macro === "calories" ? " kcal" : " g"}
              </Text>
              <View style={styles.macroProgressTrack}>
                <View style={[styles.macroProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
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
                protein: COLORS.chart.protein,
                carbs: COLORS.chart.carbs,
                fats: COLORS.chart.fats,
                background: COLORS.chart.track,
              }}
            />
            <View style={styles.percOverlay}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.chart.protein }]} />
                <Text style={styles.percText}>P {perc.protein}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.chart.carbs }]} />
                <Text style={styles.percText}>C {perc.carbs}%</Text>
              </View>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.chart.fats }]} />
                <Text style={styles.percText}>F {perc.fats}%</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
};
