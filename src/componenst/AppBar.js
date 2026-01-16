import React from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Platform, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import styles from '../styles/style';

const AppBar = ({ navigation }) => {
  const handleSettingsPress = () => {
    navigation.getParent().navigate('Settings');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#fff' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.appBar}>
        <TouchableOpacity 
          onPress={handleSettingsPress} 
          style={styles.iconButton}
        >
          <Icon name="settings" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Dashboard</Text>
        <TouchableOpacity 
          onPress={() => navigation.getParent().navigate('AddPlant')} 
          style={styles.iconButton}
        >
          <Icon name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search..." 
            placeholderTextColor="#757575"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AppBar;