import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserData } from '../utils/storage/storage';

const EditEmailScreen = ({ navigation }) => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentEmail();
  }, []);

  const loadCurrentEmail = async () => {
    try {
      const userData = await getUserData();
      if (userData && userData.email) {
        setCurrentEmail(userData.email);
      }
    } catch (error) {
      console.error('Error loading email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    if (!newEmail) {
      Alert.alert('Error', 'Please enter a new email address');
      return;
    }

    if (!validateEmail(newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (newEmail === currentEmail) {
      Alert.alert('Error', 'New email is the same as current email');
      return;
    }

    // API not available yet - show info message
    Alert.alert(
      'Feature Coming Soon',
      'Email update functionality will be available once the API is implemented. Your email remains unchanged.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        <Text style={localStyles.headerTitle}>Change Email</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        <View style={localStyles.section}>
          <Text style={localStyles.infoText}>
            Update your email address. You may need to verify the new email.
          </Text>

          {/* Current Email (Read-only) */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Current Email</Text>
            <View style={localStyles.readOnlyContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={localStyles.readOnlyText}>
                {isLoading ? 'Loading...' : currentEmail || 'No email set'}
              </Text>
            </View>
          </View>

          {/* New Email */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>New Email</Text>
            <TextInput
              style={localStyles.input}
              placeholder="Enter new email address"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
          </View>

          {/* Info Box */}
          <View style={localStyles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#00875A" />
            <Text style={localStyles.infoBoxText}>
              After changing your email, you may need to verify it before you can use it to log in.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={localStyles.saveButton}
            onPress={handleSave}
          >
            <Text style={localStyles.saveButtonText}>Update Email</Text>
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
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#00875A',
    marginLeft: 12,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#00875A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditEmailScreen;
