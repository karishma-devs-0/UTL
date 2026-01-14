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

const AccountSecurityScreen = ({ navigation }) => {
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
        <Text style={localStyles.headerTitle}>Account Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={localStyles.content}>
        <View style={localStyles.section}>
          <Text style={localStyles.sectionDescription}>
            Manage your account credentials and security settings
          </Text>

          <TouchableOpacity
            style={localStyles.securityItem}
            onPress={() => navigation.navigate('EditPassword')}
          >
            <View style={localStyles.iconContainer}>
              <Ionicons name="key-outline" size={24} color="#ff0000" />
            </View>
            <View style={localStyles.itemContent}>
              <Text style={localStyles.itemTitle}>Password</Text>
              <Text style={localStyles.itemSubtitle}>Change your password</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.securityItem}
            onPress={() => navigation.navigate('EditEmail')}
          >
            <View style={localStyles.iconContainer}>
              <Ionicons name="mail-outline" size={24} color="#ff0000" />
            </View>
            <View style={localStyles.itemContent}>
              <Text style={localStyles.itemTitle}>Email</Text>
              <Text style={localStyles.itemSubtitle}>Update your email address</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.securityItem}
            onPress={() => navigation.navigate('EditUsername')}
          >
            <View style={localStyles.iconContainer}>
              <Ionicons name="person-outline" size={24} color="#ff0000" />
            </View>
            <View style={localStyles.itemContent}>
              <Text style={localStyles.itemTitle}>Username</Text>
              <Text style={localStyles.itemSubtitle}>Change your username</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.securityItem}
            onPress={() => navigation.navigate('BusinessSettings')}
          >
            <View style={localStyles.iconContainer}>
              <Ionicons name="business-outline" size={24} color="#ff0000" />
            </View>
            <View style={localStyles.itemContent}>
              <Text style={localStyles.itemTitle}>Business</Text>
              <Text style={localStyles.itemSubtitle}>Manage business settings</Text>
            </View>
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
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE9E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default AccountSecurityScreen;
