import { View, ScrollView, Text } from "react-native";
import { useCalculator } from "./hooks/useCalculator";
import { styles } from "./calculatorStyles";

import { ConverterCard } from "./components/ConverterCard";
import { HeightConverterCard } from "./components/HeightConverterCard";
import { OneRepMaxCard } from "./components/OneRepMaxCard";

export default function CalculatorScreen() {
  const c = useCalculator();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.mainTitle}>Calculator</Text>

        <ConverterCard
          title="Weight"
          fromLabel="kg" fromValue={c.weightKg} onFromChange={c.updateWeightKg} fromSuffix="kg"
          toLabel="lb" toValue={c.weightLb} onToChange={c.updateWeightLb} toSuffix="lb"
        />

        <ConverterCard
          title="Energy"
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
          fromLabel="L" fromValue={c.volumeL} onFromChange={c.updateVolumeL} fromSuffix="L"
          toLabel="fl oz (US)" toValue={c.volumeFlOz} onToChange={c.updateVolumeFlOz} toSuffix="fl oz"
        />

        <OneRepMaxCard
          weight={c.ormWeight} onWeightChange={c.setOrmWeight}
          reps={c.ormReps} onRepsChange={c.setOrmReps}
        />
      </ScrollView>
    </View>
  );
}
