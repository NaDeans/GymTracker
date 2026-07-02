import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "shared/components/Card";
import { TextField } from "shared/components/TextField";
import { createThemedStyles } from "../calculatorStyles";
import { useTheme } from "shared/hooks/useTheme";

export const ConverterCard = ({
  title,
  icon,
  color,
  fromLabel,
  fromValue,
  onFromChange,
  fromSuffix,
  toLabel,
  toValue,
  onToChange,
  toSuffix,
}) => {
  const { colors } = useTheme();
  const styles = createThemedStyles(colors);
  const iconColor = color || colors.primary;

  return (
    <Card style={styles.card}>
      <View style={styles.cardTitleRow}>
        {icon && (
          <View style={styles.cardIconBadge}>
            <Ionicons name={icon} size={16} color={iconColor} />
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
        <Ionicons name="swap-horizontal" size={20} color={iconColor} style={styles.swapIcon} />
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
};
