# Corpculture Mobile App

React Native mobile application for Corpculture business management system.

## Features

- **Sales Module**: Product browsing, cart, orders, enquiries
- **Service Management**: Service enquiries, invoices, quotations
- **Rental Management**: Rental invoices with count image capture
- **Admin Dashboard**: Analytics, employee management, commission tracking
- **Role-Based Access**: Different interfaces for Customer, Employee, and Admin

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Studio (for Android)

## Installation

1. Navigate to the mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the Expo development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Project Structure

```
mobile-app/
├── src/
│   ├── data/
│   │   └── sampleData.ts          # Sample data for offline mode
│   ├── navigation/
│   │   ├── AppNavigator.tsx        # Main navigation
│   │   ├── AuthNavigator.tsx       # Auth screens
│   │   ├── CustomerNavigator.tsx   # Customer navigation
│   │   ├── EmployeeNavigator.tsx   # Employee navigation
│   │   └── AdminNavigator.tsx      # Admin navigation
│   ├── screens/
│   │   ├── Auth/                   # Login, Register, Forgot Password
│   │   ├── Sales/                  # Home, Products, Cart, Orders
│   │   ├── Service/                # Service enquiries, invoices
│   │   ├── Rental/                 # Rental invoices
│   │   ├── Admin/                  # Admin dashboard, management
│   │   ├── Employee/               # Employee dashboard
│   │   └── Common/                 # Profile, Settings
│   ├── services/
│   │   └── api.ts                  # API service layer with sample data fallback
│   └── store/
│       ├── index.ts                # Redux store
│       └── slices/                 # Redux slices
├── App.tsx                         # Root component
├── package.json
└── README.md
```

## API Configuration

The app uses sample data by default. To connect to the actual API:

1. Update `src/services/api.ts`:
   - Set `USE_SAMPLE_DATA = false`
   - Update `API_BASE_URL` with your backend URL

2. Create `.env` file:
```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api/v1
```

## Sample Data

The app includes comprehensive sample data for:
- Users (Customer, Employee, Admin)
- Products
- Companies
- Orders
- Service Enquiries
- Rental Invoices
- And more...

## User Roles

- **Customer (Role 0)**: Browse products, place orders, create enquiries
- **Employee (Role 3)**: Manage service requests, create invoices
- **Admin (Role 1)**: Full access to all features

## Key Features

### Sales Module
- Product listing with search and filters
- Product details
- Shopping cart
- Order management
- Create rental/service enquiries
- Company registration

### Service Module
- Service enquiry creation
- Assigned service requests
- Service invoice creation
- Status updates

### Rental Module
- Rental invoice creation
- Multiple products per invoice
- Count image capture (camera integration)
- A3/A4/A5 count configuration

### Admin Module
- Dashboard with analytics
- Product management
- Order management
- Employee management
- Commission tracking

## Development

### Adding New Screens

1. Create screen component in appropriate folder
2. Add route in navigation file
3. Update Redux slice if needed
4. Add API service method

### State Management

The app uses Redux Toolkit for state management:
- `authSlice`: Authentication state
- `cartSlice`: Shopping cart
- `productSlice`: Products
- `orderSlice`: Orders
- `serviceSlice`: Service data
- `rentalSlice`: Rental data
- `adminSlice`: Admin data

## Testing

Currently using sample data. When API is ready:
1. Set `USE_SAMPLE_DATA = false` in `api.ts`
2. Update API endpoints
3. Test with real backend

## Building APK

### Option 1: Using EAS Build (Recommended - Cloud Build)

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Configure EAS Build:
```bash
eas build:configure
```

4. Build APK:
```bash
eas build --platform android --profile preview
```

The APK will be available for download from the Expo dashboard.

### Option 2: Local Build (Requires Android Studio)

1. Install dependencies:
```bash
npm install
```

2. Generate native Android project:
```bash
npx expo prebuild --platform android
```

3. Build APK locally:
```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Option 3: Development Build

For testing during development:
```bash
npx expo run:android
```

## Troubleshooting

### Common Issues

1. **Metro bundler errors**: Clear cache with `npm start -- --reset-cache`
2. **iOS build issues**: Run `cd ios && pod install`
3. **Android build issues**: Clean build folder in Android Studio
4. **Flutter command error**: This is a React Native/Expo project, use Expo commands instead of Flutter commands

## Notes

- The app is configured to work with sample data by default
- All API calls have fallback to sample data
- Navigation is role-based
- Redux store persists auth state

## License

Proprietary - Corpculture

