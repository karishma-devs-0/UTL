import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

// Import Inverter Tab Screens
import InverterParametersScreen from '../screens/inverter/InverterParametersScreen';
import InverterStatisticsScreen from '../screens/inverter/InverterStatisticsScreen';
import InverterAlertsScreen from '../screens/inverter/InverterAlertsScreen';
import InverterArchitectureScreen from '../screens/inverter/InverterArchitectureScreen';

// Placeholder for colors - import from your actual style constants
const COLORS = {
  primary: '#ff0000',
  secondary: '#00875A',
  white: '#fff',
};

const Tab = createBottomTabNavigator();

const InverterTabNavigator = ({ route, navigation }) => {
  // Extract device data passed from DevicesScreen
  // This will now be the full object passed as deviceData from the parent
  const { deviceData, deviceType /* deviceId might also be passed, but we derive from deviceData */ } = route.params || {};
  // Rename deviceData locally to make it clearer it's the main device object
  const device = deviceData;
  const liveData = deviceData; // Use the same object for live data for now
  // Prioritize inverterSno (camelCase from logs), then inverter_sno (snake_case), then id, then sno
  const originalDeviceId = device?.inverterSno || device?.inverter_sno || device?.id || device?.sno; // Keep this for Alerts if it needs inverter_sno
  console.log('[InverterTabNavigator] Received deviceData:', JSON.stringify(device, null, 2)); // Added for verification
  console.log('[InverterTabNavigator] originalDeviceId for Alerts/backup:', originalDeviceId);

  // Configure navigator to hide its header 
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({ headerShown: false });
      return () => { };
    }, [navigation])
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Parameters':
              iconName = 'tune'; // Example Icon
              break;
            case 'Statistics':
              iconName = 'bar-chart'; // Example Icon
              break;
            case 'Alerts':
              iconName = focused ? 'warning' : 'warning-amber';
              break;
            case 'Architecture':
              iconName = 'hub';
              break;
            default:
              iconName = 'help-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary || '#00875A',
        tabBarInactiveTintColor: COLORS.secondary || '#6c757d',
        headerShown: false, // Hide headers for all tab screens
        tabBarStyle: {
          backgroundColor: COLORS.white || '#fff',
          // Add other styles like border if needed
        },
        tabBarLabelStyle: {
          fontSize: 11, // Slightly smaller for 4 tabs
          paddingBottom: 2,
        },
      })}
    >
      <Tab.Screen
        name="Parameters"
        component={InverterParametersScreen}
        // Pass the full device object (which also contains live-like data)
        initialParams={{ device: device, liveData: liveData }}
      />
      <Tab.Screen
        name="Statistics"
        component={InverterStatisticsScreen}
        initialParams={{ device: device }} // Pass the full device object
      />
      <Tab.Screen
        name="Alerts"
        component={InverterAlertsScreen}
        // Pass the device data needed for showing the inverter ID in the AppBar
        initialParams={{ deviceData: device }}
      />
      <Tab.Screen
        name="Architecture"
        component={InverterArchitectureScreen}
        // Pass the full device object
        initialParams={{ device: device, liveData: liveData }}
      />
    </Tab.Navigator>
  );
};

export default InverterTabNavigator; 