import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import MacroTrackerScreen from "features/macroTracker/MacroTrackerScreen";
import RepCounterScreen from "features/repCounter/RepCounterScreen";

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, size }) => {
            const iconName =
              route.name === "Macros"
                ? focused ? "restaurant" : "restaurant-outline"
                : focused ? "barbell" : "barbell-outline";
            return <Ionicons name={iconName} size={size} />;
          },
        })}
      >
        <Tab.Screen name="Macros" component={MacroTrackerScreen} />
        <Tab.Screen name="Reps" component={RepCounterScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
