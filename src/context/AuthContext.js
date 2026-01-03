import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Restore AsyncStorage
import apiClient from '../utils/api-native.js';
import { CommonActions } from '@react-navigation/native';
import { initializeApp } from '@/utils/services/initApp.js';
import {getAuthToken} from '@/utils/storage/storage.js'

const AuthContext = createContext();
// Track navigation reference for reset actions
let navigationRef = null;

// Helper function to allow external components to set navigation ref
export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

// Remove localAuthService as API calls are not used for login/register
/*
const localAuthService = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
};
*/

export const AuthProvider = ({ children }) => {
  // Always set to false after initial load for direct dashboard access
  const [isLoading, setIsLoading] = useState(true);
  // Hard-code token and business ID to simulate logged-in state
  const [userToken, setUserToken] = useState(()=>{});
  const [selectedBusinessId, setSelectedBusinessId] = useState('1');
  
  useEffect(() => {
    // Simulate brief loading then set as authenticated
    const simulateLoading = async () => {
      // Brief timeout to avoid UI flicker
     // setTimeout(() => {
     //    setIsLoading(false);
     // }, 300);
      
      /* COMMENTED OUT ACTUAL AUTH CHECK
      let token = null;
      let businessId = null;
      try {
        // Check for token and potentially stored business ID
        token = await AsyncStorage.getItem('authToken');
        businessId = await AsyncStorage.getItem('selectedBusinessId');

        if (token) {
          console.log('AuthContext: Found token');
          setUserToken(token);
          if (businessId) {
            console.log('AuthContext: Found stored business ID:', businessId);
            setSelectedBusinessId(businessId);
          }
        } else {
          console.log('AuthContext: No token found.');
            setUserToken(null);
          setSelectedBusinessId(null);
        }
      } catch (error) {
        console.error('AuthContext: Error checking initial status:', error);
        setUserToken(null);
        setSelectedBusinessId(null);
      } finally {
        setIsLoading(false);
      }
      */
    };
    //simulateLoading();
    //TODO: login Api
    initializeApp({setUserToken, setIsLoading});

  }, []);

  // Keep the login, register, selectBusiness, and logout functions
  // (even though they won't be used in the direct-to-dashboard flow)
  const login = async (token, userData = null) => {
    
    setUserToken(token)
    console.log('AuthContext: Login bypassed - always authenticated');
    return true;
  };
  const logout = async () => {
    console.log('AuthContext: Logout bypassed - always authenticated');
    setUserToken(null);
    //setSelectedBusinessId(null);
  };

  const register = async (userData) => {
    console.log('AuthContext: Register bypassed - always authenticated');
    return { success: true };
  };

  const selectBusiness = async (businessId) => {
    console.log('AuthContext: Business selection bypassed - always selected');
    return true;
  };



  // Provide the context values with hard-coded authentication state
  return (
    <AuthContext.Provider 
      value={{ 
        isLoading, 
        userToken,  // Always set to a mock token
        selectedBusinessId, // Always has a businessuserToken ID
        login,
        logout,     
        register,  
        selectBusiness,
        isLoggedIn: true, // Always logged in
        isBusinessSelected: true // Always has business selected
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

//export const useAuth = () => useContext(AuthContext);
export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth called, context:', context);
  return context;
};