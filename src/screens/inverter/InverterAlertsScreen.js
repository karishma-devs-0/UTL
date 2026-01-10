import React, { useState, /* useEffect, useCallback */ } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform
  // FlatList,
  // ActivityIndicator,
  // Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InverterAppBar from './InverterAppBar';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';

const COLORS = {
    primary: '#00875A',
    secondary: '#6c757d',
    lightGray: '#f8f9fa',
    // gray: '#adb5bd', // No longer used
    white: '#fff',
    // warning: '#ffc107' // No longer used
};

const InverterAlertsScreen = ({ route, navigation }) => {
  const { deviceData } = route.params || {};
  const [selectedTab, setSelectedTab] = useState('Open');
  
  // Get identifier for the title
  const inverterId = deviceData?.inverter_sno || deviceData?.sno || deviceData?.id || '';

  return (
    <SafeAreaViewRN style={localStyles.mainContainer} edges={['top', 'bottom']}>
      <InverterAppBar title={`Inverter ${inverterId}`} />
      <SafeAreaView style={localStyles.safeArea} edges={['bottom']}>
        <View style={localStyles.container}>
          {/* Tab Bar */} 
          <View style={localStyles.tabBar}>
            {[ 'All', 'Open', 'Closed'].map((tabName) => (
              <TouchableOpacity 
                key={tabName}
                style={[
                  localStyles.tabItem,
                  selectedTab === tabName && localStyles.tabItemActive
                ]} 
                onPress={() => setSelectedTab(tabName)}
              >
                <Text 
                  style={[
                    localStyles.tabText,
                    selectedTab === tabName && localStyles.tabTextActive
                  ]}>
                  {tabName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaViewRN>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white || '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20, 
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '1A', 
  },
  tabText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary || '#00875A',
    fontWeight: '700',
  },
});

export default InverterAlertsScreen; 