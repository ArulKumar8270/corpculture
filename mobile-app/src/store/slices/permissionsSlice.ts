import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { permissionService } from '../../services/api';

export interface Permission {
  _id: string;
  userId: string;
  name: string;
  key: string;
  parentKey: string | null;
  actions: string[];
  sectionType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PermissionsState {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
  loading: false,
  error: null,
};

// Async thunk to fetch user permissions
export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await permissionService.getUserPermissions(userId);
      return response.data.permissions || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearPermissions: (state) => {
      state.permissions = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action: PayloadAction<Permission[]>) => {
        state.loading = false;
        state.permissions = action.payload;
        state.error = null;
      })
      .addCase(fetchUserPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.permissions = [];
      });
  },
});

export const { clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;

