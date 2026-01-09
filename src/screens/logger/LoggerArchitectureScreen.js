import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LoggerAppBar from './LoggerAppBar';

// Placeholder for colors - import from your actual style constants if available
const COLORS = {
    primary: '#00875A', // Example primary color (adjust as needed)
    secondary: '#6c757d',
    lightGray: '#F5F8FA',
    textPrimary: '#333',
    textSecondary: '#555',
    iconGreen: '#4CAF50', // Green icon color from screenshot
    borderLight: '#eee',
};

const LoggerArchitectureScreen = ({ route, navigation, loggerData, plantId: plantIdProp, showMenu, onMenuPress }) => {
  const routeParams = route?.params || {};
  const loggerDataToUse = loggerData || routeParams.loggerData || {};
  const loggerId = loggerDataToUse?.sno || routeParams.loggerId || '';
  const loggerSno = loggerDataToUse?.sno || loggerDataToUse?.loggerSno || loggerDataToUse?.logger_sno || routeParams?.loggerId;
  const plantId =
    plantIdProp ||
    loggerDataToUse?.plantId ||
    loggerDataToUse?.plant_id ||
    routeParams?.plantId ||
    routeParams?.plant_id;
  
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed

  // --- Mock/Placeholder Inverter Data ---
  // Replace this with actual data logic if available in loggerData
  // e.g., const inverters = loggerData?.connectedInverters || [];
  const inverters = [
      { sno: '2304224968', status: 'online' } // Based on screenshot
  ];
  // --- End Mock Data ---

  const toggleExpand = () => {
      setIsExpanded(!isExpanded);
  };

  // Helper to get network icon based on status (simplified)
  const getNetworkIcon = (status) => {
     // For now, always return the green wifi icon from screenshot
     // In a real scenario, logic based on status ('online', 'offline', etc.) would go here
     return <Icon name="wifi" size={18} color={COLORS.iconGreen} style={localStyles.networkIcon} />;
  };

  return (
    <>
      <LoggerAppBar 
        title={`Logger ${loggerId}`}
        showMenu={showMenu}
        menuIconName="more-vert"
        onMenuPress={onMenuPress}
      />
      <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScrollView style={localStyles.container} contentContainerStyle={localStyles.contentContainer}>
            <Text style={localStyles.infoText}>
                The actual network topology reflected when the device is uploading data.
            </Text>

            <View style={localStyles.itemContainer}>
                {/* Logger Row */}
                <View style={localStyles.row}>
                    <TouchableOpacity
                        onPress={toggleExpand}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={localStyles.expandIconButton}
                    >
                        <Icon 
                            name={isExpanded ? "remove-circle-outline" : "add-circle-outline"} 
                            size={22} 
                            color={COLORS.primary} 
                            style={localStyles.expandIcon} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={localStyles.loggerRowContent}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Parameters', { returnTo: 'Architecture' })}
                    >
                        <Text style={localStyles.itemText}>
                            Logger: {loggerDataToUse?.sno ?? 'N/A'}
                        </Text>
                        {getNetworkIcon('online')}
                        {/* Assuming logger is online */}
                    </TouchableOpacity>
                </View>

                {/* Inverter Row(s) - Conditionally Rendered */}
                {isExpanded && inverters.map((inverter, index) => (
                    <TouchableOpacity
                        key={inverter.sno || index}
                        style={[localStyles.row, localStyles.indentedRow]}
                        activeOpacity={0.7}
                        onPress={() => {
                          const inverterSno = inverter?.sno;

                          if (!inverterSno) {
                            Alert.alert('Navigation Error', 'Cannot open inverter, inverter S/N is missing.');
                            return;
                          }
                          if (!loggerSno) {
                            Alert.alert('Navigation Error', 'Cannot open inverter, logger S/N is missing.');
                            return;
                          }
                          if (!plantId) {
                            Alert.alert('Navigation Error', 'Cannot open inverter, Plant ID is missing.');
                            return;
                          }

                          const deviceData = {
                            ...loggerDataToUse,
                            inverterSno,
                            inverter_sno: inverterSno,
                            loggerSno,
                            logger_sno: loggerSno,
                            plantId,
                            plant_id: plantId,
                          };

                          let rootNav = navigation;
                          while (rootNav?.getParent?.()) {
                            rootNav = rootNav.getParent();
                          }
                          if (!rootNav?.navigate) {
                            Alert.alert('Navigation Error', 'Cannot navigate to inverter page.');
                            return;
                          }
                          rootNav.navigate('InverterTabs', { deviceData });
                        }}
                    >
                        {/* Indentation Placeholder/Spacer */}
                        <View style={{ width: 22, marginRight: 10 }} /> 
                        
                        <Text style={localStyles.itemText}>
                            Inverter: {inverter.sno ?? 'N/A'}
                        </Text>
                        {getNetworkIcon(inverter.status)}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const localStyles = StyleSheet.create({
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
    color: COLORS.textSecondary || '#555',
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
  loggerRowContent: {
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
    color: COLORS.textPrimary || '#333',
    flex: 1,
  },
  networkIcon: {
    marginLeft: 10,
  },
});

export default LoggerArchitectureScreen; 
