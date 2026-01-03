import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import dataManager from '../utils/dataManager';
import styles from '../styles/style'; // Use global styles
import InfoCard from '../componenst/InfoCard'; 

const AboutPlantScreen = ({ route, navigation }) => {
  const { plantId } = route.params;
  const [plantDetails, setPlantDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Plant Details Logic (Copied from PlantDetailScreen)
  useEffect(() => {
    const fetchDetails = async () => {
      if (!plantId) {
        setError('No Plant ID provided');
        setLoading(false);
        return;
      }
      console.log(`AboutPlantScreen: Fetching details for plantId: ${plantId}`);
      setLoading(true);
      setError(null);
      const result = await dataManager.getPlantDetails(plantId);
      if (result.success) {
        setPlantDetails(result.data);
      } else {
        setError(result.error || 'Failed to load plant details.');
      }
      setLoading(false);
    };
    fetchDetails();
  }, [plantId]);

  if (loading) {
    return (
      <SafeAreaView style={localStyles.container}> 
        <View style={localStyles.centeredContent}>
          <ActivityIndicator size="large" color="#00875A" />
          <Text>Loading Plant Information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
       <SafeAreaView style={localStyles.container}> 
         <View style={localStyles.centeredContent}>
           <Icon name="error-outline" size={30} color="#D32F2F" />
           <Text style={localStyles.errorText}>{error}</Text>
           {/* Add a retry button? */}
         </View>
       </SafeAreaView>
    );
  }

  if (!plantDetails) {
     return (
       <SafeAreaView style={localStyles.container}> 
         <View style={localStyles.centeredContent}>
            <Text>Plant details not found.</Text>
          </View>
       </SafeAreaView>
     );
  }

  // Calculate card width (optional, or let them stack vertically)
  // const screenWidth = Dimensions.get('window').width;
  // const cardWidth = (screenWidth - 48) / 2; // Example if using side-by-side

  return (
    <SafeAreaView style={localStyles.container}>
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>{plantDetails?.name || 'About Plant'}</Text>
        <View style={{ width: 30 }} />{/* Spacer */}
      </View>

      <ScrollView contentContainerStyle={localStyles.scrollViewContent}>
          {/* Info Cards Section (Moved from PlantDetailScreen) */}
           {/* Plant Details */}
           <InfoCard title="Plant Details" style={localStyles.cardMargin}> 
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Capacity:</Text> {plantDetails.capacity || 'N/A'} kWp</Text>
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Type:</Text> {plantDetails.plant_type || 'N/A'}</Text>
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>System:</Text> {plantDetails.system_type || 'N/A'}</Text>
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Created:</Text> {plantDetails.creation_date || 'N/A'}</Text>
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Grid Status:</Text> {plantDetails.on_grid_status || 'N/A'}</Text>
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>On Grid Date:</Text> {plantDetails.on_grid_date || 'N/A'}</Text>
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Last Update:</Text> {plantDetails.last_update || 'N/A'}</Text>
           </InfoCard>
           
          {/* Location */}
          <InfoCard title="Location" style={localStyles.cardMargin}> 
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Address:</Text> {plantDetails.address || 'N/A'}</Text>
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Coordinates:</Text> {plantDetails.location || 'N/A'}</Text> 
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Azimuth:</Text> {plantDetails.azimuth || 'N/A'}°</Text>
             <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Tilt Angle:</Text> {plantDetails.tilt_angle || 'N/A'}°</Text>
           </InfoCard>
           
          {/* Contact Info */}
          <InfoCard title="Contact Information" style={localStyles.cardMargin}> 
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Contact Person:</Text> {plantDetails.contact_person || 'N/A'}</Text>
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Contact Number:</Text> {plantDetails.contact_number || 'N/A'}</Text>
              <Text style={localStyles.detailText}><Text style={localStyles.detailLabel}>Business Name:</Text> {plantDetails.business_name || 'N/A'}</Text>
          </InfoCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollViewContent: {
    padding: 16, 
  },
  cardMargin: {
      marginBottom: 16, // Stack cards vertically with margin
  },
  centeredContent: {
    flex: 1, // Take up available space
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
  },
  detailText: { 
    fontSize: 14, // Slightly larger text
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  detailLabel: { 
    fontWeight: 'bold', 
    color: '#555', // Slightly less prominent label
    marginRight: 5,
  },
});

export default AboutPlantScreen; 