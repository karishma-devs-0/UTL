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

const EditPasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasPasswordInStorage, setHasPasswordInStorage] = useState(false);

  useEffect(() => {
    checkPasswordAvailability();
  }, []);

  const checkPasswordAvailability = async () => {
    try {
      const userData = await getUserData();
      // Check if password exists in storage (for demo purposes)
      setHasPasswordInStorage(userData && userData.password);
    } catch (error) {
      console.error('Error checking password:', error);
    }
  };

  const handleSave = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // API not available yet - show info message
    Alert.alert(
      'Feature Coming Soon',
      'Password update functionality will be available once the API is implemented. Your password remains unchanged.',
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
        <Text style={localStyles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        <View style={localStyles.section}>
          <Text style={localStyles.infoText}>
            Create a strong password to keep your account secure
          </Text>

          {/* Current Password */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Current Password</Text>
            <View style={localStyles.passwordInputWrapper}>
              <TextInput
                style={localStyles.input}
                placeholder="Enter current password"
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={localStyles.eyeIcon}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>New Password</Text>
            <View style={localStyles.passwordInputWrapper}>
              <TextInput
                style={localStyles.input}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={localStyles.eyeIcon}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Confirm New Password</Text>
            <View style={localStyles.passwordInputWrapper}>
              <TextInput
                style={localStyles.input}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={localStyles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={localStyles.requirementsContainer}>
            <Text style={localStyles.requirementsTitle}>Password must contain:</Text>
            <View style={localStyles.requirement}>
              <Ionicons
                name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={newPassword.length >= 6 ? '#ff0000' : '#999'}
              />
              <Text style={localStyles.requirementText}>At least 6 characters</Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={localStyles.saveButton}
            onPress={handleSave}
          >
            <Text style={localStyles.saveButtonText}>Update Password</Text>
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
  passwordInputWrapper: {
    position: 'relative',
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
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
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

export default EditPasswordScreen;
