import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';


import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import styles from '../styles/style';
import dataManager from '../utils/dataManager.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SafeMapComponent from './SafeMapComponent';
// Add ins styles for AddPlant screen only
const addPlantStyles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
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
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: '#ff0000',
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  saveButton: {
    backgroundColor: '#ff0000',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  locationButtonLeft: {
    marginRight: 5,
  },
  locationButtonRight: {
    marginLeft: 5,
    backgroundColor: '#e8f4ff',
  },
  locationButtonTextBlue: {
    color: '#0066cc',
  }
};

const AddPlantPage = ({ navigation, route }) => {
  // Initialize with empty object if no plantData is provided
  const { editMode, plantData } = route.params || {};

  // Initialize state with default values or existing plant data
  const [formData, setFormData] = useState({
    name: plantData?.name || '',
    location: plantData?.location || '',
    address: plantData?.address || '',
    capacity: plantData?.capacity || '',
    systemType: plantData?.system_type || 'pv + grid',
    plantType: plantData?.plant_type || 'residential',
    azimuth: plantData?.azimuth || '',
    tiltAngle: plantData?.tilt_angle || '',
    contactPerson: plantData?.contact_person || '',
    contactNumber: plantData?.contact_number || '',
    businessName: plantData?.business_name || '',
    onGridDate: plantData?.on_grid_date || '',
    onGridStatus: plantData?.on_grid_status || 'PV + Grid',
    coordinates: plantData?.coordinates || { latitude: '1.6340', longitude: '74.8723' },
    isLoadingLocation: false,
    isMapVisible: false,
    selectedLocation: {
      latitude: 31.6340,
      longitude: 74.8723,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
  });

  // Add loading state
  const [isLoading, setIsLoading] = useState(false);

  const plantTypes = ['residential', 'commercial', 'industrial', 'ground mounted'];
  const systemTypes = [
    'pv + grid',
    'pv + grid + consumption',
    'pv + grid + consumption + Battery'
  ];

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to add an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, plantImage: { uri: result.assets[0].uri } }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Add function to get current location with better error handling
  const getCurrentLocation = async () => {

    try {
      setFormData(prev => ({ ...prev, isLoadingLocation: true }));
      console.log("Starting location fetch process...");

      // Clear existing values to show loading state
      setFormData(prev => ({ ...prev, location: "", region: "", address: "" }));

      // Check location permissions
      console.log("Requesting location permissions...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature');
        setFormData(prev => ({ ...prev, isLoadingLocation: false }));
        return;
      }

      // Get device coordinates with timeout
      console.log("Getting current position...");
      let locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      // Add timeout to location request
      const locationTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Location request timed out')), 15000)
      );

      // Race between location request and timeout
      let location;
      try {
        location = await Promise.race([locationPromise, locationTimeout]);
      } catch (error) {
        console.error('Position error:', error.message);
        Alert.alert(
          'Location Error',
          'Could not get your current location. Please check if location services are enabled.',
          [
            { text: 'Try Again', onPress: getCurrentLocation },
            { text: 'Cancel', onPress: () => setFormData(prev => ({ ...prev, isLoadingLocation: false })) }
          ]
        );
        return;
      }

      const { latitude, longitude } = location.coords;

      // Set coordinates immediately so they're visible
      console.log(`Got coordinates: ${latitude}, ${longitude}`);
      setFormData(prev => ({
        ...prev,
        coordinates: {
          latitude: Number(latitude.toFixed(4)),
          longitude: Number(longitude.toFixed(4))
        },

        selectedLocation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }
      }));

      // Try reverse geocoding
      console.log("Getting address from coordinates...");
      try {
        let addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });

        if (addressResponse && addressResponse[0]) {
          const address = addressResponse[0];
          console.log("Got address:", address);
          setFormData(prev => ({
            ...prev,
            location: address.city || '',
            region: address.region || address.subregion || '',
            address: [
              address.street,
              address.city,
              address.region,
              address.postalCode,
              'India'
            ].filter(Boolean).join(', '),

            // Set coordinates again (just to be safe)
            coordinates: {
              latitude: latitude.toFixed(4),
              longitude: longitude.toFixed(4)
            }
          }));
        } else {
          console.log("No address found for these coordinates");
          // Set default location name if geocoding fails
          setFormData(prev => ({
            ...prev,
            location: "Unknown Location",
            region: "",
            address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }));
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // If geocoding fails, at least show the coordinates
        setFormData(prev => ({
          ...prev,
          location: "Unknown Location",
          address: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your location. Please try again or enter location manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setFormData(prev => ({ ...prev, isLoadingLocation: false }));
    }
  };

  // Replace the existing useEffect with this enhanced version
  useEffect(() => {
    // Function to retry location fetching if it fails initially
    const initializeLocation = async () => {
      if (!editMode) {
        // Clear any existing retry attempts
        if (window.locationRetryTimeout) {
          clearTimeout(window.locationRetryTimeout);
        }

        // Start location fetch
        try {
          console.log("Initial location fetch");
          await getCurrentLocation();
        } catch (error) {
          console.error("Initial location fetch failed:", error);
          // If the first attempt fails, try once more after a delay
          window.locationRetryTimeout = setTimeout(async () => {
            console.log("Retrying location fetch automatically");
            try {
              await getCurrentLocation();
            } catch (retryError) {
              console.error("Retry location fetch failed:", retryError);
              // Just clear the loading state if retry fails
              setFormData(prev => ({ ...prev, isLoadingLocation: false }));
            }
          }, 3000);
        }
      } else {
        // For edit mode, set coordinates from existing plant data
        if (plantData.coordinates) {
          setFormData(prev => ({
            ...prev,
            coordinates: {
              latitude: plantData.coordinates.latitude.toFixed(4),
              longitude: plantData.coordinates.longitude.toFixed(4)
            }
          }));
        }
        setFormData(prev => ({ ...prev, isLoadingLocation: false }));
      }
    };

    initializeLocation();

    // Clean up any pending timeouts when component unmounts
    return () => {
      if (window.locationRetryTimeout) {
        clearTimeout(window.locationRetryTimeout);
      }
    };
  }, []);

  // Function to handle map location selection
  const handleLocationSelect = async (event) => {
    /*
    if (!event?.nativeEvent || !event.nativeEvent.coordinate) {
      console.warn('Invalid map press event:', event);
      return;
    }

    const { coordinate } = event.nativeEvent;
    */
    let coordinate = null;

    // Google/OSM map tap: nativeEvent structure
    if (event?.nativeEvent?.coordinate) {
      coordinate = event.nativeEvent.coordinate;
    }
    // Direct coordinate object (e.g., from manual call or Google quirk)
    else if (
      typeof event?.latitude === 'number' &&
      typeof event?.longitude === 'number'
    ) {
      coordinate = event;
    }
    else {
      console.warn('Invalid map press event:', event);
      return;
    }
    console.log('Selected coordinates:', coordinate);

    setFormData(prev => ({
      ...prev,
      coordinates: {
        latitude: Number(coordinate.latitude.toFixed(4)),
        longitude: Number(coordinate.longitude.toFixed(4))
      },
      selectedLocation: {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: prev.selectedLocation?.latitudeDelta || 0.0922,
        longitudeDelta: prev.selectedLocation?.longitudeDelta || 0.0421
      }
    }));

    // reverseGeocode(coordinate.latitude, coordinate.longitude);
    try {
      console.log('Reverse geocoding:');
      await reverseGeocode(coordinate.latitude, coordinate.longitude);
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
  };
``
  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (addressResponse?.length > 0) {
        const address = addressResponse[0];

        setFormData(prev => ({
          ...prev,
          region: address.region || address.subregion || '',
          address: [
            address.street,
            address.city,
            address.region,
            address.postalCode,
            'India',
          ].filter(Boolean).join(', '),
        }));
      } else {
        console.warn('No address found for location.');
      }
    } catch (error) {
      console.error('Geocoding error:', error); // ✅ properly declared
    }
  };

  // Add this useEffect near the beginning of your component
  useEffect(() => {
    // Check for authentication token when component mounts
    const checkAndFixAuth = async () => {
      try {
        // Try multiple ways to get the token
        let token = await AsyncStorage.getItem('authToken');

        // If no token found, check for user object that might contain token
        if (!token) {
          const userString = await AsyncStorage.getItem('user');
          if (userString) {
            try {
              const user = JSON.parse(userString);
              token = user.token || user.authToken;

              // If we found a token in user object, save it properly
              if (token) {
                await AsyncStorage.setItem('authToken', token);
                console.log('Found token in user object and saved it properly');
              }
            } catch (e) {
              console.log('Failed to parse user object:', e);
            }
          }
        }

        // Remove or comment out the alert for auth status
        // Alert.alert('Auth Check', token ? 'Found authentication token' : 'No authentication token found');
      } catch (err) {
        console.log('Error in auth check:', err);
      }
    };

    //checkAndFixAuth();
  }, []);

  // Replace your handleSave function with this one
  const handleSave = async () => {
    setIsLoading(true);

    // --- Validation --- 
    const requiredFields = [];
    if (!formData.name.trim()) {
      requiredFields.push('Plant Name');
    }
    if (!formData.capacity || isNaN(parseFloat(formData.capacity))) {
      requiredFields.push('Capacity (kWp)');
    }
    // Add validation for Azimuth and Tilt Angle
    if (!formData.azimuth || isNaN(parseFloat(formData.azimuth))) {
      requiredFields.push('Azimuth');
    }
    if (!formData.tiltAngle || isNaN(parseFloat(formData.tiltAngle))) {
      requiredFields.push('Tilt Angle');
    }

    // If any required fields are missing/invalid, show an alert
    if (requiredFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please provide valid values for the following required fields: ${requiredFields.join(', ')}`
      );
      setIsLoading(false);
      return;
    }

    // Helper function to parse float or return null (now only used for non-required fields if any)
    const parseFloatOrKeep = (value) => {
      if (value === null || value === undefined || String(value).trim() === '') {
        // This case should be caught by validation above for required fields
        return value; // Or handle error, though validation should prevent this
      }
      const number = parseFloat(value);
      return isNaN(number) ? value : number; // Return original if NaN, validation handles if it's required
    };

    // Parse required numeric fields directly after validation
    const validatedCapacity = parseFloat(formData.capacity);
    const validatedAzimuth = parseFloat(formData.azimuth);
    const validatedTiltAngle = parseFloat(formData.tiltAngle);

    // --- Determine On Grid Status --- 
    let onGridStatusValue;
    switch (formData.systemType) {
      case 'pv + grid':
        onGridStatusValue = 'PV + Grid';
        break;
      case 'pv + grid + consumption':
        onGridStatusValue = 'PV + Grid + Consumption';
        break;
      case 'pv + grid + consumption + Battery':
        onGridStatusValue = 'PV + Grid + Consumption + Battery';
        break;
      default:
        onGridStatusValue = formData.systemType; // Pass through if unknown, API might handle it
    }

    // --- Prepare Final Payload Directly ---
    const finalPayload = {
      name: formData.name.trim(),
      capacity: validatedCapacity,
      azimuth: validatedAzimuth,
      tilt_angle: validatedTiltAngle,
      location: formData.location?.trim() || null,
      address: formData.address?.trim() || null,
      contact_person: formData.contactPerson?.trim() || null,
      contact_number: formData.contactNumber?.trim() || null,
      business_name: formData.businessName?.trim() || null,
      plant_type: formData.plantType,
      system_type: formData.systemType,
      on_grid_status: onGridStatusValue,
      // on_grid_date is handled below based on mode
      // coordinates: (formData.coordinates.latitude && formData.coordinates.longitude) ? formData.coordinates : null,
    };

    // --- Mode-Specific Payload Adjustments ---
    if (editMode && plantData?.id) {
      // --- EDIT MODE --- 
      finalPayload.id = plantData.id;
      // Preserve the original on_grid_date from loaded plant data
      finalPayload.on_grid_date = plantData.on_grid_date || null;
      // Exclude creation_date for updates, backend likely handles this
    } else {
      // --- CREATE MODE ---
      // Add creation_date only for new plants
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`; // YYYY-MM-DD

      finalPayload.creation_date = formattedDate; // Set creation date
      finalPayload.on_grid_date = formattedDate; // Set on_grid_date to today for new plants
    }

    console.log(`Final Payload (Edit Mode: ${editMode}): ${JSON.stringify(finalPayload, null, 2)}`);

    // --- Call DataManager --- 
    try {
      let result;
      const successMessage = editMode ? 'Plant updated successfully!' : 'Plant added successfully!';
      const offlineMessage = editMode ? 'Plant update saved locally. Will sync when online.' : 'Plant saved locally. Will sync when online.';

      if (editMode) {
        // --- Update Mode --- 
        console.log('Calling dataManager.updatePlant with payload:', finalPayload);
        result = await dataManager.updatePlant(finalPayload); // Pass the final payload directly
      } else {
        // --- Create Mode Logic --- 
        console.log('Calling dataManager.createPlant with payload:', finalPayload);
        // Ensure ID is not present for creation
        delete finalPayload.id;
        result = await dataManager.createPlant(finalPayload); // Pass the final payload directly
      }

      // --- Handle Result --- 
      if (result.success) {
        Alert.alert(
          'Success',
          result.offline ? offlineMessage : successMessage,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else if (result.authRequired) {
        Alert.alert('Authentication Error', 'Please log in again to save changes.', [
          { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        const errorMessage = result.error || `Failed to ${editMode ? 'update' : 'save'} plant. Please check input values and try again.`;
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error(`Save error in handleSave (Edit Mode: ${editMode}):`, error);
      Alert.alert('Error', 'An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  const safeParse = (val, fallback, hardFallback) => {
    const num = parseFloat(val);
    if (isFinite(num)) return num;
    const fallbackNum = parseFloat(fallback);
    if (isFinite(fallbackNum)) return fallbackNum;
    // Hardcoded fallback (Amritsar, India)
    return hardFallback;
  };

  // In your MapModal, before rendering:

  const markerLat = safeParse(
    formData.coordinates.latitude,
    formData.selectedLocation.latitude,
    31.6340 // Amritsar latitude
  );
  const markerLng = safeParse(
    formData.coordinates.longitude,
    formData.selectedLocation.longitude,
    74.8723 // Amritsar longitude
  );

  // Set default region values
  const DEFAULT_REGION = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Set default marker position
  const DEFAULT_MARKER = {
    latitude: 0,
    longitude: 0,
  };
  // Add Map Modal Component
  /*
    const markerLat = formData.coordinates?.latitude ??
      formData.selectedLocation?.latitude ??
      31.6340; // Default to Amritsar if all else fails
  
    const markerLng = formData.coordinates?.longitude ??
      formData.selectedLocation?.longitude ??
      74.8723; // Default to Amritsar if all else fails
  */
  const MapModal = () => (
    <Modal
      visible={formData.isMapVisible}
      animationType="slide"
      onRequestClose={() => setFormData(prev => ({ ...prev, isMapVisible: false }))}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.mapHeader}>
          <TouchableOpacity
            onPress={() => setFormData(prev => ({ ...prev, isMapVisible: false }))}
            style={styles.mapCloseButton}
          >
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Select Location</Text>
        </View>

        <SafeMapComponent
          formData={formData}
          markerLat={markerLat}
          markerLng={markerLng}
          handleLocationSelect={handleLocationSelect}
        />

        <TouchableOpacity
          style={styles.confirmLocationButton}
          onPress={() => setFormData(prev => ({ ...prev, isMapVisible: false }))}
        >
          <Text style={styles.confirmLocationText}>Confirm Location</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );

  useEffect(() => {
    // Set navigation title based on mode
    navigation.setOptions({
      title: editMode ? 'Edit Plant' : 'Add Plant',
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode]);

  return (
    <SafeAreaView style={[styles.container, addPlantStyles.container]}>
      <View style={styles.addPlantHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.addPlantCancelButton}>
          <Text style={styles.addPlantCancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.addPlantHeaderTitle}>
          {editMode ? 'Edit Plant' : 'Create a Plant'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.addPlantScrollContent}>
        <Text style={styles.addPlantSectionHeader}>Basic Information</Text>

        <Text style={styles.text}>Plant Name*</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter plant name"
        />

        <Text style={styles.text}>Capacity (kWp)*</Text>
        <TextInput
          style={styles.input}
          value={String(formData.capacity)}
          onChangeText={(text) => setFormData(prev => ({ ...prev, capacity: text }))}
          placeholder="Enter plant capacity"
          keyboardType="numeric"
        />

        <Text style={styles.addPlantSectionHeader}>Location</Text>
        {/* TODO: Map and Current Location */}
        <View style={addPlantStyles.locationButtonsContainer}>
          <TouchableOpacity style={[addPlantStyles.locationButton, addPlantStyles.locationButtonLeft]} onPress={getCurrentLocation} disabled={formData.isLoadingLocation}>
            {formData.isLoadingLocation ? <ActivityIndicator size="small" /> : <Icon name="my-location" size={16} />}
            <Text style={styles.locationButtonText}> Get Current</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[addPlantStyles.locationButton, addPlantStyles.locationButtonRight]} onPress={() => setFormData(prev => ({ ...prev, isMapVisible: true }))}>
            <Icon name="map" size={16} color={addPlantStyles.locationButtonTextBlue.color} />
            <Text style={[styles.locationButtonText, addPlantStyles.locationButtonTextBlue]}> Select on Map</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.text}>City/Area</Text>
        <TextInput
          style={styles.input}
          value={formData.location}
          onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
          placeholder="e.g., Delhi"
        />

        <Text style={styles.text}>Address</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={formData.address}
          onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
          placeholder="Enter full address"
          multiline
        />
        <Text style={{ fontSize: 12, color: 'gray' }}>Coordinates: {formData.coordinates.latitude || '--'}, {formData.coordinates.longitude || '--'}</Text>

        <Text style={styles.addPlantSectionHeader}>Technical Details</Text>
        <Text style={styles.text}>System Type</Text>
        <View style={styles.systemTypeContainer}>
          {systemTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={styles.systemTypeRadio}
              onPress={() => setFormData(prev => ({ ...prev, systemType: type }))}
            >
              <View style={[styles.radio, formData.systemType === type && styles.radioSelected]} />
              <Text style={styles.systemTypeText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.text}>Plant Type</Text>
        <View style={styles.radioGroupContainer}>
          {plantTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={styles.radioButton}
              onPress={() => setFormData(prev => ({ ...prev, plantType: type }))}
            >
              <View style={[styles.radio, formData.plantType === type && styles.radioSelected]} />
              <Text style={styles.radioText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.text}>Azimuth (°)</Text>
        <TextInput
          style={styles.input}
          value={String(formData.azimuth)}
          onChangeText={(text) => setFormData(prev => ({ ...prev, azimuth: text }))}
          placeholder="Enter azimuth angle"
          keyboardType="numeric"
        />

        <Text style={styles.text}>Tilt Angle (°)</Text>
        <TextInput
          style={styles.input}
          value={String(formData.tiltAngle)}
          onChangeText={(text) => setFormData(prev => ({ ...prev, tiltAngle: text }))}
          placeholder="Enter tilt angle"
          keyboardType="numeric"
        />

        <Text style={styles.addPlantSectionHeader}>Contact Information</Text>
        <Text style={styles.text}>Contact Person</Text>
        <TextInput
          style={styles.input}
          value={formData.contactPerson}
          onChangeText={(text) => setFormData(prev => ({ ...prev, contactPerson: text }))}
          placeholder="Enter contact name"
        />
        <Text style={styles.text}>Contact Number</Text>
        <TextInput
          style={styles.input}
          value={formData.contactNumber}
          onChangeText={(text) => setFormData(prev => ({ ...prev, contactNumber: text }))}
          placeholder="Enter contact phone number"
          keyboardType="phone-pad"
        />
        <Text style={styles.text}>Business Name</Text>
        <TextInput
          style={styles.input}
          value={formData.businessName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
          placeholder="Enter associated business name"
        />

        <TouchableOpacity
          style={addPlantStyles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={addPlantStyles.saveButtonText}>
              {editMode ? 'Update Plant' : 'Save Plant'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <MapModal />

      {formData.isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Icon name="location-searching" size={36} color="#ff0000" />
            <Text style={styles.loadingText}>Getting location data...</Text>
            <Text style={styles.loadingSubText}>Please wait while we determine your coordinates</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AddPlantPage;