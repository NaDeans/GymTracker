import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "shared/components/Card";
import { TextField } from "shared/components/TextField";
import { COLORS } from "shared/constants/colors";
import { styles } from "../calculatorStyles";

export const ConverterCard = ({
  title,
  icon,
  color = COLORS.primary,
  fromLabel,
  fromValue,
  onFromChange,
  fromSuffix,
  toLabel,
  toValue,
  onToChange,
  toSuffix,
}) => (
  <Card style={styles.card}>
    <View style={styles.cardTitleRow}>
      {icon && (
        <View style={styles.cardIconBadge}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
      )}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.fieldRow}>
      <View style={styles.fieldFlex}>
        <TextField
          label={fromLabel}
          value={fromValue}
          onChangeText={onFromChange}
          keyboardType="decimal-pad"
          placeholder="0"
          suffix={fromSuffix}
        />
      </View>
      <Ionicons name="swap-horizontal" size={20} color={color} style={styles.swapIcon} />
      <View style={styles.fieldFlex}>
        <TextField
          label={toLabel}
          value={toValue}
          onChangeText={onToChange}
          keyboardType="decimal-pad"
          placeholder="0"
          suffix={toSuffix}
        />
      </View>
    </View>
  </Card>
);
