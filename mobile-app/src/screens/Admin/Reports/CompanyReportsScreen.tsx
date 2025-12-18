import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import axios from 'axios';
import Toast from 'react-native-toast-message';

interface Company {
  _id: string;
  companyName: string;
  companyAddress: string;
  mobileNumber: string;
  serviceInvoiceCount: number;
  serviceQuotationCount: number;
  serviceReportCount: number;
  rentalInvoiceCount: number;
  rentalQuotationCount: number;
  rentalReportCount: number;
}

const CompanyReportsScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchCompanies();
    }, [token])
  );

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    if (!token) {
      setError('Authentication token not available. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/company/all`,
        {
          headers: { Authorization: token },
        }
      );

      if (response.data.success && Array.isArray(response.data.companies)) {
        const mappedCompanies: Company[] = response.data.companies.map((c: any) => ({
          _id: c._id,
          companyName: c.companyName,
          companyAddress: c.billingAddress || c.addressDetail || '',
          mobileNumber: c.mobileNumber || c.phone || 'N/A',
          serviceInvoiceCount: c.serviceInvoiceCount || 0,
          serviceQuotationCount: c.serviceQuotationCount || 0,
          serviceReportCount: c.serviceReportCount || 0,
          rentalInvoiceCount: c.rentalInvoiceCount || 0,
          rentalQuotationCount: c.rentalQuotationCount || 0,
          rentalReportCount: c.rentalReportCount || 0,
        }));
        setCompanies(mappedCompanies);
      } else {
        setCompanies([]);
        setError(response.data.message || 'Failed to fetch company data.');
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError('Failed to load company data.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load company data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewServiceInvoices = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceInvoicesReport',
      params: { companyId, type: 'invoice' },
    });
  };

  const handleViewServiceQuotations = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceInvoicesReport',
      params: { companyId, type: 'quotation' },
    });
  };

  const handleViewServiceReports = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceReportsReport',
      params: { companyId, type: 'service' },
    });
  };

  const handleViewRentalInvoices = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'RentalInvoiceReport',
      params: { companyId, type: 'invoice' },
    });
  };

  const handleViewRentalQuotations = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'RentalInvoiceReport',
      params: { companyId, type: 'quotation' },
    });
  };

  const handleViewRentalReports = (companyId: string) => {
    (navigation as any).navigate('Reports', {
      screen: 'ServiceReportsReport',
      params: { companyId, type: 'rental' },
    });
  };

  const filteredCompanies = companies.filter((company) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyName = company.companyName?.toLowerCase() || '';
    const mobileNumber = company.mobileNumber?.toLowerCase() || '';

    return (
      companyName.includes(lowerCaseSearchTerm) ||
      mobileNumber.includes(lowerCaseSearchTerm)
    );
  });

  const renderCompanyItem = ({ item }: { item: Company }) => (
    <View style={styles.companyCard}>
      <View style={styles.companyHeader}>
        <Text style={styles.companyName}>{item.companyName}</Text>
        <Text style={styles.companyAddress}>{item.companyAddress}</Text>
        <Text style={styles.companyMobile}>{item.mobileNumber}</Text>
      </View>

      <View style={styles.reportsSection}>
        <Text style={styles.sectionTitle}>Service Reports</Text>
        <View style={styles.reportRow}>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.serviceInvoiceCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewServiceInvoices(item._id)}
            disabled={item.serviceInvoiceCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.serviceInvoiceCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Invoices: {item.serviceInvoiceCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.serviceQuotationCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewServiceQuotations(item._id)}
            disabled={item.serviceQuotationCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.serviceQuotationCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Quotations: {item.serviceQuotationCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.serviceReportCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewServiceReports(item._id)}
            disabled={item.serviceReportCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.serviceReportCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Reports: {item.serviceReportCount}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Rental Reports</Text>
        <View style={styles.reportRow}>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.rentalInvoiceCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewRentalInvoices(item._id)}
            disabled={item.rentalInvoiceCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.rentalInvoiceCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Invoices: {item.rentalInvoiceCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.rentalQuotationCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewRentalQuotations(item._id)}
            disabled={item.rentalQuotationCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.rentalQuotationCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Quotations: {item.rentalQuotationCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countButton,
              item.rentalReportCount === 0 && styles.countButtonDisabled,
            ]}
            onPress={() => handleViewRentalReports(item._id)}
            disabled={item.rentalReportCount === 0}
          >
            <Text
              style={[
                styles.countButtonText,
                item.rentalReportCount === 0 && styles.countButtonTextDisabled,
              ]}
            >
              Reports: {item.rentalReportCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchCompanies}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Reports</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Company Name or Mobile Number"
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCompanies}
        renderItem={renderCompanyItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchTerm ? 'No companies found matching your search' : 'No company data found'}
            </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyHeader: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  companyMobile: {
    fontSize: 14,
    color: '#666',
  },
  reportsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#019ee3',
    marginBottom: 10,
  },
  reportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  countButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#019ee3',
    minWidth: 100,
  },
  countButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  countButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#019ee3',
    textAlign: 'center',
  },
  countButtonTextDisabled: {
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
    textAlign: 'center',
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

export default CompanyReportsScreen;
