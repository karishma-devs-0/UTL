import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import styles from '../styles/style';
import { COLORS } from '../styles/style';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const DashboardCircularProgress = ({ 
  dashboardData = null,
  title = "Overall Production Overview",
  animated = true,
  style,
  width,
  size = 120,
  strokeWidth = 10
}) => {
  // State for calculated values
  const [targetPercentage, setTargetPercentage] = useState(0);
  const [productionStats, setProductionStats] = useState({
    installedCapacity: { value: '--', unit: 'kWp' },
    currentPower: { value: '--', unit: 'kW' },
    dailyProduction: { value: '--', unit: 'kWh' },
    monthlyProduction: { value: '--', unit: 'kWh' },
    yearlyProduction: { value: '--', unit: 'MWh' },
    totalProduction: { value: '--', unit: 'MWh' }
  });

  // Animated value for the percentage
  const animatedPercentageValue = useRef(new Animated.Value(0)).current;

  // Calculate the radius and center point
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Helper function to format production values with automatic unit conversion
  const formatValue = (value, defaultUnit = 'kWh') => {
    if (!value || value === '--' || isNaN(parseFloat(value))) {
      return { value: '--', unit: defaultUnit };
    }

    const numericValue = parseFloat(value);

    // For values >= 1000, convert to next unit up
    if (numericValue >= 1000) {
      switch (defaultUnit) {
        case 'kW':
          return {
            value: (numericValue / 1000).toFixed(2),
            unit: 'kW'
          };
        case 'kWh':
          return {
            value: (numericValue / 1000).toFixed(2),
            unit: 'MWh'
          };
        default:
          return {
            value: numericValue.toFixed(2),
            unit: defaultUnit
          };
      }
    }

    return {
      value: numericValue.toFixed(2),
      unit: defaultUnit
    };
  };

  useEffect(() => {
    if (dashboardData) {
      try {
        // Extract values from dashboard data safely
        const {
          installed_capacity = 0,
          current_power = 0,
          daily_production = 0,
          monthly_production = 0,
          yearly_production = 0,
          total_production = 0,
          utilization_percentage = 0
        } = dashboardData;

        // Calculate percentage based on utilization or current power vs capacity with safety checks
        let calculatedPercentage = 0;
        if (utilization_percentage) {
          calculatedPercentage = parseFloat(utilization_percentage) || 0;
        } else if (parseFloat(installed_capacity) > 0) {
          calculatedPercentage = (parseFloat(current_power || 0) / parseFloat(installed_capacity)) * 100;
        }

        // Ensure percentage is between 0-100
        calculatedPercentage = Math.max(0, Math.min(100, calculatedPercentage));
        
        setTargetPercentage(calculatedPercentage);

        // Format all production values safely
        setProductionStats({
          installedCapacity: { 
            value: parseFloat(installed_capacity || 0).toFixed(2), 
            unit: 'kWp' 
          },
          currentPower: formatValue(current_power, 'kW'),
          dailyProduction: formatValue(daily_production, 'kWh'),
          monthlyProduction: formatValue(monthly_production, 'kWh'),
          yearlyProduction: { 
            value: parseFloat(yearly_production || 0).toFixed(2), 
            unit: 'MWh' 
          },
          totalProduction: { 
            value: parseFloat(total_production || 0).toFixed(2), 
            unit: 'MWh' 
          }
        });

        if (animated) {
          Animated.timing(animatedPercentageValue, {
            toValue: calculatedPercentage,
            duration: 1000,
            useNativeDriver: true
          }).start();
        } else {
          animatedPercentageValue.setValue(calculatedPercentage);
        }
      } catch (error) {
        console.error('[DashboardCircularProgress] Error processing dashboard data:', error);
      }
    }
  }, [dashboardData, animated]);

  // Calculate the stroke dashoffset based on percentage
  const strokeDashoffset = circumference - (circumference * targetPercentage) / 100;

  return (
    <View style={[
      style, 
      { 
        backgroundColor: 'transparent',
        padding: 0,
        margin: 0,
        elevation: 0,
        shadowOpacity: 0,
        borderWidth: 0
      },
      width ? { width } : {}
    ]}>
      {title && <Text style={styles.cardTitle}>{title}</Text>}
      <View style={styles.productionOverviewContainer}> 
        <View style={styles.productionLeftColumn}>
          {/* Container for the SVG and text */}
          <View style={[styles.progressGraphicContainer, { width: size, height: size }]}> 
            {/* SVG Canvas */}
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background Circle */}
              <Circle
                stroke={COLORS.lightGrey || '#e0e0e0'} // Background track color
                fill="none"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={strokeWidth}
              />
              {/* Progress Circle - Animated */}
              <AnimatedCircle
                stroke={COLORS.primary || '#00875A'} // Progress color
                fill="none"
                cx={center}
                cy={center}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={animated ? animatedPercentageValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: [circumference, 0]
                }) : strokeDashoffset}
                strokeLinecap="round" // Makes the ends rounded
                transform={`rotate(-90 ${center} ${center})`}
              />
            </Svg>
            {/* Static View for the Text, positioned absolutely on top */}
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercentText}>
                {targetPercentage.toFixed(2)}
                <Text style={styles.progressPercentSymbol}>%</Text>
              </Text> 
              {/* Show power icon if power > 0 */}
              {parseFloat(productionStats.currentPower.value) > 0 && (
                <View>
                  <Icon name="power" size={24} color={COLORS.primary || '#00875A'} style={styles.powerIcon}/>
                </View>
              )}
            </View>
          </View>
          {/* Stats below the graphic */}
          <View style={[styles.productionStatItem, { alignItems: 'center' }]}> 
            <Text style={styles.productionStatLabel}>Total Production Power</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.currentPower.value}
              <Text style={styles.productionStatUnit}> {productionStats.currentPower.unit}</Text>
            </Text>
          </View>
          <View style={[styles.productionStatItem, { alignItems: 'center' }]}> 
            <Text style={styles.productionStatLabel}>Installed Capacity</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.installedCapacity.value}
              <Text style={styles.productionStatUnit}> {productionStats.installedCapacity.unit}</Text>
            </Text>
          </View>
        </View>

        {/* Right Side: Production Stats */}
        <View style={styles.productionRightColumn}>
          <View style={styles.productionStatItem}> 
            <Text style={styles.productionStatLabel}>Daily Production</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.dailyProduction.value}
              <Text style={styles.productionStatUnit}> {productionStats.dailyProduction.unit}</Text>
            </Text>
          </View>
          <View style={styles.productionStatItem}> 
            <Text style={styles.productionStatLabel}>Monthly Production</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.monthlyProduction.value}
              <Text style={styles.productionStatUnit}> {productionStats.monthlyProduction.unit}</Text>
            </Text>
          </View>
          <View style={styles.productionStatItem}> 
            <Text style={styles.productionStatLabel}>Yearly Production</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.yearlyProduction.value}
              <Text style={styles.productionStatUnit}> {productionStats.yearlyProduction.unit}</Text>
            </Text>
          </View>
          <View style={styles.productionStatItem}> 
            <Text style={styles.productionStatLabel}>Total Production</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.totalProduction.value}
              <Text style={styles.productionStatUnit}> {productionStats.totalProduction.unit}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DashboardCircularProgress; 