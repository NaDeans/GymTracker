import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "shared/components/Card";
import { TextField } from "shared/components/TextField";
import { COLORS } from "shared/constants/colors";
import { styles } from "../calculatorStyles";

export const HeightConverterCard = ({
  heightCm,
  onCmChange,
  heightFt,
  onFtChange,
  heightIn,
  onInChange,
}) => (
  <Card style={styles.card}>
    <View style={styles.cardTitleRow}>
      <View style={styles.cardIconBadge}>
        <Ionicons name="resize" size={16} color={COLORS.success} />
      </View>
      <Text style={styles.cardTitle}>Height</Text>
    </View>
    <TextField
      label="cm"
      value={heightCm}
      onChangeText={onCmChange}
      keyboardType="decimal-pad"
      placeholder="0"
      suffix="cm"
    />
    <View style={styles.heightFtInRow}>
      <View style={styles.fieldFlex}>
        <TextField
          label="ft"
          value={heightFt}
          onChangeText={onFtChange}
          keyboardType="number-pad"
          placeholder="0"
          suffix="ft"
        />
      </View>
      <View style={styles.fieldFlex}>
        <TextField
          label="in"
          value={heightIn}
          onChangeText={onInChange}
          keyboardType="decimal-pad"
          placeholder="0"
          suffix="in"
        />
      </View>
    </View>
  </Card>
);
