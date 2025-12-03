import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RentalProduct {
  _id: string;
  name: string;
  serialNo: string;
  basePrice: number;
  category: string;
}

interface RentalInvoice {
  _id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  products: Array<{
    productId: string;
    name: string;
    serialNo: string;
    a3Config: { bwOldCount: number; bwNewCount: number };
    a4Config: { bwOldCount: number; bwNewCount: number };
    a5Config: { bwOldCount: number; bwNewCount: number };
    productTotal: number;
    countImageUrl?: string;
  }>;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface RentalState {
  enquiries: any[];
  invoices: RentalInvoice[];
  products: RentalProduct[];
  selectedInvoice: RentalInvoice | null;
  isLoading: boolean;
}

const initialState: RentalState = {
  enquiries: [],
  invoices: [],
  products: [],
  selectedInvoice: null,
  isLoading: false,
};

const rentalSlice = createSlice({
  name: 'rental',
  initialState,
  reducers: {
    setEnquiries: (state, action: PayloadAction<any[]>) => {
      state.enquiries = action.payload;
    },
    setInvoices: (state, action: PayloadAction<RentalInvoice[]>) => {
      state.invoices = action.payload;
    },
    setProducts: (state, action: PayloadAction<RentalProduct[]>) => {
      state.products = action.payload;
    },
    setSelectedInvoice: (state, action: PayloadAction<RentalInvoice | null>) => {
      state.selectedInvoice = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setEnquiries,
  setInvoices,
  setProducts,
  setSelectedInvoice,
  setLoading,
} = rentalSlice.actions;
export default rentalSlice.reducer;

