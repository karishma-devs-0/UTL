import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DatePicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);

  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const isNextDisabled =
    year > currentYear ||
    (year === currentYear && month > currentMonth) ||
    (year === currentYear && month === currentMonth && day >= currentDay);

  const selectDate = (d) => {
    onChange(new Date(year, month, d));
    setVisible(false);
  };

  const handlePrevDate = () => {
    const prev = new Date(value);
    prev.setDate(prev.getDate() - 1);
    onChange(prev);
  };

  const handleNextDate = () => {
    if (isNextDisabled) return;
    const next = new Date(value);
    next.setDate(next.getDate() + 1);
    onChange(next);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <>
      <View style={styles.header}>
        <Pressable onPress={handlePrevDate}>
          <Text style={styles.navText}>◀</Text>
        </Pressable>

        <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
          <Text style={styles.triggerText}>
            {MONTHS[month]} {day}, {year}
          </Text>
        </Pressable>

        <Pressable onPress={handleNextDate} disabled={isNextDisabled}>
          <Text style={[styles.navText, isNextDisabled && { opacity: 0.3 }]}>
            ▶
          </Text>
        </Pressable>
      </View>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.picker}>
            <View style={styles.yearHeader}>
              <Text style={styles.yearText}>
                {MONTHS[month]} {year}
              </Text>
            </View>

            <View style={styles.daysGrid}>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                const selected = d === day;
                return (
                  <Pressable
                    key={d}
                    onPress={() => selectDate(d)}
                    style={[styles.dayCell, selected && styles.selectedDay]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selected && styles.selectedDayText,
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  onChange(null);
                  setVisible(false);
                }}
              >
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  onChange(new Date());
                  setVisible(false);
                }}
              >
                <Text style={styles.thisMonthText}>Today</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const { width } = Dimensions.get("window");
const isSmallDevice = width < 360;
const isTablet = width >= 768;

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: isSmallDevice ? 10 : 14,
    paddingVertical: isSmallDevice ? 6 : 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  triggerText: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: "600",
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isSmallDevice ? 8 : 12,
  },
  navText: {
    fontSize: isTablet ? 22 : isSmallDevice ? 16 : 18,
    fontWeight: "700",
    color: "#0f0f0fff",
    paddingHorizontal: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    width: width * 0.85,
    maxWidth: isTablet ? 420 : 320,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingBottom: 8,
    elevation: Platform.OS === "android" ? 5 : 0,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  yearHeader: {
    padding: isSmallDevice ? 10 : 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  yearText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "700",
    color: "#111827",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: isSmallDevice ? 6 : 8,
  },
  dayCell: {
    width: "14.28%",
    paddingVertical: isTablet ? 14 : 10,
    alignItems: "center",
    borderRadius: 4,
  },
  dayText: {
    fontSize: isTablet ? 16 : isSmallDevice ? 13 : 14,
    color: "#111827",
  },
  selectedDay: {
    backgroundColor: "#fa2742",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: isSmallDevice ? 10 : 12,
    paddingTop: 8,
  },
  clearText: {
    color: "#fa2742",
    fontSize: isSmallDevice ? 12 : 13,
  },
  thisMonthText: {
    color: "#fa2742",
    fontSize: isSmallDevice ? 12 : 13,
    fontWeight: "600",
  },
});
