import {
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  Skia,
} from "@shopify/react-native-skia";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const minutesToHour = (m) => m / 60;
const minutesToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0"
  )}`;

const PADDING = { left: 44, right: 25, top: 1, bottom: 35 };
const GRID_LINES = 4;

const DC_CURRENT_MAX = 10;
const DC_VOLTAGE_MAX = 300;
const maxVoltage = 300;

/* ---------- Series Config ---------- */

const DC_VOLTAGES = [
  { key: "dc_voltage_1", color: "#1e29ff" },
  { key: "dc_voltage_2", color: "#12f36f" },
  { key: "dc_voltage_3", color: "#22c55e" },
  { key: "dc_voltage_4", color: "#0ea5e9" },
  { key: "dc_voltage_5", color: "#6366f1" },
  { key: "dc_voltage_6", color: "#8b5cf6" },
  { key: "dc_voltage_7", color: "#ec4899" },
  { key: "dc_voltage_8", color: "#f97316" },
];

const DC_CURRENTS = [
  { key: "dc_current_1", color: "#dc2626" },
  { key: "dc_current_2", color: "#ef4444" },
  { key: "dc_current_3", color: "#f87171" },
  { key: "dc_current_4", color: "#fb7185" },
  { key: "dc_current_5", color: "#be123c" },
  { key: "dc_current_6", color: "#9f1239" },
  { key: "dc_current_7", color: "#881337" },
  { key: "dc_current_8", color: "#7f1d1d" },
];

const AC_CURRENTS = [
  { key: "ac_current_a", color: "#16a34a" },
  { key: "ac_current_b", color: "#22c55e" },
  { key: "ac_current_c", color: "#4ade80" },
];

const AC_VOLTAGES = [
  { key: "ac_voltage_a", color: "#2563eb" },
  { key: "ac_voltage_b", color: "#3b82f6" },
  { key: "ac_voltage_c", color: "#60a5fa" },
];
const generateTicks = (max, count = 4) => {
  const step = Math.ceil(max / count);
  return Array.from({ length: count + 1 }, (_, i) => i * step);
};

/* ---------- Component ---------- */

export function DevicesDailyPVChart({ width, height, selectedDate }) {
  const [tooltip, setTooltip] = useState(null);
  const hideTooltipTimeout = useRef(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const hasData = Array.isArray(data) && data.length > 0;

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  /* ---------- Scales ---------- */

  const voltageToY = (v) =>
    PADDING.top + chartHeight - (v / maxVoltage) * chartHeight;

  const dcCurrentToY = (v) =>
    PADDING.top + chartHeight - (v / DC_CURRENT_MAX) * chartHeight;

  /* ---------- Path Builders ---------- */

  const buildLinePath = (getY) => {
    const p = Skia.Path.Make();
    if (!hasData) return p;

    data.forEach((d, i) => {
      if (d?.timeMinutes == null) return;

      const x = PADDING.left + (minutesToHour(d.timeMinutes) / 24) * chartWidth;

      const y = getY(d);
      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    });

    return p;
  };

  const buildAreaPath = (getY) => {
    const p = buildLinePath(getY);
    if (!hasData || data.length < 2) return p;

    const first = data[0];
    const last = data[data.length - 1];

    const firstX =
      PADDING.left + (minutesToHour(first.timeMinutes) / 24) * chartWidth;

    const lastX =
      PADDING.left + (minutesToHour(last.timeMinutes) / 24) * chartWidth;

    p.lineTo(lastX, PADDING.top + chartHeight);
    p.lineTo(firstX, PADDING.top + chartHeight);
    p.close();

    return p;
  };

  /* ---------- Tooltip ---------- */

  const handlePress = (e) => {
    if (!hasData) return;
    const ratio = (e.nativeEvent.locationX - PADDING.left) / chartWidth;
    const hour = Math.max(0, Math.min(24, ratio * 24));

    const nearest = data.reduce((a, b) =>
      Math.abs(minutesToHour(b.timeMinutes) - hour) <
      Math.abs(minutesToHour(a.timeMinutes) - hour)
        ? b
        : a
    );

    const cx =
      PADDING.left + (minutesToHour(nearest.timeMinutes) / 24) * chartWidth;
    const cy = voltageToY(Number(nearest.dc_voltage_1));

    setTooltip({ cx, cy, point: nearest });
    hideTooltipTimeout.current = setTimeout(() => setTooltip(null), 2000);
  };

  // API Data Fetching

  useEffect(() => {
    if (!selectedDate) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NjU2MjAxNiwiZXhwIjoxNzk4MDk4MDE2fQ.X8xm_XKtIK-cOQdRrnTQNNDHBXTE9sGPkDnTk7OdoEY";

        const date_parameter = `${selectedDate.getFullYear()}-${String(
          selectedDate.getMonth() + 1
        ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

        const response = await axios.post(
          "https://utlsolarrms.com/api/charts/devices/daily/device_daily_chart",
          {
            device_sn: "ECFABCD8A00F",
            date_parameter,
          },
          {
            headers: {
              Cookie: `auth_token=${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        console.log("API SUCCESS ✅", response.data);
        const normalized = (response.data?.results || []).map((item) => ({
          time: item.time,
          timeMinutes: Number(item.timeMinutes),

          ac_voltage_a: item.ac_voltage_a,
          ac_voltage_b: item.ac_voltage_b,
          ac_voltage_c: item.ac_voltage_c,

          ac_current_a: item.ac_current_a,
          ac_current_b: item.ac_current_b,
          ac_current_c: item.ac_current_c,

          ac_power_a: item.ac_power_a,
          ac_power_b: item.ac_power_b,
          ac_power_c: item.ac_power_c,

          dc_voltage_1: item.dc_voltage_1,
          dc_voltage_2: item.dc_voltage_2,
          dc_voltage_3: item.dc_voltage_3,
          dc_voltage_4: item.dc_voltage_4,
          dc_voltage_5: item.dc_voltage_5,
          dc_voltage_6: item.dc_voltage_6,
          dc_voltage_7: item.dc_voltage_7,
          dc_voltage_8: item.dc_voltage_8,

          dc_current_1: item.dc_current_1,
          dc_current_2: item.dc_current_2,
          dc_current_3: item.dc_current_3,
          dc_current_4: item.dc_current_4,
          dc_current_5: item.dc_current_5,
          dc_current_6: item.dc_current_6,
          dc_current_7: item.dc_current_7,
          dc_current_8: item.dc_current_8,

          dc_power_1: item.dc_power_1,
          dc_power_2: item.dc_power_2,
          dc_power_3: item.dc_power_3,
          dc_power_4: item.dc_power_4,
          dc_power_5: item.dc_power_5,
          dc_power_6: item.dc_power_6,
          dc_power_7: item.dc_power_7,
          dc_power_8: item.dc_power_8,
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
  }, [selectedDate]);
  const Y_TICKS = GRID_LINES; // same as grid lines for perfect alignment

  const dcCurrentTicks = generateTicks(DC_CURRENT_MAX, Y_TICKS);
  const dcVoltageTicks = generateTicks(DC_VOLTAGE_MAX, Y_TICKS);

  const getMax = (keys, fallback = 1) => {
    if (!Array.isArray(data) || data.length === 0) return fallback;

    return Math.max(
      ...data.flatMap((d) => keys.map((k) => Number(d[k]) || 0)),
      fallback
    );
  };

  const maxCurrent = getMax(
    DC_CURRENTS.map((c) => c.key),
    DC_CURRENT_MAX
  );

  const maxVoltage = getMax(
    DC_VOLTAGES.map((v) => v.key),
    DC_VOLTAGE_MAX
  );

  if (!loading && !hasData) {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>No data for selected date</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {[...Array(GRID_LINES + 1)].map((_, i) => {
          const y = PADDING.top + (i / GRID_LINES) * chartHeight;
          return (
            <Line
              key={i}
              p1={{ x: PADDING.left, y }}
              p2={{ x: width - PADDING.right, y }}
              color="#d1d5db"
              strokeWidth={1}
            />
          );
        })}

        <Line
          p1={{ x: PADDING.left, y: PADDING.top }}
          p2={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          color="#9ca3af"
        />
        <Line
          p1={{ x: width - PADDING.right, y: PADDING.top }}
          p2={{
            x: width - PADDING.right,
            y: PADDING.top + chartHeight,
          }}
          color="#9ca3af"
        />

        {hasData &&
          DC_VOLTAGES.map(({ key, color }) => {
            const areaPath = buildAreaPath((d) => voltageToY(Number(d[key])));
            const linePath = buildLinePath((d) => voltageToY(Number(d[key])));

            if (!areaPath || !linePath) return null;

            return (
              <Group key={key}>
                <Path path={areaPath} color={color} opacity={0.12} />
                <Path
                  path={linePath}
                  color={color}
                  style="stroke"
                  strokeWidth={2}
                />
              </Group>
            );
          })}

        {hasData &&
          DC_CURRENTS.map(({ key, color }) => (
            <Group key={key}>
              <Path
                path={buildAreaPath((d) => dcCurrentToY(Number(d[key])))}
                color={color}
                opacity={0.1}
              />
              <Path
                path={buildLinePath((d) => dcCurrentToY(Number(d[key])))}
                color={color}
                style="stroke"
                strokeWidth={2}
              />
            </Group>
          ))}

        {hasData &&
          AC_CURRENTS.map(({ key, color }) => (
            <Path
              key={key}
              path={buildLinePath((d) => dcCurrentToY(Number(d[key])))}
              color={color}
              style="stroke"
              strokeWidth={2}
            />
          ))}

        {hasData &&
          AC_VOLTAGES.map(({ key, color }) => (
            <Path
              key={key}
              path={buildLinePath((d) => voltageToY(Number(d[key])))}
              color={color}
              style="stroke"
              strokeWidth={2}
            />
          ))}

        {tooltip && (
          <>
            <Line
              p1={{ x: tooltip.cx, y: PADDING.top }}
              p2={{
                x: tooltip.cx,
                y: PADDING.top + chartHeight,
              }}
              color="#9ca3af"
            />
            <Circle cx={tooltip.cx} cy={tooltip.cy} r={4} color="#179503ff" />
          </>
        )}
      </Canvas>

      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress} />

      {/* Tooltip overlay */}
      {tooltip && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: Math.min(width - 160, Math.max(0, tooltip.cx - 80)),
              top: Math.max(0, Math.min(height - 60, tooltip.cy - 50)),
            },
          ]}
        >
          <Text style={styles.tooltipTime}>
            {minutesToTime(tooltip.point.timeMinutes)}
          </Text>

          <Text style={styles.tooltipValue}>
            DC Voltage 1: {parseFloat(tooltip.point.dc_voltage_1).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 2: {parseFloat(tooltip.point.dc_voltage_2).toFixed(2)} V
          </Text>
          {/* <Text style={styles.tooltipValue}>
            DC Voltage 3: {parseFloat(tooltip.point.dc_voltage_3).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 4: {parseFloat(tooltip.point.dc_voltage_4).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 5: {parseFloat(tooltip.point.dc_voltage_5).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 6: {parseFloat(tooltip.point.dc_voltage_6).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 7: {parseFloat(tooltip.point.dc_voltage_7).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            DC Voltage 8: {parseFloat(tooltip.point.dc_voltage_8).toFixed(2)} V
          </Text> */}
          <Text style={styles.tooltipValue}>
            DC Current 1: {parseFloat(tooltip.point.dc_current_1).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 2: {parseFloat(tooltip.point.dc_current_2).toFixed(2)} A
          </Text>
          {/* <Text style={styles.tooltipValue}>
            DC Current 3: {parseFloat(tooltip.point.dc_current_3).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 4: {parseFloat(tooltip.point.dc_current_4).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 5: {parseFloat(tooltip.point.dc_current_5).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 6: {parseFloat(tooltip.point.dc_current_6).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 7: {parseFloat(tooltip.point.dc_current_7).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            DC Current 8: {parseFloat(tooltip.point.dc_current_8).toFixed(2)} A
          </Text> */}
          <Text style={styles.tooltipValue}>
            AC Voltage a: {parseFloat(tooltip.point.ac_voltage_a).toFixed(2)} V
          </Text>
          {/* <Text style={styles.tooltipValue}>
            AC Voltage b: {parseFloat(tooltip.point.ac_voltage_b).toFixed(2)} V
          </Text>
          <Text style={styles.tooltipValue}>
            AC Voltage c: {parseFloat(tooltip.point.ac_voltage_c).toFixed(2)} V
          </Text> */}
          <Text style={styles.tooltipValue}>
            AC Current a: {parseFloat(tooltip.point.ac_current_a).toFixed(2)} A
          </Text>
          {/* <Text style={styles.tooltipValue}>
            AC Current b: {parseFloat(tooltip.point.ac_current_b).toFixed(2)} A
          </Text>
          <Text style={styles.tooltipValue}>
            AC Current c: {parseFloat(tooltip.point.ac_current_c).toFixed(2)} A
          </Text> */}
        </View>
      )}

      {/* X Axis labels */}
      <View style={styles.xLabels}>
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => {
          const x = PADDING.left + (h / 24) * chartWidth;
          return (
            <Text key={h} style={[styles.xLabel, { left: x - 16 }]}>
              {String(h).padStart(2, "0")}:00
            </Text>
          );
        })}
      </View>

      {/* Y Axis labels */}
      <View style={styles.yLabels}>
        {generateTicks(maxCurrent, 4).map((v) => {
          const y = PADDING.top + chartHeight - (v / maxCurrent) * chartHeight;

          return (
            <Text key={v} style={[styles.yLabel, { top: y - 10 }]}>
              {v}
            </Text>
          );
        })}
      </View>

      <View style={styles.rightYLabels}>
        {generateTicks(maxVoltage, 4).map((v) => {
          const y = PADDING.top + chartHeight - (v / maxVoltage) * chartHeight;

          return (
            <Text key={v} style={[styles.rightYLabel, { top: y - 10 }]}>
              {v}
            </Text>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#1e29ff" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 1 </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#12f36f" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 2</Text>
        </View>
        {/* <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 3</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#0ea5e9" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 4</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#6366f1" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 5 </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#8b5cf6" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 6</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#ec4899" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 7</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#f97316" }]} />
          <Text style={styles.legendText}>DC VOLTAGE 8</Text>
        </View> */}
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#dc2626" }]} />
          <Text style={styles.legendText}>DC CURRENT 1 </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>DC CURRENT 2</Text>
        </View>
        {/* <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#f87171" }]} />
          <Text style={styles.legendText}>DC CURRENT 3</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#fb7185" }]} />
          <Text style={styles.legendText}>DC CURRENT 4</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#be123c" }]} />
          <Text style={styles.legendText}>DC CURRENT 5 </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#9f1239" }]} />
          <Text style={styles.legendText}>DC CURRENT 6 </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#881337" }]} />
          <Text style={styles.legendText}>DC CURRENT 7</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#7f1d1d" }]} />
          <Text style={styles.legendText}>DC CURRENT 8</Text>
        </View> */}
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#2563eb" }]} />
          <Text style={styles.legendText}>AC VOLTAGE a</Text>
        </View>
        {/* <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
          <Text style={styles.legendText}>AC VOLTAGE b</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#60a5fa" }]} />
          <Text style={styles.legendText}>AC VOLTAGE c</Text>
        </View> */}
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#16a34a" }]} />
          <Text style={styles.legendText}>AC CURRENT a </Text>
        </View>
        {/* <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>AC CURRENT b</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#4ade80" }]} />
          <Text style={styles.legendText}>AC CURRENT c</Text>
        </View> */}
      </View>

      <Text style={styles.yUnit}>A</Text>
      <Text style={styles.yUnit2}>V</Text>
    </View>
  );
}

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// Reference design width = 375 (iPhone X / 11)
const smallWidth = Math.min(width, 375);
const scale = smallWidth / 375;

// Helper (optional but clean)
const s = (value) => value * scale;

const PADDINGS = {
  left: s(46),
  right: s(20),
  top: s(10),
  bottom: s(40),
};

const styles = StyleSheet.create({
  rightYLabels: {
    position: "absolute",
    right: 7,
    width: PADDINGS.right,
    top: 7,
  },
  rightYLabel: {
    position: "absolute",
    right: 1,
    fontSize: 6,
    color: "#060606ff",
    textAlign: "center",
  },
  yUnit: {
    position: "absolute",
    left: 20,
    top: PADDINGS.top - 20,
    fontSize: 7,
    fontWeight: "500",
    color: "#666",
  },
  yUnit2: {
    position: "absolute",
    right: 0,
    width: PADDINGS.right,
    top: PADDINGS.top - 25,
    fontSize: 7,
    fontWeight: "500",
    color: "#666",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "#575656ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "column",
    alignItems: "flex-start",
    // zIndex: 10,
    opacity: 0.9,
  },

  tooltipTime: {
    color: "#ffffffff",
    fontWeight: 700,
    marginBottom: 4,
  },

  tooltipValue: {
    color: "#fcf8f8ff",
    fontSize: 8,
    opacity: 1,
    fontWeight: 400,
  },

  xLabels: {
    position: "absolute",
    bottom: 8,
    left: 7,
    right: 0,
    height: 20,
  },

  xLabel: {
    position: "absolute",
    fontSize: 6,
    color: "#080808ff",
  },
  yLabels: {
    position: "absolute",
    left: 0,
    width: PADDINGS.left,
    justifyContent: "space-between",
  },

  yLabel: {
    fontSize: 7,
    color: "#111827",
    textAlign: "right",
    paddingRight: 6,
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
    top: 20,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 6,
    fontWeight: "600",
    color: "#333",
    letterSpacing: 0.3,
  },
});
