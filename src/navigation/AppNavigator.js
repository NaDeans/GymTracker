import { Pressable } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SIZE, FONT_WEIGHT, SHADOW } from "shared/constants/styles";
import { triggerSelection } from "shared/utils/haptics";
import { ThemeProvider } from "shared/context/ThemeContext";
import { useTheme } from "shared/hooks/useTheme";

import { MacroTrackerProvider } from "features/macroTracker/context/MacroTrackerContext";
import MacroTrackerScreen from "features/macroTracker/MacroTrackerScreen";
import SavedFoodsScreen from "features/macroTracker/SavedFoodsScreen";
import RecipesScreen from "features/recipes/RecipesScreen";

// Tab labels have to fit a 64px bar at FONT_SIZE.xs, so the route names stay
// short — the route name is the tab label.
const TAB_ICONS = {
  Macros: { active: "restaurant", inactive: "restaurant-outline" },
  Saved: { active: "bookmarks", inactive: "bookmarks-outline" },
  Recipes: { active: "book", inactive: "book-outline" },
};

const Tab = createBottomTabNavigator();

function NavigatorContent() {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surfaceRaised,
            borderTopWidth: 0,
            height: 64,
            paddingTop: 8,
            paddingBottom: 10,
            ...SHADOW.md,
          },
          tabBarLabelStyle: {
            fontSize: FONT_SIZE.xs,
            fontWeight: FONT_WEIGHT.medium,
            color: colors.textPrimary,
          },
          tabBarButton: (props) => (
            <TabButton {...props} />
          ),
          tabBarIcon: ({ focused, color, size }) => {
            // Guarded: an unmapped route name used to throw rather than just
            // render the wrong glyph.
            const icons = TAB_ICONS[route.name] || TAB_ICONS.Macros;
            const iconName = focused ? icons.active : icons.inactive;
            return <Ionicons name={iconName} size={size + 2} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Macros" component={MacroTrackerScreen} />
        <Tab.Screen name="Saved" component={SavedFoodsScreen} />
        <Tab.Screen name="Recipes" component={RecipesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  return (
    <ThemeProvider>
      {/* Above the navigator so Macros and Saved Foods share one instance of
          the macro state — two would each whole-blob save over the other. */}
      <MacroTrackerProvider>
        <NavigatorContent />
      </MacroTrackerProvider>
    </ThemeProvider>
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
