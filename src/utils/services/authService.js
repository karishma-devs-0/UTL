import api from '../api/api';
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  setDeviceId,
  removeDeviceId,
  getDeviceId
} from '../storage/storage';

/**
 * 🔁 Used on app load to verify existing token
 */
export const bootstrapAuth = async () => {
  const token = await getAuthToken();
  const device_id = await getDeviceId();

  if (!token) {
    return { valid: false, reason: 'no-token' };
  }

  try {
    const response = await api.post('/auth/validate', {}, {
      headers: { Authorization: `Bearer ${token}`, "x-device-id": device_id  },
    });

    if (response.status === 200 && response.data.success) {
      return { valid: true, token };
    } else {
      //await removeAuthToken();
      return { valid: false, reason: 'invalid-token' };
    }
  } catch (error) {
    //await removeAuthToken();
    return { valid: false, reason: 'verify-failed' };
  }
};

/**
 * 🔐 Login with credentials
 */
export const loginAuth = async (email, password) => {
  try {
    const request = {
    "email": email,
    "password": password,
    "device_id": "hbeon_mobile"
  }
  const deviceId = "hbeon_mobile";
  setDeviceId(deviceId)
    const response = await api.post('/auth/login', request, {
      headers: { "x-device-id": "hbeon_mobile"  },
    });

    console.log("=== AUTH SERVICE DEBUG ===");
    console.log("loginAuth full response:", JSON.stringify(response.data, null, 2));
    console.log("User data in response:", response.data.user);
    console.log("Token in response:", response.data.token);

    const { token } = response.data;
    await setAuthToken(token);
    // if (deviceId) await setDeviceId(deviceId);

    // Return the complete response data including user information
    return { 
      success: true, 
      token, 
      deviceId,
      user: response.data.user,  // Pass through user data
      data: response.data        // Pass through complete data
    };
  } catch (error) {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const serverData = error.response?.data;
    const isNetworkError = !error.response;

    console.error('[AuthService] Login failed:', {
      message: error.message,
      status,
      data: serverData,
      isNetworkError,
    });

    if (isNetworkError) {
      return {
        success: false,
        error: 'Network Error: Unable to reach server. Check internet/VPN/DNS/SSL and API base URL.',
      };
    }

    return {
      success: false,
      error: serverMessage || (status ? `Login failed (HTTP ${status})` : 'Login failed'),
    };
  }
};

/**
 * 🚪 Logout
 */
export const logoutAuth = async () => {
  await removeAuthToken();
  await removeDeviceId();
  return true;
};

/**
 * 🧾 Register a new user
 */
export const registerAuth = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Register failed' };
  }
};
