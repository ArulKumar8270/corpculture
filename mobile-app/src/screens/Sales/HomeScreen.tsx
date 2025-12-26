import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore - @expo/vector-icons is available via expo dependency
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { serviceEnquiryService, rentalService, companyService } from '../../services/api';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/api';
import CompanyToggleHeader from '../../components/CompanyToggleHeader';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [email, setEmail] = useState('');
  
  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [fetchedServices, setFetchedServices] = useState<any[]>([]);
  const [fetchedCompanies, setFetchedCompanies] = useState<any[]>([]);
  const [isFetchingServices, setIsFetchingServices] = useState(false);
  const [isCompanyEnabled, setIsCompanyEnabled] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [companyDetails, setCompanyDetails] = useState<any[]>([]);
  const [companyPickerVisible, setCompanyPickerVisible] = useState(false);
  
  // Company form states
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    billingAddress: '',
    invoiceType: 'Corpculture Invoice',
    city: '',
    state: '',
    pincode: '',
    gstNo: '',
    customerType: 'New',
    customerComplaint: '',
    phone: '',
  });
  const [serviceDeliveryAddresses, setServiceDeliveryAddresses] = useState([{ address: '', pincode: '' }]);
  const [contactPersons, setContactPersons] = useState([{ name: '', mobile: '', email: '' }]);
  const [companyLoading, setCompanyLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    customerType: '',
    phone: '',
    companyName: '',
    companyId: '',
    complaint: '',
    contactPerson: '',
    email: '',
    address: '',
    location: '',
    oldServiceId: '',
    serviceImage: null as any,
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Banner carousel data (matching client)
  const bannerData = [
    {
      id: '1',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '2',
      image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '3',
      image: 'https://images.pexels.com/photos/163117/airplane-flight-sky-clouds-163117.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '4',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '5',
      image: 'https://images.pexels.com/photos/163117/airplane-flight-sky-clouds-163117.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '6',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '7',
      image: 'https://images.pexels.com/photos/163117/airplane-flight-sky-clouds-163117.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
    {
      id: '8',
      image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    },
  ];

  // Service categories (OfferSection)
  const serviceCategories = [
    {
      id: '1',
      title: 'Rental',
      description: 'Sed ac arcu sed felis vulputate molestie. Nullam at urna',
      image: 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      color: '#34C759',
      discount: '25% OFF',
      type: 'rental',
    },
    {
      id: '2',
      title: 'Credit',
      description: 'Sed ac arcu sed felis vulputate molestie. Nullam at urna',
      image: 'https://images.pexels.com/photos/3747139/pexels-photo-3747139.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      color: '#FF3B30',
      discount: '25% OFF',
      type: 'credit',
    },
    {
      id: '3',
      title: 'AMC / AMLC',
      description: 'Sed ac arcu sed felis vulputate molestie. Nullam at urna',
      image: 'https://images.pexels.com/photos/5834/nature-grass-leaf-green.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      color: '#34C759',
      discount: '25% OFF',
      type: 'amc',
    },
  ];

  // Services list (matching client colors)
  const services = [
    {
      id: '1',
      title: 'AC Service',
      description: 'Professional AC installation, repair and maintenance services',
      icon: 'ac-unit',
      color: '#EF4444', // red-500
    },
    {
      id: '2',
      title: 'Printer Service',
      description: 'Expert printer repair, maintenance and troubleshooting',
      icon: 'print',
      color: '#A855F7', // fuchsia-500
    },
    {
      id: '3',
      title: 'Toner & Cartridge',
      description: 'Quality toner and cartridge refill for all printer models',
      icon: 'inventory',
      color: '#F59E0B', // amber-500
    },
    {
      id: '4',
      title: 'Waterproof & Paint',
      description: 'Professional waterproofing and painting solutions',
      icon: 'format-paint',
      color: '#84CC16', // lime-500
    },
    {
      id: '5',
      title: 'Mobile Service',
      description: 'Complete mobile repair and maintenance services',
      icon: 'phone-android',
      color: '#06B6D4', // cyan-500
    },
    {
      id: '6',
      title: 'Computer Service',
      description: 'Comprehensive computer repair and support services',
      icon: 'computer',
      color: '#9333EA', // purple-500
    },
    {
      id: '7',
      title: 'CCTV/Camera Fixing',
      description: 'Professional CCTV installation and maintenance services',
      icon: 'videocam',
      color: '#8B5CF6', // violet-500
    },
  ];

  // Products (Coming Soon) - matching client images
  const products = [
    {
      id: '1',
      title: 'Foods',
      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#EF4444', // red-600
    },
    {
      id: '2',
      title: 'Events Management',
      image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#9333EA', // purple-600
    },
    {
      id: '3',
      title: 'Printer & Toner',
      image: 'https://images.pexels.com/photos/3843284/pexels-photo-3843284.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#84CC16', // lime-600
    },
    {
      id: '4',
      title: 'CCTV Camera Fixing',
      image: 'https://images.pexels.com/photos/430208/pexels-photo-430208.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#8B5CF6', // violet-600
    },
    {
      id: '5',
      title: 'Computer Service',
      image: 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#2563EB', // blue-600
    },
    {
      id: '6',
      title: 'Stationery',
      image: 'https://images.pexels.com/photos/6446709/pexels-photo-6446709.jpeg?auto=compress&cs=tinysrgb&w=800',
      badgeColor: '#6B7280', // gray-600
    },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Create Rental Enquiry',
      icon: 'receipt-long',
      screen: 'CreateRentalEnquiry',
      color: '#007AFF',
      requiresAuth: true,
    },
    {
      id: '2',
      title: 'Create Service Enquiry',
      icon: 'build',
      screen: 'CreateServiceEnquiry',
      color: '#34C759',
      requiresAuth: true,
    },
    {
      id: '3',
      title: 'Create Company',
      icon: 'business',
      screen: 'CreateCompany',
      color: '#FF9500',
      requiresAuth: true,
    },
  ];

  // Load companies on mount
  React.useEffect(() => {
    if (showOfferModal || showServiceModal) {
      loadCompanies();
    }
  }, [showOfferModal, showServiceModal]);

  // Initialize company settings from AsyncStorage
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const storedCompanyEnabled = await AsyncStorage.getItem('isCompanyEnabled');
        const storedSelectedCompany = await AsyncStorage.getItem('selectedCompany');
        
        if (storedCompanyEnabled !== null) {
          setIsCompanyEnabled(JSON.parse(storedCompanyEnabled));
        }
        if (storedSelectedCompany !== null) {
          setSelectedCompany(storedSelectedCompany);
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };
    
    loadCompanySettings();
  }, []);

  // Show company modal when "new" company is selected
  useEffect(() => {
    if (selectedCompany === 'new' && isCompanyEnabled) {
      setShowCompanyModal(true);
    } else {
      setShowCompanyModal(false);
    }
  }, [selectedCompany, isCompanyEnabled]);

  // Fetch company details when authenticated
  useEffect(() => {
    if (isAuthenticated && token && isCompanyEnabled) {
      fetchCompanyDetails();
    }
  }, [isAuthenticated, token, isCompanyEnabled]);

  // Refresh company list when screen is focused (e.g., after creating a company)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token && isCompanyEnabled) {
        fetchCompanyDetails();
      }
    }, [isAuthenticated, token, isCompanyEnabled])
  );

  const fetchCompanyDetails = async () => {
    if (!isAuthenticated || !token || !user) return;
    try {
      let response;
      // For customers (role 0), use user-company endpoint
      if (user.role === 0 && user.phone) {
        response = await axios.get(
          `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/company/user-company/${user.phone}`,
          { headers: { Authorization: token || '' } }
        );
        // Handle response structure: { success: true, company: [...] }
        if (response.data?.success && response.data.company) {
          // company is an array in this response
          setCompanyDetails(Array.isArray(response.data.company) ? response.data.company : [response.data.company]);
        }
      } else {
        // For admin/employee, use all companies endpoint
        response = await axios.get(
          `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/company/all?limit=1000`,
          { headers: { Authorization: token || '' } }
        );
        // Handle response structure: { success: true, companies: [...] }
        if (response.data?.success && response.data.companies) {
          setCompanyDetails(response.data.companies);
        }
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await companyService.getCompanies();
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  };

  const handleOfferClick = (offer: typeof serviceCategories[0]) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
    resetForm();
  };

  const handleServiceClick = (service: typeof services[0]) => {
    setSelectedService(service);
    setShowServiceModal(true);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      customerType: '',
      phone: '',
      companyName: '',
      companyId: '',
      complaint: '',
      contactPerson: '',
      email: '',
      address: '',
      location: '',
      oldServiceId: '',
      serviceImage: null,
    });
    setFormErrors({});
    setFetchedServices([]);
    setFetchedCompanies([]);
    setIsFetchingServices(false);
  };

  const fetchServicesByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setFetchedServices([]);
      return;
    }
    
    setIsFetchingServices(true);
    try {
      const API_BASE_URL = getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1';
      
      // Fetch services based on which modal is open
      if (selectedService) {
        // For service enquiry modal
        const response = await axios.get(`${API_BASE_URL}/service/phone/${phoneNumber}`);
        if (response.data?.success && response.data?.services) {
          setFetchedServices(response.data.services);
        } else {
          setFetchedServices([]);
        }
      } else if (selectedOffer) {
        // For rental/credit/amc enquiry modal
        const response = await axios.get(`${API_BASE_URL}/rental/phone/${phoneNumber}`);
        if (response.data?.success && response.data?.rental) {
          setFetchedServices(response.data.rental);
        } else {
          setFetchedServices([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching services by phone:', error);
      setFetchedServices([]);
      // Don't show error for 404 (no services found)
      if (error.response?.status !== 404) {
        console.warn('Failed to fetch services:', error.message);
      }
    } finally {
      setIsFetchingServices(false);
    }
  };

  const fetchCompaniesByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      setFetchedCompanies([]);
      return;
    }
    
    try {
      const API_BASE_URL = getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1';
      const response = await axios.get(`${API_BASE_URL}/company/getByPhone/${phoneNumber}`);
      
      if (response.data?.success && response.data?.company) {
        setFetchedCompanies(response.data.company);
      } else {
        setFetchedCompanies([]);
      }
    } catch (error: any) {
      console.error('Error fetching companies by phone:', error);
      setFetchedCompanies([]);
      // Don't show error for 404 (no companies found)
      if (error.response?.status !== 404) {
        console.warn('Failed to fetch companies:', error.message);
      }
    }
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.customerType) errors.customerType = 'Type of customer is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) errors.phone = 'Phone number must be 10 digits';
    if (!formData.companyName) errors.companyName = 'Company name is required';
    if (!formData.contactPerson) errors.contactPerson = 'Contact person is required';
    if (!formData.email) errors.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) errors.email = 'Invalid email';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.location) errors.location = 'Location is required';
    if (formData.customerType === 'Rework' && !formData.oldServiceId) {
      errors.oldServiceId = 'Old Service ID is required for Rework';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const API_BASE_URL = getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1';
      const payload: any = {
        customerType: formData.customerType,
        phone: formData.phone,
        companyName: formData.companyName,
        companyId: formData.companyId || null,
        complaint: formData.complaint,
        contactPerson: formData.contactPerson,
        email: formData.email,
        address: formData.address,
        location: formData.location,
      };

      // Handle image upload if exists
      let imageUrl = '';
      if (formData.serviceImage) {
        try {
          const formDataToUpload = new FormData();
          formDataToUpload.append('file', {
            uri: formData.serviceImage.uri,
            type: formData.serviceImage.type || 'image/jpeg',
            name: formData.serviceImage.fileName || 'image.jpg',
          } as any);

          const uploadResponse = await axios.post(
            `${API_BASE_URL}/auth/upload-file`,
            formDataToUpload,
            {
              headers:               {
                'Content-Type': 'multipart/form-data',
                // Only send auth token if user is authenticated
                ...(isAuthenticated && token ? { Authorization: token } : {}),
              },
            }
          );
          imageUrl = uploadResponse.data?.fileUrl || '';
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Continue without image if upload fails
        }
      }

      payload.serviceImage = imageUrl;

      if (selectedOffer) {
        // For rental/credit/amc - make direct API call without auth
        // Map fields to match rental model structure
        const rentalPayload: any = {
          customerType: formData.customerType,
          phone: formData.phone,
          companyName: formData.companyName,
          companyId: formData.companyId || null,
          customerComplaint: formData.complaint || '', // Map complaint to customerComplaint
          contactPerson: formData.contactPerson,
          email: formData.email,
          addressDetail: formData.address || '', // Map address to addressDetail
          location: formData.location || '',
          rentalType: selectedOffer.id, // Use offer id as rentalType
          rentalTitle: selectedOffer.title, // Use offer title as rentalTitle
          serviceImage: imageUrl || '',
        };
        
        const response = await axios.post(`${API_BASE_URL}/rental/create`, rentalPayload);
        if (response.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: response.data.message || 'Enquiry created successfully!',
          });
          setShowOfferModal(false);
          resetForm();
        }
      } else if (selectedService) {
        // For service - make direct API call without auth
        // Map fields to match service model structure
        const servicePayload: any = {
          customerType: formData.customerType,
          phone: formData.phone,
          companyName: formData.companyName,
          companyId: formData.companyId || null,
          complaint: formData.complaint || '', // Service model uses 'complaint'
          contactPerson: formData.contactPerson,
          email: formData.email,
          addressDetail: formData.address || '', // Map address to addressDetail
          location: formData.location || '',
          serviceType: selectedService.id, // Use service id as serviceType
          serviceTitle: selectedService.title, // Use service title as serviceTitle
          oldServiceId: formData.oldServiceId || '',
          serviceImage: imageUrl || '',
        };
        
        const response = await axios.post(`${API_BASE_URL}/service/create`, servicePayload);
        if (response.data?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: response.data.message || 'Service enquiry created successfully!',
          });
          setShowServiceModal(false);
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Error creating enquiry:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || error.message || 'Failed to create enquiry',
      });
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, serviceImage: result.assets[0] });
    }
  };

  const handleActionPress = (action: typeof quickActions[0]) => {
    if (action.requiresAuth && !isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to access this feature',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
      return;
    }
    navigation.navigate(action.screen as never);
  };

  const handleNewsletterSubmit = () => {
    if (email) {
      Alert.alert('Success', 'Thank you for subscribing!');
      setEmail('');
    }
  };

  // Function to close the company modal
  const handleCloseCompanyModal = async () => {
    setShowCompanyModal(false);
    setSelectedCompany('');
    try {
      await AsyncStorage.setItem('selectedCompany', '');
    } catch (error) {
      console.error('Error saving selected company:', error);
    }
    // Reset company form
    setCompanyFormData({
      companyName: '',
      billingAddress: '',
      invoiceType: 'Corpculture Invoice',
      city: '',
      state: '',
      pincode: '',
      gstNo: '',
      customerType: 'New',
      customerComplaint: '',
      phone: '',
    });
    setServiceDeliveryAddresses([{ address: '', pincode: '' }]);
    setContactPersons([{ name: '', mobile: '', email: '' }]);
    // Refetch company details after closing
    if (isAuthenticated && token && isCompanyEnabled) {
      fetchCompanyDetails();
    }
  };

  const handleCompanySubmit = async () => {
    if (!companyFormData.companyName || !companyFormData.billingAddress) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    try {
      setCompanyLoading(true);
      const payload = {
        ...companyFormData,
        userId: user?._id,
        serviceDeliveryAddresses,
        contactPersons,
      };

      const { data } = await axios.post(
        `${getApiBaseUrl() || 'https://nicknameinfo.net/corpculture/api/v1'}/company/create`,
        payload,
        {
          headers: { Authorization: token || '' },
        }
      );

      if (data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Company created successfully',
        });
        handleCloseCompanyModal();
        // Refetch company details
        if (isAuthenticated && token && isCompanyEnabled) {
          fetchCompanyDetails();
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to create company',
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const addDeliveryAddress = () => {
    setServiceDeliveryAddresses([...serviceDeliveryAddresses, { address: '', pincode: '' }]);
  };

  const removeDeliveryAddress = (index: number) => {
    setServiceDeliveryAddresses(serviceDeliveryAddresses.filter((_, i) => i !== index));
  };

  const addContactPerson = () => {
    setContactPersons([...contactPersons, { name: '', mobile: '', email: '' }]);
  };

  const removeContactPerson = (index: number) => {
    setContactPersons(contactPersons.filter((_, i) => i !== index));
  };

  const renderBannerItem = ({ item }: { item: typeof bannerData[0] }) => (
    <View style={styles.bannerItem}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} resizeMode="cover" />
    </View>
  );

  const renderServiceCategory = ({ item }: { item: typeof serviceCategories[0] }) => (
    <TouchableOpacity style={styles.categoryCard} onPress={() => handleOfferClick(item)}>
      {item.discount && (
        <View style={[styles.categoryBadge, { backgroundColor: '#fff' }]}>
          <Text style={[styles.categoryBadgeText, { color: '#EF4444' }]}>{item.discount}</Text>
        </View>
      )}
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <View style={styles.categoryOverlay} />
      <View style={styles.categoryContent}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
        <TouchableOpacity style={[styles.viewCollectionBtn, { borderColor: '#fff' }]}>
          <Text style={[styles.viewCollectionText, { color: '#fff' }]}>
            View Collection
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderService = ({ item }: { item: typeof services[0] }) => (
    <TouchableOpacity style={styles.serviceCard} onPress={() => handleServiceClick(item)}>
      <View style={[styles.serviceIconContainer, { backgroundColor: item.color }]}>
        <Icon name={item.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.serviceDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: typeof products[0] }) => (
    <TouchableOpacity style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={[styles.comingSoonBadge, { backgroundColor: item.badgeColor }]}>
        <Text style={styles.comingSoonText}>COMING SOON</Text>
      </View>
      <Text style={styles.productTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.logo}>
            corp <Text style={styles.logoAccent}>culture</Text>
          </Text>
          <View style={styles.headerIcons}>
            {isAuthenticated && (
              <View style={styles.companyToggleWrapper}>
                <CompanyToggleHeader />
              </View>
            )}
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Cart' as never)}
            >
              <Icon name="shopping-cart" size={24} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() =>
                navigation.navigate((isAuthenticated ? 'Profile' : 'Login') as never)
              }
            >
              <Icon name="person" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        {isAuthenticated && (
          <View style={styles.headerBottom}>
            <Text style={styles.greeting}>Welcome, {user?.name || 'User'}!</Text>
          </View>
        )}
      </View>

      {/* Company Picker Modal */}
      <Modal
        visible={companyPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCompanyPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCompanyPickerVisible(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Company</Text>
            <FlatList
              data={[{ _id: 'new', companyName: 'New Company', isNew: true }, ...companyDetails]}
              keyExtractor={(item) => item._id}
              renderItem={({ item }: { item: any }) => (
                <TouchableOpacity
                  style={styles.pickerOption}
                  onPress={async () => {
                    setSelectedCompany(item._id);
                    try {
                      await AsyncStorage.setItem('selectedCompany', item._id);
                    } catch (error) {
                      console.error('Error saving selected company:', error);
                    }
                    setCompanyPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, item.isNew && styles.pickerOptionTextNew]}>
                    {item.companyName}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No companies available</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setCompanyPickerVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Banner Carousel */}
      <View style={styles.bannerContainer}>
        <FlatList
          data={bannerData}
          renderItem={renderBannerItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentCarouselIndex(index);
          }}
        />
        <View style={styles.carouselIndicators}>
          {bannerData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentCarouselIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Service Categories */}
      <View style={styles.section}>
        <FlatList
          data={serviceCategories}
          renderItem={renderServiceCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Our Services */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <Text style={styles.sectionSubtitle}>
          We offer a comprehensive range of technological solutions to excel in your business.
        </Text>
        <FlatList
          data={services}
          renderItem={renderService}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.servicesList}
        />
      </View>

      {/* Quick Actions (Authenticated Only) */}
      {/* {isAuthenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handleActionPress(action)}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <Icon name={action.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )} */}

      {/* Our Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Products</Text>
        <Text style={styles.sectionSubtitle}>
          Featuring new product lines coming soon to expand our offerings.
        </Text>
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsList}
        />
        <TouchableOpacity style={styles.getUpdatesButton}>
          <Text style={styles.getUpdatesText}>Get Updates</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>
          corp <Text style={styles.footerLogoAccent}>culture</Text>
        </Text>

        {/* Newsletter */}
        <View style={styles.newsletterContainer}>
          <Text style={styles.newsletterTitle}>Sign Up For Offers And Promotions!</Text>
          <View style={styles.newsletterInputContainer}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="Enter your email address..."
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.newsletterButton}
              onPress={handleNewsletterSubmit}
            >
              <Icon name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactContainer}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>Phone: 9830010031</Text>
          <Text style={styles.contactText}>Email: corp.culture@gmail.com</Text>
          <Text style={styles.contactText}>
            A Block, Sunny Plaza No. 15/18, Kaka Ayyan Road, Metro Nagar, Selaiyur, Chennai -
            600 073
          </Text>
          <TouchableOpacity style={styles.directionsButton}>
            <Text style={styles.directionsText}>Get Directions +</Text>
          </TouchableOpacity>
        </View>

        {/* Hours */}
        <View style={styles.hoursContainer}>
          <Text style={styles.hoursTitle}>Hours of Operation</Text>
          <Text style={styles.hoursText}>Open 7 Days a Week</Text>
          <Text style={styles.hoursText}>9:00 AM - 7:00 PM</Text>
          <Text style={styles.hoursText}>
            Closed On: New Year's Day, Diwali, Thanksgiving Day, Christmas Day
          </Text>
        </View>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Products</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          Corp Culture © 2023. All Rights Reserved.
        </Text>
        <Text style={styles.designCredit}>Designed by Nickname Infotech</Text>
      </View>

      {/* Offer Modal (Rental/Credit/AMC) */}
      <Modal
        visible={showOfferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowOfferModal(false);
          setSelectedOffer(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOffer?.title} Enquiry</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowOfferModal(false);
                  setSelectedOffer(null);
                  resetForm();
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Type of Customer *</Text>
              <View style={styles.radioGroup}>
                {['New', 'Existing', 'Rework'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => {
                      setFormData({ ...formData, customerType: type });
                      if (type !== 'Rework') {
                        setFormData((prev) => ({ ...prev, oldServiceId: '' }));
                      }
                    }}
                  >
                    <View style={styles.radioCircle}>
                      {formData.customerType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.customerType && (
                <Text style={styles.errorText}>{formErrors.customerType}</Text>
              )}

              <Text style={styles.formLabel}>Phone *</Text>
              <TextInput
                style={[styles.formInput, formErrors.phone && styles.formInputError]}
                placeholder="Enter 10 digit phone number"
                value={formData.phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: cleaned });
                  if (cleaned.length === 10) {
                    fetchServicesByPhone(cleaned);
                    fetchCompaniesByPhone(cleaned);
                  }
                }}
                keyboardType="phone-pad"
              />
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}

              {isFetchingServices && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
              )}

              {fetchedCompanies.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Existing Companies:</Text>
                  {fetchedCompanies.map((company: any) => (
                    <TouchableOpacity
                      key={company._id}
                      style={styles.suggestionItem}
                      onPress={() => {
                        // Auto-fill all fields from company data
                        setFormData({
                          ...formData,
                          customerType: 'New', // Set to New when selecting existing company
                          companyName: company.companyName || '',
                          companyId: company._id || '',
                          contactPerson: company.contactPersons?.[0]?.name || '',
                          email: company.contactPersons?.[0]?.email || '',
                          address: company.billingAddress || '',
                          location: company.city || '',
                        });
                        // Clear the fetched companies list after selection
                        setFetchedCompanies([]);
                      }}
                    >
                      <Text style={styles.suggestionText}>
                        {company.companyName} {company.contactPersons?.[0]?.mobile ? `(${company.contactPersons[0].mobile})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.formLabel}>Company Name *</Text>
              <TextInput
                style={[styles.formInput, formErrors.companyName && styles.formInputError]}
                placeholder="Enter company name"
                value={formData.companyName}
                onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              />
              {formErrors.companyName && (
                <Text style={styles.errorText}>{formErrors.companyName}</Text>
              )}

              <Text style={styles.formLabel}>Contact Person *</Text>
              <TextInput
                style={[styles.formInput, formErrors.contactPerson && styles.formInputError]}
                placeholder="Enter contact person name"
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
              />
              {formErrors.contactPerson && (
                <Text style={styles.errorText}>{formErrors.contactPerson}</Text>
              )}

              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={[styles.formInput, formErrors.email && styles.formInputError]}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

              <Text style={styles.formLabel}>Complaint/Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Enter complaint or description"
                value={formData.complaint}
                onChangeText={(text) => setFormData({ ...formData, complaint: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>Address *</Text>
              <TextInput
                style={[styles.formInput, formErrors.address && styles.formInputError]}
                placeholder="Enter address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
              />
              {formErrors.address && <Text style={styles.errorText}>{formErrors.address}</Text>}

              <Text style={styles.formLabel}>Location Detail *</Text>
              <TextInput
                style={[styles.formInput, formErrors.location && styles.formInputError]}
                placeholder="Enter location details"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
              {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}

              {formData.customerType === 'Rework' && (
                <>
                  {fetchedServices.length > 0 ? (
                    <>
                      <Text style={styles.formLabel}>Select a Previous Service *</Text>
                      <View style={styles.pickerContainer}>
                        <FlatList
                          data={fetchedServices}
                          keyExtractor={(item: any) => item._id}
                          renderItem={({ item }: { item: any }) => (
                            <TouchableOpacity
                              style={[
                                styles.serviceOption,
                                formData.oldServiceId === item._id && styles.serviceOptionSelected,
                              ]}
                              onPress={() => {
                                setFormData({ ...formData, oldServiceId: item._id });
                              }}
                            >
                              <Text style={styles.serviceOptionText}>
                                {item.serviceTitle || 'N/A'} - {new Date(item.createdAt).toLocaleDateString()} ({item.status})
                              </Text>
                              {formData.oldServiceId === item._id && (
                                <Icon name="check-circle" size={20} color="#007AFF" />
                              )}
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.formLabel}>Old Service ID *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.oldServiceId && styles.formInputError]}
                        placeholder="Enter old service ID"
                        value={formData.oldServiceId}
                        onChangeText={(text) => setFormData({ ...formData, oldServiceId: text })}
                      />
                    </>
                  )}
                  {formErrors.oldServiceId && (
                    <Text style={styles.errorText}>{formErrors.oldServiceId}</Text>
                  )}
                </>
              )}

              <Text style={styles.formLabel}>Service Image</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Icon name="camera-alt" size={20} color="#007AFF" />
                <Text style={styles.imagePickerText}>
                  {formData.serviceImage ? 'Image Selected' : 'Pick Image'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleFormSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowOfferModal(false);
                    setSelectedOffer(null);
                    resetForm();
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Service Modal */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowServiceModal(false);
          setSelectedService(null);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedService?.title} Enquiry</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowServiceModal(false);
                  setSelectedService(null);
                  resetForm();
                }}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Type of Customer *</Text>
              <View style={styles.radioGroup}>
                {['New', 'Existing', 'Rework'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => {
                      setFormData({ ...formData, customerType: type });
                      if (type !== 'Rework') {
                        setFormData((prev) => ({ ...prev, oldServiceId: '' }));
                      }
                    }}
                  >
                    <View style={styles.radioCircle}>
                      {formData.customerType === type && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.customerType && (
                <Text style={styles.errorText}>{formErrors.customerType}</Text>
              )}

              <Text style={styles.formLabel}>Phone *</Text>
              <TextInput
                style={[styles.formInput, formErrors.phone && styles.formInputError]}
                placeholder="Enter 10 digit phone number"
                value={formData.phone}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: cleaned });
                  if (cleaned.length === 10) {
                    fetchServicesByPhone(cleaned);
                    fetchCompaniesByPhone(cleaned);
                  }
                }}
                keyboardType="phone-pad"
              />
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}

              {isFetchingServices && (
                <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIndicator} />
              )}

              {fetchedCompanies.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Existing Companies:</Text>
                  {fetchedCompanies.map((company: any) => (
                    <TouchableOpacity
                      key={company._id}
                      style={styles.suggestionItem}
                      onPress={() => {
                        // Auto-fill all fields from company data
                        setFormData({
                          ...formData,
                          customerType: 'New', // Set to New when selecting existing company
                          companyName: company.companyName || '',
                          companyId: company._id || '',
                          contactPerson: company.contactPersons?.[0]?.name || '',
                          email: company.contactPersons?.[0]?.email || '',
                          address: company.billingAddress || '',
                          location: company.city || '',
                        });
                        // Clear the fetched companies list after selection
                        setFetchedCompanies([]);
                      }}
                    >
                      <Text style={styles.suggestionText}>
                        {company.companyName} {company.contactPersons?.[0]?.mobile ? `(${company.contactPersons[0].mobile})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.formLabel}>Company Name *</Text>
              <TextInput
                style={[styles.formInput, formErrors.companyName && styles.formInputError]}
                placeholder="Enter company name"
                value={formData.companyName}
                onChangeText={(text) => setFormData({ ...formData, companyName: text })}
              />
              {formErrors.companyName && (
                <Text style={styles.errorText}>{formErrors.companyName}</Text>
              )}

              <Text style={styles.formLabel}>Contact Person *</Text>
              <TextInput
                style={[styles.formInput, formErrors.contactPerson && styles.formInputError]}
                placeholder="Enter contact person name"
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
              />
              {formErrors.contactPerson && (
                <Text style={styles.errorText}>{formErrors.contactPerson}</Text>
              )}

              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={[styles.formInput, formErrors.email && styles.formInputError]}
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}

              <Text style={styles.formLabel}>Complaint/Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Enter complaint or description"
                value={formData.complaint}
                onChangeText={(text) => setFormData({ ...formData, complaint: text })}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.formLabel}>Address *</Text>
              <TextInput
                style={[styles.formInput, formErrors.address && styles.formInputError]}
                placeholder="Enter address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
              />
              {formErrors.address && <Text style={styles.errorText}>{formErrors.address}</Text>}

              <Text style={styles.formLabel}>Location Detail *</Text>
              <TextInput
                style={[styles.formInput, formErrors.location && styles.formInputError]}
                placeholder="Enter location details"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />
              {formErrors.location && <Text style={styles.errorText}>{formErrors.location}</Text>}

              {formData.customerType === 'Rework' && (
                <>
                  {fetchedServices.length > 0 ? (
                    <>
                      <Text style={styles.formLabel}>Select a Previous Service *</Text>
                      <View style={styles.pickerContainer}>
                        <FlatList
                          data={fetchedServices}
                          keyExtractor={(item: any) => item._id}
                          renderItem={({ item }: { item: any }) => (
                            <TouchableOpacity
                              style={[
                                styles.serviceOption,
                                formData.oldServiceId === item._id && styles.serviceOptionSelected,
                              ]}
                              onPress={() => {
                                setFormData({ ...formData, oldServiceId: item._id });
                              }}
                            >
                              <Text style={styles.serviceOptionText}>
                                {item.serviceTitle || 'N/A'} - {new Date(item.createdAt).toLocaleDateString()} ({item.status})
                              </Text>
                              {formData.oldServiceId === item._id && (
                                <Icon name="check-circle" size={20} color="#007AFF" />
                              )}
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.formLabel}>Old Service ID *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.oldServiceId && styles.formInputError]}
                        placeholder="Enter old service ID"
                        value={formData.oldServiceId}
                        onChangeText={(text) => setFormData({ ...formData, oldServiceId: text })}
                      />
                    </>
                  )}
                  {formErrors.oldServiceId && (
                    <Text style={styles.errorText}>{formErrors.oldServiceId}</Text>
                  )}
                </>
              )}

              <Text style={styles.formLabel}>Service Image</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Icon name="camera-alt" size={20} color="#007AFF" />
                <Text style={styles.imagePickerText}>
                  {formData.serviceImage ? 'Image Selected' : 'Pick Image'}
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleFormSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowServiceModal(false);
                    setSelectedService(null);
                    resetForm();
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Company Registration Modal */}
      <Modal
        visible={showCompanyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCompanyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.companyModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Company</Text>
              <TouchableOpacity
                onPress={handleCloseCompanyModal}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.companyModalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Company Name *</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.companyName}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, companyName: text })}
                placeholder="Enter company name"
              />

              <Text style={styles.formLabel}>Billing Address *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={companyFormData.billingAddress}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, billingAddress: text })}
                placeholder="Enter billing address"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.city}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, city: text })}
                placeholder="Enter city"
              />

              <Text style={styles.formLabel}>State</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.state}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, state: text })}
                placeholder="Enter state"
              />

              <Text style={styles.formLabel}>Pincode</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.pincode}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, pincode: text })}
                placeholder="Enter pincode"
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>GST No</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.gstNo}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, gstNo: text })}
                placeholder="Enter GST number"
              />

              <Text style={styles.formLabel}>Phone</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.phone}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, phone: text })}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />

              <Text style={styles.formLabel}>Invoice Type</Text>
              <TextInput
                style={styles.formInput}
                value={companyFormData.invoiceType}
                onChangeText={(text) => setCompanyFormData({ ...companyFormData, invoiceType: text })}
                placeholder="Enter invoice type"
              />

              <Text style={[styles.formLabel, { marginTop: 15, fontSize: 16, fontWeight: 'bold' }]}>Service Delivery Addresses</Text>
              {serviceDeliveryAddresses.map((addr, index) => (
                <View key={index} style={styles.addressRow}>
                  <TextInput
                    style={[styles.formInput, { flex: 1 }]}
                    value={addr.address}
                    onChangeText={(text) => {
                      const newAddresses = [...serviceDeliveryAddresses];
                      newAddresses[index].address = text;
                      setServiceDeliveryAddresses(newAddresses);
                    }}
                    placeholder="Address"
                  />
                  <TextInput
                    style={[styles.formInput, { width: 100, marginLeft: 10 }]}
                    value={addr.pincode}
                    onChangeText={(text) => {
                      const newAddresses = [...serviceDeliveryAddresses];
                      newAddresses[index].pincode = text;
                      setServiceDeliveryAddresses(newAddresses);
                    }}
                    placeholder="Pincode"
                    keyboardType="numeric"
                  />
                  {serviceDeliveryAddresses.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeDeliveryAddress(index)}
                      style={styles.removeButton}
                    >
                      <Icon name="delete" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addDeliveryAddress} style={styles.addButton}>
                <Icon name="add" size={20} color="#007AFF" />
                <Text style={styles.addButtonText}>Add Address</Text>
              </TouchableOpacity>

              <Text style={[styles.formLabel, { marginTop: 15, fontSize: 16, fontWeight: 'bold' }]}>Contact Persons</Text>
              {contactPersons.map((person, index) => (
                <View key={index} style={styles.contactRow}>
                  <TextInput
                    style={styles.formInput}
                    value={person.name}
                    onChangeText={(text) => {
                      const newPersons = [...contactPersons];
                      newPersons[index].name = text;
                      setContactPersons(newPersons);
                    }}
                    placeholder="Name"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={person.mobile}
                    onChangeText={(text) => {
                      const newPersons = [...contactPersons];
                      newPersons[index].mobile = text;
                      setContactPersons(newPersons);
                    }}
                    placeholder="Mobile"
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={person.email}
                    onChangeText={(text) => {
                      const newPersons = [...contactPersons];
                      newPersons[index].email = text;
                      setContactPersons(newPersons);
                    }}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {contactPersons.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeContactPerson(index)}
                      style={styles.removeButton}
                    >
                      <Icon name="delete" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity onPress={addContactPerson} style={styles.addButton}>
                <Icon name="add" size={20} color="#007AFF" />
                <Text style={styles.addButtonText}>Add Contact Person</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleCompanySubmit}
                  disabled={companyLoading}
                >
                  {companyLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Create Company</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCloseCompanyModal}
                >
                  <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoAccent: {
    color: '#4CAF50',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  companyToggleWrapper: {
    marginRight: 8,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  bannerContainer: {
    height: 200,
    backgroundColor: '#fff',
  },
  bannerItem: {
    width,
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  categoryList: {
    paddingRight: 20,
  },
  categoryCard: {
    width: width * 0.85,
    marginRight: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    zIndex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  viewCollectionBtn: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  viewCollectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  servicesList: {
    paddingTop: 10,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    margin: 5,
    alignItems: 'center',
    minHeight: 150,
  },
  serviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productsList: {
    paddingTop: 10,
  },
  productCard: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 10,
    textAlign: 'center',
  },
  getUpdatesButton: {
    backgroundColor: '#00BCD4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  getUpdatesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#1a237e',
    padding: 20,
    marginTop: 10,
  },
  footerLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerLogoAccent: {
    color: '#4CAF50',
  },
  newsletterContainer: {
    marginBottom: 25,
  },
  newsletterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  newsletterInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  newsletterInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  newsletterButton: {
    backgroundColor: '#00BCD4',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContainer: {
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
    lineHeight: 20,
  },
  directionsButton: {
    marginTop: 10,
  },
  directionsText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  hoursContainer: {
    marginBottom: 20,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 5,
    lineHeight: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  footerLink: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  copyright: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 5,
  },
  designCredit: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  formInputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  suggestionsContainer: {
    marginTop: 10,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 5,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickerContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  serviceOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  companyModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  companyModalBody: {
    padding: 20,
    maxHeight: '80%',
  },
  closeButton: {
    padding: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactRow: {
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  companySection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  companyToggleContainer: {
    marginBottom: 12,
  },
  companyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 10,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF',
  },
  toggleSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  companyToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  companySelectorContainer: {
    marginTop: 8,
  },
  companySelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  companyLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  createCompanyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  createCompanyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  companySelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  companySelectText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  companySelectPlaceholder: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerOptionTextNew: {
    fontStyle: 'italic',
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyPicker: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;
