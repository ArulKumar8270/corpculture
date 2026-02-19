# Changes / Features in Client Not Implemented in Mobile App

This document lists what exists in the **client** (web) that is **not implemented** or **not fully implemented** in the **mobile-app**, based on a comparison of both codebases.

---

## 1. Pages / Screens Missing in Mobile

### User / Customer (Profile & Dashboard)
| Client | Mobile | Notes |
|--------|--------|--------|
| **PaymentCards** (`/user/dashboard/payment-cards`) | ❌ | No PaymentCardsScreen. IMPLEMENTATION_STATUS.md already lists this. |
| **Reviews** (`/user/dashboard/user-review`) | ❌ | No dedicated user reviews page. |
| **Activity Log** (user dashboard: `/user/dashboard/activity-log`) | ❌ | `EmployeeActivityLogForm` not in customer flow in mobile. |
| **Save for Later (dedicated section)** | Partial | Client has full SaveForLater section in Cart; mobile has `handleSaveForLater` in CartScreen but no dedicated “Saved for Later” list/section like client. |

### Admin – Settings
| Client | Mobile | Notes |
|--------|--------|--------|
| **Settings** (Global Settings screen) | ❌ | Client has `Settings.jsx`: **Global Invoice Format**, **From Mail** (select/custom), separate “Save Format” button. Mobile **SettingsScreen** is only a menu (Company, GST, Menu Settings, Old Invoices); there is **no dedicated screen** for Global Invoice Format and From Mail. |

### Admin – Reports (routes / report types)
| Client Route | Mobile | Notes |
|--------------|--------|--------|
| `serviceInvoicesReport/:companyId?` (type invoice) | ✅ | Exists as ServiceInvoicesReportScreen. |
| `serviceQuotationsReport/:companyId?` (type quotation) | ⚠️ | Single ServiceInvoicesReportScreen; client has separate route for quotations report. Verify mobile supports type=quotation. |
| `serviceReportsReport/:companyId?` (type service) | ✅ | ServiceReportsReportScreen. |
| `serviceEnquiriesReport/:companyId?` (type service) | ✅ | ServiceEnquiriesReportScreen. |
| `rentalEnquiriesReport/:companyId?` (type rental) | ⚠️ | Client has this; confirm mobile ServiceEnquiriesReport supports type=rental and companyId. |
| `rantalInvoicesReport/:companyId?` (typo: rantal) (type invoice) | ✅ | RentalInvoiceReportScreen. |
| `rentalQuotationsReport/:companyId?` (type quotation) | ⚠️ | Confirm RentalInvoiceReportScreen supports type=quotation and companyId. |
| `rentalReportsReport/:companyId?` (type rental) | ⚠️ | Confirm ServiceReportsReportScreen supports type=rental and companyId. |

### Admin – Employee / HR
| Client | Mobile | Notes |
|--------|--------|--------|
| **EmployeeActivityLogForm** (admin: `/admin/dashboard/activity-log`) | ❌ | Not present in admin section in mobile. |
| **ActivityLogReport** (`/admin/dashboard/activityLogReport`) | ❌ | No Activity Log Report screen. |
| **EmployeeLeaveForm** (`/admin/dashboard/leave-application`) | ❌ | No Leave Application screen. |
| **LeaveReport** (`/admin/dashboard/leaveReport`) | ❌ | No Leave Report screen. |

### Other Client-Only
| Client | Mobile | Notes |
|--------|--------|--------|
| **DeleteAllOrder** (`/all-order/delete`) | ❌ | No equivalent. |
| **ComingSoon** | ❌ | Not needed for parity. |
| **SEO (SeoData)** | N/A | Web-only. |

---

## 2. Features / Behavior Not Fully Implemented in Mobile

### Service Enquiries (AdminServices vs ServiceEnquiriesScreen)
| Feature | Client (AdminServices.jsx) | Mobile (ServiceEnquiriesScreen) |
|---------|----------------------------|----------------------------------|
| Tabs | **new**, **assigned**, **invoiced**, **quotation**, **report**, **w_u**, **pending**, **inProgress**, **completed** | Only **new**, **assigned** (and tabCounts for those two). |
| Service title filter | ✅ Dropdown filter by `serviceTitle` | ❌ No service title filter. |
| Pagination | ✅ `page`, `rowsPerPage`, TablePagination | ❌ No pagination. |
| Tab counts | Full counts for all 9 tabs | Only new + assigned counts. |
| Move to “Unwanted” / status workflow | Yes (w_u tab, etc.) | Not mirrored. |

### Invoice Number & Backend Behavior (from RECENT_CHANGES_TO_IMPLEMENT.md)
- **Backend-generated invoice numbers**: Client updated to not send invoice number on create; mobile may still send it or call increment endpoint — implement per RECENT_CHANGES_TO_IMPLEMENT.md.
- **Enhanced invoice number generation**: Year replacement in format (e.g. `CC/26-27/00001`) — apply same logic in mobile invoice screens as in client.
- **Pagination on invoice lists**: Add to Service Invoice List and Rental Invoice List in mobile.
- **Sales Reports Summary**: Use real API data (products count, orders count) in mobile.
- **Settings – separate save for Global Invoice Format**: Client has dedicated Settings screen with “Save Format” button; mobile has no Settings content screen — add screen + separate save for invoice format.
- **Purchase List – negative values in red**: Optional; apply if mobile has material summary chips.

### Settings (Global Settings)
- Client: Full **Settings** page with **Global Invoice Format** (with separate “Save Format” button) and **From Mail** (predefined list + custom email, permissions).
- Mobile: No screen for editing these; only menu that links to Company, GST, Menu Settings, Old Invoices. **Credit** and **Gift** are in dashboard/menu but **Settings (Global Invoice Format + From Mail)** is missing.

### User Profile (customer)
- Client user dashboard: Profile, Address, PAN, Payment Cards, Reviews, Deactivate, Activity Log.
- Mobile ProfileScreen: Rich (e.g. payment updates for invoices, company picker, etc.) but **Payment Cards** management and **Reviews** page are not implemented as in client.

---

## 3. Summary Checklist

### Screens to add in mobile
- [x] **Settings content screen** (GlobalSettingsScreen): Global Invoice Format + From Mail (with separate “Save Format” and “Save Settings” as in client).
- [x] **PaymentCardsScreen** (user).
- [x] **ReviewsScreen** (user – “user review” page).
- [x] **EmployeeActivityLogForm** (admin: activity-log).
- [x] **ActivityLogReport** (admin).
- [x] **EmployeeLeaveForm** (admin: leave-application).
- [x] **LeaveReport** (admin).
- [ ] **DeleteAllOrder** (if still required).

### Features to add or align
- [x] **Service Enquiries**: All tabs (new, assigned, w_u, pending, inProgress, completed), service title filter, pagination, full tab counts.
- [x] **Save for Later**: Dedicated section in Cart already present (Saved For Later with Move to Cart).
- [x] **Invoice flows**: Backend-generated invoice numbers, no client-side increment, year replacement in format (already in AddServiceInvoiceScreen).
- [x] **Invoice lists**: Pagination for Service (and Rental where applicable) invoice lists.
- [x] **Sales Reports Summary**: Real API data; navigation fixed to Products/Orders.
- [x] **Purchase List**: Negative values in red (already implemented).
- [ ] **Reports**: Confirm report types (invoice vs quotation, service vs rental) and companyId handling for all report screens.

### Already documented in RECENT_CHANGES_TO_IMPLEMENT.md
- Backend-generated invoice numbers (critical).
- Enhanced invoice number generation (year replacement).
- Pagination for invoice lists.
- Sales Reports Summary update.
- Separate save for Global Invoice Format (mobile needs the Settings screen first).
- Purchase List negative value styling.

---

## 4. Reference: Client Admin Dashboard Routes

For parity, mobile admin should eventually cover these client routes:

- profile, address, pan, add-product, all-products, orders, order_details, commission, gst, employee, employee_details, addEmployee, menuSetting, **settings**, addServiceProduct, serviceProductList, rentalProductList, addRentalProduct, vendorList, addVendor, vendorProductList, addVendorProduct, purchaseList, purchaseRegister, all-category, companyList, addCompany, credit, addServiceQuotation, addServiceInvoice, serviceInvoiceList, serviceQuotationList, addServiceReport, addRentalReport, serviceReportlist, rentalReportlist, addRentalInvoice, rentalInvoiceList, rentalQuotationList, users, **service-enquiries**, **rental-enquiries**, profile/deactivate, product (edit), **companyReports**, **serviceReportsSummary**, **rentalReportsSummary**, **salesReportsSummary**, **reportsDashboard**, serviceInvoicesReport, serviceQuotationsReport, serviceReportsReport, serviceEnquiriesReport, rentalEnquiriesReport, rantalInvoicesReport, rentalQuotationsReport, rentalReportsReport, oldInvoices, **activity-log**, **activityLogReport**, **leave-application**, **leaveReport**.

Bold = either missing in mobile or not fully aligned.
