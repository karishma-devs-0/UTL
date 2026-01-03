import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Button,
  Platform,
  StatusBar,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CircularProgress from "../componenst/CircularProgress";
import DashboardCircularProgress from "../componenst/DashboardCircularProgress";
import styles from "../styles/style";
import dataManager from "../utils/dataManager.js";
import { BarChart } from "react-native-chart-kit";
import { COLORS } from "../styles/style";
import deviceService from "../services/deviceService";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import {
  formatProductionDisplay,
  formatProductionValue,
  formatProductionData,
} from "../utils/unitConversion";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView as SafeAreaViewRN } from "react-native-safe-area-context";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/api-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import SolarStatsCard from "@/componenst/ProductionChart";
import {
  apiGetDashboardService,
  getPlantStatus,
} from "@/utils/services/newdashBoardService";
import { DashboardMonthlyPVBarChart } from "@/componenst/Dashboard_Chart/DashboardMonthly";
import { DashboardYearlyPVBarChart } from "@/componenst/Dashboard_Chart/DashboardYearly";
// Get screen width for chart sizing
const screenWidth = Dimensions.get("window").width;

// Settings storage key - same as in DashboardSettingsScreen
const DASHBOARD_SETTINGS_KEY = "@dashboard_settings";

// Default visibility settings
const defaultSettings = {
  watchlist: true,
  totalPlants: true,
  circularProgress: true,
  calendar: true,
  productionBarChart: true,
  alertsWidget: true,
};

// --- Helper function to get initial/empty stats ---
const getInitialStats = () => ({
  incomplete: 0,
  offline: 0,
  partiallyOffline: 0,
  online: 0,
  total: 0,
  totalCapacity: 0,
  monthlyProduction: 0,
  totalSolarPower: 0,
  totalDailyProduction: 0,
  totalYearlyProduction: 0,
  totalProduction: 0,
});

// Helper function to get days in month
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const Dashboard = ({ navigation, route }) => {
  const fetchIdRef = useRef(0);
  const [plants, setPlants] = useState([]);
  const [stats, setStats] = useState(() => getInitialStats());
  const [onlinePlantIds, setOnlinePlantIds] = useState([]);
  const [newApiCountsAvailable, setNewApiCountsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [plantDashboardData, setPlantDashboardData] = useState(null);

  // --- RESTORE Chart/Calendar State Variables ---
  const [selectedCalendarTab, setSelectedCalendarTab] = useState("Monthly"); // Default to Monthly
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // For monthly view date
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // For yearly view date

  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [monthlyChartErrorMessage, setMonthlyChartErrorMessage] =
    useState(null);

  const [yearlyChartData, setYearlyChartData] = useState(null);
  const [yearlyChartErrorMessage, setYearlyChartErrorMessage] = useState(null);
  // --- End RESTORE Chart/Calendar State ---

  // State for the data to be passed to CircularProgress
  const [dashboardCircularProgressData, setDashboardCircularProgressData] =
    useState([]);

  // Network status state
  const [networkStatus, setNetworkStatus] = useState({
    isConnected: true,
    isInternetReachable: true,
    lastChecked: Date.now(),
  });

  // Add useEffect to monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected === null ? false : state.isConnected,
        isInternetReachable:
          state.isInternetReachable === null
            ? false
            : state.isInternetReachable,
        lastChecked: Date.now(),
      });
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected === null ? false : state.isConnected,
        isInternetReachable:
          state.isInternetReachable === null
            ? false
            : state.isInternetReachable,
        lastChecked: Date.now(),
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Add settings state
  const [dashboardSettings, setDashboardSettings] = useState(defaultSettings);

  // Add loading settings state
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load dashboard settings - this function can be called whenever we need to refresh settings
  //TODO: Dashboard-Screen
  const loadDashboardSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (savedSettings) {
        setDashboardSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("[Dashboard] Failed to load dashboard settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Initial load of settings
  useEffect(() => {
    loadDashboardSettings();
  }, []);

  // Refresh settings when screen comes into focus - this is key to reflecting changes from settings screen
  useFocusEffect(
    useCallback(() => {
      console.log("[Dashboard] Screen focused, reloading settings...");
      loadDashboardSettings();

      return () => {
        // Cleanup if needed
      };
    }, [loadDashboardSettings])
  );

  // Keep the isOffline check but update to use the local networkStatus
  const isOffline =
    !networkStatus.isConnected || !networkStatus.isInternetReachable;

  // --- RESTORE Chart Helper Functions (adapted from PlantDetail logic if needed) ---
  // Helper to create zero-filled monthly data structure
  const createZeroMonthlyData = (year, month) => {
    const numDays = daysInMonth(year, month);
    const labels = Array.from({ length: numDays }, (_, i) =>
      (i + 1).toString()
    );
    return {
      labels,
      datasets: [
        {
          data: Array(numDays).fill(0),
          color: (opacity = 1) => COLORS.primary,
        },
      ],
    };
  };

  // Helper to create zero-filled yearly data structure
  const createZeroYearlyData = () => {
    const monthOrder = [
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
    return {
      labels: monthOrder,
      datasets: [{ data: Array(12).fill(0) }],
      legend: ["Monthly Production (MWh)"], // Add legend like PlantDetail
    };
  };
  // --- End RESTORE Chart Helper Functions ---

  // --- RESTORE Chart Configurations (Copied from PlantDetail.js & Simplified) ---
  // Define common properties directly or repeat them
  const baseChartStyle = { borderRadius: 8 };
  const baseLabelColor = (opacity = 1) => `rgba(100, 100, 100, ${opacity})`; // Grey
  const baseBarColor = (opacity = 1) => `rgba(0, 100, 50, ${opacity})`; // Dark Green
  const baseBackgroundLines = {
    strokeDasharray: "",
    stroke: "#e0e0e0",
    strokeWidth: 0.5,
  };

  // Define consistent chart colors for both charts - USE SAME RED
  const chartTextColor = (opacity = 1) => `rgba(51, 51, 51, ${opacity})`;
  const chartBarColor = (opacity = 1) => `rgba(220, 53, 69, ${opacity})`; // Standardized red

  const monthlyBarChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Same red
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 8,
      padding: 0,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      strokeDasharray: "",
      stroke: "#e0e0e0",
    },
    decimalPlaces: 1,
    barPercentage: 0.5,
    propsForLabels: {
      fontSize: 10,
      fontWeight: "600",
      color: "#333333",
    },
    yAxisInterval: 1,
    formatYLabel: (value) => parseFloat(value).toLocaleString(),
    formatTopValue: false,
    paddingLeft: 5,
    paddingRight: 15,
    tooltipConfig: {
      backgroundColor: "rgba(0,0,0,0.8)",
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 4,
      tooltipTextColor: "#fff",
      tooltipTextSize: 12,
    },
  };

  const yearlyBarChartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Same red
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 8,
      padding: 0,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      strokeDasharray: "",
      stroke: "#e0e0e0",
    },
    decimalPlaces: 1,
    barPercentage: 0.5,
    propsForLabels: {
      fontSize: 10,
      fontWeight: "600",
      color: "#333333",
    },
    yAxisInterval: 1,
    formatYLabel: (value) => parseFloat(value).toLocaleString(),
    formatTopValue: false,
    paddingLeft: 5,
    paddingRight: 15,
    tooltipConfig: {
      backgroundColor: "rgba(0,0,0,0.8)",
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 4,
      tooltipTextColor: "#fff",
      tooltipTextSize: 12,
    },
  };
  // --- End RESTORE Chart Configurations ---

  // Add date picker state and handlers
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
  const [isYearPickerVisible, setYearPickerVisible] = useState(false);

  // Add tooltip state
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState({
    value: 0,
    label: "",
    x: 0,
    y: 0,
  });

  // Add state for selected bar
  const [selectedBarIndex, setSelectedBarIndex] = useState(null);

  const handleMonthPickerConfirm = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      setSelectedMonth(date);
    } else {
      setSelectedMonth(new Date());
    }
    setMonthPickerVisible(false);
  };

  const handleYearPickerConfirm123 = (date) => {
    setSelectedYear(date.getFullYear());
    setYearPickerVisible(false);
  };
  const handleYearPickerConfirm = (date) => {
    if (date instanceof Date && !isNaN(date)) {
      setSelectedYear(date.getFullYear());
    }
    setYearPickerVisible(false);
  };

  // Update handleBarPress to set selected bar
  const handleBarPress = (
    index,
    chartType = selectedCalendarTab,
    barWidth = 20,
    chartStartX = 50
  ) => {
    let value, label, x, y;
    if (chartType === "Monthly" || chartType === "monthly") {
      value = monthlyChartData?.datasets[0]?.data[index] || 0;
      label = `Day ${index + 1}`;
      x = chartStartX + index * barWidth + barWidth / 2;
      y = 30;
    } else {
      value = yearlyChartData?.datasets[0]?.data[index] || 0;
      const monthNames = [
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
      label = monthNames[index];
      x = chartStartX + index * barWidth + barWidth / 2;
      y = 30;
    }
    setSelectedBarIndex(index);
    setTooltipData({ value, label, x, y });
    setTooltipVisible(true);
    setTimeout(() => {
      setTooltipVisible(false);
      setSelectedBarIndex(null);
    }, 3000);
  };

  // Helper to get chart data with highlighted bar
  const getHighlightedChartData = (data, chartType) => {
    if (!data || !data.datasets || !data.datasets[0]) return data;
    const baseColor = "rgba(220, 53, 69, 1)"; // Same red as bars
    const highlightColor = "rgba(220, 53, 69, 0.6)"; // Same red but lighter opacity
    return {
      ...data,
      datasets: [
        {
          ...data.datasets[0],
          color: (opacity = 1, index) =>
            index === selectedBarIndex ? highlightColor : baseColor,
        },
      ],
    };
  };

  // State for scroll offset
  const [chartScrollX, setChartScrollX] = useState(0);

  // Update ChartTouchableOverlay to accept scrollX and chartWidth
  const ChartTouchableOverlay = ({ chartType, chartWidth, numBars }) => (
    <TouchableOpacity
      style={[
        localDashboardStyles.chartTouchableOverlay,
        { width: chartWidth },
      ]}
      onPress={(event) =>
        handleChartTouch(event, chartType, chartWidth, numBars)
      }
      activeOpacity={1}
    />
  );

  // Update handleChartTouch to use scroll offset and dynamic bar width
  const handleChartTouch = (event, chartType, chartWidth, numBars) => {
    const { locationX } = event.nativeEvent;
    const yAxisWidth = 40;
    const padding = 10;
    const chartStartX = yAxisWidth + padding;
    const scrollX = chartScrollX;
    const relativeX = locationX + scrollX;
    const barWidth = (chartWidth - yAxisWidth - padding) / numBars;
    let barIndex = Math.floor((relativeX - chartStartX) / barWidth);
    if (barIndex < 0) barIndex = 0;
    if (chartType === "monthly" || chartType === "Monthly") {
      if (
        barIndex >= 0 &&
        barIndex < (monthlyChartData?.datasets[0]?.data?.length || 0)
      ) {
        handleBarPress(barIndex, "Monthly", barWidth, chartStartX);
      }
    } else {
      if (
        barIndex >= 0 &&
        barIndex < (yearlyChartData?.datasets[0]?.data?.length || 0)
      ) {
        handleBarPress(barIndex, "Yearly", barWidth, chartStartX);
      }
    }
  };

  const hideTooltip = () => {
    setTooltipVisible(false);
  };

  // Add fetchDashboardData function

  const fetchDashboardData = async () => {
    try {
      //TODO: API-CALL
      const response = apiGetDashboardService();
      console.log("[Dashboard] >>>>>>>>>>>>>>> fetched data >>", response.data);
      //const response = await axios.get('https://utlsolarrms.com/api/dashboard');
      if (response.data.success && response.data.data) {
        setPlantDashboardData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // Modify fetchPlantsAndStats to include dashboard data fetch
  const fetchPlantsAndStats = async (
    isRetry = false,
    isManualRefresh = false
  ) => {
    const currentFetchId = ++fetchIdRef.current;

    if (isRefreshing && !isManualRefresh && !isRetry) {
      console.log("[Dashboard] Skipping fetch - already refreshing");
      return;
    }

    if (!isManualRefresh && !isRetry) {
      setIsLoading(true);
    }
    setFetchError(null);

    // Fetch dashboard data first
    await fetchDashboardData();

    let plantsDataForList = [];
    let loadedPlantsSource = null;

    try {
      const initialNetStateCheck = await dataManager.checkConnection();
      if (!isManualRefresh) {
        const cachedResult = await dataManager.getPlants(true);
        if (cachedResult.success && cachedResult.data?.length > 0) {
          plantsDataForList = cachedResult.data;
          if (currentFetchId === fetchIdRef.current)
            setPlants(plantsDataForList);
          loadedPlantsSource = "cache";
        }
      }
      if (initialNetStateCheck) {
        const serverPlantsResult = await dataManager.getPlants(false);
        if (serverPlantsResult.success) {
          plantsDataForList = serverPlantsResult.data || [];
          if (currentFetchId === fetchIdRef.current)
            setPlants(plantsDataForList);
          loadedPlantsSource = "server";
        } else if (!loadedPlantsSource) {
          if (currentFetchId === fetchIdRef.current)
            setFetchError(
              serverPlantsResult.error ||
                "Failed to fetch plant list from server."
            );
        }
      }
    } catch (e) {
      console.error("[Dashboard] Error fetching plant list:", e);
      if (currentFetchId === fetchIdRef.current) {
        setFetchError("Error loading plant list.");
      }
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }

    let newApiCounts = null;
    let newApiSucceeded = false;
    const netState = await dataManager.checkConnection();

    if (netState) {
      try {
        //TODO: API-CALL
        const plantStatusResponse = await getPlantStatus();
        //const plantStatusResponse = await fetch('https://utlsolarrms.com/api/plantStatus');
        if (currentFetchId !== fetchIdRef.current) return;

        if (plantStatusResponse.ok) {
          const plantStatusData = await plantStatusResponse.json();
          if (currentFetchId !== fetchIdRef.current) return;

          if (plantStatusData.success && plantStatusData.data) {
            newApiCounts = {
              online: plantStatusData.data.online?.count || 0,
              offline: plantStatusData.data.offline?.count || 0,
              incomplete: plantStatusData.data.incomplete?.count || 0,
              partiallyOffline:
                plantStatusData.data.partiallyOffline?.count || 0,
              total: plantStatusData.data.total?.count || 0,
            };
            if (currentFetchId === fetchIdRef.current) {
              setOnlinePlantIds(plantStatusData.data.online?.plantIds || []);
            }
            newApiSucceeded = true;
            console.log(
              "[Dashboard] fetchId:",
              currentFetchId,
              "Successfully fetched counts from new API (plantStatus):",
              newApiCounts
            );
          } else {
            console.warn(
              "[Dashboard] fetchId:",
              currentFetchId,
              "New API (plantStatus) call was OK but data format unexpected or success:false:",
              plantStatusData
            );
            newApiSucceeded = false;
          }
        } else {
          console.error(
            "[Dashboard] fetchId:",
            currentFetchId,
            "Failed to fetch from new API (plantStatus), status:",
            plantStatusResponse.status
          );
          newApiSucceeded = false;
        }
      } catch (e) {
        console.error(
          "[Dashboard] fetchId:",
          currentFetchId,
          "Error during fetch from new API (plantStatus):",
          e
        );
        newApiSucceeded = false;
      }
      if (currentFetchId === fetchIdRef.current) {
        setNewApiCountsAvailable(newApiSucceeded);
      }
    }
    if (currentFetchId !== fetchIdRef.current && netState) return;

    let summaryApiData = null;
    let summaryApiSucceeded = false;
    if (netState) {
      try {
        const summaryResult = await deviceService.getDashboardSummary();
        if (currentFetchId !== fetchIdRef.current) return;

        if (summaryResult.success && summaryResult.data) {
          summaryApiData = summaryResult.data;
          summaryApiSucceeded = true;
          console.log(
            "[Dashboard] fetchId:",
            currentFetchId,
            "Successfully fetched dashboard summary (old API - deviceService):",
            summaryApiData
          );
        } else {
          console.warn(
            "[Dashboard] fetchId:",
            currentFetchId,
            "getDashboardSummary (old API - deviceService) did NOT return success or data. Result:",
            JSON.stringify(summaryResult, null, 2)
          );
        }
      } catch (e) {
        console.error(
          "[Dashboard] fetchId:",
          currentFetchId,
          "Error during fetch from getDashboardSummary (old API - deviceService):",
          e
        );
      }
    }
    if (currentFetchId !== fetchIdRef.current && netState) return;

    if (currentFetchId === fetchIdRef.current) {
      if (netState) {
        setStats((prevStats) => {
          const combinedStats = { ...prevStats };

          if (newApiSucceeded && newApiCounts) {
            combinedStats.online = newApiCounts.online;
            combinedStats.offline = newApiCounts.offline;
            combinedStats.incomplete = newApiCounts.incomplete;
            combinedStats.partiallyOffline = newApiCounts.partiallyOffline;
            combinedStats.total = newApiCounts.total;
          } else {
            console.log(
              "[Dashboard] fetchId:",
              currentFetchId,
              "New API counts not used or failed. Retaining prev values for its fields."
            );
          }

          if (summaryApiSucceeded && summaryApiData) {
            combinedStats.totalCapacity =
              parseFloat(
                summaryApiData.installed_capacity ||
                  summaryApiData.total_capacity_kwp ||
                  summaryApiData.totalCapacity ||
                  summaryApiData.capacity
              ) || 0;
            combinedStats.totalSolarPower =
              parseFloat(
                summaryApiData.current_power ||
                  summaryApiData.total_solar_power_kw ||
                  summaryApiData.totalSolarPower ||
                  summaryApiData.solar_power
              ) || 0;
            combinedStats.totalDailyProduction =
              parseFloat(
                summaryApiData.daily_production ||
                  summaryApiData.total_daily_production_kwh
              ) || 0;
            combinedStats.monthlyProduction =
              parseFloat(
                summaryApiData.monthly_production ||
                  summaryApiData.monthlyProduction ||
                  summaryApiData.total_monthly_production_kwh
              ) || 0;
            combinedStats.totalYearlyProduction =
              parseFloat(
                summaryApiData.yearly_production ||
                  summaryApiData.yearlyProduction ||
                  summaryApiData.total_yearly_production_mwh
              ) || 0;
            combinedStats.totalProduction =
              parseFloat(
                summaryApiData.total_production ||
                  summaryApiData.totalProduction ||
                  summaryApiData.grand_total_production_mwh
              ) || 0;
            combinedStats.alert =
              parseInt(summaryApiData.alert_count || summaryApiData.alert) || 0;
          } else {
            console.log(
              "[Dashboard] fetchId:",
              currentFetchId,
              "Summary API data not used or failed. Retaining prev values for its fields."
            );
          }
          console.log(
            "[Dashboard] fetchId:",
            currentFetchId,
            "Final combinedStats to be set:",
            JSON.stringify(combinedStats, null, 2)
          );

          const overviewData = [
            {
              name: "Overall Dashboard",
              capacity: combinedStats.totalCapacity,
              solar_power: combinedStats.totalSolarPower,
              daily_production: combinedStats.totalDailyProduction,
              monthlyProduction: combinedStats.monthlyProduction,
              yearlyProduction: combinedStats.totalYearlyProduction,
              totalProduction: combinedStats.totalProduction,
            },
          ];
          setDashboardCircularProgressData(overviewData);
          setUsingMockData(!(newApiSucceeded || summaryApiSucceeded));

          return combinedStats;
        });
      } else {
        console.log(
          "[Dashboard] fetchId:",
          currentFetchId,
          "Offline. Attempting to use cached plant list for manual stat calculation."
        );
        if (plantsDataForList.length > 0) {
          updateStateWithManualPlantStats(plantsDataForList, newApiSucceeded);
          setUsingMockData(true);
        } else {
          setFetchError(
            fetchError || "You are offline and no cached data is available."
          );
          setStats(getInitialStats());
          setDashboardCircularProgressData([]);
          setUsingMockData(true);
        }
      }
    }
  };

  // Update the updateStateWithManualPlantStats function to handle unit conversion
  const updateStateWithManualPlantStats = (plantsData, newApiDidSucceed) => {
    console.log(
      "[Dashboard] updateStateWithManualPlantStats called. newApiDidSucceed:",
      newApiDidSucceed
    );
    let totalSolarPowerAgg = 0;
    let totalDailyProductionAgg = 0;
    let totalYearlyProductionAgg = 0;
    let totalProductionAgg = 0;
    let totalCapacityAgg = 0;
    let monthlyProductionAgg = 0;
    let incompleteCount = 0;
    let offlineCount = 0;
    let alertCount = 0;

    plantsData.forEach((plant) => {
      if (plant.productionData) {
        const formattedData = formatProductionData(plant.productionData);
        totalCapacityAgg +=
          parseFloat(formattedData.installed_capacity.value) || 0;
        totalSolarPowerAgg +=
          parseFloat(formattedData.current_power.value) || 0;
        totalDailyProductionAgg +=
          parseFloat(formattedData.daily_production.value) || 0;
        monthlyProductionAgg +=
          parseFloat(formattedData.monthly_production.value) || 0;
        totalYearlyProductionAgg +=
          parseFloat(formattedData.yearly_production.value) || 0;
        totalProductionAgg +=
          parseFloat(formattedData.total_production.value) || 0;
      }

      // Update status counts
      if (plant.status === "incomplete") incompleteCount++;
      else if (plant.status === "offline") offlineCount++;
      if (plant.hasAlerts) alertCount++;
    });

    // Format aggregated values
    const aggregatedStats = {
      totalCapacity: formatProductionValue(totalCapacityAgg),
      totalSolarPower: formatProductionValue(totalSolarPowerAgg),
      totalDailyProduction: formatProductionValue(totalDailyProductionAgg),
      monthlyProduction: formatProductionValue(monthlyProductionAgg),
      totalYearlyProduction: formatProductionValue(
        totalYearlyProductionAgg,
        "MWh"
      ),
      totalProduction: formatProductionValue(totalProductionAgg, "MWh"),
      incompleteCount,
      offlineCount,
      alertCount,
    };

    setStats(aggregatedStats);
    setApiDidSucceed(newApiDidSucceed);
  };

  // Initial useEffect to load data
  useEffect(() => {
    fetchPlantsAndStats();
  }, []); // Initial fetch

  // useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // console.log('Dashboard focused, re-fetching plants and stats...');
      fetchPlantsAndStats(false, true); // Treat as manual refresh to get fresh server data
      return () => {
        // console.log('Dashboard unfocused');
      };
    }, []) // Empty dependency array means it runs on every focus
  );

  // Fetch data on initial mount and when network status changes
  useEffect(() => {
    // console.log("Dashboard useEffect triggered: Initial mount or network change.");
    fetchPlantsAndStats();
  }, [networkStatus.isConnected]);

  // --- RESTORE Chart Fetching Functions (Adapted for Dashboard - First Plant Only) ---
  const fetchMonthChartData = useCallback(
    async (monthDate, currentPlants) => {
      if (!currentPlants || currentPlants.length === 0) {
        setMonthlyChartData(null);
        setIsChartLoading(false);
        return;
      }

      setIsChartLoading(true);
      setMonthlyChartErrorMessage(null);

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      const monthYearStr = `${year}-${String(month).padStart(2, "0")}`;

      try {
        // Use the correct API endpoint and parameters
        //TODO: API-CALL
        const response = await apiClient.post(
          "/charts/solar_power_per_project/monthly/",
          {
            plant_id: 1, // Always use plant_id: 1 for dashboard
            date_parameter: monthYearStr,
          }
        );

        console.log("Dashboard Monthly Chart Response:", response.data);

        if (response.data?.results) {
          const numDays = daysInMonth(year, month - 1);
          const productionData = new Array(numDays).fill(0);
          const labels = Array.from({ length: numDays }, (_, i) =>
            (i + 1).toString()
          );

          // Process the data from the API response
          response.data.results.forEach((item) => {
            const day = parseInt(item.date);
            if (!isNaN(day) && day >= 1 && day <= numDays) {
              const production = parseFloat(item.PvProduction) || 0;
              productionData[day - 1] = parseFloat(production.toFixed(2));
            }
          });

          console.log("monthlt-data-asper-chart", productionData);
          setMonthlyChartData({
            labels,
            datasets: [
              {
                data: productionData,
                color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Same red
              },
            ],
          });
        } else {
          console.log("Dashboard Monthly Chart: No results in response");
          setMonthlyChartErrorMessage(
            "No data available for the selected month"
          );
          setMonthlyChartData(null);
        }
      } catch (error) {
        console.error(
          "Error fetching monthly chart data:",
          error.response || error
        );
        setMonthlyChartErrorMessage(
          `Failed to fetch monthly data: ${error.message}`
        );
        setMonthlyChartData(null);
      } finally {
        setIsChartLoading(false);
      }
    },
    [daysInMonth]
  );

  const fetchYearChartData = useCallback(async (year, currentPlants) => {
    if (!currentPlants || currentPlants.length === 0) {
      setYearlyChartData(null);
      setIsChartLoading(false);
      return;
    }

    setIsChartLoading(true);
    setYearlyChartErrorMessage(null);

    try {
      // Use the correct API endpoint and parameters
      //TODO: API-CALL
      const response = await apiClient.post(
        "/charts/solar_power_per_project/yearly/",
        {
          plant_id: 1, // Always use plant_id: 1 for dashboard
          date_parameter: year,
        }
      );

      console.log("Dashboard Yearly Chart Response:", response.data);

      if (response.data?.results) {
        // Initialize array with 12 months of zero values
        const productionData = new Array(12).fill(0);
        const labels = [
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

        // Process the data from the API response
        response.data.results.forEach((item) => {
          const monthIndex = item.month - 1; // Convert 1-based month to 0-based index
          if (monthIndex >= 0 && monthIndex < 12) {
            const production = parseFloat(item.PvProduction) || 0;
            productionData[monthIndex] = parseFloat(production.toFixed(3));
          }
        });

        setYearlyChartData({
          labels,
          datasets: [
            {
              data: productionData,
              color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`, // Same red
            },
          ],
        });
      } else {
        console.log("Dashboard Yearly Chart: No results in response");
        setYearlyChartErrorMessage("No data available for the selected year");
        setYearlyChartData(null);
      }
    } catch (error) {
      console.error(
        "Error fetching yearly chart data:",
        error.response || error
      );
      setYearlyChartErrorMessage(
        `Failed to fetch yearly data: ${error.message}`
      );
      setYearlyChartData(null);
    } finally {
      setIsChartLoading(false);
    }
  }, []);
  // --- End RESTORE Chart Fetching Functions ---

  // --- RESTORE Chart useEffect hook ---
  useEffect(() => {
    // console.log(
    //   `Dashboard: useEffect (Chart Trigger) - Tab: ${selectedCalendarTab}, ` +
    //   `Month: ${selectedMonth?.toISOString()}, Year: ${selectedYear}, ` +
    //   `Plants: ${plants?.length}`
    // );

    if (plants && plants.length > 0) {
      if (selectedCalendarTab === "Monthly") {
        fetchMonthChartData(selectedMonth, plants); // Pass plants
      } else if (selectedCalendarTab === "Yearly") {
        fetchYearChartData(selectedYear, plants); // Pass plants
      }
    } else {
      // console.log("Dashboard: useEffect (Chart Trigger) - No plants, resetting charts.");
      // Ensure charts are reset if plants array becomes empty
      setMonthlyChartData(
        createZeroMonthlyData(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth()
        )
      );
      setYearlyChartData(createZeroYearlyData());
    }
    // console.log("Dashboard: useEffect (Chart Trigger) - Finished.");
  }, [
    selectedMonth,
    selectedYear,
    selectedCalendarTab,
    plants,
    fetchMonthChartData,
    fetchYearChartData,
  ]);
  // --- End RESTORE Chart useEffect hook ---

  // Custom Tooltip Component
  const CustomTooltip = ({ visible, data }) => {
    if (!visible) return null;

    return (
      <View
        style={[
          localDashboardStyles.tooltipContainer,
          {
            left: data.x - 50, // Center the tooltip on the bar
            top: data.y,
          },
        ]}
      >
        <View style={localDashboardStyles.tooltipContent}>
          <Text style={localDashboardStyles.tooltipLabel}>{data.label}</Text>
          <Text style={localDashboardStyles.tooltipValue}>
            {selectedCalendarTab === "Monthly"
              ? `${data.value.toFixed(2)} kWh`
              : `${data.value.toFixed(3)} kWh`}
          </Text>
        </View>
        <View style={localDashboardStyles.tooltipArrow} />
      </View>
    );
  };

  const renderOfflineIndicator = () => {
    if (usingMockData || isOffline) {
      return (
        <View style={styles.offlineIndicator}>
          <Icon name="cloud-off" size={16} color="#f57c00" />
          <Text style={styles.offlineText}>
            {isOffline
              ? "You are offline - using cached data"
              : "Server unavailable - using cached data"}
          </Text>
        </View>
      );
    }
    return null;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(!!query);
  };

  const filteredPlants = useMemo(() => {
    if (!isSearching || !searchQuery) {
      return [];
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return plants.filter((plant) =>
      plant.name?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [plants, searchQuery, isSearching]);

  const favoritePlants = plants.filter((plant) => plant.isFavorite === true);

  const renderSearchResultItem = ({ item }) => {
    const statusStyle =
      item.on_grid_status?.toLowerCase() === "online"
        ? { color: "green" }
        : item.on_grid_status?.toLowerCase() === "offline"
          ? { color: "red" }
          : { color: "gray" };

    return (
      //TODO:NAvigation
      <TouchableOpacity
        style={localStyles.card}
        onPress={() =>
          navigation.navigate("PlantTabs", {
            plantId: item._id || item.id,
            plantData: item,
          })
        }
      >
        <View style={localStyles.searchResultContent}>
          <Text style={localStyles.searchResultTitle}>
            {item.name || "Unnamed Plant"}
          </Text>
          <Text style={localStyles.searchResultSubtitle}>
            {item.location || "No Location"}
          </Text>
          <View style={localStyles.statusRow}>
            <Icon
              name={
                item.on_grid_status?.toLowerCase() === "online"
                  ? "check-circle"
                  : "error-outline"
              }
              size={16}
              color={statusStyle.color}
            />
            <Text style={[localStyles.searchResultStatus, statusStyle]}>
              {item.on_grid_status || "Unknown"}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>
    );
  };

  // --- RESTORE Date Navigation Handlers & Formatters ---
  const handlePreviousMonth = () => {
    setSelectedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };
  const handleNextMonth = () => {
    const nextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1
    );
    setSelectedMonth(nextMonth);
  };
  const formattedMonthYear = selectedMonth.toISOString().slice(0, 7);

  const handlePreviousYear = () => {
    setSelectedYear((prev) => prev - 1);
  };
  const handleNextYear = () => {
    const currentYear = new Date().getFullYear();
    if (selectedYear < currentYear) {
      setSelectedYear((prev) => prev + 1);
    } else {
      // console.log("Dashboard: Cannot navigate to future year.");
    }
  };
  const formattedYear = selectedYear.toString();
  // --- End RESTORE Date Navigation ---

  // Determine active plants based on search query
  const activePlants = useMemo(() => {
    if (!searchQuery) return plants;
    return plants.filter((plant) =>
      plant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [plants, searchQuery]);

  // Prepare data for CircularProgress by mapping fields
  const plantsForCircularProgress = activePlants.map((p) => ({
    ...p, // Spread existing plant properties
    // Assuming CircularProgress expects 'totalCapacity' and 'monthlyProduction'
    // API provides 'capacity'. Let's map it.
    totalCapacity: p.capacity || 0,
    // API for GET /plant doesn't provide monthlyProduction in the sample.
    // Passing 0 or null. Component should handle this.
    monthlyProduction: p.monthlyProduction || 0,
  }));

  const insets = useSafeAreaInsets();

  // App bar component with status bar padding
  //TODO:NAvigation
  const AppBar = () => {
    return (
      <View style={[localStyles.appBar, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("DashboardSettings")}
        >
          <Icon name="settings" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Dashboard</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("AddPlant")}
        >
          <Icon name="add" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={localStyles.container}>
          <AppBar />
          <View style={localStyles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={localStyles.messageText}>Loading dashboard...</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  if (fetchError && !plants.length) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent={true}
        />
        <View style={localStyles.container}>
          <AppBar />
          <View style={localStyles.centered}>
            <Icon name="error-outline" size={48} color="#f44336" />
            <Text style={localStyles.errorText}>Error: {fetchError}</Text>
            <TouchableOpacity
              style={localStyles.retryButton}
              onPress={() => fetchPlantsAndStats(true)}
            >
              <Text style={localStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  //TODO:View
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <View style={localStyles.container}>
        {/* Header */}
        <AppBar />

        {/* Offline/Loading Indicator */}
        {renderOfflineIndicator()}
        {isRefreshing && (
          <ActivityIndicator
            style={{ marginVertical: 5 }}
            size="small"
            color={COLORS.primary}
          />
        )}

        {/* Search Bar */}
        <View style={localStyles.searchContainer}>
          <Icon name="search" size={20} style={localStyles.searchIcon} />
          <TextInput
            style={localStyles.searchInput}
            placeholder="Search Plants by Name..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={() => handleSearch("")}
            clearButtonMode="while-editing"
          />
        </View>

        {isSearching ? (
          <FlatList
            data={filteredPlants}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) =>
              item._id || item.id || `plant-${Math.random()}`
            }
            style={localStyles.searchResultsList}
            contentContainerStyle={localStyles.listContent}
            ListEmptyComponent={() => (
              <View style={localStyles.emptyStateContainer}>
                <Icon name="search-off" size={40} color="#999" />
                <Text style={localStyles.emptyStateText}>
                  {`No plants found matching "${searchQuery}"`}
                </Text>
              </View>
            )}
          />
        ) : (
          <ScrollView
            style={localStyles.container}
            contentContainerStyle={localStyles.contentContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={fetchPlantsAndStats}
                colors={[COLORS.primary || "#00875A"]}
              />
            }
          >
            {/* Plants Status Card */}
            {/* TODO:NAvigation  */}

            {dashboardSettings.totalPlants && (
              <TouchableOpacity
                style={localStyles.card}
                onPress={() => navigation.navigate("Monitor")}
              >
                <View style={localStyles.cardHeader}>
                  <Icon
                    name="view-list"
                    size={20}
                    color={COLORS.primary}
                    style={localStyles.cardIcon}
                  />
                  <Text style={localStyles.cardTitle}>
                    Total Plants (
                    {networkStatus.isConnected && newApiCountsAvailable
                      ? stats.total
                      : plants.length}
                    )
                  </Text>
                  <Icon name="chevron-right" size={24} color="#777" />
                </View>

                <View style={localStyles.plantStatusList}>
                  <View style={localStyles.statusListItem}>
                    <Icon
                      name="eco"
                      size={22}
                      color={COLORS.success || "#00875A"}
                    />
                    <Text style={localStyles.statusText}>
                      Incomplete ({stats.incomplete})
                    </Text>
                  </View>

                  <View style={localStyles.statusListItem}>
                    <Icon
                      name="power-off"
                      size={22}
                      color={COLORS.warning || "#FF9800"}
                    />
                    <Text style={localStyles.statusText}>
                      Offline ({stats.offline})
                    </Text>
                  </View>

                  <View style={localStyles.statusListItem}>
                    <Icon
                      name="signal-wifi-statusbar-connected-no-internet-4"
                      size={22}
                      color={COLORS.info || "#9C27B0"}
                    />
                    <Text style={localStyles.statusText}>
                      Partially Offline ({stats.partiallyOffline})
                    </Text>
                  </View>

                  <View style={localStyles.statusListItem}>
                    <Icon
                      name="check-circle-outline"
                      size={22}
                      color={COLORS.success || "#4CAF50"}
                    />
                    <Text style={localStyles.statusText}>
                      Online ({stats.online})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            <SolarStatsCard percentage={plantDashboardData} />

            {/* Circular Progress Graph */}
            {dashboardSettings.circularProgress && plantDashboardData && (
              <View style={localStyles.card}>
                <View style={localStyles.cardHeader}>
                  <Icon
                    name="pie-chart"
                    size={20}
                    color={COLORS.primary}
                    style={localStyles.cardIcon}
                  />
                  <Text style={localStyles.cardTitle}>
                    {" "}
                    Production Overview
                  </Text>
                </View>
                <View style={localStyles.circularProgressWrapper}>
                  <DashboardCircularProgress
                    dashboardData={plantDashboardData}
                    width={screenWidth - 64}
                    title=""
                    style={localStyles.circularProgressContainer}
                  />
                </View>
              </View>
            )}

            {/* Production Calendar Section */}
            {dashboardSettings.calendar && (
              <View style={localStyles.card}>
                <View style={localStyles.cardHeader}>
                  <Icon
                    name="date-range"
                    size={20}
                    color={COLORS.primary}
                    style={localStyles.cardIcon}
                  />
                  <Text style={localStyles.cardTitle}>Production Calendar</Text>
                </View>

                {/* Tab Bar */}
                <View style={localDashboardStyles.calendarTabBar}>
                  {["Monthly", "Yearly"].map((tabName) => (
                    <TouchableOpacity
                      key={tabName}
                      style={[
                        localDashboardStyles.calendarTab,
                        selectedCalendarTab === tabName &&
                          localDashboardStyles.calendarTabActive,
                      ]}
                      onPress={() => setSelectedCalendarTab(tabName)}
                      disabled={isChartLoading}
                    >
                      <Text
                        style={[
                          localDashboardStyles.calendarTabText,
                          selectedCalendarTab === tabName &&
                            localDashboardStyles.calendarTabTextActive,
                        ]}
                      >
                        {tabName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date Navigators */}
                {selectedCalendarTab === "Monthly" && (
                  <View style={localDashboardStyles.dateNavigator}>
                    <TouchableOpacity
                      onPress={handlePreviousMonth}
                      style={[
                        localDashboardStyles.navButton,
                        isChartLoading && { opacity: 0.5 },
                      ]}
                      disabled={isChartLoading}
                    >
                      <Icon name="chevron-left" size={28} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setMonthPickerVisible(true)}
                      style={localDashboardStyles.dateDisplayContainer}
                    >
                      <Text style={localDashboardStyles.dateText}>
                        {selectedMonth.toLocaleDateString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                      <Icon
                        name="calendar-today"
                        size={20}
                        color="#555"
                        style={localDashboardStyles.calendarIcon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleNextMonth}
                      style={[localDashboardStyles.navButton]}
                      disabled={isChartLoading}
                    >
                      <Icon name="chevron-right" size={28} color="#555" />
                    </TouchableOpacity>
                  </View>
                )}

                {selectedCalendarTab === "Yearly" && (
                  <View style={localDashboardStyles.dateNavigator}>
                    <TouchableOpacity
                      onPress={handlePreviousYear}
                      style={[
                        localDashboardStyles.navButton,
                        isChartLoading && { opacity: 0.5 },
                      ]}
                      disabled={isChartLoading}
                    >
                      <Icon name="chevron-left" size={28} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setYearPickerVisible(true)}
                      style={localDashboardStyles.dateDisplayContainer}
                    >
                      <Text style={localDashboardStyles.dateText}>
                        {formattedYear}
                      </Text>
                      <Icon
                        name="event"
                        size={20}
                        color="#555"
                        style={localDashboardStyles.calendarIcon}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleNextYear}
                      style={[localDashboardStyles.navButton]}
                      disabled={isChartLoading}
                    >
                      <Icon name="chevron-right" size={28} color="#555" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Date Pickers */}
                <DateTimePickerModal
                  isVisible={isMonthPickerVisible}
                  mode="date"
                  onConfirm={handleMonthPickerConfirm}
                  onCancel={() => setMonthPickerVisible(false)}
                  date={selectedMonth}
                />

                <DateTimePickerModal
                  isVisible={isYearPickerVisible}
                  mode="date"
                  onConfirm={handleYearPickerConfirm}
                  onCancel={() => setYearPickerVisible(false)}
                  date={new Date(selectedYear, 0, 1)}
                />

                {/* Chart Content Area */}
                <View style={localDashboardStyles.calendarTabContent}>
                  {/* Monthly Chart */}
                  {selectedCalendarTab === "Monthly" && (
                    <View style={localDashboardStyles.chartWrapper}>
                      {/* <Text style={localDashboardStyles.chartSubTitle}>
                        Daily Production (kWh) - {formattedMonthYear}
                      </Text> */}
                      {isChartLoading ? (
                        <View
                          style={localDashboardStyles.chartLoadingContainer}
                        >
                          <ActivityIndicator
                            size="small"
                            color={COLORS.primary}
                          />
                          <Text style={localDashboardStyles.chartLoadingText}>
                            Loading chart data...
                          </Text>
                        </View>
                      ) : monthlyChartErrorMessage ? (
                        <Text style={localDashboardStyles.errorMessageText}>
                          {monthlyChartErrorMessage}
                        </Text>
                      ) : (
                        <View
                          style={[
                            localDashboardStyles.chartContainer,
                            { marginLeft: -10 },
                          ]}
                        >
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 10 }}
                            scrollEventThrottle={16}
                            onScroll={(e) =>
                              setChartScrollX(e.nativeEvent.contentOffset.x)
                            }
                          >
                            {/*TODO: MONTHLY CHART VIEW */}
                            {/* <View style={localDashboardStyles.chartWrapper}>
                              <BarChart
                                data={getHighlightedChartData(
                                  monthlyChartData,
                                  "monthly"
                                )}
                                width={Math.max(
                                  screenWidth - 40,
                                  monthlyChartData.labels.length * 20
                                )}
                                height={240}
                                chartConfig={monthlyBarChartConfig}
                                verticalLabelRotation={0}
                                showValuesOnTopOfBars={false}
                                fromZero={true}
                                yAxisLabel=""
                                yAxisSuffix=""
                                withInnerLines={true}
                                showBarTops={true}
                                withHorizontalLabels={true}
                                showTooltip={true}
                                withVerticalLabels={true}
                                yAxisWidth={40}
                                style={{
                                  borderRadius: 8,
                                }}
                              />
                              <ChartTouchableOverlay
                                chartType="monthly"
                                chartWidth={Math.max(
                                  screenWidth - 40,
                                  monthlyChartData.labels.length * 20
                                )}
                                numBars={monthlyChartData.labels.length}
                              />
                            </View> */}
                            <View style={localDashboardStyles.chartWrapper}>
                              <View style={{ flex: 1, paddingTop: 30 }}>
                                <DashboardMonthlyPVBarChart
                                  width={300}
                                  height={200}
                                  selectedMonth={selectedMonth}
                                ></DashboardMonthlyPVBarChart>
                              </View>
                            </View>
                          </ScrollView>
                          <CustomTooltip
                            visible={tooltipVisible}
                            data={tooltipData}
                          />
                          {tooltipVisible && (
                            <TouchableOpacity
                              style={localDashboardStyles.tooltipOverlay}
                              onPress={hideTooltip}
                              activeOpacity={1}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Yearly Chart */}
                  {selectedCalendarTab === "Yearly" && (
                    <View style={localDashboardStyles.chartWrapper}>
                      {/* <Text style={localDashboardStyles.chartSubTitle}>
                        Monthly Production (MWh) - {selectedYear}
                      </Text> */}
                      {isChartLoading ? (
                        <View
                          style={localDashboardStyles.chartLoadingContainer}
                        >
                          <ActivityIndicator
                            size="small"
                            color={COLORS.primary}
                          />
                          <Text style={localDashboardStyles.chartLoadingText}>
                            Loading chart data...
                          </Text>
                        </View>
                      ) : yearlyChartErrorMessage ? (
                        <Text style={localDashboardStyles.errorMessageText}>
                          {yearlyChartErrorMessage}
                        </Text>
                      ) : (
                        <View style={localDashboardStyles.chartContainer}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingRight: 10 }}
                          >
                            <View style={localDashboardStyles.chartWrapper}>
                              {/* <BarChart
                                data={getHighlightedChartData(
                                  yearlyChartData,
                                  "yearly"
                                )}
                                width={Math.max(
                                  screenWidth - 40,
                                  yearlyChartData.labels.length * 40
                                )}
                                height={240}
                                chartConfig={yearlyBarChartConfig}
                                verticalLabelRotation={0}
                                showValuesOnTopOfBars={false}
                                fromZero={true}
                                yAxisLabel=""
                                yAxisSuffix=""
                                withInnerLines={true}
                                showBarTops={true}
                                withHorizontalLabels={true}
                                showTooltip={true}
                                withVerticalLabels={true}
                                yAxisWidth={40}
                                style={{
                                  borderRadius: 8,
                                }}
                              /> */}
                              <View style={{ flex: 1, paddingTop: 30 }}>
                                <DashboardYearlyPVBarChart
                                  width={300}
                                  height={220}
                                  selectedYear={selectedYear}
                                />
                              </View>
                              {/* <ChartTouchableOverlay
                                chartType="yearly"
                                chartWidth={Math.max(
                                  screenWidth - 40,
                                  yearlyChartData.labels.length * 40
                                )}
                                numBars={yearlyChartData.labels.length}
                              /> */}
                            </View>
                          </ScrollView>
                          <CustomTooltip
                            visible={tooltipVisible}
                            data={tooltipData}
                          />
                          {tooltipVisible && (
                            <TouchableOpacity
                              style={localDashboardStyles.tooltipOverlay}
                              onPress={hideTooltip}
                              activeOpacity={1}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaProvider>
  );
};

// Local Dashboard styles
const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingBottom: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    width: "100%",
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  searchIcon: {
    marginRight: 8,
    color: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cardIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary || "#00875A",
    flex: 1,
  },
  messageText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary || "#00875A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 50,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultContent: {
    flex: 1,
    paddingRight: 8,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchResultStatus: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  circularProgressContainer: {
    backgroundColor: "transparent",
    padding: 0,
    margin: 0,
  },
  circularProgressWrapper: {
    width: "100%",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  plantStatusList: {
    marginTop: 5,
  },
  statusListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statusText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
});

// Keep the existing dashboard styles
const localDashboardStyles = StyleSheet.create({
  calendarTabBar: {
    flexDirection: "row",
    justifyContent: "center", // Left align the tabs
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 0, // Remove horizontal padding
  },
  calendarTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 20, // Add spacing between tabs
    marginLeft: 0, // No left margin on first tab
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  calendarTabActive: {
    borderBottomColor: COLORS.primary || "#00875A",
  },
  calendarTabText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  calendarTabTextActive: {
    color: COLORS.primary || "#00875A",
    fontWeight: "700",
  },
  calendarTabContent: {
    marginTop: 5,
    alignItems: "center",
    minHeight: 280,
    justifyContent: "flex-start",
    width: "100%",
    paddingHorizontal: 5,
  },
  chartWrapper: {
    position: "relative",
  },
  chartSubTitle: {
    fontSize: 14,
    color: "#444",
    marginBottom: 10,
    marginTop: 5,
    fontWeight: "500",
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
  errorMessageText: {
    color: COLORS.danger || "#dc3545",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    color: "#6c757d",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
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
  tooltipContainer: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    borderRadius: 8,
    padding: 10,
    zIndex: 1000,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipContent: {
    alignItems: "center",
  },
  tooltipLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  tooltipValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: "transparent",
    borderRightWidth: 6,
    borderRightColor: "transparent",
    borderTopWidth: 6,
    borderTopColor: "rgba(0, 0, 0, 0.9)",
    alignSelf: "center",
    marginTop: 4,
  },
  chartContainer: {
    position: "relative",
    marginLeft: -10,
  },
  tooltipOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  chartTouchableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
});

export default Dashboard;
