import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import deviceService from '../services/deviceService';
import axios from 'axios';

const DeviceDetailScreen = ({ route, navigation }) => {
  const { deviceId, deviceType } = route.params;
  const [device, setDevice] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [error, setError] = useState(null);

  // Fetch device details
  const fetchDeviceDetails = async () => {
    try {
      setLoading(true);
      
      // Use different endpoints based on device type
      let response;
      
      switch(deviceType) {
        case 'Inverter':
          response = await deviceService.getDeviceDetails(deviceId);
          break;
        case 'Meter':
          // Using a custom approach since we updated the service
          response = await axios.get(`https://utlsolarrms.com/api/meter/${deviceId}`);
          break;
        case 'Logger':
          // Using a custom approach since we updated the service
          response = await axios.get(`https://utlsolarrms.com/api/logger/${deviceId}`);
          break;
        default:
          // Default to inverter as in our updated service
          response = await deviceService.getDeviceDetails(deviceId);
      }
      
      if (response && response.data) {
        setDevice(response.data);
        setError(null);
      } else {
        setError('Failed to load device details');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Error fetching device details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live data
  const fetchLiveData = async () => {
    try {
      const response = await deviceService.getDeviceData(deviceId);
      if (response && response.data) {
        setLiveData(response.data);
        setError(null);
      } else {
        setError('Failed to load live data');
      }
    } catch (err) {
      console.error('Error fetching live data:', err);
      setError('Failed to load live data');
    }
  };

  // Start live data polling
  const startPolling = useCallback(() => {
    try {
      // Start polling for live data
      const pollInterval = setInterval(fetchLiveData, 5000); // Poll every 5 seconds
      setPollingActive(true);
      
      // Store interval ID for cleanup
      return () => clearInterval(pollInterval);
    } catch (err) {
      console.error('Failed to start polling:', err);
      setError('Failed to start live data updates');
    }
  }, [deviceId]);

  // Stop polling when leaving the screen
  const stopPolling = useCallback(() => {
    setPollingActive(false);
  }, []);

  // Handle manual refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDeviceDetails();
      await fetchLiveData();
    } catch (err) {
      console.error('Refresh error:', err);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDeviceDetails();
    fetchLiveData();
  }, [deviceId]);

  // Handle screen focus/unfocus
  useFocusEffect(
    useCallback(() => {
      // Start polling when screen comes into focus
      const cleanup = startPolling();
      
      // Return cleanup function to run when screen goes out of focus
      return () => {
        stopPolling();
        if (cleanup) cleanup();
      };
    }, [startPolling, stopPolling])
  );

  // Get appropriate icon for device type
  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'Inverter':
        return 'settings-input-hdmi';
      case 'Meter':
        return 'speed';
      case 'Logger':
        return 'storage';
      default:
        return 'devices';
    }
  };

  // Get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Online':
        return '#4CAF50';
      case 'Offline':
        return '#F44336';
      case 'Warning':
        return '#FFC107';
      case 'Maintenance':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // Format a number with thousands separators and fixed decimals
  const formatNumber = (num, decimals = 1) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Render loading state
  if (loading && !device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Device...</Text>
          <View style={{width: 40}} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00875A" />
          <Text style={styles.loadingText}>Loading device details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // >>>>> ADD NAVIGATION LOGIC / CONDITIONAL RENDER FOR NAVIGATORS HERE <<<<<
  // Example: If this screen is supposed to decide which TabNavigator to show
  // This is a conceptual placement. The actual navigation or rendering of InverterTabNavigator
  // might happen in a button press handler or elsewhere depending on your UI flow.
  // For now, we will just log what 'device' contains when DeviceDetailScreen is fully loaded.
  useEffect(() => {
    if (device) {
      console.log('[DeviceDetailScreen] Fully loaded. Current device state for potential navigation:', JSON.stringify(device, null, 2));
    }
  }, [device]);

  // Render device details with live data
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {device?.name || `${deviceType} Details`}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00875A']}
          />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Device Summary Card */}
        <View style={styles.card}>
          <View style={styles.deviceSummary}>
            <View style={styles.deviceIconContainer}>
              <Icon name={getDeviceIcon()} size={40} color="#00875A" />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device?.name || 'Unknown Device'}</Text>
              <Text style={styles.deviceModel}>{device?.model || 'Unknown Model'}</Text>
              <Text style={styles.deviceSn}>S/N: {device?.sn || 'Unknown'}</Text>
            </View>
            {liveData && (
              <View style={styles.statusIndicator}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: getStatusColor(liveData.status) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(liveData.status) }
                ]}>
                  {liveData.status || 'Unknown'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Live Data Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Data</Text>
          <Text style={styles.lastUpdated}>
            Last updated: {liveData ? new Date(liveData.timestamp).toLocaleTimeString() : 'Never'}
          </Text>
        </View>

        {/* Different data displays based on device type */}
        {deviceType === 'Inverter' && liveData && (
          <View style={styles.liveDataContainer}>
            {/* Power Section */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Power</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.power?.current)}
                    <Text style={styles.dataUnit}> kW</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Current</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.power?.daily)}
                    <Text style={styles.dataUnit}> kWh</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Today</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.power?.total, 0)}
                    <Text style={styles.dataUnit}> kWh</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Voltage Section */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Voltage</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.voltage?.input, 0)}
                    <Text style={styles.dataUnit}> V</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Input</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.voltage?.output, 0)}
                    <Text style={styles.dataUnit}> V</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Output</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.temperature)}
                    <Text style={styles.dataUnit}>°C</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Temp</Text>
                </View>
              </View>
            </View>

            {/* Efficiency */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Efficiency</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.efficiency, 1)}
                    <Text style={styles.dataUnit}>%</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Current</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {deviceType === 'Meter' && liveData && (
          <View style={styles.liveDataContainer}>
            {/* Power Section */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Power</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.power?.import)}
                    <Text style={styles.dataUnit}> kW</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Import</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.power?.export)}
                    <Text style={styles.dataUnit}> kW</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Export</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={[
                    styles.dataValue,
                    liveData.power?.net < 0 ? styles.textGreen : styles.textRed
                  ]}>
                    {formatNumber(Math.abs(liveData.power?.net))}
                    <Text style={styles.dataUnit}> kW</Text>
                  </Text>
                  <Text style={styles.dataLabel}>
                    {liveData.power?.net < 0 ? 'Exporting' : 'Importing'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Energy Section */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Energy</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.energy?.imported, 0)}
                    <Text style={styles.dataUnit}> kWh</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Imported</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.energy?.exported, 0)}
                    <Text style={styles.dataUnit}> kWh</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Exported</Text>
                </View>
              </View>
            </View>

            {/* Grid Status */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Grid</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.voltage, 1)}
                    <Text style={styles.dataUnit}> V</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Voltage</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.frequency, 1)}
                    <Text style={styles.dataUnit}> Hz</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Frequency</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {deviceType === 'Logger' && liveData && (
          <View style={styles.liveDataContainer}>
            {/* Connectivity */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Connectivity</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {liveData.connectedDevices}
                  </Text>
                  <Text style={styles.dataLabel}>Connected Devices</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.signalStrength)}
                    <Text style={styles.dataUnit}>%</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Signal</Text>
                </View>
              </View>
            </View>

            {/* Storage */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Storage</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.storage?.used, 1)}
                    <Text style={styles.dataUnit}> GB</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Used</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber(liveData.storage?.total, 0)}
                    <Text style={styles.dataUnit}> GB</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Total</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {formatNumber((liveData.storage?.used / liveData.storage?.total) * 100, 0)}
                    <Text style={styles.dataUnit}>%</Text>
                  </Text>
                  <Text style={styles.dataLabel}>Usage</Text>
                </View>
              </View>
            </View>

            {/* Last Communication */}
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>Last Communication</Text>
              <View style={styles.dataRow}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataValue}>
                    {new Date(liveData.lastCommunication).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.dataLabel}>Time</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Configure Polling */}
        <View style={styles.pollingContainer}>
          <Text style={styles.pollingLabel}>
            Live data updates: {pollingActive ? 'Active' : 'Paused'}
          </Text>
          <View style={styles.pollingControls}>
            <TouchableOpacity
              style={[styles.pollingButton, !pollingActive && styles.pollingButtonActive]}
              onPress={() => {
                stopPolling();
                Alert.alert('Updates paused', 'Live data updates have been paused');
              }}
              disabled={!pollingActive}
            >
              <Icon name="pause" size={20} color={!pollingActive ? '#fff' : '#666'} />
              <Text style={[styles.pollingButtonText, !pollingActive && styles.pollingButtonTextActive]}>
                Pause
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pollingButton, pollingActive && styles.pollingButtonActive]}
              onPress={() => {
                startPolling();
                Alert.alert('Updates active', 'Live data updates have been resumed');
              }}
              disabled={pollingActive}
            >
              <Icon name="play-arrow" size={20} color={pollingActive ? '#fff' : '#666'} />
              <Text style={[styles.pollingButtonText, pollingActive && styles.pollingButtonTextActive]}>
                Resume
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Device Details */}
        <View style={styles.additionalDetails}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{device?.type || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer:</Text>
              <Text style={styles.detailValue}>{device?.manufacturer || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Communication:</Text>
              <Text style={styles.detailValue}>{device?.communicationType || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Serial Number:</Text>
              <Text style={styles.detailValue}>{device?.sn || '-'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceModel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deviceSn: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  liveDataContainer: {
    paddingHorizontal: 16,
  },
  dataCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataItem: {
    flex: 1,
    alignItems: 'center',
  },
  dataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dataUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  textGreen: {
    color: '#4CAF50',
  },
  textRed: {
    color: '#F44336',
  },
  pollingContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  pollingLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  pollingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pollingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eee',
    borderRadius: 20,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  pollingButtonActive: {
    backgroundColor: '#00875A',
  },
  pollingButtonText: {
    marginLeft: 6,
    color: '#666',
  },
  pollingButtonTextActive: {
    color: '#fff',
  },
  additionalDetails: {
    margin: 16,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default DeviceDetailScreen; 