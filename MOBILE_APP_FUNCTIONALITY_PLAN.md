# Mobile App Functionality Plan - Corpculture

## 📱 Overview

This document outlines the complete functionality plan for the Corpculture mobile application, covering all modules: Sales, Service, Rental, Vendors, and Settings.

---

## 📋 Table of Contents

1. [Sales Module](#sales-module)
2. [Admin/Employee Module](#adminemployee-module)
3. [Service Module](#service-module)
4. [Rental Module](#rental-module)
5. [Vendors Module](#vendors-module)
6. [Other Settings](#other-settings)
7. [Screen List](#screen-list)
8. [Navigation Structure](#navigation-structure)
9. [API Endpoints](#api-endpoints)

---

## 🛒 Sales Module

### 1. Home Page
**Screen:** `SalesHomeScreen.tsx`

**Features:**
- Dashboard overview
- Quick access to:
  - Create Rental Enquiry
  - Create Service Enquiry
  - Browse Products
  - View Orders
- Recent activity feed
- Notifications badge
- User profile quick access

**Components:**
- `QuickActionCard.tsx` - Action buttons
- `ActivityFeed.tsx` - Recent activities
- `NotificationBadge.tsx` - Notification indicator

---

### 2. Rental Enquiry Create
**Screen:** `CreateRentalEnquiryScreen.tsx`

**Form Fields:**
- Company selection (autocomplete)
- Contact person name
- Contact phone number
- Contact email
- Rental product selection
- Rental period (start date, end date)
- Delivery address
- Special requirements/notes
- Installation required (checkbox)
- Quotation send option (checkbox)

**Features:**
- Company autocomplete with search
- Product selection with details
- Date picker for rental period
- Address selection/input
- Form validation
- Save as draft
- Submit enquiry

**API:**
```
POST /api/v1/rental/create
```

---

### 3. Service Enquiry Create
**Screen:** `CreateServiceEnquiryScreen.tsx`

**Form Fields:**
- Company selection (autocomplete)
- Contact person name
- Contact phone number
- Contact email
- Service type selection
- Service description
- Priority level
- Preferred date/time
- Location/address
- Installation required (checkbox)
- Quotation send option (checkbox)

**Features:**
- Company autocomplete
- Service type dropdown
- Priority selector
- Date/time picker
- Location picker (map integration)
- Form validation
- Save as draft
- Submit enquiry
- **Call option** - Direct call to company contact

**API:**
```
POST /api/v1/service/create
```

---

### 4. Products Page
**Screen:** `ProductsScreen.tsx`

**Features:**
- Product grid/list view
- Search bar
- Category filter
- Price range filter
- Sort options (Price, Name, Popularity)
- Product cards with:
  - Product image
  - Product name
  - Price
  - Category
  - Quick add to cart button

**Components:**
- `ProductCard.tsx`
- `ProductFilter.tsx`
- `ProductSort.tsx`
- `SearchBar.tsx`

**API:**
```
GET /api/v1/product
GET /api/v1/product?category=xxx&minPrice=xxx&maxPrice=xxx
GET /api/v1/product/search?q=query
```

---

### 5. Product List with Filters
**Screen:** `ProductListScreen.tsx`

**Filters:**
- Category
- Price range (slider)
- Brand
- Availability
- Rating
- Sort by (Price Low-High, High-Low, Name A-Z, Popularity)

**Features:**
- Apply multiple filters
- Clear all filters
- Filter count badge
- Infinite scroll/pagination
- Pull to refresh

**Components:**
- `FilterModal.tsx`
- `FilterChip.tsx`
- `PriceRangeSlider.tsx`

---

### 6. Product Details Page
**Screen:** `ProductDetailScreen.tsx`

**Sections:**
- Product image gallery (swipeable)
- Product name
- Price
- Description
- Specifications
- Reviews/Ratings
- Related products
- Add to cart button
- Buy now button

**Features:**
- Image zoom
- Quantity selector
- Share product
- Add to wishlist
- View reviews
- Related products carousel

**Components:**
- `ProductImageGallery.tsx`
- `ProductSpecs.tsx`
- `ReviewSection.tsx`
- `RelatedProducts.tsx`

**API:**
```
GET /api/v1/product/:id
GET /api/v1/product/:id/reviews
GET /api/v1/product/related/:id
```

---

### 7. Cart Page
**Screen:** `CartScreen.tsx`

**Features:**
- List of cart items
- Quantity update (+/-)
- Remove item
- Save for later
- Apply coupon code
- Price breakdown:
  - Subtotal
  - Tax
  - Shipping
  - Discount
  - Total
- Proceed to checkout button
- Empty cart state

**Components:**
- `CartItem.tsx`
- `PriceSummary.tsx`
- `CouponInput.tsx`
- `EmptyCart.tsx`

**API:**
```
GET /api/v1/cart
PUT /api/v1/cart/update
DELETE /api/v1/cart/remove/:id
POST /api/v1/cart/apply-coupon
```

---

### 8. Company Create Form
**Screen:** `CreateCompanyScreen.tsx`

**Form Fields:**
- Company name *
- Company email *
- Phone number *
- GST number
- PAN number
- Address line 1 *
- Address line 2
- City *
- State *
- Pincode *
- Country
- Additional delivery addresses (multiple)
- Partner user indication (checkbox)

**Features:**
- Add multiple delivery addresses
- Each address with pincode
- Address validation
- GST validation
- Save company
- Edit existing company

**Components:**
- `AddressForm.tsx`
- `DeliveryAddressList.tsx`
- `AddAddressModal.tsx`

**API:**
```
POST /api/v1/company/create
PUT /api/v1/company/:id
GET /api/v1/company/:id
```

---

### 9. Add Mail ID to Existing Company
**Screen:** `AddCompanyEmailScreen.tsx` or part of `EditCompanyScreen.tsx`

**Features:**
- Select existing company
- Add email ID
- Add basic details:
  - Contact person name
  - Phone number
  - Designation
- Save updates

**API:**
```
PUT /api/v1/company/:id/add-email
PUT /api/v1/company/:id/update-details
```

---

### 10. Installation Required & Quotation Send Option
**Components:** Part of enquiry forms

**Features:**
- Checkbox: "Installation Required"
- Checkbox: "Send Quotation"
- If "Send Quotation" checked:
  - Show quotation preview
  - Select quotation template
  - Add quotation notes

---

### 11. Order Page
**Screen:** `OrderListScreen.tsx`

**Features:**
- List of all orders
- Filter by status (Pending, Processing, Shipped, Delivered, Cancelled)
- Search orders
- Order cards showing:
  - Order number
  - Order date
  - Product count
  - Total amount
  - Status badge
  - Track order button

**Components:**
- `OrderCard.tsx`
- `OrderStatusBadge.tsx`
- `OrderFilter.tsx`

**API:**
```
GET /api/v1/user/orders
GET /api/v1/user/orders?status=xxx
```

---

### 12. Product with Order Details
**Screen:** `OrderDetailScreen.tsx`

**Sections:**
- Order information:
  - Order number
  - Order date
  - Order status
  - Payment status
- Shipping address
- Products list:
  - Product image
  - Product name
  - Quantity
  - Price
  - Subtotal
- Price breakdown
- Order timeline
- Actions:
  - Track order
  - Cancel order
  - Reorder

**Components:**
- `OrderProductItem.tsx`
- `OrderTimeline.tsx`
- `OrderActions.tsx`

**API:**
```
GET /api/v1/user/orders/:id
PUT /api/v1/user/orders/:id/cancel
```

---

## 👨‍💼 Admin/Employee Module

### 13. Admin/Employee Login
**Screen:** `AdminLoginScreen.tsx`

**Features:**
- Email/Phone + Password login
- Remember me
- Forgot password
- Biometric login (Face ID/Fingerprint)
- Role detection (Admin/Employee)
- Auto-redirect based on role

**API:**
```
POST /api/v1/auth/login
POST /api/v1/auth/admin-login
```

---

### 14. Sales - Product Add/Edit/Delete
**Screen:** `ProductManagementScreen.tsx`, `AddEditProductScreen.tsx`

**Features:**
- Product list with search
- Add new product
- Edit existing product
- Delete product (with confirmation)
- Bulk delete
- Product form fields:
  - Product name *
  - Description
  - Category *
  - Price *
  - Discount price
  - Stock quantity
  - Product images (multiple)
  - Specifications
  - GST details
  - Status (Active/Inactive)

**Components:**
- `ProductForm.tsx`
- `ImageUploader.tsx`
- `SpecificationInput.tsx`

**API:**
```
GET /api/v1/product
POST /api/v1/product/new-product
PUT /api/v1/product/:id
DELETE /api/v1/product/:id
```

---

### 15. Order/Update Order Status
**Screen:** `OrderManagementScreen.tsx`, `OrderStatusUpdateScreen.tsx`

**Features:**
- View all orders
- Filter orders
- View order details
- Update order status:
  - Pending → Processing
  - Processing → Shipped
  - Shipped → Delivered
  - Any status → Cancelled
- Add status notes
- Send status notification to customer
- Order assignment to employee

**Components:**
- `OrderStatusSelector.tsx`
- `StatusUpdateModal.tsx`
- `OrderNotesInput.tsx`

**API:**
```
GET /api/v1/order/all
GET /api/v1/order/:id
PUT /api/v1/order/:id/status
PUT /api/v1/order/:id/assign
```

---

### 16. Commission
**Screen:** `CommissionScreen.tsx`, `CommissionDetailScreen.tsx`

**Features:**
- View commission list
- Filter by employee
- Filter by date range
- Commission details:
  - Employee name
  - Order/Service details
  - Commission amount
  - Commission percentage
  - Status (Pending/Paid)
  - Payment date
- Export commission report

**API:**
```
GET /api/v1/commission
GET /api/v1/commission/employee/:id
GET /api/v1/commission/report
```

---

### 17. Automatic Assignment of Orders
**Screen:** `OrderAssignmentScreen.tsx` (Admin only)

**Features:**
- **Automatic Assignment:**
  - Based on pincode
  - Auto-assign to nearest employee
  - Show assignment suggestions
- **Manual Selection:**
  - Select employee from list
  - View employee availability
  - View employee workload
  - Assign order
- Assignment history
- Reassign option

**Components:**
- `AutoAssignmentModal.tsx`
- `EmployeeSelector.tsx`
- `AssignmentHistory.tsx`

**API:**
```
POST /api/v1/order/:id/auto-assign
POST /api/v1/order/:id/assign
GET /api/v1/employee/available?pincode=xxx
```

---

## 🔧 Service Module

### 18. Enquiries

#### 18.1 New Service Enquiry
**Screen:** `NewServiceEnquiryScreen.tsx`

**Features:**
- Create new service enquiry
- Company selection
- Service details
- Priority selection
- Assignment option
- Save and submit

**API:**
```
POST /api/v1/service/create
```

#### 18.2 Assigned Request
**Screen:** `AssignedServiceRequestsScreen.tsx`

**Features:**
- List of assigned service requests
- Filter by status
- Search requests
- View request details
- Update status
- Add notes
- Upload service images
- **Call option** - Direct call to customer

**Components:**
- `ServiceRequestCard.tsx`
- `CallButton.tsx`
- `StatusUpdateButton.tsx`

**API:**
```
GET /api/v1/service/assignedTo/:employeeId
PUT /api/v1/service/:id/status
```

---

### 19. Product - Add Product Based on Company
**Screen:** `AddServiceProductScreen.tsx`

**Features:**
- Select company
- Add product details:
  - Product name
  - Serial number
  - Model number
  - Installation date
  - Warranty details
  - Service history
- Link product to company
- Save product

**API:**
```
POST /api/v1/service-product/create
GET /api/v1/service-product/company/:companyId
```

---

### 20. Invoice

#### 20.1 Add/Edit Invoice Based on Company and Multiple Products
**Screen:** `ServiceInvoiceFormScreen.tsx`

**Features:**
- Select company (autocomplete)
- Add multiple products
- For each product:
  - Product selection
  - Quantity
  - Unit price
  - Tax
  - Total
- Invoice details:
  - Invoice number (auto-generated)
  - Invoice date
  - Due date
  - Payment terms
  - Notes
- Grand total calculation
- Save invoice
- Edit existing invoice

**Components:**
- `InvoiceProductList.tsx`
- `ProductSelector.tsx`
- `InvoiceSummary.tsx`

**API:**
```
POST /api/v1/service-invoice/create
PUT /api/v1/service-invoice/:id
GET /api/v1/service-invoice/:id
```

#### 20.2 Send Invoice
**Screen:** Part of `ServiceInvoiceDetailScreen.tsx`

**Features:**
- Send invoice via email
- Send invoice via SMS
- Send invoice via WhatsApp
- Preview invoice before sending
- **Send with OTP** - OTP verification before sending
- Send reminder option

**Components:**
- `SendInvoiceModal.tsx`
- `OTPVerificationModal.tsx`

**API:**
```
POST /api/v1/service-invoice/:id/send
POST /api/v1/service-invoice/:id/send-with-otp
```

#### 20.3 Update Payment Details
**Screen:** `UpdatePaymentScreen.tsx`

**Features:**
- Select invoice
- Payment method selection
- Payment amount
- Payment date
- Transaction ID
- Payment notes
- Receipt upload
- Update payment status
- Partial payment support

**API:**
```
PUT /api/v1/service-invoice/:id/payment
POST /api/v1/service-invoice/:id/payment-entry
```

#### 20.4 Upload Signed Copy
**Screen:** Part of `ServiceInvoiceDetailScreen.tsx`

**Features:**
- Upload signed invoice copy
- Image picker or camera
- Preview signed copy
- Delete signed copy option
- View signed copy
- Multiple signed copies support

**Components:**
- `SignedCopyUploader.tsx`
- `SignedCopyViewer.tsx`

**API:**
```
POST /api/v1/service-invoice/:id/upload-signed
DELETE /api/v1/service-invoice/:id/signed-copy/:fileId
```

#### 20.5 Delete Signed Copy
**Feature:** Part of signed copy management

**Features:**
- Delete uploaded signed copy
- Confirmation dialog
- Update invoice status

**API:**
```
DELETE /api/v1/service-invoice/:id/signed-copy/:fileId
```

#### 20.6 Send Invoice Based on Reminder (Pending Invoices Only)
**Screen:** `PendingInvoicesScreen.tsx`

**Features:**
- List of pending invoices
- Filter by due date
- Send reminder to pending invoices
- Bulk send reminders
- Reminder history
- **OTP verification** for sending

**API:**
```
GET /api/v1/service-invoice/pending
POST /api/v1/service-invoice/send-reminder
POST /api/v1/service-invoice/bulk-send-reminder
```

#### 20.7 Automatic Invoice Number Generation
**Feature:** Backend + Frontend display

**Format:** `SINV-YYYY-MM-XXXXX`
- SINV = Service Invoice prefix
- YYYY = Year
- MM = Month
- XXXXX = Sequential number

**Implementation:**
- Auto-generate on invoice creation
- Display in invoice form
- Show in invoice list

---

### 21. Quotation - Add/Edit Quotation Based on Company and Multiple Products
**Screen:** `ServiceQuotationFormScreen.tsx`

**Features:**
- Select company
- Add multiple products
- Quotation details:
  - Quotation number (auto-generated)
  - Valid until date
  - Terms and conditions
  - Notes
- Product pricing
- Total calculation
- Save quotation
- Edit quotation
- Convert quotation to invoice
- Send quotation

**API:**
```
POST /api/v1/service-quotation/create
PUT /api/v1/service-quotation/:id
GET /api/v1/service-quotation/:id
POST /api/v1/service-quotation/:id/convert-to-invoice
POST /api/v1/service-quotation/:id/send
```

---

### 22. Reports

#### 22.1 Add/Edit Reports
**Screen:** `ServiceReportsScreen.tsx`, `AddEditReportScreen.tsx`

**Features:**
- Create new report
- Report types:
  - Service completion report
  - Revenue report
  - Employee performance report
  - Customer report
- Report parameters:
  - Date range
  - Employee filter
  - Status filter
- Generate report
- Edit report
- Export report (PDF, Excel)
- Share report

**API:**
```
POST /api/v1/report/create
PUT /api/v1/report/:id
GET /api/v1/report/:id
GET /api/v1/report/generate
```

#### 22.2 Add Multiple Group Materials
**Screen:** Part of report creation

**Features:**
- Add material groups
- Each group contains multiple materials
- Material details:
  - Material name
  - Quantity
  - Unit
  - Cost
- Group materials by category
- Save material groups

**Components:**
- `MaterialGroupForm.tsx`
- `MaterialList.tsx`

**API:**
```
POST /api/v1/report/:id/materials
PUT /api/v1/report/:id/materials/:groupId
```

#### 22.3 Commission Details
**Screen:** `ServiceCommissionScreen.tsx`

**Features:**
- View service commission details
- Filter by employee
- Filter by date
- Commission breakdown
- Export commission report

**API:**
```
GET /api/v1/commission/service
GET /api/v1/commission/service/employee/:id
```

#### 22.4 Invoice Based on Commission
**Screen:** `CommissionInvoiceScreen.tsx`

**Features:**
- Generate commission invoice
- Select employee
- Select commission period
- Calculate commission amount
- Create invoice
- Send commission invoice

**API:**
```
POST /api/v1/commission/invoice
GET /api/v1/commission/invoice/:id
```

---

## 🏢 Rental Module

### 23. Enquiries

#### 23.1 New Service Enquiry
**Screen:** `NewRentalEnquiryScreen.tsx`

**Features:**
- Create rental enquiry
- Company selection
- Rental product selection
- Rental period
- Delivery details
- Save and submit

**API:**
```
POST /api/v1/rental/create
```

#### 23.2 Assigned Request
**Screen:** `AssignedRentalRequestsScreen.tsx`

**Features:**
- List of assigned rental requests
- Filter by status
- Update status
- Add notes
- View request details

**API:**
```
GET /api/v1/rental/assignedTo/:employeeId
PUT /api/v1/rental/:id/status
```

---

### 24. Product - Add Product Based on Company
**Screen:** `AddRentalProductScreen.tsx`

**Features:**
- Select company
- Add rental product:
  - Product/machine selection
  - Serial number
  - Rental rate
  - Rental period
  - Delivery address
- Link to company
- Save product

**API:**
```
POST /api/v1/rental-product/create
GET /api/v1/rental-product/company/:companyId
```

---

### 25. Invoice

#### 25.1 Add/Edit Invoice Based on Company and Multiple Products
**Screen:** `RentalInvoiceFormScreen.tsx`

**Features:**
- Select company
- Add multiple products
- For each product:
  - Product/machine selection
  - Serial number
  - A3/A4/A5 count configuration
  - Old count → New count
  - Count image upload (camera)
  - Product total calculation
- Invoice details:
  - Invoice number (auto-generated)
  - Invoice date
  - Payment date
  - Contact person
  - Notes
- Grand total
- Save invoice
- Edit invoice

**Components:**
- `RentalProductForm.tsx`
- `CountConfigForm.tsx`
- `CountImageCapture.tsx`

**API:**
```
POST /api/v1/rental-payment/create-rental-entry
PUT /api/v1/rental-payment/:id
GET /api/v1/rental-payment/:id
```

#### 25.2 Send Invoice
**Screen:** Part of `RentalInvoiceDetailScreen.tsx`

**Features:**
- Send invoice via email/SMS/WhatsApp
- **Send with OTP** verification
- Preview invoice
- Send reminder

**API:**
```
POST /api/v1/rental-payment/:id/send
POST /api/v1/rental-payment/:id/send-with-otp
```

#### 25.3 Update Payment Details
**Screen:** `UpdateRentalPaymentScreen.tsx`

**Features:**
- Select rental invoice
- Payment method
- Payment amount
- Payment date
- Transaction details
- Update payment status

**API:**
```
PUT /api/v1/rental-payment/:id/payment
POST /api/v1/rental-payment/:id/payment-entry
```

#### 25.4 Upload Signed Copy
**Screen:** Part of `RentalInvoiceDetailScreen.tsx`

**Features:**
- Upload signed invoice copy
- Camera or gallery
- Preview signed copy
- Delete signed copy

**API:**
```
POST /api/v1/rental-payment/:id/upload-signed
DELETE /api/v1/rental-payment/:id/signed-copy/:fileId
```

#### 25.5 Delete Signed Copy
**Feature:** Part of signed copy management

**API:**
```
DELETE /api/v1/rental-payment/:id/signed-copy/:fileId
```

#### 25.6 Send Invoice Based on Reminder (Pending Invoices Only)
**Screen:** `PendingRentalInvoicesScreen.tsx`

**Features:**
- List pending rental invoices
- Filter by payment date
- Send reminder
- Bulk send
- **OTP verification**

**API:**
```
GET /api/v1/rental-payment/pending
POST /api/v1/rental-payment/send-reminder
```

#### 25.7 Automatic Invoice Number Generation
**Format:** `RINV-YYYY-MM-XXXXX`
- RINV = Rental Invoice prefix
- Auto-generate on creation

#### 25.8 Create Enquiry Based on Payment Date in Product
**Screen:** `CreateRentalEnquiryFromPaymentScreen.tsx`

**Features:**
- View rental products with payment dates
- Select product
- Create enquiry based on payment date
- Auto-fill product and company details
- Create enquiry

**API:**
```
GET /api/v1/rental-product/payment-due
POST /api/v1/rental/create-from-payment
```

---

### 26. Quotation - Add/Edit Quotation Based on Company and Multiple Products
**Screen:** `RentalQuotationFormScreen.tsx`

**Features:**
- Select company
- Add multiple rental products
- Quotation details
- Pricing
- Convert to invoice
- Send quotation

**API:**
```
POST /api/v1/rental-quotation/create
PUT /api/v1/rental-quotation/:id
POST /api/v1/rental-quotation/:id/convert-to-invoice
```

---

### 27. Reports

#### 27.1 Add/Edit Reports
**Screen:** `RentalReportsScreen.tsx`

**Features:**
- Create rental reports
- Report types
- Generate reports
- Export reports

**API:**
```
POST /api/v1/report/rental/create
GET /api/v1/report/rental/generate
```

#### 27.2 Add Multiple Group Materials
**Feature:** Same as Service Reports

#### 27.3 Commission Details
**Screen:** `RentalCommissionScreen.tsx`

**Features:**
- View rental commission
- Filter by employee
- Commission breakdown

**API:**
```
GET /api/v1/commission/rental
```

#### 27.4 Invoice Based on Commission
**Screen:** `RentalCommissionInvoiceScreen.tsx`

**Features:**
- Generate rental commission invoice
- Employee selection
- Commission calculation
- Create invoice

**API:**
```
POST /api/v1/commission/rental/invoice
```

---

## 🏪 Vendors Module

### 28. Vendors List
**Screen:** `VendorsListScreen.tsx`

**Features:**
- List all vendors
- Search vendors
- Filter vendors
- Vendor cards showing:
  - Vendor name
  - Contact info
  - Product count
  - Status
- View vendor details
- Add/Edit/Delete vendor

**Components:**
- `VendorCard.tsx`
- `VendorFilter.tsx`

**API:**
```
GET /api/v1/vendor
GET /api/v1/vendor/search?q=query
```

---

### 29. Add/Edit/Delete Vendor
**Screen:** `AddEditVendorScreen.tsx`

**Form Fields:**
- Vendor name *
- Contact person
- Email
- Phone number
- Address
- GST number
- PAN number
- Bank details
- Status (Active/Inactive)

**Features:**
- Add new vendor
- Edit existing vendor
- Delete vendor (with confirmation)
- Form validation

**API:**
```
POST /api/v1/vendor/create
PUT /api/v1/vendor/:id
DELETE /api/v1/vendor/:id
```

---

### 30. Vendor Products - Add Products Based on Vendor
**Screen:** `AddVendorProductScreen.tsx`

**Features:**
- Select vendor
- Add product details:
  - Product name
  - Product code
  - Price
  - Stock quantity
  - Description
  - Images
- Link product to vendor
- Save product

**API:**
```
POST /api/v1/vendor-product/create
GET /api/v1/vendor-product/vendor/:vendorId
```

---

### 31. Material List
**Screen:** `MaterialListScreen.tsx`

**Features:**
- List all materials
- Search materials
- Filter by category
- Material details:
  - Material name
  - Category
  - Unit
  - Current stock
  - Reorder level
- Add/Edit/Delete material

**API:**
```
GET /api/v1/material
POST /api/v1/material/create
PUT /api/v1/material/:id
DELETE /api/v1/material/:id
```

---

### 32. Add/Edit/Delete Material
**Screen:** `AddEditMaterialScreen.tsx`

**Form Fields:**
- Material name *
- Category *
- Unit (kg, liter, piece, etc.) *
- Current stock
- Reorder level
- Cost per unit
- Supplier details
- Description

**Features:**
- Add material
- Edit material
- Delete material
- Stock tracking

**API:**
```
POST /api/v1/material/create
PUT /api/v1/material/:id
DELETE /api/v1/material/:id
```

---

### 33. Material Needed for Group
**Screen:** `MaterialGroupScreen.tsx`

**Features:**
- Create material groups
- Add materials to group
- Set quantity per material
- Group materials by:
  - Service type
  - Product type
  - Custom category
- Save material groups

**Components:**
- `MaterialGroupForm.tsx`
- `MaterialSelector.tsx`

**API:**
```
POST /api/v1/material/group/create
PUT /api/v1/material/group/:id
GET /api/v1/material/group
```

---

### 34. Material Quantity Reduction Based on Service Product Usage
**Feature:** Automatic stock management

**Implementation:**
- When service is completed
- Check service product materials
- Reduce material stock automatically
- Show stock alerts if low
- Update material history

**API:**
```
POST /api/v1/service/:id/complete (triggers material reduction)
GET /api/v1/material/stock-alerts
```

---

## ⚙️ Other Settings

### 35. Company Add/Edit with Multiple Delivery Addresses and Pincode
**Screen:** `CompanySettingsScreen.tsx`, `AddEditCompanyScreen.tsx`

**Features:**
- Company basic details
- Multiple delivery addresses:
  - Address line 1, 2
  - City, State
  - Pincode *
  - Contact person
  - Phone number
- Add/Edit/Delete addresses
- Set default address
- Pincode validation
- Address autocomplete

**Components:**
- `CompanyForm.tsx`
- `DeliveryAddressForm.tsx`
- `AddressList.tsx`

**API:**
```
POST /api/v1/company/create
PUT /api/v1/company/:id
PUT /api/v1/company/:id/address
DELETE /api/v1/company/:id/address/:addressId
```

---

### 36. Partner User Indication
**Feature:** Part of company/user management

**Features:**
- Show partner user badge
- Filter by partner users
- Partner user privileges
- Partner user indicator in UI

**Implementation:**
- Add `isPartner` field to user/company
- Display partner badge
- Special pricing/access for partners

---

### 37. Add/Edit/Delete GST
**Screen:** `GSTSettingsScreen.tsx`, `AddEditGSTScreen.tsx`

**Form Fields:**
- GST number *
- GST type (CGST+SGST / IGST) *
- Tax percentage *
- Description
- Status (Active/Inactive)

**Features:**
- Add GST details
- Edit GST
- Delete GST
- GST validation
- Apply GST to products/invoices

**API:**
```
GET /api/v1/gst
POST /api/v1/gst/create
PUT /api/v1/gst/:id
DELETE /api/v1/gst/:id
```

---

### 38. Menu Settings Based on User
**Screen:** `MenuSettingsScreen.tsx` (Admin only)

**Features:**
- Configure menu items per role
- Enable/disable features:
  - Sales module
  - Service module
  - Rental module
  - Vendor module
  - Reports
  - Settings
- Custom menu order
- Save menu configuration

**API:**
```
GET /api/v1/permission/menu
PUT /api/v1/permission/menu
GET /api/v1/permission/menu/:role
```

---

### 39. Category Add/Edit/Delete
**Screen:** `CategoryManagementScreen.tsx`, `AddEditCategoryScreen.tsx`

**Form Fields:**
- Category name *
- Category description
- Parent category (for subcategories)
- Category image
- Status (Active/Inactive)

**Features:**
- Add category
- Edit category
- Delete category
- Category hierarchy
- Category image upload

**API:**
```
GET /api/v1/category
POST /api/v1/category/create
PUT /api/v1/category/:id
DELETE /api/v1/category/:id
```

---

### 40. Send Mail Selection from Admin
**Screen:** `MailSettingsScreen.tsx` (Admin only)

**Features:**
- Configure email settings
- Select which emails to send:
  - Order confirmation
  - Invoice emails
  - Quotation emails
  - Reminder emails
  - Status updates
- Email templates
- Test email sending

**API:**
```
GET /api/v1/settings/mail
PUT /api/v1/settings/mail
POST /api/v1/settings/mail/test
```

---

### 41. Notification of Employee and Admin (Enquiries and Orders)
**Feature:** Push notifications

**Notification Types:**
- New enquiry assigned
- Order status update
- Payment received
- Invoice reminder
- Service completion
- Commission update

**Implementation:**
- Firebase Cloud Messaging (FCM)
- Local notifications
- Notification settings per user
- Notification history

**Components:**
- `NotificationCenter.tsx`
- `NotificationSettings.tsx`

**API:**
```
POST /api/v1/notification/send
GET /api/v1/notification/user/:userId
PUT /api/v1/notification/settings
```

---

### 42. Service Enquiries Call Option
**Feature:** Direct calling from app

**Implementation:**
- Call button on service enquiry cards
- Direct call to customer phone
- Call history
- Call notes

**Components:**
- `CallButton.tsx`
- `CallHistory.tsx`

**Native Module:**
```typescript
import { Linking } from 'react-native';

const makeCall = (phoneNumber: string) => {
  Linking.openURL(`tel:${phoneNumber}`);
};
```

---

## 📱 Screen List Summary

### Sales Module (12 screens)
1. SalesHomeScreen
2. CreateRentalEnquiryScreen
3. CreateServiceEnquiryScreen
4. ProductsScreen
5. ProductListScreen
6. ProductDetailScreen
7. CartScreen
8. CreateCompanyScreen
9. AddCompanyEmailScreen
10. OrderListScreen
11. OrderDetailScreen
12. CheckoutScreen

### Admin/Employee Module (6 screens)
13. AdminLoginScreen
14. ProductManagementScreen
15. AddEditProductScreen
16. OrderManagementScreen
17. OrderStatusUpdateScreen
18. CommissionScreen
19. OrderAssignmentScreen

### Service Module (15 screens)
20. NewServiceEnquiryScreen
21. AssignedServiceRequestsScreen
22. AddServiceProductScreen
23. ServiceInvoiceFormScreen
24. ServiceInvoiceDetailScreen
25. UpdatePaymentScreen
26. PendingInvoicesScreen
27. ServiceQuotationFormScreen
28. ServiceReportsScreen
29. AddEditReportScreen
30. ServiceCommissionScreen
31. CommissionInvoiceScreen

### Rental Module (15 screens)
32. NewRentalEnquiryScreen
33. AssignedRentalRequestsScreen
34. AddRentalProductScreen
35. RentalInvoiceFormScreen
36. RentalInvoiceDetailScreen
37. UpdateRentalPaymentScreen
38. PendingRentalInvoicesScreen
39. CreateRentalEnquiryFromPaymentScreen
40. RentalQuotationFormScreen
41. RentalReportsScreen
42. RentalCommissionScreen
43. RentalCommissionInvoiceScreen

### Vendors Module (5 screens)
44. VendorsListScreen
45. AddEditVendorScreen
46. AddVendorProductScreen
47. MaterialListScreen
48. AddEditMaterialScreen
49. MaterialGroupScreen

### Settings Module (8 screens)
50. CompanySettingsScreen
51. AddEditCompanyScreen
52. GSTSettingsScreen
53. AddEditGSTScreen
54. MenuSettingsScreen
55. CategoryManagementScreen
56. AddEditCategoryScreen
57. MailSettingsScreen
58. NotificationSettingsScreen

### Common Screens (3 screens)
59. ProfileScreen
60. SettingsScreen
61. NotificationCenterScreen

**Total: 61 screens**

---

## 🧭 Navigation Structure

### Sales User Navigation (Bottom Tabs)
```
SalesHomeScreen (Home)
├── ProductsScreen
│   ├── ProductListScreen
│   └── ProductDetailScreen
├── CartScreen
│   └── CheckoutScreen
├── OrderListScreen
│   └── OrderDetailScreen
└── ProfileScreen
```

### Employee Navigation (Drawer)
```
EmployeeDashboardScreen
├── AssignedServiceRequestsScreen
│   └── ServiceDetailScreen
├── AssignedRentalRequestsScreen
│   └── RentalDetailScreen
├── ServiceInvoiceFormScreen
├── RentalInvoiceFormScreen
└── ProfileScreen
```

### Admin Navigation (Drawer)
```
AdminDashboardScreen
├── Sales Management
│   ├── ProductManagementScreen
│   ├── OrderManagementScreen
│   └── CommissionScreen
├── Service Management
│   ├── ServiceEnquiriesScreen
│   ├── ServiceInvoiceFormScreen
│   ├── ServiceQuotationFormScreen
│   └── ServiceReportsScreen
├── Rental Management
│   ├── RentalEnquiriesScreen
│   ├── RentalInvoiceFormScreen
│   ├── RentalQuotationFormScreen
│   └── RentalReportsScreen
├── Vendors
│   ├── VendorsListScreen
│   └── MaterialListScreen
└── Settings
    ├── CompanySettingsScreen
    ├── GSTSettingsScreen
    ├── CategoryManagementScreen
    ├── MenuSettingsScreen
    └── MailSettingsScreen
```

---

## 🌐 API Endpoints Summary

### Authentication
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/admin-login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/forgot-password`

### Products
- `GET /api/v1/product`
- `GET /api/v1/product/:id`
- `POST /api/v1/product/new-product`
- `PUT /api/v1/product/:id`
- `DELETE /api/v1/product/:id`
- `GET /api/v1/product/search?q=query`

### Orders
- `GET /api/v1/user/orders`
- `GET /api/v1/user/orders/:id`
- `GET /api/v1/order/all` (Admin)
- `PUT /api/v1/order/:id/status`
- `POST /api/v1/order/:id/assign`

### Service
- `POST /api/v1/service/create`
- `GET /api/v1/service/all`
- `GET /api/v1/service/assignedTo/:id`
- `GET /api/v1/service/:id`
- `PUT /api/v1/service/:id`
- `PUT /api/v1/service/:id/status`

### Service Invoice
- `POST /api/v1/service-invoice/create`
- `GET /api/v1/service-invoice`
- `GET /api/v1/service-invoice/:id`
- `PUT /api/v1/service-invoice/:id`
- `POST /api/v1/service-invoice/:id/send`
- `POST /api/v1/service-invoice/:id/send-with-otp`
- `PUT /api/v1/service-invoice/:id/payment`
- `POST /api/v1/service-invoice/:id/upload-signed`
- `DELETE /api/v1/service-invoice/:id/signed-copy/:fileId`
- `GET /api/v1/service-invoice/pending`
- `POST /api/v1/service-invoice/send-reminder`

### Service Quotation
- `POST /api/v1/service-quotation/create`
- `GET /api/v1/service-quotation/:id`
- `PUT /api/v1/service-quotation/:id`
- `POST /api/v1/service-quotation/:id/convert-to-invoice`
- `POST /api/v1/service-quotation/:id/send`

### Rental
- `POST /api/v1/rental/create`
- `GET /api/v1/rental`
- `GET /api/v1/rental/assignedTo/:id`
- `PUT /api/v1/rental/:id/status`

### Rental Invoice
- `POST /api/v1/rental-payment/create-rental-entry`
- `GET /api/v1/rental-payment`
- `GET /api/v1/rental-payment/:id`
- `PUT /api/v1/rental-payment/:id`
- `POST /api/v1/rental-payment/:id/send`
- `POST /api/v1/rental-payment/:id/send-with-otp`
- `PUT /api/v1/rental-payment/:id/payment`
- `POST /api/v1/rental-payment/:id/upload-signed`
- `DELETE /api/v1/rental-payment/:id/signed-copy/:fileId`
- `GET /api/v1/rental-payment/pending`
- `POST /api/v1/rental-payment/send-reminder`

### Rental Quotation
- `POST /api/v1/rental-quotation/create`
- `GET /api/v1/rental-quotation/:id`
- `PUT /api/v1/rental-quotation/:id`
- `POST /api/v1/rental-quotation/:id/convert-to-invoice`

### Company
- `GET /api/v1/company`
- `GET /api/v1/company/:id`
- `POST /api/v1/company/create`
- `PUT /api/v1/company/:id`
- `PUT /api/v1/company/:id/add-email`
- `PUT /api/v1/company/:id/address`
- `DELETE /api/v1/company/:id/address/:addressId`

### Vendors
- `GET /api/v1/vendor`
- `POST /api/v1/vendor/create`
- `PUT /api/v1/vendor/:id`
- `DELETE /api/v1/vendor/:id`

### Vendor Products
- `GET /api/v1/vendor-product/vendor/:vendorId`
- `POST /api/v1/vendor-product/create`
- `PUT /api/v1/vendor-product/:id`

### Materials
- `GET /api/v1/material`
- `POST /api/v1/material/create`
- `PUT /api/v1/material/:id`
- `DELETE /api/v1/material/:id`
- `POST /api/v1/material/group/create`

### Category
- `GET /api/v1/category`
- `POST /api/v1/category/create`
- `PUT /api/v1/category/:id`
- `DELETE /api/v1/category/:id`

### GST
- `GET /api/v1/gst`
- `POST /api/v1/gst/create`
- `PUT /api/v1/gst/:id`
- `DELETE /api/v1/gst/:id`

### Commission
- `GET /api/v1/commission`
- `GET /api/v1/commission/service`
- `GET /api/v1/commission/rental`
- `GET /api/v1/commission/employee/:id`
- `POST /api/v1/commission/invoice`

### Reports
- `POST /api/v1/report/create`
- `GET /api/v1/report/:id`
- `GET /api/v1/report/generate`
- `POST /api/v1/report/rental/create`

### Settings
- `GET /api/v1/permission/menu`
- `PUT /api/v1/permission/menu`
- `GET /api/v1/settings/mail`
- `PUT /api/v1/settings/mail`

### Notifications
- `POST /api/v1/notification/send`
- `GET /api/v1/notification/user/:userId`
- `PUT /api/v1/notification/settings`

---

## 🎯 Key Features Summary

### Must-Have Features
✅ Role-based access control  
✅ Multi-product invoice/quotation support  
✅ Automatic invoice number generation  
✅ OTP verification for sending invoices  
✅ Camera integration for count images  
✅ Multiple delivery addresses per company  
✅ Material stock management  
✅ Commission tracking  
✅ Push notifications  
✅ Direct call functionality  
✅ Pending invoice reminders  
✅ Signed copy upload/delete  

### Advanced Features
✅ Automatic order assignment by pincode  
✅ Material quantity auto-reduction  
✅ Partner user indication  
✅ Menu customization per role  
✅ Email configuration from admin  
✅ Enquiry creation from payment dates  
✅ Bulk operations  
✅ Report generation and export  

---

## 📝 Implementation Notes

1. **Invoice Number Format:**
   - Service: `SINV-YYYY-MM-XXXXX`
   - Rental: `RINV-YYYY-MM-XXXXX`
   - Auto-increment per month

2. **OTP Verification:**
   - Generate 6-digit OTP
   - Send to admin/employee phone
   - Verify before sending invoice
   - OTP valid for 5 minutes

3. **Camera Integration:**
   - Use `react-native-image-picker`
   - Support camera and gallery
   - Image compression before upload
   - Multiple images per product

4. **Offline Support:**
   - Cache data locally
   - Queue API calls when offline
   - Sync when online

5. **Push Notifications:**
   - Firebase Cloud Messaging
   - Local notifications for reminders
   - Notification center

6. **Form Validation:**
   - Client-side validation
   - Server-side validation
   - Error messages

7. **Image Upload:**
   - Use FormData
   - Multipart/form-data
   - Progress indicator
   - Retry on failure

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-01-23  
**Status:** Complete Functionality Plan

