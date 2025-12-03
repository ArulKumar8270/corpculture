import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DashboardStats {
  totalServices: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingApprovals: number;
  activeEmployees: number;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: number;
  pincode?: string;
}

interface Commission {
  _id: string;
  employeeId: string;
  employeeName: string;
  orderId: string;
  orderNumber: string;
  commissionAmount: number;
  commissionPercentage: number;
  status: string;
  createdAt: string;
}

interface AdminState {
  dashboardStats: DashboardStats | null;
  employees: Employee[];
  commission: Commission[];
  isLoading: boolean;
}

const initialState: AdminState = {
  dashboardStats: null,
  employees: [],
  commission: [],
  isLoading: false,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setDashboardStats: (state, action: PayloadAction<DashboardStats>) => {
      state.dashboardStats = action.payload;
    },
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload;
    },
    setCommission: (state, action: PayloadAction<Commission[]>) => {
      state.commission = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setDashboardStats, setEmployees, setCommission, setLoading } =
  adminSlice.actions;
export default adminSlice.reducer;

