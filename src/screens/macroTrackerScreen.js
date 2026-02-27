// src/screens/MacroTrackerScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Alert } from "react-native";

// Components
import Donut from "components/donut";

// Hooks
import { useFoodLog } from "hooks/logs/useFoodLog";
import { useDailyLog } from "hooks/logs/useDailyLog";
import { useHistory } from "hooks/logs/useHistory";
import { useGPTNutrition } from "hooks/gpt/useGPTNutrition";
import { usePersistentState } from "hooks/persistent/usePersistentState";

// Utils
import { getTodayDDMMYY, convertDDMMYYtoISO, convertISOtoDDMMYY } from "utils/dateUtils";
import { parseNumberSafe, calculateTotalMacros, formatFoodName } from "utils/macroUtils";
import { roundToTwo } from "utils/numberUtils";
import { parseGPTJSONSafely, normalizeFoodItem } from "utils/gptUtils";

// Constants
import COLORS from "constants/colors";
import { SPACING, FONT_SIZE, BORDER_RADIUS, SHADOW, COMMON } from "constants/styles";




const MacroTrackerScreen = () => {
  <ScrollView
    contentContainerStyle={COMMON.container}
    keyboardShouldPersistTaps="handled"
    refreshControl={
      <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    }
  >
    {/* Title */}
    <Text style={[COMMON.title, { marginBottom: SPACING.large }]}>Macro Tracker</Text>

    {/* Date row */}
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.medium
    }}>
      <Pressable
        onPress={() => changeDate(-1)}
        style={({ pressed }) => [{ padding: SPACING.small }, pressed && { opacity: 0.6 }]}
      >
        <Text style={{ fontSize: FONT_SIZE.large }}>◀</Text>
      </Pressable>

      <Pressable
        onPress={() => setCalendarVisible(true)}
        style={{ flex: 1, alignItems: "center" }}
      >
        <Text style={{ fontSize: FONT_SIZE.medium, color: isToday ? COLORS.primary : COLORS.text }}>
          {selectedDate}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => changeDate(1)}
        style={({ pressed }) => [{ padding: SPACING.small }, pressed && { opacity: 0.6 }]}
      >
        <Text style={{ fontSize: FONT_SIZE.large }}>▶</Text>
      </Pressable>

      <Pressable
        onPress={() => setSelectedDate(today)}
        style={({ pressed }) => [{ marginLeft: SPACING.small, padding: SPACING.small }, pressed && { opacity: 0.6 }]}
      >
        <Text style={{ fontSize: FONT_SIZE.medium }}>Today</Text>
      </Pressable>
    </View>
  </ScrollView>
}