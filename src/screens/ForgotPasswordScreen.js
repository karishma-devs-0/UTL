import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BackgroundImage from '../componenst/BackgroundImage';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await apiClient.post('/auth/forget_otp', { email });
      
      if (response.data.success) {
        Alert.alert('Success', 'Verification code sent to your email');
        navigation.navigate('VerifyOTP', { email });
      } else {
        Alert.alert('Error', response.data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send verification code');
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
            <Text style={styles.loginTitle}>Forgot Password</Text>
            <Text style={styles.loginSubtitle}>Enter your email to receive a verification code</Text>

            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={styles.LoginInputWithInlineIcon}
                placeholder="Enter your Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <Icon name="email" size={20} color="#666" style={styles.inlineInputIcon} />
            </View>

            <View style={styles.loginButtonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#ff0000" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.LoginButton} onPress={handleSendOTP}>
                  <Text style={styles.buttonText}>Send Code</Text>
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

export default ForgotPasswordScreen;
