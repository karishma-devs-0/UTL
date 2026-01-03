import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Animated, StyleSheet, Image, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import { useAuth } from '../context/AuthContext';

const BusinessSelectionScreen = ({ navigation }) => {
  const { selectBusiness } = useAuth();

  console.log('BusinessSelectionScreen rendering');
  
  const logos = [
    { id: 1, image: require('../assets/logo.jpg') },
    { id: 2, image: require('../assets/logo.jpg') },
    { id: 3, image: require('../assets/logo.jpg') },
  ];
  const [expandedLogo, setExpandedLogo] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('BusinessSelectionScreen mounted');
  }, []);

  const handleLogoClick = (index) => {
    if (expandedLogo === index) {
      setExpandedLogo(null);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setExpandedLogo(index);
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleBusinessSelect = (logoId) => {
    console.log(`Selected business with logo ID: ${logoId}`);
    selectBusiness(logoId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <Animated.View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: 'black' }, { opacity: fadeAnim }]} pointerEvents="none" />
      
      <View style={{marginTop: 100, alignItems: 'center'}}>
        <Text style={styles.heading || {fontSize: 24, marginBottom: 10}}>Select Business</Text>
        <Text style={{marginBottom: 20, color: styles.textSecondary?.color || '#666'}}>Please select your Business</Text>
        
        <ScrollView horizontal style={{flexDirection: 'row', paddingHorizontal: 10}} showsHorizontalScrollIndicator={false}>
          {logos.map((logo, index) => (
            <TouchableOpacity
              key={logo.id}
              onPress={() => handleLogoClick(index)}
              style={{marginHorizontal: 10}}
            >
              <View style={styles.logoContainer || styles.card}>
                <View style={styles.logoPlaceholder || {width: 100, height: 100}}>
                  <Image 
                    source={logo.image} 
                    style={styles.logoImage || {width: '100%', height: '100%'}}
                    resizeMode="cover"
                  />
                </View>
                
                {expandedLogo === index && (
                  <View style={styles.expandedContent || {marginTop: 15, alignItems: 'center'}}>
                    <Text style={styles.businessName || {fontWeight: 'bold'}}>Business Name: Logo {logo.id}</Text>
                    <Text style={styles.businessDescription || {color: '#666'}}>Description for Logo {logo.id}</Text>
                    <TouchableOpacity
                      style={styles.businessScreenButton || styles.button}
                      onPress={() => handleBusinessSelect(logo.id)}
                    >
                      <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <View style={styles.questionContainer || {marginTop: 30}}>
          <Icon name="help-outline" size={20} color={styles.textSecondary?.color || '#666'} style={styles.questionIcon} />
          <Text style={styles.questionText || {color: '#666'}}>
            Do you need to merge plant data under one business?
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BusinessSelectionScreen;