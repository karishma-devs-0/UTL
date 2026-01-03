import React from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SafeGoogleMapComponent = ({
  formData = {},
  markerLat,
  markerLng,
  handleLocationSelect = () => {},
}) => {
  const selectedLocation = formData.selectedLocation || DEFAULT_REGION;
  const showMarker = markerLat != null && markerLng != null;

  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    handleLocationSelect({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE} 
        style={styles.map}
        initialRegion={selectedLocation}
        region={selectedLocation}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {showMarker && (
          <Marker
            coordinate={{
              latitude: Number(markerLat),
              longitude: Number(markerLng),
            }}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
});

export default SafeGoogleMapComponent;
