import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/style';

const BusinessSettingsScreen = ({ navigation }) => {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [taxId, setTaxId] = useState('');

  const handleSave = () => {
    Alert.alert(
      'Success',
      'Business settings have been updated successfully.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={localStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={localStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Business Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        <View style={localStyles.section}>
          <Text style={localStyles.sectionDescription}>
            Manage your business information and settings
          </Text>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.inputLabel}>Business Name</Text>
            <TextInput
              style={localStyles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Enter business name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.inputLabel}>Business Type</Text>
            <TextInput
              style={localStyles.input}
              value={businessType}
              onChangeText={setBusinessType}
              placeholder="e.g., Solar Installation, Energy Consulting"
              placeholderTextColor="#999"
            />
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.inputLabel}>Business Address</Text>
            <TextInput
              style={[localStyles.input, localStyles.textArea]}
              value={businessAddress}
              onChangeText={setBusinessAddress}
              placeholder="Enter business address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={localStyles.inputGroup}>
            <Text style={localStyles.inputLabel}>Tax ID / Registration Number</Text>
            <TextInput
              style={localStyles.input}
              value={taxId}
              onChangeText={setTaxId}
              placeholder="Enter tax ID or registration number"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={localStyles.saveButton} onPress={handleSave}>
            <Text style={localStyles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    height: 80,
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#ff0000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusinessSettingsScreen;