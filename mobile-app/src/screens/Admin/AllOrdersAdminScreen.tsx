import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { RootState } from '../../store';
import { getApiBaseUrl } from '../../services/api';

/**
 * Mirrors the web `/all-order/delete` utility: lists every order from the API.
 * Read-only; no delete actions (same as current web page).
 */
const AllOrdersAdminScreen = () => {
  const { token, user } = useSelector((s: RootState) => s.auth);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 1 || Number(user?.role) === 1;

  const load = async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const { data } = await axios.get(`${getApiBaseUrl()}/user/get-all-order`, {
        headers: { Authorization: token },
        timeout: 120000,
      });
      if (data?.success) {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } else {
        setOrders([]);
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load orders',
        text2: e?.response?.data?.message || e?.message || 'Request failed',
      });
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      setLoading(true);
      load();
    }, [token, isAdmin])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>This screen is for administrators only.</Text>
      </View>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
        <Text style={[styles.muted, { marginTop: 12 }]}>Loading all orders…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item, index) => String(item?._id ?? index)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <Text style={styles.headerNote}>
          Total: {orders.length} order{orders.length === 1 ? '' : 's'} (same data as web “all orders”
          view).
        </Text>
      }
      renderItem={({ item }) => {
        const buyer = item.buyer;
        const buyerName =
          typeof buyer === 'object' && buyer?.name ? buyer.name : '—';
        const ship = item.shippingInfo;
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>₹{item.amount ?? '—'}</Text>
            <Text style={styles.line}>Status: {item.orderStatus ?? '—'}</Text>
            <Text style={styles.line}>Buyer: {buyerName}</Text>
            {ship?.city ? (
              <Text style={styles.line}>
                {ship.city}, {ship.state ?? ''} {ship.pincode ?? ''}
              </Text>
            ) : null}
            <Text style={styles.idLine} numberOfLines={1}>
              {String(item._id)}
            </Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.muted}>No orders returned from the server.</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  muted: { fontSize: 15, color: '#666', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  headerNote: { fontSize: 14, color: '#666', marginBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#019ee3', marginBottom: 6 },
  line: { fontSize: 14, color: '#333', marginTop: 2 },
  idLine: { fontSize: 11, color: '#999', marginTop: 8 },
});

export default AllOrdersAdminScreen;
