import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ServiceEnquiry {
  _id: string;
  companyId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  serviceType: string;
  status: string;
  createdAt: string;
  priority?: string;
}

interface ServiceInvoice {
  _id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  products: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  createdAt: string;
}

interface ServiceState {
  enquiries: ServiceEnquiry[];
  invoices: ServiceInvoice[];
  selectedEnquiry: ServiceEnquiry | null;
  selectedInvoice: ServiceInvoice | null;
  isLoading: boolean;
}

const initialState: ServiceState = {
  enquiries: [],
  invoices: [],
  selectedEnquiry: null,
  selectedInvoice: null,
  isLoading: false,
};

const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    setEnquiries: (state, action: PayloadAction<ServiceEnquiry[]>) => {
      state.enquiries = action.payload;
    },
    setInvoices: (state, action: PayloadAction<ServiceInvoice[]>) => {
      state.invoices = action.payload;
    },
    setSelectedEnquiry: (state, action: PayloadAction<ServiceEnquiry | null>) => {
      state.selectedEnquiry = action.payload;
    },
    setSelectedInvoice: (state, action: PayloadAction<ServiceInvoice | null>) => {
      state.selectedInvoice = action.payload;
    },
    updateEnquiryStatus: (
      state,
      action: PayloadAction<{ enquiryId: string; status: string }>
    ) => {
      const enquiry = state.enquiries.find(
        (e) => e._id === action.payload.enquiryId
      );
      if (enquiry) {
        enquiry.status = action.payload.status;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setEnquiries,
  setInvoices,
  setSelectedEnquiry,
  setSelectedInvoice,
  updateEnquiryStatus,
  setLoading,
} = serviceSlice.actions;
export default serviceSlice.reducer;

