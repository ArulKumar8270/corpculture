import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import TrackerScreen from './TrackerScreen';
import {
  getStoredOrderProductBaseUnit,
  getStoredOrderProductLineTotal,
} from '../../utils/orderAmountUtil';

const OrderDetailScreen = () => {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const { token } = useSelector((state: RootState) => state.auth);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/user/order-detail?orderId=${orderId}`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );

      const details = response.data?.orderDetails;
      const orderData = Array.isArray(details) ? details[0] : details;
      setOrder(orderData || null);
    } catch (error) {
      console.error('Error loading order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getActiveStep = (status: string) => {
    const statusMap: { [key: string]: number } = {
      pending: 0,
      processing: 0,
      shipped: 1,
      'out for delivery': 2,
      delivered: 3,
    };
    return statusMap[status?.toLowerCase()] || 0;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Order not found</Text>
      </View>
    );
  }

  const shippingInfo = order.shippingInfo;
  const shippingAddress = shippingInfo
    ? `${shippingInfo.address || ''}, ${shippingInfo.city || ''}, ${shippingInfo.state || ''} - ${shippingInfo.pincode || ''}`
    : 'N/A';
  const orderStatus = order.orderStatus || order.status || 'Pending';
  const products = order.products || [];
  const totalAmount = Number(order.amount || order.total || 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Order Reference:</Text>
          <Text style={styles.value}>{order.orderReferenceNo || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{orderStatus}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Tracking</Text>
        <TrackerScreen
          activeStep={getActiveStep(orderStatus)}
          orderOn={order.createdAt}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products</Text>
        {products.map((product: any, index: number) => {
          const baseUnit = getStoredOrderProductBaseUnit(product);
          const lineTotal = getStoredOrderProductLineTotal(product);
          const qty = Number(product.quantity) || 1;

          return (
            <View key={product._id || index} style={styles.productItem}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDetails}>
                Qty: {qty} × ₹{baseUnit.toLocaleString()} = ₹{lineTotal.toLocaleString()}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        <Text style={styles.address}>{shippingAddress}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString()}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  productItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default OrderDetailScreen;
