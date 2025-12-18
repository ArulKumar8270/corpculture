import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

interface ReportData {
  id: string;
  name: string;
  count: number;
  path: string;
}

const SalesReportsSummaryScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData[]>([]);

  useEffect(() => {
    // Simulate API call delay to fetch data
    // In a real application, these counts would be fetched from your backend API
    const timer = setTimeout(() => {
      const data: ReportData[] = [
        { id: 'products', name: 'Products', count: 350, path: '/admin/reports/sales/products' },
        { id: 'categories', name: 'Product Categories', count: 25, path: '/admin/reports/sales/categories' },
        { id: 'orders', name: 'Orders', count: 85, path: '/admin/reports/sales/orders' },
      ];
      setReportData(data);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleViewDetails = (item: ReportData) => {
    if (item.count === 0) {
      Toast.show({
        type: 'info',
        text1: 'Info',
        text2: 'No data available for this report.',
      });
      return;
    }
    Toast.show({
      type: 'info',
      text1: 'Info',
      text2: `Navigating to ${item.name} list.`,
    });
    // Navigation would be implemented when those screens are available
  };

  const renderReportItem = ({ item }: { item: ReportData }) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => handleViewDetails(item)}
      disabled={item.count === 0}
    >
      <View style={styles.reportItemContent}>
        <Text style={styles.reportItemName}>{item.name}</Text>
        <View style={[styles.countBadge, item.count === 0 && styles.countBadgeDisabled]}>
          <Text style={[styles.countText, item.count === 0 && styles.countTextDisabled]}>
            {item.count}
          </Text>
        </View>
      </View>
      {item.count > 0 && (
        <Icon name="chevron-right" size={24} color="#019ee3" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#019ee3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={64} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales Reports Summary</Text>
      </View>

      <FlatList
        data={reportData}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="description" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No sales summary data found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  listContent: {
    padding: 15,
  },
  reportItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  countBadgeDisabled: {
    backgroundColor: '#e0e0e0',
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  countTextDisabled: {
    color: '#999',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#019ee3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SalesReportsSummaryScreen;
