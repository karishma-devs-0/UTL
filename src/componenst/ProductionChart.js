import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useEffect, useState } from "react";

// Utility to format energy values

const formatEnergy = (rawValue) => {
  const value = Number(rawValue);

  // Handle undefined, null, NaN, empty string
  if (!Number.isFinite(value)) {
    return { value: "0.00", unit: "kWh" };
  }

  if (value >= 10000) {
    return {
      value: (value / 1000).toFixed(2),
      unit: "MWh",
    };
  }

  return {
    value: value.toFixed(2),
    unit: "kWh",
  };
};

export default function SolarStatsCard() {
  const [stats, setStats] = useState({
    percentage: 0,
    totalPower: 0,
    installedCapacity: 0,
    daily: 0,
    monthly: 0,
    yearly: 0,
    total: 0,
  });
  useEffect(() => {
    const fetchSolarStats = async () => {
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NzE1NjAwNywiZXhwIjoxNzk4NjkyMDA3fQ.HKvP1eI1Abvbaog7YymziqSMynb6x_cgzRLuXnlpyLc";

        const res = await axios.get("https://utlsolarrms.com/api/dashboard/", {
          headers: {
            Cookie: `auth_token=${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        const d = res?.data?.data ?? {};

        console.log("Solar stats API response ", d);
        setStats({
          percentage: Number(d.utilization_percentage) || 0,
          totalPower: Number(d.current_power) || 0,
          installedCapacity: Number(d.installed_capacity) || 0,
          daily: Number(d.daily_production) || 0,
          monthly: Number(d.monthly_production) || 0,
          yearly: Number(d.yearly_production) || 0,
          total: Number(d.total_production) || 0,
        });
      } catch (err) {
        console.log("Solar stats API error ❌", err?.response?.status);
      }
    };

    fetchSolarStats();
  }, []);

  const safePercentage = stats.percentage;

  return (
    <LinearGradient colors={["#ffffffff", "#ffffffff"]} style={styles.card}>
      <View>
        <Text style={styles.heading}> Production Overview</Text>
      </View>
      <View style={styles.topSection}>
        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <LinearGradient
            colors={["#ffffffff", "#faf5f5ff"]}
            style={styles.circleBg}
          >
            <AnimatedCircularProgress
              size={115}
              width={10}
              fill={safePercentage}
              tintColor="#dc3545"
              backgroundColor="#faeaeaff"
              rotation={2}
              lineCap="round"
            >
              {() => (
                <Text style={styles.percentText}>
                  {safePercentage.toFixed(1)}%{" "}
                </Text>
              )}
            </AnimatedCircularProgress>
          </LinearGradient>
        </View>

        {/* Right Side Stats */}
        <View style={styles.sideStatsColumn}>
          <SideStat
            label="Total Production Power"
            value={stats.totalPower.toFixed(2)}
            unit="kW"
          />
          <SideStat
            label="Installed Capacity"
            value={stats.installedCapacity.toFixed(2)}
            unit="kWp"
          />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Grid Stats */}
      <View style={styles.grid}>
        <Stat label="Daily Production" value={stats.daily.toFixed(2)} />
        <Stat label="Monthly Production" value={stats.monthly.toFixed(2)} />
        <Stat label="Yearly Production" value={stats.yearly.toFixed(2)} />
        <Stat label="Total Production" value={stats.total.toFixed(2)} />
      </View>
    </LinearGradient>
  );
}

/* --- Sub Components --- */

const SideStat = ({ label, value, unit }) => (
  <View style={styles.sideStatBox}>
    <Text style={styles.sideLabel}>{label}</Text>
    <Text style={styles.sideValue}>
      {value} <Text style={styles.unit}>{unit}</Text>
    </Text>
  </View>
);

const Stat = ({ label, value }) => {
  const { value: formattedValue, unit } = formatEnergy(value);
  return (
    <View style={styles.statBox}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>
        {formattedValue} <Text style={styles.unit}>{unit}</Text>
      </Text>
    </View>
  );
};

/* --- Styles --- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  heading: {
    color: "#dc3545",
    fontWeight: 500,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  circleContainer: {
    width: "40%",
    alignItems: "center",
    backgroundColor: "transparent",
  },

  circleBg: {
    padding: 10,
    borderRadius: 80,
    shadowColor: "transparent",
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  percentText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#dc3545",
  },

  sideStatsColumn: {
    width: "60%",
    paddingLeft: 30,
    paddingVertical: 8,
    justifyContent: "center",
  },

  sideStatBox: {
    marginBottom: 10,
  },

  sideLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  sideValue: {
    fontSize: 10,
    color: "#121212ff",
  },

  divider: {
    height: 1,
    backgroundColor: "#e8aaaaff",
    marginVertical: 18,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },

  statBox: {
    width: "48%",
    backgroundColor: "#ffffffff",
    padding: 5,
    borderRadius: 12,
    marginBottom: 18,
    shadowColor: "#333",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },

  label: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  value: {
    fontSize: 11,
    color: "#141313ff",
  },

  unit: {
    fontSize: 11,
    color: "#101010ff",
  },
});
