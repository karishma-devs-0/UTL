import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/style';

const SettingsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={localStyles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={localStyles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={localStyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={localStyles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        {/* Account Security Section */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountSecurity')}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Account Security</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>



        {/* Privacy Section */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>Privacy</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              console.log('Terms of Service clicked - navigating to TermsAndConditions');
              navigation.navigate('TermsAndConditions');
            }}
          >
            <Ionicons name="document-text-outline" size={24} color="#1a1a1a" />
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen;
