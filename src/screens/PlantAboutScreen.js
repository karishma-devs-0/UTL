import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import dataManager from "../utils/dataManager";
import InfoCard from "../componenst/InfoCard";
import { formatDate } from "../utils/formatters";

const PlantAboutScreen = ({ route }) => {
  const { plantId } = route.params;
  const [plantInfo, setPlantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({
    x: 0,
    y: 0,
    visible: false,
    value: null,
    label: "",
  });
  const navigation = useNavigation();

  useEffect(() => {
    const loadPlantData = async () => {
      if (!plantId) {
        setError("No Plant ID provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const result = await dataManager.getPlantDetails(plantId);

        if (result.success && result.data) {
          setPlantInfo(result.data);
          setError(null);
        } else {
          setError(result.error || "Failed to load plant details.");
          setPlantInfo(null);
        }
      } catch (err) {
        console.error("Error fetching plant details for About screen:", err);
        setError("An unexpected error occurred.");
        setPlantInfo(null);
      } finally {
        setLoading(false);
      }
    };

    loadPlantData();
  }, [plantId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#00875A" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <Icon name="error-outline" size={40} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plantInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plant Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredContent}>
          <Icon name="help-outline" size={40} color="#666" />
          <Text>No plant data found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderDetailRow = (label, value, unit = "") => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "--"
    ) {
      return null;
    }
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>
          {value}
          {unit && <Text style={styles.unitText}> {unit}</Text>}
        </Text>
      </View>
    );
  };

  // Tooltip component
  const renderTooltip = () => {
    if (!tooltipPos.visible) return null;

    return (
      <View
        style={[
          styles.tooltipContainer,
          { left: tooltipPos.x - 40, top: tooltipPos.y - 60 },
        ]}
      >
        <View style={styles.tooltipBubble}>
          <Text style={styles.tooltipText}>{tooltipPos.label}</Text>
          <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
        </View>
        <View style={styles.tooltipArrow} />
      </View>
    );
  };

  // Handle tooltip click
  const handleTooltipClick = (label, value, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setTooltipPos({
      x: pageX,
      y: pageY,
      visible: true,
      value: value,
      label: label,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {plantInfo.name || "Plant About"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, position: "relative" }}>
        {renderTooltip()}
        <TouchableOpacity
          activeOpacity={1}
          style={{ flex: 1 }}
          onPress={() => setTooltipPos({ ...tooltipPos, visible: false })}
        >
          <ScrollView contentContainerStyle={styles.scrollContentContainer}>
            {plantInfo.imageUrl ? (
              <Image
                source={{ uri: plantInfo.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Icon name="eco" size={50} color="#00875A" />
              </View>
            )}
            <Text style={styles.name}>
              {plantInfo.name || "Plant Name Unavailable"}
            </Text>
            <View style={styles.summaryCard}>
              <InfoCard title="Basic Information" widthStyle={styles.cardWidth}>
                {renderDetailRow("Capacity", plantInfo.capacity, "kWp")}
                {renderDetailRow("Location", plantInfo.location)}
                {renderDetailRow(
                  "Created On",
                  plantInfo.creation_date
                    ? formatDate(plantInfo.creation_date)
                    : null
                )}
                {renderDetailRow(
                  "On-Grid Date",
                  plantInfo.on_grid_date
                    ? formatDate(plantInfo.on_grid_date)
                    : null
                )}
                {renderDetailRow("Last Update", plantInfo.last_update)}
              </InfoCard>

              {/* <InfoCard title="Additional Details" widthStyle={styles.cardWidth}>
                    {renderDetailRow("Address", plantInfo.address)}
                    {renderDetailRow("Plant Type", plantInfo.plant_type)}
                    {renderDetailRow("System Type", plantInfo.system_type)} 
                    {renderDetailRow("Contact Person", plantInfo.contact_person)}
                    {renderDetailRow("Contact Number", plantInfo.contact_number)}
                     {renderDetailRow("Contact Email", plantInfo.contactEmail)} 
                     {renderDetailRow("Business Name", plantInfo.business_name)} 
                     {renderDetailRow("Azimuth", plantInfo.azimuth, '°')}
                     {renderDetailRow("Tilt Angle", plantInfo.tilt_angle, '°')}
                 </InfoCard> */}

              {/* Interactive Summary Card with Tooltips */}

              <Text style={styles.summaryTitle}>Plant Summary</Text>
              <View style={styles.summaryGrid}>
                <TouchableOpacity
                  style={styles.summaryItem}
                  onPress={(event) =>
                    handleTooltipClick(
                      "Capacity",
                      `${plantInfo.capacity || "N/A"} kWp`,
                      event
                    )
                  }
                >
                  <Icon name="flash-on" size={24} color="#00875A" />
                  <Text style={styles.summaryLabel}>Capacity</Text>
                  <Text style={styles.summaryValue}>
                    {plantInfo.capacity || "N/A"} kWp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.summaryItem}
                  onPress={(event) =>
                    handleTooltipClick(
                      "Plant Type",
                      plantInfo.plant_type || "N/A",
                      event
                    )
                  }
                >
                  <Icon name="eco" size={24} color="#00875A" />
                  <Text style={styles.summaryLabel}>Type</Text>
                  <Text style={styles.summaryValue}>
                    {plantInfo.plant_type || "N/A"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.summaryItem}
                  onPress={(event) =>
                    handleTooltipClick(
                      "Location",
                      plantInfo.location || "N/A",
                      event
                    )
                  }
                >
                  <Icon name="location-on" size={24} color="#00875A" />
                  <Text style={styles.summaryLabel}>Location</Text>
                  <Text style={styles.summaryValue}>
                    {plantInfo.location || "N/A"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.summaryItem}
                  onPress={(event) =>
                    handleTooltipClick("Status", "Active", event)
                  }
                >
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.summaryLabel}>Status</Text>
                  <Text style={styles.summaryValue}>Active</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  scrollContentContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F5F8FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    backgroundColor: "#e0e0e0",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  cardWidth: {
    width: "100%",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  detailLabel: {
    fontSize: 15,
    color: "#555",
    flex: 1,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1.5,
    textAlign: "right",
  },
  unitText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 2,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
  tooltipContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 1000,
    elevation: 10,
  },
  tooltipBubble: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: "solid",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(0, 0, 0, 0.85)",
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flexDirection: "column",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00875A",
  },
});

export default PlantAboutScreen;
