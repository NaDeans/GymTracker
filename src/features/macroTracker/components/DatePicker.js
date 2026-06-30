import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { todayString, dmyToIso, isoToDmy } from "shared/utils/dateUtils";
import { styles } from "../macroTrackerStyles";

export default function DatePicker({ selectedDate, setSelectedDate }) {
  const [calendarVisible, setCalendarVisible] = useState(false);

  const changeDate = (delta) => {
    const dateObj = new Date(dmyToIso(selectedDate));
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDate(isoToDmy(dateObj.toISOString().split("T")[0]));
  };

  const isToday = selectedDate === todayString();

  return (
    <>
      <View style={styles.dateRow}>
        <Pressable onPress={() => changeDate(-1)} style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
          <Text style={styles.buttonText}>◀</Text>
        </Pressable>

        <Pressable onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateText, isToday && styles.dateTextToday]}>{selectedDate}</Text>
        </Pressable>

        <Pressable onPress={() => changeDate(1)} style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}>
          <Text style={styles.buttonText}>▶</Text>
        </Pressable>

        <Pressable onPress={() => setSelectedDate(todayString())} style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}>
          <Text style={styles.buttonText}>Today</Text>
        </Pressable>
      </View>

      <Modal visible={calendarVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setCalendarVisible(false)}>
          <View style={styles.modalContainer}>
            <Calendar
              current={dmyToIso(selectedDate)}
              onDayPress={(day) => {
                setSelectedDate(isoToDmy(day.dateString));
                setCalendarVisible(false);
              }}
              markedDates={{
                [dmyToIso(selectedDate)]: { selected: true, selectedColor: "#3498db" },
                [dmyToIso(todayString())]: { marked: true, dotColor: "green" },
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
