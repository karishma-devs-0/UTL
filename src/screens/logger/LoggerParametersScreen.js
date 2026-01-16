import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator, 
  RefreshControl, 
  Alert,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import deviceService from '../../services/deviceService';
import LoggerAppBar from './LoggerAppBar';

const COLORS = {
    primary: '#00875A', 
    secondary: '#6c757d',
    white: '#FFFFFF',
    lightGray: '#F5F8FA',
    textPrimary: '#333',
    textSecondary: '#555',
    borderLight: '#eee',
    errorText: '#D32F2F',
};

const LoggerParametersScreen = ({ route, navigation, loggerData: externalLoggerData, loggerId: externalLoggerId, plantId: externalPlantId, showMenu, onMenuPress }) => {
  // Use provided data if available, otherwise try to get from route params
  const routeParams = route?.params || {};
  const returnTo = routeParams?.returnTo;
  const initialBasicData = externalLoggerData || routeParams.loggerData;
  const routeLoggerId = externalLoggerId || routeParams.loggerId;
  const routePlantId = externalPlantId || routeParams.plantId;

  const [loggerDetails, setLoggerDetails] = useState(initialBasicData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    console.log('[LoggerParametersScreen] Initial route.params:', JSON.stringify(route.params, null, 2));
  }, [route.params]);

  const fetchLoggerParameters = useCallback(async () => {
    const idToUseForMacBasedFetch = routeLoggerId;
    const idToUseForSnoBasedFetch = routeLoggerId;
    const plantIdToUse = routePlantId;

    if (!idToUseForMacBasedFetch && !idToUseForSnoBasedFetch) {
      setError("Logger ID or S/N not available to fetch parameters.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    console.log(`[LoggerParametersScreen] Starting fetchLoggerParameters. routeLoggerId: ${routeLoggerId}, routePlantId: ${routePlantId}`);
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (idToUseForMacBasedFetch && idToUseForMacBasedFetch.includes(':') || idToUseForMacBasedFetch.startsWith('&')) {
        console.log(`[LoggerParametersScreen] Attempting to fetch details using getLoggerDetailsByMacAddress with ID: ${idToUseForMacBasedFetch}`);
        result = await deviceService.getLoggerDetailsByMacAddress(idToUseForMacBasedFetch);
      } else if (idToUseForSnoBasedFetch && plantIdToUse) {
        console.log(`[LoggerParametersScreen] Attempting to fetch details using getLoggerDetailsBySno with S/N: ${idToUseForSnoBasedFetch}, PlantID: ${plantIdToUse}`);
        //result = await deviceService.getLoggerDetailsBySno(idToUseForSnoBasedFetch, plantIdToUse);
        result = await deviceService.getLoggerDetailsByMacAddress(idToUseForMacBasedFetch);
      } else {
        throw new Error("Insufficient parameters to fetch logger details.");
      }

      console.log('[LoggerParametersScreen] Raw result from service call:', JSON.stringify(result, null, 2));

      if (result && result.success && result.data) {
        setLoggerDetails(result.data);
        console.log('[LoggerParametersScreen] Successfully fetched and set logger details:', result.data);
        console.log('[LoggerParametersScreen] Timestamp from fetched data:', result.data?.timestamp);
      } else {
        console.warn(result?.error);
        setError(result?.error?.message ||  'Failed to load logger parameters. No data returned.');
        //setError(result?.error?.message || result?.error || 'Failed to load logger parameters. No data returned.');
        console.warn('[LoggerParametersScreen] Fetch successful but no data or error in result:', result);
      }
    } catch (e) {
      console.error('[LoggerParametersScreen] Error in fetchLoggerParameters:', e);
      setError(e.message || 'An unexpected error occurred while fetching parameters.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [routeLoggerId, routePlantId]);

  useEffect(() => {
    if (routeLoggerId) {
        console.log('[LoggerParametersScreen] useEffect detected routeLoggerId, calling fetchLoggerParameters.');
        fetchLoggerParameters();
    } else if (initialBasicData && initialBasicData.sno) {
        console.log('[LoggerParametersScreen] useEffect using initialBasicData.sno to call fetchLoggerParameters.');
    } else {
        console.warn('[LoggerParametersScreen] useEffect: Not fetching - routeLoggerId is missing.');
        setError("Logger ID not available for initial fetch.");
    }
  }, [fetchLoggerParameters, routeLoggerId]);

  const onRefresh = useCallback(() => {
    console.log('[LoggerParametersScreen] onRefresh triggered.');
    setIsRefreshing(true);
    fetchLoggerParameters();
  }, [fetchLoggerParameters]);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        const modifiedIsoString = isoString.replace(' ', 'T').endsWith('Z') ? isoString : isoString + 'Z';
        const modifiedDate = new Date(modifiedIsoString);
        if (isNaN(modifiedDate.getTime())) return isoString;
        return modifiedDate.toLocaleString();
      }
      return date.toLocaleString();
    } catch (e) {
      return isoString;
    }
  };

  const getLoggerStatusText = (status) => {
    if (status === '1') return 'Online'; if (status === '0') return 'Offline'; return status ?? 'N/A';
  };

  const renderDetailRow = (label, value, unit = '') => {
    let displayValue = value;
    if (value === null || typeof value === 'undefined' || String(value).trim() === '' || String(value).trim() === '--') displayValue = 'N/A';
    return (
      <View style={localStyles.detailRow}>
        <Text style={localStyles.detailLabel}>{label}:</Text>
        <Text style={localStyles.detailValue}>{String(displayValue)}{unit ? ` ${unit}` : ''}</Text>
      </View>
    );
  };
  
  const renderSection = (title, iconName, dataPairs) => {
    const validDataPairs = dataPairs.map(pair => {
        let displayValue = pair.value;
        if (pair.value === null || typeof pair.value === 'undefined' || String(pair.value).trim() === '' || String(pair.value).trim() === '--') displayValue = 'N/A';
        return {...pair, displayValue };
    }).filter(pair => pair.displayValue !== 'N/A' || pair.alwaysShow);
    if (validDataPairs.length === 0) return null;
    return (
        <View style={localStyles.card}>
            <View style={localStyles.cardHeader}>
                <Icon name={iconName || "settings"} size={20} color={COLORS.primary} style={localStyles.cardIcon}/>
                <Text style={localStyles.cardTitle}>{title}</Text>
            </View>
            {validDataPairs.map((pair, index) => (
                <View key={`${title}-${index}-${pair.label}`}>{renderDetailRow(pair.label, pair.displayValue, pair.unit)}</View>
            ))}
        </View>
    );
  };
  


  if (isLoading && !isRefreshing && !loggerDetails) {
    return (
      <>
        <LoggerAppBar 
          title={`Logger ${routeLoggerId || ''}`}
          onBackPress={() => {
            if (returnTo === 'Architecture') {
              navigation.setParams({ returnTo: undefined });
              navigation.navigate('Architecture');
              return;
            }
            navigation.goBack();
          }}
          showMenu={false}
        />
        <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
          <View style={localStyles.centeredMessageContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={localStyles.loadingText}>Loading Logger Parameters...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error && !loggerDetails) {
    return (
      <>
        <LoggerAppBar 
          title={`Logger ${routeLoggerId || ''}`}
          onBackPress={() => {
            if (returnTo === 'Architecture') {
              navigation.setParams({ returnTo: undefined });
              navigation.navigate('Architecture');
              return;
            }
            navigation.goBack();
          }}
          showMenu={false}
        />
        <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
          <View style={localStyles.centeredMessageContainer}>
            <Icon name="error-outline" size={48} color={COLORS.errorText} />
            <Text style={localStyles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchLoggerParameters} style={localStyles.retryButton}>
              <Text style={localStyles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!loggerDetails) {
    return (
      <>
        <LoggerAppBar 
          title={`Logger ${routeLoggerId || ''}`}
          onBackPress={() => {
            if (returnTo === 'Architecture') {
              navigation.setParams({ returnTo: undefined });
              navigation.navigate('Architecture');
              return;
            }
            navigation.goBack();
          }}
          showMenu={false}
        />
        <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
          <View style={localStyles.centeredMessageContainer}>
            <Icon name="info-outline" size={48} color={COLORS.secondary} />
            <Text style={localStyles.infoText}>No logger parameters to display.</Text>
            {routeLoggerId && (
              <TouchableOpacity onPress={fetchLoggerParameters} style={localStyles.retryButton}>
                <Text style={localStyles.retryButtonText}>Try Loading Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </>
    );
  }

  const ld = loggerDetails;
  const loggerName = ld?.name || `Logger ${ld?.sno || routeLoggerId || ''}`;

  // Define data for cards based on the screenshot
  const basicInfoData = [
    { label: 'Embedded Device SN', value: ld?.module_mac_address, alwaysShow: true },
    { label: 'Serial Number', value: ld?.mac_address },
  ];

  const versionInfoData = [
    { label: 'Module Version No', value: ld?.module_version_no },
    { label: 'Extended System Version', value: ld?.extended_system_version },
  ];

  const operationInfoData = [
    { label: 'Data Uploading Period', value: ld?.data_uploading_period },
    { label: 'Data Acquisition Period', value: ld?.data_acquisition_period },
    { label: 'Max. No. of Connected Devices', value: ld?.max_connected_devices },
    { label: 'Signal Strength', value: ld?.signal_strength },
    { label: 'Module MAC Address', value: ld?.module_mac_address },
    { label: 'Router SSID', value: ld?.router_ssid },
  ];

  return (
    <>
      <LoggerAppBar 
        title={loggerName}
        onBackPress={() => {
          if (returnTo === 'Architecture') {
            navigation.setParams({ returnTo: undefined });
            navigation.navigate('Architecture');
            return;
          }
          navigation.goBack();
        }}
        showMenu={showMenu}
        menuIconName="more-vert"
        onMenuPress={onMenuPress}
      />
      <SafeAreaView style={localStyles.safeArea} edges={['left', 'right', 'bottom']}>
        <ScrollView
          style={localStyles.container}
          contentContainerStyle={localStyles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {error && loggerDetails && <View style={localStyles.errorBanner}><Text style={localStyles.errorBannerText}>Could not refresh data:  {error?.message || error}</Text></View>}
          
          {/* Render sections based on the screenshot structure */}
          {renderSection('Basic Information', 'info-outline', basicInfoData)}
          {renderSection('Version Information', 'developer-board', versionInfoData)}
          {renderSection('Operation Information', 'settings-input-component', operationInfoData)}

          {ld?.timestamp && <Text style={localStyles.timestamp}>*Data updated {formatTimestamp(ld.timestamp)}</Text>}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  contentContainer: { padding: 16, flexGrow: 1 },
  card: { backgroundColor: COLORS.white, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  cardIcon: { marginRight: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  detailLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500', flexShrink: 1, marginRight: 10 },
  detailValue: { fontSize: 14, color: COLORS.textPrimary, textAlign: 'right', flex: 1 },
  timestamp: { fontSize: 12, color: COLORS.secondary, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  centeredMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: COLORS.lightGray },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6c757d' },
  errorText: { marginTop: 10, fontSize: 16, color: '#dc3545', textAlign: 'center' },
  infoText: { marginTop: 10, fontSize: 16, color: '#6c757d', textAlign: 'center' },
  retryButton: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  retryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  errorBanner: { backgroundColor: '#FFCDD2', padding: 10, borderRadius: 5, marginBottom: 10 },
  errorBannerText: { color: '#D32F2F', textAlign: 'center' },
});

export default LoggerParametersScreen; 
