import React, { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { getApiBaseUrl } from '../../services/api';

const REQUEST_TIMEOUT_MS = 15000;

type CommissionFrom = 'Sales' | 'Service' | 'Rental';

interface Commission {
  _id: string;
  commissionFrom?: string;
  userId?: { _id: string; name: string } | string;
  orderId?: string | { _id: string };
  salesInvoiceId?: string | { _id: string };
  serviceInvoiceId?: string | { _id: string };
  rentalInvoiceId?: string | { _id: string };
  commissionAmount: number;
  isPaid?: boolean;
  createdAt: string;
}

const getCommissionFromFromRoute = (routeName: string): CommissionFrom => {
  if (routeName === 'ServicePartners') return 'Service';
  if (routeName === 'RentalPartners') return 'Rental';
  return 'Sales';
};

const CommissionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const paramsCommissionFrom = route.params?.commissionFrom as CommissionFrom | undefined;
  const routeName = route.name || 'Commission';
  const commissionFrom =
    paramsCommissionFrom && ['Sales', 'Service', 'Rental'].includes(paramsCommissionFrom)
      ? paramsCommissionFrom
      : getCommissionFromFromRoute(routeName);

  const { token } = useSelector((state: RootState) => state.auth);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useLayoutEffect(() => {
    const title =
      commissionFrom === 'Service'
        ? 'Partners (Service)'
        : commissionFrom === 'Rental'
          ? 'Partners (Rental)'
          : 'Partners (Sales)';
    navigation.setOptions({ title });
  }, [navigation, commissionFrom]);

  const fetchCommissions = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setLoading(true);
    try {
      const url = `${getApiBaseUrl()}/commissions?commissionFrom=${commissionFrom}`;
      const response = await axios.get(url, {
        headers: { Authorization: token },
        timeout: REQUEST_TIMEOUT_MS,
        signal: controller.signal,
      });
      if (!mountedRef.current) return;
      // Defensive: ensure we have an array and don't throw while processing
      const list = Array.isArray(response?.data?.commissions) ? response.data.commissions : [];
      setCommissions(list);
      const initial = new Set<string>();
      try {
        list.forEach((c: Commission) => {
          const userId = c.userId
            ? (typeof c.userId === 'object' ? (c.userId?.name ?? 'Unassigned') : String(c.userId)) || 'Unassigned'
            : 'Unassigned';
          initial.add(userId);
        });
      } catch (_) {
        // ignore parse errors per item
      }
      setExpandedUsers(initial);
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      if (!mountedRef.current) return;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        (err?.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Failed to load commissions');
      setError(message);
      setCommissions([]);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
      });
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      abortRef.current = null;
    }
  }, [token, commissionFrom]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      fetchCommissions();
      return () => {
        mountedRef.current = false;
        if (abortRef.current) {
          abortRef.current.abort();
          abortRef.current = null;
        }
        setLoading(false);
        setRefreshing(false);
      };
    }, [fetchCommissions])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCommissions();
  }, [fetchCommissions]);

  const filteredCommissions = useMemo(() => {
    const lower = search.toLowerCase();
    return commissions.filter(
      (c) =>
        (c._id && c._id.toLowerCase().includes(lower)) ||
        (typeof c.userId === 'object' && c.userId?.name?.toLowerCase().includes(lower)) ||
        (typeof c.userId === 'string' && c.userId.toLowerCase().includes(lower)) ||
        (c.orderId && String(c.orderId).toLowerCase().includes(lower)) ||
        (c.serviceInvoiceId && String(c.serviceInvoiceId).toLowerCase().includes(lower)) ||
        (c.rentalInvoiceId && String(c.rentalInvoiceId).toLowerCase().includes(lower)) ||
        (c.salesInvoiceId && String(c.salesInvoiceId).toLowerCase().includes(lower))
    );
  }, [commissions, search]);

  const groupedCommissions = useMemo(() => {
    const acc: Record<string, Commission[]> = {};
    filteredCommissions.forEach((c) => {
      const userId =
        typeof c.userId === 'object' ? c.userId?.name || 'Unassigned' : c.userId || 'Unassigned';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(c);
    });
    return acc;
  }, [filteredCommissions]);

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const getInvoiceOrOrderId = (c: Commission): string | null => {
    const o = c.orderId;
    const s = c.serviceInvoiceId;
    const r = c.rentalInvoiceId;
    const sales = c.salesInvoiceId;
    if (o) return typeof o === 'object' ? o._id : o;
    if (s) return typeof s === 'object' ? s._id : s;
    if (r) return typeof r === 'object' ? r._id : r;
    if (sales) return typeof sales === 'object' ? sales._id : sales;
    return null;
  };

  const handlePressInvoiceOrOrder = (c: Commission) => {
    const id = getInvoiceOrOrderId(c);
    if (!id) return;
    if (commissionFrom === 'Sales') {
      navigation.navigate('Orders', { screen: 'OrderUpdate', params: { orderId: id } });
    } else {
      navigation.navigate('AddServiceInvoice', { invoiceId: id });
    }
  };

  const groupEntries = useMemo(
    () => Object.entries(groupedCommissions),
    [groupedCommissions]
  );

  if (loading && commissions.length === 0 && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#019ee3" />
        <Text style={styles.loadingText}>Loading commissions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, employee, order/invoice…"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
        <Icon name="search" size={22} color="#019ee3" style={styles.searchIcon} />
      </View>

      {error && commissions.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#019ee3']} />
          }
        >
          <Icon name="error-outline" size={64} color="#F44336" />
          <Text style={styles.emptyTitle}>Could not load partners</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchCommissions();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Retry</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : groupEntries.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#019ee3']} />
          }
        >
          <Icon name="account-balance-wallet" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No commissions found</Text>
          <Text style={styles.emptySub}>Check your search or filters</Text>
        </ScrollView>
      ) : (
        <FlatList
          data={groupEntries}
          keyExtractor={([userId]) => userId}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#019ee3']} />
          }
          renderItem={({ item: [userId, userCommissions] }) => {
            const isExpanded = expandedUsers.has(userId);
            return (
              <View style={styles.group}>
                <TouchableOpacity
                  style={styles.groupHeader}
                  onPress={() => toggleExpand(userId)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={isExpanded ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.groupTitle}>User: {userId}</Text>
                </TouchableOpacity>
                {isExpanded &&
                  userCommissions.map((c) => {
                    const refId = getInvoiceOrOrderId(c);
                    const userName =
                      typeof c.userId === 'object' ? c.userId?.name : c.userId || '—';
                    return (
                      <View key={c._id} style={styles.row}>
                        <View style={styles.cell}>
                          <Text style={styles.cellLabel}>User</Text>
                          <Text style={styles.cellValue}>{userName}</Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellLabel}>
                            {commissionFrom === 'Sales' ? 'Order' : 'Invoice'} ID
                          </Text>
                          {refId ? (
                            <TouchableOpacity
                              onPress={() => handlePressInvoiceOrOrder(c)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.link}>{refId}</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.cellValue}>—</Text>
                          )}
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellLabel}>Amount</Text>
                          <Text style={styles.amount}>
                            ₹ {(c.commissionAmount ?? 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellLabel}>Paid</Text>
                          <Text style={styles.cellValue}>{c.isPaid ? 'Yes' : 'No'}</Text>
                        </View>
                        <View style={styles.cell}>
                          <Text style={styles.cellLabel}>Date</Text>
                          <Text style={styles.cellValue}>
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString('en-IN')
                              : '—'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafd',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#019ee3',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  searchIcon: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#019ee3',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#019ee3',
    borderRadius: 8,
    minWidth: 120,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  group: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#e8f4fc',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cell: {
    marginBottom: 6,
  },
  cellLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 14,
    color: '#333',
  },
  link: {
    fontSize: 14,
    color: '#019ee3',
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

export default CommissionScreen;
