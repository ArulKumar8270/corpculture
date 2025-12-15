import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const ServiceReportsScreen = () => {
  const navigation = useNavigation();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  // ServiceReportsScreen only shows Service Report type
  const [reportType] = useState('Service Report');

  useEffect(() => {
    if (token) {
      fetchReports();
    }
  }, [token, reportType]);

  useEffect(() => {
    filterReports();
  }, [searchTerm]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Backend routes:
      // - /getByassigned/:assignedTo?/:reportType? - for employees
      // - /:reportType? - for admins
      // The client uses /report/${userId}/${reportType} but that doesn't match any route correctly
      // We should use /getByassigned for employees to match the backend route
      let url: string;
      if (user?.role === 3) {
        // Employee: use getByassigned route to match backend
        url = `${process.env.EXPO_PUBLIC_API_URL}/report/getByassigned/${user?._id}/${reportType}`;
      } else {
        // Admin: use reportType route
        url = `${process.env.EXPO_PUBLIC_API_URL}/report/${reportType}`;
      }

      console.log('Fetching reports from:', url);
      console.log('User role:', user?.role);
      console.log('User ID:', user?._id);
      console.log('Report type:', reportType);

      const response = await axios.get(url, {
        headers: {
          Authorization: token || '',
        },
      });

      console.log('Reports response:', response.data);
      console.log('Reports count:', response.data?.reports?.length || 0);

      if (response.data?.success) {
        const allReports = response.data.reports || [];
        // Filter to only show Service Report type (client-side filtering as backup)
        const fetchedReports = allReports.filter((report: any) => {
          // Check both reportType and reportFor fields
          const isServiceReport = 
            report.reportType === 'Service Report' || 
            report.reportFor === 'service' ||
            (report.reportType && report.reportType.toLowerCase().includes('service') && !report.reportType.toLowerCase().includes('rental'));
          return isServiceReport;
        });
        setReports(fetchedReports);
        console.log('Total reports received:', allReports.length);
        console.log('Service reports filtered:', fetchedReports.length);
        if (fetchedReports.length === 0) {
          console.log('No service reports found for the given criteria');
        }
      } else {
        console.warn('Response not successful:', response.data);
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request URL:', error.config?.url);
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to load reports',
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    // Filtering is handled in renderReport
  };

  const toggleExpand = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const handleEdit = (report: any) => {
    (navigation as any).navigate('AddServiceReport', {
      id: report._id, // AddServiceReportScreen expects 'id', not 'reportId'
      reportType: report.reportType || 'Service Report',
      reportFor: report.reportFor || 'service',
    });
  };

  const handleDelete = async (reportId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/report/${reportId}`,
                {
                  headers: {
                    Authorization: token || '',
                  },
                }
              );

              if (response.data?.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: response.data.message || 'Report deleted successfully!',
                });
                fetchReports();
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: response.data?.message || 'Failed to delete report',
                });
              }
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to delete report',
              });
            }
          },
        },
      ]
    );
  };

  const handleSendReport = async (report: any) => {
    try {
      await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {
        reportId: report._id,
      });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Report sent successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send report',
      });
    }
  };

  const filteredReports = reports.filter((report) => {
    // First ensure it's a service report (double check)
    const isServiceReport = 
      report.reportType === 'Service Report' || 
      report.reportFor === 'service' ||
      (report.reportType && report.reportType.toLowerCase().includes('service') && !report.reportType.toLowerCase().includes('rental'));
    
    if (!isServiceReport) {
      return false;
    }

    // Then apply search filter
    if (!searchTerm) {
      return true;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      report.company?.companyName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      report.problemReport?.toLowerCase().includes(lowerCaseSearchTerm) ||
      report.reportType?.toLowerCase().includes(lowerCaseSearchTerm) ||
      report.assignedTo?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      new Date(report.createdAt).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const renderReport = ({ item }: { item: any }) => {
    const isExpanded = expandedReports.has(item._id);

    return (
      <View style={styles.reportCard}>
        <TouchableOpacity
          style={styles.reportHeader}
          onPress={() => toggleExpand(item._id)}
        >
          <View style={styles.reportHeaderLeft}>
            <Text style={styles.companyName}>{item.company?.companyName || 'N/A'}</Text>
            <Text style={styles.reportType}>{item.reportType || 'Service Report'}</Text>
            <Text style={styles.reportDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Icon
            name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={24}
            color="#666"
          />
        </TouchableOpacity>

        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Problem Report:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>
              {item.problemReport || 'N/A'}
            </Text>
          </View>
          {item.assignedTo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>
                {item.assignedTo?.name || item.assignedTo || 'N/A'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasPermission('serviceReport', 'edit') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEdit(item)}
              >
                <Icon name="edit" size={18} color="#007AFF" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item._id)}
              >
                <Icon name="delete" size={18} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={() => handleSendReport(item)}
          >
            <Icon name="send" size={18} color="#fff" />
            <Text style={[styles.actionButtonText, styles.sendButtonText]}>Send Report</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Problem Report */}
            {item.problemReport && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Problem Report</Text>
                <Text style={styles.sectionText}>{item.problemReport}</Text>
              </View>
            )}

            {/* Remarks/Pending Works */}
            {item.remarksPendingWorks && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Remarks / Pending Works</Text>
                <Text style={styles.sectionText}>{item.remarksPendingWorks}</Text>
              </View>
            )}

            {/* Access Service */}
            {item.accessService && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Access Service</Text>
                <Text style={styles.sectionText}>{item.accessService}</Text>
              </View>
            )}

            {/* Model & Serial Number */}
            {(item.modelNo || item.serialNo) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Model & Serial Number</Text>
                <Text style={styles.sectionText}>
                  Model: {item.modelNo || 'N/A'} | Serial: {item.serialNo || 'N/A'}
                </Text>
              </View>
            )}

            {/* Branch */}
            {item.branch && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Branch</Text>
                <Text style={styles.sectionText}>{item.branch}</Text>
              </View>
            )}

            {/* Reference */}
            {item.reference && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reference</Text>
                <Text style={styles.sectionText}>{item.reference}</Text>
              </View>
            )}

            {/* Usage Data */}
            {item.usageData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Usage Data</Text>
                <Text style={styles.sectionText}>{item.usageData}</Text>
              </View>
            )}

            {/* Description */}
            {item.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{item.description}</Text>
              </View>
            )}

            {/* Materials */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Materials</Text>
              {(item.materialGroups && item.materialGroups.length > 0) ? (
                item.materialGroups.map((group: any, groupIndex: number) => (
                  <View key={groupIndex} style={styles.materialGroup}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    {group.products && group.products.length > 0 ? (
                      group.products.map((material: any, matIndex: number) => (
                        <View key={matIndex} style={styles.materialRow}>
                          <View style={styles.materialInfo}>
                            <Text style={styles.materialName}>{material.productName}</Text>
                            <Text style={styles.materialDetails}>
                              Qty: {material.quantity} | Rate: ₹{material.rate} | Total: ₹
                              {material.totalAmount}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No products listed for this group.</Text>
                    )}
                  </View>
                ))
              ) : item.materials && item.materials.length > 0 ? (
                item.materials.map((material: any, matIndex: number) => (
                  <View key={matIndex} style={styles.materialRow}>
                    <View style={styles.materialInfo}>
                      <Text style={styles.materialName}>{material.productName}</Text>
                      <Text style={styles.materialDetails}>
                        Qty: {material.quantity} | Rate: ₹{material.rate} | Total: ₹{material.totalAmount}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No materials listed for this report.</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Reports</Text>
        {hasPermission('serviceReport', 'edit') && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('AddServiceReport')}
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Service Reports Screen - Only shows Service Report type */}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Reports (Company, Problem, Type, Assigned To, Date)"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={fetchReports}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No service reports found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#019ee3',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loader: {
    marginTop: 50,
  },
  reportCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportHeaderLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  reportType: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 3,
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 5,
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  sendButton: {
    backgroundColor: '#28a745',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  sendButtonText: {
    color: '#fff',
  },
  expandedContent: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  materialGroup: {
    marginBottom: 15,
  },
  groupName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 8,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 8,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  materialDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default ServiceReportsScreen;

