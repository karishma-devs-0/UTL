import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import BackgroundImage from "../componenst/BackgroundImage";
import LinkComponent from "../componenst/Links";
import Button from "../componenst/Button";
import styles from "../styles/style";
import apiClient from "../utils/api-native.js";
import { BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { performHardcodedLogin } from "@/utils/services/loginService";

// Import Google Sign-In conditionally with error handling
let GoogleSignin, GoogleSigninButton, statusCodes;

try {
  const GoogleSignInModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSignInModule.GoogleSignin;
  GoogleSigninButton = GoogleSignInModule.GoogleSigninButton;
  statusCodes = GoogleSignInModule.statusCodes;
} catch (error) {
  console.log("Google Sign-In module could not be loaded:", error);
}

// Define authService functions using the imported apiClient
/*
const authService = {
  login: (data) => apiClient.post('/auth/login', data),
  requestOtp: (data) => apiClient.post('/auth/otp/request', data),
  verifyOtp: (data) => apiClient.post('/auth/otp/verify', data),
  googleLogin: (data) => apiClient.post('/auth/google', data) // Assuming this endpoint exists
};
*/

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSignInAvailable, setIsGoogleSignInAvailable] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  useEffect(() => {
    // Check if Google Sign-In is available and configure it
    /*
    const checkGoogleSignIn = async () => {
      if (GoogleSignin) {
        try {
          GoogleSignin.configure({
            webClientId: '185926110714-817i6hcbf7blk3b0laeb2nsq6omvvjh4.apps.googleusercontent.com',
            offlineAccess: true,
            forceCodeForRefreshToken: true,
          });
          setIsGoogleSignInAvailable(true);
        } catch (error) {
          console.error('Error configuring Google Sign-In:', error);
          setIsGoogleSignInAvailable(false);
        }
      } else {
        console.log('Google Sign-In is not available in this environment');
        setIsGoogleSignInAvailable(false);
      }
    };*/
    // checkGoogleSignIn();
  }, []);

  const handleLogin = async () => {
    const result = await performHardcodedLogin({
      email,
      password,
      setIsLoading,
      login,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={styles.loginContainer}>
        <BackgroundImage />

        <View style={styles.loginTopContainer}>
          <View style={styles.loginFormContainer}>
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
              <Icon
                name="email"
                size={20}
                color="#666"
                style={styles.inlineInputIcon}
              />
            </View>

            <View style={styles.inputWithIconContainer}>
              <TextInput
                style={styles.LoginInputWithDoubleIcon}
                placeholder="Enter your Password"
                secureTextEntry={showPassword === false}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Icon
                name="lock"
                size={20}
                color="#666"
                style={styles.inlineInputIcon}
              />
              <TouchableOpacity
                style={styles.eyeIconContainer}
                onPress={togglePasswordVisibility}
                activeOpacity={0.7}
              >
                <Icon
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.linkContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={{ width: "100%", alignItems: "flex-end" }}
              >
                <Text style={styles.linkText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.loginButtonContainer}>
              {isLoading ? (
                <ActivityIndicator
                  size="large"
                  color="#ff0000"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <TouchableOpacity
                  style={styles.LoginButton}
                  onPress={handleLogin}
                >
                  <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
              )}
            </View>

            {}
            <View style={styles.loginFooterContainer}>
              <View style={styles.registerPromptContainer}>
                <Text style={styles.registerPromptText}>
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={styles.registerLinkText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
            {}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
