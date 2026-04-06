import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

/**
 * The web client’s payment-cards route is also a “Coming soon” placeholder.
 * Checkout uses your chosen payment method per order; saved cards are not wired yet.
 */
const PaymentCardsScreen = () => {
  return (
    <View style={styles.container}>
      <Icon name="credit-card" size={64} color="#ccc" />
      <Text style={styles.title}>Payment cards</Text>
      <Text style={styles.subtitle}>Not available in the app yet</Text>
      <Text style={styles.description}>
        This matches the web dashboard: card vaulting is not implemented. You can still pay during
        checkout with the options offered for each order.
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#019ee3',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});

export default PaymentCardsScreen;
