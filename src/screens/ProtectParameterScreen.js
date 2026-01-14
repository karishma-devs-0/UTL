import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView as SafeAreaViewSafeAreaContext } from 'react-native-safe-area-context';
import { COLORS as colors } from '../styles/style';
import { sendAcCommand, sendDcCommand } from '../services/customizedCommandService';

const buildInitialParameters = () => ([
  { key: 'grid_standard', label: 'Grid standard', selected: false, value: '' },
  { key: 'grid_voltage_level', label: 'Grid voltage level', selected: false, value: '' },

  { key: 'grid_voltage_upperlimit_1', label: 'Grid voltage upperlimit 1', selected: false, value: '' },
  { key: 'grid_voltage_upperlimit_2', label: 'Grid voltage upperlimit 2', selected: false, value: '' },
  { key: 'grid_voltage_upperlimit_3', label: 'Grid voltage upperlimit 3', selected: false, value: '' },
  { key: 'grid_voltage_upperlimit_tripping_time_1', label: 'Grid voltage upperlimit tripping time 1', selected: false, value: '' },
  { key: 'grid_voltage_upperlimit_tripping_time_2', label: 'Grid voltage upperlimit tripping time 2', selected: false, value: '' },
  { key: 'grid_voltage_upperlimit_tripping_time_3', label: 'Grid voltage upperlimit tripping time 3', selected: false, value: '' },

  { key: 'grid_voltage_lowerlimit_1', label: 'Grid voltage Lowerlimit 1', selected: false, value: '' },
  { key: 'grid_voltage_lowerlimit_2', label: 'Grid voltage Lowerlimit 2', selected: false, value: '' },
  { key: 'grid_voltage_lowerlimit_3', label: 'Grid voltage Lowerlimit 3', selected: false, value: '' },
  { key: 'grid_voltage_lowerlimit_tripping_time_1', label: 'Grid voltage Lowerlimit tripping time 1', selected: false, value: '' },
  { key: 'grid_voltage_lowerlimit_tripping_time_2', label: 'Grid voltage Lowerlimit tripping time 2', selected: false, value: '' },
  { key: 'grid_voltage_lowerlimit_tripping_time_3', label: 'Grid voltage Lowerlimit tripping time 3', selected: false, value: '' },

  { key: 'grid_frequency_upperlimit_1', label: 'Grid Frequency upperlimit 1', selected: false, value: '' },
  { key: 'grid_frequency_upperlimit_2', label: 'Grid Frequency upperlimit 2', selected: false, value: '' },
  { key: 'grid_frequency_upperlimit_3', label: 'Grid Frequency upperlimit 3', selected: false, value: '' },
  { key: 'grid_frequency_upperlimit_tripping_time_1', label: 'Grid Frequency upperlimit tripping time 1', selected: false, value: '' },
  { key: 'grid_frequency_upperlimit_tripping_time_2', label: 'Grid Frequency upperlimit tripping time 2', selected: false, value: '' },
  { key: 'grid_frequency_upperlimit_tripping_time_3', label: 'Grid Frequency upperlimit tripping time 3', selected: false, value: '' },

  { key: 'grid_frequency_lowerlimit_1', label: 'Grid Frequency Lowerlimit 1', selected: false, value: '' },
  { key: 'grid_frequency_lowerlimit_2', label: 'Grid Frequency Lowerlimit 2', selected: false, value: '' },
  { key: 'grid_frequency_lowerlimit_3', label: 'Grid Frequency Lowerlimit 3', selected: false, value: '' },
  { key: 'grid_frequency_lowerlimit_tripping_time_1', label: 'Grid Frequency Lowerlimit tripping time 1', selected: false, value: '' },
  { key: 'grid_frequency_lowerlimit_tripping_time_2', label: 'Grid Frequency Lowerlimit tripping time 2', selected: false, value: '' },
  { key: 'grid_frequency_lowerlimit_tripping_time_3', label: 'Grid Frequency Lowerlimit tripping time 3', selected: false, value: '' },
]);

const isNumericField = (key) => {
  return !['grid_standard', 'grid_voltage_level'].includes(key);
};

const ProtectParameterScreen = ({ navigation, route }) => {
  const [parameters, setParameters] = useState(() => buildInitialParameters());
  const [activeTab, setActiveTab] = useState('Customized command');
  const serialNumber = route?.params?.serialNumber;
  const [dcVoltage, setDcVoltage] = useState('');
  const [acVoltage, setAcVoltage] = useState('');
  const [isSendingDc, setIsSendingDc] = useState(false);
  const [isSendingAc, setIsSendingAc] = useState(false);

  const selectedCount = useMemo(
    () => parameters.reduce((acc, p) => acc + (p.selected ? 1 : 0), 0),
    [parameters]
  );

  const isSelectAllChecked = useMemo(
    () => parameters.length > 0 && parameters.every((p) => p.selected),
    [parameters]
  );

  const toggleSelectAll = () => {
    const next = !isSelectAllChecked;
    setParameters((prev) => prev.map((p) => ({ ...p, selected: next })));
  };

  const toggleParameterSelected = (key) => {
    setParameters((prev) =>
      prev.map((p) => (p.key === key ? { ...p, selected: !p.selected } : p))
    );
  };

  const updateParameterValue = (key, value) => {
    setParameters((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)));
  };

  const handleRead = () => {
    console.log('[ProtectParameterScreen] Read selected:', parameters.filter((p) => p.selected).map((p) => p.key));
  };

  const handleSet = () => {
    console.log('[ProtectParameterScreen] Set selected:', parameters.filter((p) => p.selected).map((p) => ({ key: p.key, value: p.value })));
  };

  const ensureSerialNumber = () => {
    if (!serialNumber) {
      Alert.alert('Missing Serial Number', 'Serial number is required to send commands.');
      return false;
    }
    return true;
  };

  const handleSendDc = async () => {
    if (!ensureSerialNumber()) return;
    if (!dcVoltage) {
      Alert.alert('Enter DC Voltage', 'Please enter Actual Supplied Voltage for DC.');
      return;
    }

    try {
      setIsSendingDc(true);
      const result = await sendDcCommand({ serialNumber, actualSuppliedVoltage: dcVoltage });
      if (result?.success) {
        Alert.alert('Success', 'DC Calibration Successful!');
      } else {
        Alert.alert('DC Command Failed', result?.message || 'Command failed.');
      }
    } catch (e) {
      Alert.alert('DC Command Failed', e?.response?.data?.message || e?.message || 'Request failed');
    } finally {
      setIsSendingDc(false);
    }
  };

  const handleSendAc = async () => {
    if (!ensureSerialNumber()) return;
    if (!acVoltage) {
      Alert.alert('Enter AC Voltage', 'Please enter Actual Supplied Voltage for AC.');
      return;
    }

    try {
      setIsSendingAc(true);
      const result = await sendAcCommand({ serialNumber, actualSuppliedVoltage: acVoltage });
      if (result?.success) {
        Alert.alert('Success', 'AC Calibration Successful!');
      } else {
        Alert.alert('AC Command Failed', result?.message || 'Command failed.');
      }
    } catch (e) {
      Alert.alert('AC Command Failed', e?.response?.data?.message || e?.message || 'Request failed');
    } finally {
      setIsSendingAc(false);
    }
  };


  return (
    <SafeAreaViewSafeAreaContext style={localStyles.safeArea} edges={['top', 'bottom']}>
      <View style={localStyles.header}>
        <TouchableOpacity
          style={localStyles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>

        <View style={localStyles.headerTabsContainer}>
          <View style={localStyles.headerTabsRow}>
            {/*
            <TouchableOpacity
              style={[
                localStyles.segmentPill,
                activeTab === 'Batch Command' ? localStyles.segmentPillActive : localStyles.segmentPillInactive,
              ]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('Batch Command')}
            >
              <Text
                style={[
                  localStyles.segmentText,
                  activeTab === 'Batch Command' ? localStyles.segmentTextActive : localStyles.segmentTextInactive,
                ]}
              >
                Batch Command
              </Text>
            </TouchableOpacity>
            */}

            <TouchableOpacity
              style={[
                localStyles.segmentPill,
                activeTab === 'Customized command' ? localStyles.segmentPillActive : localStyles.segmentPillInactive,
              ]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('Customized command')}
            >
              <Text
                style={[
                  localStyles.segmentText,
                  activeTab === 'Customized command' ? localStyles.segmentTextActive : localStyles.segmentTextInactive,
                ]}
              >
                Customized command
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={localStyles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={localStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/*
        {activeTab === 'Batch Command' ? (
          <>
            <Text style={localStyles.sectionTitle}>Protect Parameters</Text>
            <View style={localStyles.selectAllRow}>

              <TouchableOpacity
                style={localStyles.checkboxHitbox}
                onPress={toggleSelectAll}
                activeOpacity={0.7}
              >
                <Icon
                  name={isSelectAllChecked ? 'check-box' : 'check-box-outline-blank'}
                  size={22}
                  color={colors?.secondary || '#ff0000'}
                />
              </TouchableOpacity>
              <Text style={localStyles.selectAllText}>Select All Parameters</Text>
            </View>

            <ScrollView
              style={localStyles.scroll}
              contentContainerStyle={localStyles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {parameters.map((item) => (
                <View key={item.key} style={localStyles.paramCard}>
                  <TouchableOpacity
                    style={localStyles.checkboxHitbox}
                    onPress={() => toggleParameterSelected(item.key)}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={item.selected ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={colors?.secondary || '#ff0000'}
                    />
                  </TouchableOpacity>

                  <View style={localStyles.paramBody}>
                    <Text style={localStyles.paramLabel} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <TextInput
                      value={item.value}
                      onChangeText={(v) => updateParameterValue(item.key, v)}
                      style={localStyles.paramInput}
                      placeholder="Enter value"
                      placeholderTextColor="#9AA0A6"
                      keyboardType={isNumericField(item.key) ? 'numeric' : 'default'}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={localStyles.footer}>
              <TouchableOpacity
                style={[localStyles.footerButton, localStyles.readButton]}
                onPress={handleRead}
                activeOpacity={0.85}
              >
                <Text style={localStyles.readButtonText}>{`Read (${selectedCount})`}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[localStyles.footerButton, localStyles.setButton]}
                onPress={handleSet}
                activeOpacity={0.85}
              >
                <Text style={localStyles.setButtonText}>{`Set (${selectedCount})`}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        */}

        <ScrollView
          style={localStyles.scroll}
          contentContainerStyle={localStyles.scrollContentNoFooter}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={localStyles.commandCard}>
            <Text style={localStyles.commandCardTitle}>Actual Supplied Voltage (DC VOLTAGE)</Text>
            <TextInput
              value={dcVoltage}
              onChangeText={setDcVoltage}
              placeholder="Enter value"
              placeholderTextColor="#9AA0A6"
              keyboardType="numeric"
              style={localStyles.commandInput}
            />
            <TouchableOpacity
              style={localStyles.commandActionButton}
              activeOpacity={0.85}
              onPress={handleSendDc}
              disabled={isSendingDc}
            >
              {isSendingDc ? (
                <ActivityIndicator size="small" color={colors?.primary || '#ffff'} />
              ) : (
                <Text style={localStyles.commandActionButtonText}>Send DC Command</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={localStyles.commandCard}>
            <Text style={localStyles.commandCardTitle}>Actual Supplied Voltage (AC VOLTAGE)</Text>
            <TextInput
              value={acVoltage}
              onChangeText={setAcVoltage}
              placeholder="Enter value"
              placeholderTextColor="#9AA0A6"
              keyboardType="numeric"
              style={localStyles.commandInput}
            />
            <TouchableOpacity
              style={localStyles.commandActionButton}
              activeOpacity={0.85}
              onPress={handleSendAc}
              disabled={isSendingAc}
            >
              {isSendingAc ? (
                <ActivityIndicator size="small" color={colors?.primary || '#fff'} />
              ) : (
                <Text style={localStyles.commandActionButtonText}>Send AC Command</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewSafeAreaContext>
  );
};

const FOOTER_HEIGHT = 72;

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  header: {
    height: 56,
    backgroundColor: colors?.white || '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors?.lightGrey || '#eee',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTabsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
    height: 40,
  },
  segmentPill: {
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors?.lightGrey || '#eee',
    marginHorizontal: 4,
  },
  segmentPillActive: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'rgba(255, 0, 0, 0.15)',
  },
  segmentPillInactive: {
    backgroundColor: '#F0F2F5',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors?.primary || '#ff0000',
  },
  segmentTextInactive: {
    color: colors?.darkGrey || '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors?.white || '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors?.lightGrey || '#eee',
  },
  checkboxHitbox: {
    padding: 6,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors?.black || '#333',
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: FOOTER_HEIGHT + 18,
  },
  scrollContentNoFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  sectionTitle: {
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '700',
    color: colors?.black || '#333',
  },
  commandCard: {
    backgroundColor: colors?.white || '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors?.lightGrey || '#eee',
    shadowColor: '#0003',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  commandCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors?.black || '#333',
    marginBottom: 10,
  },
  commandInput: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: colors?.black || '#333',
  },
  commandActionButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors?.primary || '#ff0000',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.15)',
  },
  commandActionButtonText: {
    color:  '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  paramCard: {
    flexDirection: 'row',
    backgroundColor: colors?.white || '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors?.lightGrey || '#eee',
    shadowColor: '#0003',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  paramBody: {
    flex: 1,
    marginLeft: 6,
  },
  paramLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors?.black || '#333',
    marginBottom: 8,
  },
  paramInput: {
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 14,
    color: colors?.black || '#333',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: FOOTER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors?.white || '#fff',
    borderTopWidth: 1,
    borderTopColor: colors?.lightGrey || '#eee',
  },
  footerButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readButton: {
    backgroundColor: colors?.primary || '#ff0000',
    marginRight: 10,
  },
  setButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors?.primary || '#ff0000',
    marginLeft: 10,
  },
  readButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  setButtonText: {
    color: colors?.primary || '#ff0000',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProtectParameterScreen;
