import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import InverterAppBar from './InverterAppBar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder for colors
const COLORS = {
    primary: '#00875A',
    secondary: '#6c757d',
    lightGray: '#F5F8FA',
    textPrimary: '#000000',
    textSecondary: '#000000',
    iconGreen: '#4CAF50',
    borderLight: '#eee',
    white: '#fff'
};

const InverterArchitectureScreen = ({ route }) => {
  const { device } = route.params || {};
  const inverterId = device?.inverterSno || device?.inverter_sno || device?.sno || device?.id || '';

  return (
    <SafeAreaView style={styles.mainContainer} edges={['top', 'bottom']}>
      <InverterAppBar title={`Inverter ${inverterId}`} />
      <ScrollView>
        <Text>Architecture Screen</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  }
});

export default InverterArchitectureScreen; 