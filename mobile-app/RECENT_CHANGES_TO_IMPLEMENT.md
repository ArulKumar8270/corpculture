# Recent Changes to Implement in Mobile App

This document lists the recent changes made to the web client that need to be implemented in the mobile app.

## 1. Invoice Number Generation Based on Global Invoice Format

### Files to Update:
- `src/screens/Admin/AddServiceInvoiceScreen.tsx`
- `src/screens/Rental/RentalInvoiceFormScreen.tsx`

### Changes Required:
1. **Add state for `globalInvoiceFormat`**:
   ```typescript
   const [globalInvoiceFormat, setGlobalInvoiceFormat] = useState('');
   ```

2. **Create helper function to generate invoice number**:
   ```typescript
   const generateInvoiceNumber = (invoiceCount: number, format: string): string => {
     if (!format || format.trim() === '') {
       return invoiceCount.toString();
     }

     // Extract prefix (non-numeric part) and number part from format
     const match = format.match(/^([^0-9]*)(\d+)$/);
     
     if (match) {
       const prefix = match[1] || '';
       const numberPart = match[2] || '';
       const numberDigits = numberPart.length;
       
       // Format invoiceCount with the same number of digits as in the format
       const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
       
       return prefix + formattedNumber;
     } else {
       // If format doesn't match pattern, try to find last number sequence
       const lastNumberMatch = format.match(/(\d+)(?!.*\d)/);
       if (lastNumberMatch) {
         const numberDigits = lastNumberMatch[1].length;
         const prefix = format.substring(0, format.lastIndexOf(lastNumberMatch[1]));
         const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
         return prefix + formattedNumber;
       }
       
       // Fallback: append count to format
       return format + invoiceCount.toString();
     }
   };
   ```

3. **Update `fetchInvoicesCount` / `fetchInvoicesCounts` function**:
   - Fetch both `invoiceCount` and `globalInvoiceFormat` from `/api/v1/common-details`
   - Generate invoice number using the format pattern
   - Store the formatted invoice number in state

4. **Update invoice number usage**:
   - Use the generated formatted invoice number instead of just the count

### Example Implementation:
```typescript
const fetchInvoicesCount = async () => {
  try {
    const { data } = await axios.get(`${getApiBaseUrl()}/common-details`, {
      headers: {
        Authorization: token || '',
      },
    });
    if (data?.success) {
      const invoiceCount = data.commonDetails?.invoiceCount + 1 || 1;
      const format = data.commonDetails?.globalInvoiceFormat || '';
      setGlobalInvoiceFormat(format);
      
      // Generate invoice number based on format
      const invoiceNumber = generateInvoiceNumber(invoiceCount, format);
      setInvoices(invoiceNumber);
    }
  } catch (error) {
    console.error('Error fetching invoice count:', error);
  }
};
```

---

## 2. Pagination for Invoice Lists

### Files to Update:
- `src/screens/Admin/ServiceInvoiceListScreen.tsx`
- `src/screens/Rental/RentalInvoiceListScreen.tsx`

### Changes Required:
1. **Add pagination state**:
   ```typescript
   const [page, setPage] = useState(0);
   const [rowsPerPage, setRowsPerPage] = useState(10);
   ```

2. **Add pagination handlers**:
   ```typescript
   const handleChangePage = (newPage: number) => {
     setPage(newPage);
   };

   const handleChangeRowsPerPage = (newRowsPerPage: number) => {
     setRowsPerPage(newRowsPerPage);
     setPage(0); // Reset to first page when changing rows per page
   };
   ```

3. **Update data fetching**:
   - Slice the filtered data based on pagination before rendering
   - Use `FlatList` with pagination controls or implement custom pagination UI

4. **Add pagination UI component**:
   - Add pagination controls (Previous/Next buttons, page numbers, rows per page selector)
   - Reset page to 0 when search term changes

### Example Implementation:
```typescript
// In the component
const paginatedData = filteredInvoices.slice(
  page * rowsPerPage,
  page * rowsPerPage + rowsPerPage
);

// Add pagination controls in render
<View style={styles.paginationContainer}>
  <TouchableOpacity
    onPress={() => handleChangePage(page - 1)}
    disabled={page === 0}
  >
    <Text>Previous</Text>
  </TouchableOpacity>
  <Text>Page {page + 1} of {Math.ceil(filteredInvoices.length / rowsPerPage)}</Text>
  <TouchableOpacity
    onPress={() => handleChangePage(page + 1)}
    disabled={page >= Math.ceil(filteredInvoices.length / rowsPerPage) - 1}
  >
    <Text>Next</Text>
  </TouchableOpacity>
</View>
```

---

## 3. Sales Reports Summary Update

### File to Update:
- `src/screens/Admin/Reports/SalesReportsSummaryScreen.tsx`

### Changes Required:
1. **Update API calls** to fetch real data:
   - Remove placeholder/mock data
   - Fetch from `/api/v1/product/seller-product` for products count
   - Fetch from `/api/v1/user/admin-orders?page=1&limit=1` for orders count (use `totalCount`)

2. **Update report data structure**:
   ```typescript
   const data: ReportData[] = [
     { 
       id: 'salesProducts', 
       name: 'All Sales Products', 
       count: productsCount, 
       screen: 'AllProducts' // or appropriate screen name
     },
     { 
       id: 'salesOrders', 
       name: 'Sales Orders', 
       count: ordersCount, 
       screen: 'AdminOrders' // or appropriate screen name
     },
   ];
   ```

3. **Add authentication token**:
   - Use `useSelector` to get token from Redux store
   - Include token in API calls

4. **Update navigation**:
   - Navigate to appropriate screens when clicking on report items

### Example Implementation:
```typescript
const SalesReportsSummaryScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication token not available.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [productsRes, ordersRes] = await Promise.allSettled([
          axios.get(`${getApiBaseUrl()}/product/seller-product`, {
            headers: { Authorization: token }
          }),
          axios.get(`${getApiBaseUrl()}/user/admin-orders?page=1&limit=1`, {
            headers: { Authorization: token }
          })
        ]);

        const productsCount = productsRes?.value?.data?.products?.length ?? 0;
        const ordersCount = ordersRes?.value?.data?.totalCount ?? 0;

        setReportData([
          { id: 'salesProducts', name: 'All Sales Products', count: productsCount, screen: 'AllProducts' },
          { id: 'salesOrders', name: 'Sales Orders', count: ordersCount, screen: 'AdminOrders' },
        ]);
      } catch (err) {
        console.error('Error loading sales overview data:', err);
        setError('Failed to load sales overview data.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  // ... rest of component
};
```

---

## 4. Summary of All Changes

### Priority 1 (High):
1. ✅ Invoice number generation based on global invoice format
   - `AddServiceInvoiceScreen.tsx`
   - `RentalInvoiceFormScreen.tsx`

### Priority 2 (Medium):
2. ✅ Pagination for invoice lists
   - `ServiceInvoiceListScreen.tsx`
   - `RentalInvoiceListScreen.tsx`

### Priority 3 (Low):
3. ✅ Sales Reports Summary update
   - `SalesReportsSummaryScreen.tsx`

---

## Testing Checklist

After implementing these changes, test:

- [ ] Invoice numbers are generated correctly with format (e.g., "CC1001", "CC1002")
- [ ] Invoice numbers fall back to simple count if no format is set
- [ ] Pagination works correctly in Service Invoice List
- [ ] Pagination works correctly in Rental Invoice List
- [ ] Page resets when search term changes
- [ ] Sales Reports Summary shows correct product count
- [ ] Sales Reports Summary shows correct orders count
- [ ] Navigation works from Sales Reports Summary to respective screens
- [ ] All API calls include authentication tokens
- [ ] Error handling works for failed API calls

---

## Notes

- All API endpoints should use `getApiBaseUrl()` helper function
- All API calls should include `Authorization` header with token
- Use `Promise.allSettled` for concurrent API calls to handle individual failures gracefully
- Follow existing code patterns and styling in the mobile app
- Use TypeScript types appropriately
- Handle loading and error states properly

