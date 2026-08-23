import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface ReportCategory {
  name: string;
  screen: string;
  icon: string;
  color: string;
  parent?: string;
}

/** Mirrors web AdminMenu Reports section. */
const ReportsDashboardScreen = () => {
  const navigation = useNavigation();

  const reportCategories: ReportCategory[] = [
    { name: 'Company Reports', screen: 'CompanyReports', icon: 'business', color: '#019ee3' },
    { name: 'Service Reports', screen: 'ServiceReportsSummary', icon: 'build', color: '#28a745' },
    { name: 'Rental Reports', screen: 'RentalReportsSummary', icon: 'inventory', color: '#ffc107' },
    { name: 'Sales Reports', screen: 'SalesReportsSummary', icon: 'shopping-cart', color: '#dc3545' },
    { name: 'Employees', screen: 'EmployeeList', icon: 'badge', color: '#6f42c1', parent: 'Employees' },
    { name: 'Customers & Partners', screen: 'UserManagement', icon: 'groups', color: '#20c997', parent: 'Settings' },
    { name: 'Petrol Form Report', screen: 'ActivityLogReport', icon: 'local-gas-station', color: '#5C6BC0' },
    { name: 'Leave Report', screen: 'LeaveReport', icon: 'event-note', color: '#26A69A' },
    { name: 'Employee Benefits', screen: 'EmployeeBenefitsReport', icon: 'card-giftcard', color: '#8BC34A' },
    { name: 'Service Enquiries Report', screen: 'ServiceEnquiriesReport', icon: 'inbox', color: '#E91E63' },
    { name: 'Service Invoices Report', screen: 'ServiceInvoicesReport', icon: 'receipt', color: '#3F51B5' },
    { name: 'Service Reports Report', screen: 'ServiceReportsReport', icon: 'assessment', color: '#009688' },
    { name: 'Rental Invoice Report', screen: 'RentalInvoiceReport', icon: 'description', color: '#FF7043' },
  ];

  const handleNavigate = (item: ReportCategory) => {
    if (item.parent) {
      (navigation as any).navigate(item.parent, { screen: item.screen });
      return;
    }
    (navigation as any).navigate('Reports', { screen: item.screen });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtitle}>Same report set as the web admin menu</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {reportCategories.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={styles.categoryCard}
            onPress={() => handleNavigate(category)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <Icon name={category.icon as any} size={28} color={category.color} />
            </View>
            <View style={styles.categoryTextWrap}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={[styles.viewButtonText, { color: category.color }]}>Open</Text>
            </View>
            <Icon name="chevron-right" size={22} color={category.color} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 24 },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#019ee3' },
  headerSubtitle: { marginTop: 4, fontSize: 13, color: '#666' },
  categoriesContainer: { padding: 16, gap: 10 },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextWrap: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '700', color: '#333' },
  viewButtonText: { marginTop: 2, fontSize: 12, fontWeight: '600' },
});

export default ReportsDashboardScreen;
