import React, { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { todayString, dmyToIso, isoToDmy } from "utils/dateUtils";
import { styles } from "styles/macroTrackerStyles";

const DatePicker = ({ selectedDate, setSelectedDate }) => {
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Move date forward/backward by N days
  const changeDate = (delta) => {
    const isoDate = dmyToIso(selectedDate);``
    const dateObj = new Date(isoDate);
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDate(isoToDmy(dateObj.toISOString().split("T")[0]));
  };

  const isToday = selectedDate === todayString();

  return (
    <>
      {/* Date Row */}
      <View style={styles.dateRow}>
        {/* Previous Day */}
        <Pressable
          onPress={() => changeDate(-1)}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <Text style={styles.buttonText}>◀</Text>
        </Pressable>

        {/* Selected Date */}
        <Pressable onPress={() => setCalendarVisible(true)}>
          <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
            {selectedDate}
          </Text>
        </Pressable>

        {/* Next Day */}
        <Pressable
          onPress={() => changeDate(1)}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <Text style={styles.buttonText}>▶</Text>
        </Pressable>

        {/* Today Button */}
        <Pressable
          onPress={() => setSelectedDate(todayString())}
          style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}
        >
          <Text style={styles.buttonText}>Today</Text>
        </Pressable>
      </View>

      {/* Calendar Modal */}
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

export default DatePicker;