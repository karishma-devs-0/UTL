import apiClient from "../utils/api-native.js";
import axios from "axios";
// Remove AsyncStorage import as it's no longer needed for auth token
// import AsyncStorage from '@react-native-async-storage/async-storage';

// Remove the helper function to get token and set headers
/*
const getAuthConfig = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('DeviceService: Auth token not found.');
    return null; // Indicate auth failure
  }
  return {
    headers: { 'Authorization': `Bearer ${token}` }
  };
};
*/

const deviceService = {
  // Fetch main devices (Inverters) - Mapped to POST /log_invert
  // Needs plantId, using '1' as default for now. Consider passing it.
  getMainDevices: async (plantId = "1") => {
    // Remove auth logic
    try {
      // Changed endpoint and method, passing plantId in body
      const response = await apiClient.post("/log_invert", { plantId });
      // Assuming the new API returns data directly or in a standard format.
      // Adjust based on actual API response structure if needed.
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching main devices (inverters):",
        error.response?.data || error.message
      );
      // Remove authRequired check
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Fetch logger/route data for a plant - Mapped to GET /route
  // Needs plantId, using '1' as default. Consider passing it.
  // Replaces previous getAllDevices functionality. deviceType param removed.
  getLoggerData: async (plantId) => {
    try {
      const response = await apiClient.get(`/route`, { params: { plantId } });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error fetching logger data for plant ${plantId}:`,
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Fetch plant data - Added based on new API endpoint GET /plant
  getPlantData: async () => {
    // Removed auth logic
    try {
      const response = await apiClient.get("/plant");
      // Adjust based on actual API response structure
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error fetching plant data:",
        error.response?.data || error.message
      );
      // Removed authRequired check
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // --- NEW FUNCTION to get rich details for a single plant dashboard ---
  getPlantDashboardDetails: async (plantId) => {
    if (!plantId) {
      return {
        success: false,
        error: "Plant ID is required for dashboard details.",
      };
    }
    try {
      const response = await apiClient.get(`/plantdashboard`, {
        params: { id: plantId },
      });
      // The API returns an array with a single object, or an empty array if not found.
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return { success: true, data: response.data[0] }; // Return the first (and only) plant object
      } else if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length === 0
      ) {
        return {
          success: false,
          error: "Plant not found for dashboard details.",
        };
      } else {
        return { success: false, error: "Unexpected response structure." };
      }
    } catch (error) {
      console.error(
        `Error fetching plant dashboard details for plantId ${plantId}:`,
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch plant dashboard details.",
      };
    }
  },
  // --- END NEW FUNCTION ---

  // --- NEW FUNCTION to get aggregated dashboard summary stats ---
  getDashboardSummary: async () => {
    try {
      // Assuming GET /api/dashboard does not require a plantId for general summary
      // If it does, you might need to pass a businessId or similar from user context.
      const response = await apiClient.get(`/dashboard`);
      if (response.data && response.data.success) {
        // Adjust if success flag is different
        return {
          success: true,
          data: response.data.summary || response.data.data || response.data,
        };
      } else {
        return {
          success: false,
          error:
            response.data?.message || "Failed to retrieve dashboard summary.",
        };
      }
    } catch (error) {
      console.error(
        `Error fetching dashboard summary:`,
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch dashboard summary.",
      };
    }
  },
  // --- END NEW FUNCTION ---

  // Add/Register a logger/device - Mapped to POST /route/
  // Requires 'sno' and 'plantId'
  registerDevice: async (sno, plantId) => {
    // Removed auth logic
    try {
      // Changed endpoint and method, passing sno and plantId in body
      const response = await apiClient.post("/route/", { sno, plantId });
      // Adjust based on actual API response structure
      return { success: true, data: response.data };
    } catch (error) {
      // Log the full error response if available
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
        console.error("Error Response Status:", error.response.status);
        console.error("Error Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("Error Request:", error.request);
      } else {
        console.error("Error Message:", error.message);
      }
      // Removed authRequired check
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Fetch inverter data
  getInverterData: async (plantId) => {
    try {
      // Use the devices API endpoint which returns better structured inverter data
      console.log(
        `[deviceService.getInverterData] Fetching using devices API for plantId: ${plantId}`
      );

      // First try using the devices API which returns data for all inverters
      const response = await apiClient.get("/devices/");

      console.log(
        `[deviceService.getInverterData] Devices API response:`,
        JSON.stringify(response.data, null, 2).substring(0, 500) + "..."
      );

      let mappedData = [];

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.inverter)
      ) {
        // Filter by plantId if provided
        const filteredInverters = plantId
          ? response.data.inverter.filter(
              (item) => item.plantId == plantId || item.plant_id == plantId
            )
          : response.data.inverter;

        console.log(
          `[deviceService.getInverterData] Found ${filteredInverters.length} inverters for plant ${plantId}`
        );

        // Map the response to normalize field names for the UI
        mappedData = filteredInverters.map((inverter) => {
          return {
            ...inverter,
            sno:
              inverter.inverter_sno ||
              inverter.sno ||
              inverter.device_sn ||
              inverter.serial_number ||
              "--",
            total_ac_power:
              inverter.solar_power ||
              inverter.total_ac_power ||
              inverter.ac_power ||
              inverter.power ||
              "--",
            daily_production:
              inverter.daily_production ||
              inverter.daily_yield ||
              inverter.energy_today ||
              "--",
            capacity: {
              module_capacity:
                inverter.module_capacity ||
                (inverter.capacity && typeof inverter.capacity === "object"
                  ? inverter.capacity.module_capacity
                  : inverter.capacity) ||
                "--",
            },
            mac_address:
              inverter.logger_sno ||
              inverter.mac_address ||
              inverter.logger_sn ||
              "--",
          };
        });

        if (mappedData.length > 0) {
          console.log(
            "[deviceService.getInverterData] First mapped inverter from devices API:",
            JSON.stringify(mappedData[0], null, 2)
          );
          return { success: true, data: { data: mappedData } };
        }
      }

      // Fallback to the original log_invert API if devices API returned no data
      console.log(
        "[deviceService.getInverterData] Devices API returned no data, falling back to log_invert"
      );
      const fallbackResponse = await apiClient.post("/log_invert", { plantId });

      if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
        // Map the fallback response
        mappedData = fallbackResponse.data.data.map((inverter) => {
          return {
            ...inverter,
            sno:
              inverter.inverter_sno ||
              inverter.sno ||
              inverter.device_sn ||
              inverter.serial_number ||
              "--",
            total_ac_power:
              inverter.solar_power ||
              inverter.total_ac_power ||
              inverter.ac_power ||
              inverter.power ||
              "--",
            daily_production:
              inverter.daily_production ||
              inverter.daily_yield ||
              inverter.energy_today ||
              "--",
            capacity: {
              module_capacity:
                inverter.module_capacity ||
                (inverter.capacity && typeof inverter.capacity === "object"
                  ? inverter.capacity.module_capacity
                  : inverter.capacity) ||
                "--",
            },
            mac_address:
              inverter.logger_sno ||
              inverter.mac_address ||
              inverter.logger_sn ||
              "--",
          };
        });

        console.log(
          `[deviceService.getInverterData] Fallback API returned ${mappedData.length} inverters`
        );

        if (mappedData.length > 0) {
          console.log(
            "[deviceService.getInverterData] First mapped inverter from fallback:",
            JSON.stringify(mappedData[0], null, 2)
          );
        }

        return { success: true, data: { data: mappedData } };
      }

      return { success: true, data: { data: [] } };
    } catch (error) {
      console.error("[deviceService.getInverterData] Error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Unknown error fetching inverter data",
      };
    }
  },

  // --- Add Update Plant Function ---
  updatePlant: async (plantData) => {
    // The API seems to expect the full plant object in the body for PUT
    if (!plantData || !plantData.id) {
      return {
        success: false,
        error: "Plant data with ID is required for update.",
      };
    }
    try {
      // Make PUT request to /api/plant/ with plantData in the body
      const response = await apiClient.put("/plant/", plantData);
      // Assuming successful update returns the updated plant data or success status
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error updating plant ${plantData.id}:`,
        error.response?.data || error.message,
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update plant.";
      return { success: false, error: errorMessage };
    }
  },
  // --- End Update Plant Function ---

  // --- Add Delete Plant Function ---
  deletePlant: async (plantId) => {
    if (!plantId) {
      return { success: false, error: "Plant ID is required for deletion." };
    }
    try {
      // Changed from path parameter to query parameter to match API
      const response = await apiClient.delete(`/plant/`, {
        params: { id: plantId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "[deviceService] Error deleting plant:",
        error.response ? error.response.data : error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to delete plant",
      };
    }
  },
  // --- End Delete Plant Function ---

  // --- Add Create Plant Function ---
  createPlant: async (plantPayload) => {
    // Remove ID if present, as API likely auto-generates it
    const payloadToSend = { ...plantPayload };
    delete payloadToSend.id;

    // Add log just before sending
    console.log(
      "[deviceService.createPlant] Payload just before sending:",
      JSON.stringify(payloadToSend, null, 2)
    );

    try {
      // Make POST request to /api/plant with the filtered payload
      const response = await apiClient.post("/plant", payloadToSend);
      // Assuming successful creation returns the new plant data (incl. ID) or success status
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Error creating plant:",
        error.response?.data || error.message,
        error
      );
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create plant.";
      // Pass along the details field from the error response, if available
      const errorDetails = error.response?.data?.details || null;
      return { success: false, error: errorMessage, details: errorDetails };
    }
  },
  // --- End Create Plant Function ---

  // --- Add Delete Logger Function ---
  deleteLogger: async (loggerSno) => {
    if (!loggerSno) {
      return {
        success: false,
        error: "Logger Serial Number (sno) is required for deletion.",
      };
    }
    try {
      // Make DELETE request to /api/route with sno in the request body
      const response = await apiClient.delete("/route", {
        data: { sno: loggerSno },
      });
      // Assuming successful deletion returns a success status or message
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        `Error deleting logger ${loggerSno}:`,
        error.response?.data || error.message,
        error
      );
      // Provide a user-friendly error message
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete logger.";
      return { success: false, error: errorMessage };
    }
  },
  // --- End Delete Logger Function ---

  // --- FUNCTION TO FETCH LOGGER DETAILS BY S/N ---
  getLoggerDetailsBySno: async (sno, plantId) => {
    if (!sno) {
      return { success: false, error: "Logger S/N not provided." };
    }
    if (typeof plantId === "undefined" || plantId === null) {
      // Check for null explicitly
      return { success: false, error: "Plant ID not provided." };
    }

    const cleanSno = sno.startsWith("&") ? sno.substring(1) : sno;

    try {
      const response = await apiClient.get("/route", {
        params: { sno: cleanSno, plantId: plantId },
        timeout: 30000,
      });

      // Check if API returned 200 OK and data is a non-empty array
      if (
        response.status === 200 &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return { success: true, data: response.data[0] }; // Return the first object in the array
      }
      // Original check for { success: true, data: {...} } or { success: true, results: {...} }
      else if (
        response.data &&
        (response.data.success === true || response.data.success === "true") &&
        (response.data.data || response.data.results)
      ) {
        const loggerData =
          response.data.data ||
          (Array.isArray(response.data.results)
            ? response.data.results[0]
            : response.data.results);
        if (loggerData) {
          return { success: true, data: loggerData };
        } else {
          return {
            success: false,
            error: "No logger data found for this S/N and Plant ID.",
          };
        }
      }
      // Handle other unexpected successful responses or empty arrays from the new check
      else if (response.status === 200) {
        return {
          success: false,
          error: "Logger details not found or in unexpected format.",
        };
      }
      // This will now mostly catch non-200 responses if not caught by axios default error handling
      else {
        return {
          success: false,
          error:
            response.data?.message ||
            "Failed to retrieve logger details by S/N for given Plant ID.",
        };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred while fetching logger details.";
      return { success: false, error: errorMessage };
    }
  },
  // --- END FUNCTION ---

  getLoggerDetailsByMacAddress: async (macAddress) => {
    // Define Base URL - adjust if needed or use apiClient
    const API_BASE_URL = "https://utlsolarrms.com/api";
    try {
      const response = await fetch(`${API_BASE_URL}/LoggerDevice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mac_address: macAddress }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `HTTP error ${response.status}: ${errorBody || "Failed to fetch logger details"}`
        );
      }
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        return { success: true, data: data.data[0] };
      } else if (data.success && (!data.data || data.data.length === 0)) {
        return {
          success: false,
          error: "Logger not found or no data available.",
        };
      } else {
        return {
          success: false,
          error: data.message || "Failed to retrieve logger details",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  },

  // --- Function for Daily Chart Data ---
  getDailyPowerForPlant: async (plantId, date) => {
    // date format: YYYY-MM-DD
    if (!plantId || !date) {
      return {
        success: false,
        error: "Plant ID and Date (YYYY-MM-DD) are required.",
      };
    }
    try {
      const endpoint = `/charts/solar_power_per_plant/daily/`;
      const payload = {
        plant_id: parseInt(plantId, 10), // Ensure plant_id is an integer if required by API
        date_parameter: date,
      };
      console.log("Daily Chary RequestL", payload);
      const response = await apiClient.post(endpoint, payload);

      // Assuming response.data.results is the array of { timeMinutes, solarPower }
      return { success: true, results: response.data?.results || [] }; // Return the results array directly
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch daily chart data.";
      return { success: false, error: errorMessage, results: [] };
    }
  },
  // --- End Function for Daily Chart Data ---

  // --- Renamed Function for Monthly Chart Data ---
  getMonthlyProductionForPlant: async (plantId, monthYear) => {
    // monthYear format: "YYYY-MM"
    if (!plantId || !monthYear) {
      return {
        success: false,
        error: "Plant ID and Month (YYYY-MM) are required.",
      };
    }
    const endpoint = `/charts/solar_power_per_plant/monthly/`;
    const payload = {
      plant_id: parseInt(plantId, 10), // Ensure plant_id is an integer
      date_parameter: monthYear,
    };
    const fullUrl = `${apiClient.defaults.baseURL}${endpoint}`;

    try {
      // --- Use apiClient.post instead of fetch, with a longer timeout for this specific call ---
      const response = await apiClient.post(endpoint, payload, {
        timeout: 60000,
      }); // Timeout set to 60 seconds
      // -------------------------------------------------------------------------- -----------

      return { success: true, results: response.data?.results || [] };
    } catch (error) {
      if (error.response) {
        // Error response from server (e.g., 4xx, 5xx)
        console.error(
          `[iOS DEBUG] Server Error Status: ${error.response.status}`
        );
        console.error(
          `[iOS DEBUG] Server Error Data: ${JSON.stringify(error.response.data)}`
        );
      } else if (error.request) {
        // Request was made but no response received (e.g., network error, timeout)
        console.error(
          "[iOS DEBUG] Network error or no response received:",
          error.message
        );
      } else {
        // Other errors (e.g., setup issue)
        console.error("[iOS DEBUG] Other error:", error.message);
      }
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch monthly chart data.";
      return { success: false, error: errorMessage, results: [] };
    }
  },
  // --- End Function for Monthly Chart Data ---

  // --- Renamed Function for Yearly Chart Data ---
  getYearlyProductionForPlant: async (plantId, year) => {
    if (!plantId || !year) {
      return {
        success: false,
        error: "Plant ID and Year (YYYY) are required.",
      };
    }
    try {
      const endpoint = `/charts/solar_power_per_plant/yearly/`;
      const payload = {
        plant_id: parseInt(plantId, 10),
        date_parameter: String(year),
      };
      const response = await apiClient.post(endpoint, payload);

      // Convert kWh to MWh for yearly data
      const results =
        response.data?.results?.map((item) => ({
          ...item,
          solarPower: item.solarPower
            ? (parseFloat(item.solarPower) / 1000).toFixed(3)
            : "0.000", // Convert to MWh
        })) || [];

      return { success: true, results };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch yearly chart data.";
      return { success: false, error: errorMessage, results: [] };
    }
  },
  // --- End Function for Yearly Chart Data ---

  // --- Add Function for Total Chart Data ---
  getTotalProductionForPlant: async (plantId) => {
    if (!plantId) {
      return { success: false, error: "Plant ID is required." };
    }
    try {
      const endpoint = `/charts/solar_power_per_plant/total/`;
      const payload = {
        plant_id: parseInt(plantId, 10),
      };
      const response = await apiClient.post(endpoint, payload);

      // Convert kWh to MWh for total data and ensure proper typing of all values
      const results =
        response.data?.results?.map((item) => ({
          ...item,
          year: String(item.year || ""), // Ensure year is a string
          solarPower: item.solarPower
            ? Number((parseFloat(item.solarPower) / 1000).toFixed(3))
            : 0, // Convert to MWh as number
        })) || [];

      return { success: true, results };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch total chart data.";
      return { success: false, error: errorMessage, results: [] };
    }
  },
  // --- End Function for Total Chart Data ---

  // --- ADDED: Function to fetch all devices summary ---
  getAllDevicesSummary: async () => {
    try {
      console.log(
        "[deviceService] Fetching all devices summary from /api/devices/"
      );
      const response = await apiClient.get("/devices/");
      console.log("[deviceService] API Response:", response.data);

      if (response.data && response.data.success) {
        return {
          success: true,
          data: {
            inverter: response.data.inverter || [],
            logger: response.data.logger || [],
          },
        };
      } else {
        console.error(
          "[deviceService] API returned unsuccessful response:",
          response.data
        );
        return {
          success: false,
          error: response.data.message || "Failed to fetch devices summary",
        };
      }
    } catch (error) {
      console.error("[deviceService] Error fetching devices summary:", error);
      return {
        success: false,
        error:
          error.message || "An error occurred while fetching devices summary",
      };
    }
  },
  // --- END ADDED function ---

  // --- ADDED: Device-Specific Chart Functions ---
  getDailyPowerForDevice: async (deviceSn, date) => {
    if (!deviceSn || !date) {
      return {
        success: false,
        error: "Device S/N and Date (YYYY-MM-DD) are required.",
      };
    }
    try {
      const endpoint = "/charts/devices/daily/device_daily_chart";
      const payload = { device_sn: String(deviceSn), date_parameter: date };
      const response = await apiClient.post(endpoint, payload);
      // Assuming results are in response.data.results (like plant charts)
      return { success: true, results: response.data?.results || [] };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch daily chart data for device.";
      return { success: false, error: errorMessage, results: [] };
    }
  },

  getMonthlyProductionForDevice: async (deviceSn, monthYear) => {
    if (!deviceSn || !monthYear) {
      return {
        success: false,
        error: "Device S/N and Month (YYYY-MM) are required.",
      };
    }
    try {
      const endpoint = "/charts/devices/monthly/device_month_chart";
      const payload = {
        device_sn: String(deviceSn),
        date_parameter: monthYear,
      };
      const response = await apiClient.post(endpoint, payload);
      return { success: true, results: response.data?.results || [] };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch monthly chart data for device.";
      return { success: false, error: errorMessage, results: [] };
    }
  },

  getYearlyProductionForDevice: async (deviceSn, year) => {
    if (!deviceSn || !year) {
      return {
        success: false,
        error: "Device S/N and Year (YYYY) are required.",
      };
    }
    try {
      const endpoint = "/charts/devices/yearly/device_year_chart";
      const payload = {
        device_sn: String(deviceSn),
        date_parameter: String(year),
      };
      const response = await apiClient.post(endpoint, payload);
      return { success: true, results: response.data?.results || [] };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch yearly chart data for device.";
      return { success: false, error: errorMessage, results: [] };
    }
  },

  getTotalProductionForDevice: async (deviceSn) => {
    if (!deviceSn) {
      return { success: false, error: "Device S/N is required." };
    }
    try {
      const endpoint = "/charts/devices/total/device_total_chart";
      const payload = { device_sn: String(deviceSn) };
      const response = await apiClient.post(endpoint, payload);
      return { success: true, results: response.data?.results || [] };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch total chart data for device.";
      return { success: false, error: errorMessage, results: [] };
    }
  },
  // --- END: Device-Specific Chart Functions ---

  // --- NEW FUNCTION TO FETCH INVERTER PARAMETERS ---
  getInverterParameters: async (loggerSno, plantId) => {
    // Renamed inverterSno to loggerSno for clarity
    if (!loggerSno) {
      // Check loggerSno
      const errorMessage =
        "Logger S/N is required to fetch inverter parameters."; // Updated error message
      return { success: false, error: errorMessage };
    }
    try {
      const endpoint = "InverterDevice";
      const payload = { device_sn: loggerSno }; // Changed sno to device_sn and using loggerSno
      // If plantId is also needed for this POST request, add it to the payload:
      // const payload = { device_sn: loggerSno, plant_id: plantId };

      const response = await apiClient.post(endpoint, payload);

      const data = response.data;

      if (data.success && data.data) {
        // Check for data.data as per your successful response structure
        return { success: true, data: data.data };
      } else {
        return {
          success: false,
          error:
            data.message || "API returned success=false or missing data object",
        };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred while fetching inverter parameters.",
      };
    }
  },

  // --- NEW FUNCTION: Get inverters specifically for a plant ID ---
  getInvertersForPlant: async (plantId) => {
    if (!plantId) {
      return { success: false, error: "Plant ID is required." };
    }

    console.log(
      `[deviceService.getInvertersForPlant] Fetching inverters for plant ${plantId}`
    );

    try {
      // First try the devices endpoint which might have more complete data
      const response = await apiClient.get("/devices/");

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.inverter)
      ) {
        // Filter inverters for this specific plant
        const plantInverters = response.data.inverter.filter(
          (inv) => inv.plantId == plantId || inv.plant_id == plantId
        );

        if (plantInverters.length > 0) {
          console.log(
            `[deviceService.getInvertersForPlant] Found ${plantInverters.length} inverters from devices API`
          );
          return { success: true, data: plantInverters };
        }
      }

      // If no inverters found in devices API or API failed, try the specific plantdashboard endpoint
      console.log(
        `[deviceService.getInvertersForPlant] Trying plantdashboard API for inverter data`
      );
      const dashboardResponse = await apiClient.get("/plantdashboard", {
        params: { id: plantId },
      });

      if (
        dashboardResponse.data &&
        Array.isArray(dashboardResponse.data) &&
        dashboardResponse.data.length > 0
      ) {
        const plant = dashboardResponse.data[0];
        // Extract inverter info if available in plant dashboard
        if (plant.inverters && Array.isArray(plant.inverters)) {
          console.log(
            `[deviceService.getInvertersForPlant] Found ${plant.inverters.length} inverters in dashboard API`
          );
          return { success: true, data: plant.inverters };
        }
      }

      // Last resort - try log_invert endpoint directly
      console.log(
        `[deviceService.getInvertersForPlant] Trying log_invert API as last resort`
      );
      const logInvertResponse = await apiClient.post("/log_invert", {
        plantId,
      });

      if (
        logInvertResponse.data &&
        Array.isArray(logInvertResponse.data.data)
      ) {
        console.log(
          `[deviceService.getInvertersForPlant] Found ${logInvertResponse.data.data.length} inverters from log_invert`
        );
        return { success: true, data: logInvertResponse.data.data };
      }

      // If we get here, no data was found in any endpoint
      return {
        success: false,
        error: "No inverter data found for this plant.",
      };
    } catch (error) {
      console.error("[deviceService.getInvertersForPlant] Error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch inverter data for plant",
      };
    }
  },
  // --- END NEW FUNCTION ---
};

export default deviceService;
