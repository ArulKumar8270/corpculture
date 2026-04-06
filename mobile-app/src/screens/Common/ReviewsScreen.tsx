import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

/**
 * The web “user reviews” page is a ComingSoon placeholder; we mirror that here.
 */
const ReviewsScreen = () => {
  return (
    <View style={styles.container}>
      <Icon name="rate-review" size={64} color="#ccc" />
      <Text style={styles.title}>My reviews</Text>
      <Text style={styles.subtitle}>Same as web — coming soon</Text>
      <Text style={styles.description}>
        Product reviews are not exposed in the mobile or web customer dashboards yet. You can
        continue shopping; when review features go live, they will appear here.
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

export default ReviewsScreen;
