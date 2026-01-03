import axios from 'axios';
import { getAuthToken, getDeviceId } from '../storage/storage';

const api = axios.create({
  baseURL: 'https://utlsolarrms.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {

  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
  console.log('[Payload]', config.data);
  console.log('[Headers]', config.headers);

  const token = await getAuthToken();
  const deviceId = await getDeviceId();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (deviceId) config.headers['X-Device-ID'] = deviceId;

  return config;
}, Promise.reject);

api.interceptors.response.use(
  (res) => {
    console.log("response------------------------------")
    console.log("✅ response data =>", res.data);
    return res
  },
  (err) => {
    // Access error response details here
    //console.log("❌ response error =>", err);
    console.log("response error------------------------------")
    if (err.response) {
      try {
        const errorData = err.response.data;
        const errorJson = typeof errorData === 'string' ? JSON.parse(errorData) : errorData;
        console.log("Parsed error =>", errorJson);
      } catch (e) {
        console.log("Error data is not JSON:");
      }

      if (err.response?.status === 401) {
        console.warn('🚫 Unauthorized');
      }
    } else {
      console.log('Network/connection error:', err.message);
    }
    return Promise.reject(err);

  }
);

export default api;
