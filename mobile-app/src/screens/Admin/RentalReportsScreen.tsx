import React, { useEffect, useState, useCallback } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import Toast from 'react-native-toast-message';
import ReportListFilters from '../../components/ReportListFilters';
import ReportPagination from '../../components/ReportPagination';
import TrashStatusToggle from '../../components/TrashStatusToggle';
import {
  buildTrashListUrl,
  restoreFromTrash,
  isTrashView,
  type TrashViewMode,
} from '../../utils/trashApi';
import {
  getReportSendWebhook,
  isOperationalDocumentReportType,
  getDocumentTitle,
  getDocumentListScreen,
  getDocumentSuccessMessage,
  getDocumentPermissionKey,
  RENTAL_REPORT_TYPE,
  buildReportListQueryParams,
  ReportListFilterValues,
} from '../../utils/reportListApi';
import { collectReportSerialNumbers } from '../../utils/reportSerialNumbers';
import { downloadReportAndOpen } from '../../utils/reportDownload';
import { getServiceProductDisplayName } from '../../utils/serviceProductDisplayName';
import { presentDocumentSentNotification } from '../../services/pushNotifications';

function companyIdFromReport(report: any): string | undefined {
  const c = report?.company;
  if (c && typeof c === 'object' && c._id) return String(c._id);
  if (typeof c === 'string' && c.trim()) return c.trim();
  const cid = report?.companyId;
  if (cid && typeof cid === 'object' && cid._id) return String(cid._id);
  if (typeof cid === 'string' && cid.trim()) return cid.trim();
  return undefined;
}

const RentalReportsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const reportTypeKey = route.params?.reportTypeKey || RENTAL_REPORT_TYPE;
  const screenTitle = route.params?.screenTitle || 'Rental Reports';
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [sendingReport, setSendingReport] = useState<string | null>(null);
  const [uploadingReportId, setUploadingReportId] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const docPermissionKey = getDocumentPermissionKey(reportTypeKey);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<ReportListFilterValues>({
    fromDate: '',
    toDate: '',
    companyName: '',
    assignedTo: '',
    serialNo: '',
  });
  const [viewMode, setViewMode] = useState<TrashViewMode>('active');

  const fetchReports = useCallback(
    async (filterValues = filters, currentPage = page, currentRowsPerPage = rowsPerPage) => {
      if (!token) return;
      try {
        setLoading(true);
        const query = buildReportListQueryParams(
          filterValues,
          reportTypeKey,
          currentPage,
          currentRowsPerPage
        );
        const path =
          Number(user?.role) === 3 && user?._id
            ? `/report/getByassigned/${user._id}/${reportTypeKey}?${query.toString()}`
            : `/report/${reportTypeKey}?${query.toString()}`;
        const url = buildTrashListUrl(path, viewMode);

        const response = await axios.get(url, {
          headers: { Authorization: token || '' },
        });

        if (response.data?.success) {
          setReports(response.data.reports || []);
          setTotalCount(response.data.totalCount || 0);
        } else {
          setReports([]);
          setTotalCount(0);
        }
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.message || error.message || 'Failed to load reports',
        });
        setReports([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [token, user?.role, user?._id, reportTypeKey, viewMode]
  );

  useEffect(() => {
    if (token) fetchReports(filters, page, rowsPerPage);
  }, [token, page, rowsPerPage, viewMode]);

  const handleApplyFilters = () => {
    setPage(0);
    fetchReports(filters, 0, rowsPerPage);
  };

  const handleClearFilters = () => {
    const cleared: ReportListFilterValues = {
      fromDate: '',
      toDate: '',
      companyName: '',
      assignedTo: '',
      serialNo: '',
    };
    setFilters(cleared);
    setPage(0);
    fetchReports(cleared, 0, rowsPerPage);
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
    (navigation as any).navigate('AddRentalReport', {
      id: report._id || report,
      reportType: reportTypeKey,
      reportFor: report.reportFor || 'rental',
    });
  };

  const handleDelete = async (reportId: string) => {
    Alert.alert('Trash Report', 'Are you sure you want to move this report to trash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Trash',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await axios.delete(
              `${getApiBaseUrl()}/report/${reportId}`,
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
                text2: response.data.message || 'Report moved to trash successfully',
              });
              fetchReports();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: response.data.message || 'Failed to move to trash report',
              });
            }
          } catch (error: any) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error.response?.data?.message || 'Failed to move to trash report',
            });
          }
        },
      },
    ]);
  };

  const handleRestore = (reportId: string) => {
    Alert.alert('Restore Report', 'Restore this report from trash?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          try {
            const response = await restoreFromTrash('/report', reportId, token || '');
            if (response.data?.success) {
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: response.data.message || 'Report restored successfully',
              });
              fetchReports();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: response.data?.message || 'Failed to restore report',
              });
            }
          } catch (error: any) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: error.response?.data?.message || 'Failed to restore report',
            });
          }
        },
      },
    ]);
  };

  const navigatePetrolForm = (report: any) => {
    const preselectedFromCompanyId = companyIdFromReport(report);
    if (!preselectedFromCompanyId) {
      Toast.show({
        type: 'info',
        text1: 'No company on this report',
        text2: 'Cannot pre-fill petrol form company.',
      });
      return;
    }
    const params = { preselectedFromCompanyId };
    if (Number(user?.role) === 1) {
      (navigation as any).navigate('Employees', { screen: 'ActivityLogForm', params });
    } else {
      (navigation as any).navigate('Profile', { screen: 'ActivityLogForm', params });
    }
  };

  const handleSendReport = async (report: any) => {
    const sendType = reportTypeKey;
    const isOperationalDoc = isOperationalDocumentReportType(sendType);
    const docTitle = getDocumentTitle(sendType);
    const reportId = report?._id || report;
    setSendingReport(reportId);
    try {
      if (report?.reportType && report.reportType !== sendType) {
        try {
          await axios.put(
            `${getApiBaseUrl()}/report/${reportId}`,
            { reportType: sendType, reportFor: sendType },
            { headers: { Authorization: token || '' } }
          );
        } catch (fixErr) {
          console.error('Failed to correct document type before send:', fixErr);
        }
      }
      await axios.post(getReportSendWebhook(sendType), {
        reportId,
      });
      const enquiryId = report?.serviceId?._id || report?.serviceId;
      if (enquiryId && sendType === RENTAL_REPORT_TYPE) {
        try {
          await axios.put(
            `${getApiBaseUrl()}/rental/update/${enquiryId}`,
            { status: 'Completed' },
            { headers: { Authorization: token || '' } }
          );
        } catch (statusErr) {
          console.error('Failed to mark rental enquiry completed:', statusErr);
        }
      }
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: getDocumentSuccessMessage(sendType, 'sent'),
      });
      presentDocumentSentNotification(
        isOperationalDoc ? docTitle : 'Report',
        isOperationalDoc ? getDocumentListScreen(sendType) : 'RentalReports',
        reportId
      );
      fetchReports();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: isOperationalDoc ? `Failed to send ${docTitle}` : 'Failed to send report',
      });
    } finally {
      setSendingReport(null);
    }
  };

  const handleUploadReport = async (report: any) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.All
          || [(ImagePicker as any).MediaType?.Images, (ImagePicker as any).MediaType?.Videos].filter(Boolean)
          || 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploadingReportId(report._id);

      const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      let mimeType = asset.mimeType || 'image/jpeg';
      if (!asset.mimeType && fileExtension === 'pdf') mimeType = 'application/pdf';
      if (!asset.mimeType && fileExtension === 'png') mimeType = 'image/png';

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: mimeType,
        name: `report_${report._id}_${Date.now()}.${fileExtension}`,
      } as any);

      const uploadRes = await axios.post(`${getApiBaseUrl()}/auth/upload-file`, formData, {
        headers: {
          Authorization: token || '',
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      if (!uploadRes.data?.fileUrl) {
        throw new Error('File upload failed');
      }

      await axios.put(
        `${getApiBaseUrl()}/report/${report._id}`,
        { reportLink: [...(report.reportLink || []), uploadRes.data.fileUrl] },
        { headers: { Authorization: token || '' } }
      );

      Toast.show({ type: 'success', text1: 'Success', text2: 'Report uploaded successfully!' });
      fetchReports();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to upload report',
      });
    } finally {
      setUploadingReportId(null);
    }
  };

  const handleDownloadReport = async (report: any) => {
    const docTitle = getDocumentTitle(reportTypeKey);
    setDownloadingReportId(report._id);
    try {
      const opened = await downloadReportAndOpen(report);
      if (!opened) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `${docTitle === 'Report' ? 'Report' : docTitle} PDF is not ready yet. Send the document first, or upload a file.`,
        });
      }
    } catch (error: any) {
      console.error('Rental report download failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Unable to open download link',
      });
    } finally {
      setDownloadingReportId(null);
    }
  };

  const filteredReports = reports.filter((report) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      report.company?.companyName?.toLowerCase().includes(q) ||
      report.problemReport?.toLowerCase().includes(q) ||
      report.modelNo?.toLowerCase().includes(q) ||
      report.branch?.toLowerCase().includes(q) ||
      report.assignedTo?.name?.toLowerCase().includes(q) ||
      collectReportSerialNumbers(report).toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage]);

  const renderReport = ({ item }: { item: any }) => {
    const isExpanded = expandedReports.has(item._id);
    const isSendingThis = sendingReport === item._id;
    const isUploadingThis = uploadingReportId === item._id;
    const isDownloadingThis = downloadingReportId === item._id;

    return (
      <View style={styles.reportCard}>
        <TouchableOpacity
          style={styles.reportHeader}
          onPress={() => toggleExpand(item._id)}
        >
          <View style={styles.reportHeaderLeft}>
            <Text style={styles.reportType}>
              {isOperationalDocumentReportType(reportTypeKey)
                ? getDocumentTitle(reportTypeKey)
                : item.reportType || 'Rental Report'}
            </Text>
            {isTrashView(viewMode) && (
              <View style={styles.trashBadge}>
                <Text style={styles.trashBadgeText}>Trash</Text>
              </View>
            )}
            <Text style={styles.companyName}>{item.company?.companyName || 'N/A'}</Text>
            {/* Model/Serial/Usage/Description are now per-product (inside Materials) */}
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
            <Text style={styles.detailValue}>{item.problemReport || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Branch:</Text>
            <Text style={styles.detailValue}>{item.branch || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted At:</Text>
            <Text style={styles.detailValue}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial No:</Text>
            <Text style={styles.serialValue}>{collectReportSerialNumbers(item)}</Text>
          </View>
          {item.assignedTo && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned To:</Text>
              <Text style={styles.detailValue}>{item.assignedTo?.name || item.assignedTo || 'N/A'}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {!isTrashView(viewMode) && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.sendButton]}
                onPress={() => handleSendReport(item)}
                disabled={isSendingThis}
              >
                {isSendingThis ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="send" size={18} color="#fff" />
                    <Text style={[styles.actionButtonText, styles.sendButtonText]}>
                      {isOperationalDocumentReportType(reportTypeKey)
                        ? `Send ${getDocumentTitle(reportTypeKey)}`
                        : 'Send'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.uploadButton]}
                onPress={() => handleUploadReport(item)}
                disabled={isUploadingThis}
              >
                {isUploadingThis ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="upload-file" size={18} color="#fff" />
                    <Text style={[styles.actionButtonText, styles.uploadButtonText]}>Upload</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => handleDownloadReport(item)}
                disabled={isDownloadingThis}
              >
                {isDownloadingThis ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Icon name="download" size={18} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Download</Text>
                  </>
                )}
              </TouchableOpacity>
              {(user?.role === 1 || user?.role === 3) && companyIdFromReport(item) ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => navigatePetrolForm(item)}
                >
                  <Icon name="playlist-add-check" size={18} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Petrol Form</Text>
                </TouchableOpacity>
              ) : null}
              {(hasPermission(docPermissionKey, 'edit') || user?.role === 1) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(item)}
                >
                  <Icon name="edit" size={18} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
              )}
              {(hasPermission(docPermissionKey, 'delete') || user?.role === 1) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(item._id)}
                >
                  <Icon name="delete" size={18} color="#FF3B30" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Trash</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {isTrashView(viewMode) && (hasPermission(docPermissionKey, 'edit') || hasPermission(docPermissionKey, 'delete') || user?.role === 1) && (
            <TouchableOpacity
              style={[styles.actionButton, styles.restoreButton]}
              onPress={() => handleRestore(item._id)}
            >
              <Icon name="restore" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, styles.restoreButtonText]}>Restore</Text>
            </TouchableOpacity>
          )}
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.problemReport && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Problem Report</Text>
                <Text style={styles.sectionText}>{item.problemReport}</Text>
              </View>
            )}
            {item.remarksPendingWorks && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Remarks / Pending Works</Text>
                <Text style={styles.sectionText}>{item.remarksPendingWorks}</Text>
              </View>
            )}
            {item.reference && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reference</Text>
                <Text style={styles.sectionText}>{item.reference}</Text>
              </View>
            )}
            <Text style={styles.materialsTitle}>Materials</Text>
            {(item.materialGroups && item.materialGroups.length > 0) ? (
              item.materialGroups.map((group: any, groupIndex: number) => (
                <View key={groupIndex} style={styles.materialGroup}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {group.modelNo ? (
                    <Text style={styles.materialDetails}>Model: {group.modelNo}</Text>
                  ) : null}
                  {group.serialNo ? (
                    <Text style={styles.materialDetails}>Serial: {group.serialNo}</Text>
                  ) : null}
                  {group.products && group.products.length > 0 ? (
                    group.products.map((material: any, matIndex: number) => (
                      <View key={matIndex} style={styles.materialRow}>
                        <View style={styles.materialInfo}>
                          <Text style={styles.materialName}>
                            {typeof material.productName === 'string' && material.productName.trim()
                              ? material.productName
                              : material.modelName || getServiceProductDisplayName(material)}
                          </Text>
                          {material.serialNo ? (
                            <Text style={styles.materialDetails}>Serial: {material.serialNo}</Text>
                          ) : null}
                          {material.usageData ? (
                            <Text style={styles.materialDetails}>Usage: {material.usageData}</Text>
                          ) : null}
                          {material.description ? (
                            <Text style={styles.materialDetails} numberOfLines={2}>
                              Desc: {material.description}
                            </Text>
                          ) : null}
                          {material.accessService ? (
                            <Text style={styles.materialDetails}>Access Service: {material.accessService}</Text>
                          ) : null}
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
                    <Text style={styles.materialName}>
                      {typeof material.productName === 'string' && material.productName.trim()
                        ? material.productName
                        : material.modelName || getServiceProductDisplayName(material)}
                    </Text>
                    {material.serialNo ? (
                      <Text style={styles.materialDetails}>Serial: {material.serialNo}</Text>
                    ) : null}
                    {material.usageData ? (
                      <Text style={styles.materialDetails}>Usage: {material.usageData}</Text>
                    ) : null}
                    {material.description ? (
                      <Text style={styles.materialDetails} numberOfLines={2}>
                        Desc: {material.description}
                      </Text>
                    ) : null}
                    {material.accessService ? (
                      <Text style={styles.materialDetails}>Access Service: {material.accessService}</Text>
                    ) : null}
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
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{screenTitle}</Text>
        {(hasPermission(docPermissionKey, 'edit') || user?.role === 1) && !isTrashView(viewMode) && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              (navigation as any).navigate('AddRentalReport', {
                reportType: reportTypeKey,
                reportFor: 'rental',
              })
            }
          >
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.toggleContainer}>
        <TrashStatusToggle viewMode={viewMode} onChange={setViewMode} />
      </View>

      <ReportListFilters
        values={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Quick search loaded reports…"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#019ee3" style={styles.loader} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item) => item._id}
          refreshing={loading}
          onRefresh={() => fetchReports()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No {getDocumentTitle(reportTypeKey)} entries found</Text>
            </View>
          }
        />
      )}
      <ReportPagination
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => {
          setRowsPerPage(r);
          setPage(0);
        }}
      />
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
  toggleContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: '#fff',
  },
  trashBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  trashBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  restoreButton: {
    backgroundColor: '#28a745',
  },
  restoreButtonText: {
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
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  reportHeaderLeft: {
    flex: 1,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#019ee3',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  modelNo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  serialNo: {
    fontSize: 12,
    color: '#666',
  },
  reportDetails: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  serialValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#019ee3',
    flex: 1,
    flexWrap: 'wrap',
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
  sendButton: {
    backgroundColor: '#28a745',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#007AFF',
  },
  sendButtonText: {
    color: '#fff',
  },
  uploadButton: {
    backgroundColor: '#28a745',
  },
  uploadButtonText: {
    color: '#fff',
  },
  downloadButton: {
    backgroundColor: '#e3f2fd',
  },
  deleteButtonText: {
    color: '#FF3B30',
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
  materialsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
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
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  paginationWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  rowsPerPageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowsPerPageLabel: { fontSize: 14, color: '#666', marginRight: 8 },
  rowsPerPageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowsPerPageBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
  rowsPerPageBtnActive: { backgroundColor: '#019ee3' },
  rowsPerPageBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  rowsPerPageBtnTextActive: { color: '#fff' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#019ee3', borderRadius: 8, marginHorizontal: 8 },
  pageBtnDisabled: { backgroundColor: '#ccc', opacity: 0.8 },
  pageBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageInfo: { fontSize: 14, color: '#333' },
});

export default RentalReportsScreen;
