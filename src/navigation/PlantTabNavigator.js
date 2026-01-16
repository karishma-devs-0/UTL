/**
 * src/navigation/PlantTabNavigator.js
 * This component creates the bottom tab bar shown in your screenshot.
 */
import React, { useEffect, useState } from 'react';
// import {Icon} from 'react-native-vector-icons/MaterialIcon';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { Alert } from 'react-native';
import { COLORS as colors  } from '../styles/style';

// --- Make sure these paths are correct for your project ---
import PlantDetailScreen from '../screens/PlantDetail'; // Corrected path
import DevicesScreen from '../screens/DevicesScreen';       // Placeholder screen
import AlertScreen from '../screens/Alert';         // Corrected import path
import PlantAboutScreen from '../screens/PlantAboutScreen';  // Placeholder screen
// ----------------------------------------------------------

const Tab = createBottomTabNavigator();

const PlantTabNavigator = ({ route }) => {
  // Destructure both plantId and plantName from the navigator's route params
  const { plantId, plantName } = route.params; 
  // Remove unnecessary state and effect if not used directly here
  // const [loggerData, setLoggerData] = useState([]);
  // const [loading, setLoading] = useState(true);

  // Remove useEffect fetching logger data if not needed for navigator itself
  /*
  useEffect(() => {
    const fetchLoggerData = async () => {
      // ... fetch logic ...
    };
    fetchLoggerData();
  }, [plantId]);
  */

  // Add a check in case params are missing
  if (!plantId) {
      console.error("PlantTabNavigator: plantId is missing from route.params!");
      // Optionally return a loading/error state or navigate back
      return null; 
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Devices':
              iconName = 'devices';
              break;
            case 'Alerts':
              iconName = 'notifications';
              break;
            case 'About':
              iconName = 'info';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors?.primary || '#00875A',
        tabBarInactiveTintColor: colors?.textSecondary || 'gray',
        headerShown: false, // <-- Set to false
      })}
    >
      {/* --- Dashboard Tab --- Pass both params */}
      <Tab.Screen 
        name="Dashboard" 
        component={PlantDetailScreen} 
        initialParams={{ plantId: plantId, plantName: plantName }} 
        options={{ title: 'Plant Dashboard' }} 
      />
      
      {/* --- Devices Tab --- Pass both params */}
      <Tab.Screen 
        name="Devices" 
        component={DevicesScreen} 
        initialParams={{ plantId: plantId, plantName: plantName }} // <-- Pass plantName here
        options={{ title: 'Plant Devices' }} 
      />
      
      {/* --- Alerts Tab --- Pass both params */}
      <Tab.Screen 
        name="Alerts" 
        component={AlertScreen} 
        initialParams={{ plantId: plantId, plantName: plantName }} // Pass params
        options={{ title: 'Plant Alerts' }} 
      />
      
      {/* --- About Tab --- Pass both params */}
      <Tab.Screen 
        name="About" 
        component={PlantAboutScreen} 
        initialParams={{ plantId: plantId, plantName: plantName }} // Pass params
        options={{ title: 'About Plant' }} 
      />
    </Tab.Navigator>
  );
};

export default PlantTabNavigator; 