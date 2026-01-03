import { Canvas, Circle, Line, Path, Skia } from "@shopify/react-native-skia";
import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/* ---------------- Utils ---------------- */
const minutesToHour = (m) => m / 60;

const minutesToTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(
    2,
    "0"
  )}`;

/* ---------------- Constants ---------------- */

const PADDING = { left: 44, right: 20, top: 10, bottom: 35 };
const GRID_LINES = 6;

const niceNumber = (range, round) => {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);

  let niceFraction;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
};

const getNiceScale = (min, max, ticks = 5) => {
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / (ticks - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const values = [];
  for (let v = niceMin; v <= niceMax; v += step) {
    values.push(v);
  }

  return { min: niceMin, max: niceMax, ticks: values };
};

/* ---------------- Component ---------------- */

export function PlantsDailyBarPVChart({ width, height, selectedDate }) {
  const [data, setData] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const hideTooltipTimeout = useRef(null);

  const hasData = Array.isArray(data) && data.length > 0;

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  /* ---------------- Fetch API ---------------- */

  useEffect(() => {
    if (!selectedDate) return;

    const fetchData = async () => {
      try {
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJzdXBlcmFkbWluQHNvbGFyLmNvbSIsIm5hbWUiOiJQYW5kZXlKaSIsInJvbGUiOnsiaWQiOjEsIm5hbWUiOiJTdXBlciBBZG1pbiIsImlzU3VwZXJBZG1pbiI6dHJ1ZX0sImJ1c2luZXNzIjpudWxsLCJwZXJtaXNzaW9ucyI6WyJhZGRfZGV2aWNlcyIsImNyZWF0ZV9idXNpbmVzc2VzIiwiY3JlYXRlX2xvZ2dlcnMiLCJjcmVhdGVfcGxhbnRzIiwiY3JlYXRlX3JvbGVzIiwiY3JlYXRlX3VzZXJzIiwiY3VzdG9taXplZF9jb21tYW5kIiwiZGVsZXRlX2J1c2luZXNzZXMiLCJkZWxldGVfZGV2aWNlcyIsImRlbGV0ZV9sb2dnZXJzIiwiZGVsZXRlX3BsYW50cyIsImRlbGV0ZV9yb2xlcyIsImRlbGV0ZV91c2VycyIsImVkaXRfYmF0Y2hfY29tbWFuZCIsImVkaXRfYnVzaW5lc3NlcyIsImVkaXRfZGV2aWNlcyIsImVkaXRfbG9nZ2VyIiwiZWRpdF9wbGFudHMiLCJlZGl0X3JvbGVzIiwiZWRpdF91c2VycyIsInVuYmluZF9sb2dnZXJzIiwidmlld19idXNpbmVzc2VzIiwidmlld19kZXZpY2VzIiwidmlld19sb2dnZXJzIiwidmlld19wbGFudHMiLCJ2aWV3X3JvbGVzIiwidmlld191c2VycyJdLCJmaW5nZXJwcmludCI6ImhiZW9uX21vYmlsZSIsImlhdCI6MTc2Njk5NDY0NSwiZXhwIjoxNzk4NTMwNjQ1fQ.RYafdG8sxywZn8tAgWNE92cIc-vtJ0hmoqOiZQD9TDg";

        const date_parameter = `${selectedDate.getFullYear()}-${String(
          selectedDate.getMonth() + 1
        ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

        const res = await axios.post(
          "https://utlsolarrms.com/api/charts/solar_power_per_plant_logs/daily/",
          {
            plant_id: 4518,
            loggerSno: "84F3EB8D9EEA",
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
        console.log(" Plants Daily API SUCCESS ✅", res.data);
        const normalized = (res.data?.results || []).map((d, i) => ({
          id: `${d.timeMinutes}-${i}`,
          timeMinutes: Number(d.timeMinutes),
          value: Number(d.PvProduction),
        }));

        setData(normalized);
      } catch (e) {
        console.log("API ERROR ❌", e?.response?.status);
        setData([]);
      }
    };

    fetchData();
  }, [selectedDate]);

  /* ---------------- Scales ---------------- */

  const yValues = useMemo(() => data.map((d) => d.value), [data]);

  const {
    min: yMin,
    max: yMax,
    ticks: yTicks,
  } = useMemo(() => {
    if (!yValues.length) {
      return { min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
    }
    return getNiceScale(0, Math.max(...yValues), GRID_LINES + 2);
  }, [yValues]);

  const minTime = Math.min(...data.map((d) => d.timeMinutes), 0);
  const maxTime = Math.max(...data.map((d) => d.timeMinutes), 1);

  const getX = (t) =>
    PADDING.left + ((t - minTime) / (maxTime - minTime || 1)) * chartWidth;

  const getY = (v) =>
    PADDING.top + chartHeight - ((v - yMin) / (yMax - yMin)) * chartHeight;
  const getXFromMinutes = (minutes) =>
    PADDING.left + (minutes / 1440) * chartWidth;

  /* ---------------- Paths ---------------- */

  // const linePath = useMemo(() => {
  //   const p = Skia.Path.Make();
  //   if (!hasData) return p;

  //   data.forEach((d, i) => {
  //     const x = (minutesToHour(d.timeMinutes) / 24) * chartWidth;
  //     const y = getY(d.value);
  //     i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
  //   });

  //   return p;
  // }, [data, getX, getY]);

  const linePath = useMemo(() => {
    const p = Skia.Path.Make();
    if (!hasData) return p;

    data.forEach((d, i) => {
      const x = getXFromMinutes(d.timeMinutes);
      const y = getY(d.value);

      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    });

    return p;
  }, [data, getY, chartWidth]);

  const areaPath = useMemo(() => {
    if (!hasData || data.length < 2) return Skia.Path.Make();

    const p = Skia.Path.Make();

    data.forEach((d, i) => {
      const x = getXFromMinutes(d.timeMinutes);
      const y = getY(d.value);
      i === 0 ? p.moveTo(x, y) : p.lineTo(x, y);
    });

    const first = data[0];
    const last = data[data.length - 1];
    const bottomY = PADDING.top + chartHeight;

    // Close area to X-axis
    p.lineTo(getXFromMinutes(last.timeMinutes), bottomY);
    p.lineTo(getXFromMinutes(first.timeMinutes), bottomY);
    p.close();

    return p;
  }, [data, hasData, getY, chartWidth]);

  /* ---------------- Tooltip ---------------- */

  const handlePress = (event) => {
    if (!event?.nativeEvent || !hasData) return;

    if (hideTooltipTimeout.current) {
      clearTimeout(hideTooltipTimeout.current);
    }

    const x = Math.max(
      PADDING.left,
      Math.min(event.nativeEvent.locationX, PADDING.left + chartWidth)
    );

    const ratio = (x - PADDING.left) / chartWidth;
    const hour = ratio * 24;

    const nearest = data.reduce((a, b) =>
      Math.abs(minutesToHour(b.timeMinutes) - hour) <
      Math.abs(minutesToHour(a.timeMinutes) - hour)
        ? b
        : a
    );

    const cx =
      PADDING.left + (minutesToHour(nearest.timeMinutes) / 24) * chartWidth;

    const cy = getY(nearest.value);

    setTooltip({ cx, cy, point: nearest });

    hideTooltipTimeout.current = setTimeout(() => setTooltip(null), 2000);
  };

  if (!hasData) {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>No data</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>
        {/* Grid */}
        {yTicks.map((v, i) => (
          <Line
            key={`grid-${i}`}
            p1={{ x: PADDING.left, y: getY(v) }}
            p2={{ x: width - PADDING.right, y: getY(v) }}
            color="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        <Path path={areaPath} color="#fa2742" opacity={0.2} />

        {/* Line */}
        <Path path={linePath} color="#fa2742" style="stroke" strokeWidth={2} />

        <Line
          p1={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          p2={{ x: width - PADDING.right, y: PADDING.top + chartHeight }}
          color="#9ca3af"
        />
        {/* Y Axis */}
        <Line
          p1={{ x: PADDING.left, y: PADDING.top }}
          p2={{ x: PADDING.left, y: PADDING.top + chartHeight }}
          color="#9ca3af"
          strokeWidth={1}
        />

        {/* Tooltip */}
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
      {tooltip && (
        <View
          style={[
            styles.tooltip,
            {
              left: tooltip.cx - 80,
              top: tooltip.cy - 45,
            },
          ]}
        >
          <Text style={styles.tooltipTime}>
            {minutesToTime(tooltip.point.timeMinutes)}
          </Text>
          <Text style={styles.tooltipValue}>
            PV Production: {Number(tooltip.point.value).toFixed(2)} W
          </Text>
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

      {/* Y Max label */}
      <Text
        style={[
          styles.yLabel,
          {
            position: "absolute",
            top: PADDING.top - 6,
            left: 0,
            width: PADDINGS.left,
            textAlign: "center",
            fontWeight: "400",
          },
        ]}
      >
        {yMax}
      </Text>

      {/* Y Axis labels */}
      <View style={styles.yLabels}>
        {yTicks.slice(0, -1).map((v, i) => (
          <Text key={`y-${i}`} style={[styles.yLabel, { top: getY(v) - 8 }]}>
            {v}
          </Text>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: "#fa2742" }]} />
          <Text style={styles.legendText}>Solar Power </Text>
        </View>
      </View>
      <Text style={styles.yUnit}> W </Text>
    </View>
  );
}

/* ---------------- Styles ---------------- */

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

// Reference design width = 375 (iPhone X / 11)
const smallWidth = Math.min(width, 375);
const scale = smallWidth / 375;

// Helper (optional but clean)
const s = (value) => value * scale;

const PADDINGS = {
  left: s(40),
  right: s(20),
  top: s(10),
  bottom: s(40),
};

const styles = StyleSheet.create({
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
    bottom: 4 * scale,
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
    width: PADDINGS.left - 3 * scale,
    height: "100%",
    bottom: 1 * scale,
  },
  yLabel: {
    position: "absolute",
    right: 4 * scale,
    fontSize: 6 * scale,
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
  dot: {
    width: 10 * scale,
    height: 10 * scale,
    marginRight: 10 * scale,
  },
  legendText: {
    fontSize: 10 * scale,
    color: "#f83a3aff",
  },
  yUnit: {
    position: "absolute",
    left: 3 * scale,
    top: PADDINGS.top - 30 * scale,
    fontSize: 10 * scale,
    fontWeight: "700",
    color: "#666",
  },
});
