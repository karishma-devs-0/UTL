import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/style';
import dataManager from '../utils/dataManager.js';

const AddDevicePage = ({ navigation, route }) => {
  const editMode = route.params?.editMode;
  const deviceType = route.params?.deviceType || 'Inverter';
  const existingDevice = route.params?.deviceData;

  // Basic Info
  const [name, setName] = useState(editMode ? existingDevice.name : '');
  const [model, setModel] = useState(editMode ? existingDevice.model : '');
  const [serialNumber, setSerialNumber] = useState(editMode ? existingDevice.sn : '');
  const [type, setType] = useState(editMode ? existingDevice.type : getDefaultTypeForDevice(deviceType));
  const [manufacturer, setManufacturer] = useState(editMode ? existingDevice.manufacturer : '');
  const [communicationType, setCommunicationType] = useState(editMode ? existingDevice.communicationType : 'Wi-Fi');
  
  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  // Removed state for auth token
  // const [authToken, setAuthToken] = useState(null);
  const [plantId, setPlantId] = useState(null); // Keep plantId

  // Function to get default type based on device type
  function getDefaultTypeForDevice(deviceType) {
    switch(deviceType) {
      case 'Inverter':
        return 'String';
      case 'Meter':
        return 'Smart';
      case 'Logger':
        return 'SmartLogger';
      default:
        return '';
    }
  }

  // Device type options
  const deviceTypeOptions = {
    'Inverter': ['String', 'Micro', 'Hybrid', 'Central', 'Off-grid'],
    'Meter': ['Smart', 'Standard', 'Net', 'Consumption'],
    'Logger': ['SmartLogger', 'WebBox', 'StickLogger', 'WiFi Kit']
  };

  const communicationOptions = ['Wi-Fi', 'Bluetooth', 'RS485', 'Ethernet', 'Zigbee', 'GSM'];

  useEffect(() => {
    const loadPlantId = async () => {
      const id = route.params?.plantId;
      if (!id) {
          console.error('AddDeviceScreen: Plant ID is missing!');
          Alert.alert('Error', 'Plant ID is required to add a device.');
          navigation.goBack(); // Go back if no plantId
      }
      setPlantId(id);
      console.log('AddDeviceScreen: Received plantId:', id);
    };
    loadPlantId();
  }, [route.params?.plantId, navigation]);

  // Form validation
  const validateForm = () => {
    // Keep name validation if needed
    // if (!name.trim()) { ... }
    // Keep model validation if needed
    // if (!model.trim()) { ... }

    // **Crucially, validate serialNumber (sno)**
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Please enter a serial number (S/N)');
      return false;
    }
    return true;
  };

  // Handle save using dataManager.registerDevice
  const handleSave = async () => {
    if (!validateForm() || !plantId) return;
    
    setIsLoading(true);
    
    const sno = serialNumber.trim();

    try {
      console.log(`DataManager: Calling registerDevice with sno: ${sno}, plantId: ${plantId}`);
      // Call the refactored dataManager function
      const result = await dataManager.registerDevice(sno, plantId);

      if (result.success) {
        console.log('Device registered via dataManager:', result.data);
        Alert.alert(
          'Success',
          'Device registered successfully',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Navigate back to Monitor/Devices, potentially triggering a refresh
              navigation.navigate('Monitor', { refresh: true, activeTab: 'Devices' });
            }
          }]
        );
      } else {
          // Handle specific errors if needed, e.g., device already exists?
          Alert.alert('Error', result.error || 'Failed to register device.');
      }

    } catch (error) {
      console.error('Error registering device (handleSave catch):', error);
      Alert.alert('Error', 'An unexpected error occurred while registering the device.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
          <Text style={localStyles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>
          {editMode ? `Edit ${deviceType}` : `Add ${deviceType}`}
        </Text>
        <View style={{width: 50}} />
      </View>

      <ScrollView style={localStyles.scrollContent}>
        <Text style={localStyles.sectionHeader}>Register Device (Logger)</Text>

        <Text style={localStyles.label}>Device Name (Optional)</Text>
        <TextInput
          style={localStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter a name for reference"
          placeholderTextColor="#999"
        />
        
        <Text style={localStyles.label}>Model (Optional)</Text>
         <TextInput
          style={localStyles.input}
          value={model}
          onChangeText={setModel}
          placeholder="Enter model number"
          placeholderTextColor="#999"
        />

        <Text style={localStyles.label}>Serial Number (S/N)*</Text>
        <TextInput
          style={localStyles.input}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="Enter device S/N provided by manufacturer"
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={[localStyles.saveButton, isLoading && localStyles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading || !plantId}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={localStyles.saveButtonText}>
              Register Device
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#00875A',
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioButtonSelected: {
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 8,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#00875A',
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#00875A',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#00875A',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default AddDevicePage; 