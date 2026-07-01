import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Calendar } from "react-native-calendars";
import { todayString, dmyToIso, isoToDmy } from "shared/utils/dateUtils";
import { dayHasLog } from "shared/utils/streakUtils";
import { isGoalMet } from "../utils/macroUtils";
import { styles } from "../macroTrackerStyles";
import { Card } from "shared/components/Card";
import { IconButton } from "shared/components/IconButton";
import { Button } from "shared/components/Button";
import { ModalSheet } from "shared/components/ModalSheet";
import { COLORS } from "shared/constants/colors";

export default function DatePicker({ selectedDate, setSelectedDate, dailyLog, goals }) {
  const [calendarVisible, setCalendarVisible] = useState(false);

  const changeDate = (delta) => {
    const dateObj = new Date(dmyToIso(selectedDate));
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDate(isoToDmy(dateObj.toISOString().split("T")[0]));
  };

  const isToday = selectedDate === todayString();

  const markedDates = {};
  Object.keys(dailyLog).forEach((dmy) => {
    if (!dayHasLog(dailyLog, dmy)) return;
    const iso = dmyToIso(dmy);
    const goalMet = isGoalMet(dailyLog[dmy].totals, goals, true);
    markedDates[iso] = { dots: [{ color: goalMet ? COLORS.success : COLORS.primary }] };
  });

  const selectedIso = dmyToIso(selectedDate);
  markedDates[selectedIso] = { ...(markedDates[selectedIso] || {}), selected: true, selectedColor: COLORS.primary };

  return (
    <>
      <Card surface="raised" elevation="sm" padding={0} style={styles.dateCard}>
        <View style={styles.dateRow}>
          <IconButton icon="chevron-back" variant="ghost" size="sm" onPress={() => changeDate(-1)} />

          <Pressable style={styles.dateTextTouchable} onPress={() => setCalendarVisible(true)}>
            <Text style={[styles.dateText, isToday && styles.dateTextToday]}>{selectedDate}</Text>
          </Pressable>

          <IconButton icon="chevron-forward" variant="ghost" size="sm" onPress={() => changeDate(1)} />

          {!isToday && (
            <Button variant="secondary" size="sm" onPress={() => setSelectedDate(todayString())}>Today</Button>
          )}
        </View>
      </Card>

      <ModalSheet visible={calendarVisible} onClose={() => setCalendarVisible(false)} scrollable={false}>
        <Calendar
          current={dmyToIso(selectedDate)}
          markingType="multi-dot"
          onDayPress={(day) => {
            setSelectedDate(isoToDmy(day.dateString));
            setCalendarVisible(false);
          }}
          theme={{
            selectedDayBackgroundColor: COLORS.primary,
            todayTextColor: COLORS.primary,
            arrowColor: COLORS.primary,
          }}
          markedDates={markedDates}
        />
      </ModalSheet>
    </>
  );
}
