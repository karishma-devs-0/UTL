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

const EditUsernameScreen = ({ navigation }) => {
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentUsername();
  }, []);

  const loadCurrentUsername = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        const username = userData.username || userData.name || '';
        setCurrentUsername(username);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateUsername = (username) => {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleSave = () => {
    if (!newUsername) {
      Alert.alert('Error', 'Please enter a new username');
      return;
    }

    if (!validateUsername(newUsername)) {
      Alert.alert(
        'Invalid Username',
        'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
      );
      return;
    }

    if (newUsername === currentUsername) {
      Alert.alert('Error', 'New username is the same as current username');
      return;
    }

    // API not available yet - show info message
    Alert.alert(
      'Feature Coming Soon',
      'Username update functionality will be available once the API is implemented. Your username remains unchanged.',
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
        <Text style={localStyles.headerTitle}>Change Username</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        <View style={localStyles.section}>
          <Text style={localStyles.infoText}>
            Choose a unique username that represents you
          </Text>

          {/* Current Username (Read-only) */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Current Username</Text>
            <View style={localStyles.readOnlyContainer}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={localStyles.readOnlyText}>
                {isLoading ? 'Loading...' : currentUsername || 'No username set'}
              </Text>
            </View>
          </View>

          {/* New Username */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>New Username</Text>
            <TextInput
              style={localStyles.input}
              placeholder="Enter new username"
              value={newUsername}
              onChangeText={setNewUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#999"
            />
          </View>

          {/* Username Requirements */}
          <View style={localStyles.requirementsContainer}>
            <Text style={localStyles.requirementsTitle}>Username requirements:</Text>
            <View style={localStyles.requirement}>
              <Ionicons
                name={newUsername.length >= 3 && newUsername.length <= 20 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={newUsername.length >= 3 && newUsername.length <= 20 ? '#ff0000' : '#999'}
              />
              <Text style={localStyles.requirementText}>3-20 characters long</Text>
            </View>
            <View style={localStyles.requirement}>
              <Ionicons
                name={/^[a-zA-Z0-9_]*$/.test(newUsername) && newUsername.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={/^[a-zA-Z0-9_]*$/.test(newUsername) && newUsername.length > 0 ? '#ff0000' : '#999'}
              />
              <Text style={localStyles.requirementText}>Only letters, numbers, and underscores</Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={localStyles.saveButton}
            onPress={handleSave}
          >
            <Text style={localStyles.saveButtonText}>Update Username</Text>
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
  requirementsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#ff0000',
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

export default EditUsernameScreen;
