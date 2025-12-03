import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmployeeListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Employee List</Text>
      <Text style={styles.subtext}>Implementation coming soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
  subtext: { fontSize: 14, color: '#666', marginTop: 10 },
});

export default EmployeeListScreen;

