/**
 * Utility functions for formatting values
 */

import React from 'react';
import { Text } from 'react-native';

/**
 * Format a date string or timestamp to a readable format
 * @param {string|number} dateValue - Date string, ISO string, or timestamp
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateValue, options = {}) => {
  if (!dateValue) return 'N/A';
  
  try {
    const date = new Date(dateValue);
    
    // Default options
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format power value to kW or W with appropriate precision
 * @param {number} value - Power value in kW
 * @param {number} decimals - Number of decimal places
 * @returns {JSX.Element} Formatted power with properly nested Text
 */
export const formatPower = (value, decimals = 2) => {
  if (value === undefined || value === null) return 'N/A';
  
  // If value is less than 1, show as W
  if (value < 1) {
    // Display in Watts if less than 1 kW
    return `${(value * 1000).toFixed(0)} W`;
  }
  
  // Display in kiloWatts otherwise
  return `${value.toFixed(decimals)} kW`;
};

/**
 * Format energy value to kWh or MWh with appropriate precision
 * @param {number} value - Energy value in kWh
 * @param {number} decimals - Number of decimal places
 * @returns {JSX.Element} Formatted energy with properly nested Text
 */
export const formatEnergy = (value, decimals = 2) => {
  if (value === null || value === undefined) {
    return '-- kWh';
  }
  const absValue = Math.abs(value);

  if (absValue >= 1000) {
    // Display in MWh if 1000 kWh or more
    return `${(value / 1000).toFixed(decimals)} MWh`;
  } else {
    // Display in kWh otherwise
    return `${value.toFixed(decimals)} kWh`;
  }
};

/**
 * Format currency value with currency symbol and separators
 * @param {number} value - Currency value
 * @param {string} currency - Currency code (e.g., 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD') => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return 'Invalid value';
  }
};

/**
 * Format number with thousand separators
 * @param {number} value - Numeric value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === undefined || value === null) return 'N/A';
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error formatting number:', error);
    return 'Invalid value';
  }
};

/**
 * Format percentage value
 * @param {number} value - Percentage value (e.g., 0.75 for 75%)
 * @param {number} decimals - Number of decimal places
 * @param {boolean} multiply - Whether to multiply by 100 first
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1, multiply = true) => {
  if (value === undefined || value === null) return 'N/A';
  
  const percentValue = multiply ? value * 100 : value;
  return `${percentValue.toFixed(decimals)}%`;
}; 