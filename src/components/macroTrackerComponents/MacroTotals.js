import React from "react";
import { View, Text, Pressable } from "react-native";
import { Donut } from "./donut";
import { fmt } from "../../utils/numberUtils";
import { styles } from "../../styles/macroTrackerStyles";

export const MacroTotals = ({
  totalMacros,
  goals,
  setEditingMacro,
  setGoalInput,
  setGoalModalVisible
}) => {
  const totalSum =
    totalMacros.protein +
    totalMacros.carbs +
    totalMacros.fats;

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
      {/* Totals Column */}
      <View style={styles.totalsColumn}>
        {["calories", "protein", "carbs", "fats"].map((macro) => (
          <Pressable
            key={macro}
            onPress={() => openGoalModal(macro)}
            style={styles.macroBox}
          >
            <Text style={styles.macroText}>
              {macro === "calories"
                ? "Calories"
                : macro.charAt(0).toUpperCase() + macro.slice(1)}
              : {fmt(totalMacros[macro])}/{goals[macro]}
              {macro === "calories" ? " kcal" : " g"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Donut Wheel */}
      <View style={styles.wheelContainer}>
        {totalSum > 0 && (
          <>
            <Donut
              macros={totalMacros}
              size={140}
              strokeWidth={18}
              colors={{
                protein: "#e74c3c",
                carbs: "#f1c40f",
                fats: "#3498db",
                background: "#ddd",
              }}
            />
            <View style={styles.percOverlay}>
              <Text style={[styles.percText, styles.proteinColor]}>
                P {perc.protein}%
              </Text>
              <Text style={[styles.percText, styles.carbsColor]}>
                C {perc.carbs}%
              </Text>
              <Text style={[styles.percText, styles.fatsColor]}>
                F {perc.fats}%
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};