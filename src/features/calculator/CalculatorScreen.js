import { useRef } from "react";
import { View, ScrollView, Text, KeyboardAvoidingView, Platform } from "react-native";
import { useCalculator } from "./hooks/useCalculator";
import { createThemedStyles } from "./calculatorStyles";
import { useTheme } from "shared/hooks/useTheme";
import { KeyboardScrollProvider } from "shared/context/KeyboardScrollContext";

import { ConverterCard } from "./components/ConverterCard";
import { HeightConverterCard } from "./components/HeightConverterCard";
import { OneRepMaxCard } from "./components/OneRepMaxCard";

export default function CalculatorScreen() {
  const c = useCalculator();
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const scrollRef = useRef(null);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
      <KeyboardScrollProvider scrollRef={scrollRef}>
        <Text style={styles.mainTitle}>Calculator</Text>

        <ConverterCard
          title="Weight"
          icon="barbell" color={colors.primary}
          fromLabel="kg" fromValue={c.weightKg} onFromChange={c.updateWeightKg} fromSuffix="kg"
          toLabel="lb" toValue={c.weightLb} onToChange={c.updateWeightLb} toSuffix="lb"
        />

        <ConverterCard
          title="Energy"
          icon="flame" color={colors.chart.carbs}
          fromLabel="kcal" fromValue={c.energyKcal} onFromChange={c.updateEnergyKcal} fromSuffix="kcal"
          toLabel="kJ" toValue={c.energyKj} onToChange={c.updateEnergyKj} toSuffix="kJ"
        />

        <HeightConverterCard
          heightCm={c.heightCm} onCmChange={c.updateHeightCm}
          heightFt={c.heightFt} onFtChange={c.updateHeightFt}
          heightIn={c.heightIn} onInChange={c.updateHeightIn}
        />

        <ConverterCard
          title="Volume"
          icon="water" color={colors.chart.fats}
          fromLabel="mL" fromValue={c.volumeMl} onFromChange={c.updateVolumeMl} fromSuffix="mL"
          toLabel="cups" toValue={c.volumeCups} onToChange={c.updateVolumeCups} toSuffix="cups"
        />

        <OneRepMaxCard
          weight={c.ormWeight} onWeightChange={c.setOrmWeight}
          reps={c.ormReps} onRepsChange={c.setOrmReps}
        />
      </KeyboardScrollProvider>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
