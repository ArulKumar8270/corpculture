# Corpculture Mobile App - Feature List

## 📱 Overview

This document outlines all mobile app features that can be created based on the existing Corpculture web application. The mobile app will serve field technicians, sales employees, managers, and customers with on-the-go access to business operations.

---

## 🎯 Target User Roles

1. **Field Service Technicians** - Primary users for service calls
2. **Sales Employees** - Customer interactions and quotations
3. **Rental Technicians** - Equipment count tracking and invoices
4. **Managers/Admins** - Mobile dashboard and approvals
5. **Customers** - Service requests and order tracking (optional)

---

## 📋 Core Mobile App Features

### 1. 🔐 Authentication & User Management

#### Features:
- **Login/Logout**
  - Email/Phone + Password
  - Biometric authentication (Face ID, Fingerprint)
  - Remember me option
  - Auto-logout on token expiry

- **User Profile**
  - View profile details
  - Update profile information
  - Change password
  - Profile photo upload
  - Department and designation display

- **Role-Based Access**
  - Different UI based on user role
  - Permission-based feature access
  - Admin vs Employee views

**Mobile Advantages:**
- Quick biometric login
- Secure token storage
- Offline authentication check

---

### 2. 📞 Service Management (Field Service App)

#### 2.1 Service Requests Dashboard
- **My Assigned Services**
  - List of assigned service requests
  - Filter by status (Pending, In Progress, Completed)
  - Sort by date, priority, location
  - Pull-to-refresh
  - Search functionality

- **Service Details View**
  - Customer information
  - Company details
  - Contact person
  - Service type and description
  - Location with map integration
  - Service history
  - Status updates

#### 2.2 Service Request Creation
- **Quick Service Entry**
  - Customer phone number lookup
  - Auto-populate company details
  - Service type selection
  - Complaint description
  - Location capture (GPS)
  - Photo attachment
  - Customer signature capture

#### 2.3 Service Status Updates
- **Status Management**
  - Update status (Pending → In Progress → Completed)
  - Add service notes
  - Upload service images
  - Time tracking (start/end time)
  - Customer signature on completion
  - Service report generation

#### 2.4 Service History
- **Past Services**
  - View completed services
  - Service details and notes
  - Customer feedback
  - Service images gallery
  - Re-service option

**Mobile Advantages:**
- GPS location capture
- Camera integration for service photos
- Offline mode for remote areas
- Push notifications for new assignments

---

### 3. 🏢 Rental Management (Rental Technician App)

#### 3.1 Rental Invoice Entry
- **Count Entry Form**
  - Select company (autocomplete)
  - Select rental product/machine
  - Serial number input/scan
  - **Camera Integration for Count Images**
    - Capture machine count display
    - Multiple product images
    - Image preview before upload
    - Retake option
  - **Count Input (A3/A4/A5)**
    - B/W Old Count → New Count
    - Color Old Count → New Count
    - Color Scanning Old Count → New Count
    - Auto-calculation of billable copies
  - **Product Management**
    - Add multiple products in single entry
    - Remove products
    - Product-specific configurations
  - Remarks field
  - Contact person selection

#### 3.2 Invoice Management
- **Invoice List**
  - View all rental invoices
  - Filter by company, date, status
  - Search functionality
  - Invoice details view
  - Edit invoice (if not completed)
  - Delete draft invoices

#### 3.3 Count Image Capture
- **Camera Features**
  - High-quality image capture
  - Flash support
  - Zoom functionality
  - Image annotation (draw on image)
  - Multiple images per product
  - Image compression for faster upload

**Mobile Advantages:**
- Native camera integration
- Better image quality than web upload
- Quick count entry on-site
- Offline count entry with sync

---

### 4. 💼 Sales & Quotation Management

#### 4.1 Service Quotations
- **Create Quotation**
  - Customer selection
  - Service/product selection
  - Pricing configuration
  - Terms and conditions
  - Generate PDF quotation
  - Send via WhatsApp/Email

#### 4.2 Service Invoices
- **Invoice Creation**
  - Convert quotation to invoice
  - Multiple products/services
  - GST calculation
  - Payment terms
  - Invoice PDF generation
  - Share invoice

#### 4.3 Customer Management
- **Customer List**
  - View all customers
  - Customer details
  - Contact information
  - Service history
  - Quick call/WhatsApp

**Mobile Advantages:**
- Quick quotation on-the-go
- Direct WhatsApp sharing
- PDF generation and sharing
- Customer contact integration

---

### 5. 📊 Dashboard & Analytics

#### 5.1 Employee Dashboard
- **Today's Overview**
  - Assigned services count
  - Completed services today
  - Pending tasks
  - Commission earned today
  - Monthly commission summary

#### 5.2 Statistics
- **Performance Metrics**
  - Services completed this month
  - Average service time
  - Customer satisfaction rating
  - Commission breakdown
  - Revenue generated

#### 5.3 Quick Actions
- **Quick Access**
  - Create new service request
  - Add rental invoice
  - View pending tasks
  - Check notifications

**Mobile Advantages:**
- Quick glance at daily tasks
- Real-time updates
- Push notifications
- Widget support (iOS/Android)

---

### 6. 💰 Commission Tracking

#### 6.1 Commission Dashboard
- **My Commissions**
  - Total commission earned
  - Commission by source (Service/Rental/Sales)
  - Monthly commission breakdown
  - Pending vs Paid commissions
  - Commission history

#### 6.2 Commission Details
- **Commission Breakdown**
  - Commission per service/invoice
  - Percentage rates
  - Payment status
  - Payment dates
  - Export commission report

**Mobile Advantages:**
- Real-time commission updates
- Quick commission check
- Payment notifications

---

### 7. 📍 Location & Navigation

#### 7.1 GPS Integration
- **Location Features**
  - Auto-capture service location
  - Map view of service locations
  - Navigation to customer location
  - Route optimization
  - Distance calculation
  - Location history

#### 7.2 Map View
- **Interactive Maps**
  - View all service locations
  - Cluster markers
  - Filter by date/status
  - Directions integration
  - Estimated arrival time

**Mobile Advantages:**
- Native GPS integration
- Better location accuracy
- Navigation apps integration
- Real-time location tracking

---

### 8. 📸 Camera & Media Features

#### 8.1 Image Capture
- **Camera Integration**
  - Service photos
  - Count images (rental invoices)
  - Product images
  - Document scanning
  - Image editing (crop, rotate, annotate)
  - Multiple image selection

#### 8.2 Image Management
- **Gallery Features**
  - View captured images
  - Image preview
  - Delete images
  - Upload to cloud
  - Offline image storage
  - Image compression

**Mobile Advantages:**
- Native camera app integration
- Better image quality
- Quick capture
- Image editing tools

---

### 9. 📝 Forms & Data Entry

#### 9.1 Offline Forms
- **Offline Capability**
  - Fill forms without internet
  - Auto-sync when online
  - Draft saving
  - Form validation
  - Data persistence

#### 9.2 Smart Forms
- **Form Features**
  - Auto-complete fields
  - Barcode/QR code scanning
  - Voice input
  - Dropdown selections
  - Date/time pickers
  - Signature capture

**Mobile Advantages:**
- Work in areas with poor connectivity
- Faster data entry
- Voice input support
- Barcode scanning

---

### 10. 🔔 Notifications & Alerts

#### 10.1 Push Notifications
- **Notification Types**
  - New service assignment
  - Service status updates
  - Commission payments
  - Invoice approvals
  - Task reminders
  - System updates

#### 10.2 In-App Notifications
- **Notification Center**
  - View all notifications
  - Mark as read
  - Notification filters
  - Action buttons in notifications
  - Notification history

**Mobile Advantages:**
- Real-time alerts
- Background notifications
- Quick actions from notifications
- Better engagement

---

### 11. 📄 Document Management

#### 11.1 Document Viewing
- **Document Features**
  - View invoices (PDF)
  - View quotations
  - View service reports
  - Download documents
  - Share documents
  - Print documents

#### 11.2 Document Generation
- **PDF Generation**
  - Generate invoices on mobile
  - Create service reports
  - Generate quotations
  - PDF preview
  - PDF sharing

**Mobile Advantages:**
- Quick document access
- Share via native apps
- Print from mobile
- Offline document viewing

---

### 12. 🔍 Search & Filters

#### 12.1 Global Search
- **Search Features**
  - Search services
  - Search customers
  - Search invoices
  - Search products
  - Recent searches
  - Search suggestions

#### 12.2 Advanced Filters
- **Filter Options**
  - Filter by date range
  - Filter by status
  - Filter by company
  - Filter by employee
  - Save filter presets
  - Quick filters

**Mobile Advantages:**
- Quick search access
- Voice search
- Search history
- Smart suggestions

---

### 13. 👥 Customer Management

#### 13.1 Customer Directory
- **Customer List**
  - View all customers
  - Customer details
  - Contact information
  - Service history
  - Quick actions (call, WhatsApp, email)

#### 13.2 Customer Details
- **Customer Profile**
  - Company information
  - Contact persons
  - Address details
  - Service history
  - Invoice history
  - Payment status

**Mobile Advantages:**
- Quick customer lookup
- Direct contact integration
- Customer location on map
- Service history at a glance

---

### 14. 📊 Reports & Analytics

#### 14.1 Service Reports
- **Report Types**
  - Daily service report
  - Weekly summary
  - Monthly performance
  - Customer service history
  - Service completion rate

#### 14.2 Rental Reports
- **Rental Analytics**
  - Invoice summary
  - Product usage reports
  - Revenue reports
  - Commission reports
  - Export reports

**Mobile Advantages:**
- Quick report access
- Visual charts and graphs
- Export and share reports
- Offline report viewing

---

### 15. 🔄 Sync & Offline Mode

#### 15.1 Offline Capability
- **Offline Features**
  - Work without internet
  - Local data storage
  - Auto-sync when online
  - Conflict resolution
  - Sync status indicator

#### 15.2 Data Sync
- **Sync Features**
  - Background sync
  - Manual sync option
  - Sync progress indicator
  - Sync error handling
  - Last sync timestamp

**Mobile Advantages:**
- Work in remote areas
- No data loss
- Seamless sync
- Better user experience

---

### 16. ⚙️ Settings & Preferences

#### 16.1 App Settings
- **Settings Options**
  - Notification preferences
  - Sync settings
  - Language selection
  - Theme (Light/Dark mode)
  - Biometric settings
  - Cache management

#### 16.2 Account Settings
- **Account Options**
  - Profile settings
  - Password change
  - Privacy settings
  - Data usage
  - App version info
  - Logout

**Mobile Advantages:**
- Personalized experience
- Better battery optimization
- User preferences
- Security settings

---

## 🎨 Mobile-Specific Features

### 17. 📱 Native Mobile Features

#### 17.1 Device Integration
- **Hardware Features**
  - Camera integration
  - GPS location
  - Biometric authentication
  - Push notifications
  - Contacts integration
  - Calendar integration
  - File system access

#### 17.2 Platform Features
- **iOS Features**
  - Widget support
  - Siri shortcuts
  - Apple Watch app (future)
  - Handoff support
  - Share extension

- **Android Features**
  - Widget support
  - Android Auto (future)
  - Wear OS app (future)
  - Quick settings tile
  - Share intent

---

### 18. 🚀 Performance Features

#### 18.1 Optimization
- **Performance**
  - Fast app launch
  - Smooth animations
  - Image caching
  - Data caching
  - Lazy loading
  - Background processing

#### 18.2 Battery Optimization
- **Battery Features**
  - Efficient GPS usage
  - Background sync optimization
  - Battery usage stats
  - Power-saving mode

---

## 📱 App Variants

### Variant 1: Field Service Technician App
**Primary Users:** Service technicians, Field workers

**Core Features:**
- Service request management
- Service status updates
- Camera for service photos
- GPS location tracking
- Offline mode
- Customer information
- Service history

**Key Screens:**
1. Dashboard (Today's services)
2. Service list (Assigned services)
3. Service details
4. Service entry form
5. Camera capture
6. Map view
7. Profile

---

### Variant 2: Rental Technician App
**Primary Users:** Rental technicians, Count collectors

**Core Features:**
- Rental invoice entry
- Count image capture
- Multiple products support
- Count input (A3/A4/A5)
- Company/product selection
- Invoice management
- Offline mode

**Key Screens:**
1. Dashboard (Today's invoices)
2. Invoice list
3. Invoice entry form
4. Count image capture
5. Product selection
6. Company selection
7. Invoice details

---

### Variant 3: Sales Employee App
**Primary Users:** Sales employees, Account managers

**Core Features:**
- Customer management
- Quotation creation
- Invoice generation
- Commission tracking
- Customer contact
- Document sharing
- Sales reports

**Key Screens:**
1. Dashboard (Sales overview)
2. Customer list
3. Customer details
4. Quotation form
5. Invoice form
6. Commission dashboard
7. Reports

---

### Variant 4: Manager/Admin App
**Primary Users:** Managers, Administrators

**Core Features:**
- Dashboard with analytics
- Employee management
- Service monitoring
- Invoice approvals
- Commission management
- Reports and analytics
- Settings management

**Key Screens:**
1. Admin dashboard
2. Employee list
3. Service monitoring
4. Invoice approvals
5. Reports
6. Settings

---

### Variant 5: Unified App (All-in-One)
**Primary Users:** All user roles

**Core Features:**
- Role-based UI
- All features based on permissions
- Switch between roles
- Unified dashboard
- Complete feature set

**Key Screens:**
1. Role-based dashboard
2. All feature modules
3. Settings
4. Profile

---

## 🛠️ Technical Implementation

### Technology Stack Options

#### Option 1: React Native (Recommended)
**Pros:**
- Code sharing with web app
- Single codebase for iOS & Android
- Large community
- Good performance
- Native modules support

**Libraries:**
- React Native
- React Navigation
- React Native Camera
- React Native Maps
- React Native AsyncStorage
- React Native Push Notifications

#### Option 2: Flutter
**Pros:**
- Excellent performance
- Beautiful UI
- Single codebase
- Good documentation
- Growing ecosystem

**Libraries:**
- Flutter
- Provider/Riverpod (State management)
- Camera plugin
- Google Maps
- Shared Preferences
- Firebase Cloud Messaging

#### Option 3: Native Development
**Pros:**
- Best performance
- Full platform features
- Platform-specific UI
- Better user experience

**Cons:**
- Separate codebases
- Higher development cost
- Longer development time

---

### Backend Integration

#### API Endpoints Needed
- All existing REST APIs
- Push notification endpoints
- File upload endpoints
- Offline sync endpoints
- Real-time updates (WebSocket)

#### New APIs Required
- `/api/v1/mobile/push-token` - Register push token
- `/api/v1/mobile/sync` - Offline sync
- `/api/v1/mobile/location` - Location tracking
- `/api/v1/mobile/notifications` - Notification management

---

## 📋 Feature Priority

### Phase 1: MVP (Minimum Viable Product)
**Timeline:** 2-3 months

1. ✅ Authentication
2. ✅ Service request list
3. ✅ Service details view
4. ✅ Service status update
5. ✅ Camera integration
6. ✅ Basic dashboard
7. ✅ Offline mode (basic)

**Target Users:** Field Service Technicians

---

### Phase 2: Core Features
**Timeline:** 3-4 months

1. ✅ Rental invoice entry
2. ✅ Count image capture
3. ✅ Multiple products support
4. ✅ GPS location tracking
5. ✅ Push notifications
6. ✅ Commission tracking
7. ✅ Customer management

**Target Users:** All technicians

---

### Phase 3: Advanced Features
**Timeline:** 2-3 months

1. ✅ Sales & Quotations
2. ✅ Advanced reports
3. ✅ Document management
4. ✅ Advanced offline sync
5. ✅ Analytics dashboard
6. ✅ Admin features

**Target Users:** All roles

---

### Phase 4: Enhancements
**Timeline:** Ongoing

1. ✅ Widget support
2. ✅ Voice commands
3. ✅ Barcode scanning
4. ✅ Advanced analytics
5. ✅ AI features
6. ✅ Wearable support

---

## 💡 Unique Mobile Features

### 1. Voice Input
- Voice-to-text for service notes
- Voice commands for navigation
- Voice search

### 2. Barcode/QR Scanning
- Scan product serial numbers
- Scan customer QR codes
- Quick product lookup

### 3. Augmented Reality (Future)
- AR product identification
- AR service instructions
- AR count display reading

### 4. Machine Learning
- Predictive service scheduling
- Image recognition for count reading
- Customer behavior analysis

### 5. Wearable Integration
- Apple Watch app
- Wear OS app
- Quick actions from watch

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)

1. **User Engagement**
   - Daily active users
   - Session duration
   - Features used per session

2. **Productivity**
   - Services completed per day
   - Time saved per service
   - Invoice creation time

3. **Adoption**
   - User adoption rate
   - Feature usage rate
   - Offline usage percentage

4. **Performance**
   - App crash rate
   - Load time
   - Sync success rate

---

## 🔐 Security Features

### Mobile Security
- Biometric authentication
- Secure token storage
- Encrypted local database
- Certificate pinning
- App tampering detection
- Secure file storage

---

## 📱 Platform Support

### iOS
- iOS 13.0+
- iPhone and iPad support
- Dark mode support
- Widget support (iOS 14+)

### Android
- Android 8.0 (API 26)+
- Phone and tablet support
- Material Design
- Widget support

---

## 🎯 Conclusion

The Corpculture mobile app will provide:

1. **Field Technicians** - Complete service management on-the-go
2. **Rental Technicians** - Quick count entry with camera integration
3. **Sales Employees** - Customer management and quotations
4. **Managers** - Mobile dashboard and approvals

**Key Advantages:**
- ✅ Native camera integration
- ✅ GPS location tracking
- ✅ Offline capability
- ✅ Push notifications
- ✅ Better user experience
- ✅ Increased productivity
- ✅ Real-time updates

**Recommended Approach:**
- Start with **React Native** for faster development
- Build **Field Service App** first (highest value)
- Add **Rental Technician App** next
- Eventually create **Unified App** for all roles

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-23  
**Status:** Planning Phase

