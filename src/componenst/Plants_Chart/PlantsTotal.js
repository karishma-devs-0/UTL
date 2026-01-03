import { Canvas, Line, Rect } from "@shopify/react-native-skia";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const PADDING = {
  left: 46,
  right: 20,
  top: 10,
  bottom: 40,
};

const BAR_GAP = 4;
const START_YEAR = 2015;
const CURRENT_YEAR = new Date().getFullYear();

const ALL_YEARS = Array.from(
  { length: CURRENT_YEAR - START_YEAR + 1 },
  (_, i) => START_YEAR + i
);

const getNiceYTicks = (values = [], tickCount = 5) => {
  if (!Array.isArray(values) || values.length === 0) {
    return Array.from({ length: tickCount + 1 }, (_, i) => i);
  }

  const max = Math.max(...values, 0);
  if (max === 0) {
    return Array.from({ length: tickCount + 1 }, (_, i) => i);
  }

  const paddedMax = max * 1.1;
  const step = paddedMax / tickCount;

  const precision = step < 1 ? 2 : step < 10 ? 1 : 0;

  return Array.from({ length: tickCount + 1 }, (_, i) =>
    Number((step * i).toFixed(precision))
  );
};

export function PlantsTotalPVBarChart({ width, height, selectedYear }) {
  const [tooltip, setTooltip] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const YEARS = data.map((d) => d.year.toString());

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  if (!width || !height) return null;

  const maxValue = Math.max(...data.map((d) => Math.max(d.PvProduction)), 1);

  const Y_MAX = React.useMemo(() => {
    return yTicks?.length ? yTicks[yTicks.length - 1] : 1;
  }, [yTicks]);

  const SLOT_WIDTH = chartWidth / ALL_YEARS.length;
  const BAR_WIDTH = (SLOT_WIDTH - BAR_GAP) / 2;

  const getX = (index) => PADDING.left + index * SLOT_WIDTH;

  const getY = (value) =>
    PADDING.top + chartHeight - (value / Y_MAX) * chartHeight;

  const handlePress = (e) => {
    const { locationX } = e.nativeEvent;
    const relX = locationX - PADDING.left;

    if (relX < 0 || relX > chartWidth) return;

    // Which year index was pressed
    const index = Math.floor((relX / chartWidth) * ALL_YEARS.length);
    const year = ALL_YEARS[index];

    // Find data for that year
    const point = data.find((d) => d.year === year);
    if (!point) return; // no tooltip if no data

    setTooltip({
      cx: getX(index) + SLOT_WIDTH / 2, // center of the slot
      cy: getY(Math.max(point.PvProduction)),
      point,
    });

    setTimeout(() => setTooltip(null), 2000);
  };

  useEffect(() => {
    if (!selectedYear == null) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NjYzOTUxMCwiZXhwIjoxNzk4MTc1NTEwfQ.9tAtwpgBgzE9iuMZo-IVRMKp-iFdIzSYm4ntq8YjPvY";
        const date_parameter = String(selectedYear ?? new Date().getFullYear());
        const response = await axios.post(
          "https://utlsolarrms.com/api/charts/solar_power_per_plant_logs/total/",
          { plant_id: 4518, date_parameter, loggerSno: "84F3EB8D9EEA" },
          {
            headers: {
              Cookie: `auth_token=${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        console.log("API SUCCESS ✅", response.data);

        const apiData = response.data?.results || [];

        // Normalize to always 12 months
        const normalized = apiData.map((item) => ({
          year: Number(item.year),
          PvProduction: Number(item.PvProduction),
        }));

        setData(normalized);

        console.log("Plants Total Chart  DATA 👉", normalized);
      } catch (err) {
        console.log("API ERROR ❌", err.response?.data || err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]); // empty dependency array → runs only once on mount
  //  SAFE: data exists now
  const yValues = data.map((d) => d.PvProduction);

  const yTicks = React.useMemo(() => getNiceYTicks(yValues, 5), [yValues]);

  const getBarHeight = (value) => Math.max((value / Y_MAX) * chartHeight, 2);

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PADDING.top + chartHeight * t;
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

        {/* Y Axis */}
        <Line
          p1={{ x: PADDING.left, y: PADDING.top }}
          p2={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          color="#9ca3af"
          strokeWidth={1}
        />

        {/* Bars */}
        {ALL_YEARS.map((year, index) => {
          const point = data.find((d) => d.year === year); // only render if data exists
          if (!point) return null;

          const x = getX(index);
          return (
            <React.Fragment key={year}>
              <Rect
                x={x}
                y={getY(point.PvProduction)}
                width={BAR_WIDTH}
                height={getBarHeight(point.PvProduction)}
                color="#fa2742"
              />
              <Rect
                x={x + BAR_WIDTH + BAR_GAP}
                y={getY(point.gridFeed)}
                width={BAR_WIDTH}
                height={getBarHeight(point.gridFeed)}
                color="#e6a5aeff"
              />
            </React.Fragment>
          );
        })}

        {/* Tooltip indicator */}
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
              x={tooltip.cx - 4}
              y={tooltip.cy - 4}
              width={8}
              height={8}
              rx={4}
              ry={4}
              color="#15803d"
            />
          </>
        )}
      </Canvas>

      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />

      {/* Tooltip */}
      {tooltip && (
        <View
          style={[
            styles.tooltip,
            {
              // Center the tooltip over the bar
              left: Math.min(
                Math.max(tooltip.cx - 80, 0), // prevent going left off-screen
                width - 180 // tooltip width is ~160, prevent going right off-screen
              ),
              top: Math.max(tooltip.cy - 60, 0), // prevent going above top
            },
          ]}
        >
          <Text style={styles.tooltipDay}>{tooltip.point.year}</Text>
          <Text style={styles.tooltipValue}>
            PV Production: {tooltip.point.PvProduction.toFixed(2)} MWh
          </Text>
        </View>
      )}

      {/* X Axis labels */}
      <View style={styles.xLabels}>
        {ALL_YEARS.map((year, i) => (
          <Text
            key={year}
            style={[styles.xLabel, { left: getX(i) + SLOT_WIDTH / 2 - 10 }]}
          >
            {year}
          </Text>
        ))}
      </View>

      {/* Y Labels */}
      <View style={styles.yLabels}>
        {yTicks.map((v, i) => {
          const yTickCount = Math.max(yTicks.length - 1, 1);
          const spacing = chartHeight / yTickCount;

          const y = PADDING.top + chartHeight - i * spacing;

          return (
            <Text key={i} style={[styles.yLabel, { top: y - 10 }]}>
              {v}
            </Text>
          );
        })}
      </View>

      {/* Y Axis unit */}
      <Text style={styles.yUnit}> MWh </Text>

      {/* Legend */}
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
const smallWidth = Math.min(width, height); // use smaller dimension for scaling
const scale = smallWidth / 375; // reference width: 375

const PADDINGS = {
  left: 46 * scale,
  right: 20 * scale,
  top: 7 * scale,
  bottom: 40 * scale,
};

export const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    backgroundColor: "#767373",
    paddingVertical: 8 * scale,
    paddingHorizontal: 12 * scale,
    borderRadius: 6 * scale,
  },
  tooltipTime: {
    color: "#f7f7f7",
    fontWeight: "800",
    marginBottom: 4 * scale,
    opacity: 1,
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
    fontSize: 12 * scale,
    opacity: 1,
    fontWeight: "500",
  },
  xLabels: {
    position: "absolute",
    bottom: 8 * scale,
    left: 2 * scale,
    right: 0,
    height: 28 * scale,
  },
  xLabel: {
    position: "absolute",
    fontSize: 5 * scale,
    color: "#080808",
  },
  yLabels: {
    position: "absolute",
    left: 0,
    top: PADDINGS.top,
    width: PADDINGS.left - 3 * scale,
    height: "100%",
  },
  yLabel: {
    position: "absolute",
    right: 4 * scale,
    fontSize: 6 * scale,
    color: "#030303",
    textAlign: "right",
  },
  yUnit: {
    position: "absolute",
    left: 3 * scale,
    top: PADDINGS.top - 20 * scale,
    fontSize: 10 * scale,
    fontWeight: "800",
    color: "#666",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 3 * scale,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12 * scale,
  },
  legendDot: {
    width: 10 * scale,
    height: 10 * scale,
    marginRight: 10 * scale,
  },
  legendText: {
    fontSize: 10 * scale,
    color: "#333",
  },
});
