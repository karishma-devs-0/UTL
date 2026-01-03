import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function YearlyCalendarPicker({
  value,
  onChange,
  minYear = 2000,
  maxYear = new Date().getFullYear(),
}) {
  const [visible, setVisible] = useState(false);

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const handlePrev = () => {
    const prev = value - 1;
    if (prev >= minYear) {
      onChange(prev);
    }
  };

  const handleNext = () => {
    const next = value + 1;
    const currentYear = new Date().getFullYear();
    if (next <= currentYear) {
      onChange(next);
    }
  };

  const isNextDisabled = value >= new Date().getFullYear();
  const isPrevDisabled = value <= minYear;

  return (
    <>
      {/* Header Trigger with Prev/Next */}
      <View style={styles.header}>
        <Pressable onPress={handlePrev} disabled={isPrevDisabled}>
          <Text style={[styles.navText, isPrevDisabled && { opacity: 0.3 }]}>
            ◀
          </Text>
        </Pressable>

        <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
          <Text style={styles.triggerText}>{value}</Text>
        </Pressable>

        <Pressable onPress={handleNext} disabled={isNextDisabled}>
          <Text style={[styles.navText, isNextDisabled && { opacity: 0.3 }]}>
            ▶
          </Text>
        </Pressable>
      </View>

      {/* Modal */}
      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.picker}>
            <Text style={styles.headerText}>Select Year</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {years.map((year) => {
                const selected = year === value;
                return (
                  <Pressable
                    key={year}
                    style={[styles.yearCell, selected && styles.selectedYear]}
                    onPress={() => {
                      onChange(year);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearText,
                        selected && styles.selectedYearText,
                      ]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.clearText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const currentYear = new Date().getFullYear();
                  onChange(currentYear);
                  setVisible(false);
                }}
              >
                <Text style={styles.thisYearText}>This year</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  navText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#101010ff",
    paddingHorizontal: 6,
  },
  trigger: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f0f0fff",
  },
  overlay: {
    flex: 1,
    backgroundColor: "#ffffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  picker: {
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1919ff",
    textAlign: "center",
    marginBottom: 8,
  },
  yearCell: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 4,
  },
  yearText: {
    fontSize: 14,
    color: "#111827",
  },
  selectedYear: {
    backgroundColor: "#2563eb",
  },
  selectedYearText: {
    color: "#fff",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  clearText: {
    fontSize: 13,
    color: "#fa2742",
  },
  thisYearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fa2742",
  },
});
