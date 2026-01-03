import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  StatusBar,
  Image,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const DASHBOARD_SETTINGS_KEY = '@dashboard_settings';

const DashboardSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    watchlist: true,
    totalPlants: true,
    circularProgress: true,
    calendar: true,
    productionBarChart: true,
    alertsWidget: true
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(DASHBOARD_SETTINGS_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings when changed
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const settingOptions = [
    /* Commented out watchlist
    {
      key: 'watchlist',
      title: 'My Watchlist',
      description: 'Show/hide your favorited plants',
      icon: 'star',
      color: '#FFC107'
    },
    */
    {
      key: 'totalPlants',
      title: 'Plants Summary',
      description: 'Display total plants statistics',
      icon: 'eco',
      color: '#4CAF50'
    },
    {
      key: 'circularProgress',
      title: 'Production Overview',
      description: 'Overall production circular chart',
      icon: 'pie-chart',
      color: '#2196F3'
    },
    {
      key: 'calendar',
      title: 'Production Calendar',
      description: 'Monthly and yearly production charts',
      icon: 'calendar-today',
      color: '#9C27B0'
    },
    /* Commented out alerts widget
    {
      key: 'alertsWidget',
      title: 'Alerts Widget',
      description: 'Display recent system alerts',
      icon: 'warning',
      color: '#FF9800'
    }
    */
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Icon name="hourglass-empty" size={40} color="#00875A" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Customize Your Dashboard</Text>
          <Text style={styles.sectionDescription}>
            Toggle components to show or hide them on your dashboard
          </Text>

          <View style={styles.tilesContainer}>
            {settingOptions.map((option) => (
              <View key={option.key} style={styles.settingTile}>
                <View style={styles.tileContent}>
                  <View style={[styles.iconContainer, {backgroundColor: option.color + '20'}]}>
                    <Icon name={option.icon} size={28} color={option.color} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.tileTitle}>{option.title}</Text>
                    <Text style={styles.tileDescription}>{option.description}</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#e0e0e0", true: "#a8e1c0" }}
                    thumbColor={settings[option.key] ? "#00875A" : "#f4f3f4"}
                    ios_backgroundColor="#e0e0e0"
                    onValueChange={() => toggleSetting(option.key)}
                    value={settings[option.key]}
                  />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Icon name="info-outline" size={22} color="#2196F3" />
            <Text style={styles.infoText}>
              These settings only affect what components are shown on your dashboard. Your data is still being collected regardless.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setSettings({
                // watchlist: true, // Commented out
                totalPlants: true,
                circularProgress: true,
                calendar: true,
                productionBarChart: true,
                // alertsWidget: true // Commented out
              });
            }}
          >
            <Icon name="refresh" size={18} color="#FFF" />
            <Text style={styles.resetButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  tilesContainer: {
    marginBottom: 20,
  },
  settingTile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tileDescription: {
    fontSize: 13,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  resetButton: {
    backgroundColor: '#00875A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default DashboardSettingsScreen; 