import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompanyState {
  isCompanyEnabled: boolean;
  selectedCompany: string;
  companyDetails: any[];
  isLoading: boolean;
}

const initialState: CompanyState = {
  isCompanyEnabled: false,
  selectedCompany: '',
  companyDetails: [],
  isLoading: false,
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompanyEnabled: (state, action: PayloadAction<boolean>) => {
      state.isCompanyEnabled = action.payload;
    },
    setSelectedCompany: (state, action: PayloadAction<string>) => {
      state.selectedCompany = action.payload;
    },
    setCompanyDetails: (state, action: PayloadAction<any[]>) => {
      state.companyDetails = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCompanyEnabled,
  setSelectedCompany,
  setCompanyDetails,
  setLoading,
} = companySlice.actions;
export default companySlice.reducer;

