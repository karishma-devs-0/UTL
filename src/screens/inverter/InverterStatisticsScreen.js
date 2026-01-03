import React, { useState, useEffect, useCallback, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  FlatList,
  Platform,
  StatusBar,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LineChart, BarChart } from "react-native-chart-kit";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import apiClient from "../../utils/api-native";
import InverterAppBar from "./InverterAppBar";
import { SafeAreaView as SafeAreaViewSafeAreaContext } from "react-native-safe-area-context";
import { DevicesDailyPVChart } from "@/componenst/Device_Chart/DeviceDaily";
import { DevicesMonthlyPVBarChart } from "@/componenst/Device_Chart/DeviceMonthly";
import { DevicesYearlyPVBarChart } from "@/componenst/Device_Chart/DeviceYearly";
import { DevicesTotalPVBarChart } from "@/componenst/Device_Chart/DeviceTotal";
import { MonthPicker } from "@/componenst/Plants_Chart/MonthlyCalender";
import { YearlyCalendarPicker } from "@/componenst/Plants_Chart/YearlyCalender";
import DatePicker from "@/componenst/Plants_Chart/DateCalender";
import { center } from "@shopify/react-native-skia";
const COLORS = {
  primary: "#dc3545", // Changed to red
  secondary: "#6c757d",
  lightGray: "#F5F8FA",
  white: "#fff",
  error: "#dc3545",
  black: "#000000",
  border: "#E5E5E5",
};

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// Parameter definitions for different data types
const AC_DATA_PARAMETERS = {
  ac_voltage_a: { label: "AC Voltage A", unit: "V", color: "#4361EE" },
  ac_voltage_b: { label: "AC Voltage B", unit: "V", color: "#FF0000" },
  ac_voltage_c: { label: "AC Voltage C", unit: "V", color: "#FFD700" },
  ac_current_a: { label: "AC Current A", unit: "A", color: "#FFA500" },
  ac_current_b: { label: "AC Current B", unit: "A", color: "#4CC9F0" },
  ac_current_c: { label: "AC Current C", unit: "A", color: "#00875A" },
};

const DC_CURRENT_PARAMETERS = {
  dc_current_1: { label: "DC Current 1", unit: "A", color: "#8A2BE2" },
  dc_current_2: { label: "DC Current 2", unit: "A", color: "#4ECDC4" },
  dc_current_3: { label: "DC Current 3", unit: "A", color: "#FFD700" },
  dc_current_4: { label: "DC Current 4", unit: "A", color: "#FF8C00" },
};

const DC_VOLTAGE_PARAMETERS = {
  dc_voltage_1: { label: "DC Voltage 1", unit: "V", color: "#00875A" },
  dc_voltage_2: { label: "DC Voltage 2", unit: "V", color: "#90EE90" },
  dc_voltage_3: { label: "DC Voltage 3", unit: "V", color: "#FFD700" },
  dc_voltage_4: { label: "DC Voltage 4", unit: "V", color: "#FF8C00" },
};

const DC_CURRENT_VOLTAGE_PARAMETERS = {
  dc_current_1: { label: "DC Current 1", unit: "A", color: "#8A2BE2" },
  dc_voltage_1: { label: "DC Voltage 1", unit: "V", color: "#00875A" },
};

const PARAMETER_GROUPS = [
  { id: "AC_DATA", label: "AC Data", parameters: AC_DATA_PARAMETERS },
  { id: "DC_CURRENT", label: "DC Current", parameters: DC_CURRENT_PARAMETERS },
  { id: "DC_VOLTAGE", label: "DC Voltage", parameters: DC_VOLTAGE_PARAMETERS },
  {
    id: "DC_CURRENT_VOLTAGE",
    label: "DC Current & Voltage",
    parameters: DC_CURRENT_VOLTAGE_PARAMETERS,
  },
];

// Update month parameters with red color
const MONTH_PARAMETERS = {
  production: { label: "Production", unit: "kWh", color: "#dc3545" }, // Changed to red
  gridFeed: { label: "Grid Feed", unit: "kWh", color: "#4CC9F0" },
};

// Add these constants for year data
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

// Add unit constants for each tab
const TAB_UNITS = {
  Day: "",
  Month: "kWh",
  Year: "MWh",
  Total: "MWh",
};

// Add chart configurations before the component
const monthChartConfig = {
  backgroundColor: COLORS.white,
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo: COLORS.white,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  barPercentage: 0.7,
  propsForLabels: {
    fontSize: 10,
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: "#e0e0e0", // Light grey grid lines
    strokeWidth: 0.8,
  },
};

const yearChartConfig = {
  ...monthChartConfig,
  barPercentage: 0.8,
  color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
};

const InverterStatisticsScreen = ({ route }) => {
  // Get deviceData from route params, handling both formats (device and deviceData)
  const deviceData = route.params?.deviceData || route.params?.device;

  console.log(
    "[InverterStatisticsScreen] Received route.params:",
    JSON.stringify(route.params)
  );
  console.log(
    "[InverterStatisticsScreen] Extracted deviceData:",
    JSON.stringify(deviceData)
  );

  // Get device ID, handling all possible property names and formats
  const deviceId =
    deviceData?.loggerSno ||
    deviceData?.logger_sno ||
    deviceData?.sno ||
    deviceData?.sn ||
    deviceData?.device_sn;

  // Get inverter ID for the AppBar title
  const inverterId =
    deviceData?.inverterSno ||
    deviceData?.inverter_sno ||
    deviceData?.sno ||
    deviceData?.id ||
    "";

  // Ensure deviceId is properly formatted (should start with '&')
  const formattedDeviceId = deviceId
    ? deviceId.startsWith("&")
      ? deviceId
      : `${deviceId}`
    : null;

  console.log("[InverterStatisticsScreen] Using deviceId:", formattedDeviceId);

  // State
  const [selectedTab, setSelectedTab] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Parameter selection state
  const [selectedParameterGroup, setSelectedParameterGroup] =
    useState("AC_DATA");
  const [selectedParameters, setSelectedParameters] = useState(
    Object.keys(AC_DATA_PARAMETERS)
  );
  const [isParameterModalVisible, setIsParameterModalVisible] = useState(false);

  // Format date for API
  const formatDateForAPI = useCallback((date) => {
    return date.toISOString().split("T")[0];
  }, []);

  // Add this helper function for creating full day hours array
  const createFullDayHours = useCallback(() => {
    return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  }, []);

  // Update the aggregation function to use more granular data
  const aggregateDataByInterval = useCallback(
    (data) => {
      if (!data || data.length === 0) return [];

      // Sort data by time
      const sortedData = [...data].sort((a, b) => {
        const timeA = a.time.split(" ")[1];
        const timeB = b.time.split(" ")[1];
        return timeA.localeCompare(timeB);
      });

      // Remove the filter to include all hours (0-23)
      // Process each data point without downsampling
      return sortedData.map((item) => {
        const hour = item.time.split(" ")[1].split(":")[0];
        const point = { time: hour };

        selectedParameters.forEach((param) => {
          const value = parseFloat(item[param]);
          point[param] = !isNaN(value) ? value : null;
        });

        return point;
      });
    },
    [selectedParameters]
  );

  // Update the fetchData function to handle more granular data
  const fetchData = useCallback(async () => {
    if (!formattedDeviceId || selectedParameters.length === 0) {
      console.log("[InverterStatisticsScreen] Missing deviceId or parameters");
      setChartData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "[InverterStatisticsScreen] Fetching data for device:",
        formattedDeviceId
      );
      console.log(
        "[InverterStatisticsScreen] Selected date:",
        formatDateForAPI(selectedDate)
      );

      const response = await apiClient.post(
        "charts/devices/daily/device_daily_chart",
        {
          device_sn: formattedDeviceId,
          date_parameter: formatDateForAPI(selectedDate),
        }
      );

      console.log(
        "[InverterStatisticsScreen] Raw API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (!response.data?.results || response.data.results.length === 0) {
        console.log("[InverterStatisticsScreen] No data in API response");
        setChartData(null);
        setError("No data available for the selected date");
        return;
      }

      const aggregatedData = aggregateDataByInterval(response.data.results);
      console.log(
        "[InverterStatisticsScreen] Aggregated Data:",
        JSON.stringify(aggregatedData, null, 2)
      );

      if (!aggregatedData || aggregatedData.length === 0) {
        console.log(
          "[InverterStatisticsScreen] No valid data after aggregation"
        );
        setChartData(null);
        setError("No valid data available after processing");
        return;
      }

      // Check if we have any valid data points for the selected parameters
      const hasValidData = selectedParameters.some((param) =>
        aggregatedData.some((item) => {
          const value = parseFloat(item[param]);
          return !isNaN(value) && value !== null && value !== undefined;
        })
      );

      if (!hasValidData) {
        console.log(
          "[InverterStatisticsScreen] No valid data points for selected parameters"
        );
        setChartData(null);
        setError("No valid data available for the selected parameters");
        return;
      }

      // Create labels for hours from 00:00 to 24:00 with 3-hour intervals
      const timeLabels = [
        "00:00",
        "",
        "",
        "03:00",
        "",
        "",
        "06:00",
        "",
        "",
        "09:00",
        "",
        "",
        "12:00",
        "",
        "",
        "15:00",
        "",
        "",
        "18:00",
        "",
        "",
        "21:00",
        "",
        "",
        "24:00",
      ];

      // Format data for react-native-chart-kit
      const datasets = selectedParameters
        .map((paramKey) => {
          try {
            const hourMap = {};
            let hasValidPoints = false;

            aggregatedData.forEach((item) => {
              try {
                const hour = parseInt(item.time);
                if (hour >= 0 && hour < 24) {
                  const value = parseFloat(item[paramKey]);
                  if (!isNaN(value)) {
                    hourMap[hour] = value;
                    hasValidPoints = true;
                  }
                }
              } catch (e) {
                console.warn(`Error processing hour data for ${paramKey}:`, e);
              }
            });

            if (!hasValidPoints) {
              return null;
            }

            // Map values to labels maintaining order - using 25 points to include 24:00
            const data = Array.from({ length: 25 }, (_, i) => {
              try {
                if (i === 24) return hourMap[0] ?? null;
                return hourMap[i] ?? null;
              } catch (e) {
                console.warn(`Error processing data point at index ${i}:`, e);
                return null;
              }
            });

            return {
              data,
              color: (opacity = 1) =>
                PARAMETER_GROUPS.find(
                  (group) => group.id === selectedParameterGroup
                )?.parameters[paramKey]?.color || "#000000",
              strokeWidth: 2,
            };
          } catch (e) {
            console.error(`Error processing dataset for ${paramKey}:`, e);
            return null;
          }
        })
        .filter(Boolean);

      if (datasets.length === 0) {
        console.log(
          "[InverterStatisticsScreen] No valid datasets after processing"
        );
        setChartData(null);
        setError("No valid data available for plotting");
        return;
      }

      // Format data for react-native-chart-kit
      const formattedData = {
        labels: timeLabels,
        datasets: datasets.map((dataset) => ({
          data: dataset.data,
          color: (opacity = 1) => dataset.color(opacity),
          strokeWidth: dataset.strokeWidth,
        })),
      };

      // Final validation to ensure we have actual data to display
      const hasAnyValidData = formattedData.datasets.some((dataset) =>
        dataset.data.some((value) => value !== null && value !== undefined)
      );

      if (!hasAnyValidData) {
        console.log(
          "[InverterStatisticsScreen] No valid data in final formatted data"
        );
        setChartData(null);
        setError("No valid data available for plotting");
        return;
      }

      console.log(
        "[InverterStatisticsScreen] Final Chart Data:",
        JSON.stringify(formattedData, null, 2)
      );
      setChartData(formattedData);
    } catch (err) {
      console.error("[InverterStatisticsScreen] API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch data");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    formattedDeviceId,
    selectedDate,
    selectedParameters,
    selectedParameterGroup,
    aggregateDataByInterval,
  ]);

  // Add this helper function for formatting month date parameter
  const formatMonthParameter = (date) => {
    return date.toISOString().slice(0, 7); // Returns YYYY-MM format
  };

  // Add this function to handle monthly data fetching
  const fetchMonthlyData = useCallback(async () => {
    if (!formattedDeviceId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        "charts/devices/monthly/device_month_chart",
        {
          device_sn: formattedDeviceId,
          date_parameter: formatMonthParameter(selectedDate),
        }
      );

      if (response.data?.results?.length > 0) {
        // Create data for all days in the month
        const daysInMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        ).getDate();
        const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        // Create a map of existing data
        const dataMap = response.data.results.reduce((acc, item) => {
          acc[item.date] = item;
          return acc;
        }, {});

        // Fill in all days, using 0 for missing data
        const monthData = allDays.map((day) => ({
          date: day,
          production: dataMap[day]?.production || "0",
          gridFeed: dataMap[day]?.gridFeed || "0",
        }));
        // console("month chart data:")

        const data = {
          labels: monthData.map((item) => item.date.toString()),
          datasets: [
            {
              data: monthData.map((item) => parseFloat(item.production)),
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
              strokeWidth: 2,
            },
          ],
        };

        setChartData(data);
      } else {
        setChartData(null);
        setError("No data available for the selected month");
      }
    } catch (err) {
      console.error("Monthly API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch monthly data");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [formattedDeviceId, selectedDate]);

  // Add helper function for formatting year parameter
  const formatYearParameter = (date) => {
    return date.toISOString().slice(0, 7); // Returns YYYY-MM format
  };

  // Add this function for total data fetching
  const fetchTotalData = useCallback(async () => {
    if (!formattedDeviceId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        "charts/devices/total/device_total_chart",
        {
          device_sn: formattedDeviceId,
          date_parameter: formatYearParameter(selectedDate),
        }
      );

      console.log(
        "Total API Response:",
        JSON.stringify(response.data, null, 2)
      );

      if (response.data?.results?.length > 0) {
        // Get the production value directly from the API response
        const productionValue =
          parseFloat(response.data.results[0].production) || 0;

        const data = {
          labels: ["Total Production"],
          datasets: [
            {
              data: [productionValue.toFixed(2)],
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
            },
          ],
        };

        setChartData(data);
      } else {
        setChartData(null);
        setError("No data available");
      }
    } catch (err) {
      console.error("Total API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch total data");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [formattedDeviceId, selectedDate]);

  // Update the fetchYearlyData function
  const fetchYearlyData = useCallback(async () => {
    if (!formattedDeviceId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        "charts/devices/yearly/device_year_chart",
        {
          device_sn: formattedDeviceId,
          date_parameter: formatYearParameter(selectedDate),
        }
      );

      console.log(
        "Yearly API Response:",
        JSON.stringify(response.data, null, 2)
      );

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
      if (response.data?.results) {
        response.data.results.forEach((item) => {
          // month is 1-based in the API response, convert to 0-based for array indexing
          monthDataMap[item.month - 1] = parseFloat(item.production);
        });
      }

      const yearData = {
        labels: monthLabels,
        datasets: [
          {
            data: monthLabels.map((_, index) => {
              // Get the production value for this month if it exists, otherwise 0
              const value = monthDataMap[index] || 0;
              return value.toFixed(2); // Keep 2 decimal places
            }),
            color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
          },
        ],
      };

      setChartData(yearData);
    } catch (err) {
      console.error("Yearly API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch yearly data");
      setChartData(null);
    } finally {
      setIsLoading(false);
    }
  }, [formattedDeviceId, selectedDate]);

  // Update the useEffect to include total data fetching
  useEffect(() => {
    console.log("Tab changed:", selectedTab);

    if (selectedTab === "Day") {
      fetchData();
    } else if (selectedTab === "Month") {
      fetchMonthlyData();
    } else if (selectedTab === "Year") {
      fetchYearlyData();
    } else if (selectedTab === "Total") {
      fetchTotalData();
    }
  }, [
    selectedTab,
    fetchData,
    fetchMonthlyData,
    fetchYearlyData,
    fetchTotalData,
  ]);

  // Update parameter group selection to auto-select all parameters
  const handleParameterGroupSelect = (groupId) => {
    setSelectedParameterGroup(groupId);
    // Auto-select all parameters in the group (this applies to AC Data, DC Current, DC Voltage and other tabs)
    const groupParameters = Object.keys(
      PARAMETER_GROUPS.find((g) => g.id === groupId).parameters
    );
    setSelectedParameters(groupParameters);
  };

  // Update the chart configuration
  const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "2",
      strokeWidth: "1",
      strokeColor: "#FFFFFF",
    },
    formatYLabel: (value) => (value === null ? "" : value.toString()),
    propsForVerticalLabels: {
      fontSize: 10,
      rotation: 0,
      fontWeight: "400",
    },
    propsForHorizontalLabels: {
      fontSize: 10,
      rotation: 0,
      fontWeight: "400",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#e0e0e0",
      strokeWidth: 0.8,
    },
    propsForBottomAxis: {
      strokeWidth: 1,
      stroke: "#000000",
      strokeDasharray: "",
    },
    withInnerLines: true,
    withHorizontalLines: true,
    withOuterLines: true,
  };

  // Update the chart data formatting to use left and right axes
  const formatChartData = (data, parameters) => {
    if (!data || !parameters || parameters.length === 0) return null;

    const datasets = parameters.map((paramKey, index) => {
      const paramInfo = PARAMETER_GROUPS.find(
        (group) => group.id === selectedParameterGroup
      ).parameters[paramKey];

      // First parameter uses left axis, others use right axis
      const isRightAxis = index > 0;

      return {
        data: data.map((item) => item[paramKey]),
        color: (opacity = 1) => paramInfo.color,
        strokeWidth: 2,
        yAxisId: isRightAxis ? "right" : "left",
      };
    });

    return {
      labels: data.map((item) => item.time.split(":").slice(0, 2).join(":")),
      datasets,
    };
  };

  // Helper function to get maximum value for Y-axis scaling
  const getMaxValueForParameter = (param, chartData) => {
    if (!chartData || !chartData.datasets) return 100;
    const dataset = chartData.datasets.find((d) => d.yAxisId === param);
    if (!dataset) return 100;
    const max = Math.max(...dataset.data.filter((v) => v !== null));
    return Math.ceil(max * 1.2); // Add 20% padding
  };

  // Helper function to get appropriate interval for each parameter
  const getIntervalForParameter = (param) => {
    const paramInfo = PARAMETER_GROUPS.find(
      (group) => group.id === selectedParameterGroup
    ).parameters[param];

    switch (paramInfo.unit) {
      case "V":
        return 36;
      case "A":
        return 2;
      case "W":
        return 400;
      default:
        return 20;
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer} edges={["top", "bottom"]}>
      <InverterAppBar title={`Inverter ${inverterId}`} />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {!formattedDeviceId && (
          <View style={styles.errorBanner}>
            <Icon name="error-outline" size={20} color={COLORS.white} />
            <Text style={styles.errorBannerText}>
              Device ID is missing. Please ensure the device is properly
              selected.
            </Text>
          </View>
        )}

        <View style={styles.tabBar}>
          {["Day", "Month", "Year", "Total"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Only show parameter groups in Day tab */}
        {selectedTab === "Day" && (
          <>
            {/* <View style={styles.parameterGroupBar}>
              {PARAMETER_GROUPS.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.parameterGroupButton,
                    selectedParameterGroup === group.id &&
                      styles.activeParameterGroup,
                  ]}
                  onPress={() => handleParameterGroupSelect(group.id)}
                >
                  <Text
                    style={[
                      styles.parameterGroupText,
                      selectedParameterGroup === group.id &&
                        styles.activeParameterGroupText,
                    ]}
                  >
                    {group.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View> */}

            {/* <TouchableOpacity
              style={styles.parameterButton}
              onPress={() => setIsParameterModalVisible(true)}
            >
              <Text style={styles.parameterButtonText}>Select Parameters</Text>
              <Icon name="tune" size={24} color={COLORS.primary} />
            </TouchableOpacity> */}
          </>
        )}

        <View style={styles.dateBar}>
          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              if (selectedTab === "Day") {
                newDate.setDate(selectedDate.getDate() - 1);
              } else if (selectedTab === "Month") {
                newDate.setMonth(selectedDate.getMonth() - 1);
              } else if (selectedTab === "Year") {
                newDate.setFullYear(selectedDate.getFullYear() - 1);
              }
              setSelectedDate(newDate);
            }}
          >
            {/* <Icon name="chevron-left" size={24} color={COLORS.black} /> */}
          </TouchableOpacity>

          {/* <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
            <Text style={styles.dateText}>
              {selectedTab === "Day" && selectedDate.toLocaleDateString()}
              {selectedTab === "Month" &&
                selectedDate.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                })}
              {selectedTab === "Year" && selectedDate.getFullYear()}
              {selectedTab === "Total" && "All Time"}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => {
              const newDate = new Date(selectedDate);
              if (selectedTab === "Day") {
                newDate.setDate(selectedDate.getDate() + 1);
              } else if (selectedTab === "Month") {
                newDate.setMonth(selectedDate.getMonth() + 1);
              } else if (selectedTab === "Year") {
                newDate.setFullYear(selectedDate.getFullYear() + 1);
              }
              setSelectedDate(newDate);
            }}
          >
            {/* <Icon name="chevron-right" size={24} color={COLORS.black} /> */}
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : !chartData ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No data available for the selected period
              </Text>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedTab == "Day" && (
                  <View
                    style={{
                      width: Math.max(screenWidth * 1.1, 25 * 28),
                      height: 220,
                    }}
                  >
                    {/* <LineChart
                      data={chartData}
                      width={Math.max(screenWidth * 1.1, 25 * 28)}
                      height={220}
                      chartConfig={{
                        ...chartConfig,
                        horizontalLabelRotation: 0,
                        xLabelsOffset: 0
                      }}
                      bezier
                      style={[styles.chart, { marginHorizontal: -10 }]}
                      withDots={false}
                      withInnerLines={true}
                      withOuterLines={true}
                      withVerticalLines={true}
                      withHorizontalLines={true}
                      withVerticalLabels={true}
                      withHorizontalLabels={true}
                      withShadow={false}
                      xAxisLabel=""
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero={true}
                      segments={5}
                      renderRightAxis={true}
                      yAxisInterval={36}
                      rightYAxisInterval={0.4}
                      formatLeftAxisLabel={(value) => `${value}V`}
                      formatRightAxisLabel={(value) => `${value}kW`}
                      leftAxisColor={COLORS.primary}
                      rightAxisColor={COLORS.secondary}
                      leftYAxisOffset={50}
                      rightYAxisOffset={50}
                      gridColor="#e0e0e0"
                      horizontalLineColor="#e0e0e0"
                      verticalLineColor="#e0e0e0"
                      xAxisColor="#000000"
                      backgroundGradientFromOpacity={0}
                      backgroundGradientToOpacity={0}
                    /> */}
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          backgroundColor: "transparent",
                          paddingRight: 400,
                          alignItems: "center",
                          paddingBottom: 30,
                        }}
                      >
                        <DatePicker
                          value={selectedDate}
                          onChange={setSelectedDate}
                        />
                      </View>
                      <DevicesDailyPVChart
                        data={chartData}
                        width={300}
                        selectedDate={selectedDate}
                        height={190}
                      />
                    </View>
                  </View>
                )}
                {selectedTab == "Month" && (
                  // <BarChart
                  //   data={chartData}
                  //   width={Math.max(
                  //     screenWidth,
                  //     chartData.labels.length *
                  //       (selectedTab === "Month" ? 30 : 100)
                  //   )}
                  //   height={220}
                  //   chartConfig={{
                  //     ...(selectedTab === "Month"
                  //       ? monthChartConfig
                  //       : yearChartConfig),
                  //     color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Changed to red
                  //     propsForBackgroundLines: {
                  //       strokeDasharray: "",
                  //       stroke: "#e0e0e0",
                  //       strokeWidth: 0.8,
                  //     },
                  //   }}
                  //   style={styles.chart}
                  //   showValuesOnTopOfBars={false}
                  //   fromZero={true}
                  //   withInnerLines={true}
                  //   yAxisLabel=""
                  //   yAxisSuffix={` ${TAB_UNITS[selectedTab]}`}
                  //   gridColor="#e0e0e0"
                  // />
                  <View style={{ flex: 1, paddingTop: 10 }}>
                    <View
                      style={{
                        backgroundColor: "transparent",
                        paddingBottom: 40,
                      }}
                    >
                      <MonthPicker
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                      />
                    </View>
                    <DevicesMonthlyPVBarChart
                      width={290}
                      height={220}
                      selectedMonth={selectedMonth}
                    ></DevicesMonthlyPVBarChart>
                  </View>
                )}
                {selectedTab == "Year" && (
                  <View style={{ flex: 1, paddingTop: 10 }}>
                    <View
                      style={{
                        backgroundColor: "transparent",
                        paddingBottom: 40,
                      }}
                    >
                      <YearlyCalendarPicker
                        value={selectedYear}
                        onChange={setSelectedYear}
                      />
                    </View>
                    <DevicesYearlyPVBarChart
                      width={300}
                      height={220}
                      selectedYear={selectedYear}
                    />
                  </View>
                )}
                {selectedTab == "Total" && (
                  <View style={{ flex: 1, paddingTop: 10 }}>
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
                    <DevicesTotalPVBarChart
                      width={300}
                      height={220}
                      selectedYear={selectedYear}
                    />
                  </View>
                )}
              </ScrollView>
              {selectedTab !== "Day" && (
                <View style={styles.unitLegendContainer}>
                  {/* <View style={styles.unitLegendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: "#dc3545" },
                      ]}
                    />{" "}
             
                    <Text style={styles.legendText}>
                      Production ({TAB_UNITS[selectedTab]})
                    </Text>
                  </View> */}
                </View>
              )}
            </>
          )}
        </View>

        {/* Only show legend in Day tab */}
        {/* {selectedTab === "Day" && chartData && (
          <View style={styles.legendContainer}>
            {selectedParameters.map((param) => {
              const paramInfo = PARAMETER_GROUPS.find(
                (group) => group.id === selectedParameterGroup
              ).parameters[param];
              return (
                <View key={param} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendColor,
                      { backgroundColor: paramInfo.color },
                    ]}
                  />
                  <Text style={styles.legendText}>{paramInfo.label}</Text>
                </View>
              );
            })}
          </View>
        )} */}

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode={
            selectedTab === "Year"
              ? "date"
              : selectedTab === "Month"
                ? "date"
                : "date"
          }
          onConfirm={(date) => {
            setDatePickerVisibility(false);
            setSelectedDate(date);
          }}
          onCancel={() => setDatePickerVisibility(false)}
          date={selectedDate}
        />

        {/* Only show parameter selection modal in Day tab */}
        {selectedTab === "Day" && (
          <Modal
            visible={isParameterModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsParameterModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Parameters</Text>
                <FlatList
                  data={Object.entries(
                    PARAMETER_GROUPS.find(
                      (g) => g.id === selectedParameterGroup
                    ).parameters
                  )}
                  keyExtractor={([key]) => key}
                  renderItem={({ item: [key, value] }) => (
                    <TouchableOpacity
                      style={styles.parameterItem}
                      onPress={() => {
                        if (selectedParameters.includes(key)) {
                          setSelectedParameters(
                            selectedParameters.filter((p) => p !== key)
                          );
                        } else {
                          setSelectedParameters([...selectedParameters, key]);
                        }
                      }}
                    >
                      <Text style={styles.parameterText}>{value.label}</Text>
                      {selectedParameters.includes(key) && (
                        <Icon name="check" size={24} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setIsParameterModalVisible(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    color: "#000000",
    fontSize: 14,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  parameterGroupBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    backgroundColor: COLORS.lightGray,
  },
  parameterGroupButton: {
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeParameterGroup: {
    backgroundColor: COLORS.primary,
  },
  parameterGroupText: {
    color: "#000000",
    fontSize: 12,
  },
  activeParameterGroupText: {
    color: COLORS.white,
  },
  dateBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateText: {
    fontSize: 16,
    color: "#000000",
  },
  parameterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  parameterButtonText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  chartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
  },
  noDataText: {
    color: "#000000",
    textAlign: "center",
  },
  legendContainer: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#000000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#000000",
  },
  parameterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  parameterText: {
    fontSize: 16,
    color: "#000000",
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.error,
    marginBottom: 8,
  },
  errorBannerText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  unitLegendContainer: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  unitLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  unitLegendText: {
    fontSize: 12,
    color: "#000000",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default InverterStatisticsScreen;
