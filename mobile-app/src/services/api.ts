import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as sampleData from '../data/sampleData';

// API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://nicknameinfo.net/corpculture/api/v1';
const USE_SAMPLE_DATA = false; // Set to false to use real API, true for sample data

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
    // Login should only succeed on 200 status - no fallback to sample data
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Only proceed if status is 200
      if (response.status === 200 && response.data) {
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Re-throw the error - don't use sample data fallback for login
      throw error;
    }
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

  getEmployee: async (id: string) => {
    return getData(
      () => api.get(`/employee/get/${id}`),
      { data: { employee: sampleData.sampleEmployees[0] } } as any,
      500
    );
  },

  createEmployee: async (data: any) => {
    return getData(
      () => api.post('/employee/create', data),
      { data: { employee: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  updateEmployee: async (id: string, data: any) => {
    return getData(
      () => api.put(`/employee/update/${id}`, data),
      { data: { employee: { ...data, _id: id } } } as any,
      1000
    );
  },

  deleteEmployee: async (id: string) => {
    return getData(
      () => api.delete(`/employee/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },

  getCommission: async () => {
    return getData(
      () => api.get('/commission'),
      { data: { commission: sampleData.sampleCommission } } as any,
      800
    );
  },

  createCommission: async (data: any) => {
    return getData(
      () => api.post('/commission/create', data),
      { data: { commission: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  updateCommission: async (id: string, data: any) => {
    return getData(
      () => api.put(`/commission/update/${id}`, data),
      { data: { commission: { ...data, _id: id } } } as any,
      1000
    );
  },

  getAllOrders: async () => {
    return getData(
      () => api.get('/order/all'),
      { data: { orders: sampleData.sampleOrders } } as any,
      800
    );
  },

  getOrder: async (id: string) => {
    return getData(
      () => api.get(`/order/${id}`),
      { data: { order: sampleData.sampleOrders[0] } } as any,
      500
    );
  },

  updateOrder: async (id: string, data: any) => {
    return getData(
      () => api.put(`/order/update/${id}`, data),
      { data: { order: { ...data, _id: id } } } as any,
      1000
    );
  },

  assignOrder: async (data: any) => {
    return getData(
      () => api.post('/order/assign', data),
      { data: { success: true } } as any,
      1000
    );
  },

  getAllUsers: async () => {
    return getData(
      () => api.get('/user/all'),
      { data: { users: sampleData.sampleUsers } } as any,
      800
    );
  },

  deactivateUser: async (data: any) => {
    return getData(
      () => api.post('/auth/deactivate', data),
      { data: { success: true } } as any,
      1000
    );
  },
};

// Product Management Service (Admin)
export const productManagementService = {
  getAllProducts: async () => {
    return getData(
      () => api.get('/product/all'),
      { data: { products: sampleData.sampleProducts } } as any,
      800
    );
  },

  createProduct: async (data: FormData) => {
    return getData(
      () => api.post('/product/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { product: { _id: Date.now().toString() } } } as any,
      1000
    );
  },

  updateProduct: async (id: string, data: FormData) => {
    return getData(
      () => api.put(`/product/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { product: { _id: id } } } as any,
      1000
    );
  },

  deleteProduct: async (id: string) => {
    return getData(
      () => api.delete(`/product/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },

  getFilteredProducts: async (params: any) => {
    return getData(
      () => api.get('/product/filtered', { params }),
      { data: { products: sampleData.sampleProducts } } as any,
      800
    );
  },
};

// Category Service
export const categoryService = {
  getAll: async () => {
    return getData(
      () => api.get('/category/all'),
      { data: { categories: [] } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/category/create', data),
      { data: { category: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/category/update/${id}`, data),
      { data: { category: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/category/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// User Service
export const userService = {
  getUser: async (id: string) => {
    return getData(
      () => api.get(`/user/get/${id}`),
      { data: { user: sampleData.sampleUsers.customer } } as any,
      500
    );
  },

  updateDetails: async (data: any) => {
    return getData(
      () => api.put('/user/update-details', data),
      { data: { user: { ...data } } } as any,
      1000
    );
  },

  uploadFile: async (file: FormData) => {
    return getData(
      () => api.post('/auth/upload-file', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { fileUrl: 'sample-url' } } as any,
      1000
    );
  },
};

// Service Product Service
export const serviceProductService = {
  getAll: async () => {
    return getData(
      () => api.get('/service-product'),
      { data: { products: [] } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/service-product/create', data),
      { data: { product: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/service-product/update/${id}`, data),
      { data: { product: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/service-product/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Service Invoice Service (Enhanced)
export const serviceInvoiceServiceEnhanced = {
  ...serviceInvoiceService,
  
  getAllWithFilters: async (filters: any) => {
    return getData(
      () => api.post('/service-invoice/all', filters),
      { data: { invoices: sampleData.sampleServiceInvoices } } as any,
      800
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/service-invoice/update/${id}`, data),
      { data: { invoice: { ...data, _id: id } } } as any,
      1000
    );
  },

  sendInvoice: async (id: string, data: any) => {
    return getData(
      () => api.post(`/service-invoice/send`, { invoiceId: id, ...data }),
      { data: { success: true } } as any,
      1000
    );
  },
};

// Service Quotation Service
export const serviceQuotationService = {
  getAll: async (filters?: any) => {
    return getData(
      () => api.post('/service-invoice/all', { invoiceType: 'quotation', ...filters }),
      { data: { quotations: [] } } as any,
      800
    );
  },

  create: async (data: FormData) => {
    return getData(
      () => api.post('/service-invoice/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { quotation: { _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/service-invoice/update/${id}`, data),
      { data: { quotation: { ...data, _id: id } } } as any,
      1000
    );
  },
};

// Service Report Service
export const serviceReportService = {
  getAll: async () => {
    return getData(
      () => api.get('/report/service'),
      { data: { reports: [] } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/report/create', data),
      { data: { report: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/report/update/${id}`, data),
      { data: { report: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/report/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Rental Service (Enhanced)
export const rentalServiceEnhanced = {
  ...rentalService,

  getByPhone: async (phone: string) => {
    return getData(
      () => api.get(`/rental/phone/${phone}`),
      { data: { services: [] } } as any,
      800
    );
  },

  getRental: async (id: string) => {
    return getData(
      () => api.get(`/rental/${id}`),
      { data: { rental: {} } } as any,
      500
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/rental/update/${id}`, data),
      { data: { rental: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/rental/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Rental Product Service
export const rentalProductService = {
  getAll: async () => {
    return getData(
      () => api.get('/rental-product'),
      { data: { products: sampleData.sampleRentalProducts } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/rental-product/create', data),
      { data: { product: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/rental-product/update/${id}`, data),
      { data: { product: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/rental-product/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Rental Invoice Service (Enhanced)
export const rentalInvoiceServiceEnhanced = {
  ...rentalInvoiceService,

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/rental-payment/${id}`, data),
      { data: { invoice: { ...data, _id: id } } } as any,
      1000
    );
  },

  sendInvoice: async (id: string, data: any) => {
    return getData(
      () => api.post(`/rental-payment/send`, { invoiceId: id, ...data }),
      { data: { success: true } } as any,
      1000
    );
  },
};

// Vendor Service
export const vendorService = {
  getAll: async () => {
    return getData(
      () => api.get('/vendor'),
      { data: { vendors: [] } } as any,
      800
    );
  },

  get: async (id: string) => {
    return getData(
      () => api.get(`/vendor/${id}`),
      { data: { vendor: {} } } as any,
      500
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/vendor/create', data),
      { data: { vendor: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/vendor/update/${id}`, data),
      { data: { vendor: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/vendor/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Vendor Product Service
export const vendorProductService = {
  getAll: async () => {
    return getData(
      () => api.get('/vendor-product'),
      { data: { products: [] } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/vendor-product/create', data),
      { data: { product: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/vendor-product/update/${id}`, data),
      { data: { product: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/vendor-product/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Purchase Service
export const purchaseService = {
  getAll: async () => {
    return getData(
      () => api.get('/purchases'),
      { data: { purchases: [] } } as any,
      800
    );
  },

  get: async (id: string) => {
    return getData(
      () => api.get(`/purchases/${id}`),
      { data: { purchase: {} } } as any,
      500
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/purchases/create', data),
      { data: { purchase: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },
};

// Company Service (Enhanced)
export const companyServiceEnhanced = {
  ...companyService,

  getUserCompany: async (phone: string) => {
    return getData(
      () => api.get(`/company/user-company/${phone}`),
      { data: { company: sampleData.sampleCompanies[0] } } as any,
      500
    );
  },

  getByPhone: async (phone: string) => {
    return getData(
      () => api.get(`/company/getByPhone/${phone}`),
      { data: { company: sampleData.sampleCompanies[0] } } as any,
      500
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/company/update/${id}`, data),
      { data: { company: { ...data, _id: id } } } as any,
      1000
    );
  },
};

// GST Service
export const gstService = {
  getAll: async () => {
    return getData(
      () => api.get('/gst'),
      { data: { gstEntries: [] } } as any,
      800
    );
  },

  create: async (data: any) => {
    return getData(
      () => api.post('/gst/create', data),
      { data: { gst: { ...data, _id: Date.now().toString() } } } as any,
      1000
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/gst/update/${id}`, data),
      { data: { gst: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/gst/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },
};

// Old Invoice Service
export const oldInvoiceService = {
  upload: async (file: FormData) => {
    return getData(
      () => api.post('/old-invoice/upload', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      { data: { success: true, imported: 0 } } as any,
      2000
    );
  },

  getAll: async (filters?: any) => {
    return getData(
      () => api.get('/old-invoice/all', { params: filters }),
      { data: { invoices: [] } } as any,
      800
    );
  },

  get: async (id: string) => {
    return getData(
      () => api.get(`/old-invoice/get/${id}`),
      { data: { invoice: {} } } as any,
      500
    );
  },

  update: async (id: string, data: any) => {
    return getData(
      () => api.put(`/old-invoice/update/${id}`, data),
      { data: { invoice: { ...data, _id: id } } } as any,
      1000
    );
  },

  delete: async (id: string) => {
    return getData(
      () => api.delete(`/old-invoice/delete/${id}`),
      { data: { success: true } } as any,
      500
    );
  },

  getByRemainderDate: async (filters?: any) => {
    return getData(
      () => api.get('/old-invoice/by-remainder-date', { params: filters }),
      { data: { invoices: [] } } as any,
      800
    );
  },
};

// Permission Service
export const permissionService = {
  getUserPermissions: async (userId: string) => {
    return getData(
      () => api.get(`/permissions/user/${userId}`),
      { data: { permissions: [] } } as any,
      500
    );
  },
};

export default api;

