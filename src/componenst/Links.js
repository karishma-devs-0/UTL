import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from '../styles/style';

const LinkComponent = ({ text }) => {
  return (
    <TouchableOpacity>
      <Text style={styles.linkText}>{text}</Text>
    </TouchableOpacity>
  );
};

export default LinkComponent;
