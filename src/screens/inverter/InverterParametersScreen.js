import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons'; // Assuming you use MaterialIcons
import deviceService from '../../services/deviceService'; // Adjust path if needed
import InverterAppBar from './InverterAppBar';
import { SafeAreaView as SafeAreaViewSafeAreaContext } from 'react-native-safe-area-context';

// Consistent color palette (can be moved to a shared styles file)
const COLORS = {
    primary: '#00875A', // Main theme color
    secondary: '#6c757d',
    lightGray: '#F5F8FA',
    textPrimary: '#333',
    textSecondary: '#555',
    borderLight: '#eee',
    white: '#FFFFFF',
    errorRed: '#D32F2F',
    warningOrange: '#FFA000',
};

const InverterParametersScreen = ({ route, navigation, device: externalDevice, liveData: externalLiveData, showMenu, onMenuPress }) => {
  const { device } = route.params || {}; // Contains inverter_sno and plantId (e.g., device.inverter_sno, device.plant_id)
  
  const [inverterParams, setInverterParams] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false);

  const fetchInverterParameters = async () => {
    const currentLoggerSno = device?.loggerSno || device?.logger_sno || device?.sno || device?.sn || device?.id;
    const currentPlantId = device?.plantId || device?.plant_id;
    
    if (!device || !currentLoggerSno || !currentPlantId) {
      setError('Logger S/N or Plant ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      console.log('[InverterParametersScreen] Fetching parameters with Logger S/N and Plant ID:', { currentLoggerSno, currentPlantId });
      const result = await deviceService.getInverterParameters(currentLoggerSno, currentPlantId);
      console.log('[InverterParametersScreen] API Result:', JSON.stringify(result, null, 2));
      if (result.success && result.data) {
        setInverterParams(result.data);
      } else {
        setError(result.error || 'Failed to fetch inverter parameters.');
      }
    } catch (e) {
      setError(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('[InverterParametersScreen] Received device prop:', JSON.stringify(device, null, 2));
    const currentLoggerSno = device?.loggerSno || device?.logger_sno;
    // Title is set by AppNavigator for InverterTabs, so no direct setOptions for title here.
    fetchInverterParameters();
  }, [device]); // Re-fetch if the device prop changes

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchInverterParameters().finally(() => setIsRefreshing(false));
  };
  
  // Helper function to get inverter status text
  const getInverterStatusText = (statusCode) => {
    switch (String(statusCode)) {
      case '0': return 'Waiting'; case '1': return 'Normal / Generating'; case '2': return 'Fault / Error';
      case '3': return 'Updating'; case '4': return 'Standby';
      default: return statusCode != null ? `Code: ${statusCode}` : '--'; // Changed N/A to --
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '--'; // Changed N/A to --
    try { 
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString; // Keep original if invalid
      return date.toLocaleString(); 
    } catch (e) { return isoString; }
  };

  const renderDetailRow = (label, value, unit = '') => {
    // displayValue will be '--' if value was originally null, undefined, or empty
    let displayValue = (value === null || typeof value === 'undefined' || String(value).trim() === '') 
                       ? '--' 
                       : value;
    // Ensure formatting for new units if necessary
    if (typeof displayValue === 'number') {
        if (unit.toLowerCase() === 'kw' || unit.toLowerCase() === 'kwh') {
            displayValue = displayValue.toFixed(1); // Example: 1 decimal for kW/kWh
        } else if (unit.toLowerCase() === 'mwh') {
            displayValue = displayValue.toFixed(4); // Example: 4 decimals for MWh from screenshot
        } else if (unit.toLowerCase() === 'w') {
            displayValue = displayValue.toFixed(0); // 0 decimals for W
        }
    }
    return (
      <View style={localStyles.detailRow}>
        <Text style={localStyles.detailLabel}>{label}</Text>
        <Text style={localStyles.detailValue}>{String(displayValue)}{unit && displayValue !== '--' ? ` ${unit}` : ''}</Text>
      </View>
    );
  };

  const renderSection = (title, iconName, dataPairs) => {
    // Filter out rows where the value is '--', unless alwaysShow is true
    const validDataPairs = dataPairs.filter(pair => {
      const displayValue = (pair.value === null || typeof pair.value === 'undefined' || String(pair.value).trim() === '') 
                           ? '--' 
                           : pair.value;
      return pair.alwaysShow || displayValue !== '--';
    });

    // If, after filtering, there are no valid data pairs to show, don't render the section/card at all.
    // This is especially useful if the only item with alwaysShow also resolves to "--"
    if (validDataPairs.length === 0) return null;
    
    // The original check: if (validDataPairs.length === 0 && !title.includes("Status")) return null;
    // Can be simplified if we decide that empty sections (even status if it becomes "--") shouldn't render.
    // For now, let's keep it rendering if there's at least one valid pair.

    return (
        <View style={localStyles.card}>
            <View style={localStyles.cardHeader}>
                <Icon name={iconName || "settings"} size={20} color={COLORS.primary} style={localStyles.cardIcon}/>
                <Text style={localStyles.cardTitle}>{title}</Text>
            </View>
            {/* Map over the filtered validDataPairs */}
            {validDataPairs.map((pair, index) => (
                <View key={`${title}-${index}`}>{renderDetailRow(pair.label, pair.value, pair.unit)}</View>
                // Note: renderDetailRow will internally convert null/undefined pair.value to '--' again for display
            ))}
            {/* Original fallback if validDataPairs was empty, now less likely to be hit if section itself hides */}
            {/* {validDataPairs.length === 0 && renderDetailRow("Status", "No data available for this section")} */}
        </View>
    );
  };

  // --- MODIFIED: Function to render the Electricity Generation card (DC, AC, and Summary) ---
  const renderElectricityGenerationSection = (dcData, acData, summaryData, iconName = 'bolt') => {
    const showDcTable = dcData && dcData.length > 0 && dcData.some(d => d.voltage !== null || d.current !== null || d.power !== null);
    const showAcTable = acData && acData.length > 0 && acData.some(d => d.voltage !== null || d.current !== null || d.power !== null);
    const showSummary = summaryData && summaryData.length > 0 && summaryData.some(d => d.value !== null && d.value !== 'N/A');

    if (!showDcTable && !showAcTable && !showSummary) {
      return (
        <View style={localStyles.card}>
          <View style={localStyles.cardHeader}>
            <Icon name={iconName} size={20} color={COLORS.primary} style={localStyles.cardIcon}/>
            <Text style={localStyles.cardTitle}>Electricity Generation</Text>
          </View>
          <Text style={localStyles.noDataText}>No DC, AC, or Summary data available.</Text>
        </View>
      );
    }

    return (
      <View style={localStyles.card}>
        <View style={localStyles.cardHeader}>
          <Icon name={iconName} size={20} color={COLORS.primary} style={localStyles.cardIcon}/>
          <Text style={localStyles.cardTitle}>Electricity Generation</Text>
        </View>
        
        {showDcTable && (
          <View>
            <Text style={localStyles.subTableHeader}>DC Inputs</Text>
            <View style={localStyles.tableRowHeader}>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell, {flex: 0.7}]}>Name</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Voltage (V)</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Current (A)</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Power (kW)</Text>
            </View>
            {dcData.map((item, index) => (
              (item.voltage !== null || item.current !== null || item.power !== null) && // Only render row if it has some data
              <View key={`dc-${index}`} style={localStyles.tableRow}>
                <Text style={[localStyles.tableCell, {flex: 0.7}]}>{item.name}</Text>
                <Text style={localStyles.tableCell}>{item.voltage !== null ? item.voltage : 'N/A'}</Text>
                <Text style={localStyles.tableCell}>{item.current !== null ? item.current : 'N/A'}</Text>
                <Text style={localStyles.tableCell}>{item.power !== null ? item.power : 'N/A'}</Text>
              </View>
            ))}
          </View>
        )}

        {(showDcTable && (showAcTable || showSummary)) && <View style={localStyles.tableDivider} />}
        
        {showAcTable && (
          <View>
            <Text style={localStyles.subTableHeader}>AC Outputs (Phase)</Text>
            <View style={localStyles.tableRowHeader}>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell, {flex: 0.7}]}>Name</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Voltage (V)</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Current (A)</Text>
              <Text style={[localStyles.tableCell, localStyles.tableHeaderCell]}>Power (kW)</Text>
            </View>
            {acData.map((item, index) => (
             (item.voltage !== null || item.current !== null || item.power !== null) && // Only render row if it has some data
              <View key={`ac-${index}`} style={localStyles.tableRow}>
                <Text style={[localStyles.tableCell, {flex: 0.7}]}>{item.name}</Text>
                <Text style={localStyles.tableCell}>{item.voltage !== null ? item.voltage : 'N/A'}</Text>
                <Text style={localStyles.tableCell}>{item.current !== null ? item.current : 'N/A'}</Text>
                <Text style={localStyles.tableCell}>{item.power !== null ? item.power : 'N/A'}</Text>
              </View>
            ))}
          </View>
        )}

        {(showAcTable && showSummary) && <View style={localStyles.tableDivider} />} 

        {showSummary && (
          <View>
            <Text style={localStyles.subTableHeader}>AC Summary</Text>
            {summaryData.map((item, index) => (
                // Only render if value is not explicitly N/A from preparation, or alwaysShow is true
                (item.value !== 'N/A' || item.alwaysShow) &&
                 <View key={`summary-${index}`}>{renderDetailRow(item.label, item.value, item.unit)}</View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // --- NEW: Helper function for Grid Status Text ---
  const getGridStatusText = (statusCode) => {
    switch (String(statusCode)) {
      case '0': return 'Grid Disconnected'; // Example mapping
      case '1': return 'Grid Connected';    // Example mapping
      // Add more cases based on your API's grid_status meanings
      default: return statusCode != null ? `Code: ${statusCode}` : '--';
    }
  };

  // --- NEW: Dedicated rendering function for Power Grid card ---
  const renderPowerGridCard = (data, title = 'Power Grid', iconName = 'electrical-services') => {
    // Check if there are any items to render at all for this card
    // This is a basic check; we could make it more sophisticated if needed
    const hasContent = data && data.length > 0;
    if (!hasContent && !data.some(item => item.alwaysShow && item.value !== '--')) {
        // If no data and no alwaysShow item has a valid value, don't render card
        // However, if an alwaysShow item itself is "--", we might still want to show it based on `alwaysShow` alone.
        // Let's refine: render if there's any data OR if an alwaysShow item exists, even if its value becomes "--"
        const shouldRenderCard = data.some(item => 
            (item.value !== null && typeof item.value !== 'undefined' && String(item.value).trim() !== '') || item.alwaysShow
        );
        if (!shouldRenderCard) return null;
    }

    return (
      <View style={localStyles.card}>
        <View style={localStyles.cardHeader}>
          <Icon name={iconName} size={20} color={COLORS.primary} style={localStyles.cardIcon} />
          <Text style={localStyles.cardTitle}>{title}</Text>
        </View>
        {data.map((pair, index) => (
          // Render a detail row for every item in powerGridData
          // renderDetailRow will handle displaying '--' for null/undefined values
          <View key={`${title}-${index}`}>{renderDetailRow(pair.label, pair.value, pair.unit)}</View>
        ))}
      </View>
    );
  };
  // --- END Power Grid Card rendering function ---

  // --- NEW: Dedicated rendering function for Electricity Consumption card ---
  const renderElectricityConsumptionCard = (data, title = 'Electricity Consumption', iconName = 'power-settings-new') => {
    // Render the card as long as there are items defined in the data array.
    // renderDetailRow will handle displaying '--' for null/undefined values.
    if (!data || data.length === 0) {
        return null; // Don't render if no items are defined at all
    }

    return (
      <View style={localStyles.card}>
        <View style={localStyles.cardHeader}>
          <Icon name={iconName} size={20} color={COLORS.primary} style={localStyles.cardIcon} />
          <Text style={localStyles.cardTitle}>{title}</Text>
        </View>
        {data.map((pair, index) => (
          <View key={`${title}-${index}`}>{renderDetailRow(pair.label, pair.value, pair.unit)}</View>
        ))}
      </View>
    );
  };
  // --- END Electricity Consumption Card rendering function ---

  // Get inverter ID for display
  const inverterId = device?.inverter_sno || device?.sno || device?.id || '';

  const handleCommandMenuSelect = (option) => {
    setIsCommandMenuVisible(false);
    if (option === 'Remote Control') {
      const serialNumber = device?.inverter_sno || device?.inverterSno || device?.sno || device?.id;
      navigation.navigate('ProtectParameterScreen', { serialNumber });
      return;
    }

    console.log('[InverterParametersScreen] Command menu selected:', option);
  };

  if (isLoading && !isRefreshing && !inverterParams) {
    return (
      <SafeAreaViewSafeAreaContext style={localStyles.mainContainer} edges={['top', 'bottom']}>
        <InverterAppBar
          title={`Inverter ${inverterId}`}
          showMenu={true}
          menuIconName="settings"
          onMenuPress={() => setIsCommandMenuVisible(true)}
        />

        <View style={localStyles.centeredMessageContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={localStyles.loadingText}>Loading Inverter Parameters...</Text>
        </View>
      </SafeAreaViewSafeAreaContext>
    );
  }

  if (error && !inverterParams) {
    return (
      <SafeAreaViewSafeAreaContext style={localStyles.mainContainer} edges={['top', 'bottom']}>
        <InverterAppBar
          title={`Inverter ${inverterId}`}
          showMenu={true}
          menuIconName="settings"
          onMenuPress={() => setIsCommandMenuVisible(true)}
        />

        <View style={localStyles.centeredMessageContainer}>
          <Icon name="error-outline" size={48} color={COLORS.errorRed} />
          <Text style={localStyles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchInverterParameters} style={localStyles.retryButton}>
            <Text style={localStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaViewSafeAreaContext>
    );
  }

  // Map API data to sections. Field names from 'inverterParams' are guesses.
  // Adjust these based on the actual API response structure.
  const p = inverterParams; // shorthand

  // --- UPDATED basicInfo array ---
  const basicInfo = p ? [
    { label: 'SN:', value: p.sno, alwaysShow: true }, 
    { label: 'Inverter Type:', value: p.inverter_type_description },
    { label: 'Product Type:', value: p.product_type }, // Will show '--' if p.product_type is null/undefined
    { label: 'General settings:', value: p.general_settings }, // Will show '--' if p.general_settings is null/undefined
    { label: 'Production Compliance Country:', value: p.production_compliance_country },
    // API has rated_power: 0. Using p.capacity.module_capacity as requested.
    { label: 'Rated Power:', value: p.capacity?.module_capacity, unit: 'kW' }, 
    { label: 'MPPT No:', value: p.calculated_mppt }, // Using calculated_mppt as discussed
  ] : [];
  // --- END UPDATED basicInfo ---

  // --- NEW: Define data for the new "Version Information" card ---
  const newVersionInfoData = p ? [
    { label: 'Control Software Version 1:', value: p.formatted_comm_version_1 },
    { label: 'Control Software Version 2:', value: p.formatted_comm_version_2 },
    { label: 'Communication Software Version:', value: p.formatted_control_version },
    { label: 'Protocol Version:', value: p.formatted_protocol_version },
    // We can add other relevant versions here if needed from the API, e.g., module_version_no
    // { label: 'Module Version No:', value: p.module_version_no }, 
    // { label: 'Extended System Version:', value: p.extended_system_version },
  ] : [];
  // --- END NEW Version Information Data ---

  const gridParameters = p ? [
    { label: 'Grid Voltage (R/A/L1):', value: p?.grid_voltage_r || p?.ac_voltage_a, unit: 'V' },
    { label: 'Grid Voltage (S/B/L2):', value: p?.grid_voltage_s || p?.ac_voltage_b, unit: 'V' },
    { label: 'Grid Voltage (T/C/L3):', value: p?.grid_voltage_t || p?.ac_voltage_c, unit: 'V' },
    { label: 'Grid Current (R/A/L1):', value: p?.grid_current_r || p?.ac_current_a, unit: 'A' },
    { label: 'Grid Current (S/B/L2):', value: p?.grid_current_s || p?.ac_current_b, unit: 'A' },
    { label: 'Grid Current (T/C/L3):', value: p?.grid_current_t || p?.ac_current_c, unit: 'A' },
    { label: 'Grid Frequency:', value: p?.grid_frequency, unit: 'Hz' },
    { label: 'Active Power:', value: p?.active_power, unit: 'kW' },
    { label: 'Reactive Power:', value: p?.reactive_power, unit: 'kVar' },
    { label: 'Power Factor:', value: p?.power_factor },
  ] : [];
  
  const productionData = p ? [
    { label: 'Daily Yield:', value: p?.daily_yield || p?.energy_today, unit: 'kWh' },
    { label: 'Total Yield:', value: p?.total_yield || p?.energy_total, unit: 'kWh' },
    { label: 'Monthly Yield:', value: p?.monthly_yield, unit: 'kWh' },
    { label: 'Yearly Yield:', value: p?.yearly_yield, unit: 'kWh' },
  ] : [];

  const otherInfoData = [
    { label: 'Total Grid-tied Time:', value: '--', unit: 'h', alwaysShow: true },
  ];

  const statusAndAlarms = p ? [
    { label: 'Inverter Status:', value: getInverterStatusText(p?.inverter_status), alwaysShow: true }, 
    { label: 'Alarm Code:', value: p?.alarm_code },
    { label: 'Fault Code:', value: p?.fault_code },
    // Potentially add a list of active alarms if the API provides an array
  ] : [];
  
  const temperature = p ? [
    { label: 'Internal Temp.:', value: p?.internal_temp, unit: '°C' },
    { label: 'Heat Sink Temp.:', value: p?.heatsink_temp, unit: '°C' },
    { label: 'Booster Temp.:', value: p?.booster_temp, unit: '°C' },
    { label: 'Environment Temp.:', value: p?.environment_temp, unit: '°C' },
  ] : [];

  // --- Prepare DC data for Electricity Generation section ---
  const electricityGenerationDcData = [];
  if (p) {
    for (let i = 1; i <= 8; i++) {
      electricityGenerationDcData.push({
        name: `DC${i}`,
        voltage: p[`dc_voltage_${i}`] !== undefined ? p[`dc_voltage_${i}`] : null,
        current: p[`dc_current_${i}`] !== undefined ? p[`dc_current_${i}`] : null,
        power: p[`dc_power_${i}`] !== undefined ? p[`dc_power_${i}`] : null,
      });
    }
  }

  // --- NEW: Prepare AC data for Electricity Generation section ---
  const electricityGenerationAcData = [];
  if (p) {
    const phases = [{name: 'A', vKey: 'ac_voltage_a', cKey: 'ac_current_a', pKey: 'ac_power_a'},
                    {name: 'B', vKey: 'ac_voltage_b', cKey: 'ac_current_b', pKey: 'ac_power_b'},
                    {name: 'C', vKey: 'ac_voltage_c', cKey: 'ac_current_c', pKey: 'ac_power_c'}];
    phases.forEach(phase => {
      electricityGenerationAcData.push({
        name: phase.name,
        voltage: p[phase.vKey] !== undefined ? p[phase.vKey] : null,
        current: p[phase.cKey] !== undefined ? p[phase.cKey] : null,
        power: p[phase.pKey] !== undefined ? p[phase.pKey] : null,
      });
    });
  }

  // --- NEW: Prepare AC Summary data --- 
  const electricityGenerationAcSummaryData = [];
  if (p) {
    const formatPowerValue = (powerValue) => {
      if (powerValue === null || typeof powerValue === 'undefined') return null;
      const num = parseFloat(powerValue);
      return isNaN(num) ? null : num.toFixed(0);
    };

    electricityGenerationAcSummaryData.push(
      { label: 'Total AC Output Power (Active)', value: p.total_ac_power ? parseFloat(parseFloat(p.total_ac_power).toFixed(3)) : null, unit: 'kW' },
      { label: 'AB Line Voltage', value: p.ac_voltage_ab, unit: 'V' },
      { label: 'BC Line Voltage', value: p.ac_voltage_bc, unit: 'V' },
      { label: 'CA Line Voltage', value: p.ac_voltage_ac, unit: 'V' }, 
      { label: 'Cumulative Production (Active)', value: p.total_yield ? parseFloat(parseFloat(p.total_yield).toFixed(3)) : (p.daily_energy_produced && parseFloat(p.daily_energy_produced) > 100000 ? parseFloat(parseFloat(p.daily_energy_produced).toFixed(3)) : null) , unit: 'MWh' }, 
      { label: 'Daily Production (Active)', value: p.daily_production, unit: 'kWh' },
      // Use formatPowerValue for L1, L2, L3 power
      { label: 'Inverter Output Power L1', value: '--' },
      { label: 'Inverter Output Power L2', value: '--' },
      { label: 'Inverter Output Power L3', value: '--' }
    );
  }
  // --- END NEW AC Summary Data Preparation ---

  // --- NEW: Define data for the "Temperature Information" card ---
  const temperatureInfoData = p ? [
    { label: 'Temperature 1:', value: p.temperature_1, unit: '°C' },
    { label: 'Temperature 2:', value: p.temperature_2, unit: '°C' },
    { label: 'Temperature 3:', value: p.temperature_3, unit: '°C' },
    // Your API sample also had "temperature_1": "180.4", "temperature_2": 0, "temperature_3": 10
    // If these correspond to specific locations like Internal, Heatsink, Ambient, we can rename labels.
  ] : [];
  // --- END NEW Temperature Information Data ---

  // --- "Power Grid" data definition (ensure API field names are correct) ---
  const powerGridData = p ? [
    { label: 'Electricity Meter Communication Attributes:', value: p.electricity_meter_communication_attributes }, 
    { label: 'Grid Status:', value: getGridStatusText(p.grid_status), alwaysShow: true }, // alwaysShow helps if card should appear for status alone
    { label: 'Total Grid Power:', value: p.total_grid_power, unit: 'kW' }, 
    { label: 'Cumulative Grid Feed-in:', value: p.cumulative_grid_feed_in, unit: 'kWh' },
    { label: 'Cumulative Energy Purchased:', value: p.cumulative_energy_purchased, unit: 'kWh' },
    { label: 'Daily Grid Feed-in:', value: p.daily_grid_feed_in, unit: 'kWh' },
    { label: 'Daily Energy Purchased:', value: p.daily_energy_purchased, unit: 'kWh' },
  ] : [];
  // Ensure you replace p.FIELD_NAME with actual fields from your API for the values above.
  // --- END Power Grid Data ---

  // --- "Electricity Consumption" card data definition (remains, will show '--' if fields are missing) ---
  const electricityConsumptionData = p ? [
    { label: 'Total Consumption Power:', value: p.total_consumption_power, unit: 'kW' }, 
    { label: 'Cumulative Consumption:', value: p.cumulative_consumption, unit: 'MWh' }, 
    { label: 'Daily Consumption:', value: p.daily_consumption, unit: 'kWh' }, 
  ] : [];
  // User needs to map p.total_consumption_power, p.cumulative_consumption, p.daily_consumption to actual API fields.
  // --- END Electricity Consumption Data ---

  return (
    <SafeAreaViewSafeAreaContext style={localStyles.mainContainer} edges={['top', 'bottom']}>
      <InverterAppBar
        title={`Inverter ${inverterId}`}
        showMenu={true}
        menuIconName="settings"
        onMenuPress={() => setIsCommandMenuVisible(true)}
      />

      <Modal
        transparent
        visible={isCommandMenuVisible}
        animationType="fade"
        onRequestClose={() => setIsCommandMenuVisible(false)}
      >
          <Pressable style={localStyles.commandMenuOverlay} onPress={() => setIsCommandMenuVisible(false)}>
            <Pressable style={localStyles.commandMenuContainer} onPress={() => {}}>
              <TouchableOpacity
                style={localStyles.commandMenuItem}
                onPress={() => handleCommandMenuSelect('Remote Control')}
              >
                <Text style={localStyles.commandMenuItemText}>Remote Control</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

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
        {inverterParams && renderSection('Basic Information', 'info-outline', basicInfo)}
        
        {inverterParams && renderElectricityGenerationSection(electricityGenerationDcData, electricityGenerationAcData, electricityGenerationAcSummaryData, 'solar-power')} 
        
        {inverterParams && newVersionInfoData.length > 0 && renderSection('Version Information', 'developer-board', newVersionInfoData)}

        {inverterParams && temperatureInfoData.length > 0 && temperatureInfoData.some(t => t.value !== null && t.value !== '--') && 
          renderSection('Temperature Information', 'thermostat', temperatureInfoData)}

        {inverterParams && renderPowerGridCard(powerGridData)}

        {inverterParams && renderElectricityConsumptionCard(electricityConsumptionData)}

        {inverterParams && renderSection('Production Data', 'insights', productionData)}
        {inverterParams && renderSection('Other', 'info-outline', otherInfoData)}
        {inverterParams?.timestamp && 
          <Text style={localStyles.timestamp}> 
             *Data last updated: {formatTimestamp(inverterParams?.timestamp || inverterParams?.last_updated)}
          </Text>
        }
      </ScrollView>
    </SafeAreaViewSafeAreaContext>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  contentContainer: {
    padding: 16,
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.errorRed,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop:10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardIcon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    // borderBottomWidth: 1, // Optional: if you want dividers between rows inside a card
    // borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flexShrink: 1, // Allow label to shrink if value is long
    marginRight: 10, 
    // fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
    textAlign: 'right',
    flexGrow: 1, // Allow value to take remaining space
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic'
  },
  noDataText: { paddingVertical: 10, textAlign: 'center', color: COLORS.textSecondary, fontStyle: 'italic'},

  // --- NEW Styles for Electricity Generation Table ---
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray, // Light background for header
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Lighter border for data rows
  },
  tableCell: {
    flex: 1, 
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'left', // Changed from 'right'
    paddingLeft: 4, // Add a little padding for left alignment
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'left', // Changed from 'right'
    paddingLeft: 4, // Add a little padding for left alignment
  },
  // --- END NEW Styles ---
  
  // --- NEW Styles ---
  tableDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 10, // Space around the divider
  },
  subTableHeader: { // Style for "DC Inputs" and "AC Outputs" text above tables
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 10,
    marginBottom: 5,
    paddingHorizontal: 5, // Align with table cell horizontal padding
  },
  commandMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingTop: 52,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  commandMenuContainer: {
    width: 190,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 6,
  },
  commandMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  commandMenuItemText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  commandMenuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  }
});

export default InverterParametersScreen;