import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { getApiBaseUrl } from '../../services/api';

const OrderFailedScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [time, setTime] = useState(5);
  const [reason, setReason] = useState('Your payment could not be completed.');

  useEffect(() => {
    let cancelled = false;
    const persistFailure = async () => {
      const storedReason = (await AsyncStorage.getItem('paymentFailureReason')) || '';
      if (storedReason && !cancelled) setReason(storedReason);

      const hdfcOrderId = ((await AsyncStorage.getItem('hdfcOrderId')) || '').trim();
      if (!hdfcOrderId || !token) {
        await AsyncStorage.removeItem('paymentFailureReason');
        return;
      }
      try {
        const { data } = await axios.post(
          `${getApiBaseUrl()}/user/hdfc/verify`,
          {
            hdfcOrderId,
            forceFail: true,
            failureReason: storedReason || 'Payment failed',
          },
          { headers: { Authorization: token } }
        );
        if (!cancelled && data?.failureReason) setReason(data.failureReason);
      } catch {
        /* still show failure UI */
      } finally {
        await AsyncStorage.removeItem('hdfcOrderId');
        await AsyncStorage.removeItem('hdfcPaymentUrl');
        await AsyncStorage.removeItem('paymentFailureReason');
      }
    };
    persistFailure();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (time === 0) {
      navigation.navigate('Cart' as never);
      return;
    }
    const intervalId = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [time, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="error-outline" size={64} color="#FF3B30" />
        </View>
        <Text style={styles.title}>Transaction Failed</Text>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={styles.subtitle}>
          Redirecting to cart in {time} sec
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Cart' as never)}
        >
          <Text style={styles.buttonText}>Go to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  reason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OrderFailedScreen;
