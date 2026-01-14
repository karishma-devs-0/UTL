import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Make sure to install @expo/vector-icons if you're using Expo
import * as ImagePicker from "expo-image-picker";
import styles from "../styles/style"; // Import the updated styles
import AppBar from "../componenst/AppBar";
import { BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { logoutAuth } from "@/utils/services/authService";
import { getUserData, getUserName, getUserRole, setUserData } from "../utils/storage/storage";

const Me = ({ navigation, route }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("Delete");
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("Role");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  // const { logout } = useAuth();
  const auth = useAuth();
  console.log("Auth context in Me.js:", auth);
  const { logout } = auth;

  // Load user data when component mounts
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoadingUserData(true);
      console.log('Loading user data...');
      const userData = await getUserData();
      console.log('Retrieved user data:', userData);
      
      if (userData) {
        // Set user name
        const name = userData.name || userData.username || "User";
        setUserName(name);
        
        // Handle nested role structure
        let roleName = "User";
        let isSuper = false;
        
        if (userData.role) {
          // Role is nested object: { id: 5, name: "Viewer", isSuperAdmin: false }
          roleName = userData.role.name || userData.role.role || "User";
          isSuper = userData.role.isSuperAdmin === true;
        } else if (userData.isSuperAdmin !== undefined) {
          // Role is direct property
          isSuper = userData.isSuperAdmin === true;
          roleName = userData.role || "User";
        }
        
        setUserRole(isSuper ? "Super Admin" : roleName);
        setIsSuperAdmin(isSuper);
        
        console.log('User name:', name);
        console.log('User role object:', userData.role);
        console.log('Role name:', roleName);
        console.log('Is super admin:', isSuper);
        console.log('User permissions:', userData.permissions);
      } else {
        console.log('No user data found in storage');
        setUserName("User");
        setUserRole("Role");
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserName("User");
      setUserRole("Role");
      setIsSuperAdmin(false);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await logoutAuth();
            await logout();
            // Reset the navigation state to Login screen
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleChangeImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    // Pick the image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage({ uri: result.assets[0].uri });
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  // Placeholder function for the About item press
  const handlePressAbout = () => {
    console.log("About UTL SOLAR SUN + pressed");
    // Navigate to an About screen or show a modal with version info
    // navigation.navigate('AboutScreen'); // Example
  };

  // Function to handle delete account press
  const handlePressLanguage = () => {
    console.log('=== DELETE ACCOUNT BUTTON PRESSED ===');
    console.log('Delete Account button pressed');
    console.log('Navigation object:', navigation);
    
    // Simple alert to test if function is called
    Alert.alert('Debug', 'Delete button was pressed!');
    
    try {
      // Navigate to Delete Account screen
      navigation.navigate('DeleteAccount');
      console.log('Navigation to DeleteAccount initiated');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open Delete Account screen: ' + error.message);
    }
  };

  // Debug function to show raw user data (activated by double-tap on profile)
  const handleProfileDebug = async () => {
    try {
      const userData = await getUserData();
      const debugInfo = userData ? {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions,
        business: userData.business
      } : 'No user data found';
      
      Alert.alert(
        'User Data Debug',
        `Current user info:\n${JSON.stringify(debugInfo, null, 2)}`,
        [
          { text: 'Copy to Console', onPress: () => console.log('Full User Data:', userData) },
          { text: 'Test Super Admin', onPress: () => testUserData('superadmin') },
          { text: 'Test Regular User', onPress: () => testUserData('user') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Debug Error', error.message);
    }
  };

  // Test function to simulate different user data
  const testUserData = async (type) => {
    try {
      let testData;
      
      if (type === 'superadmin') {
        testData = {
          id: 1,
          name: "John Super Admin",
          email: "admin@utl.com",
          role: {
            id: 1,
            name: "Administrator",
            isSuperAdmin: true
          },
          permissions: ["all"],
          business: { name: "UTL Solar" }
        };
      } else {
        testData = {
          id: 2,
          name: "Jane Viewer",
          email: "user@utl.com", 
          role: {
            id: 5,
            name: "Viewer",
            isSuperAdmin: false
          },
          permissions: ["view_plants", "create_plants", "view_devices"],
          business: { name: "UTL Solar" }
        };
      }
      
      await setUserData(testData);
      await loadUserData();
      Alert.alert('Test Data', `${type} data has been set and loaded!`);
    } catch (error) {
      Alert.alert('Test Error', error.message);
    }
  };

  return (
    <SafeAreaView style={localStyles.safeContainer}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      {/* --- Clean Profile Header --- */}
      <View style={localStyles.profileHeader}>
        <Text style={localStyles.profileTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Delete Account button pressed');
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      navigation.navigate('DeleteAccount');
                    } catch (error) {
                      Alert.alert('Error', 'Navigation failed: ' + error.message);
                    }
                  }
                }
              ]
            );
          }}
          style={localStyles.deleteButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trash-outline"
            size={22}
            color="#ff3b30"
          />
          <Text style={localStyles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      {/* --- Clean Profile Header --- */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={localStyles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
      >
        <View style={localStyles.contentContainer}>
          {/* Header - Adjusted to be just the profile content */}
          <View style={[styles.header, localStyles.profileHeaderContent]}>
            {/* Original Profile Section content */}
            <TouchableOpacity
              style={[
                styles.profileSection,
                localStyles.profileSectionContentAdjusted,
              ]}
              onPress={loadUserData}
              onLongPress={handleProfileDebug}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.profileImageContainer,
                  { alignItems: "center", marginVertical: 0 },
                ]}
              >
                {profileImage ? (
                  <Image source={profileImage} style={styles.profileImage} />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={100}
                    color="black"
                  />
                )}
              </View>
              {/* User Name */}
              <Text
                style={[
                  styles.headerTitle,
                  { textAlign: "center", marginVertical: 0 },
                ]}
              >
                {userName}
              </Text>
              {/* User Role - Show Super Admin if isSuperAdmin is true, otherwise show role */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { 
                      textAlign: "center", 
                      marginVertical: 0,
                      color: isSuperAdmin ? "#ff6b35" : "#666",
                      fontWeight: isSuperAdmin ? "600" : "normal"
                    },
                  ]}
                >
                  {userRole}
                </Text>
                {isSuperAdmin && (
                  <Ionicons 
                    name="shield-checkmark" 
                    size={16} 
                    color="#ff6b35" 
                    style={{ marginLeft: 6 }}
                  />
                )}
                {isLoadingUserData && (
                  <Ionicons 
                    name="refresh-outline" 
                    size={16} 
                    color="#666" 
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
              
              {/* Small helper text for debug functionality */}

            </TouchableOpacity>
          </View>

          {/* Menu Options */}
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="home-outline" size={24} color="black" />
            <Text style={styles.menuText}>Go to website</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="black" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
          </TouchableOpacity>

          {/* Add the About UTL SOLAR SUN + card here */}
          <TouchableOpacity style={styles.menuItem} onPress={handlePressAbout}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="black"
            />
            <View style={localStyles.aboutTextContainer}>
              {/* Ensure only <Text> components are rendered here */}
              <Text style={styles.menuText}>About UTL SOLAR SUN +</Text>
              <Text style={localStyles.versionText}>V 1.1.0</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="black" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.logoutButton
                ? styles.logoutButton
                : {
                    marginTop: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 15,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#ff3b30",
                  },
            ]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={24} color="#ff3b30" />
            <Text
              style={[
                styles.logoutText
                  ? styles.logoutText
                  : {
                      marginLeft: 10,
                      color: "#ff3b30",
                      fontSize: 16,
                      fontWeight: "500",
                    },
              ]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Clean, modern styles for the profile screen
const localStyles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  aboutTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 10,
  },
  versionText: {
    fontSize: 14,
    color: "#666",
  },
  // New clean header styles
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 2,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#F5F8FA",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff5f5",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffebee",
    shadowColor: "#ff3b30",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ff3b30",
    marginLeft: 6,
  },
  profileHeaderContent: {
    paddingVertical: 8,
  },
  profileSectionContentAdjusted: {
    alignItems: "center",
    marginVertical: 0,
    width: "100%",
  },
  debugHintText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});

export default Me;
