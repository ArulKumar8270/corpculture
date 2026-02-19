import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

const PaymentCardsScreen = () => {
  return (
    <View style={styles.container}>
      <Icon name="credit-card" size={64} color="#ccc" />
      <Text style={styles.title}>Payment Cards</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        Save and manage your payment methods for faster checkout.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#019ee3',
    marginTop: 8,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default PaymentCardsScreen;
