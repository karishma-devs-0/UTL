import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AttachSnImageScreen = ({ navigation, route }) => {
  const { plantId } = route.params || {};
  const [imageUri, setImageUri] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestCameraPermission = async () => {
    // No need to ask for MediaLibrary permission if only using camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take a picture of the SN.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setPermissionDenied(true) },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    setPermissionDenied(false); // Reset if permission granted
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Adjust if needed
        aspect: [4, 3], // Optional aspect ratio
        quality: 0.7, // Reduce quality slightly for faster upload/handling
      });

      // Check if the result includes assets and the first asset has a uri
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        console.log("Image Picker Result URI:", result.assets[0].uri);
        setImageUri(result.assets[0].uri);
        // Proceed to the next step after taking photo
        navigateToDataloggerForm(result.assets[0].uri);
      } else if (result.canceled) {
         console.log('User cancelled camera');
      } else {
         console.log('Image Picker Result:', result); // Log the full result if URI is missing
         Alert.alert('Error', 'Could not get image URI.');
      }
    } catch (error) {
        console.error("Error launching camera:", error);
        Alert.alert('Camera Error', 'An error occurred while trying to open the camera.');
    }
  };

  const navigateToDataloggerForm = (uri = null) => {
      // Navigate to AddDataloggerScreen. We pass the plantId.
      // Passing the image URI is optional, the main goal is capture -> manual entry.
      navigation.navigate('AddDatalogger', {
          plantId: plantId,
          imageUri: uri // Optionally pass URI if AddDataloggerScreen needs it
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attach SN Image</Text>
        <View style={{ width: 50 }} /> {/* Spacer */}
      </View>

      <View style={styles.content}>
        <Icon name="camera-alt" size={80} color="#CCC" style={styles.icon} />
        <Text style={styles.infoText}>
          Take a clear picture of the datalogger's Serial Number (SN) label.
        </Text>
        <Text style={styles.infoSubText}>
          You will enter the SN manually on the next screen.
        </Text>

        {permissionDenied && (
           <Text style={styles.errorText}>
               Camera permission is required. Please enable it in settings.
           </Text>
        )}

        {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.previewLabel}>Image Preview:</Text>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {/* Optionally add button to retake */}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
          <Icon name="photo-camera" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Open Camera</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
      marginBottom: 20,
  },
  infoText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSubText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorText: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#00875A', // Use theme color
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  imagePreviewContainer: {
      alignItems: 'center',
      marginVertical: 20,
  },
   previewLabel: {
      fontSize: 14,
      color: '#555',
      marginBottom: 5,
  },
  imagePreview: {
    width: 200,
    height: 150, // Adjust aspect ratio if needed
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#DDD',
  },
});

export default AttachSnImageScreen; 