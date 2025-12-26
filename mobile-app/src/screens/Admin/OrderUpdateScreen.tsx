import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import TrackerScreen from '../Sales/TrackerScreen';

const OrderUpdateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/user/admin-order-detail?orderId=${orderId}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      
      if (response?.data?.orderDetails && response.data.orderDetails.length > 0) {
        // The API returns an array, we take the first item
        const orderData = response.data.orderDetails[0];
        setOrder(orderData);
        setStatus(orderData.orderStatus || '');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Order not found',
        });
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load order',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    setUpdating(true);
    try {
      const response = await axios.patch(
        `${getApiBaseUrl()}/user/update/order-status`,
        { status, orderId },
        {
          headers: {
            Authorization: token,
          },
        }
      );
      
      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order status updated successfully',
        });
        // Reload order to get updated data
        await loadOrder();
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update order status',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getActiveStep = (orderStatus: string) => {
    switch (orderStatus) {
      case 'Delivered':
        return 3;
      case 'Out For Delivery':
        return 2;
      case 'Shipped':
        return 1;
      default:
        return 0;
    }
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="error-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </View>
    );
  }

  const amount = order?.amount;
  const orderItems = order?.products || [];
  const buyer = order?.buyer;
  const paymentId = order?.paymentId;
  const shippingInfo = order?.shippingInfo;
  const createdAt = order?.createdAt;
  const orderStatus = order?.orderStatus;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Delivery Address Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.buyerName}>{buyer?.name || 'N/A'}</Text>
        <Text style={styles.address}>
          {shippingInfo?.address}, {shippingInfo?.city}, {shippingInfo?.state} - {shippingInfo?.pincode}
        </Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{buyer?.email || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{shippingInfo?.phoneNo || 'N/A'}</Text>
        </View>
      </View>

      {/* Update Status Section */}
      <View style={styles.section}>
        <View style={styles.statusHeader}>
          <Text style={styles.sectionTitle}>Update Status</Text>
        </View>
        <View style={styles.currentStatusContainer}>
          <Text style={styles.currentStatusLabel}>Current Status:</Text>
          <Text style={styles.currentStatusValue}>{orderStatus || 'Pending'}</Text>
        </View>
        <View style={styles.statusContainer}>
          {['Shipped', 'Out For Delivery', 'Delivered'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusButton, status === s && styles.statusButtonSelected]}
              onPress={() => setStatus(s)}
            >
              <Text
                style={[styles.statusButtonText, status === s && styles.statusButtonTextSelected]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.submitButton, updating && styles.submitButtonDisabled]}
          onPress={handleUpdateStatus}
          disabled={updating || !status}
        >
          {updating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Status</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Order Items */}
      {orderItems.map((item: any) => {
        const {
          _id,
          image,
          name,
          discountPrice,
          quantity,
          seller,
          deliveryCharge,
          installationCost,
          sendInvoice,
          isInstalation,
          price,
        } = item;

        return (
          <View key={_id} style={styles.orderItemCard}>
            <View style={styles.orderItemContent}>
              <Image
                source={{ uri: image || 'https://via.placeholder.com/100' }}
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={styles.productDetail}>Quantity: {quantity}</Text>
                {seller?.name && (
                  <Text style={styles.productDetail}>Seller: {seller.name}</Text>
                )}
                <Text style={styles.productDetail}>
                  Send Invoice: {sendInvoice ? 'Sent' : 'Not Sent'}
                </Text>
                <Text style={styles.productDetail}>
                  Installation: {isInstalation ? 'Requested' : 'Not Requested'}
                </Text>
                <Text style={styles.productPrice}>₹{price || discountPrice || 0}</Text>
                {paymentId && (
                  <Text style={styles.paymentId}>Payment Id: {paymentId}</Text>
                )}
              </View>
            </View>
            <View style={styles.trackerContainer}>
              <TrackerScreen
                orderOn={createdAt}
                activeStep={getActiveStep(orderStatus)}
              />
            </View>
          </View>
        );
      })}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentStatusContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  currentStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  currentStatusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  statusButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333',
  },
  statusButtonTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderItemCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItemContent: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  productDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 6,
  },
  paymentId: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  trackerContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default OrderUpdateScreen;
