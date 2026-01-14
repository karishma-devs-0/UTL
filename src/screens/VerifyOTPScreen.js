import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BackgroundImage from '../componenst/BackgroundImage';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';

const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    try {
      // Replace with your actual API endpoint
      const response = await apiClient.post('/auth/validate_otp', { 
        email, 
        otp: otpCode 
      });

      console.log('OTP Verification Response:', response);
      
      if (response.data.success) {
        navigation.navigate('ResetPassword', { email, token: response.data.token });
      } else {
        Alert.alert('Error', response.data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/forget_otp', { email });
      if (response.data.success) {
        Alert.alert('Success', 'New verification code sent to your email');
        setOtp(['', '', '', '', '', '']);
      }else {
        Alert.alert('Error', response.data.message || 'Failed to resend verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code');
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
            <Text style={styles.loginTitle}>Verify Code</Text>
            <Text style={styles.loginSubtitle}>Enter the 6-digit code sent to {email}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 }}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={{
                    width: 45,
                    height: 50,
                    borderWidth: 1,
                    borderColor: digit ? '#ff0000' : '#ccc',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 'bold',
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <View style={styles.loginButtonContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#ff0000" style={{ marginVertical: 20 }} />
              ) : (
                <TouchableOpacity style={styles.LoginButton} onPress={handleVerifyOTP}>
                  <Text style={styles.buttonText}>Verify Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.linkContainer}>
              <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                <Text style={styles.linkText}>Resend Code</Text>
              </TouchableOpacity>
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

export default VerifyOTPScreen;
