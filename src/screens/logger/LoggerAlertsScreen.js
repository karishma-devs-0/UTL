import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoggerAppBar from './LoggerAppBar';

const COLORS = {
    primary: '#00875A',
    secondary: '#6c757d',
    lightGray: '#f8f9fa',
    white: '#fff',
};

const LoggerAlertsScreen = ({ route, navigation, loggerId, showMenu, onMenuPress }) => {
  const [selectedTab, setSelectedTab] = useState('Open');
  const routeParams = route?.params || {};
  const loggerIdToShow = loggerId || routeParams.loggerId || '';

  return (
    <>
      <LoggerAppBar 
        title={`Logger ${loggerIdToShow}`}
        showMenu={showMenu}
        menuIconName="settings"
        onMenuPress={onMenuPress}
      />
      <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={localStyles.container}>
          {/* Tab Bar */}
          <View style={localStyles.tabBar}>
            {['All', 'Open', 'Closed'].map((tabName) => (
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
    backgroundColor: COLORS.lightGray,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabItem: {
    paddingVertical: 0,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '1A',
  },
  tabText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default LoggerAlertsScreen; 
