import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "shared/components/Card";
import { TextField } from "shared/components/TextField";
import { fmt } from "shared/utils/numberUtils";
import { calculateEpley1RM, parseInput } from "../utils/conversionUtils";
import { createThemedStyles } from "../calculatorStyles";
import { useTheme } from "shared/hooks/useTheme";

const HIGH_REP_WARNING_THRESHOLD = 12;

export const OneRepMaxCard = ({ weight, onWeightChange, reps, onRepsChange }) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const weightNum = parseInput(weight);
  const repsNum = parseInput(reps);
  const hasResult = weightNum !== null && repsNum !== null && weightNum > 0 && repsNum > 0;
  const result = hasResult ? fmt(calculateEpley1RM(weightNum, repsNum)) : "--";
  const isHighReps = repsNum !== null && repsNum > HIGH_REP_WARNING_THRESHOLD;

  return (
    <Card style={styles.card}>
      <View style={styles.cardTitleRow}>
        <View style={styles.cardIconBadge}>
          <Ionicons name="trophy" size={16} color={colors.chart.protein} />
        </View>
        <Text style={styles.cardTitle}>1-Rep Max Estimator</Text>
      </View>
      <View style={styles.fieldRow}>
        <View style={styles.fieldFlex}>
          <TextField
            label="Weight"
            value={weight}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        <View style={styles.fieldFlex}>
          <TextField
            label="Reps"
            value={reps}
            onChangeText={onRepsChange}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
      </View>
      <View style={styles.ormResultBox}>
        <Text style={styles.ormResultLabel}>Estimated 1RM</Text>
        <Text style={styles.ormResultValue}>{result}</Text>
      </View>
      <Text style={[styles.ormCaption, isHighReps && styles.ormCaptionWarn]}>
        Estimate only — accuracy decreases above ~{HIGH_REP_WARNING_THRESHOLD} reps
      </Text>
    </Card>
  );
};
