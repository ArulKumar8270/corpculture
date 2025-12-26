import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setOrders, setLoading } from '../../store/slices/orderSlice';
import { orderService } from '../../services/api';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import CompanyToggleHeader from '../../components/CompanyToggleHeader';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { orders, isLoading } = useSelector((state: RootState) => state.order);
  const { token } = useSelector((state: RootState) => state.auth);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLocalLoading(true);
    dispatch(setLoading(true));
    try {
      // Use direct axios call to ensure proper error handling
      const response = await axios.get(
        `${getApiBaseUrl()}/user/orders`,
        {
          headers: { Authorization: token || '' },
          timeout: 30000,
        }
      );
      
      if (response.data?.orders) {
        dispatch(setOrders(response.data.orders || []));
      } else {
        dispatch(setOrders([]));
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to load orders',
      });
      dispatch(setOrders([]));
    } finally {
      setLocalLoading(false);
      dispatch(setLoading(false));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'shipped':
        return '#34C759';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => (navigation as any).navigate('OrderDetail', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>
          {item.orderNumber || item._id?.slice(-8) || 'Order #N/A'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || item.orderStatus || 'pending') }]}>
          <Text style={styles.statusText}>
            {(item.status || item.orderStatus || 'Pending').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.orderDate}>
        Date: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
      </Text>
      <Text style={styles.orderTotal}>
        Total: ₹{item.total ? item.total.toFixed(2) : item.amount ? item.amount.toFixed(2) : '0.00'}
      </Text>
      <Text style={styles.productCount}>
        {item.products?.length || 0} product{(item.products?.length || 0) > 1 ? 's' : ''}
      </Text>
      <Icon name="chevron-right" size={24} color="#999" style={styles.chevron} />
    </TouchableOpacity>
  );

  if ((localLoading || isLoading) && orders.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (orders.length === 0 && !isLoading && !localLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Your orders will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header with Company Toggle */}
      <View style={styles.topHeader}>
        <CompanyToggleHeader />
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading || localLoading}
        onRefresh={loadOrders}
        ListEmptyComponent={
          !isLoading && !localLoading ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubtext}>Your orders will appear here</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topHeader: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 5,
  },
  productCount: {
    fontSize: 14,
    color: '#999',
  },
  chevron: {
    position: 'absolute',
    right: 15,
    top: '50%',
    marginTop: -12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
});

export default OrdersScreen;

