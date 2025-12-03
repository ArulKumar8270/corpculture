# React Native Mobile App - Implementation Plan

## 📱 Project Overview

**App Name:** Corpculture Mobile  
**Platform:** iOS & Android  
**Framework:** React Native  
**Target Users:** Field Technicians, Sales Team, Rental Technicians, Admins, Customers

---

## 🎯 Core Features to Implement

1. **E-commerce** - Product browsing, cart, orders
2. **Role-Based Access** - Different UI based on user role
3. **Service Management** - Service requests, status updates
4. **Rental Management** - Count entry, invoices
5. **Admin Dashboard** - Analytics, management tools

---

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Architecture](#architecture)
3. [Feature Implementation Plan](#feature-implementation-plan)
4. [Screens & Navigation](#screens--navigation)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Development Phases](#development-phases)
8. [Technology Stack](#technology-stack)
9. [File Structure](#file-structure)

---

## 🚀 Project Setup

### Initial Setup Commands

```bash
# Create React Native project
npx react-native init CorpcultureMobile --template react-native-template-typescript

# Or using Expo (recommended for faster development)
npx create-expo-app CorpcultureMobile --template

# Navigate to project
cd CorpcultureMobile

# Install dependencies
npm install
```

### Core Dependencies

```json
{
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/drawer": "^6.6.0",
    "react-native-screens": "^3.25.0",
    "react-native-safe-area-context": "^4.7.0",
    "react-native-gesture-handler": "^2.13.0",
    "axios": "^1.4.0",
    "@react-native-async-storage/async-storage": "^1.19.0",
    "react-native-vector-icons": "^10.0.0",
    "@react-native-community/camera": "^4.2.1",
    "react-native-image-picker": "^5.6.0",
    "@react-native-community/geolocation": "^3.2.0",
    "react-native-maps": "^1.7.1",
    "@react-native-firebase/app": "^18.0.0",
    "@react-native-firebase/messaging": "^18.0.0",
    "react-native-push-notification": "^8.1.1",
    "react-native-pdf": "^6.6.0",
    "react-native-share": "^9.4.0",
    "react-native-document-picker": "^9.1.0",
    "react-native-qrcode-scanner": "^1.5.5",
    "react-native-biometrics": "^3.0.1",
    "@reduxjs/toolkit": "^1.9.0",
    "react-redux": "^8.1.0",
    "react-native-reanimated": "^3.5.0",
    "react-native-gesture-handler": "^2.13.0",
    "react-native-svg": "^13.14.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-calendars": "^1.1301.0",
    "react-native-modal": "^13.0.1",
    "react-native-toast-message": "^2.1.0",
    "react-native-loading-spinner-overlay": "^3.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.0.0",
    "@babel/core": "^7.22.0",
    "@babel/preset-env": "^7.22.0",
    "@babel/runtime": "^7.22.0",
    "babel-jest": "^29.5.0",
    "jest": "^29.5.0",
    "metro-react-native-babel-preset": "^0.76.0"
  }
}
```

---

## 🏗️ Architecture

### Architecture Pattern: **Feature-Based Architecture**

```
src/
├── app/                    # App configuration
│   ├── navigation/        # Navigation setup
│   ├── store/             # Redux store
│   └── App.tsx            # Root component
│
├── features/               # Feature modules
│   ├── auth/              # Authentication
│   ├── ecommerce/         # E-commerce
│   ├── service/           # Service Management
│   ├── rental/            # Rental Management
│   └── admin/             # Admin Dashboard
│
├── shared/                 # Shared code
│   ├── components/        # Reusable components
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── constants/         # Constants
│   └── types/             # TypeScript types
│
├── assets/                 # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
│
└── __tests__/              # Tests
```

---

## 📱 Feature Implementation Plan

### 1. E-commerce Feature

#### 1.1 Product Listing
**Screens:**
- `ProductListScreen.tsx` - Product grid/list view
- `ProductDetailScreen.tsx` - Product details
- `ProductSearchScreen.tsx` - Search products

**Components:**
- `ProductCard.tsx` - Product card component
- `ProductFilter.tsx` - Filter component
- `ProductSort.tsx` - Sort component
- `CategoryList.tsx` - Category navigation

**Features:**
- Product grid/list view toggle
- Category filtering
- Search functionality
- Sort by price, name, popularity
- Product images with zoom
- Product details (description, specs, reviews)
- Add to cart button
- Add to wishlist

**API Integration:**
```typescript
// services/ecommerceService.ts
- GET /api/v1/product (Get all products)
- GET /api/v1/product/:id (Get product details)
- GET /api/v1/product/search?q=query (Search products)
- GET /api/v1/category (Get categories)
```

#### 1.2 Shopping Cart
**Screens:**
- `CartScreen.tsx` - Cart items list
- `CheckoutScreen.tsx` - Checkout process

**Components:**
- `CartItem.tsx` - Cart item component
- `PriceSummary.tsx` - Price breakdown
- `ShippingAddressForm.tsx` - Address form
- `PaymentMethodSelector.tsx` - Payment options

**Features:**
- Add/remove items
- Update quantities
- Save for later
- Apply coupon codes
- Shipping address selection
- Payment method selection
- Order summary
- Place order

**API Integration:**
```typescript
// services/cartService.ts
- POST /api/v1/cart/add (Add to cart)
- PUT /api/v1/cart/update (Update cart)
- DELETE /api/v1/cart/remove/:id (Remove item)
- POST /api/v1/order/create (Create order)
```

#### 1.3 Orders
**Screens:**
- `OrderListScreen.tsx` - Order history
- `OrderDetailScreen.tsx` - Order details
- `OrderTrackingScreen.tsx` - Track order

**Components:**
- `OrderCard.tsx` - Order card
- `OrderStatusBadge.tsx` - Status indicator
- `TrackingTimeline.tsx` - Order timeline

**Features:**
- View order history
- Order details
- Order status tracking
- Reorder functionality
- Cancel order
- Return/refund request

**API Integration:**
```typescript
// services/orderService.ts
- GET /api/v1/user/orders (Get user orders)
- GET /api/v1/user/orders/:id (Get order details)
- PUT /api/v1/user/orders/:id/cancel (Cancel order)
```

---

### 2. Role-Based Access Feature

#### 2.1 Authentication
**Screens:**
- `LoginScreen.tsx` - Login form
- `RegisterScreen.tsx` - Registration
- `ForgotPasswordScreen.tsx` - Password recovery
- `BiometricAuthScreen.tsx` - Biometric login

**Components:**
- `LoginForm.tsx` - Login form component
- `BiometricButton.tsx` - Biometric auth button

**Features:**
- Email/Phone + Password login
- Biometric authentication (Face ID, Fingerprint)
- Remember me
- Auto-logout on token expiry
- Token refresh
- Role detection

**API Integration:**
```typescript
// services/authService.ts
- POST /api/v1/auth/login (Login)
- POST /api/v1/auth/register (Register)
- POST /api/v1/auth/forgot-password (Password recovery)
- GET /api/v1/auth/user-auth (Verify token)
- GET /api/v1/auth/admin-auth (Verify admin)
```

#### 2.2 Role Management
**Components:**
- `RoleGuard.tsx` - Route protection component
- `PermissionCheck.tsx` - Permission checker

**Features:**
- Role-based navigation
- Permission-based UI rendering
- Route protection
- Feature access control

**User Roles:**
```typescript
enum UserRole {
  CUSTOMER = 0,    // Regular customer
  ADMIN = 1,       // Administrator
  EMPLOYEE = 3     // Employee/Manager
}
```

**Implementation:**
```typescript
// hooks/useAuth.ts
const useAuth = () => {
  const { user, role, permissions } = useAppSelector(state => state.auth);
  
  const isAdmin = role === UserRole.ADMIN;
  const isEmployee = role === UserRole.EMPLOYEE;
  const isCustomer = role === UserRole.CUSTOMER;
  
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };
  
  return { user, role, isAdmin, isEmployee, isCustomer, hasPermission };
};
```

#### 2.3 Navigation Based on Role
**Navigation Structure:**
```typescript
// navigation/AppNavigator.tsx
- Customer Navigation (Bottom Tabs)
  - Home
  - Products
  - Cart
  - Orders
  - Profile

- Employee Navigation (Drawer)
  - Dashboard
  - Services
  - Rentals
  - Customers
  - Profile

- Admin Navigation (Drawer)
  - Dashboard
  - Services
  - Rentals
  - E-commerce
  - Employees
  - Reports
  - Settings
```

---

### 3. Service Management Feature

#### 3.1 Service Requests
**Screens:**
- `ServiceListScreen.tsx` - List of service requests
- `ServiceDetailScreen.tsx` - Service details
- `CreateServiceScreen.tsx` - Create service request
- `ServiceStatusScreen.tsx` - Update service status

**Components:**
- `ServiceCard.tsx` - Service card
- `ServiceStatusBadge.tsx` - Status indicator
- `ServiceForm.tsx` - Service form
- `ServiceImagePicker.tsx` - Image upload
- `CustomerLookup.tsx` - Customer search

**Features:**
- View assigned services
- Filter by status (Pending, In Progress, Completed)
- Search services
- Create new service request
- Update service status
- Add service notes
- Upload service images
- Customer information
- Location on map
- Service history

**API Integration:**
```typescript
// services/serviceService.ts
- GET /api/v1/service/all (Get all services - Admin)
- GET /api/v1/service/assignedTo/:id (Get assigned services)
- GET /api/v1/service/:id (Get service details)
- POST /api/v1/service/create (Create service)
- PUT /api/v1/service/:id (Update service)
- PUT /api/v1/service/:id/status (Update status)
- GET /api/v1/service/phone/:phone (Get by phone)
```

#### 3.2 Service Status Management
**Status Flow:**
```
Pending → In Progress → Completed
         ↓
      Cancelled
```

**Components:**
- `StatusUpdateModal.tsx` - Status update modal
- `ServiceNotesInput.tsx` - Notes input
- `ServiceImageGallery.tsx` - Image gallery

**Features:**
- Quick status update
- Add notes with status change
- Upload images
- Time tracking
- Customer signature (future)

---

### 4. Rental Management Feature

#### 4.1 Rental Invoice Entry
**Screens:**
- `RentalInvoiceListScreen.tsx` - Invoice list
- `RentalInvoiceFormScreen.tsx` - Create/Edit invoice
- `RentalInvoiceDetailScreen.tsx` - Invoice details
- `CountImageCaptureScreen.tsx` - Camera for count images

**Components:**
- `InvoiceForm.tsx` - Main invoice form
- `ProductSelector.tsx` - Product selection
- `ProductConfigForm.tsx` - A3/A4/A5 config
- `CountImageCapture.tsx` - Camera component
- `ProductCard.tsx` - Product card in form
- `CompanySelector.tsx` - Company autocomplete

**Features:**
- Select company (autocomplete)
- Add multiple products
- Select product/machine
- Enter serial number
- **Camera Integration:**
  - Capture count images
  - Multiple images per product
  - Image preview
  - Retake option
  - Image compression
- **Count Entry:**
  - A3 Config (B/W, Color, Color Scanning)
  - A4 Config (B/W, Color, Color Scanning)
  - A5 Config (B/W, Color, Color Scanning)
  - Old Count → New Count
  - Auto-calculation
- Add remarks
- Select contact person
- Save as draft
- Submit invoice

**API Integration:**
```typescript
// services/rentalService.ts
- GET /api/v1/rental-payment (Get all invoices)
- GET /api/v1/rental-payment/:id (Get invoice details)
- POST /api/v1/rental-payment/create-rental-entry (Create invoice)
- PUT /api/v1/rental-payment/:id (Update invoice)
- GET /api/v1/rental-products/getServiceProductsByCompany/:companyId
- GET /api/v1/company (Get companies)
```

#### 4.2 Count Image Capture
**Camera Features:**
- Native camera integration
- Flash support
- Zoom functionality
- Image annotation (draw on image)
- Multiple images per product
- Image compression
- Offline image storage

**Implementation:**
```typescript
// components/CountImageCapture.tsx
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const CountImageCapture = ({ onImageCapture }) => {
  const handleCapture = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
      },
      (response) => {
        if (response.assets && response.assets[0]) {
          onImageCapture(response.assets[0]);
        }
      }
    );
  };
  
  // Component implementation
};
```

#### 4.3 Product Configuration
**Count Input Form:**
```typescript
// components/ProductConfigForm.tsx
interface CountConfig {
  bwOldCount: number;
  bwNewCount: number;
  colorOldCount: number;
  colorNewCount: number;
  colorScanningOldCount: number;
  colorScanningNewCount: number;
}

// A3, A4, A5 configurations
```

---

### 5. Admin Dashboard Feature

#### 5.1 Dashboard Overview
**Screens:**
- `AdminDashboardScreen.tsx` - Main dashboard
- `AnalyticsScreen.tsx` - Detailed analytics
- `ReportsScreen.tsx` - Reports view

**Components:**
- `DashboardCard.tsx` - Stat card
- `ChartComponent.tsx` - Charts
- `QuickActions.tsx` - Quick action buttons
- `RecentActivity.tsx` - Activity feed

**Features:**
- **Key Metrics:**
  - Total services today
  - Total invoices today
  - Total revenue
  - Pending approvals
  - Active employees
- **Charts:**
  - Revenue chart (daily/weekly/monthly)
  - Service completion chart
  - Commission chart
  - Customer growth chart
- **Quick Actions:**
  - Create service
  - Create invoice
  - Add employee
  - View reports
- **Recent Activity:**
  - Latest services
  - Latest invoices
  - Latest orders

**API Integration:**
```typescript
// services/adminService.ts
- GET /api/v1/admin/dashboard-stats (Get dashboard stats)
- GET /api/v1/admin/analytics (Get analytics)
- GET /api/v1/report/* (Various reports)
```

#### 5.2 Employee Management
**Screens:**
- `EmployeeListScreen.tsx` - Employee list
- `EmployeeDetailScreen.tsx` - Employee details
- `AddEmployeeScreen.tsx` - Add/Edit employee

**Features:**
- View all employees
- Employee details
- Add/Edit employee
- Assign to services
- View employee performance
- Commission tracking

#### 5.3 Service Monitoring
**Screens:**
- `ServiceMonitoringScreen.tsx` - Monitor all services
- `ServiceMapViewScreen.tsx` - Services on map

**Features:**
- View all services
- Filter and search
- Assign employees
- Update service status
- View on map
- Service analytics

#### 5.4 Invoice Management
**Screens:**
- `InvoiceListScreen.tsx` - All invoices
- `InvoiceApprovalScreen.tsx` - Approve invoices

**Features:**
- View all invoices
- Filter by status
- Approve/reject invoices
- Invoice details
- Export invoices

---

## 🗂️ Screens & Navigation

### Navigation Structure

```typescript
// navigation/AppNavigator.tsx

// Customer Navigation (Bottom Tabs)
const CustomerNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Products" component={ProductListScreen} />
    <Tab.Screen name="Cart" component={CartScreen} />
    <Tab.Screen name="Orders" component={OrderListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Employee Navigation (Drawer)
const EmployeeNavigator = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Dashboard" component={EmployeeDashboardScreen} />
    <Drawer.Screen name="Services" component={ServiceListScreen} />
    <Drawer.Screen name="Rentals" component={RentalInvoiceListScreen} />
    <Drawer.Screen name="Customers" component={CustomerListScreen} />
    <Drawer.Screen name="Profile" component={ProfileScreen} />
  </Drawer.Navigator>
);

// Admin Navigation (Drawer)
const AdminNavigator = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Dashboard" component={AdminDashboardScreen} />
    <Drawer.Screen name="Services" component={ServiceMonitoringScreen} />
    <Drawer.Screen name="Rentals" component={RentalInvoiceListScreen} />
    <Drawer.Screen name="E-commerce" component={EcommerceManagementScreen} />
    <Drawer.Screen name="Employees" component={EmployeeListScreen} />
    <Drawer.Screen name="Reports" component={ReportsScreen} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
  </Drawer.Navigator>
);
```

### Screen List

**Authentication (3 screens):**
1. LoginScreen
2. RegisterScreen
3. ForgotPasswordScreen

**E-commerce (8 screens):**
4. ProductListScreen
5. ProductDetailScreen
6. ProductSearchScreen
7. CartScreen
8. CheckoutScreen
9. OrderListScreen
10. OrderDetailScreen
11. OrderTrackingScreen

**Service Management (5 screens):**
12. ServiceListScreen
13. ServiceDetailScreen
14. CreateServiceScreen
15. ServiceStatusScreen
16. ServiceMapViewScreen

**Rental Management (4 screens):**
17. RentalInvoiceListScreen
18. RentalInvoiceFormScreen
19. RentalInvoiceDetailScreen
20. CountImageCaptureScreen

**Admin Dashboard (8 screens):**
21. AdminDashboardScreen
22. AnalyticsScreen
23. ReportsScreen
24. EmployeeListScreen
25. EmployeeDetailScreen
26. AddEmployeeScreen
27. ServiceMonitoringScreen
28. InvoiceApprovalScreen

**Common (3 screens):**
29. ProfileScreen
30. SettingsScreen
31. NotificationScreen

**Total: 31 screens**

---

## 🔄 State Management

### Redux Toolkit Setup

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import serviceReducer from './slices/serviceSlice';
import rentalReducer from './slices/rentalSlice';
import adminReducer from './slices/adminSlice';
import ecommerceReducer from './slices/ecommerceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    service: serviceReducer,
    rental: rentalReducer,
    admin: adminReducer,
    ecommerce: ecommerceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Slices

**1. Auth Slice:**
```typescript
// store/slices/authSlice.ts
- user: User | null
- token: string | null
- role: UserRole
- permissions: string[]
- isAuthenticated: boolean
- isLoading: boolean
```

**2. Cart Slice:**
```typescript
// store/slices/cartSlice.ts
- items: CartItem[]
- total: number
- saveLaterItems: CartItem[]
```

**3. Service Slice:**
```typescript
// store/slices/serviceSlice.ts
- services: Service[]
- selectedService: Service | null
- filters: ServiceFilters
- isLoading: boolean
```

**4. Rental Slice:**
```typescript
// store/slices/rentalSlice.ts
- invoices: RentalInvoice[]
- currentInvoice: RentalInvoice | null
- draftInvoice: RentalInvoice | null
- isLoading: boolean
```

**5. Admin Slice:**
```typescript
// store/slices/adminSlice.ts
- dashboardStats: DashboardStats
- analytics: AnalyticsData
- employees: Employee[]
```

**6. E-commerce Slice:**
```typescript
// store/slices/ecommerceSlice.ts
- products: Product[]
- selectedProduct: Product | null
- categories: Category[]
- orders: Order[]
```

---

## 🌐 API Integration

### API Service Structure

```typescript
// services/api.ts
const API_BASE_URL = 'https://your-api-url.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle logout
    }
    return Promise.reject(error);
  }
);
```

### Service Files

```typescript
// services/authService.ts
export const authService = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  register: (data: RegisterData) => 
    api.post('/auth/register', data),
  // ... more methods
};

// services/ecommerceService.ts
export const ecommerceService = {
  getProducts: () => api.get('/product'),
  getProduct: (id: string) => api.get(`/product/${id}`),
  // ... more methods
};

// services/serviceService.ts
export const serviceService = {
  getServices: () => api.get('/service/all'),
  getAssignedServices: (employeeId: string) => 
    api.get(`/service/assignedTo/${employeeId}`),
  createService: (data: ServiceData) => 
    api.post('/service/create', data),
  // ... more methods
};

// services/rentalService.ts
export const rentalService = {
  getInvoices: () => api.get('/rental-payment'),
  createInvoice: (data: FormData) => 
    api.post('/rental-payment/create-rental-entry', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  // ... more methods
};

// services/adminService.ts
export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getAnalytics: () => api.get('/admin/analytics'),
  // ... more methods
};
```

---

## 📅 Development Phases

### Phase 1: Foundation (Week 1-2)
**Duration:** 2 weeks

**Tasks:**
- ✅ Project setup
- ✅ Navigation structure
- ✅ Redux store setup
- ✅ API service setup
- ✅ Authentication flow
- ✅ Role-based navigation
- ✅ Basic UI components

**Deliverables:**
- Login/Register screens
- Navigation working
- Redux store configured
- API integration ready

---

### Phase 2: E-commerce (Week 3-5)
**Duration:** 3 weeks

**Tasks:**
- ✅ Product listing
- ✅ Product details
- ✅ Search & filters
- ✅ Shopping cart
- ✅ Checkout flow
- ✅ Order management

**Deliverables:**
- Complete e-commerce flow
- Cart functionality
- Order tracking

---

### Phase 3: Service Management (Week 6-8)
**Duration:** 3 weeks

**Tasks:**
- ✅ Service list screen
- ✅ Service details
- ✅ Create service
- ✅ Status updates
- ✅ Image upload
- ✅ Location integration

**Deliverables:**
- Complete service management
- Field technician app ready

---

### Phase 4: Rental Management (Week 9-11)
**Duration:** 3 weeks

**Tasks:**
- ✅ Invoice list
- ✅ Invoice form
- ✅ Multiple products support
- ✅ Camera integration
- ✅ Count entry forms
- ✅ Image capture & upload

**Deliverables:**
- Complete rental invoice entry
- Camera integration working

---

### Phase 5: Admin Dashboard (Week 12-14)
**Duration:** 3 weeks

**Tasks:**
- ✅ Dashboard screen
- ✅ Analytics & charts
- ✅ Employee management
- ✅ Service monitoring
- ✅ Invoice approvals
- ✅ Reports

**Deliverables:**
- Complete admin dashboard
- All management features

---

### Phase 6: Polish & Testing (Week 15-16)
**Duration:** 2 weeks

**Tasks:**
- ✅ UI/UX improvements
- ✅ Performance optimization
- ✅ Bug fixes
- ✅ Testing
- ✅ App store preparation

**Deliverables:**
- Production-ready app
- App store assets
- Documentation

---

## 🛠️ Technology Stack

### Core
- **React Native:** 0.72.0
- **TypeScript:** 5.0.0
- **React Navigation:** 6.x

### State Management
- **Redux Toolkit:** 1.9.0
- **React Redux:** 8.1.0

### UI Components
- **React Native Vector Icons:** 10.0.0
- **React Native Paper:** (Optional Material Design)
- **React Native Elements:** (Optional component library)

### Camera & Media
- **React Native Image Picker:** 5.6.0
- **React Native Camera:** 4.2.1

### Maps & Location
- **React Native Maps:** 1.7.1
- **@react-native-community/geolocation:** 3.2.0

### Notifications
- **@react-native-firebase/messaging:** 18.0.0
- **React Native Push Notification:** 8.1.1

### Storage
- **@react-native-async-storage/async-storage:** 1.19.0

### Networking
- **Axios:** 1.4.0

### Charts & Analytics
- **React Native Chart Kit:** 6.12.0
- **React Native SVG:** 13.14.0

### Utilities
- **React Native Toast Message:** 2.1.0
- **React Native Modal:** 13.0.1
- **React Native Calendars:** 1.1301.0

---

## 📁 File Structure

```
CorpcultureMobile/
├── src/
│   ├── app/
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── CustomerNavigator.tsx
│   │   │   ├── EmployeeNavigator.tsx
│   │   │   └── AdminNavigator.tsx
│   │   ├── store/
│   │   │   ├── index.ts
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── cartSlice.ts
│   │   │       ├── serviceSlice.ts
│   │   │       ├── rentalSlice.ts
│   │   │       ├── adminSlice.ts
│   │   │       └── ecommerceSlice.ts
│   │   └── App.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   │   ├── LoginScreen.tsx
│   │   │   │   ├── RegisterScreen.tsx
│   │   │   │   └── ForgotPasswordScreen.tsx
│   │   │   └── components/
│   │   │       └── LoginForm.tsx
│   │   │
│   │   ├── ecommerce/
│   │   │   ├── screens/
│   │   │   │   ├── ProductListScreen.tsx
│   │   │   │   ├── ProductDetailScreen.tsx
│   │   │   │   ├── CartScreen.tsx
│   │   │   │   ├── CheckoutScreen.tsx
│   │   │   │   ├── OrderListScreen.tsx
│   │   │   │   └── OrderDetailScreen.tsx
│   │   │   └── components/
│   │   │       ├── ProductCard.tsx
│   │   │       ├── CartItem.tsx
│   │   │       └── PriceSummary.tsx
│   │   │
│   │   ├── service/
│   │   │   ├── screens/
│   │   │   │   ├── ServiceListScreen.tsx
│   │   │   │   ├── ServiceDetailScreen.tsx
│   │   │   │   ├── CreateServiceScreen.tsx
│   │   │   │   └── ServiceStatusScreen.tsx
│   │   │   └── components/
│   │   │       ├── ServiceCard.tsx
│   │   │       └── ServiceForm.tsx
│   │   │
│   │   ├── rental/
│   │   │   ├── screens/
│   │   │   │   ├── RentalInvoiceListScreen.tsx
│   │   │   │   ├── RentalInvoiceFormScreen.tsx
│   │   │   │   ├── RentalInvoiceDetailScreen.tsx
│   │   │   │   └── CountImageCaptureScreen.tsx
│   │   │   └── components/
│   │   │       ├── InvoiceForm.tsx
│   │   │       ├── ProductSelector.tsx
│   │   │       ├── ProductConfigForm.tsx
│   │   │       └── CountImageCapture.tsx
│   │   │
│   │   └── admin/
│   │       ├── screens/
│   │       │   ├── AdminDashboardScreen.tsx
│   │       │   ├── AnalyticsScreen.tsx
│   │       │   ├── EmployeeListScreen.tsx
│   │       │   └── ServiceMonitoringScreen.tsx
│   │       └── components/
│   │           ├── DashboardCard.tsx
│   │           └── ChartComponent.tsx
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useApi.ts
│   │   │   └── usePermissions.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── ecommerceService.ts
│   │   │   ├── serviceService.ts
│   │   │   ├── rentalService.ts
│   │   │   └── adminService.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatters.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── constants/
│   │   │   ├── colors.ts
│   │   │   ├── sizes.ts
│   │   │   └── routes.ts
│   │   │
│   │   └── types/
│   │       ├── auth.types.ts
│   │       ├── service.types.ts
│   │       ├── rental.types.ts
│   │       └── ecommerce.types.ts
│   │
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── android/
├── ios/
├── __tests__/
├── package.json
├── tsconfig.json
├── babel.config.js
└── metro.config.js
```

---

## 🎯 Key Implementation Details

### 1. Role-Based Navigation

```typescript
// App.tsx
const App = () => {
  const { isAuthenticated, role } = useAppSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }
  
  switch (role) {
    case UserRole.CUSTOMER:
      return <CustomerNavigator />;
    case UserRole.EMPLOYEE:
      return <EmployeeNavigator />;
    case UserRole.ADMIN:
      return <AdminNavigator />;
    default:
      return <AuthNavigator />;
  }
};
```

### 2. Camera Integration

```typescript
// components/CountImageCapture.tsx
import { launchCamera, ImagePickerResponse } from 'react-native-image-picker';

const CountImageCapture = ({ onImageCapture }) => {
  const handleCapture = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      includeBase64: false,
    };
    
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Toast.show({ type: 'error', text1: 'Camera Error' });
        return;
      }
      if (response.assets && response.assets[0]) {
        onImageCapture(response.assets[0]);
      }
    });
  };
  
  return (
    <TouchableOpacity onPress={handleCapture}>
      <Icon name="camera" />
    </TouchableOpacity>
  );
};
```

### 3. FormData Upload

```typescript
// services/rentalService.ts
export const createRentalInvoice = async (data: RentalInvoiceData) => {
  const formData = new FormData();
  
  formData.append('companyId', data.companyId);
  formData.append('sendDetailsTo', data.sendDetailsTo);
  formData.append('products', JSON.stringify(data.products));
  
  // Append images
  data.products.forEach((product, index) => {
    if (product.countImageFile) {
      formData.append(`product_${index}_image`, {
        uri: product.countImageFile.uri,
        type: 'image/jpeg',
        name: `count_${index}.jpg`,
      });
    }
  });
  
  return api.post('/rental-payment/create-rental-entry', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
```

---

## ✅ Checklist

### Phase 1: Foundation
- [ ] Project setup
- [ ] Navigation structure
- [ ] Redux store
- [ ] API service
- [ ] Authentication
- [ ] Role-based navigation

### Phase 2: E-commerce
- [ ] Product listing
- [ ] Product details
- [ ] Shopping cart
- [ ] Checkout
- [ ] Orders

### Phase 3: Service Management
- [ ] Service list
- [ ] Service details
- [ ] Create service
- [ ] Status updates
- [ ] Image upload

### Phase 4: Rental Management
- [ ] Invoice list
- [ ] Invoice form
- [ ] Camera integration
- [ ] Count entry
- [ ] Multiple products

### Phase 5: Admin Dashboard
- [ ] Dashboard
- [ ] Analytics
- [ ] Employee management
- [ ] Reports

### Phase 6: Polish
- [ ] UI/UX improvements
- [ ] Performance
- [ ] Testing
- [ ] App store prep

---

## 📝 Notes

- Use TypeScript for type safety
- Implement error boundaries
- Add loading states everywhere
- Handle offline scenarios
- Optimize images before upload
- Cache API responses
- Implement pull-to-refresh
- Add skeleton loaders
- Handle deep linking
- Implement push notifications

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-23  
**Status:** Implementation Plan

