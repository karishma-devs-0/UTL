// Utility functions for unit conversions

/**
 * Converts a production value to the appropriate unit based on its magnitude
 * @param {number} value - The production value
 * @param {string} forceUnit - Optional parameter to force a specific unit ('W', 'kW', 'kWh', 'MWh')
 * @returns {object} - Object containing the converted value and unit
 */

const formatEnergyWithUnit = (value) => {
  if (!value || value === '--' || isNaN(value)) {
    return { value: '--', unit: 'kWh' };
  }

  const numValue = Number(value);
  //const units = ['kWh', 'MWh', 'GWh', 'TWh'];
  const units = ['MWh', 'GWh', 'TWh'];
  let scaledValue = numValue;
  let unitIndex = 0;

  // Special rule: for 0–1000 show kWh but divide by 1000
  if (numValue > 0 && numValue < 1000) {
    //scaledValue = numValue / 1000;
    return { value: scaledValue.toFixed(2), unit: 'kWh' };
  }

  // Default scaling rule
  while (scaledValue >= 1000 && unitIndex < units.length - 1) {
    scaledValue /= 1000;
    unitIndex++;
  }

  return {
    value: scaledValue.toFixed(2),
    unit: units[unitIndex-1]
  };
};


export const formatProductionValue = (value, forceUnit = null) => {
  if (value === null || value === undefined || isNaN(value)) {
    return { value: '--', unit: forceUnit || 'kWh' };
  }

  const numericValue = parseFloat(value);

  // Handle forced units with automatic scaling for large numbers
  if (forceUnit) {
    switch (forceUnit) {
      case 'W':
        if (numericValue >= 1000000) {
          return { value: (numericValue / 1000000).toFixed(2), unit: 'MW' };
        } else if (numericValue >= 1000) {
          return { value: (numericValue / 1000).toFixed(2), unit: 'kW' };
        }
        return { value: numericValue.toFixed(2), unit: 'W' };

      case 'kW':
        if (numericValue >= 1000000) {
          return { value: (numericValue / 1000000).toFixed(2), unit: 'GW' };
        } else if (numericValue >= 1000) {
          return { value: (numericValue / 1000).toFixed(2), unit: 'MW' };
        }
        return { value: numericValue.toFixed(2), unit: 'kW' };

      case 'kWp':
        if (numericValue >= 1000000000000) {
          return { value: (numericValue / 1000000000000).toFixed(2), unit: 'TWp' };
        } else if (numericValue >= 1000000000) {
          return { value: (numericValue / 1000000000).toFixed(2), unit: 'GWp' };
        } else if (numericValue >= 1000000) {
          return { value: (numericValue / 1000000).toFixed(2), unit: 'MWp' };
        } else if (numericValue >= 1000) {
          return { value: (numericValue / 1000).toFixed(2), unit: 'kWp' };
        }
        return { value: numericValue.toFixed(2), unit: 'Wp' };

      case 'MWh':
        // Only scale to GWh if value is >= 1,000,000 (1 million MWh)
        if (numericValue >= 1000000) {
          return { value: (numericValue / 1000000).toFixed(2), unit: 'TWh' };
        } else if (numericValue >= 10000) {
          return { value: (numericValue / 1000).toFixed(2), unit: 'GWh' };
        }
        return { value: numericValue.toFixed(2), unit: 'MWh' };

      case 'kWh':
        if (numericValue >= 1000000) {
          return { value: (numericValue / 1000000).toFixed(2), unit: 'GWh' };
        } else if (numericValue >= 1000) {
          return { value: (numericValue / 1000).toFixed(2), unit: 'MWh' };
        }
        return { value: numericValue.toFixed(2), unit: 'kWh' };

      default:
        return { value: numericValue.toFixed(2), unit: forceUnit };
    }
  }

  const response = formatEnergyWithUnit(value);
  return response;
};

/**
 * Formats a production value for display with its unit
 * @param {number} value - The production value
 * @param {string} forceUnit - Optional parameter to force a specific unit
 * @returns {string} - Formatted string with value and unit
 */
export const formatProductionDisplay = (value, forceUnit = null) => {
  const { value: formattedValue, unit } = formatProductionValue(value, forceUnit);
  return `${formattedValue} ${unit}`;
};

/**
 * Formats production data from the API response
 * @param {object} data - The API response data
 * @returns {object} - Formatted production data with appropriate units
 */
export const formatProductionData = (data) => {
  if (!data) return null;

  return {
    installed_capacity: formatProductionValue(data.installed_capacity, 'kW'),
    daily_production: formatProductionValue(data.daily_production ?? data.current_day_production, 'kWh'),
    current_power: formatProductionValue(data.current_power, 'W'),
    utilization_percentage: data.utilization_percentage,
    current_day_production: formatProductionValue(data.current_day_production ?? data.daily_production, 'kWh'),
    monthly_production: formatProductionValue(data.monthly_production, 'kWh'),
    // API provides yearly_production in kWh; convert appropriately
    yearly_production: formatProductionValue(data.yearly_production ?? data.yearlyProduction, 'kWh'),
    // API provides total_production in kWh; convert appropriately
    total_production: formatProductionValue(data.total_production ?? data.totalProduction, 'kWh')
  };
}; 