import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import serviceReducer from './slices/serviceSlice';
import rentalReducer from './slices/rentalSlice';
import adminReducer from './slices/adminSlice';
import permissionsReducer from './slices/permissionsSlice';
import companyReducer from './slices/companySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    service: serviceReducer,
    rental: rentalReducer,
    admin: adminReducer,
    permissions: permissionsReducer,
    company: companyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

