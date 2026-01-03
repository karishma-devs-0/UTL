import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Alert, Platform, ScrollView, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import deviceService from '../services/deviceService';
// Import Logger Tab Screens
import LoggerParametersScreen from '../screens/logger/LoggerParametersScreen';
import LoggerAlertsScreen from '../screens/logger/LoggerAlertsScreen';
import LoggerArchitectureScreen from '../screens/logger/LoggerArchitectureScreen';

// Placeholder for colors - import from your actual style constants
const COLORS = {
  primary: '#ff0000',
  secondary: '#00875A',
  white: '#fff',
  errorText: '#dc3545', // For error messages
  textPrimary: '#333', // For modal text
  borderLight: '#eee', // For modal separators
  deleteRed: '#FF3B30', // For delete button text
  headerBackground: '#fff', // Assuming header is light, replace with actual colors.background if different
};

// --- Reusable Logger Menu Modal (adapted from loggerDetailScreen.js) ---
const LoggerActionMenuModal = ({ visible, onClose, loggerSno, onDeleteConfirm, isDeleting }) => {
  const menuOptions = [
    // { icon: 'system-update-alt', text: 'Firmware Upgrade', onPress: () => { onClose(); Alert.alert("Info", "Firmware Upgrade not implemented."); } },
    // { icon: 'settings-remote', text: 'Remote Control', onPress: () => { onClose(); Alert.alert("Info", "Remote Control not implemented."); } },
    {
      icon: 'delete-outline',
      text: isDeleting ? 'Deleting...' : 'Delete Logger',
      textColor: COLORS.deleteRed,
      onPress: () => {
        // Do not close modal immediately, let onDeleteConfirm handle it or show confirmation
        if (!isDeleting) onDeleteConfirm();
      },
      disabled: isDeleting,
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={modalStyles.modalOverlay}
        activeOpacity={1}
        onPressOut={onClose} // Close if pressed outside content
      >
        <View style={modalStyles.modalContentContainer} onStartShouldSetResponder={() => true}>
          <View style={modalStyles.modalHeader}>
            <Text style={modalStyles.modalTitle}>Logger Options</Text>
            {/* Optional: Add a close button if header title is too long or for iOS swipe down alternative */}
            {/* <TouchableOpacity onPress={onClose}><Icon name="close" size={24} color={COLORS.textPrimary} /></TouchableOpacity> */}
          </View>
          <ScrollView>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  modalStyles.menuOption,
                  index === menuOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={option.onPress}
                disabled={option.disabled}
              >
                <Icon
                  name={option.icon}
                  size={24}
                  color={option.disabled ? COLORS.secondary : (option.textColor || COLORS.textPrimary)}
                />
                <Text style={[
                  modalStyles.menuOptionText,
                  option.textColor && { color: option.disabled ? COLORS.secondary : option.textColor }
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
// --- End Logger Menu Modal ---

const Tab = createBottomTabNavigator();

const LoggerTabNavigator = ({ route, navigation }) => {
  const { loggerId, plantId } = route.params || {};

  const [internalLoggerData, setInternalLoggerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [isDeletingLogger, setIsDeletingLogger] = useState(false);

  // No need to manipulate header options anymore
  useLayoutEffect(() => {
    // Configure the navigator to hide the header since we're using our custom AppBar
    navigation.setOptions({
      headerShown: false
    });
  }, [navigation]);

  // useEffect for fetching the logger details (keep this)
  useEffect(() => {
    const fetchLoggerDetails = async () => {
      if (!loggerId) {
        setError('Logger S/N not provided for Tab Navigator.');
        setIsLoading(false); return;
      }
      if (!plantId) {
        setError('Plant ID not provided for Tab Navigator.');
        setIsLoading(false); return;
      }
      setIsLoading(true); setError(null);
      try {
        console.log(`[LoggerTabNavigator] Calling getLoggerDetailsBySno with S/N: ${loggerId}, Plant ID: ${plantId}`);
        const result = await deviceService.getLoggerDetailsBySno(loggerId, plantId);
        console.log(`[LoggerTabNavigator] Result from getLoggerDetailsBySno:`, JSON.stringify(result, null, 2));
        if (result.success && result.data) {
          setInternalLoggerData(result.data);
        } else {
          setError(result.error || 'Failed to load logger details in Tab Navigator.');
        }
      } catch (e) {
        console.error(`[LoggerTabNavigator] Error in fetchLoggerDetails:`, e);
        setError(e.message || 'An unexpected error occurred.');
      }
      setIsLoading(false);
    };
    fetchLoggerDetails();
  }, [loggerId, plantId]);

  const handleDeleteLoggerConfirm = () => {
    if (!internalLoggerData || !internalLoggerData.sno) {
      Alert.alert('Error', 'Cannot delete logger, S/N missing.');
      return;
    }
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete logger S/N: ${internalLoggerData.sno}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsMenuModalVisible(false) }, // Close modal on cancel
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsMenuModalVisible(false); // Close modal before starting delete
            setIsDeletingLogger(true);
            const deleteId = internalLoggerData.sno;
            const result = await deviceService.deleteLogger(deleteId);
            if (result.success) {
              Alert.alert('Success', 'Logger deleted successfully.', [
                {
                  text: 'OK', onPress: () => {
                    // Try to refresh the previous screen (e.g., DevicesScreen)
                    // This is a common pattern but might need adjustment based on your exact navigation stack
                    navigation.getParent()?.getParent()?.setParams({ refreshDeviceList: true });
                    navigation.goBack();
                  }
                }
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to delete logger.');
            }
            setIsDeletingLogger(false);
          }
        }
      ],
      { cancelable: true, onDismiss: () => setIsMenuModalVisible(false) } // Ensure modal closes if alert is dismissed
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centeredMessageContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Logger Data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Icon name="error-outline" size={48} color={COLORS.errorText} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!internalLoggerData) {
    return (
      <View style={styles.centeredMessageContainer}>
        <Icon name="info-outline" size={48} color={COLORS.secondary} />
        <Text style={styles.infoText}>No data available for this logger.</Text>
      </View>
    );
  }

  // Use the fetched internalLoggerData's S/N or ID for alerts if needed, or the original loggerId
  const derivedLoggerIdForAlerts = internalLoggerData?.sno || loggerId;

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Parameters') {
              iconName = 'article';
            } else if (route.name === 'Alerts') {
              iconName = focused ? 'warning' : 'warning-amber';
            } else if (route.name === 'Architecture') {
              iconName = 'bubble-chart';
            } else {
              iconName = 'help-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.secondary,
          tabBarStyle: {
            backgroundColor: COLORS.white,
          },
          headerShown: false, // Explicitly hide headers for all tab screens
        })}
      >
        <Tab.Screen
          name="Parameters"
          options={{
            title: 'Parameters',
            headerShown: false
          }}
        >
          {(props) => (
            <LoggerParametersScreen
              {...props}
              loggerData={internalLoggerData}
              loggerId={derivedLoggerIdForAlerts}
              plantId={plantId}
              showMenu={true}
              onMenuPress={() => setIsMenuModalVisible(true)}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Alerts"
          options={{
            title: 'Alerts',
            headerShown: false
          }}
        >
          {(props) => (
            <LoggerAlertsScreen
              {...props}
              loggerId={derivedLoggerIdForAlerts}
              showMenu={true}
              onMenuPress={() => setIsMenuModalVisible(true)}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Architecture"
          options={{
            title: 'Architecture',
            headerShown: false
          }}
        >
          {(props) => (
            <LoggerArchitectureScreen
              {...props}
              loggerData={internalLoggerData}
              showMenu={true}
              onMenuPress={() => setIsMenuModalVisible(true)}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <LoggerActionMenuModal
        visible={isMenuModalVisible}
        onClose={() => setIsMenuModalVisible(false)}
        loggerSno={internalLoggerData?.sno}
        onDeleteConfirm={handleDeleteLoggerConfirm}
        isDeleting={isDeletingLogger}
      />
    </>
  );
};

// Styles for loading/error messages
const styles = StyleSheet.create({
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white || '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.secondary,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.errorText,
    textAlign: 'center',
  },
  infoText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
});

// Styles for LoggerActionMenuModal
const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Safe area for home bar
    maxHeight: '50%', // Limit height
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center', // Center title
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});

export default LoggerTabNavigator; 