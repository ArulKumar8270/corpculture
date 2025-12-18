import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';

interface ReportCategory {
  name: string;
  screen: string;
  icon: string;
  color: string;
}

const ReportsDashboardScreen = () => {
  const navigation = useNavigation();

  const reportCategories: ReportCategory[] = [
    {
      name: 'Company Reports',
      screen: 'CompanyReports',
      icon: 'business',
      color: '#019ee3',
    },
    {
      name: 'Service Reports',
      screen: 'ServiceReportsSummary',
      icon: 'build',
      color: '#28a745',
    },
    {
      name: 'Rental Reports',
      screen: 'RentalReportsSummary',
      icon: 'inventory',
      color: '#ffc107',
    },
    {
      name: 'Sales Reports',
      screen: 'SalesReportsSummary',
      icon: 'shopping-cart',
      color: '#dc3545',
    },
  ];

  const handleNavigate = (screen: string) => {
    (navigation as any).navigate('Reports', {
      screen: screen,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports Dashboard</Text>
      </View>

      <View style={styles.categoriesContainer}>
        {reportCategories.map((category) => (
          <TouchableOpacity
            key={category.name}
            style={styles.categoryCard}
            onPress={() => handleNavigate(category.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${category.color}20` }]}>
              <Icon name={category.icon as any} size={32} color={category.color} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.viewButton}>
              <Text style={[styles.viewButtonText, { color: category.color }]}>
                View Reports
              </Text>
              <Icon name="chevron-right" size={20} color={category.color} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  categoriesContainer: {
    padding: 15,
    gap: 15,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportsDashboardScreen;
