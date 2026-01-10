import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import globalStyles from '../styles/style';

/**
 * InfoCard component for displaying information in a card format
 * @param {object} props - Component props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card content
 * @param {object} props.style - Additional styles for the card container
 * @param {object} props.titleStyle - Additional styles for the card title
 * @param {object} props.contentStyle - Additional styles for the content container
 * @param {number} props.width - Specific width for the card container
 * @returns {React.ReactElement} InfoCard component
 */
const InfoCard = ({ 
  title, 
  children, 
  style, 
  titleStyle, 
  contentStyle, 
  width
}) => {
  return (
    <View style={[globalStyles.plantDetail, style, width ? { width: width } : {}]}>
      {title && (
        <Text style={[globalStyles.cardTitle, titleStyle]}>
          {title}
        </Text>
      )}
      <View style={[contentStyle]}>
        {children}
      </View>
    </View>
  );
};

export default InfoCard; 
