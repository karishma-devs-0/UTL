import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from '../styles/style';

const TermsAndConditionsScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [useWebView, setUseWebView] = useState(false); // Start with offline content
  
  console.log('TermsAndConditionsScreen loaded');
  
  // You can change this URL to your actual terms & conditions URL
  const TERMS_URL = 'https://utlsolarrms.com/terms_conditions'; // Using Google's terms as example - change to your URL
  
  const handleGoBack = () => {
    console.log('Terms screen: Go back button pressed');
    
    try {
      if (navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
      } else if (navigation && typeof navigation.navigate === 'function') {
        // Try to go back to Settings if coming from there, otherwise Register
        navigation.navigate('Settings');
      } else {
        console.log('Navigation not available, showing alert');
        Alert.alert('Error', 'Unable to go back. Please restart the app.');
      }
    } catch (error) {
      console.error('Error going back:', error);
      Alert.alert('Error', 'Navigation error occurred.');
    }
  };

  const handleWebViewLoadEnd = () => {
    console.log('WebView loaded successfully');
    setIsLoading(false);
    setLoadError(false);
  };

  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView error:', nativeEvent);
    setIsLoading(false);
    setLoadError(true);
  };

  const handleWebViewHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView HTTP error:', nativeEvent);
    setIsLoading(false);
    setLoadError(true);
  };

  const retryWebView = () => {
    setLoadError(false);
    setIsLoading(true);
    setUseWebView(true);
  };

  const switchToFallback = () => {
    setUseWebView(false);
    setLoadError(false);
    setIsLoading(false);
  };

  const renderFallbackContent = () => (
    <ScrollView 
      style={styles.termsContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <View style={styles.termsContent}>
        <Text style={styles.termsTitle}>Terms and Conditions</Text>
        
        <View style={styles.termsNotice}>
          <Text style={styles.termsNoticeText}>
            {loadError ? 
              "Unable to load terms from web. Showing offline version." : 
              "Offline Terms & Conditions"}
          </Text>
        </View>
        
        <Text style={styles.termsSection}>1. Acceptance of Terms</Text>
        <Text style={styles.termsText}>
          By accessing and using this solar power monitoring application, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.termsSection}>2. Use License</Text>
        <Text style={styles.termsText}>
          Permission is granted to temporarily download one copy of the materials on UTL Solar App for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
        </Text>

        <Text style={styles.termsSection}>3. Privacy Policy</Text>
        <Text style={styles.termsText}>
          Your privacy is important to us. We collect and use your information in accordance with our Privacy Policy. By using our services, you consent to the collection and use of information as outlined in our Privacy Policy.
        </Text>

        <Text style={styles.termsSection}>4. Data Collection</Text>
        <Text style={styles.termsText}>
          We collect data from your solar power systems to provide monitoring and analytics services. This includes energy production data, system performance metrics, and device status information.
        </Text>

        <Text style={styles.termsSection}>5. User Responsibilities</Text>
        <Text style={styles.termsText}>
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </Text>

        <Text style={styles.termsSection}>6. Service Availability</Text>
        <Text style={styles.termsText}>
          We strive to maintain high service availability, but we do not guarantee that our services will be available at all times. We reserve the right to modify or discontinue services with or without notice.
        </Text>

        <Text style={styles.termsSection}>7. Limitation of Liability</Text>
        <Text style={styles.termsText}>
          In no event shall UTL Solar or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on UTL Solar App.
        </Text>

        <Text style={styles.termsFooter}>
          Last updated: July 21, 2025
        </Text>
        
        {loadError && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={retryWebView}
          >
            <Text style={styles.retryButtonText}>Try loading from web again</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.reg_safeArea}>
      <View style={styles.reg_header}>
        <TouchableOpacity 
          onPress={handleGoBack} 
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.reg_headerText}>Terms & Conditions</Text>
        <TouchableOpacity 
          onPress={switchToFallback}
          style={styles.switchButton}
        >
          <Icon name={useWebView ? "description" : "web"} size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {!useWebView ? (
        renderFallbackContent()
      ) : loadError ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Unable to load web content</Text>
          <Text style={styles.errorText}>
            Check your internet connection and try again, or view the offline version.
          </Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity style={styles.retryButton} onPress={retryWebView}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fallbackButton} onPress={switchToFallback}>
              <Text style={styles.fallbackButtonText}>View Offline</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading Terms & Conditions...</Text>
            </View>
          )}
          <WebView
            source={{ uri: TERMS_URL }}
            onLoadEnd={handleWebViewLoadEnd}
            onError={handleWebViewError}
            onHttpError={handleWebViewHttpError}
            startInLoadingState={false}
            scalesPageToFit={true}
            showsVerticalScrollIndicator={true}
            style={{ flex: 1, opacity: isLoading ? 0 : 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={false}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onLoadStart={() => setIsLoading(true)}
            onLoadProgress={({ nativeEvent }) => {
              console.log('Loading progress:', nativeEvent.progress);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default TermsAndConditionsScreen;
