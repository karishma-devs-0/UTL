import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import deviceService from '../services/deviceService';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import dataManager from '../utils/dataManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/style';
import axios from 'axios';

// const Tab = createMaterialTopTabNavigator();

const LoggerTab = ({ plantId, navigation, data, isLoading, error }) => {
  if (isLoading) {
    return <View style={localStyles.centered}><ActivityIndicator size="large" color="#00875A" /></View>;
  }

  if (error) {
    return <View style={localStyles.centered}><Text style={localStyles.errorText}>Error: {error}</Text></View>;
  }

  return (
    <View style={localStyles.tabContainer}>
      {data && data.length > 0 ? (
        data.map((item) => {
          if (!item) {
            console.warn("LoggerTab: Skipping render for null/undefined item.");
            return null;
          }
          const loggerId = item.sno || item.id;

          return (
            <TouchableOpacity
              key={item.id || `logger-${loggerId || Math.random()}`}
              style={localStyles.dataCard}
              onPress={() => {
                const targetSno = item?.sno;
                if (targetSno) {
                  console.log(`[DevicesScreen/LoggerTab] Navigating to LoggerTabs with loggerId: ${targetSno}, plantId: ${plantId}`);
                  navigation.navigate('LoggerTabs', {
                    loggerId: targetSno,
                    plantId: plantId
                  });
                } else {
                  console.warn('[DevicesScreen/LoggerTab] Cannot navigate: item.sno is missing. Item:', item);
                  Alert.alert(
                    'Navigation Error', 
                    'Cannot view logger details, S/N is missing.'
                  );
                }
              }}
            >
              <Text style={[localStyles.dataText, { fontWeight: 'bold', fontSize: 18 }]}>
                Logger S/N: {item.sno ?? 'N/A'}
              </Text>
              <Text style={localStyles.dataText}>Timestamp: {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}</Text>
              <View style={localStyles.navigateIconContainer}>
                <Icon name="navigate-next" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          );
        })
      ) : (
        !isLoading && !error ? <Text style={localStyles.noDataText}>No logger data available for this plant.</Text> : null
      )}
    </View>
  );
};

const InverterTab = ({ plantId, navigation, data, isLoading, error }) => {
  console.log('[DevicesScreen.InverterTab] Rendering with data:', 
              data ? `${data.length} items` : 'no data');
  
  if (isLoading) {
    return <View style={localStyles.centered}><ActivityIndicator size="large" color="#00875A" /></View>;
  }

  if (error) {
    return <View style={localStyles.centered}><Text style={localStyles.errorText}>Error: {error}</Text></View>;
  }

  const formatPower = (value) => {
    if (!value || value === '--') return 'N/A';
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : `${num.toFixed(3)} kW`;
  };

  return (
    <View style={localStyles.tabContainer}> 
      {data && data.length > 0 ? (
        data.map((item, index) => {
          if (!item) {
            console.warn("[DevicesScreen.InverterTab] Skipping render for null/undefined item.");
            return null;
          }
          const itemKey = item.inverterSno || item.id || `inverter-${index}`;
          
          // Log the complete item for debugging
          console.log(`[DevicesScreen.InverterTab] Complete item #${index}:`, JSON.stringify(item));
          
          // Extract fields with safe fallbacks
          const sno = item.sno || '--';
          const power = item.total_ac_power || '--';
          const dailyProduction = item.daily_production || '--';
          const moduleCapacity = item.capacity?.module_capacity || '--';
          const loggerSN = item.mac_address || '--';
          
          return (
            <TouchableOpacity
              key={itemKey}
              style={localStyles.dataCard}
              onPress={() => {
                const idToNavigate = item.inverterSno || item.id || item.sno;
                if (idToNavigate) {
                  console.log(`[DevicesScreen.InverterTab] Navigating to Device Detail with data:`, item);
                  navigation.navigate('InverterTabs', { 
                    deviceData: item // Pass the full inverter object
                  });
                } else {
                  console.warn('[DevicesScreen.InverterTab] Cannot navigate, Inverter ID/SNo is missing for item:', item);
                  Alert.alert('Navigation Error', 'Could not determine the Inverter ID to navigate.');
                }
              }}
            >
              <Text style={[localStyles.dataText, { fontWeight: 'bold', fontSize: 18 }]}>
                Inverter S/N: {sno !== '--' ? sno : 'N/A'} 
              </Text>
              <Text style={localStyles.dataText}>
                Power: {formatPower(power)}
              </Text>
              <Text style={localStyles.dataText}>
                Daily Production: {dailyProduction !== '--' ? 
                  `${parseFloat(dailyProduction).toFixed(2)} kWh` : 'N/A'}
              </Text>
              <Text style={localStyles.dataText}>
                Capacity: {moduleCapacity !== '--' ? 
                  `${moduleCapacity} kWp` : 'N/A'}
              </Text>
              <Text style={localStyles.dataText}>
                Logger S/N: {loggerSN !== '--' ? loggerSN : 'N/A'}
              </Text>
            </TouchableOpacity>
          );
        })
      ) : (
        !isLoading && !error ? <Text style={localStyles.noDataText}>No inverter data available for this plant.</Text> : null
      )}
    </View>
  );
};

const DevicesScreen = ({ route, navigation }) => {
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const { plantId, plantName } = route.params || {};
  const [activeDeviceTab, setActiveDeviceTab] = useState('Loggers');
  const isFocused = useIsFocused();

  // --- Lifted State ---
  const [loggerData, setLoggerData] = useState([]);
  const [inverterData, setInverterData] = useState([]);
  const [loggerLoading, setLoggerLoading] = useState(true);
  const [inverterLoading, setInverterLoading] = useState(true);
  const [loggerError, setLoggerError] = useState(null);
  const [inverterError, setInverterError] = useState(null);

  const deviceTabs = ['Loggers', 'Inverters'];

  // --- Fetching Functions in Parent ---
  const fetchLoggers = useCallback(async () => {
    if (!plantId) return;
    console.log(`DevicesScreen: Fetching LOGGERS for plantId: ${plantId}`);
    setLoggerLoading(true);
    setLoggerError(null);
    try {
      const result = await deviceService.getLoggerData(plantId);
      if (result && result.success && Array.isArray(result.data)) {
        setLoggerData([...result.data]);
      } else {
        setLoggerError(result?.error || 'Failed to fetch logger data or data invalid.');
        setLoggerData([]);
      }
    } catch (err) {
      setLoggerError('An unexpected error occurred fetching loggers.');
      setLoggerData([]);
      console.error("DevicesScreen fetchLoggers Error:", err);
    } finally {
      setLoggerLoading(false);
    }
  }, [plantId]);

  const fetchInverters = useCallback(async () => {
    if (!plantId) return;
    console.log(`DevicesScreen: Fetching INVERTERS for plantId: ${plantId}`);
    setInverterLoading(true);
    setInverterError(null);
    try {
      // Use the new specialized function for getting inverters by plant ID
      const result = await deviceService.getInvertersForPlant(plantId);
      console.log(`DevicesScreen: Received inverter data from API with ${result?.data?.length || 0} items`);
      
      if (result && result.success && Array.isArray(result.data)) {
        // Check if array is empty
        if (result.data.length === 0) {
          console.log('DevicesScreen: API returned empty inverter data array');
          setInverterData([]);
        } else {
          // Process and normalize data fields
          const processedData = result.data.map(inverter => ({
            ...inverter,
            // Ensure these fields exist with proper values for UI display
            sno: inverter.inverter_sno || inverter.sno || inverter.device_sn || inverter.serial_number || '--',
            total_ac_power: inverter.solar_power || inverter.total_ac_power || inverter.ac_power || inverter.power || '--',
            daily_production: inverter.daily_production || inverter.daily_yield || inverter.energy_today || '--',
            capacity: {
              module_capacity: inverter.module_capacity || 
                            (inverter.capacity && typeof inverter.capacity === 'object' ? 
                              inverter.capacity.module_capacity : inverter.capacity) || '--'
            },
            mac_address: inverter.logger_sno || inverter.mac_address || inverter.logger_sn || '--',
          }));
          
          // Log first item for debugging
          if (processedData.length > 0) {
            console.log('DevicesScreen: First processed inverter data:', JSON.stringify(processedData[0], null, 2));
          }
          
          setInverterData(processedData);
        }
      } else {
        console.warn('DevicesScreen: Invalid inverter data structure:', result);
        setInverterError(result?.error || 'Failed to fetch inverter data or invalid structure.');
        setInverterData([]);
      }
    } catch (err) {
      console.error("DevicesScreen fetchInverters Error:", err);
      setInverterError('An unexpected error occurred fetching inverters.');
      setInverterData([]);
    } finally {
      setInverterLoading(false);
    }
  }, [plantId]);

  // --- Effect to Fetch Data on Focus/Refresh/Tab Change ---
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      console.log('DevicesScreen Focused: route.params =', JSON.stringify(route.params));
      console.log(`DevicesScreen Focused: Active Tab = ${activeDeviceTab}`);
      
      const shouldRefresh = !!route.params?.refresh;
      if (shouldRefresh) {
          console.log('Refresh parameter detected, fetching data for active tab...');
          // Clear the refresh flag immediately
          navigation.setParams({ refresh: undefined }); 
      }

      // Fetch data for the current tab on focus or if refresh was requested
      if (isActive && plantId) {
          if (activeDeviceTab === 'Loggers') {
             console.log('Fetching Loggers due to focus/refresh/tab change.');
             fetchLoggers();
          } else if (activeDeviceTab === 'Inverters') {
             console.log('Fetching Inverters due to focus/refresh/tab change.');
             fetchInverters();
          }
      } else if (!plantId) {
          // Handle missing plantId appropriately (set errors for both?)
          console.warn('DevicesScreen Focused: No plantId');
          setLoggerError('Plant ID not provided.');
          setInverterError('Plant ID not provided.');
          setLoggerLoading(false);
          setInverterLoading(false);
      }

      return () => {
        console.log('DevicesScreen Unfocused/Cleanup');
        isActive = false; 
      };
      // Rerun if plantId, activeDeviceTab changes, or refresh param appears
    }, [plantId, activeDeviceTab, route.params?.refresh, fetchLoggers, fetchInverters, navigation]) 
  );

  // --- Add Delete Handler ---
  const handleDeletePlant = async () => {
    setIsMenuModalVisible(false); // Close modal immediately
    if (!plantId) {
      Alert.alert('Error', 'Cannot delete, plant ID is missing.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${plantName || 'this plant'}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            console.log(`DevicesScreen: Attempting to delete plant: ${plantId}`);
            // Call the API service
            const result = await deviceService.deletePlant(plantId);
            
            if (result.success) {
              console.log(`DevicesScreen: Plant ${plantId} deleted successfully via API.`);
              Alert.alert('Success', 'Plant deleted successfully.');
              // Call the correct cache removal function
              await dataManager.removeFromLocalPlantCache(plantId);
              // Navigate back to Monitor screen
              navigation.navigate('Monitor'); // Go back to the main list
            } else {
              console.error(`DevicesScreen: Failed to delete plant ${plantId}:`, result.error);
              Alert.alert('Error', result.error || 'Failed to delete plant. Please try again.');
            }
          }
        }
      ]
    );
  };
  // --- End Delete Handler ---

  const MenuModal = ({ visible, onClose }) => {
    const menuOptions = [
      {
        icon: 'add-circle-outline',
        text: 'Add Datalogger',
        onPress: () => {
          onClose();
          navigation.navigate('AddDatalogger', { 
            plantId: plantId,
          });
        }
      },
      {
        icon: 'people',
        text: 'Authorize Plant',
        onPress: () => {
          onClose();
          // Add authorization navigation/logic
        }
      },
      {
        icon: 'edit',
        text: 'Edit Plant',
        onPress: () => {
          onClose();
          navigation.navigate('AddPlant', { 
            editMode: true,
            plantId: plantId
          });
        }
      },
      {
        icon: 'settings',
        text: 'Plant Settings',
        onPress: () => {
          onClose();
          // Add settings navigation/logic
        }
      },
      {
        icon: 'delete-outline',
        text: 'Delete Plant',
        textColor: '#FF3B30',
        onPress: handleDeletePlant
      }
    ];

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={localStyles.modalCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={localStyles.modalTitle}>Plant Options</Text>
              <View style={{ width: 50 }} />
            </View>

            <ScrollView>
              {menuOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={localStyles.menuOption}
                  onPress={option.onPress}
                >
                  <View style={localStyles.menuOptionContent}>
                    <Icon 
                      name={option.icon} 
                      size={24} 
                      color={option.textColor || '#333'} 
                    />
                    <Text style={[
                      localStyles.menuOptionText,
                      option.textColor && { color: option.textColor }
                    ]}>
                      {option.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (!plantId) {
    return (
      <SafeAreaView style={localStyles.container}>
        <View style={localStyles.centered}>
          <Text>Checking Plant ID...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={localStyles.container}>
      <View style={localStyles.header}>
        <Text style={localStyles.headerTitle}>
          {plantName ? `${plantName} Devices` : `Plant ${plantId} Devices`}
        </Text>
        <View style={localStyles.headerIcons}>
          <TouchableOpacity 
            onPress={() => {
              console.log('Refreshing devices...');
              fetchLoggers();
              fetchInverters();
            }}
            style={localStyles.iconButton}
            disabled={loggerLoading || inverterLoading}
          >
            <Icon name="refresh" size={26} color={loggerLoading || inverterLoading ? '#ccc' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              console.log('Adding new device...');
              navigation.navigate('AddDatalogger', { 
                plantId: plantId,
              });
            }}
            style={localStyles.iconButton}
          >
            <Icon name="add" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Tab Bar Implementation */}
      <View style={localStyles.inlineTabBarContainer}>
        {deviceTabs.map((tabName) => (
          <TouchableOpacity
            key={tabName}
            style={[
              localStyles.inlineTab,
              activeDeviceTab === tabName && localStyles.inlineTabActive,
            ]}
            onPress={() => setActiveDeviceTab(tabName)}
          >
            <Text
              style={[
                localStyles.inlineTabText,
                activeDeviceTab === tabName && localStyles.inlineTabTextActive,
              ]}
            >
              {tabName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conditionally render content based on activeDeviceTab */}
      {activeDeviceTab === 'Loggers' && (
        <ScrollView>
          <LoggerTab 
            plantId={plantId} 
            navigation={navigation} 
            data={loggerData} 
            isLoading={loggerLoading}
            error={loggerError}
          />
        </ScrollView>
      )}
      {/* Add conditional rendering for InverterTab */}
      {activeDeviceTab === 'Inverters' && (
        <ScrollView>
          <InverterTab 
             plantId={plantId} 
             navigation={navigation}
             data={inverterData}
             isLoading={inverterLoading}
             error={inverterError}
           />
        </ScrollView>
      )}

      <MenuModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseText: {
    color: '#00BCD4',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  tabContainer: {
    padding: 16,
  },
  dataCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dataText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  navigateIconContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  // Styles for inline TabBar
  inlineTabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10, // Add some padding
  },
  inlineTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 5, // Add margin between tabs
    borderBottomWidth: 2,
    borderBottomColor: 'transparent', // Default no border
  },
  inlineTabActive: {
    borderBottomColor: '#ff0000', // Active tab indicator color
  },
  inlineTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'grey',
  },
  inlineTabTextActive: {
    color: '#ff0000', // Active tab text color
  },
});

export default DevicesScreen; 