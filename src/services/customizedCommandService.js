import apiClient from '../utils/api-native';

export const sendDcCommand = async ({ serialNumber, actualSuppliedVoltage }) => {
  const payload = {
    serialNumber,
    actualSuppliedVoltage: String(actualSuppliedVoltage),
  };

  const response = await apiClient.post('/mqtt_apis/command_write', payload);
  return response.data;
};

export const sendAcCommand = async ({ serialNumber, actualSuppliedVoltage }) => {
  const payload = {
    serialNumber,
    actualSuppliedVoltage: Number(actualSuppliedVoltage),
  };

  const response = await apiClient.post('/mqtt_apis/ac_command', payload);
  return response.data;
};
