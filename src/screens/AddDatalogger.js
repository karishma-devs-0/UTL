import deviceService from '../services/deviceService';

const AddDataloggerScreen = ({ route, navigation }) => {
  // ... existing state (sno, loading, error, plantId)
  
  const handleRegister = async () => {
    if (!sno) {
      Alert.alert('Error', 'Please enter the Datalogger Serial Number.');
      return;
    }
    if (!plantId) {
        Alert.alert('Error', 'Plant ID is missing. Cannot register datalogger.');
        return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct service function (assuming registerDevice)
      const result = await deviceService.registerDevice(sno, plantId);
      
      if (result.success) {
        setLoading(false);
        Alert.alert('Success', 'Datalogger registered successfully!', [
          {
            text: 'OK', 
            onPress: () => {
              // <<< Navigate back and signal refresh >>>
              navigation.navigate({ 
                  name: 'Devices', // Go back to the Devices/Logger list screen
                  params: { refresh: true, plantId: plantId }, // Pass refresh flag and plantId
                  merge: true, // Merge params to avoid losing plantId
              });
            }
          }
        ]);
        // Clear the input field after success
        setSno(''); 
      } else {
        setError(result.error || 'Failed to register datalogger.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error registering datalogger:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // ... rest of the component (JSX, styles)
  
  return (
    <SafeAreaView /* ... */>
       {/* Header might not need a refresh button here, as we refresh the LIST page */}
       {/* ... Header JSX ... */}
       
       <View /* ... Content View ... */>
           {/* ... Input field, Button calling handleRegister ... */}
       </View>
    </SafeAreaView>
  );
};

// ... styles

export default AddDataloggerScreen; 