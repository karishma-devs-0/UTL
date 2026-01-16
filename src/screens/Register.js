import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import apiClient from '../utils/api-native.js';

const Register = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [date, setDate] = useState(new Date());
  const [dobInput, setDobInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [singhSelected, setSinghSelected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Configure StatusBar without taking up space
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#fff', true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  const showDatepicker = () => {
    setShowPicker(true);
  };

  const onChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setDobInput(formatDate(selectedDate));
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGoBack = () => {
    console.log('Register screen: Go back button pressed');

    try {
      // First try to go back if there's a previous screen
      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        console.log('Going back to previous screen');
        navigation.goBack();
      } else if (navigation && typeof navigation.navigate === 'function') {
        console.log('Navigating to Login screen');
        navigation.navigate('Login');
      } else {
        console.log('Navigation not available');
        Alert.alert('Error', 'Unable to go back. Please restart the app.');
      }
    } catch (error) {
      console.error('Error going back:', error);
      // Fallback to Login screen
      try {
        navigation.navigate('Login');
      } catch (fallbackError) {
        console.error('Fallback navigation failed:', fallbackError);
        Alert.alert('Error', 'Navigation error occurred.');
      }
    }
  };

  const handleRegister = async () => {
    console.log('Register.js: handleRegister called with:', {
      username,
      email,
      password,
      confirmPassword,
      dateOfBirth: dobInput,
      phone,
      termsAccepted: singhSelected
    });
    // Validation
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!singhSelected) {
      Alert.alert('Error', 'Please accept the Terms & Conditions to continue');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        email,
        password,
        name: username,
        dateOfBirth: dobInput ? date.toISOString() : null,
        phone: phone || null,
        termsAccepted: singhSelected
      };

      console.log('Register.js: Sending registration data:', userData);

      const response = await apiClient.post('/auth/register', userData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Please check your email for verification code.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OtpScreen', {
                phone: phone,
                email: email,
                fromRegistration: true
              })
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error, error.response.data);
      const errorMessage = error.response?.data?.error ||
        error.message ||
        'Registration failed. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView style={{ backgroundColor: '#fff' }} />
      <View style={styles.reg_androidHeader}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.androidBackButton}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.reg_androidHeaderText}>Create Account</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.reg_scrollContainer}
          contentContainerStyle={styles.reg_scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.reg_form}>

            <View style={styles.reg_inputContainer}>
              <TextInput
                style={styles.reg_inputWithIcon}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter Username"
                placeholderTextColor="#999"
              />
              <Icon name="person" size={20} color="#666" style={styles.reg_inputIcon} />
            </View>
            <View style={styles.reg_inputContainer}>
              <TextInput
                style={styles.reg_inputWithIcon}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <Icon name="email" size={20} color="#666" style={styles.reg_inputIcon} />
            </View>

            <View style={styles.reg_inputContainer}>
              <TouchableOpacity
                style={styles.reg_dateInputWithIcon}
                onPress={showDatepicker}
              >
                <Text style={dobInput ? styles.reg_dateText : styles.reg_datePlaceholder}>
                  {dobInput || "Date of Birth (Optional)"}
                </Text>
              </TouchableOpacity>
              <Icon name="event" size={20} color="#666" style={styles.reg_inputIcon} />
            </View>

            {showPicker && Platform.OS === 'android' && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display="default"
                onChange={onChange}
                maximumDate={new Date()}
              />
            )}

            {showPicker && Platform.OS === 'ios' && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.iosPickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPicker(false);
                      setDobInput(formatDate(date));
                    }}
                  >
                    <Text style={styles.iosPickerDone}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={(e, selectedDate) => selectedDate && setDate(selectedDate)}
                  maximumDate={new Date()}
                />
              </View>
            )}


            <View style={styles.reg_inputContainer}>
              <TextInput
                style={styles.reg_inputWithIcon}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
              <Icon name="phone" size={20} color="#666" style={styles.reg_inputIcon} />
            </View>


            <View style={styles.reg_inputContainer}>
              <TextInput
                style={styles.reg_inputWithDoubleIcon}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={showPassword === false}
                placeholderTextColor="#999"
              />
              <Icon name="lock" size={20} color="#666" style={styles.reg_inputIcon} />
              <TouchableOpacity
                style={styles.reg_eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Icon
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>


            <View style={styles.reg_inputContainer}>
              <TextInput
                style={styles.reg_inputWithDoubleIcon}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={showConfirmPassword === false}
                placeholderTextColor="#999"
              />
              <Icon name="lock" size={20} color="#666" style={styles.reg_inputIcon} />
              <TouchableOpacity
                style={styles.reg_eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Icon
                  name={showConfirmPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.reg_checkboxContainer}>
              <TouchableOpacity
                style={styles.reg_checkbox}
                onPress={() => setSinghSelected(!singhSelected)}
              >
                <Icon
                  name={singhSelected ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color="#000"
                />
              </TouchableOpacity>
              <Text style={styles.reg_checkboxText}>I agree to the </Text>
              <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
                <Text style={[styles.reg_termsLink, { color: '#000', fontWeight: 'bold' }]}>Terms & Conditions</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity
                style={styles.reg_signupButton}
                onPress={handleRegister}
              >
                <Text style={styles.reg_signupText}>Sign up</Text>
              </TouchableOpacity>
            )}

            <View style={styles.reg_loginContainer}>
              <Text style={styles.reg_loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.reg_loginLink, { color: '#000', fontWeight: 'bold' }]}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Register;