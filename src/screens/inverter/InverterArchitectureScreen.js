import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InverterAppBar from './InverterAppBar';
import apiClient from '../../utils/api-native';

// Placeholder for colors
const COLORS = {
    primary: '#00875A',
    secondary: '#6c757d',
    lightGray: '#F5F8FA',
    textPrimary: '#333',
    textSecondary: '#555',
    iconGreen: '#4CAF50',
    borderLight: '#eee',
    white: '#fff'
};

const InverterArchitectureScreen = ({ route, navigation }) => {
  const { device } = route.params || {};
  const inverterId = device?.inverterSno || device?.inverter_sno || device?.sno || device?.id || '';
  const plantId = device?.plantId || '';
  
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch loggers for this plant
  useEffect(() => {
    const fetchLoggers = async () => {
      if (!plantId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get('/route', { 
          params: { plantId },
          timeout: 30000 
        });
        
        // Transform logger data to match expected format
        const loggers = response.data?.map(logger => ({
          sno: logger.sno || logger.mac_address,
          status: logger.status || 'online' // Default to online if not specified
        })) || [];
        
        setConnectedDevices(loggers);
      } catch (error) {
        console.error('Failed to fetch loggers:', error);
        setConnectedDevices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoggers();
  }, [plantId]);

  const toggleExpand = () => {
      setIsExpanded(!isExpanded);
  };

  // Helper to get network icon based on status (simplified)
  const getNetworkIcon = (status) => {
     // For now, always return green wifi icon from screenshot
     // In a real scenario, logic based on status ('online', 'offline', etc.) would go here
     return <Icon name="wifi" size={18} color={COLORS.iconGreen} style={styles.networkIcon} />;
  };

  return (
    <>
      <InverterAppBar 
        title={`Inverter ${inverterId}`}
        showMenu={false}
      />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.infoText}>
                The actual network topology reflected when the device is uploading data.
            </Text>

            {isLoading ? (
                <View style={styles.centeredMessage}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.messageText}>Loading loggers...</Text>
                </View>
            ) : (
                <View style={styles.itemContainer}>
                    {/* Inverter Row */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            onPress={toggleExpand}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.expandIconButton}
                        >
                            <Icon
                                name={isExpanded ? "remove-circle-outline" : "add-circle-outline"}
                                size={22}
                                color={COLORS.primary}
                                style={styles.expandIcon}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.inverterRowContent}
                            activeOpacity={0.7}
                            onPress={() => navigation.navigate('Parameters', { device, returnTo: 'Architecture' })}
                        >
                            <Text style={styles.itemText}>
                                Inverter: {inverterId ?? 'N/A'}
                            </Text>
                            {getNetworkIcon('online')}
                            {/* Assuming inverter is online */}
                        </TouchableOpacity>
                    </View>

                    {/* Connected Device Row(s) - Conditionally Rendered */}
                    {isExpanded && connectedDevices.length > 0 && connectedDevices.map((loggerDevice, index) => (
                        <TouchableOpacity
                            key={loggerDevice.sno || index}
                            style={[styles.row, styles.indentedRow]}
                            activeOpacity={0.7}
                            onPress={() => {
                                const loggerId = loggerDevice?.sno;
                                if (!loggerId) {
                                    Alert.alert('Navigation Error', 'Cannot view logger details, S/N is missing.');
                                    return;
                                }
                                if (!plantId) {
                                    Alert.alert('Navigation Error', 'Cannot view logger details, Plant ID is missing.');
                                    return;
                                }
                                navigation.navigate('LoggerTabs', { loggerId, plantId });
                            }}
                        >
                            {/* Indentation Placeholder/Spacer */}
                            <View style={{ width: 22, marginRight: 10 }} /> 
                            
                            <Text style={styles.itemText}>
                                Logger: {loggerDevice.sno ?? 'N/A'}
                            </Text>
                            {getNetworkIcon(loggerDevice.status)}
                        </TouchableOpacity>
                    ))}
                    
                    {isExpanded && connectedDevices.length === 0 && (
                        <View style={[styles.row, styles.indentedRow]}>
                            <View style={{ width: 22, marginRight: 10 }} /> 
                            <Text style={[styles.itemText, { color: COLORS.textSecondary }]}>
                                No loggers found for this plant
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray || '#F5F8FA',
  },
  contentContainer: {
      padding: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  itemContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingHorizontal: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  expandIconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inverterRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  indentedRow: {
    marginLeft: 15,
    paddingLeft: 0,
    borderBottomWidth: 0,
  },
  expandIcon: {
    marginRight: 10,
  },
  itemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  networkIcon: {
    marginLeft: 10,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  messageText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  }
});

export default InverterArchitectureScreen;
