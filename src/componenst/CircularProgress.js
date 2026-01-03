import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import styles from '../styles/style';
import { COLORS } from '../styles/style';
import { formatProductionValue } from '../utils/unitConversion';

// Create an Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Component now recalculates data based on plants prop
const CircularProgress = ({ 
  plants = [], // Expects an array of plant objects
  title = "Production Overview",
  animated = true, // Add animated prop, default to true
  style, // Keep style prop
  width, // Add specific width prop
  size = 120, // Size of the SVG canvas and circle
  strokeWidth = 10 // Width of the progress line
}) => {
  // State for calculated values
  const [targetPercentage, setTargetPercentage] = useState(0);
  const [productionStats, setProductionStats] = useState({
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

  // Calculate the stroke dashoffset based on percentage
  const strokeDashoffset = circumference - (circumference * targetPercentage) / 100;

  useEffect(() => {
    if (plants.length > 0) {
      const plant = plants[0];
      
      // Calculate percentage based on solar power vs capacity
      const solarPower = parseFloat(plant.solar_power) || 0;
      const capacity = parseFloat(plant.capacity) || 0;
      
      // Calculate percentage: (solar_power / capacity) * 100
      //const calculatedPercentage = capacity > 0 ? (solarPower / capacity) * 100 : 0;
      const calculatedPercentage = capacity > 0 ? Math.min((solarPower / capacity) * 100, 100) : 0;

      

      setTargetPercentage(calculatedPercentage);

      // Format production values using the utility function
      const stats = {
        currentPower: formatProductionValue(plant.solar_power, 'kW'),
        dailyProduction: formatProductionValue(plant.daily_production),
        monthlyProduction: formatProductionValue(plant.monthlyProduction),
        yearlyProduction: formatProductionValue(plant.yearlyProduction),
        totalProduction: formatProductionValue(plant.totalProduction)
      };
      
      setProductionStats(stats);

      if (animated) {
        Animated.timing(animatedPercentageValue, {
          toValue: calculatedPercentage,
          duration: 1000,
          useNativeDriver: true
        }).start();
      } else {
        animatedPercentageValue.setValue(calculatedPercentage);
      }
    }
  }, [plants, animated]);

  return (
    <View style={[styles.watchlistContainerEnhanced, style, width ? { width } : {}]}>
      <Text style={styles.cardTitle}>{title}</Text>
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
              <Text style={styles.progressPercentText}>{targetPercentage.toFixed(2)}%</Text> 
              {/* Show power icon if power > 0 */}
              {parseFloat(productionStats.currentPower.value) > 0 && (
                <Icon name="power" size={24} color={COLORS.primary || '#00875A'} style={styles.powerIcon}/>
              )}
            </View>
          </View>
          {/* Stats below the graphic */}
          <View style={[styles.productionStatItem, { alignItems: 'center' }]}> 
            <Text style={styles.productionStatLabel}>Solar Power</Text>
            <Text style={styles.productionStatValue}>
              {productionStats.currentPower.value}
              <Text style={styles.productionStatUnit}> {productionStats.currentPower.unit}</Text>
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

export default CircularProgress;
