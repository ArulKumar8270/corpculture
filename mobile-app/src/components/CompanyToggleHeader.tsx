import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  setCompanyEnabled,
  setSelectedCompany,
  setCompanyDetails,
} from '../store/slices/companySlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface CompanyToggleHeaderProps {
  onCompanyChange?: (enabled: boolean) => void;
}

const CompanyToggleHeader: React.FC<CompanyToggleHeaderProps> = ({
  onCompanyChange,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { isCompanyEnabled, selectedCompany, companyDetails } = useSelector(
    (state: RootState) => state.company
  );
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);

  // Load company settings when component mounts or screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCompanySettings();
      // Also reload if company is enabled
      if (isCompanyEnabled && isAuthenticated && token) {
        fetchCompanyDetails();
      }
    }, [isAuthenticated, token])
  );

  useEffect(() => {
    if (isAuthenticated && token && isCompanyEnabled) {
      fetchCompanyDetails();
    }
  }, [isAuthenticated, token, isCompanyEnabled]);

  const loadCompanySettings = async () => {
    try {
      const storedCompanyEnabled = await AsyncStorage.getItem('isCompanyEnabled');
      const storedSelectedCompany = await AsyncStorage.getItem('selectedCompany');
      if (storedCompanyEnabled) {
        const enabled = JSON.parse(storedCompanyEnabled);
        dispatch(setCompanyEnabled(enabled));
      }
      if (storedSelectedCompany) {
        dispatch(setSelectedCompany(storedSelectedCompany));
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const fetchCompanyDetails = async () => {
    if (!isAuthenticated || !token || !user) return;
    try {
      let response;
      if (user.role === 0 && user.phone) {
        response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL || 'https://nicknameinfo.net/corpculture/api/v1'}/company/user-company/${user.phone}`,
          { headers: { Authorization: token || '' } }
        );
        if (response.data?.success && response.data.company) {
          const companies = Array.isArray(response.data.company)
            ? response.data.company
            : [response.data.company];
          dispatch(setCompanyDetails(companies));
        }
      } else {
        response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL || 'https://nicknameinfo.net/corpculture/api/v1'}/company/all?limit=1000`,
          { headers: { Authorization: token || '' } }
        );
        if (response.data?.success && response.data.companies) {
          dispatch(setCompanyDetails(response.data.companies));
        }
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const handleToggleCompany = async () => {
    const newValue = !isCompanyEnabled;
    dispatch(setCompanyEnabled(newValue));
    try {
      await AsyncStorage.setItem('isCompanyEnabled', JSON.stringify(newValue));
      if (newValue && isAuthenticated && token) {
        await fetchCompanyDetails();
      }
      if (onCompanyChange) {
        onCompanyChange(newValue);
      }
    } catch (error) {
      console.error('Error saving company enabled state:', error);
    }
  };

  const handleSelectCompany = async (companyId: string) => {
    dispatch(setSelectedCompany(companyId));
    setCompanyPickerVisible(false);
    try {
      await AsyncStorage.setItem('selectedCompany', companyId);
    } catch (error) {
      console.error('Error saving selected company:', error);
    }
  };

  const handleCreateNewCompany = async () => {
    dispatch(setSelectedCompany('new'));
    setCompanyPickerVisible(false);
    try {
      await AsyncStorage.setItem('selectedCompany', 'new');
      navigation.navigate('CreateCompany' as never);
    } catch (error) {
      console.error('Error saving selected company:', error);
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show company toggle for unauthenticated users
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggleCompany}
      >
        <View style={[styles.toggleSwitch, isCompanyEnabled && styles.toggleSwitchActive]}>
          {isCompanyEnabled && <View style={styles.toggleSwitchThumb} />}
        </View>
        <Text style={styles.toggleText}>Company</Text>
      </TouchableOpacity>

      {isCompanyEnabled && (
        <TouchableOpacity
          style={styles.companyButton}
          onPress={() => setCompanyPickerVisible(true)}
        >
          <Icon name="business" size={18} color="#019ee3" />
          <Text style={styles.companyText} numberOfLines={1}>
            {selectedCompany === 'new'
              ? 'New Company'
              : selectedCompany
              ? companyDetails.find((c) => c._id === selectedCompany)?.companyName || 'Select'
              : 'Select Company'}
          </Text>
          <Icon name="arrow-drop-down" size={18} color="#019ee3" />
        </TouchableOpacity>
      )}

      {/* Company Picker Modal */}
      <Modal
        visible={companyPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCompanyPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <TouchableOpacity onPress={() => setCompanyPickerVisible(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <TouchableOpacity
                style={styles.companyOption}
                onPress={handleCreateNewCompany}
              >
                <Icon name="add-circle" size={20} color="#019ee3" />
                <Text style={styles.companyOptionText}>Create New Company</Text>
              </TouchableOpacity>
              {companyDetails.map((company: any) => (
                <TouchableOpacity
                  key={company._id}
                  style={[
                    styles.companyOption,
                    selectedCompany === company._id && styles.companyOptionSelected,
                  ]}
                  onPress={() => handleSelectCompany(company._id)}
                >
                  <Text style={styles.companyOptionText}>{company.companyName}</Text>
                  {selectedCompany === company._id && (
                    <Icon name="check" size={20} color="#019ee3" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleSwitch: {
    width: 36,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#019ee3',
  },
  toggleSwitchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  toggleText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  companyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    maxWidth: 120,
  },
  companyText: {
    fontSize: 11,
    color: '#019ee3',
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    maxHeight: 400,
  },
  companyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  companyOptionText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CompanyToggleHeader;

