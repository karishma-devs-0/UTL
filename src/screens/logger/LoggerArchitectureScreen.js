import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

const LoggerArchitectureScreen = ({ route, navigation, loggerData, showMenu, onMenuPress }) => {
  const routeParams = route?.params || {};
  const loggerDataToUse = loggerData || routeParams.loggerData || {};
  const loggerId = loggerDataToUse?.sno || routeParams.loggerId || '';
  
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
        onMenuPress={onMenuPress}
      />
      <SafeAreaView style={localStyles.safeArea} edges={['bottom']}>
        <ScrollView style={localStyles.container} contentContainerStyle={localStyles.contentContainer}>
            <Text style={localStyles.infoText}>
                The actual network topology reflected when the device is uploading data.
            </Text>

            <View style={localStyles.itemContainer}>
                {/* Logger Row */}
                <TouchableOpacity style={localStyles.row} onPress={toggleExpand} activeOpacity={0.7}>
                    <Icon 
                        name={isExpanded ? "remove-circle-outline" : "add-circle-outline"} 
                        size={22} 
                        color={COLORS.primary} 
                        style={localStyles.expandIcon} 
                    />
                    <Text style={localStyles.itemText}>
                        Logger: {loggerDataToUse?.sno ?? 'N/A'}
                    </Text>
                    {getNetworkIcon('online')}
                    {/* Assuming logger is online */}
                </TouchableOpacity>

                {/* Inverter Row(s) - Conditionally Rendered */}
                {isExpanded && inverters.map((inverter, index) => (
                    <View key={inverter.sno || index} style={[localStyles.row, localStyles.indentedRow]}>
                        {/* Indentation Placeholder/Spacer */}
                        <View style={{ width: 22, marginRight: 10 }} /> 
                        
                        <Text style={localStyles.itemText}>
                            Inverter: {inverter.sno ?? 'N/A'}
                        </Text>
                        {getNetworkIcon(inverter.status)}
                    </View>
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