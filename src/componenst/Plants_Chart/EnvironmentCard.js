import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";

export const EnvironmentalBenefitsCard = () => {
  const [data, setData] = useState({
    coalSaved: 0,
    co2Reduction: 0,
    treesPlanted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvStats = async () => {
      try {
        const plantId = 4962;
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NzI3MzAwOSwiZXhwIjoxNzk4ODA5MDA5fQ.K8aCVMYDiG3530xy8cPinrMA4K1CaARjVMdQeqEqS-g";

        const res = await axios.get(
          `https://utlsolarrms.com/api/environment?id=${plantId}`,
          {
            headers: {
              Cookie: `auth_token=${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const d = res?.data?.data ?? {};

        console.log("Environment  stats API response ", d);
        setData({
          coalSaved: Number(d.coal_saved || 0),
          co2Reduction: Number(d.co_reduction || 0),
          treesPlanted: Number(d.trees_planted || 0),
        });
      } catch (err) {
        console.log("error", err?.response?.data || err?.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvStats();
  }, []);

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      <Text style={styles.title}>Environmental & Economic Benefits</Text>

      <View style={styles.row}>
        <Text style={styles.label}>🌿 Standard Coal Saved</Text>
        <Text style={styles.value}>{data.coalSaved.toFixed(5)} t</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>🏭 CO2 Emission Reduction</Text>
        <Text style={styles.value}>{data.co2Reduction.toFixed(5)} t</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>🌲 Trees Planted</Text>
        <Text style={styles.values}>{data.treesPlanted.toFixed(5)} Trees</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    margin: 16,
    elevation: 3,
  },
  loadingCard: {
    justifyContent: "center",
    alignItems: "center",
    height: 200,
  },
  title: {
    fontSize: 18,
    fontWeight: 500,
    marginBottom: 16,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    color: "#666",
    fontSize: 11,
  },
  value: {
    fontWeight: "bold",
    color: "#040404ff",
    fontSize: 12,
    alignItems: "center",
    marginRight: 30,
  },
  values: {
    fontWeight: "bold",
    color: "#040404ff",
    fontSize: 12,
  },
});

export default EnvironmentalBenefitsCard;
