import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';
import { useAuth } from '../context/AuthContext';

const AppSettings = ({ navigation }) => {
  const { logout } = useAuth();

  const settingsOptions = [
    {
      title: 'Account Security',
      icon: 'security',
      rightText: '',
    },
    {
      icon: 'tune',
      rightText: '',
    },
    {
      title: 'System permission description',
      icon: 'description',
      rightText: '',
    },
    {
      title: 'Third party sharing checklist',
      icon: 'share',
      rightText: '',
    },
    {
      title: 'System Permissions',
      icon: 'admin-panel-settings',
      rightText: '',
    },
    {
      title: 'View and Export My Information',
      icon: 'import-export',
      rightText: '',
    },
  ];

  return (
    <SafeAreaView style={styles.settingsContainer}>
      <ScrollView>
        {settingsOptions.map((option, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.settingOption}
            onPress={() => {
              // Add navigation logic for each option
            }}
          >
            <View style={styles.settingLeft}>
              <Icon name={option.icon} size={24} color="#666" />
              <Text style={styles.settingText}>{option.title}</Text>
            </View>
            <View style={styles.settingRight}>
              {option.rightText && (
                <Text style={styles.settingRightText}>{option.rightText}</Text>
              )}
              <Icon name="chevron-right" size={24} color="#CCCCCC" />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AppSettings; 