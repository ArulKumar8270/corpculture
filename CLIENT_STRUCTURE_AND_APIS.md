# Client Application - Structure, APIs & Functionality

## 📁 Project Structure

```
client/
├── src/
│   ├── assets/              # Images, icons, banners
│   ├── components/          # Reusable UI components
│   │   ├── footer/
│   │   ├── header/
│   │   └── ProductListing/
│   ├── context/             # React Context (Auth, Cart)
│   ├── layouts/             # Layout components
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin pages
│   │   ├── Auth/            # Authentication pages
│   │   ├── Home/            # Home page components
│   │   ├── Products/        # Product listing
│   │   └── user/            # User dashboard pages
│   ├── routes/              # Routing configuration
│   ├── SEO/                 # SEO components
│   └── utils/               # Utility functions
├── public/                  # Static assets
├── dist/                    # Build output
└── package.json
```

## 🛠️ Technology Stack

- **Framework**: React 18.2.0
- **Build Tool**: Vite 4.4.5
- **Routing**: React Router DOM 6.14.2
- **UI Libraries**: 
  - Material-UI (MUI) 5.14.6
  - Tailwind CSS 3.3.3
  - Styled Components 5.3.11
- **HTTP Client**: Axios 1.4.0
- **State Management**: React Context API
- **Other Libraries**:
  - React Toastify (notifications)
  - XLSX (Excel export)
  - Day.js & Moment.js (date handling)
  - React Slick (carousels)

## 🔐 Authentication & Authorization

### Auth Context (`src/context/auth.jsx`)
- **State Management**: User, token, admin status, permissions
- **Storage**: Cookies (js-cookie)
- **Features**:
  - Login/Logout
  - Role-based access (Customer: 0, Admin: 1, Employee: 3)
  - User permissions management
  - Company details management

### API Endpoints:
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/forgot-password` - Password reset
- `GET /api/v1/auth/user-auth` - Verify user token
- `GET /api/v1/auth/admin-auth` - Verify admin token
- `GET /api/v1/permissions/user/:userId` - Get user permissions

## 📄 Pages & Routes

### Public Routes
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - Password reset
- `/products` - Product listing
- `/search` - Search products
- `/product/:productId` - Product details
- `/cart` - Shopping cart

### Protected User Routes (`/user/*`)
- `/user/dashboard` - User dashboard
- `/user/orders` - Order history
- `/user/orders/order_details/:id` - Order details
- `/user/wishlist` - Wishlist
- `/shipping` - Checkout & shipping
- `/shipping/confirm` - Order success
- `/shipping/failed` - Order failed

### Admin Routes (`/admin/*`)
- `/admin/dashboard` - Admin dashboard
- `/admin/orders` - Order management
- `/admin/commission` - Commission management
- `/admin/AdminEmployees` - Employee list
- `/admin/AddEmployee` - Add/Edit employee
- `/admin/employee_details/:id` - Employee details
- `/admin/users` - User management
- `/admin/orders/order_details/:id` - Update orders

## 🛍️ E-Commerce Features

### Products
**Pages**: `Products.jsx`, `ProductPage.jsx`

**API Endpoints**:
- `GET /api/v1/product` - Get all products (with filters)
- `GET /api/v1/product/:id` - Get product details
- `GET /api/v1/product/search?q=query` - Search products
- `GET /api/v1/product/filtered` - Filtered products
- `POST /api/v1/product/create` - Create product (Admin)
- `PUT /api/v1/product/update/:id` - Update product (Admin)
- `DELETE /api/v1/product/delete/:id` - Delete product (Admin)

**Features**:
- Product listing with filters
- Product search
- Category filtering
- Product details view
- Add to cart
- Add to wishlist

### Shopping Cart
**Page**: `Cart.jsx`

**Features**:
- Add/remove items
- Update quantities
- Save for later
- Price calculation
- Shipping options

**API Endpoints**:
- Cart managed via Context API (local state)
- `POST /api/v1/order/create` - Create order

### Orders
**Pages**: `Orders.jsx`, `OrderDetails.jsx`

**API Endpoints**:
- `GET /api/v1/user/orders` - Get user orders
- `GET /api/v1/user/orders/:id` - Get order details
- `PUT /api/v1/order/update/:id` - Update order status (Admin)

**Features**:
- Order history
- Order tracking
- Order status updates
- Order details view

### Wishlist
**Page**: `Wishlist.jsx`

**API Endpoints**:
- Wishlist managed via user model
- `PUT /api/v1/user/update-details` - Update wishlist

## 👥 User Management

### User Profile
**Page**: `UserProfile.jsx`, `Dashboard.jsx`

**API Endpoints**:
- `GET /api/v1/user/get/:id` - Get user details
- `PUT /api/v1/user/update-details` - Update user profile
- `POST /api/v1/auth/upload-file` - Upload profile image

**Features**:
- View/edit profile
- Address management
- PAN card details
- Payment cards
- Reviews

### Company Registration
**Page**: `CompanyRegistrationForm.jsx`

**API Endpoints**:
- `POST /api/v1/company/create` - Create company
- `GET /api/v1/company/user-company/:phone` - Get user company
- `GET /api/v1/company/getByPhone/:phone` - Get company by phone

**Features**:
- Company registration form
- Multiple delivery addresses
- Contact persons
- GST details

## 👨‍💼 Admin Features

### Dashboard
**Page**: `AdminDashboard.jsx`

**API Endpoints**:
- `GET /api/v1/admin/dashboard-stats` - Dashboard statistics

**Features**:
- Sales overview
- Order statistics
- Revenue charts
- Recent activities

### Product Management
**Pages**: `AllProducts.jsx`, `CreateProduct.jsx`, `EditProduct.jsx`

**API Endpoints**:
- `GET /api/v1/product/all` - Get all products
- `POST /api/v1/product/create` - Create product
- `PUT /api/v1/product/update/:id` - Update product
- `DELETE /api/v1/product/delete/:id` - Delete product

**Features**:
- Product CRUD operations
- Image upload
- Category assignment
- Stock management

### Category Management
**Page**: `allcategories.jsx`

**API Endpoints**:
- `GET /api/v1/category/all` - Get all categories
- `POST /api/v1/category/create` - Create category
- `PUT /api/v1/category/update/:id` - Update category
- `DELETE /api/v1/category/delete/:id` - Delete category

### Order Management
**Pages**: `AdminOrders.jsx`, `UpdateOrders.jsx`

**API Endpoints**:
- `GET /api/v1/order/all` - Get all orders
- `GET /api/v1/order/:id` - Get order details
- `PUT /api/v1/order/update/:id` - Update order status
- `POST /api/v1/order/assign` - Assign order to employee

**Features**:
- View all orders
- Update order status
- Assign orders to employees
- Filter by status
- Order details

### Employee Management
**Pages**: `AdminEmployees.jsx`, `AddEmployee.jsx`, `EmployeeDetails.jsx`

**API Endpoints**:
- `GET /api/v1/employee` - Get all employees
- `GET /api/v1/employee/get/:id` - Get employee details
- `POST /api/v1/employee/create` - Create employee
- `PUT /api/v1/employee/update/:id` - Update employee
- `DELETE /api/v1/employee/delete/:id` - Delete employee

**Features**:
- Employee CRUD
- Employee details
- Department assignment
- Salary management
- Employee image upload
- ID card generation

### User Management
**Page**: `Users.jsx`

**API Endpoints**:
- `GET /api/v1/user/all` - Get all users
- `PUT /api/v1/user/update-details` - Update user
- `POST /api/v1/auth/deactivate` - Deactivate account

**Features**:
- View all users
- User details
- Account deactivation
- Role management

### Commission Management
**Page**: `AdminCommission.jsx`

**API Endpoints**:
- `GET /api/v1/commission` - Get commission data
- `POST /api/v1/commission/create` - Create commission
- `PUT /api/v1/commission/update/:id` - Update commission

**Features**:
- Commission tracking
- Employee commission
- Commission reports

## 🔧 Service Management

### Service Enquiries
**Pages**: `AdminServices.jsx`, `ServiceSection.jsx`

**API Endpoints**:
- `GET /api/v1/service/all` - Get all service enquiries
- `GET /api/v1/service/phone/:phone` - Get services by phone
- `GET /api/v1/service/:id` - Get service details
- `POST /api/v1/service/create` - Create service enquiry
- `PUT /api/v1/service/update/:id` - Update service
- `DELETE /api/v1/service/delete/:id` - Delete service

**Features**:
- Service enquiry creation
- Service listing
- Service status management
- Phone-based lookup
- Service image upload

### Service Products
**Pages**: `ServiceProductList.jsx`, `AddServiceProduct.jsx`

**API Endpoints**:
- `GET /api/v1/service-product` - Get service products
- `POST /api/v1/service-product/create` - Create service product
- `PUT /api/v1/service-product/update/:id` - Update service product
- `DELETE /api/v1/service-product/delete/:id` - Delete service product

### Service Invoices
**Pages**: `ServiceInvoiceList.jsx`, `AddServiceInvoice.jsx`

**API Endpoints**:
- `POST /api/v1/service-invoice/all` - Get all invoices (with filters)
- `GET /api/v1/service-invoice/:id` - Get invoice details
- `POST /api/v1/service-invoice/create` - Create invoice
- `PUT /api/v1/service-invoice/update/:id` - Update invoice
- `POST /api/v1/service-invoice/send` - Send invoice via email

**Features**:
- Invoice creation
- Invoice listing
- Invoice PDF generation
- Email sending
- Payment status tracking
- OTP verification

### Service Quotations
**Pages**: `ServiceQuotationList.jsx`, `AddServiceQuotation.jsx`

**API Endpoints**:
- `POST /api/v1/service-invoice/all` - Get quotations (invoiceType: "quotation")
- `POST /api/v1/service-invoice/create` - Create quotation
- `PUT /api/v1/service-invoice/update/:id` - Update quotation

### Service Reports
**Pages**: `AddServiceReport.jsx`, `ServiceReportsandGatpass.jsx`

**API Endpoints**:
- `GET /api/v1/report/service` - Get service reports
- `POST /api/v1/report/create` - Create report
- `PUT /api/v1/report/update/:id` - Update report
- `DELETE /api/v1/report/delete/:id` - Delete report

**Features**:
- Report creation
- Material grouping
- Quantity tracking
- Report listing

## 🏢 Rental Management

### Rental Enquiries
**Pages**: `AdminRental.jsx`, `OfferSection.jsx`

**API Endpoints**:
- `GET /api/v1/rental` - Get all rental enquiries
- `GET /api/v1/rental/phone/:phone` - Get rentals by phone
- `GET /api/v1/rental/:id` - Get rental details
- `POST /api/v1/rental/create` - Create rental enquiry
- `PUT /api/v1/rental/update/:id` - Update rental
- `DELETE /api/v1/rental/delete/:id` - Delete rental

**Features**:
- Rental enquiry creation
- Rental listing
- Status management
- Phone-based lookup

### Rental Products
**Pages**: `RentalProductList.jsx`, `AddRentalProduct.jsx`

**API Endpoints**:
- `GET /api/v1/rental-product` - Get rental products
- `GET /api/v1/rental-products/getServiceProductsByCompany/:companyId` - Get products by company
- `POST /api/v1/rental-product/create` - Create rental product
- `PUT /api/v1/rental-product/update/:id` - Update rental product
- `DELETE /api/v1/rental-product/delete/:id` - Delete rental product

### Rental Invoices
**Pages**: `RentalInvoiceList.jsx`, `AddRentalInvoice.jsx`

**API Endpoints**:
- `GET /api/v1/rental-payment` - Get all rental invoices
- `GET /api/v1/rental-payment/:id` - Get invoice details
- `POST /api/v1/rental-payment/create-rental-entry` - Create rental invoice
- `PUT /api/v1/rental-payment/:id` - Update rental invoice
- `POST /api/v1/rental-payment/send` - Send invoice via email

**Features**:
- Rental invoice creation
- Multiple products per invoice
- Count image capture (A3/A4/A5)
- Payment tracking
- Invoice PDF generation
- Email sending
- Signed copy upload

## 📊 Reports

### Reports Dashboard
**Page**: `ReportsDashboard.jsx`

### Service Reports
**Pages**: 
- `ServiceEnquiriesReport.jsx`
- `ServiceInvoicesReport.jsx`
- `ServiceReportsReport.jsx`
- `ServiceReportsSummary.jsx`

**API Endpoints**:
- `GET /api/v1/service/all` - Service enquiries
- `POST /api/v1/service-invoice/all` - Service invoices/quotations
- `GET /api/v1/report/service` - Service reports

**Features**:
- Excel export
- Date range filtering
- Summary statistics
- Detailed reports

### Rental Reports
**Pages**: 
- `RentalInvoiceReport.jsx`
- `RentalReportsSummary.jsx`

**API Endpoints**:
- `GET /api/v1/rental-payment` - Rental invoices
- `GET /api/v1/rental` - Rental enquiries

### Sales Reports
**Page**: `SalesReportsSummary.jsx`

**API Endpoints**:
- `GET /api/v1/order/all` - All orders
- `GET /api/v1/product/all` - Product sales

### Company Reports
**Page**: `CompanyReports.jsx`

**API Endpoints**:
- `GET /api/v1/company` - Company data

## 🏪 Vendor Management

### Vendors
**Pages**: `VendorList.jsx`, `AddVendor.jsx`

**API Endpoints**:
- `GET /api/v1/vendor` - Get all vendors
- `GET /api/v1/vendor/:id` - Get vendor details
- `POST /api/v1/vendor/create` - Create vendor
- `PUT /api/v1/vendor/update/:id` - Update vendor
- `DELETE /api/v1/vendor/delete/:id` - Delete vendor

### Vendor Products
**Pages**: `VendorProductList.jsx`, `AddVendorProduct.jsx`

**API Endpoints**:
- `GET /api/v1/vendor-product` - Get vendor products
- `POST /api/v1/vendor-product/create` - Create vendor product
- `PUT /api/v1/vendor-product/update/:id` - Update vendor product
- `DELETE /api/v1/vendor-product/delete/:id` - Delete vendor product

## 🛒 Purchase Management

### Purchase Register
**Page**: `PurchaseRegister.jsx`

**API Endpoints**:
- `POST /api/v1/purchase/create` - Create purchase
- `GET /api/v1/purchase` - Get purchases

### Purchase List
**Page**: `PurchaseList.jsx`

**API Endpoints**:
- `GET /api/v1/purchase` - Get all purchases
- `GET /api/v1/purchase/:id` - Get purchase details

## ⚙️ Settings

### Company Settings
**Pages**: `CompanyList.jsx`, `AddCompany.jsx`

**API Endpoints**:
- `GET /api/v1/company` - Get all companies
- `GET /api/v1/company/:id` - Get company details
- `POST /api/v1/company/create` - Create company
- `PUT /api/v1/company/update/:id` - Update company

**Features**:
- Company CRUD
- Multiple delivery addresses
- Contact persons
- GST management

### GST Management
**Page**: `GST.jsx`

**API Endpoints**:
- `GET /api/v1/gst` - Get all GST entries
- `POST /api/v1/gst/create` - Create GST entry
- `PUT /api/v1/gst/update/:id` - Update GST entry
- `DELETE /api/v1/gst/delete/:id` - Delete GST entry

### Menu Settings
**Page**: `MenuSetting.jsx`

**API Endpoints**:
- Menu configuration based on user permissions

### Old Invoices
**Page**: `OldInvoicesList.jsx`

**API Endpoints**:
- `POST /api/v1/old-invoice/upload` - Upload Excel file
- `GET /api/v1/old-invoice/all` - Get all old invoices
- `GET /api/v1/old-invoice/get/:id` - Get invoice details
- `PUT /api/v1/old-invoice/update/:id` - Update invoice
- `DELETE /api/v1/old-invoice/delete/:id` - Delete invoice
- `GET /api/v1/old-invoice/by-remainder-date` - Get by remainder date

**Features**:
- Excel file upload
- Invoice listing
- Payment status update
- Remainder date management
- Email list tracking

## 📤 File Upload

**API Endpoint**:
- `POST /api/v1/auth/upload-file` - Upload files (images, PDFs)

**Features**:
- Image upload (profile, products, service images)
- PDF upload (signed invoices)
- Cloudflare R2 storage

## 🔍 Common API Patterns

### Base URL
- Environment variable: `VITE_SERVER_URL`
- Default: `https://nicknameinfo.net/corpculture`
- API prefix: `/api/v1`

### Authentication
- Token stored in: Cookies (`auth` cookie)
- Header format: `Authorization: <token>`
- Token refresh: Not implemented (manual re-login)

### Error Handling
- Toast notifications (react-toastify)
- Error messages from API responses
- Fallback error messages

### Data Formatting
- Dates: Day.js / Moment.js
- Excel: XLSX library
- File downloads: file-saver library

## 🎨 UI Components

### Header Components
- `Header.jsx` - Main navigation
- `Categories.jsx` - Category dropdown
- `SearchBar.jsx` - Product search

### Product Components
- `Product.jsx` - Product card
- `ProductPage.jsx` - Product details
- `ProductSection.jsx` - Product listing section
- `SideFilter.jsx` - Product filters

### Service Components
- `ServiceSection.jsx` - Service enquiry form
- `OfferSection.jsx` - Rental enquiry form

### Common Components
- `Spinner.jsx` - Loading spinner
- `Footer.jsx` - Footer
- `MinCategory.jsx` - Category display

## 📱 Responsive Design

- Tailwind CSS for styling
- Material-UI components
- Mobile-first approach
- Responsive breakpoints

## 🔒 Security Features

- JWT token authentication
- Role-based access control (RBAC)
- Protected routes
- Permission-based menu access
- Secure file uploads

## 📈 Performance Optimizations

- Code splitting (Vite)
- Lazy loading routes
- Image optimization
- Debounced search
- Cached API responses (Context API)

## 🧪 Development

### Environment Variables
- `VITE_SERVER_URL` - Backend API URL
- `VITE_API` - Alternative API URL

### Build Commands
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview build
- `npm run lint` - Lint code

### Key Dependencies
- React 18.2.0
- React Router DOM 6.14.2
- Axios 1.4.0
- Material-UI 5.14.6
- Tailwind CSS 3.3.3
- React Toastify 9.1.3

