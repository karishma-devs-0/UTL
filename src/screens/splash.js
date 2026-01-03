import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import splash from '../assets/splash.jpg';

const SplashScreen = ({ navigation }) => {
  const { isLoading, userToken } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for 1.5 seconds to show splash screen
      setTimeout(() => {
        if (!isLoading) {
          navigation.replace(userToken ? 'Business' : 'Login');
        }
      }, 1500);
    };

    checkAuth();
  }, [isLoading, userToken, navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={splash} 
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
});

export default SplashScreen;