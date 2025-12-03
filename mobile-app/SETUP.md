# React Native App Setup Guide

## Quick Start

1. **Install dependencies:**
```bash
cd mobile-app
npm install
```

2. **Start the app:**
```bash
npm start
```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile-app/
├── App.tsx                          # Root component with Redux Provider
├── src/
│   ├── data/
│   │   └── sampleData.ts           # Sample data (users, products, orders, etc.)
│   ├── navigation/
│   │   ├── AppNavigator.tsx        # Main navigation router
│   │   ├── AuthNavigator.tsx       # Login/Register screens
│   │   ├── CustomerNavigator.tsx   # Customer bottom tabs
│   │   ├── EmployeeNavigator.tsx   # Employee drawer navigation
│   │   └── AdminNavigator.tsx      # Admin drawer navigation
│   ├── screens/
│   │   ├── Auth/                   # Login, Register, ForgotPassword
│   │   ├── Sales/                  # Home, Products, Cart, Orders, Enquiries
│   │   ├── Service/                # Service enquiries, invoices
│   │   ├── Rental/                 # Rental invoices with camera
│   │   ├── Admin/                  # Dashboard, management screens
│   │   ├── Employee/               # Employee dashboard
│   │   └── Common/                 # Profile, Settings
│   ├── services/
│   │   └── api.ts                  # API service layer with sample data fallback
│   └── store/
│       ├── index.ts                # Redux store configuration
│       └── slices/                 # Redux slices (auth, cart, products, etc.)
└── package.json
```

## Features Implemented

### ✅ Authentication
- Login screen
- Register screen
- Forgot password screen
- Token-based authentication
- Role-based navigation

### ✅ Sales Module
- Home screen with quick actions
- Product listing with search
- Product details
- Shopping cart
- Order management
- Create rental enquiry
- Create service enquiry
- Create company

### ✅ Service Module
- Service enquiry list
- Service detail with call option
- Create service (placeholder)

### ✅ Rental Module
- Rental invoice list
- Create rental invoice with camera
- Invoice details (placeholder)

### ✅ Admin Module
- Dashboard with statistics
- Product management (placeholder)
- Order management (placeholder)
- Service monitoring (placeholder)
- Rental management (placeholder)
- Employee list (placeholder)
- Commission (placeholder)

### ✅ Common Features
- Profile screen with logout
- Role-based navigation
- Redux state management
- Sample data fallback

## API Integration

The app is configured to use **sample data by default**. All API calls have fallback to sample data.

### To Enable Real API:

1. Open `src/services/api.ts`
2. Change `USE_SAMPLE_DATA = false`
3. Update `API_BASE_URL` with your backend URL
4. Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api/v1
```

## Sample Data

The app includes comprehensive sample data:
- 3 users (Customer, Employee, Admin)
- 3 products
- 2 companies
- 2 orders
- Service enquiries
- Rental invoices
- And more...

## User Roles

- **Customer (Role 0)**: Browse products, cart, orders, create enquiries
- **Employee (Role 3)**: Service requests, rental invoices
- **Admin (Role 1)**: Full access to all features

## Testing

### Test Users (Sample Data)

**Customer:**
- Email: customer@example.com
- Password: (any)

**Employee:**
- Email: employee@example.com
- Password: (any)

**Admin:**
- Email: admin@example.com
- Password: (any)

*Note: Since we're using sample data, any password will work for login.*

## Next Steps

1. **Connect to Real API:**
   - Update `api.ts` to disable sample data
   - Test all API endpoints
   - Handle real authentication

2. **Complete Placeholder Screens:**
   - Service invoice creation
   - Rental invoice full form
   - Admin management screens
   - Employee dashboard

3. **Add Features:**
   - Camera integration for count images
   - Image upload to Cloudinary
   - Push notifications
   - Offline support
   - Deep linking

4. **Enhancements:**
   - Form validation
   - Error handling
   - Loading states
   - Pull to refresh
   - Infinite scroll

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### iOS build issues
```bash
cd ios && pod install
```

### Android build issues
- Clean build folder in Android Studio
- Invalidate caches and restart

## Notes

- All screens are functional with sample data
- Navigation is fully implemented
- Redux store is configured
- API service layer is ready for backend integration
- Camera integration is set up for rental invoices
- Role-based access control is implemented

