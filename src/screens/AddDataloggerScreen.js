import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import dataManager from '../utils/dataManager.js';

const AddDataloggerScreen = ({ navigation, route }) => {
  const { plantId } = route.params || {};
  const [serialNumber, setSerialNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validate plantId
  if (!plantId) {
    Alert.alert('Error', 'Plant ID is required.');
    navigation.goBack();
    return null;
  }

  // Submit to API
  const handleSave = async () => {
    if (!serialNumber.trim()) {
      Alert.alert('Error', 'Serial number (S/N) is required.');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await dataManager.registerDevice(serialNumber.trim(), plantId);
      
      if (result.success) {
        Alert.alert('Success', 'Datalogger registered successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to register datalogger.');
      }
    } catch (error) {
      console.error('Error registering datalogger:', error);
      Alert.alert('Error', 'An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Datalogger</Text>
        <View style={{ width: 50 }} />{/* Spacer */}
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Serial Number (S/N)*</Text>
        <TextInput
          style={styles.input}
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="Enter serial number"
          placeholderTextColor="#999"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Register Datalogger</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// Simplified styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#00875A',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddDataloggerScreen; 