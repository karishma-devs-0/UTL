import React from 'react';
import { ActivityIndicator, View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native'; // Added Text and TouchableOpacity
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import styles, { colors } from '../styles/style'; // Ensure this path and export are correct
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // <-- Import icons

// Import Screens (using consistent PascalCase)
import LoginScreen from '../screens/loginScreen';
import BusinessSelectScreen from '../screens/BusinessSelectionScreen';
import DashboardScreen from '../screens/dashboard';
import MonitorScreen from '../screens/Monitor';
import MeScreen from '../screens/Me';
import AlertScreen from '../screens/Alert';
import AppSettings from '../screens/AppSettings'; // <-- Import AppSettings
import PlantTabNavigator from './PlantTabNavigator'; // <-- Import your existing navigator
import AddPlantScreen from '../screens/addPlant';
import RegisterScreen from '../screens/Register'; // Import the Register screen
import AddDataloggerScreen from '../screens/AddDataloggerScreen'; // <-- Import the new screen
import DashboardSettingsScreen from '../screens/DashboardSettingsScreen'; // <-- Import the new screen
import InverterTabNavigator from './InverterTabNavigator'; // <-- Add import for InverterTabNavigator
import LoggerTabNavigator from './LoggerTabNavigator'; // <-- Add import for LoggerTabNavigator
import DetailedProductionChartsScreen from '../screens/DetailedProductionChartsScreen'; // <-- Import the new screen

// TODO: Import Plant Details, Add Plant screens etc. when created

// Import icons later if needed
// import Ionicons from 'react-native-vector-icons/Ionicons';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- Loading Screen Placeholder ---
function SplashScreen() {
  // Use optional chaining and provide fallbacks for safety
  const primaryColor = colors?.primary || '#00875A';
  const secondaryTextColor = colors?.textSecondary || '#666666';
  const containerStyle = styles?.container || {};
  const centeredStyle = styles?.centeredContainer || {};
  // Combine styles and add inline fallbacks for core layout
  const viewStyle = [
    containerStyle,
    centeredStyle,
    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8FA' } // Inline fallback layout
  ];

  return (
    <View style={viewStyle}>
      <ActivityIndicator size="large" color={primaryColor} />
      <Text style={{ marginTop: 10, color: secondaryTextColor }}>Loading...</Text>
    </View>
  );
}

// --- Main Application Bottom Tabs ---
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => { // <-- Add tabBarIcon function
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard'; // Use 'dashboard' for both focused and unfocused as 'dashboard-outline' is likely invalid
              break;
            case 'Monitor':
              iconName = 'insights'; // 'insights' usually doesn't have an outline variant
              break;
            case 'Alert':
              iconName = focused ? 'notifications' : 'notifications-none';
              break;

            case 'Me':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle'; // Fallback
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors?.primary || '#00875A',
        tabBarInactiveTintColor: colors?.textSecondary || 'gray',
        headerShown: false,
        tabBarStyle: styles?.bottomTabBar,
        tabBarLabelStyle: styles?.bottomTabLabel,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Monitor" component={MonitorScreen} />
      <Tab.Screen name="Alert" component={AlertScreen} options={{ title: 'Alerts' }} />
      <Tab.Screen name="Me" component={MeScreen} />
    </Tab.Navigator>
  );
}

// --- Main Navigation Stack ---
export default function AppNavigator() {
  // Get userToken, isLoading, AND isBusinessSelected from context
  const { userToken, isLoading, isBusinessSelected } = useAuth();

  console.log('[AppNavigator] State:', { isLoading, userToken, isBusinessSelected }); // <-- Add this log

  if (isLoading) {
    return <SplashScreen />; // Show loading screen while checking token
  }

  // Return Stack Navigator directly without NavigationContainer
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 
        COMMENTED OUT LOGIN AND BUSINESS SELECTION FLOW
        NOW APP GOES DIRECTLY TO DASHBOARD
        
        {userToken == null ? (
          // --- Logged Out Screens ---
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        ) : !isBusinessSelected ? (
          // --- Logged In, Business Not Selected ---
          <Stack.Group>
            <Stack.Screen
              name="BusinessSelect"
              component={BusinessSelectScreen}
              options={{ headerShown: false, title: 'Select Business' }}
            />
          </Stack.Group>
        ) : (
      */}
      {/* --- Logged In, Business Selected --- */}
      <Stack.Group>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="MainApp" component={MainAppTabs} />
        {/* Add PlantTabNavigator to the main stack */}
        <Stack.Screen
          name="PlantTabs"
          component={PlantTabNavigator}
          // Keep header hidden 
          options={{ headerShown: false }}
        />
        {/* Add AppSettings to the main stack */}
        <Stack.Screen
          name="AppSettings"
          component={AppSettings}
          // Hide header
          options={{ headerShown: false, title: 'Settings' }}
        />

        <Stack.Screen
          name="AddPlant"
          component={AddPlantScreen}
          // Hide header
          options={{ headerShown: false, title: 'Add Plant' }}
        />
        <Stack.Screen name="AddDatalogger" component={AddDataloggerScreen} />
        {/* --- Add Dashboard Settings Screen --- */}
        <Stack.Screen
          name="DashboardSettings"
          component={DashboardSettingsScreen}
          options={{
            headerShown: false, // Use the custom header inside the screen
            // title: 'Dashboard Settings' // Title is set in the custom header
          }}
        />
        {/* --- End Add Dashboard Settings Screen --- */}
        {/* --- Add Inverter Tabs Screen --- */}
        <Stack.Screen
          name="InverterTabs"
          component={InverterTabNavigator}
          options={{
            headerShown: false // Our custom InverterAppBar will handle the header UI
          }}
        />
        {/* --- Logger Tabs Screen with Header --- */}
        <Stack.Screen
          name="LoggerTabs"
          component={LoggerTabNavigator}
          options={{
            headerShown: false // Completely hide the header
          }}
        />
        {/* +++ Add Detailed Production Charts Screen +++ */}
        <Stack.Screen
          name="DetailedProductionCharts"
          component={DetailedProductionChartsScreen}
          options={{ headerShown: false }} // The screen can manage its own header
        />
        {/* --- End Detailed Production Charts Screen --- */}
      </Stack.Group>
      {/* Closing parenthesis for the conditional rendering that's now commented out
        )
      */}
    </Stack.Navigator>
  );
  
}