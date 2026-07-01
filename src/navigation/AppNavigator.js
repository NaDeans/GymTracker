import { Pressable } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "shared/constants/colors";
import { FONT_SIZE, FONT_WEIGHT, SHADOW } from "shared/constants/styles";
import { triggerSelection } from "shared/utils/haptics";

import MacroTrackerScreen from "features/macroTracker/MacroTrackerScreen";
import RepCounterScreen from "features/repCounter/RepCounterScreen";
import CalculatorScreen from "features/calculator/CalculatorScreen";

const TAB_ICONS = {
  Macros: { active: "restaurant", inactive: "restaurant-outline" },
  Reps: { active: "barbell", inactive: "barbell-outline" },
  Calculator: { active: "calculator", inactive: "calculator-outline" },
};

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarStyle: {
            backgroundColor: COLORS.surfaceRaised,
            borderTopWidth: 0,
            height: 64,
            paddingTop: 8,
            paddingBottom: 10,
            ...SHADOW.md,
          },
          tabBarLabelStyle: {
            fontSize: FONT_SIZE.xs,
            fontWeight: FONT_WEIGHT.medium,
          },
          tabBarButton: (props) => (
            <TabButton {...props} />
          ),
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={size + 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Macros" component={MacroTrackerScreen} />
        <Tab.Screen name="Reps" component={RepCounterScreen} />
        <Tab.Screen name="Calculator" component={CalculatorScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const TabButton = ({ onPress, ...props }) => (
  <Pressable
    {...props}
    onPress={(e) => {
      triggerSelection();
      onPress?.(e);
    }}
  />
);
