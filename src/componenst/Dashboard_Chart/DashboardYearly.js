import { Canvas, Circle, Line, Rect } from "@shopify/react-native-skia";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

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

const PADDING = { left: 46, right: 20, top: 10, bottom: 40 };
const MONTHS_IN_YEAR = 12;
const BAR_GAP = 2;

export function DashboardYearlyPVBarChart({ width, height, selectedYear }) {
  const [tooltip, setTooltip] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const Y_MAX = useMemo(() => {
    if (!data.length) return 10;

    const maxValue = Math.max(...data.map((d) => d.PVProduction));

    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue || 1)));

    return Math.ceil(maxValue / magnitude) * magnitude;
  }, [data]);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  const SLOT_WIDTH = chartWidth / MONTHS_IN_YEAR;
  const BAR_WIDTH = (SLOT_WIDTH - BAR_GAP) / 3;

  const getXStart = (month) => PADDING.left + (month - 1) * SLOT_WIDTH;
  const getXCenter = (month) => PADDING.left + (month - 0.5) * SLOT_WIDTH;
  const getY = (value) =>
    PADDING.top + chartHeight - (value / Y_MAX) * chartHeight;

  const handlePress = (e) => {
    const { locationX } = e.nativeEvent;
    const relX = locationX - PADDING.left;
    if (relX < 0 || relX > chartWidth) return;

    const month = Math.floor((relX / chartWidth) * MONTHS_IN_YEAR) + 1;
    const point = data.find((d) => d.month === month);
    if (!point) return;

    setTooltip({
      cx: getXCenter(month),
      cy:
        PADDING.top + chartHeight - (point.PvProduction / Y_MAX) * chartHeight,
      point,
    });

    setTimeout(() => setTooltip(null), 4000);
  };

  /* ================= YEARLY API ================= */
  useEffect(() => {
    if (!selectedYear) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2NjYzOTUxMCwiZXhwIjoxNzk4MTc1NTEwfQ.9tAtwpgBgzE9iuMZo-IVRMKp-iFdIzSYm4ntq8YjPvY";
        const date_parameter = String(selectedYear || new Date().getFullYear());

        const response = await axios.post(
          "https://utlsolarrms.com/api/charts/solar_power_per_project/yearly/",
          { plant_id: 1, date_parameter },
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

        /* ✅ Always 12 months */
        const normalized = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const found = apiData.find((m) => Number(m.month) === month);
          return {
            month,
            PVProduction: Number(found?.PvProduction || 0),
          };
        });

        setData(normalized);
      } catch (err) {
        console.log("API ERROR ❌", err.response?.data);
        console.log("FULL ERROR OBJECT 👉", err);
        console.log("err.response 👉", err.response);
        console.log("err.request 👉", err.request);
        console.log("err.message 👉", err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  const TICK_COUNT = 5;

  const yTicks = useMemo(() => {
    return Array.from({ length: TICK_COUNT + 1 }, (_, i) =>
      Math.round((Y_MAX / TICK_COUNT) * i)
    );
  }, [Y_MAX]);

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <Rect
            key={`y-${i}`}
            x={PADDING.left}
            y={PADDING.top + chartHeight - p * chartHeight}
            width={chartWidth}
            height={1}
            color="#d1d5db"
          />
        ))}

        {/* Y axis */}
        <Line
          p1={{ x: PADDING.left, y: PADDING.top }}
          p2={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          color="#d1d5db"
          strokeWidth={1}
        />

        {/* Bars */}
        {data.map((d) => {
          const x = getXStart(d.month);
          const heightValue = (d.PVProduction / Y_MAX) * chartHeight;

          if (heightValue <= 0) return null;

          return (
            <Rect
              key={d.month}
              x={x}
              y={PADDING.top + chartHeight - heightValue}
              width={BAR_WIDTH}
              height={heightValue}
              color="#fa2742"
            />
          );
        })}

        {/* Tooltip marker */}
        {tooltip && (
          <>
            <Line
              p1={{ x: tooltip.cx, y: PADDING.top }}
              p2={{ x: tooltip.cx, y: PADDING.top + chartHeight }}
              color="#9ca3af"
            />
            <Circle cx={tooltip.cx} cy={tooltip.cy} r={4} color="#15803d" />
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
              left: Math.max(8, Math.min(tooltip.cx - 100, width - 200 - 8)),
              top: Math.max(8, Math.min(tooltip.cy - 60, height - 70 - 8)),
            },
          ]}
        >
          <Text style={styles.tooltipDay}>
            {MONTHS[tooltip.point.month - 1]}
          </Text>
          <Text style={styles.tooltipValue}>
            PV Production: {Number(tooltip.point.PVProduction).toFixed(2)} MWh
          </Text>
        </View>
      )}

      {/* X labels */}
      <View style={styles.xLabels}>
        {MONTHS.map((m, i) => (
          <Text
            key={m}
            style={[styles.xLabel, { left: getXCenter(i + 1) - 10 }]}
          >
            {m}
          </Text>
        ))}
      </View>

      {/* Y labels */}
      <View style={styles.yLabels}>
        {yTicks.map((v, i) => (
          <Text
            key={v}
            style={[
              styles.yLabel,
              {
                top:
                  PADDING.top +
                  chartHeight -
                  (i * chartHeight) / (yTicks.length - 1),
              },
            ]}
          >
            {v}
          </Text>
        ))}
      </View>
      <Text style={styles.yUnit}> MWh </Text>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#fa2742" }]} />
          <Text style={[styles.legendText, { color: "#fa2742" }]}>
            Pv Production
          </Text>
        </View>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const smallWidth = Math.min(width, height); // use smaller dimension for scaling
const scale = smallWidth / 375; // reference width: 375

const PADDINGS = {
  left: 46 * scale,
  right: 20 * scale,
  top: 10 * scale,
  bottom: 40 * scale,
};

export const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    backgroundColor: "#636262",
    paddingVertical: 6 * scale,
    paddingHorizontal: 10 * scale,
    borderRadius: 6 * scale,
    opacity: 0.8,
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
    fontSize: 10 * scale,
    opacity: 1,
    fontWeight: "500",
  },
  xLabels: {
    position: "absolute",
    bottom: 10 * scale,
    left: 1 * scale,
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
    width: PADDINGS.left - 3 * scale,
    height: "100%",
    bottom: 5 * scale,
  },
  yLabel: {
    position: "absolute",
    right: 4 * scale,
    fontSize: 7 * scale,
    color: "#030303",
    textAlign: "right",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10 * scale,
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
  yUnit: {
    position: "absolute",
    left: 3 * scale,
    top: PADDINGS.top - 30 * scale,
    fontSize: 10 * scale,
    fontWeight: "800",
    color: "#374151",
  },
});
