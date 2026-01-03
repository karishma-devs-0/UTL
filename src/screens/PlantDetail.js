import React, { useState, useEffect, useCallback } from "react";

import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dataManager from "../utils/dataManager";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { formatDate, formatPower, formatEnergy } from "../utils/formatters";
import InfoCard from "../componenst/InfoCard";
import { COLORS } from "../constants/colors";
import CircularProgress from "../componenst/CircularProgress";
import { Calendar } from "react-native-calendars";
import deviceService from "../services/deviceService";
import { LineChart, BarChart } from "react-native-chart-kit";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import apiClient from "../utils/api-native";
import {
  apiGetplantdashboard,
  getPlantStatus,
} from "@/utils/services/plantDetailService";
import { PlantsMonthlyPVBarChart } from "@/componenst/Plants_Chart/PlantsMonthly";
import { PlantsYearlyPVBarChart } from "@/componenst/Plants_Chart/PlantsYearly";
import { PlantsDailyBarPVChart } from "@/componenst/Plants_Chart/PlantsDaily";
import { PlantsTotalPVBarChart } from "@/componenst/Plants_Chart/PlantsTotal";
import { MonthPicker } from "@/componenst/Plants_Chart/MonthlyCalender";
import { YearlyCalendarPicker } from "@/componenst/Plants_Chart/YearlyCalender";
import EnvironmentalBenefitsCard from "@/componenst/Plants_Chart/EnvironmentCard";
import DatePicker from "@/componenst/Plants_Chart/DateCalender";

// Chart dataset validation utility
const validateChartData = (chartData) => {
  if (!chartData || typeof chartData !== "object") {
    console.warn("[Chart Validation] Invalid chart data: not an object");
    return false;
  }

  if (!Array.isArray(chartData.labels)) {
    console.warn(
      "[Chart Validation] Invalid chart data: labels is not an array"
    );
    return false;
  }

  if (!Array.isArray(chartData.datasets)) {
    console.warn(
      "[Chart Validation] Invalid chart data: datasets is not an array"
    );
    return false;
  }

  if (chartData.labels.length === 0) {
    console.warn("[Chart Validation] Invalid chart data: empty labels array");
    return false;
  }

  // Minimum 2 data points required for valid SVG path generation
  // if (chartData.labels.length < 2) {
  //   console.warn(
  //     "[Chart Validation] Invalid chart data: need at least 2 data points for SVG path"
  //   );
  //   return false;
  // }

  if (chartData.labels.length < 2) {
    console.warn(
      "[Chart Validation] Invalid chart data: need at least 2 data points for SVG path"
    );
    return false;
  }

  for (const dataset of chartData.datasets) {
    if (!Array.isArray(dataset.data)) {
      console.warn(
        "[Chart Validation] Invalid chart data: dataset.data is not an array"
      );
      return false;
    }

    if (dataset.data.length !== chartData.labels.length) {
      console.warn(
        "[Chart Validation] Invalid chart data: data length does not match labels length"
      );
      return false;
    }

    // Check for valid numeric data and ensure no consecutive nulls that could break SVG paths
    let validDataCount = 0;
    let consecutiveNulls = 0;

    for (let i = 0; i < dataset.data.length; i++) {
      const val = dataset.data[i];

      if (val === null || val === undefined) {
        consecutiveNulls++;
        // Too many consecutive nulls can break SVG path generation
        if (consecutiveNulls > Math.floor(dataset.data.length / 2)) {
          console.warn(
            `[Chart Validation] Too many consecutive null values at index ${i}`
          );
          return false;
        }
      } else {
        consecutiveNulls = 0;

        if (isNaN(val) || typeof val !== "number") {
          console.warn(
            `[Chart Validation] Invalid chart data: data point at index ${i} is not a valid number: ${val}`
          );
          return false;
        }

        // Check for extreme values that could cause SVG issues
        if (!isFinite(val) || Math.abs(val) > 1e15) {
          console.warn(
            `[Chart Validation] Invalid chart data: extreme value at index ${i}: ${val}`
          );
          return false;
        }

        validDataCount++;
      }
    }

    // Ensure we have enough valid data points for meaningful chart
    if (validDataCount < 1) {
      console.warn(
        "[Chart Validation] Invalid chart data: no valid data points found"
      );
      return false;
    }
  }

  return true;
};

// Sanitize chart data specifically for LineChart to prevent SVG path errors
const sanitizeLineChartData = (chartData) => {
  if (!chartData || !chartData.datasets || !chartData.datasets[0]) {
    return chartData;
  }

  const dataset = chartData.datasets[0];
  const originalData = dataset.data || [];

  // Replace any problematic values with 0 and ensure finite numbers
  const sanitizedData = originalData.map((value, index) => {
    if (
      value === null ||
      value === undefined ||
      isNaN(value) ||
      !isFinite(value)
    ) {
      console.warn(
        `[LineChart Sanitization] Replacing invalid value at index ${index}: ${value} with 0`
      );
      return 0;
    }

    // Clamp extremely large values that could cause SVG issues
    if (Math.abs(value) > 1e12) {
      console.warn(
        `[LineChart Sanitization] Clamping extreme value at index ${index}: ${value}`
      );
      return value > 0 ? 1e12 : -1e12;
    }

    return Number(value);
  });

  return {
    ...chartData,
    datasets: [
      {
        ...dataset,
        data: sanitizedData,
        // Also sanitize visualData if it exists
        ...(chartData.visualData && {
          visualData: chartData.visualData.map((value) => {
            if (
              value === null ||
              value === undefined ||
              isNaN(value) ||
              !isFinite(value)
            ) {
              return 0;
            }
            return Math.abs(value) > 1e12
              ? value > 0
                ? 1e12
                : -1e12
              : Number(value);
          }),
        }),
      },
    ],
  };
};

// Sanitize chart data specifically for BarChart to prevent SVG path errors
const sanitizeBarChartData = (chartData) => {
  if (!chartData || !chartData.datasets || !chartData.datasets[0]) {
    return chartData;
  }

  const dataset = chartData.datasets[0];
  const originalData = dataset.data || [];

  // Replace any problematic values with 0 and ensure finite numbers
  const sanitizedData = originalData.map((value, index) => {
    if (
      value === null ||
      value === undefined ||
      isNaN(value) ||
      !isFinite(value)
    ) {
      console.warn(
        `[BarChart Sanitization] Replacing invalid value at index ${index}: ${value} with 0`
      );
      return 0;
    }

    // Clamp extremely large values that could cause SVG issues
    if (Math.abs(value) > 1e12) {
      console.warn(
        `[BarChart Sanitization] Clamping extreme value at index ${index}: ${value}`
      );
      return value > 0 ? 1e12 : -1e12;
    }

    // Ensure non-negative values for bar charts (negative bars can cause SVG issues)
    if (value < 0) {
      console.warn(
        `[BarChart Sanitization] Converting negative value to 0 at index ${index}: ${value}`
      );
      return 0;
    }

    return Number(value);
  });

  return {
    ...chartData,
    datasets: [
      {
        ...dataset,
        data: sanitizedData,
      },
    ],
  };
};

//TODO: Plant Details

// Use the same storage key as in dataManager.js
const PLANTS_STORAGE_KEY = "plants";

// Calculate card width based on screen width and consistent margin
const screenWidth = Dimensions.get("window").width;
const cardMargin = 16; // Corrected margin to 16
const totalSpacing = cardMargin * 2;
const cardWidth = screenWidth - totalSpacing;

// Helper function to format energy values (convert kWh to MWh if > 1000)
const formatEnergyWithUnit = (value) => {
  if (!value || value === "--" || isNaN(value)) {
    return { value: "--", unit: "kWh" };
  }

  const numValue = Number(value);
  //const units = ['kWh', 'MWh', 'GWh', 'TWh'];
  const units = ["MWh", "GWh", "TWh"];
  let unitIndex = 0;
  let scaledValue = numValue;

  // 🔸 Special rule: 0–1000 → show as (value / 1000) kWh
  if (numValue > 0 && numValue < 1000) {
    //scaledValue = numValue / 1000;
    return {
      value: scaledValue.toFixed(2),
      unit: "kWh",
    };
  }

  // 🔸 Default scaling rule (same as your original code)
  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  return {
    value: scaledValue.toFixed(2),
    unit: units[unitIndex - 1],
  };
};

// Add PLANT_DAY_PARAMETERS configuration
const PLANT_DAY_PARAMETERS = {
  productionPower: {
    label: "Production Power",
    dataExtractor: (item) => parseFloat(item.PvProduction), // Use raw Watts for chart
    summaryExtractor: (item) => parseFloat(item.PvProduction), // Keep in W for summary
    summaryUnit: "W",
    summaryDecimalPlaces: 0,
  },
  voltage: {
    label: "Voltage",
    dataExtractor: (item) => parseFloat(item.voltage),
    summaryExtractor: (item) => parseFloat(item.voltage),
    summaryUnit: "V",
    summaryDecimalPlaces: 1,
  },
  current: {
    label: "Current",
    dataExtractor: (item) => parseFloat(item.current),
    summaryExtractor: (item) => parseFloat(item.current),
    summaryUnit: "A",
    summaryDecimalPlaces: 1,
  },
  temperature: {
    label: "Temperature",
    dataExtractor: (item) => parseFloat(item.temperature),
    summaryExtractor: (item) => parseFloat(item.temperature),
    summaryUnit: "°C",
    summaryDecimalPlaces: 1,
  },
};

// Add missing parameter objects for Month, Year, and Total
const PLANT_MONTH_PARAMETERS = PLANT_DAY_PARAMETERS;
const PLANT_YEAR_PARAMETERS = PLANT_DAY_PARAMETERS;
const PLANT_TOTAL_PARAMETERS = PLANT_DAY_PARAMETERS;

// Constants for tooltip
const TOOLTIP_WIDTH = 100;
const TOOLTIP_HEIGHT = 45;
const ARROW_HEIGHT = 8;
const VERTICAL_OFFSET = TOOLTIP_HEIGHT + ARROW_HEIGHT + 5;

const DetailedChartModal = ({ visible, onClose, plant }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.modalCloseText, { color: "#00BCD4" }]}>
                Close
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Production Details</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalScrollView}>
            {/* Chart Section */}
            <View style={styles.chartDetailContainer}>
              <CircularProgress
                monthlyProduction={plant?.monthlyProduction || 0}
                totalCapacity={plant?.capacityKWp || plant?.capacity || 0}
                plants={[plant]}
              />

              {/* Legend */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#e0f2f1" }]}
                  />
                  <Text style={styles.legendText}>Production</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#e0f2f1" }]}
                  />
                  <Text style={styles.legendText}>Remaining</Text>
                </View>
              </View>
            </View>

            {/* Chart Info Section */}
            <View style={styles.chartInfoContainer}>
              <Text style={styles.chartInfoText}>
                {(() => {
                  const formatted = formatEnergyWithUnit(
                    plant?.monthlyProduction || "0.00"
                  );
                  return `Monthly Production: ${formatted.value} ${formatted.unit}`;
                })()}
              </Text>
              <Text style={styles.chartInfoText}>
                Total Capacity: {plant?.capacity || "0.00"} kWp
              </Text>
              <Text style={styles.efficiencyText}>
                Current Efficiency: {plant?.efficiency || "0"}%
              </Text>
            </View>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Production Power</Text>
                <Text style={styles.statValue}>
                  {/* plant.solar_power from API is in Watts for deviceService.getDailyPowerForPlant
                  Display as is or convert to W if needed by design. */}
                  {plant?.solar_power !== undefined &&
                  plant?.solar_power !== null &&
                  plant?.solar_power !== "--"
                    ? parseFloat(plant.solar_power).toFixed(2)
                    : "--"}
                  {/* Unit consistency: If solar_power is kW, display kW. If you want W, multiply by 1000. */}
                  <Text style={styles.statUnit}> kW</Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Capacity</Text>
                <Text style={styles.statValue}>
                  {plant?.capacity !== undefined && plant?.capacity !== null
                    ? parseFloat(plant.capacity).toFixed(2)
                    : "--"}
                  <Text style={styles.statUnit}> kWp</Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Daily Production</Text>
                <Text style={styles.statValue}>
                  {(() => {
                    if (
                      plant?.daily_production === undefined ||
                      plant?.daily_production === null ||
                      plant?.daily_production === "--"
                    ) {
                      return "--";
                    }
                    const formatted = formatEnergyWithUnit(
                      plant.daily_production
                    );
                    return formatted.value;
                  })()}
                  <Text style={styles.statUnit}>
                    {" "}
                    {(() => {
                      if (
                        plant?.daily_production === undefined ||
                        plant?.daily_production === null ||
                        plant?.daily_production === "--"
                      ) {
                        return "kWh";
                      }
                      return formatEnergyWithUnit(plant.daily_production).unit;
                    })()}
                  </Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Monthly Production</Text>
                <Text style={styles.statValue}>
                  {(() => {
                    if (
                      plant?.monthlyProduction === undefined ||
                      plant?.monthlyProduction === null ||
                      plant?.monthlyProduction === "--"
                    ) {
                      return "--";
                    }
                    const formatted = formatEnergyWithUnit(
                      plant.monthlyProduction
                    );
                    return formatted.value;
                  })()}
                  <Text style={styles.statUnit}>
                    {" "}
                    {(() => {
                      if (
                        plant?.monthlyProduction === undefined ||
                        plant?.monthlyProduction === null ||
                        plant?.monthlyProduction === "--"
                      ) {
                        return "kWh";
                      }
                      return formatEnergyWithUnit(plant.monthlyProduction).unit;
                    })()}
                  </Text>
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Yearly Production</Text>
                <Text style={styles.statValue}>
                  {(() => {
                    if (
                      plant?.yearlyProduction === undefined ||
                      plant?.yearlyProduction === null ||
                      plant?.yearlyProduction === "--"
                    ) {
                      return "--";
                    }
                    //console.log('formatEnergyWithUnit input value:', plant.yearlyProduction);
                    const formatted = formatEnergyWithUnit(
                      plant.yearlyProduction
                    );
                    console.log(
                      "Yearly Production raw:",
                      plant.yearlyProduction,
                      "formatted:",
                      formatted
                    );
                    return formatted.value;
                  })()}
                  <Text style={styles.statUnit}>
                    {" "}
                    {(() => {
                      if (
                        plant?.yearlyProduction === undefined ||
                        plant?.yearlyProduction === null ||
                        plant?.yearlyProduction === "--"
                      ) {
                        return "kWh";
                      }
                      return formatEnergyWithUnit(plant.yearlyProduction).unit;
                    })()}
                  </Text>
                </Text>
              </View>
              <View style={[styles.statItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.statLabel}>Total Production</Text>
                <Text style={styles.statValue}>
                  {(() => {
                    if (
                      plant?.totalProduction === undefined ||
                      plant?.totalProduction === null ||
                      plant?.totalProduction === "--"
                    ) {
                      return "--";
                    }
                    const formatted = formatEnergyWithUnit(
                      plant.totalProduction
                    );
                    return formatted.value;
                  })()}
                  <Text style={styles.statUnit}>
                    {" "}
                    {(() => {
                      if (
                        plant?.totalProduction === undefined ||
                        plant?.totalProduction === null ||
                        plant?.totalProduction === "--"
                      ) {
                        return "kWh";
                      }
                      return formatEnergyWithUnit(plant.totalProduction).unit;
                    })()}
                  </Text>
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const MenuModal = ({ visible, onClose, navigation, plant }) => {
  const plantIdSafe = plant?._id || plant?.id;

  const handleDeletePlant = async () => {
    onClose();
    if (!plantIdSafe) {
      Alert.alert("Error", "Cannot delete, plant ID is missing.");
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${plant?.name || "this plant"}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deviceService.deletePlant(plantIdSafe);

            if (result.success) {
              Alert.alert("Success", "Plant deleted successfully.");
              await dataManager.removeFromLocalPlantCache(plantIdSafe);
              navigation.goBack();
            } else {
              console.error(
                `Failed to delete plant ${plantIdSafe}:`,
                result.error
              );
              Alert.alert(
                "Error",
                result.error || "Failed to delete plant. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const menuOptions = [
    {
      icon: "add-circle-outline",
      text: "Add Datalogger",
      onPress: () => {
        onClose();
        navigation.navigate("AddDatalogger", { plantId: plantIdSafe });
      },
    },
    {
      icon: "edit",
      text: "Edit Plant",
      onPress: () => {
        onClose();
        navigation.navigate("AddPlant", {
          editMode: true,
          plantData: plant,
        });
      },
    },
    {
      icon: "delete-outline",
      text: "Delete Plant",
      textColor: "#FF3B30",
      onPress: handleDeletePlant,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Plant Options</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuOption,
                  index === menuOptions.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={option.onPress}
              >
                <Icon
                  name={option.icon}
                  size={24}
                  color={option.textColor || "#333"}
                />
                <Text
                  style={[
                    styles.menuOptionText,
                    option.textColor && { color: option.textColor },
                  ]}
                >
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const PlantDetailScreen = ({ route, navigation }) => {
  const { plantId } = route.params || {};
  const [dayLatestNonZeroPowerWatts, setDayLatestNonZeroPowerWatts] =
    useState(null);
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [plantStatus, setPlantStatus] = useState({
    color: "#9E9E9E",
    icon: "help",
    text: "Loading...",
  });
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [pickerMode, setPickerMode] = useState("date");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProductionTab, setSelectedProductionTab] = useState("Day");
  const [plantDayRawData, setPlantDayRawData] = useState(null);

  // Add missing state variables for plant day parameters
  const [selectedPlantDayParameterId, setSelectedPlantDayParameterId] =
    useState("productionPower");
  const [isPlantDayParameterModalVisible, setPlantDayParameterModalVisible] =
    useState(false);
  const [tempSelectedPlantDayParameterId, setTempSelectedPlantDayParameterId] =
    useState("productionPower");
  const [plantDaySummaryValue, setPlantDaySummaryValue] = useState("--");
  const [plantDaySummaryUnit, setPlantDaySummaryUnit] = useState(
    PLANT_DAY_PARAMETERS.productionPower.summaryUnit
  );

  // Add missing state variables for other tabs
  const [selectedPlantMonthParameterId, setSelectedPlantMonthParameterId] =
    useState("productionPower");
  const [selectedPlantYearParameterId, setSelectedPlantYearParameterId] =
    useState("productionPower");
  const [selectedPlantTotalParameterId, setSelectedPlantTotalParameterId] =
    useState("productionPower");
  const [plantMonthSummaryValue, setPlantMonthSummaryValue] = useState("--");
  const [plantMonthSummaryUnit, setPlantMonthSummaryUnit] = useState("");
  const [plantYearSummaryValue, setPlantYearSummaryValue] = useState("--");
  const [plantYearSummaryUnit, setPlantYearSummaryUnit] = useState("");
  const [plantTotalSummaryValue, setPlantTotalSummaryValue] = useState("--");
  const [plantTotalSummaryUnit, setPlantTotalSummaryUnit] = useState("");

  // State for chart data, loading, and errors
  const [dayChartData, setDayChartData] = useState(null);
  const [monthChartData, setMonthChartData] = useState(null);
  const [yearChartData, setYearChartData] = useState(null);
  const [totalChartData, setTotalChartData] = useState(null);

  const [isDayChartLoading, setIsDayChartLoading] = useState(false);
  const [isMonthChartLoading, setIsMonthChartLoading] = useState(false);
  const [isYearChartLoading, setIsYearChartLoading] = useState(false);
  const [isTotalChartLoading, setIsTotalChartLoading] = useState(false);

  const [dayChartError, setDayChartError] = useState(null);
  const [monthChartError, setMonthChartError] = useState(null);
  const [yearChartError, setYearChartError] = useState(null);
  const [totalChartError, setTotalChartError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State for daily summary specific to the selected date
  const [selectedDayProduction, setSelectedDayProduction] = useState(null);
  const [selectedDayPeakHours, setSelectedDayPeakHours] = useState(null);

  // Tooltip State
  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: null,
    label: "",
  });

  // Selected bar highlighting state
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);
  const [selectedBarChartType, setSelectedBarChartType] = useState(null);

  // NEW STATE VARIABLES
  const [calculatedDailyProductionKWh, setCalculatedDailyProductionKWh] =
    useState(null);
  const [peakPowerWatts, setPeakPowerWatts] = useState(null);
  const [peakPowerTime, setPeakPowerTime] = useState(null);
  const [selectedDotIndex, setSelectedDotIndex] = useState(null);

  const [plantDashboardData, setPlantDashboardData] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // Add a new state to track overall loading
  const [isOverallLoading, setIsOverallLoading] = useState(true);

  // Modify the loading states to be more specific
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Add function to fetch dashboard data
  const fetchPlantDashboardData = useCallback(async () => {
    if (!plantId) return;

    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      //TODO: API CALL
      const response = await apiGetplantdashboard(plantId);
      //const response = await axios.get(`https://utlsolarrms.com/api/plantdashboard?id=${plantId}`);

      if (response.data && response.data.length > 0) {
        setPlantDashboardData(response.data[0]);
      } else {
        setDashboardError("No dashboard data available");
      }
    } catch (error) {
      console.error("Error fetching plant dashboard:", error);
      setDashboardError(error.message || "Failed to fetch dashboard data");
    } finally {
      setIsDashboardLoading(false);
    }
  }, [plantId]);

  // Add useEffect to fetch dashboard data
  useEffect(() => {
    fetchPlantDashboardData();
  }, [fetchPlantDashboardData]);

  // Function to clear tooltip and selection
  const clearTooltipAndSelection = useCallback(() => {
    setTooltipPos({ x: 0, y: 0, visible: false, value: null, label: "" });
    setSelectedBarIndex(null);
    setSelectedBarChartType(null);
    setSelectedDotIndex(null);
  }, []);

  // Function to handle bar chart click
  const handleBarChartClick = useCallback((event, chartType) => {
    // This function can be used to handle bar clicks if needed
    // For now, it's a placeholder to prevent the error
    // You can add custom logic here to show tooltips or highlight bars
    console.log(`Bar chart clicked: ${chartType}`, event);
  }, []);

  // Function to fetch plant status
  const fetchPlantStatus = useCallback(async () => {
    if (!plant) return;

    const currentPlantId = plant._id || plant.id;

    try {
      //TODO: API CALL
      const response = await getPlantStatus();
      //const response = await fetch('https://utlsolarrms.com/api/plantStatus');
      const data = await response.json();

      if (data.success) {
        if (data.data.incomplete.plantIds.includes(currentPlantId)) {
          setPlantStatus({
            color: COLORS.success || "#4CAF50", // Green color for consistency
            icon: "eco", // Leaf icon for incomplete
            text: "Incomplete Plants",
          });
        } else if (data.data.offline.plantIds.includes(currentPlantId)) {
          setPlantStatus({
            color: COLORS.warning || "#FF9800", // Orange/Warning color
            icon: "power-off", // Power icon for offline
            text: "Offline",
          });
        } else if (
          data.data.partiallyOffline.plantIds.includes(currentPlantId)
        ) {
          setPlantStatus({
            color: COLORS.info || "#2196F3", // Blue/Info color
            icon: "signal-wifi-statusbar-connected-no-internet-4", // WiFi with warning for partially offline
            text: "Partially Offline",
          });
        } else if (data.data.online.plantIds.includes(currentPlantId)) {
          setPlantStatus({
            color: COLORS.success || "#4CAF50", // Green color
            icon: "check-circle-outline", // Checkmark for online
            text: "Online",
          });
        } else {
          setPlantStautlsolarrmstus({
            color: "#9E9E9E",
            icon: "help",
            text: "Unknown",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching plant status:", error);
      setPlantStatus({ color: "#9E9E9E", icon: "help", text: "Error" });
    }
  }, [plant]);

  // Effect to fetch plant status when plant data changes
  useEffect(() => {
    fetchPlantStatus();
  }, [fetchPlantStatus]);

  // Helper function to get status info - now just returns the state
  const getStatusInfo = () => {
    if (!plant) {
      return { color: "#9E9E9E", icon: "help", text: "No Data" };
    }
    return plantStatus;
  };

  // Hook to make sure we load data when this screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (plantId) {
        fetchPlantDetails();
      }
    });

    return unsubscribe;
  }, [navigation, plantId]);

  // Initial load
  useEffect(() => {
    if (!plantId) {
      setError("Plant ID is missing");
      setLoading(false);
      return;
    }

    fetchPlantDetails();
  }, [plantId]);

  const fetchPlantDetails = useCallback(async () => {
    if (!plantId) {
      setError("Plant ID is required");
      setIsInitialLoading(false);
      setIsOverallLoading(false);
      return;
    }

    try {
      const result = await dataManager.getPlantDetails(plantId);
      if (result.success) {
        setPlant(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to load plant details");
      }
    } catch (err) {
      console.error("Error fetching plant details:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsInitialLoading(false);
      setIsOverallLoading(false);
      setIsRefreshing(false);
    }
  }, [plantId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlantDetails(true);
  }, [fetchPlantDetails]);

  const toggleFavorite = useCallback(async () => {
    if (!plant || (!plant._id && !plant.id)) {
      Alert.alert(
        "Error",
        "Plant data not available to update favorite status."
      );
      return;
    }
    const currentPlantId = plant._id || plant.id;
    const newFavoriteStatus = !isFavorite;

    setIsFavorite(newFavoriteStatus);
    //TODO: API CALL
    const result = await dataManager.setPlantFavoriteStatus(
      currentPlantId,
      newFavoriteStatus
    );

    if (!result.success) {
      setIsFavorite(!newFavoriteStatus);
      Alert.alert("Error", result.error || "Failed to update favorite status.");
    } else {
      setPlant((prevPlant) =>
        prevPlant ? { ...prevPlant, isFavorite: newFavoriteStatus } : null
      );
    }
  }, [plant, isFavorite]);

  // --- Date Picker & Navigation Logic ---
  const showDatePicker = (mode) => {
    setPickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmpld = (date) => {
    const now = new Date();
    // Ensure picked date doesn't go beyond today
    const validDate = date > now ? now : date;
    setSelectedDate(validDate);
    hideDatePicker();
  };

  const handleConfirm = (date) => {
    const now = new Date();
    if (!(date instanceof Date) || isNaN(date)) {
      setSelectedDate(now);
    } else {
      setSelectedDate(date > now ? now : date);
    }
    hideDatePicker();
  };

  // Navigation Handlers
  const goToPreviousDate = () => {
    const newDate = new Date(selectedDate);
    if (selectedProductionTab === "Day") {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (selectedProductionTab === "Month") {
      newDate.setMonth(selectedDate.getMonth() - 1);
    } else if (selectedProductionTab === "Year") {
      newDate.setFullYear(selectedDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
  };

  const goToNextDate = () => {
    const newDate = new Date(selectedDate);
    if (selectedProductionTab === "Day") {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (selectedProductionTab === "Month") {
      newDate.setMonth(selectedDate.getMonth() + 1);
    } else if (selectedProductionTab === "Year") {
      newDate.setFullYear(selectedDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
  };

  const isNextDateFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(selectedDate);

    if (selectedProductionTab === "Day") {
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
    } else if (selectedProductionTab === "Month") {
      nextDate.setMonth(nextDate.getMonth() + 1, 1);
      nextDate.setHours(0, 0, 0, 0);
    } else if (selectedProductionTab === "Year") {
      nextDate.setFullYear(nextDate.getFullYear() + 1, 0, 1);
      nextDate.setHours(0, 0, 0, 0);
    }
    return nextDate > today;
  };

  // Formatters for display and API calls based on selectedDate
  const getSelectedDayString = () => selectedDate.toISOString().split("T")[0];
  const getSelectedMonthYearString = () =>
    selectedDate.toISOString().slice(0, 7);
  const getSelectedYearString = () => selectedDate.getFullYear().toString();
  // --- End Date Picker & Navigation Logic ---

  // --- Chart Data Fetching Functions (Modified) ---
  const fetchDayChartData = async (dateToFetch) => {
    //TODO: Day Plant Chart
    if (!plantId) {
      console.warn("[PlantDetail] No plantId for fetchDayChartData");
      setCalculatedDailyProductionKWh("--"); // Keep these for now if productionPower selected
      setPeakPowerWatts("--");
      setPeakPowerTime("--");
      // setDayChartData({ labels: ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"], datasets: [{ data: Array(8).fill(0), color: (opacity = 1) => `rgba(0, 100, 50, ${opacity})`, strokeWidth: 2 }], legend: ["Avg. Power (kW)"] });
      setDayChartData(null); // Clear chart data, will be set by useEffect
      setPlantDayRawData([]); // Set raw data to empty
      setDayChartError("Plant ID missing");
      setIsDayChartLoading(false);
      return;
    }
    setIsDayChartLoading(true);
    setDayChartError(null);
    setPlantDayRawData([]); // Clear previous raw data
    setDayChartData(null); // Clear previous chart data

    // Reset summaries not directly tied to the selected parameter if they are specific to "productionPower"
    if (selectedPlantDayParameterId !== "productionPower") {
      setCalculatedDailyProductionKWh("--");
      setPeakPowerWatts("--");
      setPeakPowerTime("--");
    }
    // Reset the new parameter-specific summary
    const currentParamConfig =
      PLANT_DAY_PARAMETERS[selectedPlantDayParameterId];
    setPlantDaySummaryValue("--");
    setPlantDaySummaryUnit(currentParamConfig?.summaryUnit || "");

    const dateParam = dateToFetch.toISOString().split("T")[0];

    try {
      //TODO: API CALL
      const result = await deviceService.getDailyPowerForPlant(
        plantId,
        dateParam
      );

      if (result.success && result.results) {
        // No need to check length here, useEffect will handle empty
        setPlantDayRawData(result.results || []);
        setDayChartError(null);
      } else {
        console.warn(
          `[PlantDetail] No success or no results for DAY data on ${dateParam}. Error: ${result.error}`
        );
        setPlantDayRawData([]);
        setDayChartError(result.error || "No data for day chart.");
        // Reset summaries again on fetch failure
        if (selectedPlantDayParameterId === "productionPower") {
          setCalculatedDailyProductionKWh("--");
          setPeakPowerWatts("--");
          setPeakPowerTime("--");
        }
        setPlantDaySummaryValue("--");
        setPlantDaySummaryUnit(currentParamConfig?.summaryUnit || "");
      }
    } catch (err) {
      console.error(
        `[PlantDetail] Error fetching DAY data for ${dateParam}:`,
        err
      );
      setPlantDayRawData([]);
      setDayChartError("Failed to load daily data.");
      if (selectedPlantDayParameterId === "productionPower") {
        setCalculatedDailyProductionKWh("--");
        setPeakPowerWatts("--");
        setPeakPowerTime("--");
      }
      setPlantDaySummaryValue("--");
      setPlantDaySummaryUnit(currentParamConfig?.summaryUnit || "");
    } finally {
      setIsDayChartLoading(false);
    }
  };

  const fetchMonthChartData = async () => {
    console.log("[Month Chart] Starting fetchMonthChartData");
    setIsMonthChartLoading(true);
    setMonthChartError(null);

    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth() + 1; // 1-indexed month
    console.log(
      `[Month Chart] Fetching data for ${currentYear}-${currentMonth}`
    );

    const daysInSelectedMonth = new Date(
      currentYear,
      currentMonth,
      0
    ).getDate();
    const monthPlaceholderLabels = Array.from(
      { length: daysInSelectedMonth },
      (_, i) => {
        const day = i + 1;
        return day === 1 || day === daysInSelectedMonth || day % 5 === 0
          ? String(day)
          : "";
      }
    );
    const defaultEmptyData = {
      labels: monthPlaceholderLabels,
      datasets: [{ data: Array(daysInSelectedMonth).fill(0) }],
      legend: ["Daily Production (kWh)"],
    };
    setMonthChartData(defaultEmptyData);

    const targetMonthYear = getSelectedMonthYearString();
    console.log(`[Month Chart] Target month/year: ${targetMonthYear}`);

    if (!plantId) {
      console.log("[Month Chart] No plantId available");
      setIsMonthChartLoading(false);
      return;
    }

    try {
      //TODO: API CALL
      console.log("[Month Chart] Making API request...");
      const response = await apiClient.post(
        "/charts/solar_power_per_plant/monthly/",
        {
          plant_id: plantId,
          date_parameter: targetMonthYear,
        }
      );

      const result = response.data;
      console.log("[Month Chart] API Response:", result);

      if (result && result.results && Array.isArray(result.results)) {
        const apiData = result.results;
        console.log("[Month Chart] Processing API data:", apiData);

        // Initialize daily totals array
        const dailyTotals = Array(daysInSelectedMonth).fill(0);
        const dailyCounts = Array(daysInSelectedMonth).fill(0);

        // Process each data point
        apiData.forEach((item) => {
          if (
            !item ||
            item.PvProduction === null ||
            item.PvProduction === undefined ||
            item.PvProduction === "--"
          ) {
            return;
          }
          const dayIndex = parseInt(item.date, 10) - 1;
          if (
            isNaN(dayIndex) ||
            dayIndex < 0 ||
            dayIndex >= daysInSelectedMonth
          ) {
            return;
          }
          const productionWh = parseFloat(item.PvProduction);
          if (isNaN(productionWh)) {
            return;
          }
          dailyTotals[dayIndex] += productionWh;
          dailyCounts[dayIndex]++;
        });

        // Calculate daily sums (not averages)
        const dailySums = dailyTotals;
        console.log("[Month Chart] Daily sums (Wh):", dailySums);

        // Data for the chart will be directly in Wh
        const processedData = dailySums.map((valWh) => {
          return parseFloat(valWh.toFixed(0)); // Keep as Wh, format to 0 decimal places for chart data points
        });

        console.log("[Month Chart] Processed data (Wh):", processedData);

        // Check if any data point is over 1000 to determine legend unit
        const maxValue = Math.max(...processedData);
        const legendUnit = maxValue > 10000 ? "MWh" : "kWh";

        const chartFormattedData = {
          labels: monthPlaceholderLabels,
          datasets: [
            {
              data: processedData,
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Standardized red
            },
          ],
          legend: [`Daily Production (${legendUnit})`], // Dynamic legend based on data range
        };
        setMonthChartData(chartFormattedData);
        setMonthChartError(null);
      } else {
        console.log("[Month Chart] API returned no data");
        setMonthChartData(defaultEmptyData);
        setMonthChartError(null);
      }
    } catch (err) {
      console.log("[Month Chart] Exception:", err);
      setMonthChartError(
        "An unexpected error occurred while fetching monthly data."
      );
      setMonthChartData(defaultEmptyData);
    } finally {
      setIsMonthChartLoading(false);
      console.log("[Month Chart] fetchMonthChartData completed");
    }
  };
  plantId;

  const fetchYearChartData = async () => {
    if (!plantId) {
      setYearChartData(null);
      setIsYearChartLoading(false);
      return;
    }

    setIsYearChartLoading(true);
    setYearChartError(null);

    try {
      // Format the date parameter properly - use year only as per Postman collection
      const year = selectedDate.getFullYear();
      const dateParameter = year.toString();

      // Use the correct API endpoint
      //TODO: API CALL
      const response = await apiClient.post(
        "/charts/solar_power_per_plant/yearly/",
        {
          plant_id: plantId,
          date_parameter: dateParameter,
        }
      );

      console.log(
        "Year Chart API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data?.results && Array.isArray(response.data.results)) {
        // Create data for all 12 months
        const monthLabels = [
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

        // Create a map of month data from API response
        const monthDataMap = {};
        response.data.results.forEach((item) => {
          // month is 1-based in the API response
          monthDataMap[item.month - 1] = parseFloat(item.PvProduction || 0);
        });

        // Find the maximum value to scale the y-axis properly
        const maxValue = Math.max(...Object.values(monthDataMap), 0.1);

        // Determine the appropriate unit based on the max value
        const legendUnit = maxValue > 10000 ? "MWh" : "kWh";

        // Create the chart data with all months
        const yearData = {
          labels: monthLabels,
          datasets: [
            {
              data: monthLabels.map((_, index) => {
                // Get the solar power value for this month if it exists, otherwise 0
                const value = monthDataMap[index] || 0;
                return Number(value.toFixed(3)); // Keep 3 decimal places
              }),
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Standardized red
            },
          ],
          legend: [`Monthly Production (${legendUnit})`], // Dynamic legend based on data range
        };

        console.log("Year Chart Data:", JSON.stringify(yearData, null, 2));
        setYearChartData(yearData);
      } else {
        console.error("No results in year chart response:", response.data);
        setYearChartError("No data available for the selected year");
        setYearChartData(null);
      }
    } catch (err) {
      console.error("Error fetching yearly data:", err);
      setYearChartError(
        err.response?.data?.message || "Failed to fetch yearly data"
      );
      setYearChartData(null);
    } finally {
      setIsYearChartLoading(false);
    }
  };

  const fetchTotalChartData = async () => {
    setIsTotalChartLoading(true);
    setTotalChartError(null);

    if (!plantId) {
      setTotalChartError("Plant ID is missing.");
      setIsTotalChartLoading(false);
      return;
    }

    try {
      //TODO: API CALL
      const response = await apiClient.post(
        "/charts/solar_power_per_plant/total/",
        {
          plant_id: plantId,
        }
      );

      console.log(
        "Total Chart API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (
        response.data?.results &&
        Array.isArray(response.data.results) &&
        response.data.results.length > 0
      ) {
        let apiData = response.data.results;

        // Filter out invalid years
        const filteredApiData = apiData.filter(
          (item) => parseInt(item.year, 10) > 0
        );

        if (filteredApiData.length > 0) {
          // Sort by year
          filteredApiData.sort(
            (a, b) => parseInt(a.year, 10) - parseInt(b.year, 10)
          );

          const labels = filteredApiData.map((item) => String(item.year));
          const data = filteredApiData.map((item) => {
            // Use the solarPower value directly without dividing by 1000
            const powerValue = parseFloat(item.PvProduction || 0);
            return Number(powerValue.toFixed(2)); // Convert to number after formatting for display
          });

          // Determine the appropriate unit based on the max value
          const maxValue = Math.max(...data);
          const legendUnit = maxValue > 10000 ? "MWh" : "kWh";

          // Create consistent red color array for all bars
          const colors = data.map(
            () =>
              (opacity = 1) =>
                `rgba(220, 53, 69, ${opacity})`
          ); // Standardized red

          const chartFormattedData = {
            labels: labels,
            datasets: [
              {
                data: data,
                colors: colors,
                color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Standardized red
              },
            ],
            legend: [`Yearly Production (${legendUnit})`],
          };
          console.log("Total Chart Data:", chartFormattedData); // Debug log
          setTotalChartData(chartFormattedData);
          setTotalChartError(null);
        } else {
          setTotalChartData({
            labels: ["No Data"],
            datasets: [
              {
                data: [0],
                colors: [(opacity = 1) => `rgba(220, 53, 69, ${opacity})`],
                color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
              },
            ],
            legend: ["Yearly Production (MWh)"],
          });
        }
      } else {
        setTotalChartData({
          labels: ["No Data"],
          datasets: [
            {
              data: [0],
              colors: [(opacity = 1) => `rgba(220, 53, 69, ${opacity})`],
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
            },
          ],
          legend: ["Yearly Production (MWh)"],
        });
      }
    } catch (err) {
      console.error("Error fetching total data:", err);
      setTotalChartError(
        "An unexpected error occurred while fetching total data."
      );
      setTotalChartData({
        labels: ["Error"],
        datasets: [
          {
            data: [0],
            colors: [(opacity = 1) => `rgba(220, 53, 69, ${opacity})`],
            color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
          },
        ],
        legend: ["Yearly Production (MWh)"],
      });
    } finally {
      setIsTotalChartLoading(false);
    }
  };

  // useEffect to fetch data based on selected tab AND selected date
  useEffect(() => {
    console.log(
      `Chart useEffect triggered. Tab: ${selectedProductionTab}, Date: ${selectedDate.toISOString()}`
    );
    if (
      !selectedDate ||
      !(selectedDate instanceof Date) ||
      isNaN(selectedDate)
    ) {
      // Optionally set to today or show an error
      setSelectedDate(new Date());
      return;
    }
    if (!plantId) {
      console.warn("No plantId, skipping chart fetch.");
      return;
    }
    // Clear previous data when changing tabs or dates
    if (selectedProductionTab === "Day") {
      setDayChartData(null);
      fetchDayChartData(selectedDate);
    } else if (selectedProductionTab === "Month") {
      setMonthChartData(null);
      fetchMonthChartData();
    } else if (selectedProductionTab === "Year") {
      setYearChartData(null);
      fetchYearChartData();
    } else if (selectedProductionTab === "Total") {
      setTotalChartData(null);
      fetchTotalChartData();
    }
  }, [selectedProductionTab, selectedDate, plantId]); // Add selectedDate as a dependency

  // useEffect for processing Plant Day Tab data
  useEffect(() => {
    if (
      selectedProductionTab === "Day" &&
      plantDayRawData &&
      !isDayChartLoading
    ) {
      const paramConfig = PLANT_DAY_PARAMETERS[selectedPlantDayParameterId];
      if (!paramConfig) {
        console.error(
          "[PlantDetail Day Tab useEffect] Invalid paramConfig for id:",
          selectedPlantDayParameterId
        );
        // Use 2-hour interval labels for x-axis from 02:00 to 20:00
        const defaultChartLabels = [
          "02:00",
          "04:00",
          "06:00",
          "08:00",
          "10:00",
          "12:00",
          "14:00",
          "16:00",
          "18:00",
          "20:00",
        ];
        setDayChartData({
          labels: defaultChartLabels,
          datasets: [{ data: Array(37).fill(0) }],
        });
        setPlantDaySummaryValue("--");
        setPlantDaySummaryUnit("");
        setCalculatedDailyProductionKWh("--");
        setPeakPowerWatts("--");
        setPeakPowerTime("--");
        return;
      }

      // Use hourly labels for better x-axis display
      const defaultChartLabels = [
        "12AM",
        "1AM",
        "2AM",
        "3AM",
        "4AM",
        "5AM",
        "6AM",
        "7AM",
        "8AM",
        "9AM",
        "10AM",
        "11AM",
        "12PM",
        "1PM",
        "2PM",
        "3PM",
        "4PM",
        "5PM",
        "6PM",
        "7PM",
        "8PM",
        "9PM",
        "10PM",
        "11PM",
      ];

      if (!Array.isArray(plantDayRawData) || plantDayRawData.length === 0) {
        console.warn(
          "[PlantDetail Day Tab useEffect] plantDayRawData is empty or not an array."
        );
        setDayChartData({
          labels: defaultChartLabels,
          datasets: [{ data: Array(48).fill(0) }],
        });
        setPlantDaySummaryValue("--");
        setPlantDaySummaryUnit(paramConfig.summaryUnit);
        if (selectedPlantDayParameterId === "productionPower") {
          setCalculatedDailyProductionKWh("--");
          setPeakPowerWatts("--");
          setPeakPowerTime("--");
        }
        setDayLatestNonZeroPowerWatts(null);
        return;
      }

      // Create half-hour buckets (30 minutes each) for full 24 hours (48 buckets total)
      // Create half-hour buckets (30 minutes each) for full 24 hours (48 buckets total)
      const halfHourBuckets = Array(48)
        .fill(0)
        .map(() => ({ totalValue: 0, count: 0 }));
      // Also create hour buckets for direct hour mapping
      const hourBuckets = Array(24)
        .fill(0)
        .map(() => ({ totalValue: 0, count: 0 }));
      let latestValidRawItemForSummary = null;

      plantDayRawData.forEach((item) => {
        const extractedValue = paramConfig.dataExtractor(item);
        const summaryValue = paramConfig.summaryExtractor(item);

        if (summaryValue !== null && !isNaN(summaryValue)) {
          latestValidRawItemForSummary = item;
        }

        if (extractedValue !== null && !isNaN(extractedValue)) {
          const timeMins = parseInt(item.timeMinutes, 10);
          if (!isNaN(timeMins)) {
            const hourOfDay = Math.floor(timeMins / 60);
            const minutesInHour = timeMins % 60;

            // Process data for all 24 hours (0-23)
            if (hourOfDay >= 0 && hourOfDay <= 23) {
              // Update the hour bucket directly too
              hourBuckets[hourOfDay].totalValue += extractedValue;
              hourBuckets[hourOfDay].count += 1;

              // Map hours 0-23 with 30-minute intervals to buckets 0-47
              // Each hour has 2 buckets (one for first 30 min, one for second 30 min)
              const isSecondHalf = minutesInHour >= 30;
              const bucketIdx = hourOfDay * 2 + (isSecondHalf ? 1 : 0);

              if (bucketIdx >= 0 && bucketIdx < 48) {
                halfHourBuckets[bucketIdx].totalValue += extractedValue;
                halfHourBuckets[bucketIdx].count += 1;
              }
            }
          }
        }
      });

      // Process half-hourly data
      const halfHourlyAverages = halfHourBuckets.map((bucket) =>
        bucket.count > 0
          ? parseFloat((bucket.totalValue / bucket.count).toFixed(3))
          : 0
      );

      // Process hourly data directly
      const hourlyAverages = hourBuckets.map((bucket) =>
        bucket.count > 0
          ? parseFloat((bucket.totalValue / bucket.count).toFixed(3))
          : 0
      );

      // Find the last non-zero value to identify where data ends
      const lastNonZeroIndex = halfHourlyAverages.lastIndexOf(
        halfHourlyAverages.filter((v) => v > 0).pop()
      );

      // Create a copy of the data with nulls after the last actsetDayChartDataual data point
      // This preserves all original data values but helps the chart visualization
      const dataForDisplay = [...halfHourlyAverages];

      // Map zeros to null for visualization while keeping data intact
      const visualDataPoints = halfHourlyAverages.map((value) => {
        // Convert zeros to null so the line doesn't connect through them
        return value === 0 ? null : value;
      });

      // Use all half-hourly averages in chart data (48 points, one per 30 mins) covering all 24 hours
      // Use hourly averages calculated directly from the raw data
      // This ensures more accurate hourly representation
      setDayChartData({
        labels: defaultChartLabels, // 24 labels, one per hour
        datasets: [{ data: hourlyAverages }], // 24 data points, one per hour
        visualData: hourlyAverages.map((val) => (val === 0 ? null : val)), // Used for line drawing
      });

      // Update parameter-specific summary
      if (latestValidRawItemForSummary) {
        const numericSummary = paramConfig.summaryExtractor(
          latestValidRawItemForSummary
        );
        if (numericSummary !== null && !isNaN(numericSummary)) {
          setPlantDaySummaryValue(
            numericSummary.toFixed(paramConfig.summaryDecimalPlaces)
          );
        } else {
          setPlantDaySummaryValue("--");
        }
      } else {
        setPlantDaySummaryValue("--");
      }
      setPlantDaySummaryUnit(paramConfig.summaryUnit);

      // Specific calculations if "productionPower" is selected
      if (selectedPlantDayParameterId === "productionPower") {
        // 1. Calculate Peak Power and Time from plantDayRawData
        let maxPower = -1;
        let peakTimeMinutes = -1;
        plantDayRawData.forEach((item) => {
          // item.solarPower is assumed to be in Watts from API for this specific parameter
          const currentPowerW = parseFloat(item.solarPower);
          if (!isNaN(currentPowerW) && currentPowerW > maxPower) {
            maxPower = currentPowerW;
            peakTimeMinutes = parseInt(item.timeMinutes, 10);
          }
        });
        if (maxPower > -1 && !isNaN(peakTimeMinutes)) {
          setPeakPowerWatts(maxPower.toFixed(0)); // Peak power in W, no decimals
          const hours = Math.floor(peakTimeMinutes / 60);
          const minutes = peakTimeMinutes % 60;
          setPeakPowerTime(
            `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
          );
        } else {
          setPeakPowerWatts("--");
          setPeakPowerTime("--");
        }

        // 2. Calculate Total Daily Production (Energy in kWh) from plantDayRawData
        const powerSumForMinute = {};
        const readingsCountPerMinute = {};
        plantDayRawData.forEach((item) => {
          const powerW = parseFloat(item.solarPower); // Watts
          const minute = parseInt(item.timeMinutes, 10);
          if (!isNaN(powerW) && !isNaN(minute)) {
            powerSumForMinute[minute] =
              (powerSumForMinute[minute] || 0) + powerW;
            readingsCountPerMinute[minute] =
              (readingsCountPerMinute[minute] || 0) + 1;
          }
        });
        let totalEnergyWh = 0;
        for (const minuteKey in powerSumForMinute) {
          if (readingsCountPerMinute[minuteKey] > 0) {
            const averagePowerForThatMinuteW =
              powerSumForMinute[minuteKey] / readingsCountPerMinute[minuteKey];
            totalEnergyWh += averagePowerForThatMinuteW * (1 / 60); // Wh
          }
        }
        setCalculatedDailyProductionKWh((totalEnergyWh / 1000).toFixed(2)); // kWh
      } else {
        // Clear these if another parameter is selected
        setCalculatedDailyProductionKWh("--");
        setPeakPowerWatts("--");
        setPeakPowerTime("--");
      }

      let anyValidPoint = false;
      let latestNonZeroTimeMinutes = -1;
      let latestNonZeroPower = null;
      for (const item of plantDayRawData) {
        const v = paramConfig?.dataExtractor
          ? paramConfig.dataExtractor(item)
          : parseFloat(item?.PvProduction ?? item?.solarPower ?? item?.pvProduction);
        const numericV = Number(v);
        if (Number.isNaN(numericV)) continue;
        anyValidPoint = true;

        const t = parseInt(item?.timeMinutes, 10);
        if (isNaN(t)) continue;
        if (numericV > 0 && t > latestNonZeroTimeMinutes) {
          latestNonZeroTimeMinutes = t;
          latestNonZeroPower = numericV;
        }
      }

      if (latestNonZeroPower !== null) {
        setDayLatestNonZeroPowerWatts(latestNonZeroPower);
      } else if (anyValidPoint) {
        setDayLatestNonZeroPowerWatts(0);
      } else {
        setDayLatestNonZeroPowerWatts(null);
      }
    } else if (
      selectedProductionTab === "Day" &&
      (!plantDayRawData || plantDayRawData.length === 0) &&
      !isDayChartLoading
    ) {
      // Handle case where raw data is explicitly null/empty after a fetch cycle and not loading
      const paramConfig = PLANT_DAY_PARAMETERS[selectedPlantDayParameterId];
      const defaultChartLabels = [
        "00:00",
        "03:00",
        "06:00",
        "09:00",
        "12:00",
        "15:00",
        "18:00",
        "21:00",
      ];
      // Use 48 empty data points for 48 half-hours (full 24 hours)
      setDayChartData({
        labels: defaultChartLabels,
        datasets: [{ data: Array(48).fill(0) }],
      });
      setPlantDaySummaryValue("--");
      setPlantDaySummaryUnit(paramConfig?.summaryUnit || "");
      setCalculatedDailyProductionKWh("--");
      setPeakPowerWatts("--");
      setPeakPowerTime("--");
      setDayLatestNonZeroPowerWatts(null);
    }
  }, [
    plantDayRawData,
    selectedPlantDayParameterId,
    selectedProductionTab,
    isDayChartLoading,
  ]);

  // useEffect for Plant Month Tab Parameter Summary
  useEffect(() => {
    if (plant && selectedProductionTab === "Month") {
      const paramConfig = PLANT_MONTH_PARAMETERS[selectedPlantMonthParameterId];
      if (paramConfig && paramConfig.summaryExtractor) {
        const rawValue = paramConfig.summaryExtractor(plant);
        if (
          rawValue !== undefined &&
          rawValue !== null &&
          !isNaN(parseFloat(rawValue))
        ) {
          setPlantMonthSummaryValue(
            parseFloat(rawValue).toFixed(paramConfig.summaryDecimalPlaces)
          );
        } else {
          setPlantMonthSummaryValue("--");
        }
        setPlantMonthSummaryUnit(paramConfig.summaryUnit);
      } else {
        setPlantMonthSummaryValue("--");
        setPlantMonthSummaryUnit("");
      }
    }
  }, [selectedPlantMonthParameterId, plant, selectedProductionTab]);

  // useEffect for Plant Year Tab Parameter Summary
  useEffect(() => {
    if (plant && selectedProductionTab === "Year") {
      const paramConfig = PLANT_YEAR_PARAMETERS[selectedPlantYearParameterId];
      if (paramConfig && paramConfig.summaryExtractor) {
        const rawValue = paramConfig.summaryExtractor(plant);
        if (
          rawValue !== undefined &&
          rawValue !== null &&
          !isNaN(parseFloat(rawValue))
        ) {
          setPlantYearSummaryValue(
            parseFloat(rawValue).toFixed(paramConfig.summaryDecimalPlaces)
          );
        } else {
          setPlantYearSummaryValue("--");
        }
        setPlantYearSummaryUnit(paramConfig.summaryUnit);
      } else {
        setPlantYearSummaryValue("--");
        setPlantYearSummaryUnit("");
      }
    }
  }, [selectedPlantYearParameterId, plant, selectedProductionTab]);

  // useEffect for Plant Total Tab Parameter Summary
  useEffect(() => {
    if (plant && selectedProductionTab === "Total") {
      const paramConfig = PLANT_TOTAL_PARAMETERS[selectedPlantTotalParameterId];
      if (paramConfig && paramConfig.summaryExtractor) {
        const rawValue = paramConfig.summaryExtractor(plant);
        if (
          rawValue !== undefined &&
          rawValue !== null &&
          !isNaN(parseFloat(rawValue))
        ) {
          setPlantTotalSummaryValue(
            parseFloat(rawValue).toFixed(paramConfig.summaryDecimalPlaces)
          );
        } else {
          setPlantTotalSummaryValue("--");
        }
        setPlantTotalSummaryUnit(paramConfig.summaryUnit);
      } else {
        setPlantTotalSummaryValue("--");
        setPlantTotalSummaryUnit("");
      }
    }
  }, [selectedPlantTotalParameterId, plant, selectedProductionTab]);

  // --- Bar Chart Opacity Control ---
  // Change these values to control bar chart opacity globally
  // Using darker red to compensate for chart library's opacity rendering
  const BAR_COLOR = "#b71c1c"; // Darker red (from #dc3545)
  const BAR_OPACITY = {
    normal: 1.0, // Opacity for normal bars (0.0 to 1.0) - 1.0 = fully opaque
    highlighted: 1.0, // Opacity for highlighted/selected bars - changed to 1.0 for same dark red
  };

  // --- Chart Configurations ---
  const chartConfigCommon = {
    //    backgroundGradientFrom: "#300000", // top color (deep red)
    //backgroundGradientTo: "#100000",   // bottom color (darker red)
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,

    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",

    color: (opacity = BAR_OPACITY.normal) => `${BAR_COLOR}`, // Use darker red without opacity variable
    labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#e0e0e0",
      strokeWidth: 0.5,
    },
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
      offsetY: -4,
    },
    barPercentage: 0.7,
  };

  const areaChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = BAR_OPACITY.normal) => `${BAR_COLOR}`, // Use darker red without opacity variable
    fillShadowGradient: "#dc3545", // Light red fill matching darker red
    fillShadowGradientOpacity: 1,
    useShadowColorFromDataset: false,
    strokeWidth: 2,
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "dc3545",
      strokeWidth: 0.8,
    },
    formatYLabel: (value) => `${value}`,
    yAxisInterval: 1,
    segments: 5,
    propsForLabels: {
      fontSize: 10,
      fontWeight: "400",
      color: "#888888",
    },
    propsForDots: {
      r: "4",
      strokeWidth: "1.5",
      stroke: "#dc3545", // Red stroke color for line chart dots
    },
    labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
    paddingRight: 10,
    paddingLeft: -5,
    yAxisLabel: "",
    xAxisLabel: "",
  };

  const barChartConfig = {
    ...chartConfigCommon,
  };

  const yearlyBarChartConfig = {
    ...chartConfigCommon,
    decimalPlaces: 1,
    barPercentage: 0.5,
    formatYLabel: (value) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 1000) {
        return `${(numValue / 1000).toFixed(1)}M`;
      }
      return parseFloat(value).toLocaleString();
    },
    yAxisInterval: 1,
    segments: 4,
    propsForLabels: {
      fontSize: 10,
      fontWeight: "500",
    },
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
  };

  const totalBarChartConfig = {
    ...chartConfigCommon,
    decimalPlaces: 2,
    barPercentage: 0.6,
    color: (opacity = BAR_OPACITY.normal) => `${BAR_COLOR}`, // Use darker red without opacity variable
    strokeWidth: 2,
    propsForLabels: {
      fontSize: 12,
      fontWeight: "bold",
    },
    formatYLabel: (value) => {
      if (value === null || value === undefined) return "";
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 1000) {
        return `${(numValue / 1000).toFixed(1)}M`;
      }
      return String(value);
    },
    formatTopValue: (value) => {
      if (value === null || value === undefined) return "";
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 10000) {
        return `${(numValue / 1000).toFixed(2)}M`;
      }
      return String(Number(value).toFixed(2));
    },
    style: {
      borderRadius: 16,
      paddingVertical: 15,
      paddingRight: 10,
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#e0e0e0",
      strokeWidth: 1,
    },
    segments: 4,
  };

  const monthlyBarChartConfig = {
    ...chartConfigCommon,
    decimalPlaces: 0,
    barPercentage: 0.5,
    propsForLabels: {
      fontSize: 9,
      fontWeight: "500",
    },
    formatYLabel: (value) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 1000) {
        return `${(numValue / 1000).toFixed(1)}M`;
      }
      return parseFloat(value).toLocaleString();
    },
    yAxisInterval: 1,
    segments: 4,
  };

  // --- Data Point Click Handler ---
  const handleDataPointClick = (data) => {
    console.log("Data point clicked:", data); // Debug log
    try {
      const { value, x, y, index } = data;
      setSelectedDotIndex(index);

      // Set selected bar for highlighting
      setSelectedBarIndex(index);
      setSelectedBarChartType(selectedProductionTab);

      console.log("Processing click for tab:", selectedProductionTab); // Debug log

      // Get the corresponding label for the clicked point index
      let label = "";
      if (selectedProductionTab === "Day" && dayChartData?.labels) {
        // For Day tab, we now have half-hourly data points, so calculate the actual time
        const hourIndex = Math.floor(index / 2) + 2; // Convert index to hour (0,1→2, 2,3→3, etc.)
        const isHalfHour = index % 2 === 1; // Odd indices are half-hours
        label = `${String(hourIndex).padStart(2, "0")}:${isHalfHour ? "30" : "00"}`;
      } else if (selectedProductionTab === "Month" && monthChartData?.labels) {
        label = `Day ${index + 1}`;
      } else if (selectedProductionTab === "Year" && yearChartData?.labels) {
        label = `Month ${yearChartData.labels[index]}`;
      } else if (selectedProductionTab === "Total" && totalChartData?.labels) {
        label = String(totalChartData.labels[index] || "");
      }

      console.log("Label calculated:", label); // Debug log

      // Format the value based on the tab
      let displayValue = "";
      if (selectedProductionTab === "Day") {
        displayValue = `${Number(value).toFixed(0)} W`;
      } else if (selectedProductionTab === "Month") {
        // Use formatEnergyWithUnit for Month tab
        const formatted = formatEnergyWithUnit(value);
        displayValue = `${formatted.value} ${formatted.unit}`;
      } else if (selectedProductionTab === "Year") {
        // Use formatEnergyWithUnit for Year tab
        const formatted = formatEnergyWithUnit(value);
        displayValue = `${formatted.value} ${formatted.unit}`;
      } else if (selectedProductionTab === "Total") {
        // Use formatEnergyWithUnit for Total tab
        const formatted = formatEnergyWithUnit(value);
        displayValue = `${formatted.value} ${formatted.unit}`;
      }

      console.log("Display value calculated:", displayValue); // Debug log

      // Calculate tooltip position on top of the bar
      const tooltipY = Math.max(10, y - VERTICAL_OFFSET - 50); // Position above the bar
      const safeX = Number(x) || 0;
      const safeCardWidth = Number(cardWidth) || screenWidth;

      const tooltipPosition = {
        x: Math.max(
          TOOLTIP_WIDTH / 2,
          Math.min(safeX, safeCardWidth - TOOLTIP_WIDTH / 2)
        ), // Keep tooltip within screen width
        y: tooltipY,
        visible: true,
        value: displayValue,
        label: label,
      };

      console.log("Setting tooltip position:", tooltipPosition); // Debug log
      setTooltipPos(tooltipPosition);

      // Auto-hide tooltip after 3 seconds
      setTimeout(() => {
        setTooltipPos((prev) => ({ ...prev, visible: false }));
        setSelectedBarIndex(null);
        setSelectedBarChartType(null);
      }, 3000);
    } catch (error) {
      console.error("Error in handleDataPointClick:", error);
      // Reset tooltip state on error
      setTooltipPos({
        x: 0,
        y: 0,
        visible: false,
        value: null,
        label: "",
      });
      setSelectedBarIndex(null);
      setSelectedBarChartType(null);
    }
  };

  // Helper function to get chart data with highlighted bar
  const getHighlightedChartData = (data, chartType) => {
    if (!data || !data.datasets || !data.datasets[0]) return data;

    const baseColor = BAR_COLOR; // Use darker red constant
    const highlightColor = BAR_COLOR; // Same color for highlighted bars

    return {
      ...data,
      datasets: [
        {
          ...data.datasets[0],
          color: (opacity = BAR_OPACITY.normal, index) => {
            if (
              selectedBarChartType === chartType &&
              selectedBarIndex === index
            ) {
              return highlightColor;
            }
            return baseColor;
          },
        },
      ],
    };
  };

  // --- Render Logic for Charts (Modified) ---
  const renderChartContent = () => {
    let isLoading = false;
    let currentTabError = null;
    let chartToRender = null;
    let pickerAction = () => {};
    let selectedDateString = "";

    // Tooltip component
    const renderTooltip = () => {
      if (!tooltipPos.visible) return null;

      return (
        <View
          style={[
            localCalendarStyles.tooltipContainer,
            { left: tooltipPos.x - TOOLTIP_WIDTH / 2, top: tooltipPos.y },
          ]}
        >
          <View style={localCalendarStyles.tooltipBubble}>
            <Text style={localCalendarStyles.tooltipText}>
              {tooltipPos.label}
            </Text>
            <Text style={localCalendarStyles.tooltipText}>
              {tooltipPos.value}
            </Text>
          </View>
          <View style={localCalendarStyles.tooltipArrow} />
        </View>
      );
    };

    switch (selectedProductionTab) {
      case "Day":
        isLoading = isDayChartLoading || isDashboardLoading;
        currentTabError = dayChartError || dashboardError;
        pickerAction = () => showDatePicker("date");
        selectedDateString = getSelectedDayString();
        if (dayChartData && validateChartData(dayChartData)) {
          chartToRender = (
            <>
              <View style={styles.miniCardsContainer}>
                <View style={styles.miniCard}>
                  <Text style={styles.miniCardLabel}>Solar Production</Text>
                  <Text style={styles.miniCardValue}>
                    {(() => {
                      if (
                        dayLatestNonZeroPowerWatts === null ||
                        dayLatestNonZeroPowerWatts === undefined
                      )
                        return "--";
                      const numericValue = Number(dayLatestNonZeroPowerWatts);
                      if (Number.isNaN(numericValue)) return "--";
                      return `${numericValue.toFixed(2)} W`;
                    })()}
                  </Text>
                </View>
                <View style={styles.miniCardDivider} />
                <View style={styles.miniCard}>
                  <Text style={styles.miniCardLabel}>Peak Hours Today</Text>
                  <Text style={styles.miniCardValue}>
                    {plantDashboardData?.peak_hours_today
                      ? `${plantDashboardData.peak_hours_today} h`
                      : "--"}
                  </Text>
                </View>
              </View>
              {/* 
              <View style={styles.graphLegendContainer}>
                <Text style={styles.graphLegendText}>Production (W)</Text>
              </View> */}

              <View
                style={[
                  styles.chartCardContainer,
                  {
                    alignItems: "flex-start",
                    paddingLeft: 0,
                    paddingRight: 0,
                    marginLeft: 0,
                  },
                ]}
              >
                {/* <LineChart
                  data={sanitizeLineChartData({
                    ...dayChartData,
                    datasets: [
                      {
                        ...dayChartData.datasets[0],
                        data:
                          dayChartData.visualData ||
                          dayChartData.datasets[0].data,
                        color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Standardized red
                        strokeWidth: 2,
                      },
                    ],
                  })}
                  width={cardWidth - 20} // Reduced width to compress the graph horizontally
                  height={220} // Original height
                  chartConfig={{
                    ...areaChartConfig,

                    color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Standardized red
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    strokeWidth: 2,
                    // Make labels visible but keep them small
                    propsForVerticalLabels: {
                      fontSize: 8, // Smaller font size for original chart size
                      fontWeight: "600", // Semi-bold
                      fill: "#000000", // Dark color for visibility
                      rotation: 45, // Rotate to avoid overlap
                      y: 5, // Small adjustment down
                    },
                    propsForDots: {
                      r: "5",
                      strokeWidth: "2",
                      stroke: "#dc3545", // Red stroke color
                    },
                    useShadowColorFromDataset: false,
                    decimalPlaces: 0,
                    xAxisLabelRotation: 45,
                    verticalLabelRotation: 45,
                    showAllVerticalLabels: true,
                  }}
                  bezier={false}
                  withShadow={false}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLines={false} // Keep vertical grid lines disabled
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withDots={false}
                  fromZero={true}
                  style={{
                    marginVertical: 8,
                    marginLeft: 0, // Centered
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingBottom: 0, // Remove bottom padding
                    marginBottom: 0, // Remove bottom margin
                    position: "relative",
                    left: 0, // Centered
                    alignSelf: "center", // Center the graph
                  }}
                  xLabelsOffset={0}
                  yLabelsOffset={5} // Adjust y labels offset
                  yAxisWidth={40} // Increased to make more space for labels
                  segments={5}
                  hidePointsAtIndex={
                    (dayChartData?.visualData || [])
                      .map((val, index) => (val === null ? index : -1))
                      .filter((index) => index !== -1) || []
                  }
                  onDataPointClick={handleDataPointClick}
                  renderDotContent={() => null}
                  getDotProps={(dataPoint) => {
                    // Check if the data point has a value of 0 or null in visualData
                    const visualVal = dayChartData?.visualData
                      ? dayChartData.visualData[dataPoint.index]
                      : null;

                    // Hide dots for null values (which were zeros in original data)
                    return {
                      r: visualVal === null ? "0" : "4",
                      strokeWidth: visualVal === null ? "0" : "1.5",
                    };
                  }}
                  formatXLabel={(value, index) => {
                    // Show every 3rd hour to prevent overcrowding while still showing key times
                    return index % 3 === 0 ? value : "";
                  }}
                  yAxisSuffix=""
                  withHorizontalLines={true}
                  connectNulls={false} // Ensure null values aren't connected
                  endWithLastValue={true}
                  withFillShadowGradient={true} // Enable fill gradient under line
                  area
                /> */}
                <View style={{ flex: 1, paddingTop: 10 }}>
                  <View
                    style={{
                      backgroundColor: "transparent",
                      paddingBottom: 20,
                    }}
                  >
                    <DatePicker
                      value={selectedDate}
                      onChange={setSelectedDate}
                    />
                  </View>
                  <PlantsDailyBarPVChart
                    width={285}
                    selectedDate={selectedDate}
                    height={220}
                  />
                  <Text></Text>
                </View>
              </View>

              {/* Time labels */}
              {/* <View style={styles.timeLabelsContainer}>
                <View style={styles.timeLabelsRow}>
                  <Text style={styles.timeLabel}>12AM</Text>
                  <Text style={styles.timeLabel}>3AM</Text>
                  <Text style={styles.timeLabel}>6AM</Text>
                  <Text style={styles.timeLabel}>9AM</Text>
                  <Text style={styles.timeLabel}>12PM</Text>
                  <Text style={styles.timeLabel}>3PM</Text>
                  <Text style={styles.timeLabel}>6PM</Text>
                  <Text style={styles.timeLabel}>9PM</Text>
                </View>
              </View> */}
            </>
          );
        }
        break;
      case "Month":
        isLoading = isMonthChartLoading;
        currentTabError = monthChartError;
        pickerAction = () => showDatePicker("month");
        selectedDateString = getSelectedMonthYearString();
        if (monthChartData && validateChartData(monthChartData)) {
          chartToRender = (
            <>
              <View style={styles.miniCardsContainer}>
                <View style={styles.miniCard}>
                  <Text style={styles.miniCardLabel}>Monthly Production</Text>
                  <Text style={styles.miniCardValue}>
                    {(() => {
                      if (!plantDashboardData?.monthlyProduction) return "--";
                      const formatted = formatEnergyWithUnit(
                        plantDashboardData.monthlyProduction
                      );
                      return `${formatted.value} ${formatted.unit}`;
                    })()}
                  </Text>
                </View>
              </View>

              {/* <View style={styles.graphLegendContainer}>
                <Text style={styles.graphLegendText}>Productions (kWh)</Text>
              </View> */}

              <View style={{ position: "relative" }}>
                {renderTooltip()}
                {tooltipPos.visible && (
                  <TouchableOpacity
                    style={localCalendarStyles.tooltipOverlay}
                    onPress={clearTooltipAndSelection}
                    activeOpacity={1}
                  />
                )}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 10 }}
                  style={{ marginLeft: -10 }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(event) => handleBarChartClick(event, "Month")}
                    style={{ position: "relative" }}
                  >
                    {/* <BarChart
                      data={sanitizeBarChartData(
                        getHighlightedChartData(monthChartData, "Month")
                      )}
                      width={Math.max(
                        cardWidth - 32,
                        monthChartData.labels.length * 20
                      )}
                      height={220}
                      chartConfig={monthlyBarChartConfig}
                      fromZero
                      showValuesOnTopOfBars={false}
                      withInnerLines={true}
                      withHorizontalLabels={true}
                      withVerticalLabels={true}
                      withHorizontalLines={true}
                      withVerticalLines={false}
                      yAxisWidth={60}
                      yAxisSuffix=""
                      style={[styles.chartStyle, { marginLeft: 10 }]}
                      onDataPointClick={handleDataPointClick}
                      getBarColor={(dataPoint, index) => {
                        // Check if this bar should be highlighted
                        if (
                          selectedBarChartType === "Month" &&
                          selectedBarIndex === index
                        ) {
                          return BAR_COLOR; // Use darker red constant
                        }
                        return BAR_COLOR; // Use darker red constant
                      }}
                    /> */}
                    <View style={{ flex: 1, paddingTop: 10 }}>
                      <View
                        style={{
                          backgroundColor: "transparent",
                          paddingBottom: 20,
                        }}
                      >
                        <MonthPicker
                          value={selectedMonth}
                          onChange={setSelectedMonth}
                        />
                      </View>
                      <PlantsMonthlyPVBarChart
                        width={290}
                        height={220}
                        selectedMonth={selectedMonth}
                      ></PlantsMonthlyPVBarChart>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          );
        } else if (monthChartData) {
          // Data exists but validation failed
          chartToRender = (
            <View style={styles.chartLoadingContainer}>
              <Text style={styles.chartErrorText}>Data not found.</Text>
            </View>
          );
        }
        break;
      case "Year":
        isLoading = isYearChartLoading;
        currentTabError = yearChartError;
        pickerAction = () => showDatePicker("year");
        selectedDateString = getSelectedYearString();
        if (yearChartData && validateChartData(yearChartData)) {
          chartToRender = (
            <>
              <View style={styles.dailySummaryContainer}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Yearly Production:</Text>
                  <Text style={styles.summaryValue}>
                    {(() => {
                      if (!plantDashboardData?.yearlyProduction) return "--";
                      const formatted = formatEnergyWithUnit(
                        plantDashboardData.yearlyProduction
                      );
                      return `${formatted.value} ${formatted.unit}`;
                    })()}
                  </Text>
                </View>
              </View>

              {/* <View style={styles.graphLegendContainer}>
                <Text style={styles.graphLegendText}>Production (MWh)</Text>
              </View> */}

              <View style={{ position: "relative" }}>
                {renderTooltip()}
                {tooltipPos.visible && (
                  <TouchableOpacity
                    style={localCalendarStyles.tooltipOverlay}
                    onPress={clearTooltipAndSelection}
                    activeOpacity={1}
                  />
                )}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 10 }}
                  style={{ marginLeft: -10 }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(event) => handleBarChartClick(event, "Year")}
                    style={{ position: "relative" }}
                  >
                    {/* <BarChart
                      data={sanitizeBarChartData(
                        getHighlightedChartData(yearChartData, "Year")
                      )}
                      width={Math.max(
                        cardWidth - 32,
                        yearChartData.labels.length * 40
                      )}
                      height={220}
                      chartConfig={yearlyBarChartConfig}
                      yAxisSuffix=""
                      yAxisLabel=""
                      fromZero={true}
                      style={[styles.chartStyle, { marginLeft: 10 }]}
                      showValuesOnTopOfBars={false}
                      verticalLabelRotation={0}
                      showBarTops={true}
                      withInnerLines={true}
                      withHorizontalLabels={true}
                      withVerticalLabels={true}
                      withHorizontalLines={true}
                      withVerticalLines={false}
                      yAxisWidth={60}
                      onDataPointClick={handleDataPointClick} // Ensure this is present
                      getBarColor={(dataPoint, index) => {
                        // Check if this bar should be highlighted
                        if (
                          selectedBarChartType === "Year" &&
                          selectedBarIndex === index
                        ) {
                          return BAR_COLOR; // Use darker red constant
                        }
                        return BAR_COLOR; // Use darker red constant
                      }}
                    /> */}
                    <View style={{ flex: 1, paddingTop: 10 }}>
                      <View
                        style={{
                          backgroundColor: "transparent",
                          paddingBottom: 20,
                        }}
                      >
                        <YearlyCalendarPicker
                          value={selectedYear}
                          onChange={setSelectedYear}
                        />
                      </View>
                      <PlantsYearlyPVBarChart
                        width={300}
                        height={220}
                        selectedYear={selectedYear}
                      />
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          );
        } else if (yearChartData) {
          // Data exists but validation failed
          chartToRender = (
            <View style={styles.chartLoadingContainer}>
              <Text style={styles.chartErrorText}>Data not found.</Text>
            </View>
          );
        }
        break;
      case "Total":
        isLoading = isTotalChartLoading;
        currentTabError = totalChartError;
        pickerAction = null;
        selectedDateString = "All Time";
        if (
          totalChartData &&
          (totalChartData?.labels?.length === 1 || validateChartData(totalChartData))
        ) {
          chartToRender = (
            <>
              <View style={styles.dailySummaryContainer}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Production:</Text>
                  <Text style={styles.summaryValue}>
                    {(() => {
                      if (!plantDashboardData?.totalProduction) return "--";
                      const formatted = formatEnergyWithUnit(
                        plantDashboardData.totalProduction
                      );
                      return `${formatted.value} ${formatted.unit}`;
                    })()}
                  </Text>
                </View>
              </View>

              {/* <View style={styles.graphLegendContainer}>
                <Text style={styles.graphLegendText}>Production (MWh)</Text>
              </View> */}

              <View style={{ position: "relative" }}>
                {renderTooltip()}
                {tooltipPos.visible && (
                  <TouchableOpacity
                    style={localCalendarStyles.tooltipOverlay}
                    onPress={clearTooltipAndSelection}
                    activeOpacity={1}
                  />
                )}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 10 }}
                  style={{ marginLeft: -10 }}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={(event) => handleBarChartClick(event, "Total")}
                    style={{ position: "relative" }}
                  >
                    {/* <BarChart
                      data={sanitizeBarChartData(
                        getHighlightedChartData(
                          {
                            ...totalChartData,
                            labels:
                              totalChartData?.labels?.map((label) =>
                                String(label)
                              ) || [],
                            datasets:
                              totalChartData?.datasets?.map((dataset) => ({
                                ...dataset,
                                data:
                                  dataset.data?.map((value) => Number(value)) ||
                                  [],
                                color: (opacity = 1) => BAR_COLOR, // Use darker red constant
                              })) || [],
                          },
                          "Total"
                        )
                      )}
                      width={Math.max(
                        cardWidth - 32,
                        (totalChartData?.labels?.length || 1) * 60
                      )}
                      height={220}
                      chartConfig={{
                        ...totalBarChartConfig,
                        color: (opacity = 1) => BAR_COLOR, // Use darker red constant
                        barPercentage: 0.6,
                        propsForDots: {
                          r: "0",
                          strokeWidth: "0",
                        },
                        formatYLabel: (value) => String(value), // Ensure labels are strings
                      }}
                      showValuesOnTopOfBars={false}
                      flatColor={true}
                      style={[
                        styles.chartStyle,
                        {
                          paddingRight: 40,
                          paddingLeft: 10,
                          marginLeft: 10,
                          paddingTop: 20,
                          paddingBottom: 10,
                        },
                      ]}
                      yAxisLabel=""
                      yAxisSuffix=""
                      withInnerLines={true}
                      showBarTops={true}
                      onDataPointClick={handleDataPointClick}
                      fromZero={true}
                      withHorizontalLines={true}
                      withVerticalLines={false}
                      withCustomBarColorFromData={false}
                      getBarColor={(dataPoint, index) => {
                        // Check if this bar should be highlighted
                        if (
                          selectedBarChartType === "Total" &&
                          selectedBarIndex === index
                        ) {
                          return BAR_COLOR; // Use darker red constant
                        }
                        return BAR_COLOR; // Use darker red constant
                      }}
                    /> */}

                    <View style={{ flex: 1, paddingTop: 30 }}>
                      {/* <View
                        style={{
                          backgroundColor: "transparent",
                          paddingBottom: 20,
                        }}
                      >
                        <YearlyCalendarPicker
                          value={selectedYear}
                          onChange={setSelectedYear}
                        />
                      </View> */}
                      <PlantsTotalPVBarChart
                        width={290}
                        height={220}
                        selectedYear={selectedYear}
                      />
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          );
        } else if (totalChartData) {
          // Data exists but validation failed
          chartToRender = (
            <View style={styles.chartLoadingContainer}>
              <Text style={styles.chartErrorText}>Data not found.</Text>
            </View>
          );
        }
        break;
      default:
        return <Text>Select a tab</Text>;
    }

    // Define the date navigator component inside renderChartContent
    const showNavArrows = selectedProductionTab !== "Total";
    const disableNext = isNextDateFuture();

    const dateNavigatorComponent = (
      <View style={localCalendarStyles.dateNavigator}>
        {/* <TouchableOpacity
          onPress={goToPreviousDate}
          style={[localCalendarStyles.navButton, isLoading && { opacity: 0.5 }]}
          disabled={isLoading}
        >
          <Icon name="chevron-left" size={28} color="#555" />
        </TouchableOpacity> */}
        {/* <TouchableOpacity
          onPress={() => showDatePicker(selectedProductionTab.toLowerCase())}
          style={localCalendarStyles.dateDisplayContainer}
        >
          <Text style={localCalendarStyles.dateText}>
            {selectedProductionTab === "Day" &&
              selectedDate.toLocaleDateString()}
            {selectedProductionTab === "Month" &&
              selectedDate.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            {selectedProductionTab === "Year" &&
              selectedDate.getFullYear().toString()}
            {selectedProductionTab === "Total" && "All Time"}
          </Text>
          <Icon
            name="calendar-today"
            size={20}
            color="#555"
            style={localCalendarStyles.calendarIcon}
          />
        </TouchableOpacity> */}
        {/* <TouchableOpacity
          onPress={goToNextDate}
          style={[localCalendarStyles.navButton]}
          disabled={isLoading || disableNext}
        >
          <Icon
            name="chevron-right"
            size={28}
            color={disableNext ? "#ccc" : "#555"}
          />
        </TouchableOpacity> */}
      </View>
    );

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={clearTooltipAndSelection}
        style={localCalendarStyles.chartAreaContainer}
      >
        {dateNavigatorComponent}

        <View style={localCalendarStyles.chartWrapper}>
          {isLoading ? (
            <View style={styles.chartLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.chartLoadingText}>Loading chart data...</Text>
            </View>
          ) : (
            chartToRender || <View style={{ height: 220 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Modify the main render logic
  if (isInitialLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading plant details...</Text>
      </SafeAreaView>
    );
  }

  if (error && !plant) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPlantDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!plant) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>Plant not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  //TODO: VIEW
  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{plant?.name || "Plant Details"}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={toggleFavorite}
            disabled={!plant}
          >
            <Icon
              name={isFavorite ? "star" : "star-border"}
              size={26}
              color={isFavorite ? "#FFC107" : "#555"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Icon name="refresh" size={26} color="#555" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setIsMenuModalVisible(true)}
          >
            <Icon name="more-vert" size={26} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.plantDetailScrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Plant Image */}
        <View style={styles.imageContainer}>
          {plant?.image ? (
            <Image
              source={{ uri: plant.image }}
              style={styles.plantImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="eco" size={80} color="#00875A" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <View style={styles.statusBadge}>
            <Icon name={plantStatus.icon} size={20} color={plantStatus.color} />
            <Text style={[styles.statusText, { color: plantStatus.color }]}>
              {plantStatus.text}
            </Text>
          </View>
        </View>

        {/* CircularProgress with width */}
        <CircularProgress
          plants={
            plant
              ? [
                  {
                    ...plant,
                    // Keep the exact monthlyProduction value from API
                    totalCapacity: parseFloat(plant.capacity) || 0,
                    monthlyProduction: plant.monthlyProduction || 0, // Remove parseFloat to keep exact value
                    // Pass other production values if CircularProgress uses them
                    dailyProduction: parseFloat(plant.daily_production) || 0,
                    yearlyProduction: parseFloat(plant.yearlyProduction) || 0,
                    totalProduction: parseFloat(plant.totalProduction) || 0,
                    currentPower: parseFloat(plant.solar_power) || 0,
                  },
                ]
              : []
          }
          width={cardWidth}
        />

        {/* Plant Details Card */}
        {/* <InfoCard title="Plant Details" width={cardWidth}>
          <View style={styles.detailContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>System Type:</Text>
              <Text style={styles.detailValue}>
                {plant?.system_type || "Not specified"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plant Type:</Text>
              <Text style={styles.detailValue}>
                {plant?.plant_type || "Not specified"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Capacity:</Text>
              <Text style={styles.detailValue}>
                {plant?.capacity ? (
                  <>
                    {plant.capacity}
                    <Text style={styles.unitText}> kWp</Text>
                  </>
                ) : (
                  <Text>Not specified</Text>
                )}
              </Text>
            </View>
            {plant?.azimuth !== undefined && plant?.azimuth === "q" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Installation Date:</Text>
                <Text style={styles.detailValue}>
                  {plant?.on_grid_date && plant.on_grid_date !== "--"
                    ? formatDate(plant.on_grid_date)
                    : plant?.creation_date
                      ? formatDate(plant.creation_date)
                      : "Not specified"}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Updated:</Text>
              <Text style={styles.detailValue}>
                {plant?.last_update && plant?.last_update !== "--"
                  ? plant.last_update
                  : "Not specified"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Creation Date:</Text>
              <Text style={styles.detailValue}>
                {plant?.creation_date
                  ? formatDate(plant.creation_date)
                  : "Not specified"}
              </Text>
            </View>
            {plant?.azimuth !== undefined && plant?.azimuth === "q" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>On-Grid Date:</Text>
                <Text style={styles.detailValue}>
                  {plant?.on_grid_date && plant.on_grid_date !== "--"
                    ? formatDate(plant.on_grid_date)
                    : "Not specified"}
                </Text>
              </View>
            )}
            {plant?.azimuth !== undefined && plant?.azimuth === "q" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Azimuth:</Text>
                <Text style={styles.detailValue}>
                  <>
                    {plant.azimuth}
                    <Text style={styles.unitText}>°</Text>
                  </>
                </Text>
              </View>
            )}
            {plant?.tilt_angle !== undefined && plant?.tilt_angle === "q" && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tilt Angle:</Text>
                <Text style={styles.detailValue}>
                  <>
                    {plant.tilt_angle}
                    <Text style={styles.unitText}>°</Text>
                  </>
                </Text>
              </View>
            )}
          </View>
        </InfoCard> */}

        {/* Location Card */}
        {/* <InfoCard title="Location" width={cardWidth}>
          <View style={styles.detailContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Region:</Text>
              <Text style={styles.detailValue}>
                {plant?.location || "Not specified"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>
                {plant?.address || "Not specified"}
              </Text>
            </View>
            {plant?.city && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>City:</Text>
                <Text style={styles.detailValue}>{plant.city}</Text>
              </View>
            )}
            {plant?.state && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>State:</Text>
                <Text style={styles.detailValue}>{plant.state}</Text>
              </View>
            )}
            {plant?.zipCode && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Zip Code:</Text>
                <Text style={styles.detailValue}>{plant.zipCode}</Text>
              </View>
            )}
          </View>
        </InfoCard> */}

        {/* Production Calendar with tabs and width */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (plant && (plant._id || plant.id)) {
            } else {
              Alert.alert(
                "Error",
                "Plant data is not available to show details."
              );
            }
          }}
        >
          <View style={[styles.calendarCard, { width: cardWidth }]}>
            <Text style={styles.cardTitle}>Production</Text>

            <View style={localCalendarStyles.calendarTabBar}>
              {["Day", "Month", "Year", "Total"].map((tabName) => (
                <TouchableOpacity
                  key={tabName}
                  style={[
                    localCalendarStyles.calendarTab,
                    selectedProductionTab === tabName &&
                      localCalendarStyles.calendarTabActive,
                  ]}
                  onPress={() => setSelectedProductionTab(tabName)}
                >
                  <Text
                    style={[
                      localCalendarStyles.calendarTabText,
                      selectedProductionTab === tabName &&
                        localCalendarStyles.calendarTabTextActive,
                    ]}
                  >
                    {tabName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={localCalendarStyles.calendarTabContent}>
              {renderChartContent()}
            </View>
          </View>
        </TouchableOpacity>

        {/* Environment Card */}
        <View style={[styles.calendarCard, { width: cardWidth }]}>
          <SafeAreaView>
            <EnvironmentalBenefitsCard />
          </SafeAreaView>
        </View>

        {/* Date Time Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
          date={selectedDate}
          maximumDate={new Date()}
        />
      </ScrollView>

      <MenuModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        navigation={navigation}
        plant={plant}
      />
    </SafeAreaView>
  );
};

const localCalendarStyles = StyleSheet.create({
  calendarTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 15,
  },
  calendarTab: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  calendarTabActive: {
    borderBottomColor: "#dc3535",
  },
  calendarTabText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  calendarTabTextActive: {
    color: "#dc3535",
    fontWeight: "600",
  },
  calendarTabContent: {
    alignItems: "stretch",
    minHeight: 300, // Increased min height further for summary row
  },
  chartAreaContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  datePickerRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Space out arrows and date display
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
    paddingHorizontal: 10, // Add padding for arrows
  },
  dailySummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
    width: "100%", // Take full width
    backgroundColor: "#fafafa", // Slight background difference
  },
  summaryItem: {
    alignItems: "center",
    flex: 1, // Each item takes equal space
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  chartWrapper: {
    alignItems: "center",
    width: "100%",
  },
  selectedDateText: {
    fontSize: 15, // Slightly larger date text
    fontWeight: "500",
    color: "#333",
    marginRight: 0, // Remove margin, handled by spacing in parent
  },
  pickerButton: {
    padding: 5,
    borderRadius: 5,
  },
  tooltipContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 1000,
    elevation: 10,
    pointerEvents: "none", // Allow clicks to pass through
  },
  tooltipBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tooltipText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(0, 0, 0, 0.9)",
    marginTop: 2,
  },
  navButton: {
    // Style for arrow buttons
    padding: 5,
  },
  dateDisplayButton: {
    // Style for the touchable date and calendar icon
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    // backgroundColor: '#eee', // Optional for debugging touch area
    borderRadius: 5,
  },
  // ++ Add Styles for PlantDayParameterModal ++
  dayParameterContainer: {
    // Renamed from dayParameterContainer to avoid conflict if it existed elsewhere
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 5, // Align with chart card's inner padding
    width: "100%",
  },
  parameterButton: {
    // Renamed from parameterButton to avoid conflict
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20, // More rounded
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexShrink: 1, // Allow button to shrink if summary box is large
    marginRight: 10, // Space between button and summary
  },
  parameterButtonText: {
    // Renamed from parameterButtonText
    fontSize: 14,
    color: COLORS.primary, // Use primary color for text
    fontWeight: "500",
  },
  daySummaryBox: {
    backgroundColor: "#e9f5fe", // Light blue background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100, // Ensure a minimum width
    borderWidth: 1,
    borderColor: "#cce7fa",
  },
  daySummaryValueText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#005f9e", // Darker blue for value
  },
  daySummaryUnitText: {
    fontSize: 12,
    color: "#005f9e", // Darker blue for unit
    marginTop: 2,
  },
  dateNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    width: "100%",
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  dateDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    minWidth: 150,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginRight: 8,
    textAlign: "center",
  },
  calendarIcon: {
    marginLeft: 4,
  },
  tooltipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  parameterOptionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
    flexWrap: "wrap",
  },
  parameterButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  parameterButtonSelected: {
    backgroundColor: COLORS.primary, // Blue background for selected
    borderColor: COLORS.primary,
  },
  parameterButtonText: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  parameterButtonTextSelected: {
    color: "#fff", // White text for selected
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 15,
    color: COLORS.primary, // Blue text for actions
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: COLORS.primary, // Blue background for confirm
  },
  confirmButtonText: {
    color: "#fff", // White text for confirm
  },
});

const styles = StyleSheet.create({
  graphLegendContainer: {
    alignItems: "center",
    marginBottom: 5,
    paddingHorizontal: 10,
    width: "100%",
  },
  graphLegendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginVertical: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  plantDetailScrollViewContent: {
    alignItems: "center",
    paddingHorizontal: 0,
    paddingVertical: 20,
    paddingBottom: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#00875A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    position: "relative",
  },
  plantImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  placeholderText: {
    fontSize: 16,
    color: "#00875A",
    marginTop: 8,
  },
  statusBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 4,
  },
  detailContainer: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    width: "100%",
  },
  detailLabel: {
    fontSize: 15,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  unitText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 2,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F44336",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  chartContainer: {
    height: 250,
    marginHorizontal: -10,
    marginBottom: +12,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCloseText: {
    color: "#00BCD4",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalScrollView: {
    flex: 1,
  },
  chartDetailContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: "#fff",
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statUnit: {
    fontSize: 14,
    color: "#666",
    fontWeight: "normal",
  },
  chartInfoContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  chartInfoText: {
    fontSize: 16,
    marginVertical: 4,
  },
  efficiencyText: {
    fontSize: 16,
    color: "#00BCD4",
    marginVertical: 4,
  },
  legendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalCloseText: {
    color: "#00BCD4",
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
  },
  calendarCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  selectedDateInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionsCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartLoading: {
    marginVertical: 60,
  },
  chartErrorText: {
    color: COLORS.error || "#dc3545",
    fontSize: 14,
    textAlign: "center",
    padding: 30,
  },
  chartNoDataText: {
    color: "#6c757d",
    fontSize: 14,
    textAlign: "center",
    padding: 30,
  },
  dailySummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  miniCardsContainer: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f9fbfd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8edf0",
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCardDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  miniCardLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 2,
  },
  miniCardValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "bold",
  },
  chartLoadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chartLoadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
  },
  chartCardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 0,
    marginTop: 5,
    marginBottom: 10,
    width: "100%",
    overflow: "hidden",
  },

  chartScrollContainer: {
    paddingRight: 20,
    paddingLeft: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    minWidth: "100%", // Ensure minimum width is full container
  },

  // Time labels styles
  timeLabelsContainer: {
    marginTop: -5,
    width: cardWidth - 50, // Match reduced graph width
    backgroundColor: "transparent",
    padding: 0,
    paddingTop: 0,
    alignItems: "center",
    alignSelf: "center", // Center the time labels
  },
  timeLabelHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  timeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    top: -30,
    paddingLeft: 30,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
});

export default PlantDetailScreen;
