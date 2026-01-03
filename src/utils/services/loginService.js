import { Alert } from 'react-native';
import { loginAuth } from './authService';
import { resetTo } from '@/navigation/navigationRef';
import {setAuthToken,setDeviceId, setUserData} from "@/utils/storage/storage"

/**
 * Just handles loginAuth + loading + alerts — no context login involved
 */
export const performHardcodedLogin = async ({ email, password, setIsLoading, login }) => {
  setIsLoading(true);

  try {
    const response = await loginAuth(email, password);

    if (response.success) {
      await setAuthToken(response.token)   
      await setDeviceId("hbeon_mobile")
      
      // Debug: Log the entire response structure
      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('response.user exists:', !!response.user);
      console.log('response.data exists:', !!response.data);
      console.log('response.data.user exists:', !!(response.data && response.data.user));
      
      // Save user data if available in response
      if (response.user) {
        await setUserData(response.user);
        console.log('✅ User data saved from response.user:', response.user);
        console.log('✅ User name:', response.user.name);
        console.log('✅ User role:', response.user.role);
        
        // Show welcome message with user name
        const userName = response.user.name || 'User';
        Alert.alert('Success', `Welcome ${userName}!`);
      } else if (response.data && response.data.user) {
        await setUserData(response.data.user);
        console.log('✅ User data saved from response.data.user:', response.data.user);
        console.log('✅ User name:', response.data.user.name);
        console.log('✅ User role:', response.data.user.role);
        
        // Show welcome message with user name
        const userName = response.data.user.name || 'User';
        Alert.alert('Success', `Welcome ${userName}!`);
      } else {
        console.log('⚠️ No user data found in response');
        console.log('Available response keys:', Object.keys(response));
        Alert.alert('Success', 'Successfully logged in!');
      }  
      login(response.token)
      //resetTo('MainApp');
      return { success: true, response: response.data  };
    } else {
      console.log('Invalid credentials entered.');
      Alert.alert('Login Failed', response.error || 'Invalid email or password.');
      return { success: false, error: response.error || 'invalid-credentials' };
    }
  } catch (error) {
    console.error('Unexpected login error:', error);
    Alert.alert('Login Error', 'Something went wrong.');
    return { success: false, error };
  } finally {
    setIsLoading(false);
  }
};
