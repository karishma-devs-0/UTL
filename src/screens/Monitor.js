import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Modal,
  Alert,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import dataManager from '../utils/dataManager';
import { useIsFocused } from '@react-navigation/native';
import DevicesPage from './Devices';
import BackgroundImage from '../componenst/BackgroundImage';
import Button from '../componenst/Button';

const MonitorPage = ({ navigation, route }) => {
  const [activeMainTab, setActiveMainTab] = useState('Plants');
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showParamsModal, setShowParamsModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState('name');
  const [serverDown, setServerDown] = useState(false);
  const [filterParams, setFilterParams] = useState({
    plantDisplay: 'All',
    capacityRange: {
      minimum: '',
      maximum: ''
    },
    capacityPresets: [],
    region: '',
    follow: false,
    plantFollowed: false,
    tag: '',
    onGridStatus: '',
    systemType: '',
    plantType: ''
  });
  const [selectedOption, setSelectedOption] = useState('Name, Power, Daily, Capacity');
  const [sortOrder, setSortOrder] = useState({
    name: null,
    power: null,
    daily: null,
    capacity: null,
  });
  const isFocused = useIsFocused();

  const [apiStatusCounts, setApiStatusCounts] = useState({ online: 0, offline: 0, incomplete: 0, partiallyOffline: 0, total: 0 });
  const [incompletePlantIds, setIncompletePlantIds] = useState([]);
  const [onlinePlantIdsFromApi, setOnlinePlantIdsFromApi] = useState([]);
  const [offlinePlantIdsFromApi, setOfflinePlantIdsFromApi] = useState([]);

  const statusOptions = ['All', 'Online', 'Offline', 'Incomplete', 'Partially Offline', 'Alert'];

  // Consolidate loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPlantsAndStats = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    if (!isRefreshing) {
      setIsLoading(true);
    }
    setServerDown(false);

    try {
      const result = await dataManager.getPlants();

      if (result.success) {
        const fetchedPlants = result.data || [];
        console.log(`Monitor.js: Plants fetched successfully (${fetchedPlants.length} plants).`);
        setPlants(fetchedPlants);
      } else {
        console.error('Monitor.js: Error fetching plants:', result.error);
        Alert.alert('Fetch Error', result.error || 'Could not fetch plants.');
        if (result.serverDown) {
          setServerDown(true);
        }
        if (result.source === 'cache' && result.data) {
          setPlants(result.data);
        }
      }
    } catch (error) {
      console.error('Monitor.js: ❌ Unexpected error in fetchPlantsAndStats:', error.message);
      Alert.alert('Fetch Error', `An unexpected error occurred: ${error.message}`);
      setServerDown(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const fetchFilterCounts = useCallback(async () => {
    // Don't show loading for filter counts update
    try {
      const response = await fetch('https://utlsolarrms.com/api/plantStatus');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setApiStatusCounts({
            online: data.data.online?.count || 0,
            offline: data.data.offline?.count || 0,
            incomplete: data.data.incomplete?.count || 0,
            partiallyOffline: data.data.partiallyOffline?.count || 0,
            total: data.data.total?.count || 0,
          });
          setOnlinePlantIdsFromApi(data.data.online?.plantIds || []);
          setOfflinePlantIdsFromApi(data.data.offline?.plantIds || []);
          setIncompletePlantIds(data.data.incomplete?.plantIds || []);
        }
      }
    } catch (error) {
      console.error("Monitor.js: Error in fetchFilterCounts:", error);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
        console.log("Monitor.js: Screen focused, fetching plants and filter counts...");
        fetchPlantsAndStats();
        fetchFilterCounts();
    }
  }, [isFocused, fetchPlantsAndStats, fetchFilterCounts]);

  const sortPlants = (criteria) => {
    const sorted = [...plants].sort((a, b) => {
        const valA = a[criteria] || (criteria === 'name' ? '' : 0);
        const valB = b[criteria] || (criteria === 'name' ? '' : 0);

        if (typeof valA === 'string') {
            return sortOrder[criteria] === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
             return sortOrder[criteria] === 'asc' ? valA - valB : valB - valA;
        }
    });
    setPlants(sorted);
  };

  const renderStatusModal = () => (
    <Modal
      visible={showStatusModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowStatusModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setShowStatusModal(false)}
      >
        <View style={styles.modalContent}>
          {statusOptions.map((status) => {
            let count = 0;
            let countText = '';
            if (status === 'All' && apiStatusCounts.total > 0) count = apiStatusCounts.total;
            else if (status === 'Online' && apiStatusCounts.online > 0) count = apiStatusCounts.online;
            else if (status === 'Offline' && apiStatusCounts.offline > 0) count = apiStatusCounts.offline;
            else if (status === 'Incomplete' && apiStatusCounts.incomplete > 0) count = apiStatusCounts.incomplete;
            else if (status === 'Partially Offline' && apiStatusCounts.partiallyOffline > 0) count = apiStatusCounts.partiallyOffline;

            if (count > 0) {
                countText = ` (${count})`;
            }

            return (
              <TouchableOpacity
                key={status}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedStatus(status);
                  setShowStatusModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedStatus === status && styles.selectedModalItem
                ]}>
                  {`${status}${countText}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.filterModalContainer}>
        <View style={styles.filterModalHeader}>
          <TouchableOpacity 
            onPress={() => setShowFilterModal(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.filterModalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterModalTitle}>Filter</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView 
          style={styles.filterModalContent}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.filterSectionTitle}>Plant Display</Text>
          <View style={styles.filterRadioGroup}>
            {['All', 'Plants created by this business', 'Plants authorized to this business'].map((option) => (
              <TouchableOpacity
                key={option}
                activeOpacity={0.7}
                style={styles.filterRadioButton}
                onPress={() => setFilterParams(prev => ({...prev, plantDisplay: option}))}
              >
                <View style={[
                  styles.filterRadio,
                  filterParams.plantDisplay === option && styles.filterRadioSelected
                ]}>
                  {filterParams.plantDisplay === option && (
                    <View style={styles.filterRadioInner} />
                  )}
                </View>
                <Text style={styles.filterRadioText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Capacity(kWp)</Text>
          <View style={styles.capacityRangeContainer}>
            <TextInput
              style={styles.capacityInput}
              value={filterParams.capacityRange.minimum}
              onChangeText={(text) => setFilterParams(prev => ({...prev, capacityRange: {...prev.capacityRange, minimum: text}}))}
              placeholder="Minimum"
              keyboardType="numeric"
            />
            <Text style={styles.capacitySeparator}>-</Text>
            <TextInput
              style={styles.capacityInput}
              value={filterParams.capacityRange.maximum}
              onChangeText={(text) => setFilterParams(prev => ({...prev, capacityRange: {...prev.capacityRange, maximum: text}}))}
              placeholder="Maximum"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.capacityPresetsContainer}>
            {['0~5', '5~9', '9~16', '16~30', '30~100', '100~500', '500Above'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.capacityPresetButton,
                  filterParams.capacityPresets.includes(range) && styles.capacityPresetButtonSelected
                ]}
                onPress={() => {
                  const newPresets = filterParams.capacityPresets.includes(range)
                    ? filterParams.capacityPresets.filter(r => r !== range)
                    : [...filterParams.capacityPresets, range];
                  setFilterParams(prev => ({...prev, capacityPresets: newPresets}));
                }}
              >
                <Text style={[
                  styles.capacityPresetText,
                  filterParams.capacityPresets.includes(range) && styles.capacityPresetTextSelected
                ]}>{range}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Region</Text>
          <TextInput
            style={styles.capacityInput}
            value={filterParams.region}
            onChangeText={(text) => setFilterParams(prev => ({...prev, region: text}))}
            placeholder="Enter region"
          />

          <Text style={styles.filterSectionTitle}>Follow</Text>
          <View style={styles.filterRadioGroup}>
            <TouchableOpacity
              style={styles.filterRadioButton}
              onPress={() => setFilterParams(prev => ({...prev, plantFollowed: !prev.plantFollowed}))}
            >
              <View style={[styles.filterRadio, filterParams.plantFollowed && styles.filterRadioSelected]}>
                {filterParams.plantFollowed && <View style={styles.filterRadioInner} />}
              </View>
              <Text style={styles.filterRadioText}>Plant I followed</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.filterSectionTitle}>Tag</Text>
          <TextInput
            style={styles.capacityInput}
            value={filterParams.tag}
            onChangeText={(text) => setFilterParams(prev => ({...prev, tag: text}))}
            placeholder="Enter tag"
          />

          <Text style={styles.filterSectionTitle}>On-grid Status</Text>
          <View style={styles.filterRadioGroup}>
            {['On-grid', 'Not on-grid'].map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.filterRadioButton}
                onPress={() => setFilterParams(prev => ({...prev, onGridStatus: status}))}
              >
                <View style={[styles.filterRadio, filterParams.onGridStatus === status && styles.filterRadioSelected]}>
                  {filterParams.onGridStatus === status && <View style={styles.filterRadioInner} />}
                </View>
                <Text style={styles.filterRadioText}>{status}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>System Type</Text>
          <View style={styles.filterRadioGroup}>
            {['PV+Grid', 'PV+Grid+Consumption', 'PV+Grid+Consumption+Battery'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.filterRadioButton}
                onPress={() => setFilterParams(prev => ({...prev, systemType: type}))}
              >
                <View style={[styles.filterRadio, filterParams.systemType === type && styles.filterRadioSelected]}>
                  {filterParams.systemType === type && <View style={styles.filterRadioInner} />}
                </View>
                <Text style={styles.filterRadioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Plant Type</Text>
          <View style={styles.filterRadioGroup}>
            {['Residential', 'Commercial', 'Industrial', 'Ground Mounted'].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.filterRadioButton}
                onPress={() => setFilterParams(prev => ({...prev, plantType: type}))}
              >
                <View style={[styles.filterRadio, filterParams.plantType === type && styles.filterRadioSelected]}>
                  {filterParams.plantType === type && <View style={styles.filterRadioInner} />}
                </View>
                <Text style={styles.filterRadioText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity 
            style={styles.filterResetButton}
            onPress={resetFilters}
          >
            <Text style={styles.filterResetText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterConfirmButton}
            onPress={() => {
              applyFilters(filterParams);
              setShowFilterModal(false);
            }}
          >
            <Text style={styles.filterConfirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderParamsModal = () => (
    <Modal
      visible={showParamsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowParamsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.closeIconContainer}
            onPress={() => setShowParamsModal(false)}
          >
            <Icon name="close" size={24} color="#ff0000" />
          </TouchableOpacity>
          <View style={styles.paramsOptionsContainer}>
            {[
              'Name, Power, Daily, Capacity',
              'Name, Power, kW/kWp, kWh/kWp',
              'Name, Daily, Monthly, Total'
            ].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.paramsOptionButton,
                  selectedOption === option && styles.selectedOptionButton
                ]}
                onPress={() => {
                  setSelectedOption(option);
                  setShowParamsModal(false);
                }}
              >
                <Text
                  style={[
                    styles.paramsOptionText,
                    selectedOption === option && styles.selectedOptionText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const updateMonitorPage = () => {
    console.log('Navigating to Monitor page with updated parameters');
  };

  const handleSort = (criteria) => {
    setSortCriteria(criteria);
    setSortOrder((prevOrder) => ({
      ...prevOrder,
      [criteria]: prevOrder[criteria] === 'asc' ? 'desc' : 'asc',
    }));
    sortPlants(criteria);
  };

  const applyFilters = (params) => {
    console.log('Applying filters:', params);
    
    const filteredPlants = plants.filter(plant => {
      if (params.plantDisplay !== 'All') {
        if (params.plantDisplay === 'Plants created by this business' && !plant.createdByBusiness) {
          return false;
        } else if (params.plantDisplay === 'Plants authorized to this business' && !plant.authorizedToBusiness) {
          return false;
        }
      }
      
      if (params.capacityRange.minimum && plant.capacity < parseFloat(params.capacityRange.minimum)) {
        return false;
      }
      if (params.capacityRange.maximum && plant.capacity > parseFloat(params.capacityRange.maximum)) {
        return false;
      }
      
      if (params.capacityPresets.length > 0) {
        const capacity = plant.capacity || 0;
        let matchesPreset = false;
        
        for (const preset of params.capacityPresets) {
          const [min, max] = preset.split('~').map(val => {
            return val.toLowerCase() === 'above' ? Infinity : parseFloat(val);
          });
          
          if (capacity >= min && (max === Infinity || capacity <= max)) {
            matchesPreset = true;
            break;
          }
        }
        
        if (!matchesPreset) return false;
      }
      
      if (params.region && plant.region !== params.region) {
        return false;
      }
      
      if (params.plantFollowed && !plant.followed) {
        return false;
      }
      
      if (params.tag && (!plant.tags || !plant.tags.includes(params.tag))) {
        return false;
      }
      
      if (params.onGridStatus) {
        const isOnGrid = params.onGridStatus === 'On-grid';
        if (plant.onGrid !== isOnGrid) {
          return false;
        }
      }
      
      if (params.systemType && plant.systemType !== params.systemType) {
        return false;
      }
      
      if (params.plantType && plant.plantType !== params.plantType) {
        return false;
      }
      
      return true;
    });
    
    setPlants(filteredPlants);
  };

  const resetFilters = () => {
    setFilterParams({
      plantDisplay: 'All',
      capacityRange: {
        minimum: '',
        maximum: ''
      },
      capacityPresets: [],
      region: '',
      follow: false,
      plantFollowed: false,
      tag: '',
      onGridStatus: '',
      systemType: '',
      plantType: ''
    });
    
    fetchPlantsAndStats();
  };

  const getStatusStyle = (on_grid_status, plantId, system_type) => {
    // Use on_grid_status from API and cross-reference with ID lists from the new API

    let statusObject = {};

    if (incompletePlantIds.includes(plantId)) {
      statusObject = { color: '#FFC107', text: 'Incomplete' }; // Amber for Incomplete
    } else {
      const statusString = String(on_grid_status).toLowerCase(); // Handle potential variations
      switch (statusString) {
        case 'online': 
          statusObject = { color: '#4CAF50', text: 'Online' }; 
          break;
        case 'offline': 
          if (onlinePlantIdsFromApi.includes(plantId)) {
            statusObject = { color: '#4CAF50', text: 'Online' }; // Corrected to Online by new API
          } else {
            statusObject = { color: '#FF9800', text: 'Offline' }; // Orange for Offline
          }
          break;
        case 'unknown':
        default:
          if (onlinePlantIdsFromApi.includes(plantId)) {
            statusObject = { color: '#4CAF50', text: 'Online' };
          } else if (offlinePlantIdsFromApi.includes(plantId)) {
            statusObject = { color: '#FF9800', text: 'Offline' }; 
          } else {
            statusObject = { color: '#757575', text: on_grid_status || 'Unknown' }; 
          }
          break;
      }
    }
    // Add system_type to the returned object if it exists
    if (system_type && system_type !== '--') {
      statusObject.system_type = system_type;
    }
    return statusObject;
  };

  // Map display names to actual API data keys and units
  const parameterMap = {
    // 'Name': { key: 'name', unit: '' }, // Name is handled in header
    'Power': { key: 'solar_power', unit: 'kW' },
    'Daily': { key: 'daily_production', unit: 'kWh' }, 
    'Capacity': { key: 'capacity', unit: 'kWp' }, // Using API key 'capacity'
    // Assuming peak_hours_today maps to kWh/kWp display based on screenshot param name
    'kWh/kWp': { key: 'peak_hours_today', unit: 'h' }, // API value is hours, matching screenshot unit
    // Assuming power_normalized maps to kW/kWp display based on screenshot param name 
    'kW/kWp': { key: 'power_normalized', unit: '%' }, // API value units unclear, matching screenshot unit
    // Add Monthly/Total - Keys don't exist in API, will show '--' via getSafeValue
    'Monthly': { key: 'monthly_production_api', unit: 'kWh'}, 
    'Total': { key: 'total_production_api', unit: 'kWh'}, 
  };
  
  // Helper to safely get nested values
  const getSafeValue = (obj, key, defaultValue = '--') => {
     // Check if obj exists and key is valid
     if (!obj || typeof key === 'undefined' || key === null) {
       return defaultValue;
     }
     const value = obj[key];
     // Return value if it exists and is not empty string, otherwise defaultValue
     return value !== null && value !== undefined && value !== '' ? value : defaultValue;
  };

  const renderPlantItem = ({ item }) => {
    const currentPlantId = item._id || item.id; // Determine the correct plant ID field
    const statusInfo = getStatusStyle(item.on_grid_status, currentPlantId, item.system_type);

    return (
      <TouchableOpacity
        style={styles.plantCard}
        onPress={() => {
          if (!currentPlantId || !item.name) {
            Alert.alert('Error', 'Plant data is missing.');
            return;
          }
          navigation.navigate('PlantTabs', {
          // Pass params to the PlantTabs navigator itself
          plantId: currentPlantId, 
          plantName: item.name, // <-- Add plantName here
          // Specify the initial screen and its params
          screen: 'Dashboard', 
          params: { 
            plantId: currentPlantId, 
            plantName: item.name 
          },
          })
        }
      }
        // onLongPress={() => { /* Optional: Add long press actions */ }}
      >
        {/* Plant Image */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          {/* Placeholder Icon Container (Fixed Size) - Image removed */}
          <View style={{ width: 60, height: 60, marginRight: 12, borderRadius: 8, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }}>
             <Icon name="eco" size={30} color="#4CAF50" />
          </View>
          
          {/* Info Column */}
          <View style={{ flex: 1 }}>
            <Text style={styles.plantName}>{getSafeValue(item, 'name', 'Unnamed Plant')}</Text>
            {/* Status Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {/* On-Grid Status */}
              <Icon name="circle" size={10} color={statusInfo.color} style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 12, color: statusInfo.color, marginRight: 10 }}>
                {statusInfo.text}
              </Text>
            </View>
            {/* Plant Type & System Type */}
            {(item.plant_type || (statusInfo.system_type || 'PV+GRID')) && (
              <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                {item.plant_type ? String(getSafeValue(item, 'plant_type')).toUpperCase() : ''}
                {item.plant_type && (statusInfo.system_type || 'PV+GRID') ? ' - ' : ''}
                {(statusInfo.system_type ? String(statusInfo.system_type) : 'PV+GRID').toUpperCase()}
              </Text>
            )}
          </View>

          {/* Favorite Star REMOVED */}
        </View>
        
        {/* --- Dynamic Data Grid Section (Inline Styles) --- */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 }}>
          {selectedOption.split(', ').map((paramName, index) => {
            const paramConfig = parameterMap[paramName];
            // Skip if param not in map or if it's 'Name' (already in header)
            if (!paramConfig) return null; 

            const value = getSafeValue(item, paramConfig.key);
            const unit = paramConfig.unit ? ` ${paramConfig.unit}` : '';

            return (
              <View key={`${currentPlantId}-${paramConfig.key}-${index}`} style={{ width: '33%', paddingHorizontal: 4, marginBottom: 8 }}> 
                <Text style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{paramName}</Text>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: '500' }}>{value}{unit}</Text>
              </View>
            );
          })}
        </View>

        {/* --- Footer Section RE-ADDED --- */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' }}>
          <Icon name="calendar-today" size={12} color="#666" style={{marginRight: 5}}/>
          <Text style={{ fontSize: 11, color: '#666' }}>
             Last update: {getSafeValue(item, 'last_update')} 
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#00875A" />
          <Text style={styles.emptyStateText}>Loading plants...</Text>
        </View>
      );
    }
    
    if (serverDown) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="cloud-off" size={64} color="#999" />
          <Text style={styles.emptyStateText}>Server unreachable</Text>
          <Text style={styles.emptyStateSubText}>Please check your connection and try again</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPlantsAndStats}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyStateContainer}>
        <Icon name="solar-power" size={64} color="#00875A" />
        <Text style={styles.emptyStateText}>No plants found</Text>
        <Text style={styles.emptyStateSubText}>Could not retrieve plant list from the server.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { flex: 1 }]}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      {/* AppBar with Centered Title and Add Icon */}
      <View style={styles.appBar}>
        <View style={styles.iconButton} />{/* Left Spacer */}
        <Text style={styles.appBarTitle}>Monitor</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('AddPlant')} // Assuming you want to navigate to AddPlant
          style={styles.iconButton} // You might need to adjust styling
        >
          <Icon name="add-circle-outline" size={24} color="#333" /> 
        </TouchableOpacity>
      </View>

      <View style={monitorTabStyles.mainTabBar}>
        {['Plants', 'Devices'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              monitorTabStyles.mainTabItem,
              activeMainTab === tab && monitorTabStyles.activeMainTabItem
            ]}
            onPress={() => setActiveMainTab(tab)}
          >
            <Icon 
              name={tab === 'Plants' ? 'eco' : 'devices'} 
              size={20} 
              color={activeMainTab === tab ? '#ff0000' : '#666'} 
            />
            <Text style={[
              monitorTabStyles.mainTabText,
              activeMainTab === tab && monitorTabStyles.activeMainTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {activeMainTab === 'Plants' ? (
        <>
          <View style={styles.tabBar}>
            <TouchableOpacity 
              style={styles.tabItem} 
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.sortTabText}>{selectedStatus}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={styles.sortTabText}>Filter</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.tabItem}
              onPress={() => setShowParamsModal(true)}
            >
              <Text style={styles.sortTabText}>Params</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {selectedOption.split(', ').map((label, index) => {
              const lowerLabel = label.toLowerCase();
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.sortTabItem}
                  onPress={() => handleSort(lowerLabel)}
                >
                  <Text style={styles.sortTabText}>
                    {label}
                  </Text>
                  <Icon
                    name="arrow-drop-up"
                    size={16}
                    color={sortOrder[lowerLabel] === 'asc' ? '#ff0000' : '#666'}
                  />
                  <Icon
                    name="arrow-drop-down"
                    size={16}
                    color={sortOrder[lowerLabel] === 'desc' ? '#ff0000' : '#666'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {renderStatusModal()}
          {renderParamsModal()}
          {renderFilterModal()}

          <FlatList
            data={plants}
            keyExtractor={(item) => String(item.id || item._id || Math.random())}
            renderItem={renderPlantItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={plants.length === 0 ? { flex: 1 } : { paddingBottom: 20, paddingTop: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  fetchPlantsAndStats();
                }}
                colors={['#00875A']}
              />
            }
          />
        </>
      ) : (
        <DevicesPage navigation={navigation} />
      )}
    </SafeAreaView>
  );
};

const monitorTabStyles = StyleSheet.create({
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  mainTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeMainTabItem: {
    borderBottomColor: '#ff0000',
  },
  mainTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeMainTabText: {
    color: '#ff0000',
    fontWeight: 'bold',
  },
});

const localStyles = StyleSheet.create({
  plantCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  plantCardExpanded: {
    elevation: 3,
    shadowOpacity: 0.2,
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantIconContainer: {
    marginRight: 10,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  plantLocation: {
    fontSize: 14,
    color: '#666',
  },
  plantStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  plantSummary: {
    padding: 10,
  },
  plantSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  plantSummaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  plantSummaryValue: {
    fontSize: 14,
    color: '#666',
  },
  expandedContent: {
    padding: 10,
  },
  detailSection: {
    marginBottom: 10,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  plantDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailColumn: {
    flex: 1,
  },
  detailItem: {
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  detailValue: {
    fontSize: 14,
    color: '#666',
  },
  plantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00875A',
    padding: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusOnline: {
    color: '#4CAF50',  // Green
  },
  statusOffline: {
    color: '#F44336',  // Red
  },
  statusMaintenance: {
    color: '#FF9800',  // Orange
  },
  statusWarning: {
    color: '#FFC107',  // Amber
  },
  statusError: {
    color: '#F44336',  // Red
  },
  statusUnknown: {
    color: '#9E9E9E',  // Gray
  },
});

const additionalStyles = StyleSheet.create({
  loginPromptBar: {
    backgroundColor: '#3498db', // Blue color
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loginPromptText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
});

export default MonitorPage;