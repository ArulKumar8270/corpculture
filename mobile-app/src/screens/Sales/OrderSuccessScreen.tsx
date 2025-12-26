import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { clearCart } from '../../store/slices/cartSlice';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { items: cartItems } = useSelector((state: RootState) => state.cart);

  const [time, setTime] = useState(3);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSavedPayment, setHasSavedPayment] = useState(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSessionId();
  }, []);

  const loadSessionId = async () => {
    try {
      const storedSessionId = await AsyncStorage.getItem('sessionId');
      setSessionId(storedSessionId);
    } catch (error) {
      console.error('Error loading session ID:', error);
    }
  };

  useEffect(() => {
    if (sessionId && cartItems.length > 0 && !hasSavedPayment) {
      savePayment();
    }
  }, [sessionId, cartItems, hasSavedPayment]);

  const savePayment = async () => {
    try {
      setLoading(true);
      const payment = await axios.post(
        `${getApiBaseUrl()}/user/payment-success`,
        {
          sessionId: sessionId,
          orderItems: cartItems,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (payment.status === 200) {
        if (user?.isCommissionEnabled) {
          await afterPaymentSuccess(payment.data.order, cartItems);
        }
        dispatch(clearCart());
        await AsyncStorage.removeItem('cart');
        await AsyncStorage.removeItem('sessionId');
        setHasSavedPayment(true);
      }
    } catch (error: any) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const commissionCalculation = (cartItems: any[], amount: number) => {
    const totalCommission = cartItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const priceRange = item.priceRange?.find(
        (range: any) => quantity >= parseFloat(range.from) && quantity <= parseFloat(range.to)
      );
      const commissionPercent = priceRange ? parseFloat(priceRange.commission) : 0;
      const commissionAmount = (amount * commissionPercent) / 100;
      return sum + commissionAmount;
    }, 0);
    return Number(totalCommission);
  };

  const afterPaymentSuccess = async (data: any, cartItems: any[]) => {
    try {
      setLoading(true);
      const apiParams = {
        userId: user?.parentId || user?._id,
        orderId: data?._id,
        commissionAmount: commissionCalculation(cartItems, data?.amount),
        percentageRate: data?.percentageRate,
        commissionFrom: 'Sales',
      };
      const payment = await axios.post(
        `${getApiBaseUrl()}/commissions`,
        apiParams,
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (payment.status === 201) {
        dispatch(clearCart());
        setHasSavedPayment(true);
      }
    } catch (error: any) {
      console.error('Error processing commission:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    intervalId.current = setInterval(() => {
      if (!loading) {
        setTime((prev) => {
          const temp = prev - 1;
          if (temp === 0) {
            if (intervalId.current) {
              clearInterval(intervalId.current);
            }
            navigation.navigate('Orders' as never);
          }
          return temp;
        });
      }
    }, 1000);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [loading, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={64} color="#22ba20" />
        </View>
        <Text style={styles.title}>Transaction Successful</Text>
        <Text style={styles.subtitle}>
          Redirecting to orders in {time} sec
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Orders' as never)}
        >
          <Text style={styles.buttonText}>Go to Orders</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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

export default OrderSuccessScreen;
