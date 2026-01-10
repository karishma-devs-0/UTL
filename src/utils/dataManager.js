import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiClient from './api-native.js';
// Import deviceService to use its specific functions
import deviceService from '../services/deviceService.js';

// Keys for AsyncStorage
const STORAGE_KEYS = {
  PLANTS: 'plants',
  // PRODUCTION_DATA: 'productionData', // Remove if unused
  PENDING_OPERATIONS: 'pendingOperations', // For potential future offline support
  LAST_SYNC: 'lastSync',
  PLANT_STATUS: 'plantStatus', // Add new key for plant status cache
  PLANT_STATUS_TIMESTAMP: 'plantStatusTimestamp' // Add timestamp for cache validation
};

// Add cache duration constant (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Operation types for tracking offline changes
const OPERATION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  REGISTER_DEVICE: 'register_device' // Add new type if needed
};

class DataManager {
  constructor() {
    this.isOnline = true;
    this.isServerReachable = true;
    this.pendingOperations = [];
    this.syncInProgress = false;
    this.plantStatusCache = null;
    this.lastPlantStatusFetch = null;
    
    // Initialize network listener
    NetInfo.addEventListener(state => {
      const previousOnlineState = this.isOnline;
      this.isOnline = !!(state.isConnected && state.isInternetReachable);
      
      // If we just came back online, try to sync
      if (!previousOnlineState && this.isOnline) {
        // Consider if sync is still relevant
        // this.syncPendingOperations();
      }
    });
    
    // Load pending operations from storage
    this.loadPendingOperations();
  }
  
  async loadPendingOperations() {
    try {
      const pendingOpsString = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OPERATIONS);
      this.pendingOperations = pendingOpsString ? JSON.parse(pendingOpsString) : [];
    } catch (error) {
      console.error('Error loading pending operations:', error);
      this.pendingOperations = [];
    }
  }
    
  async savePendingOperations() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_OPERATIONS, 
        JSON.stringify(this.pendingOperations)
      );
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }
  
  // Add method to check if cache is valid
  isPlantStatusCacheValid() {
    return (
      this.plantStatusCache &&
      this.lastPlantStatusFetch &&
      Date.now() - this.lastPlantStatusFetch < CACHE_DURATION
    );
  }

  // Add method to get plant status with caching
  async getPlantStatus() {
    // Return cached data if valid
    if (this.isPlantStatusCacheValid()) {
      return { success: true, data: this.plantStatusCache, source: 'cache' };
    }

    try {
      const response = await fetch('https://utlsolarrms.com/api/plantStatus');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update cache
          this.plantStatusCache = data.data;
          this.lastPlantStatusFetch = Date.now();
          
          // Also store in AsyncStorage for persistence
          await AsyncStorage.setItem(STORAGE_KEYS.PLANT_STATUS, JSON.stringify(data.data));
          await AsyncStorage.setItem(STORAGE_KEYS.PLANT_STATUS_TIMESTAMP, Date.now().toString());
          
          return { success: true, data: data.data, source: 'server' };
        }
      }
      throw new Error('Failed to fetch plant status');
    } catch (error) {
      // Try to get from AsyncStorage if network request fails
      try {
        const cachedData = await AsyncStorage.getItem(STORAGE_KEYS.PLANT_STATUS);
        const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.PLANT_STATUS_TIMESTAMP);
        
        if (cachedData && timestamp) {
          const parsedData = JSON.parse(cachedData);
          const cacheAge = Date.now() - parseInt(timestamp);
          
          if (cacheAge < CACHE_DURATION) {
            this.plantStatusCache = parsedData;
            this.lastPlantStatusFetch = parseInt(timestamp);
            return { success: true, data: parsedData, source: 'asyncStorage' };
          }
        }
      } catch (storageError) {
        console.error('Error reading from AsyncStorage:', storageError);
      }
      
      return { success: false, error: error.message, source: 'none' };
    }
  }
  
  // Modify getPlants to use the cached plant status
  async getPlants(skipServerFetch = false) {
    let cachedData = null;
    try {
      cachedData = await AsyncStorage.getItem(STORAGE_KEYS.PLANTS);
    } catch (e) {
      console.error('Error reading cached plants:', e);
    }

    const currentPlants = cachedData ? JSON.parse(cachedData) : [];

    if (skipServerFetch) {
      return { success: true, data: currentPlants, source: 'cache' };
    }

    const netState = await NetInfo.fetch();
    this.isOnline = !!(netState.isConnected && netState.isInternetReachable);

    if (!this.isOnline) {
      return { success: true, data: currentPlants, source: 'cache', offline: true };
    }

    try {
      // Get plant list and status concurrently
      const [plantsResponse, statusResponse] = await Promise.all([
        deviceService.getPlantData(),
        this.getPlantStatus()
      ]);

      if (plantsResponse.success) {
        const fetchedData = plantsResponse.data || [];
        
        // Enhance plant data with status if available
        if (statusResponse.success) {
          const statusData = statusResponse.data;
          fetchedData.forEach(plant => {
            if (statusData.online?.plantIds?.includes(plant.id)) {
              plant.status = 'online';
            } else if (statusData.offline?.plantIds?.includes(plant.id)) {
              plant.status = 'offline';
            } else if (statusData.incomplete?.plantIds?.includes(plant.id)) {
              plant.status = 'incomplete';
            } else if (statusData.partiallyOffline?.plantIds?.includes(plant.id)) {
              plant.status = 'partiallyOffline';
            }
          });
        }

        await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(fetchedData));
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        
        this.isServerReachable = true;
        return { 
          success: true, 
          data: fetchedData, 
          source: 'server',
          statusSource: statusResponse.source 
        };
      } else {
        this.isServerReachable = true;
        return { 
          success: false, 
          data: currentPlants, 
          error: plantsResponse.error || 'Server indicated failure', 
          source: 'cache' 
        };
      }
    } catch (error) {
      this.isServerReachable = false;
      return { 
        success: false, 
        data: currentPlants, 
        error: error.message || 'Failed to fetch', 
        source: 'cache', 
        serverDown: true 
      };
    }
  }
  
  // Helper method to update local plant cache
  async updateLocalPlantCache(plantList) { // Takes the whole list now
    try {
      // Directly save the fetched list
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plantList || []));
    } catch (error) {
      console.error('Error updating local plant cache:', error);
    }
  }
  
  // Helper method to remove plant from local cache
  async removeFromLocalPlantCache(plantId) {
    // This might not be needed if deletePlant is gone
    try {
      const storedPlants = await AsyncStorage.getItem(STORAGE_KEYS.PLANTS);
      let plants = storedPlants ? JSON.parse(storedPlants) : [];
      // Assuming plant objects have an 'id' property from GET /plant
      plants = plants.filter(p => p.id !== plantId);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
    } catch (error) {
      console.error('Error removing plant from local cache:', error);
    }
  }
  
  // Sync pending operations needs careful review to use apiClient
  async syncPendingOperations() {
    console.warn("DataManager: syncPendingOperations needs review based on available API operations.");
    // Only potential operation is registerDevice?
    // For now, just clear pending ops or implement specific sync for registerDevice if needed.
    if (this.pendingOperations.length > 0) {
         console.log(`Clearing ${this.pendingOperations.length} pending operations as sync logic is outdated.`);
         this.pendingOperations = [];
            await this.savePendingOperations();
    }
    return { success: true, message: "Sync logic needs review." };
  }
  
  // Get pending operations count
  getPendingOperationsCount() {
    return this.pendingOperations.length;
  }
  
  // Check if we're operating in offline mode
  isOfflineMode() {
    return !this.isOnline || !this.isServerReachable;
  }
  
  // Check and update the connection status
  checkConnection() {
    NetInfo.fetch().then(state => {
      this.isOnline = !!(state.isConnected && state.isInternetReachable);
    });
    return this.isOnline;
  }

  // --- Modified: Fetch details by filtering GET /plant result ---
  // --- Modified: Fetch details using the new getPlantDashboardDetails service --- 
  async getPlantDetails(plantId) {
    if (!plantId) {
      return { success: false, error: 'Plant ID is required for getPlantDetails.' };
    }

    // Add network check (optional, but good practice)
    const netState = await NetInfo.fetch();
    if (!(netState.isConnected && netState.isInternetReachable)) {
      console.warn(`DataManager: getPlantDetails - Offline. Cannot fetch details for plant ${plantId}.`);
      // Optionally, try to return from a detailed cache if you implement one, or just fail.
      return { success: false, error: 'Network offline. Cannot fetch plant details.', offline: true };
    }

    try {
      // Use the new deviceService function
      const result = await deviceService.getPlantDashboardDetails(plantId);

      if (result.success && result.data) {
        return { success: true, data: result.data, source: 'server' }; // Source is directly from server
      } else {
         console.error(`DataManager: Failed to get rich details for plant ${plantId}: ${result.error}`);
         return { success: false, error: result.error || 'Failed to fetch rich plant details', source: 'server' };
      }
    } catch (error) {
      console.error(`DataManager: ❌ Error in getPlantDetails (new method) for ${plantId}:`, error.message);
      return { success: false, error: error.message || 'Unknown error fetching rich plant details' };
    }
  }

  // --- NEW/MAPPED: Fetch devices for a plant using GET /route ---
  async fetchDevicesForPlant(plantId) {
    if (!plantId) return { success: false, error: "Plant ID is required" };

    try {
      // Use deviceService.getLoggerData which calls GET /route?plantId=...
      const response = await deviceService.getLoggerData(plantId);
       if (response.success) {
          return { success: true, data: response.data || [] }; // Return data or empty array
       } else {
           return { success: false, error: response.error || 'Failed to fetch devices' };
       }
    } catch (error) {
         return { success: false, error: error.message || 'Unknown error fetching devices' };
    }
  }

  // --- NEW/MAPPED: Add/Register a device (logger) using POST /route/ ---
  async registerDevice(sno, plantId) {
    if (!sno || !plantId) return { success: false, error: "Serial number (sno) and Plant ID are required" };

    try {
      // Use deviceService.registerDevice which calls POST /route/
      const response = await deviceService.registerDevice(sno, plantId);
       if (response.success) {
          return { success: true, data: response.data }; // Return response data if any
      } else {
           return { success: false, error: response.error || 'Failed to register device' };
      }
    } catch (error) {
       return { success: false, error: error.message || 'Unknown error registering device' };
    }
    // Add offline handling here if needed in the future
  }
  
  // --- Update Plant Data (Handles API call and local cache) ---
  async updatePlant(updatedPlantData) {
      if (!updatedPlantData || !updatedPlantData.id) {
          return { success: false, error: "Plant data with ID is required for update." };
      }

      // Assume online for now, add offline check later if needed
      try {
          const result = await deviceService.updatePlant(updatedPlantData);
          
          if (result.success) {
              // Update local cache
              await this.updatePlantInLocalCache(updatedPlantData);
              return { success: true, data: result.data };
          } else {
              return { success: false, error: result.error || 'Failed to update plant.' };
          }
      } catch (error) {
          return { success: false, error: error.message || 'Unknown error updating plant.' };
      }
  }

  // Helper to update a single plant in the local cache
  async updatePlantInLocalCache(plantData) {
      if (!plantData || !plantData.id) return;
      try {
          const storedPlants = await AsyncStorage.getItem(STORAGE_KEYS.PLANTS);
          let plants = storedPlants ? JSON.parse(storedPlants) : [];
          const plantIndex = plants.findIndex(p => p.id === plantData.id);
          
          if (plantIndex > -1) {
              plants[plantIndex] = { ...plants[plantIndex], ...plantData }; // Merge updates
          } else {
              // If not found, maybe add it? Or ignore? For update, usually ignore.
              return; 
          }
          await AsyncStorage.setItem(STORAGE_KEYS.PLANTS, JSON.stringify(plants));
      } catch (error) {
          console.error(`Error updating plant ${plantData.id} in local cache:`, error);
      }
  }
  // --- End Update Plant Data ---

  // --- Create Plant Data (Handles API call and local cache refresh) ---
  async createPlant(newPlantPayload) {
    // Assume online for now, add offline check later if needed
    try {
        const result = await deviceService.createPlant(newPlantPayload);
        
        if (result.success) {
            // Refresh the local cache by fetching the updated list
            // This ensures we get the new plant with its server-assigned ID
            await this.getPlants(); // Re-fetch the full list
            return { success: true, data: result.data }; // Return API response data if needed
        } else {
            return { success: false, error: result.error || 'Failed to create plant.' };
        }
    } catch (error) {
        return { success: false, error: error.message || 'Unknown error creating plant.' };
    }
  }
  // --- End Create Plant Data ---
}

// Create singleton instance
const dataManager = new DataManager();
export default dataManager; 