import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/style";
import { useIsFocused } from "@react-navigation/native";
import axios from "axios";
import dataManager from "../utils/dataManager.js"; // Use dataManager
import deviceService from "../services/deviceService"; // Assuming deviceService is correctly imported

// Helper function to format timestamp
const formatTimestamp = (isoString) => {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      const modifiedIsoString =
        isoString.replace(" ", "T") + (isoString.endsWith("Z") ? "" : "Z");
      const modifiedDate = new Date(modifiedIsoString);
      if (isNaN(modifiedDate.getTime())) return isoString;
      return modifiedDate.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.warn("formatTimestamp error:", e, "for input:", isoString);
    return isoString;
  }
};

const DevicesPage = ({ navigation, route }) => {
  // Set the default active tab to 'Inverter'
  const [activeTab, setActiveTab] = useState("Inverter"); // Changed from 'Logger'
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFocused = useIsFocused();
  const plantId = route?.params?.plantId;

  const [activeSubTab, setActiveSubTab] = useState("Inverter"); // Default to Inverter
  const [searchQuery, setSearchQuery] = useState(""); // Search state

  // State for All Inverters list
  const [allInverters, setAllInverters] = useState([]);
  const [isAllInvertersLoading, setIsAllInvertersLoading] = useState(false);
  const [allInvertersError, setAllInvertersError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add state for loggers
  const [allLoggers, setAllLoggers] = useState([]);

  const fetchDevices = useCallback(async () => {
    if (!plantId) {
      console.error("DevicesPage: Cannot fetch devices, plantId is missing.");
      setError("Plant ID not provided.");
      setDevices([]);
      setLoading(false);
      return;
    }

    console.log(
      `DevicesPage: Fetching devices for plantId: ${plantId} and tab: ${activeTab}`
    );
    setLoading(true);
    setError(null);

    try {
      let result;
      if (activeTab === "Logger") {
        result = await dataManager.fetchDevicesForPlant(plantId); // Uses GET /route
      } else if (activeTab === "Inverter") {
        result = await deviceService.getMainDevices(plantId);
      } else {
        result = {
          success: false,
          error: `Unsupported device type: ${activeTab}`,
        };
      }

      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        setError(result.error || `No ${activeTab.toLowerCase()}s found`);
        setDevices([]);
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
      setError("Failed to fetch devices");
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [plantId, activeTab]);

  useEffect(() => {
    if (isFocused && plantId) {
      fetchDevices();
    }
    if (isFocused && !plantId) {
      setError("Plant ID not provided.");
      setDevices([]);
      setLoading(false);
    }
  }, [isFocused, plantId, fetchDevices]);

  // --- Fetching Logic for All Devices (Simplified) ---
  const fetchAllDeviceSummary = useCallback(async () => {
    console.log("[Devices] Starting fetchAllDeviceSummary...");
    setIsAllInvertersLoading(true);
    setAllInvertersError(null);
    setAllInverters([]);
    setAllLoggers([]);

    try {
      const result = await deviceService.getAllDevicesSummary();
      console.log("[Devices] getAllDevicesSummary result:", result);

      if (result.success && result.data) {
        const { inverter, logger } = result.data;
        console.log(
          `[Devices] Successfully fetched ${inverter?.length || 0} inverters and ${logger?.length || 0} loggers`
        );

        if (inverter) {
          console.log("[Devices] First inverter data:", inverter[0]);
          setAllInverters(inverter);
        }

        if (logger) {
          console.log("[Devices] First logger data:", logger[0]);
          setAllLoggers(logger);
        }

        setAllInvertersError(null);
      } else {
        console.error(
          "[Devices] Failed to fetch device summary:",
          result.error
        );
        setAllInvertersError(result.error || "Failed to load device summary.");
        setAllInverters([]);
        setAllLoggers([]);
      }
    } catch (error) {
      console.error(
        "[Devices] Unexpected error in fetchAllDeviceSummary:",
        error
      );
      setAllInvertersError(
        "An unexpected error occurred while fetching device summary."
      );
      setAllInverters([]);
      setAllLoggers([]);
    } finally {
      setIsAllInvertersLoading(false);
      setIsRefreshing(false);
      console.log("[Devices] fetchAllDeviceSummary finished.");
    }
  }, []);

  // Initial fetch when component mounts or sub-tab changes to Inverter
  useEffect(() => {
    // Fetch summary when the component mounts, regardless of initial tab?
    // Or fetch only when the relevant tab is active?
    // Let's fetch when the component mounts / focuses for now.
    if (isFocused) {
      // Re-fetch when screen comes into focus
      fetchAllDeviceSummary();
    }
    // The below might be redundant if fetching on focus, but kept for tab switch logic:
    // if (activeTab === 'Inverter') {
    //    fetchAllDeviceSummary();
    // } else if (activeTab === 'Logger') {
    //    // TODO: Add logic to display loggers from the fetched summary data
    // }
  }, [isFocused, fetchAllDeviceSummary]); // Added isFocused

  // --- Refresh Logic ---
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Refresh the whole summary regardless of tab
    fetchAllDeviceSummary();
  }, [fetchAllDeviceSummary]);

  // --- Filtering Logic ---
  const filteredInverters = allInverters.filter(
    (inverter) =>
      inverter.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inverter.inverter_sno?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add filtering for loggers
  const filteredLoggers = allLoggers.filter(
    (logger) =>
      logger.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      logger.sno?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Online":
        return localStyles.statusOnline;
      case "Offline":
        return localStyles.statusOffline;
      case "Maintenance":
        return localStyles.statusMaintenance;
      case "Warning":
        return localStyles.statusWarning;
      default:
        return localStyles.statusUnknown;
    }
  };

  const handleViewDevice = (device, type) => {
    console.log(`[Devices.js/handleViewDevice] Viewing ${type}:`, device);
    if (type === "inverter") {
      // For inverters, use inverter_sno and plantId
      const deviceId = device.inverter_sno || device.id || device.sno;
      const plantId = device.plantId; // Corrected: use device.plantId

      if (!deviceId) {
        Alert.alert("Error", "Inverter S/N not found.");
        return;
      }
      if (typeof plantId === "undefined") {
        Alert.alert("Error", "Plant ID not found for this inverter.");
        return;
      }
      navigation.navigate("InverterTabs", {
        deviceData: device, // Pass the whole device object
        plantId: plantId, // Pass plantId explicitly
        // deviceType: 'inverter' // Already part of InverterTabs logic if needed there
      });
    } else if (type === "logger") {
      // For loggers, we expect 'sno' (which might be MAC-like) and 'plantId'
      // We previously tried true_sno_field, but it seems 'sno' is what we get from getAllDevicesSummary
      const loggerIdToPass = device.sno;
      const associatedPlantId = device.plantId; // Corrected: use device.plantId

      if (loggerIdToPass && typeof associatedPlantId !== "undefined") {
        console.log(
          `[Devices.js/handleViewDevice] Navigating to LoggerTabs with loggerId: ${loggerIdToPass}, plantId: ${associatedPlantId}`
        );
        navigation.navigate("LoggerTabs", {
          loggerId: loggerIdToPass,
          plantId: associatedPlantId,
        });
      } else {
        console.warn(
          "[Devices.js/handleViewDevice] Cannot navigate to logger: No valid S/N or plantId found. Device:",
          device
        );
        Alert.alert(
          "Navigation Error",
          `Cannot view logger details. Missing S/N or Plant ID. S/N: ${loggerIdToPass || "N/A"}, PlantID: ${typeof associatedPlantId !== "undefined" ? associatedPlantId : "N/A"}`
        );
      }
    }
  };

  const renderDeviceItem = ({ item }) => {
    const deviceName =
      item.name || item.deviceName || `Device S/N: ${item.sno || "Unknown"}`;
    const deviceModel = item.model || item.deviceModel || "Unknown Model";
    const deviceSn = item.sn || item.sno || "N/A";
    const deviceStatus = item.status || "Unknown";
    const deviceTypeDisplay = item.type || activeTab;

    const deviceId = item.id || item._id || deviceSn;

    return (
      <TouchableOpacity
        style={localStyles.deviceCard}
        onPress={() => handleViewDevice(item, "inverter")}
      >
        <View style={localStyles.deviceHeader}>
          <View style={localStyles.deviceInfo}>
            <Text style={localStyles.deviceName}>{deviceName}</Text>
            <Text style={localStyles.deviceModel}>{deviceModel}</Text>
          </View>

          <View style={localStyles.deviceStatusContainer}>
            <Text
              style={[localStyles.deviceStatus, getStatusStyle(deviceStatus)]}
            >
              {deviceStatus}
            </Text>
            <Icon name="navigate-next" size={24} color="#666" />
          </View>
        </View>

        <View style={localStyles.deviceDetails}>
          <View style={localStyles.deviceDetailItem}>
            <Text style={localStyles.deviceDetailLabel}>Type:</Text>
            <Text style={localStyles.deviceDetailValue}>
              {deviceTypeDisplay}
            </Text>
          </View>
          <View style={localStyles.deviceDetailItem}>
            <Text style={localStyles.deviceDetailLabel}>S/N:</Text>
            <Text style={localStyles.deviceDetailValue}>{deviceSn}</Text>
          </View>

          <View style={localStyles.deviceActions}>
            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={() => handleViewDevice(item, "inverter")}
            >
              <Icon name="visibility" size={16} color="#fff" />
              <Text style={localStyles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={localStyles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#00875A" />
          <Text style={localStyles.emptyStateText}>Loading devices...</Text>
        </View>
      );
    }

    return (
      <View style={localStyles.emptyStateContainer}>
        <Icon name="devices" size={64} color="#999" />
        <Text style={localStyles.emptyStateText}>No {activeTab}s found</Text>
        {plantId ? (
          <Text style={localStyles.emptyStateSubText}>
            Could not fetch {activeTab.toLowerCase()} list for this plant.
          </Text>
        ) : (
          <Text style={localStyles.emptyStateSubText}>
            No Plant ID selected.
          </Text>
        )}

        {error && (
          <View style={localStyles.errorContainer}>
            <Icon name="error-outline" size={18} color="#F44336" />
            <Text style={localStyles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

  // --- Render Item for Inverter List ---
  const renderInverterItem = ({ item }) => {
    console.log("[Devices] Rendering inverter item:", item); // Debug log

    const getSafeValue = (value, defaultValue = "--") => {
      if (value === null || value === undefined || value === "")
        return defaultValue;
      if (typeof value === "number") return value.toFixed(2);
      return value;
    };

    const lastUpdated = formatTimestamp(getSafeValue(item.timestamp));

    return (
      <TouchableOpacity
        style={localStyles.deviceCard}
        onPress={() =>
          navigation.navigate("InverterTabs", {
            deviceData: item,
          })
        }
      >
        <View style={localStyles.deviceHeader}>
          <Icon
            name="settings-input-hdmi"
            size={24}
            color="#00875A"
            style={localStyles.deviceIcon}
          />
          <View style={localStyles.deviceHeaderText}>
            <Text style={localStyles.deviceName}>
              {getSafeValue(item.name, " Inverter")}
            </Text>
            <Text style={localStyles.deviceSerial}>
              S/N: {getSafeValue(item.inverter_sno)}
            </Text>
          </View>
        </View>
        <View style={localStyles.deviceBody}>
          <View style={localStyles.dataItem}>
            <Text style={localStyles.dataLabel}>Power</Text>
            <Text style={localStyles.dataValue}>
              {getSafeValue(item.solar_power)} kW
            </Text>
          </View>
          <View style={localStyles.dataItem}>
            <Text style={localStyles.dataLabel}>Daily Prod.</Text>
            <Text style={localStyles.dataValue}>
              {getSafeValue(item.daily_production)} kWh
            </Text>
          </View>
          <View style={localStyles.dataItem}>
            <Text style={localStyles.dataLabel}>Capacity</Text>
            <Text style={localStyles.dataValue}>
              {getSafeValue(item.module_capacity)} kWp
            </Text>
          </View>
        </View>
        <View style={localStyles.deviceFooter}>
          <Text style={localStyles.footerText}>
            Last Updated: {lastUpdated}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Render Item for Logger List --- (Corrected Version)
  const renderLoggerItem = ({ item }) => {
    const loggerIdToPass = item.sno;
    const associatedPlantId = item.plantId;
    const deviceName = item.name || item.sno || " Logger";
    const lastReportTime = formatTimestamp(item.timestamp);

    // Helper to safely get nested values (already exists in component, reiterating for clarity in edit)
    const getSafeValue = (value, defaultValue = "--") => {
      return value !== null && value !== undefined && value !== ""
        ? value
        : defaultValue;
    };

    return (
      <TouchableOpacity
        style={localStyles.deviceCard}
        onPress={() => {
          if (loggerIdToPass && associatedPlantId != null) {
            navigation.navigate("LoggerTabs", {
              loggerId: loggerIdToPass,
              plantId: associatedPlantId,
            });
          } else {
            Alert.alert(
              "Navigation Error",
              `Could not open logger details. Missing S/N or Plant ID.`
            );
          }
        }}
      >
        {/* Main content of the card */}
        <View style={localStyles.deviceHeader}>
          <Icon
            name="router"
            size={24}
            color="#4CAF50"
            style={localStyles.deviceIcon}
          />
          <View style={localStyles.deviceHeaderText}>
            <Text style={localStyles.deviceName} numberOfLines={1}>
              {deviceName}
            </Text>
            <Text style={localStyles.deviceSerial}>
              S/N: {item.sno || "N/A"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}></View>
        </View>

        {/* Footer is empty */}
        <View style={localStyles.deviceFooter}>
          <Text style={localStyles.dataLabel}>Last Updated</Text>
          <Text style={localStyles.dataValue}>{lastReportTime}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Render Empty/Loading/Error States (Adjusted) ---
  const renderListEmptyComponent = () => {
    const isLoading = isAllInvertersLoading; // Use shared loading state
    const error = allInvertersError; // Use shared error state
    const dataLength =
      activeTab === "Inverter"
        ? filteredInverters.length
        : filteredLoggers.length;
    const deviceType = activeTab; // 'Inverter' or 'Logger'

    if (isLoading && !isRefreshing) {
      return (
        <View style={localStyles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#00875A" />
          <Text style={localStyles.emptyStateText}>
            Loading {deviceType.toLowerCase()}s...
          </Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={localStyles.emptyStateContainer}>
          <Icon name="error-outline" size={40} color="#F44336" />
          <Text style={localStyles.emptyStateText}>Error: {error}</Text>
          <TouchableOpacity
            style={localStyles.retryButton}
            onPress={fetchAllDeviceSummary}
          >
            <Text style={localStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (!isLoading && dataLength === 0) {
      const iconName =
        deviceType === "Inverter" ? "settings-input-hdmi" : "router";
      return (
        <View style={localStyles.emptyStateContainer}>
          <Icon name={iconName} size={40} color="#ccc" />
          <Text style={localStyles.emptyStateText}>
            No {deviceType.toLowerCase()}s found.
          </Text>
          {searchQuery ? (
            <Text style={localStyles.emptyStateSubText}>
              Try adjusting your search.
            </Text>
          ) : null}
        </View>
      );
    }
    return null; // Render nothing if loading in background or data exists
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <View style={localStyles.tabBar}>
        {["Logger", "Inverter"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              localStyles.tabItem,
              activeTab === tab && localStyles.activeTabItem,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                localStyles.tabText,
                activeTab === tab && localStyles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Bar */}
      <View style={localStyles.searchContainer}>
        <Icon name="search" size={20} style={localStyles.searchIcon} />
        <TextInput
          style={localStyles.searchInput}
          placeholder={`Search ${activeTab}s...`}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Content based on active sub-tab */}
      {activeTab === "Inverter" && (
        <FlatList
          data={filteredInverters}
          renderItem={renderInverterItem}
          keyExtractor={(item) => `inverter-${item.id}`}
          ListEmptyComponent={renderListEmptyComponent}
          contentContainerStyle={
            filteredInverters.length === 0
              ? { flexGrow: 1 }
              : { paddingBottom: 20, paddingTop: 10 }
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#00875A"]} // Optional: Customize refresh indicator color
            />
          }
        />
      )}

      {activeTab === "Logger" && (
        <FlatList
          data={filteredLoggers}
          renderItem={renderLoggerItem}
          keyExtractor={(item) => `logger-${item.id || item.sno}`}
          ListEmptyComponent={renderListEmptyComponent}
          contentContainerStyle={
            filteredLoggers.length === 0
              ? { flexGrow: 1 }
              : { paddingBottom: 20, paddingTop: 10 }
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={["#00875A"]}
            />
          }
        />
      )}

      {/* Floating Action Button (Optional) */}
      {/* <TouchableOpacity style={styles.fab} onPress={() => console.log('Add Device Pressed')}>
         <Icon name="add" size={24} color="#fff" />
       </TouchableOpacity> */}
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  iconRight: {
    padding: 4,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  activeTabItem: {},
  tabText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#333",
    fontWeight: "bold",
  },
  deviceCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  deviceModel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  deviceStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceStatus: {
    fontSize: 14,
    // fontWeight: '500',
    marginRight: 4,
  },
  deviceDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  deviceDetailItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  deviceDetailLabel: {
    fontSize: 14,
    color: "#666",
    width: 60,
  },
  deviceDetailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  deviceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 12,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    color: "#D32F2F",
    marginLeft: 8,
  },
  statusOnline: {
    color: "#4CAF50",
  },
  statusOffline: {
    color: "#F44336",
  },
  statusMaintenance: {
    color: "#FF9800",
  },
  statusWarning: {
    color: "#FFC107",
  },
  statusUnknown: {
    color: "#9E9E9E",
  },
  addButtonEmpty: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  addButtonEmptyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  deviceIcon: {
    marginRight: 10,
  },
  deviceHeaderText: {
    flex: 1,
  },
  deviceSerial: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  deviceBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  dataItem: {
    alignItems: "flex-start",
    flex: 1,
    paddingHorizontal: 5,
  },
  dataLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 3,
  },
  dataValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  deviceFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  footerText: {
    fontSize: 11,
    color: "#888",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: -20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
});

export default DevicesPage;
