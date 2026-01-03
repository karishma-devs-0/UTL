import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BackgroundImage from '../componenst/BackgroundImage';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email, token } = route.params;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await apiClient.post('/auth/reset_password', {
        email,
        password
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully. Please login with your new password.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.loginContainer}>
        <BackgroundImage />

        <View style={styles.loginTopContainer}>
          <View style={styles.loginFormContainer}>
            <Text style={styles.loginTitle}>Reset Password</Text>
            <Text style={styles.loginSubtitle}>Enter your new password</Text>

            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={styles.LoginInputWithDoubleIcon}
                placeholder="New Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Icon name="lock" size={20} color="#666" style={styles.inlineInputIcon} />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Icon
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={styles.LoginInputWithDoubleIcon}
                placeholder="Confirm New Password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Icon name="lock" size={20} color="#666" style={styles.inlineInputIcon} />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Icon
                  name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.loginButtonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#ff0000" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.LoginButton} onPress={handleResetPassword}>
                  <Text style={styles.buttonText}>Reset Password</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>Cancel & Return to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
