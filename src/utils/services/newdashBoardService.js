import api from '../api/api';
import {
    getAuthToken,
    getDeviceId
} from '../storage/storage';


export const apiGetDashboardService = async () => {
    const token = await getAuthToken();
    const device_id = await getDeviceId();

    if (!token) {
        return { valid: false, reason: 'no-token' };
    }

    try {
        const response = await api.get('/dashboard', {
            headers: { Authorization: `Bearer ${token}`, 'x-device-id': device_id },
        });
        return response;
    } catch (error) {
        console.error('[apiGetDashboardService] Failed to fetch dashboard:', error?.message || error);
        return { data: null, error: true };
    }
};


export const getPlantStatus = async () => {
    const token = await getAuthToken();
    const deviceId = await getDeviceId();

    //if (token) config.headers.Authorization = `Bearer ${token}`;
   // if (deviceId) config.headers['X-Device-ID'] = deviceId;

    const response = await fetch('https://utlsolarrms.com/api/plantStatus', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-device-id': deviceId,
            'Accept': 'application/json'
        }
    });
    return response;
};

