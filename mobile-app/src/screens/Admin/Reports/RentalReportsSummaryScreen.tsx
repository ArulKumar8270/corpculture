import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RentalReportsSummaryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rental Reports Summary</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default RentalReportsSummaryScreen;
