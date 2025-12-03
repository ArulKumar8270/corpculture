import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const RentalInvoiceDetailScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Rental Invoice Details</Text>
      <Text style={styles.text}>Implementation coming soon</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  text: { fontSize: 16, color: '#666' },
});

export default RentalInvoiceDetailScreen;

