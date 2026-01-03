import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key, value) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getItem = async (key) => {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

export const removeItem = async (key) => {
  await AsyncStorage.removeItem(key);
};

// Custom
export const setAuthToken = (token) => setItem('authToken', token);
export const getAuthToken = () => getItem('authToken');
export const removeAuthToken = () => removeItem('authToken');

export const setDeviceId = (id) => setItem('deviceId', id);
export const getDeviceId = () => getItem('deviceId');
export const removeDeviceId = () => removeItem('deviceId');

// User data storage
export const setUserData = (userData) => setItem('userData', userData);
export const getUserData = () => getItem('userData');
export const removeUserData = () => removeItem('userData');

// Helper functions for specific user properties
export const getUserId = async () => {
  const userData = await getUserData();
  return userData?.id || null;
};

export const getUserEmail = async () => {
  const userData = await getUserData();
  return userData?.email || null;
};

export const getUserName = async () => {
  const userData = await getUserData();
  return userData?.name || null;
};

export const getUserRole = async () => {
  const userData = await getUserData();
  return userData?.role || null;
};

export const getUserPermissions = async () => {
  const userData = await getUserData();
  return userData?.permissions || [];
};

export const getUserBusiness = async () => {
  const userData = await getUserData();
  return userData?.business || null;
};

