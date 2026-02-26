import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import MacroTrackerScreen from "screens/macroTrackerScreen";
import RepCounterScreen from "screens/repCounterScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, size }) => {
            let iconName;
            if (route.name === "Macros") {
              iconName = focused ? "restaurant" : "restaurant-outline";
            } else if (route.name === "Reps") {
              iconName = focused ? "barbell" : "barbell-outline";
            }
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