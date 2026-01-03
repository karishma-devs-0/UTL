import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DetailedProductionChartsScreen = ({ route }) => {
  const { plantId, plantName } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detailed Production Charts</Text>
      <Text style={styles.text}>Plant ID: {plantId || 'N/A'}</Text>
      <Text style={styles.text}>Plant Name: {plantName || 'N/A'}</Text>
      {/* Placeholder for charts and other content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
});

export default DetailedProductionChartsScreen;



