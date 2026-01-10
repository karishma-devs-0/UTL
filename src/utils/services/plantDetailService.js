import api from '../api/api';
import {
    getAuthToken,
    getDeviceId
} from '../storage/storage';


export const apiGetplantdashboard = async (plantId) => {

    const token = await getAuthToken();
    const device_id = await getDeviceId();

    if (!token) {
        return { valid: false, reason: 'no-token' };
    }

    try {
        const response = await api.get('/plantdashboard', { params: { id: plantId } }, {
            headers: { Authorization: `Bearer ${token}`, "x-device-id": device_id },
        });
        return response;
    } catch (error) {
        return error
    }
};


export const getPlantStatus = async () => {
    const token = await getAuthToken();
    const deviceId = await getDeviceId();

    //if (token) config.headers.Authorization = `Bearer ${token}`;
    //if (deviceId) config.headers['X-Device-ID'] = deviceId;

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

