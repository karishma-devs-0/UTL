import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//import { getAuthToken, getDeviceId } from '../storage/storage';
import { getAuthToken, getDeviceId } from "@/utils/storage/storage";

// const API_URL = 'http://122.180.144.196:3000/api';
const API_URL = "https://utlsolarrms.com/api"; // New Production Base URL

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    const deviceId = await getDeviceId();

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (deviceId) config.headers["x-device-id"] = deviceId;
    config.headers["x-device-id"] = "hbeon_mobile";

    /*
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Error getting auth token:', error);
    }*/
    //console.log("config", config)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    // console.log('API Response:', response);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log("Unauthorized request - token may be invalid");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
