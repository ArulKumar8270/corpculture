import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as sampleData from '../data/sampleData';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-url.com/api/v1';
const USE_SAMPLE_DATA = true; // Set to false when API is ready

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = token;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle logout
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('auth');
    }
    return Promise.reject(error);
  }
);

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get sample data or make API call
const getData = async <T>(
  apiCall: () => Promise<T>,
  sampleData: T,
  delayMs: number = 500
): Promise<T> => {
  if (USE_SAMPLE_DATA) {
    await delay(delayMs);
    return sampleData;
  }
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using sample data:', error);
    await delay(delayMs);
    return sampleData;
  }
};

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    return getData(
      () => api.post('/auth/login', { email, password }),
      {
        data: {
          user: sampleData.sampleUsers.customer,
          token: 'sample-token-123',
        },
      } as any,
      1000
    );
  },

  register: async (data: any) => {
    return getData(
      () => api.post('/auth/register', data),
      {
        data: {
          user: sampleData.sampleUsers.customer,
          token: 'sample-token-123',
        },
      } as any,
      1000
    );
  },

  userAuth: async (token: string) => {
    return getData(
      () => api.get('/auth/user-auth', { headers: { Authorization: token } }),
      { data: { ok: true } } as any,
      500
    );
  },

  adminAuth: async (token: string) => {
    return getData(
      () => api.get('/auth/admin-auth', { headers: { Authorization: token } }),
      { data: { ok: true } } as any,
      500
    );
  },
};

// Product Service
export const productService = {
  getProducts: async (params?: any) => {
    return getData(
      () => api.get('/product', { params }),
      { data: { products: sampleData.sampleProducts } } as any,
      800
    );
  },

  getProduct: async (id: string) => {
    return getData(
      () => api.get(`/product/${id}`),
      { data: { product: sampleData.sampleProducts[0] } } as any,
      500
    );
  },

  searchProducts: async (query: string) => {
    return getData(
      () => api.get('/product/search', { params: { q: query } }),
      { data: { products: sampleData.sampleProducts } } as any,
      500
    );
  },
};

// Company Service
export const companyService = {
  getCompanies: async () => {
    return getData(
      () => api.get('/company'),
      { data: { companies: sampleData.sampleCompanies } } as any,
      800
    );
  },

  getCompany: async (id: string) => {
    return getData(
      () => api.get(`/company/${id}`),
      { data: { company: sampleData.sampleCompanies[0] } } as any,
      500
    );
  },

  createCompany: async (data: any) => {
    return getData(
      () => api.post('/company/create', data),
      { data: { company: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Order Service
export const orderService = {
  getOrders: async () => {
    return getData(
      () => api.get('/user/orders'),
      { data: { orders: sampleData.sampleOrders } } as any,
      800
    );
  },

  getOrder: async (id: string) => {
    return getData(
      () => api.get(`/user/orders/${id}`),
      { data: { order: sampleData.sampleOrders[0] } } as any,
      500
    );
  },

  createOrder: async (data: any) => {
    return getData(
      () => api.post('/order/create', data),
      { data: { order: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Service Enquiry Service
export const serviceEnquiryService = {
  getEnquiries: async () => {
    return getData(
      () => api.get('/service/all'),
      { data: { enquiries: sampleData.sampleServiceEnquiries } } as any,
      800
    );
  },

  getAssignedEnquiries: async (employeeId: string) => {
    return getData(
      () => api.get(`/service/assignedTo/${employeeId}`),
      { data: { enquiries: sampleData.sampleServiceEnquiries } } as any,
      800
    );
  },

  createEnquiry: async (data: any) => {
    return getData(
      () => api.post('/service/create', data),
      { data: { enquiry: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Rental Service
export const rentalService = {
  getEnquiries: async () => {
    return getData(
      () => api.get('/rental'),
      { data: { enquiries: sampleData.sampleRentalEnquiries } } as any,
      800
    );
  },

  createEnquiry: async (data: any) => {
    return getData(
      () => api.post('/rental/create', data),
      { data: { enquiry: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  getRentalProducts: async (companyId: string) => {
    return getData(
      () => api.get(`/rental-products/getServiceProductsByCompany/${companyId}`),
      { data: { products: sampleData.sampleRentalProducts } } as any,
      800
    );
  },
};

// Service Invoice Service
export const serviceInvoiceService = {
  getInvoices: async () => {
    return getData(
      () => api.get('/service-invoice'),
      { data: { invoices: sampleData.sampleServiceInvoices } } as any,
      800
    );
  },

  getInvoice: async (id: string) => {
    return getData(
      () => api.get(`/service-invoice/${id}`),
      { data: { invoice: sampleData.sampleServiceInvoices[0] } } as any,
      500
    );
  },

  createInvoice: async (data: FormData) => {
    return getData(
      () => api.post('/service-invoice/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { invoice: { _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Rental Invoice Service
export const rentalInvoiceService = {
  getInvoices: async () => {
    return getData(
      () => api.get('/rental-payment'),
      { data: { invoices: sampleData.sampleRentalInvoices } } as any,
      800
    );
  },

  getInvoice: async (id: string) => {
    return getData(
      () => api.get(`/rental-payment/${id}`),
      { data: { invoice: sampleData.sampleRentalInvoices[0] } } as any,
      500
    );
  },

  createInvoice: async (data: FormData) => {
    return getData(
      () => api.post('/rental-payment/create-rental-entry', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { invoice: { _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Admin Service
export const adminService = {
  getDashboardStats: async () => {
    return getData(
      () => api.get('/admin/dashboard-stats'),
      { data: { stats: sampleData.sampleDashboardStats } } as any,
      800
    );
  },

  getEmployees: async () => {
    return getData(
      () => api.get('/employee'),
      { data: { employees: sampleData.sampleEmployees } } as any,
      800
    );
  },

  getCommission: async () => {
    return getData(
      () => api.get('/commission'),
      { data: { commission: sampleData.sampleCommission } } as any,
      800
    );
  },
};

export default api;

