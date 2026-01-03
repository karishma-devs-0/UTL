import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

// Create the context
export const NetworkContext = createContext({
  isConnected: true,
  isServerReachable: true,
  checkServerReachability: () => {},
});

// Create a hook to use the network context
export const useNetwork = () => useContext(NetworkContext);

// Server URL to ping
const SERVER_URL = 'https://utlapp.onrender.com/api/health';

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isServerReachable, setIsServerReachable] = useState(true);
  const [lastConnectedTime, setLastConnectedTime] = useState(null);
  
  // Function to check if the server is reachable
  const checkServerReachability = async () => {
    if (!isConnected) {
      setIsServerReachable(false);
      return false;
    }
    
    try {
      // Set a short timeout to quickly detect server issues
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(SERVER_URL, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If we get any response, the server is reachable
      const isReachable = response.status < 500;
      setIsServerReachable(isReachable);
      return isReachable;
    } catch (error) {
      console.log('Server reachability check failed:', error);
      setIsServerReachable(false);
      return false;
    }
  };
  
  // Set up network status subscription
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newConnectionState = state.isConnected && state.isInternetReachable;
      
      // If the connection state changed from offline to online
      if (!isConnected && newConnectionState) {
        // Record when we reconnected
        setLastConnectedTime(new Date());
        
        // Check server reachability
        checkServerReachability();
        
        // Notify the user they're back online
        Alert.alert(
          'Connection Restored', 
          'You are back online! The app will now sync with the server.',
          [{ text: 'OK' }]
        );
      }
      
      // If the connection state changed from online to offline
      if (isConnected && !newConnectionState) {
        setIsServerReachable(false);
        
        // Notify the user that they're offline
        Alert.alert(
          'You are offline', 
          'The app will continue to work with cached data. Some features may be limited.',
          [{ text: 'OK' }]
        );
      }
      
      setIsConnected(newConnectionState);
    });
    
    // Check server reachability on first load
    checkServerReachability();
    
    return () => {
      unsubscribe();
    };
  }, [isConnected]);
  
  // Periodically check server reachability when connected
  useEffect(() => {
    let interval;
    
    if (isConnected && !isServerReachable) {
      interval = setInterval(() => {
        checkServerReachability();
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, isServerReachable]);
  
  return (
    <NetworkContext.Provider 
      value={{ 
        isConnected, 
        isServerReachable,
        lastConnectedTime,
        checkServerReachability,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export default NetworkProvider; 