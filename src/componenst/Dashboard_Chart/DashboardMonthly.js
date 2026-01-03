import { Canvas, Line, Rect } from "@shopify/react-native-skia";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const PADDING = {
  left: 46,
  right: 20,
  top: 5,
  bottom: 40,
};

const GRID_LINES = 6;

export function DashboardMonthlyPVBarChart({ width, height, selectedMonth }) {
  console.log("📊 Chart received month:", selectedMonth);

  const [tooltip, setTooltip] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const DAYS_IN_MONTH = 31;

  const DAY_SLOT_WIDTH = chartWidth / DAYS_IN_MONTH;
  const BAR_GAP = 1;
  const BAR_WIDTH = (DAY_SLOT_WIDTH - BAR_GAP) / 2;

  const getXForDayCenter = (day) =>
    PADDING.left +
    ((day - 1) / DAYS_IN_MONTH) * chartWidth +
    chartWidth / DAYS_IN_MONTH / 2;

  const getXForDayStart = (day) =>
    PADDING.left + ((day - 1) / DAYS_IN_MONTH) * chartWidth;

  const hideTooltipTimeout = useRef(null);

  const handlePress = (e) => {
    const { locationX } = e.nativeEvent;
    const relativeX = locationX - PADDING.left;
    if (relativeX < 0 || relativeX > chartWidth) return;

    const day = Math.floor((relativeX / chartWidth) * DAYS_IN_MONTH) + 1;
    const point =
      Array.isArray(data) && data.find((d) => Number(d.date) === Number(day));

    if (!point) return;

    const cx = getXForDayCenter(day);
    const maxValue = Math.max(Number(point.PvProduction), point.gridFeed);
    const cy = PADDING.top + chartHeight - (maxValue / Y_MAX) * chartHeight;

    setTooltip({ cx, cy, point });
    hideTooltipTimeout.current = setTimeout(() => setTooltip(null), 4000);
  };
  useEffect(() => {
    if (!selectedMonth) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NjU2MjAxNiwiZXhwIjoxNzk4MDk4MDE2fQ.X8xm_XKtIK-cOQdRrnTQNNDHBXTE9sGPkDnTk7OdoEY";
        // 🔑 Convert calendar date → YYYY-MM
        const date_parameter = `${selectedMonth.getFullYear()}-${String(
          selectedMonth.getMonth() + 1
        ).padStart(2, "0")}`;
        const response = await axios.post(
          "https://utlsolarrms.com/api/charts/solar_power_per_project/monthly/",
          {
            plant_id: 1,
            date_parameter,
          },
          {
            headers: {
              // ✅ cookie-based auth (same as Postman)
              Cookie: `auth_token=${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        console.log("API SUCCESS ✅", response.data);
        const normalized = (response.data?.results || []).map((item) => ({
          date: Number(item.date),
          PvProduction: Number(item.PvProduction),
        }));

        setData(normalized);
      } catch (error) {
        console.log("STATUS ❌", error.response?.status);
        console.log("ERROR ❌", error.response?.data);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }
  const maxPvValue = Math.max(
    ...data.map((d) => Number(d.PvProduction) || 0),
    0
  );

  // round up to nearest 10
  const Y_MAX = Math.ceil(maxPvValue / 9) * 10 || 10;

  const TICK_COUNT = 5;

  const yTicks = Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
    Math.round((Y_MAX / TICK_COUNT) * i)
  );

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {[...Array(GRID_LINES + 1)].map((_, i) => {
          const spacing = chartHeight / (yTicks.length - 1);
          const y = PADDING.top + chartHeight - i * spacing;
          return (
            <Rect
              key={i}
              x={PADDING.left}
              y={y}
              width={chartWidth}
              height={1}
              color="#d1d5db"
            />
          );
        })}

        <Line
          p1={{ x: PADDING.left, y: PADDING.top }}
          p2={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          color="#9ca3af"
          strokeWidth={1}
        />

        {Array.isArray(data) && data.length > 0
          ? data.map((d) => {
              const dayStartX = getXForDayCenter(d.date) - BAR_WIDTH / 2;

              const prodHeight = (Number(d.PvProduction) / Y_MAX) * chartHeight;

              const prodY = PADDING.top + chartHeight - prodHeight;

              return (
                <React.Fragment key={d.date}>
                  <Rect
                    x={dayStartX}
                    y={prodY}
                    width={BAR_WIDTH}
                    height={prodHeight}
                    color="#fa2742"
                  />
                </React.Fragment>
              );
            })
          : null}

        {tooltip && (
          <>
            <Rect
              x={tooltip.cx - 0.5}
              y={PADDING.top}
              width={1}
              height={chartHeight}
              color="#9ca3af"
            />
            <Rect
              x={tooltip.cx - 5}
              y={tooltip.cy - 5}
              width={10}
              height={10}
              rx={5}
              ry={5}
              color="#15803d"
            />
          </>
        )}
      </Canvas>

      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />

      {tooltip && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: Math.max(8, Math.min(tooltip.cx - 100, width - 200 - 8)),
              top: Math.max(8, Math.min(tooltip.cy - 60, height - 70 - 8)),
            },
          ]}
        >
          <Text style={styles.tooltipDay}>Day {tooltip.point.date}</Text>
          <Text style={styles.tooltipValue}>
            PV Production: {Number(tooltip.point.PvProduction).toFixed(2)} kWh
          </Text>
        </View>
      )}
      <View style={styles.xLabels}>
        {Array.from({ length: 31 }, (_, i) => {
          const day = i + 1;

          if (day % 2 === 0) return null;

          const x = getXForDayCenter(day);

          return (
            <Text
              key={day}
              style={[
                styles.xLabel,
                { left: x, transform: [{ translateX: -10 }] },
              ]}
            >
              {day}
            </Text>
          );
        })}
      </View>

      <View style={styles.yLabels}>
        {yTicks.map((v, index) => {
          const spacing = chartHeight / (yTicks.length - 1);
          const y = PADDING.top + chartHeight - index * spacing;

          return (
            <Text
              key={v}
              style={[
                styles.yLabel,
                { top: y, transform: [{ translateY: -12 }] },
              ]}
            >
              {v}
            </Text>
          );
        })}
      </View>

      <Text style={styles.yUnit}>kWh</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#fa2742" }]} />
          <Text style={[styles.legendText, { color: "#fa2742" }]}>
            PV Production
          </Text>
        </View>
      </View>
    </View>
  );
}

import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");
const smallWidth = Math.min(width, height); // use smaller dimension as base

// Scale factor based on smallWidth (reference 375)
const scale = smallWidth / 375;

const PADDINGS = {
  left: 46 * scale,
  right: 20 * scale,
  top: 10 * scale,
  bottom: 40 * scale,
};

export const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    backgroundColor: "#575656ff",
    paddingVertical: 6 * scale,
    paddingHorizontal: 8 * scale,
    borderRadius: 6 * scale,
    opacity: 0.8,
    maxWidth: smallWidth * 0.5,
  },

  tooltipTime: {
    color: "#f7f7f7",
    fontWeight: "800",
    marginBottom: 4 * scale,
    fontSize: 12 * scale,
  },
  tooltipDay: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4 * scale,
    fontSize: 12 * scale,
  },
  tooltipValue: {
    color: "#fcf8f8",
    fontSize: 10 * scale,
    fontWeight: "500",
  },

  xLabels: {
    position: "absolute",
    bottom: 8 * scale,
    left: 10 * scale,
    right: 0,
    height: 28 * scale,
  },

  xLabel: {
    position: "absolute",
    fontSize: 6 * scale,
    color: "#080808",
  },

  yLabels: {
    position: "absolute",
    left: 0,
    top: PADDINGS.top,
    width: PADDINGS.left + 2 * scale,
    height: "100%",
  },

  yLabel: {
    position: "absolute",
    right: 8 * scale,
    fontSize: 8 * scale,
    color: "#030303",
    textAlign: "right",
  },

  yUnit: {
    position: "absolute",
    left: 3 * scale,
    top: PADDINGS.top - 30 * scale,
    fontSize: 10 * scale,
    fontWeight: "800",
    color: "#374151",
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2 * scale,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12 * scale,
  },

  legendDot: {
    width: 10 * scale,
    height: 10 * scale,
    marginRight: 6 * scale,
  },

  legendText: {
    fontSize: 10 * scale,
    color: "#333",
  },
});
