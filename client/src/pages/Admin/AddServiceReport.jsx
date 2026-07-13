import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Import useParams
import toast from 'react-hot-toast';
import axios from 'axios'; // Assuming axios is used for API calls
import { useAuth } from '../../context/auth'; // Import useAuth to get the token
import { getReportListPath } from '../../utils/reportNavigation';
import {
    CONTENT_SCOPE_OPTIONS,
    getDocumentTitle,
    showsContentScopeField,
    isContentScopeRequired,
} from '../../utils/reportDocumentTypes';

const defaultReportType = (props, reportFor) =>
    reportFor || props?.reportType || 'Service_Report';

const AddServiceReport = (props) => {
    const navigate = useNavigate();
    const { id: reportId } = useParams(); // Get report ID from URL
    const { auth } = useAuth(); // Get auth token from context
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const reportFor = searchParams.get("reportType");
    const serviceId = searchParams.get("serviceId");
    const companyId = searchParams.get("companyId");
    // State for form fields
    const [reportData, setReportData] = useState({
        reportNumber: '',
        reportType: defaultReportType(props, reportFor),
        reportFor: reportFor || props?.reportType,
        company: companyId, // This will store the company _id
        sendDetailsTo: [],
        assignedTo: employeeName || '',
        problemReport: '',
        remarksPendingWorks: '',
        branch: '', // This will store the branch name
        reference: '',
        contentScope: '',
        materialProductName: '', // For adding new material (will store product _id)
        materialQuantity: '',    // For adding new material
        materialUsageData: '',
        materialDescription: '',
    });

    // State for material groups
    const [materialGroups, setMaterialGroups] = useState([]);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(null); // Index of group being edited/added to
    const [editingProductId, setEditingProductId] = useState(null); // For editing products within a group

    const [loading, setLoading] = useState(true); // For initial form load

    // States for dropdown data
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]); // Branches specific to selected company
    const [availableProducts, setAvailableProducts] = useState([]); // Products specific to selected company

    // Initial data fetch (only companies)
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch companies
                // const companiesResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                //     headers: { Authorization: auth?.token }
                // });
                // if (companiesResponse.data.success) {
                //     setCompanies(companiesResponse.data.companies);
                // } else {
                //     toast.error(companiesResponse.data.message || 'Failed to fetch companies.');
                // }

                // If reportId exists, fetch report details
                if (reportId) {
                    const reportResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/report/getById/${reportId}`, {
                        headers: { Authorization: auth?.token }
                    });
                    if (reportResponse.data.success) {
                        const fetchedReport = reportResponse.data.report;
                        setReportData({
                            reportNumber: fetchedReport.reportNumber ?? '',
                            reportType: fetchedReport.reportType || 'Service_Report',
                            reportFor: fetchedReport.reportFor || 'service',
                            company: fetchedReport.company?._id || '', // Assuming company is populated
                            sendDetailsTo: Array.isArray(fetchedReport.sendDetailsTo) ? fetchedReport.sendDetailsTo : [],
                            assignedTo:
                                (typeof fetchedReport.assignedTo === 'object' && fetchedReport.assignedTo?._id)
                                    ? fetchedReport.assignedTo._id
                                    : (fetchedReport.assignedTo || employeeName || ''),
                            problemReport: fetchedReport.problemReport || '',
                            remarksPendingWorks: fetchedReport.remarksPendingWorks || '',
                            branch: fetchedReport.branch || '',
                            reference: fetchedReport.reference || '',
                            contentScope: fetchedReport.contentScope || '',
                            materialProductName: '', // Reset for new material entry
                            materialQuantity: '',    // Reset for new material entry
                            materialUsageData: '',
                            materialDescription: '',
                        });
                        if (Array.isArray(fetchedReport.materialGroups) && fetchedReport.materialGroups.length > 0) {
                            setMaterialGroups(fetchedReport.materialGroups.map((group) => {
                                const products = (group.products || []).map((prod, index) => {
                                    const { serialNo, ...rest } = prod;
                                    return { ...rest, id: `initial-${group.name}-${index}-${Date.now()}` };
                                });
                                const legacyProductSerial = group.products?.find((p) => p?.serialNo?.trim())?.serialNo?.trim();
                                return {
                                    ...group,
                                    serialNo: group.serialNo?.trim() || legacyProductSerial || '',
                                    products,
                                };
                            }));
                        } else if (Array.isArray(fetchedReport.materials) && fetchedReport.materials.length > 0) {
                            const legacySerial = fetchedReport.materials.find((m) => m?.serialNo?.trim())?.serialNo?.trim() || '';
                            setMaterialGroups([
                                {
                                    name: 'Materials1',
                                    serialNo: legacySerial,
                                    products: fetchedReport.materials.map((mat, index) => {
                                        const { serialNo, ...rest } = mat;
                                        return { ...rest, id: `initial-Materials1-${index}-${Date.now()}` };
                                    }),
                                },
                            ]);
                        } else {
                            setMaterialGroups([]); // No materials or groups
                        }
                    } else {
                        alert(reportResponse.data.message || 'Failed to fetch report details.');
                        navigate(getReportListPath(fetchedReport.reportType || props?.reportType));
                    }
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                alert('Failed to load initial data. Check console for details.');
            } finally {
                setLoading(false);
            }
        };

        if (auth?.token) { // Only fetch data if auth token is available
            fetchInitialData();
        }
    }, [auth?.token, reportId, navigate]); // Re-run effect if auth token or reportId changes

    const handleChange = (e) => {
        const { name, value } = e.target;

        setReportData(prevData => ({
            ...prevData,
            [name]: value,
        }));

        if (name === 'company') {
            // Reset branch and material product when company changes
            setReportData(prevData => ({
                ...prevData,
                branch: '', // Clear selected branch
                materialProductName: '', // Clear selected material product
                sendDetailsTo: [],
            }));
            setMaterialGroups([]); // Clear all material groups when company changes
            setSelectedGroupIndex(null); // Deselect any active group
            setEditingProductId(null); // Exit edit mode
        }
    };

    useEffect(() => {
        const fetchCompanyRelatedData = async () => {
            if (reportData?.company && auth?.token) {
                try {
                    // Fetch company details for branches
                    const { data: companyData } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${reportData?.company}`,
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    setCompanies([companyData.company]);
                    if (companyData?.success && companyData.company) {
                        const company = companyData.company;
                        const extractedBranches = new Set();
                        company.serviceDeliveryAddresses.forEach(addressObj => {
                            if (addressObj.address) {
                                extractedBranches.add(addressObj.address);
                            }
                        });
                        setBranches(Array.from(extractedBranches));
                    } else {
                        toast.error(companyData?.message || 'Failed to fetch company details.');
                        setBranches([]);
                    }

                    // Fetch products for the selected company
                    const { data: productsData } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/getServiceProductsByCompany/${reportData?.company}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (productsData?.success) {
                        setAvailableProducts(productsData.serviceProducts);
                    } else {
                        toast.error(productsData?.message || 'Failed to fetch products for the selected company.');
                        setAvailableProducts([]);
                    }
                } catch (error) {
                    console.error('Error fetching company related data:', error);
                    toast.error(error.response?.data?.message || 'Something went wrong while fetching company related data.');
                    setBranches([]);
                    setAvailableProducts([]);
                }
            } else {
                setBranches([]); // Clear branches if no company selected
                setAvailableProducts([]); // Clear products if no company selected
            }
        };

        fetchCompanyRelatedData();
    }, [reportData?.company, auth?.token]);

    // Add new material group
    const handleAddGroup = () => {
        const newGroupName = `Materials${materialGroups.length + 1}`;
        setMaterialGroups([...materialGroups, { name: newGroupName, serialNo: '', products: [] }]);
        setSelectedGroupIndex(materialGroups.length); // Select the newly added group
        setEditingProductId(null); // Clear any product editing state
        setReportData(prev => ({
            ...prev,
            materialProductName: '',
            materialQuantity: '',
        }));
    };

    // Helper function to safely extract productName from various structures
    const extractProductName = (product) => {
        if (!product) return 'Unknown Product';
        
        // If productName is a string, return it directly
        if (typeof product.productName === 'string') {
            return product.productName;
        }
        
        // If productName is an object, try to extract the actual name
        if (typeof product.productName === 'object' && product.productName !== null) {
            const productNameObj = product.productName;
            
            // Try productName.productName (nested structure - could be Purchase -> VendorProduct)
            if (productNameObj.productName) {
                // If productName.productName is a string, return it
                if (typeof productNameObj.productName === 'string') {
                    return productNameObj.productName;
                }
                // If it's still an object, go one level deeper (Purchase -> VendorProduct -> productName)
                if (typeof productNameObj.productName === 'object' && productNameObj.productName !== null) {
                    const nested = productNameObj.productName;
                    // Check if nested.productName is a string (the actual product name)
                    if (typeof nested.productName === 'string') {
                        return nested.productName;
                    }
                    // Fallback to nested.name
                    if (typeof nested.name === 'string') {
                        return nested.name;
                    }
                }
            }
            
            // Try productName.name
            if (productNameObj.name && typeof productNameObj.name === 'string') {
                return productNameObj.name;
            }
        }
        
        // Fallback to product.name
        if (product.name && typeof product.name === 'string') {
            return product.name;
        }
        
        return 'Unknown Product';
    };

    const handleGroupSerialChange = (groupIdx, value) => {
        setMaterialGroups((prevGroups) =>
            prevGroups.map((group, idx) =>
                idx === groupIdx ? { ...group, serialNo: value } : group
            )
        );
    };

    // Select a material group to add/edit products
    const handleSelectGroup = (idx) => {
        setSelectedGroupIndex(idx);
        setEditingProductId(null);
        setReportData(prev => ({
            ...prev,
            materialProductName: '',
            materialQuantity: '',
            materialUsageData: '',
            materialDescription: '',
        }));
    };

    // Add or update product in the selected group
    const handleSaveProduct = () => {
        if (selectedGroupIndex === null) {
            toast.error('Please select a material group first.');
            return;
        }
        const selectedProduct = availableProducts.find(p => p._id === reportData.materialProductName);
        if (!selectedProduct || !reportData.materialQuantity || parseInt(reportData.materialQuantity) <= 0) {
            toast.error('Please select a product and enter a valid quantity.');
            return;
        }

        const quantity = parseInt(reportData.materialQuantity);
        // Use helper function to safely extract productName
        const productName = extractProductName(selectedProduct);
        const productData = {
            productName: productName,
            usageData: reportData.materialUsageData?.trim() || '',
            description: reportData.materialDescription?.trim() || '',
            quantity: quantity,
            rate: selectedProduct.rate,
            totalAmount: quantity * selectedProduct.rate,
        };

        setMaterialGroups(prevGroups => prevGroups.map((group, idx) => {
            if (idx === selectedGroupIndex) {
                if (editingProductId) {
                    // Update existing product in this group
                    return {
                        ...group,
                        products: group.products.map(prod =>
                            prod.id === editingProductId
                                ? { ...prod, ...productData }
                                : prod
                        )
                    };
                } else {
                    // Add new product to this group
                    const newProduct = {
                        id: Date.now(), // Temporary unique ID for the product in the table
                        ...productData,
                    };
                    return {
                        ...group,
                        products: [...group.products, newProduct]
                    };
                }
            }
            return group;
        }));

        toast.success(editingProductId ? 'Product updated!' : 'Product added to group!');
        setEditingProductId(null); // Exit product edit mode
        // Clear product-related fields after adding/updating
        setReportData(prevData => ({
            ...prevData,
            materialProductName: '',
            materialQuantity: '',
            materialUsageData: '',
            materialDescription: '',
        }));
    };

    // Edit product in group
    const handleEditProduct = (groupIdx, product) => {
        setSelectedGroupIndex(groupIdx);
        setEditingProductId(product.id);
        const productToEdit = availableProducts.find(p => {
            const pName = extractProductName(p);
            return pName === product.productName;
        });
        setReportData(prevData => ({
            ...prevData,
            materialProductName: productToEdit ? productToEdit._id : '',
            materialQuantity: product.quantity.toString(),
            materialUsageData: product.usageData || '',
            materialDescription: product.description || '',
        }));
    };

    // Delete product from group
    const handleDeleteProduct = (groupIdx, productId) => {
        setMaterialGroups(prevGroups => prevGroups.map((group, idx) => {
            if (idx === groupIdx) {
                return {
                    ...group,
                    products: group.products.filter(prod => prod.id !== productId)
                };
            }
            return group;
        }));
        toast.success('Product removed from group!');
        if (editingProductId === productId) { // If the deleted product was being edited, exit edit mode
            setEditingProductId(null);
            setReportData(prevData => ({
                ...prevData,
                materialProductName: '',
                materialQuantity: '',
                materialUsageData: '',
                materialDescription: '',
            }));
        }
    };

    // Delete entire material group
    const handleDeleteGroup = (groupIdx) => {
        setMaterialGroups(prevGroups => prevGroups.filter((_, idx) => idx !== groupIdx));
        if (selectedGroupIndex === groupIdx) {
            setSelectedGroupIndex(null);
            setEditingProductId(null);
            setReportData(prev => ({
                ...prev,
                materialProductName: '',
                materialQuantity: '',
                materialUsageData: '',
                materialDescription: '',
            }));
        }
        toast.success('Material group removed!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate company is selected (its _id)
        if (!reportData.company) {
            toast.error('Please select a company.');
            return;
        }
        if (isContentScopeRequired(reportData.reportType) && !reportData.contentScope) {
            toast.error('Please select Service / Product for Delivery Challan (DC Copy).');
            return;
        }
        // Validate at least one material group exists and has products
        const hasProducts = materialGroups.some(group => group.products.length > 0);
        if (materialGroups.length === 0 || !hasProducts) {
            toast.error('Please add at least one material group with products.');
            return;
        }

        // Construct the payload for the backend
        const payload = {
            serviceId: serviceId,
            reportType: reportData.reportType,
            company: reportData.company, // This is the company _id
            sendDetailsTo: reportData.sendDetailsTo,
            problemReport: reportData.problemReport,
            remarksPendingWorks: reportData.remarksPendingWorks,
            branch: reportData.branch, // This is the branch name string
            reference: reportData.reference,
            contentScope: reportData.contentScope || undefined,
            assignedTo: reportData.assignedTo || employeeName,
            reportFor: reportFor,
            // Send materialGroups as array of objects, without temporary 'id' field from products
            // Ensure productName is always a string, not an object
            materialGroups: materialGroups.map(group => ({
                name: group.name,
                serialNo: group.serialNo?.trim() || '',
                products: group.products.map(({ id, serialNo, ...rest }) => {
                    // Ensure productName is a string
                    const productName = typeof rest.productName === 'string' 
                        ? rest.productName 
                        : extractProductName(rest);
                    return {
                        ...rest,
                        productName: productName, // Always a string
                    };
                })
            })),
        };

        try {
            let response;
            if (reportId) {
                // Update existing report
                response = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/report/${reportId}`,
                    payload,
                    {
                        headers: {
                            Authorization: auth?.token,
                            'Content-Type': 'application/json'
                        },
                    }
                );
            } else {
                // Create new report
                response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/report`,
                    payload,
                    {
                        headers: {
                            Authorization: auth?.token,
                            'Content-Type': 'application/json'
                        },
                    }
                );
            }


            if (response.data.success) {
                if (!reportId && response?.data?.report?.reportNumber != null) {
                    toast.success(`Report created. Report No: ${response.data.report.reportNumber}`);
                }
                alert(response.data.message);
                handleCancel(); // Reset form after successful submission/update
                navigate(getReportListPath(reportData.reportType || props?.reportType));
            } else {
                alert(response.data.message || `Failed to ${reportId ? 'update' : 'submit'} Service_Report.`);
            }
        } catch (err) {
            console.error(`Error ${reportId ? 'updating' : 'submitting'} Service_Report:`, err);
        }
    };

    const handleCancel = () => {
        setReportData({
            reportNumber: '',
            reportType: defaultReportType(props, reportFor),
            company: '',
            sendDetailsTo: [],
            assignedTo: employeeName || '',
            problemReport: '',
            remarksPendingWorks: '',
            branch: '',
            reference: '',
            contentScope: '',
            materialProductName: '',
            materialQuantity: '',
            materialUsageData: '',
            materialDescription: '',
        });
        setMaterialGroups([]); // Reset material groups
        setSelectedGroupIndex(null); // Reset selected group
        setEditingProductId(null); // Reset product editing state
        toast.info('Form cancelled and reset.');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                {reportId ? 'Edit' : 'Add'}{' '}
                {getDocumentTitle(reportData.reportType) !== 'Report'
                    ? getDocumentTitle(reportData.reportType)
                    : String(reportData.reportType || '').includes('Rental')
                      ? 'Rental Report'
                      : 'Service Report'}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                {/* <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                        <RadioGroup
                            row
                            name="reportType"
                            value={reportData.reportType}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="Service_Report" control={<Radio />} label="Service_Report" />
                        </RadioGroup>
                    </FormControl>
                </Box> */}

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <TextField
                                fullWidth
                                margin="normal" 
                                label="Company"
                                name="company"
                                value={companies[0]?.companyName || ''}
                                size="small"
                                disabled={true}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            multiple
                            options={(companies?.[0]?.contactPersons || [])
                                .map((cp) => ({
                                    name: cp?.name || '',
                                    email: cp?.email || '',
                                    mobile: cp?.mobile || '',
                                }))
                                .filter((x) => x.name && (x.email || x.mobile))}
                            value={Array.isArray(reportData.sendDetailsTo) ? reportData.sendDetailsTo : []}
                            onChange={(event, newValue) => {
                                setReportData((prev) => ({ ...prev, sendDetailsTo: newValue || [] }));
                            }}
                            getOptionLabel={(opt) => {
                                const email = opt?.email ? ` (${opt.email})` : '';
                                const mobile = !opt?.email && opt?.mobile ? ` (${opt.mobile})` : '';
                                return `${opt?.name || ''}${email || mobile}`.trim();
                            }}
                            isOptionEqualToValue={(a, b) => {
                                const ae = String(a?.email || '').trim().toLowerCase();
                                const be = String(b?.email || '').trim().toLowerCase();
                                if (ae && be) return ae === be;
                                const am = String(a?.mobile || '').trim();
                                const bm = String(b?.mobile || '').trim();
                                if (am && bm) return am === bm;
                                return String(a?.name || '').trim().toLowerCase() === String(b?.name || '').trim().toLowerCase();
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        variant="outlined"
                                        label={`${option?.name || ''}${option?.email ? ` (${option.email})` : ''}`}
                                        {...getTagProps({ index })}
                                        key={`${option?.email || option?.mobile || option?.name}-${index}`}
                                    />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Send To"
                                    placeholder="Select contact persons"
                                    helperText="Emails will be stored in DB."
                                    margin="normal"
                                    size="small"
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Problem Report"
                            name="problemReport"
                            value={reportData.problemReport}
                            onChange={handleChange}
                            placeholder="ENTER PROBLEM REPORT"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Remarks / Pending Works"
                            name="remarksPendingWorks"
                            value={reportData.remarksPendingWorks}
                            onChange={handleChange}
                            placeholder="ENTER REMARKS / PENDING WORKS"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
                    {/* Serial No is now material-wise (in Materials) */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="branch-label">Branch</InputLabel>
                            <Select
                                labelId="branch-label"
                                id="branch"
                                name="branch"
                                value={reportData.branch} // This holds the branch name (address string)
                                onChange={handleChange}
                                label="Branch"
                            >
                                <MenuItem value="">Select a Branch</MenuItem>
                                {branches.map((branch, index) => ( // branch is now a string (the address)
                                    <MenuItem key={index} value={branch}>{branch}</MenuItem> // Use branch directly for value and display
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    {showsContentScopeField(reportData.reportType) && (
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal" size="small" required={isContentScopeRequired(reportData.reportType)}>
                                <InputLabel id="content-scope-label">Service / Product</InputLabel>
                                <Select
                                    labelId="content-scope-label"
                                    id="contentScope"
                                    name="contentScope"
                                    value={reportData.contentScope}
                                    onChange={handleChange}
                                    label="Service / Product"
                                >
                                    <MenuItem value="">
                                        {isContentScopeRequired(reportData.reportType)
                                            ? 'Select Service / Product'
                                            : 'None (optional)'}
                                    </MenuItem>
                                    {CONTENT_SCOPE_OPTIONS.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Reference"
                            name="reference"
                            value={reportData.reference}
                            onChange={handleChange}
                            placeholder="Reference"
                            size="small"
                        />
                    </Grid>
                    {/* usageData & description are now per-product (inside Materials) */}
                </Grid>

                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: '#019ee3' }}>
                    Material Groups
                </Typography>
                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Button variant="outlined" onClick={handleAddGroup}>
                        Add Material Group
                    </Button>
                    {materialGroups.map((group, idx) => (
                        <Button
                            key={group.name}
                            variant={selectedGroupIndex === idx ? 'contained' : 'outlined'}
                            sx={{ mr: 1, mb: 1 }}
                            onClick={() => handleSelectGroup(idx)}
                        >
                            {group.name}
                        </Button>
                    ))}
                </Box>

                {selectedGroupIndex !== null && (
                    <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Serial No (for this material group)"
                                value={materialGroups[selectedGroupIndex]?.serialNo || ''}
                                onChange={(e) => handleGroupSerialChange(selectedGroupIndex, e.target.value)}
                                placeholder="Enter serial number for this group"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <Autocomplete
                                id="material-product-name-autocomplete"
                                options={availableProducts || []}
                                getOptionLabel={(option) => extractProductName(option)}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={
                                    availableProducts.find(
                                        (prod) => prod._id === reportData.materialProductName
                                    ) || null
                                }
                                onChange={(event, newValue) => {
                                    handleChange({
                                        target: {
                                            name: 'materialProductName',
                                            value: newValue ? newValue._id : '',
                                        },
                                    });
                                }}
                                disabled={editingProductId !== null}
                                filterOptions={(options, state) => {
                                    const inputValue = state.inputValue.toLowerCase();
                                    return options.filter((option) =>
                                        extractProductName(option).toLowerCase().includes(inputValue)
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select a Product"
                                        size="small"
                                        placeholder="Search product..."
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                name="materialQuantity"
                                type="number"
                                value={reportData.materialQuantity}
                                onChange={handleChange}
                                placeholder="Enter Quantity"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Usage Data (per product)"
                                name="materialUsageData"
                                value={reportData.materialUsageData}
                                onChange={handleChange}
                                placeholder="Optional"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description (material wise)"
                                name="materialDescription"
                                value={reportData.materialDescription}
                                onChange={handleChange}
                                placeholder="Optional"
                                multiline
                                rows={2}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Button
                                variant="outlined"
                                onClick={handleSaveProduct}
                                disabled={!reportData.materialProductName || !reportData.materialQuantity}
                                fullWidth
                            >
                                {editingProductId ? 'Update Product' : 'Add Product'} {/* Dynamic button text */}
                            </Button>
                            {editingProductId && ( // Show Cancel button only when editing
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => {
                                        setEditingProductId(null);
                                        setReportData(prevData => ({
                                            ...prevData,
                                            materialProductName: '',
                                            materialQuantity: '',
                                            materialUsageData: '',
                                            materialDescription: '',
                                        }));
                                    }}
                                    fullWidth
                                    sx={{ mt: 1 }}
                                >
                                    Cancel Edit
                                </Button>
                            )}
                        </Grid>
                    </Grid>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Button variant="contained" sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }} onClick={handleSubmit}>
                        {reportId ? 'Update Report' : 'Submit'} {/* Dynamic Submit/Update button */}
                    </Button>
                    <Button variant="contained" sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }} onClick={handleCancel}>
                        Cancel
                    </Button>
                </Box>
            </Paper>

            {/* Render all material groups and their products */}
            {materialGroups.map((group, groupIdx) => (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', mt: 3 }} key={group.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2, gap: 2, flexWrap: 'wrap' }}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#019ee3' }}>
                                {group.name}
                            </Typography>
                            {group.serialNo ? (
                                <Typography variant="body2" sx={{ color: '#019ee3', fontWeight: 600, mt: 0.5 }}>
                                    Serial No: {group.serialNo}
                                </Typography>
                            ) : (
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Serial No: —
                                </Typography>
                            )}
                        </Box>
                        <Button color="error" onClick={() => handleDeleteGroup(groupIdx)}>
                            Delete Group
                        </Button>
                    </Box>
                    <Table sx={{ minWidth: 650 }} aria-label={`materials table for ${group.name}`}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Material Usage Data</TableCell>
                                <TableCell>Material Description</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Total Amount</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {group.products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No products added to this group yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                group.products.map((product, productIdx) => {
                                    // Ensure productName is a string (safety check)
                                    const productName = typeof product.productName === 'string' 
                                        ? product.productName 
                                        : extractProductName(product);
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell>{productIdx + 1}</TableCell>
                                            <TableCell>{productName}</TableCell>
                                            <TableCell>{product.usageData || '—'}</TableCell>
                                            <TableCell>{product.description || '—'}</TableCell>
                                            <TableCell align="right">{product.quantity}</TableCell>
                                            <TableCell align="right">{product.totalAmount}</TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditProduct(groupIdx, product)}
                                                    disabled={editingProductId !== null && editingProductId !== product.id} // Disable other edit buttons when one is active
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteProduct(groupIdx, product.id)}>
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ))}
        </Box>
    );
};

export default AddServiceReport;