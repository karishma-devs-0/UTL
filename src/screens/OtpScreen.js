import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';

// Define OTP service functions using apiClient
const otpService = {
  requestOtp: (data) => apiClient.post('/auth/request_otp', data),
  verifyOtp: (data) => apiClient.post('/auth/validate_otp', data),
};

const OtpScreen = ({ navigation, route }) => {
  const { phone, email, fromRegistration } = route.params || {}; // Get params from previous screen
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-request OTP when screen loads
  useEffect(() => {
    const requestOtpOnLoad = async () => {
      if (!email) {
        Alert.alert('Error', 'Email address not provided');
        return;
      }

      console.log('Auto-requesting OTP for email:', email);
      
      try {
        const response = await otpService.requestOtp({ email });
        console.log('Auto OTP Request Response:', response.data);
        
        if (response.data.success) {
          console.log(`OTP sent successfully to ${email}`);
        } else {
          Alert.alert('Error', response.data.message || 'Failed to send OTP');
        }
      } catch (error) {
        console.error('Auto OTP Request Error:', error);
        Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP automatically');
      }
    };

    requestOtpOnLoad();
  }, [email]);

  const handleGoBack = () => {
    console.log('OTP screen: Go back button pressed');
    
    try {
      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else if (fromRegistration) {
        navigation.navigate('Register');
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Error going back:', error);
      navigation.navigate('Login');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email address not provided');
      return;
    }

    setIsLoading(true);
    try {
      // Use the local otpService with email instead of phone
      const response = await otpService.verifyOtp({ email, otp });
      // Handle axios response
      if (response.data.success) {
        Alert.alert(
          'Success', 
          'Email verified successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (fromRegistration) {
                  // After registration email verification, go to login
                  navigation.navigate('Login');
                } else {
                  // Handle other email verification flows
                  if (response.data.token) {
                    // Handle login flow with token
                    navigation.navigate('MainApp'); // or wherever authenticated users go
                  } else {
                    navigation.navigate('Login');
                  }
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // handleSendOtp is likely not needed here as OTP should be requested on the previous screen (e.g., login)
  // If needed, it should use otpService.requestOtp
  /*
  const handleSendOtp = async () => {
    if (!phone) { ... }
    setIsLoading(true);
    try {
      const response = await otpService.requestOtp({ phone });
      if (response.data.success) { ... } 
      else { ... }
    } catch (error) { ... } 
    finally { setIsLoading(false); }
  };
  */

  return (
    <SafeAreaView style={styles.reg_safeArea}>
      <View style={styles.reg_header}>
        <TouchableOpacity 
          onPress={handleGoBack}
          style={styles.backButton}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Icon name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.reg_headerText}>Verify Email</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.otpContainer}>
        <View style={styles.otpContent}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          <Text style={styles.otpDescription}>
            We've sent a 6-digit verification code to your email{'\n'}
            <Text style={styles.otpEmailAddress}>{email}</Text>
          </Text>
          
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            autoFocus={true}
          />
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity 
              style={styles.otpVerifyButton} 
              onPress={handleVerifyOtp}
            >
              <Text style={styles.otpVerifyButtonText}>Verify Code</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.otpHelpText}>
            Check your email inbox and spam folder for the verification code
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default OtpScreen; 