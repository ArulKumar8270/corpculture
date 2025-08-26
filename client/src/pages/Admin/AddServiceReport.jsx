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
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for Corpculture Report
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Import useParams
import toast from 'react-hot-toast';
import axios from 'axios'; // Assuming axios is used for API calls
import { useAuth } from '../../context/auth'; // Import useAuth to get the token

const AddServiceReport = () => {
    const navigate = useNavigate();
    const { id: reportId } = useParams(); // Get report ID from URL
    const { auth } = useAuth(); // Get auth token from context
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const reportFor = searchParams.get("reportType");
    const serviceId = searchParams.get("serviceId");
    // State for form fields
    const [reportData, setReportData] = useState({
        reportType: 'Service Report', // Default to 'Service Report'
        reportFor: reportFor,
        company: '', // This will store the company _id
        problemReport: '',
        remarksPendingWorks: '',
        accessService: '',
        modelNo: '',
        serialNo: '',
        branch: '', // This will store the branch name
        reference: '',
        usageData: '', // New field
        description: '', // New field
        materialProductName: '', // For adding new material (will store product _id)
        materialQuantity: '',    // For adding new material
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
                const companiesResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                    headers: { Authorization: auth?.token }
                });
                if (companiesResponse.data.success) {
                    setCompanies(companiesResponse.data.companies);
                } else {
                    toast.error(companiesResponse.data.message || 'Failed to fetch companies.');
                }

                // If reportId exists, fetch report details
                if (reportId) {
                    const reportResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/report/${reportId}`, {
                        headers: { Authorization: auth?.token }
                    });
                    if (reportResponse.data.success) {
                        const fetchedReport = reportResponse.data.reports?.[0];
                        setReportData({
                            reportType: fetchedReport.reportType || 'Service Report',
                            reportFor: fetchedReport.reportFor || 'service',
                            company: fetchedReport.company?._id || '', // Assuming company is populated
                            problemReport: fetchedReport.problemReport || '',
                            remarksPendingWorks: fetchedReport.remarksPendingWorks || '',
                            accessService: fetchedReport.accessService || '',
                            modelNo: fetchedReport.modelNo || '',
                            serialNo: fetchedReport.serialNo || '',
                            branch: fetchedReport.branch || '',
                            reference: fetchedReport.reference || '',
                            usageData: fetchedReport.usageData || '', // Populate new field
                            description: fetchedReport.description || '', // Populate new field
                            materialProductName: '', // Reset for new material entry
                            materialQuantity: '',    // Reset for new material entry
                        });
                        // If backend supports groups, use them; else, wrap materials in a single group
                        if (Array.isArray(fetchedReport.materialGroups) && fetchedReport.materialGroups.length > 0) {
                            // Add a temporary 'id' to each product for local table management
                            setMaterialGroups(fetchedReport.materialGroups.map(group => ({
                                ...group,
                                products: group.products.map((prod, index) => ({ ...prod, id: `initial-${group.name}-${index}-${Date.now()}` }))
                            })));
                        } else if (Array.isArray(fetchedReport.materials) && fetchedReport.materials.length > 0) {
                            // Fallback for old reports without materialGroups, create a single group
                            setMaterialGroups([
                                { name: 'Materials1', products: fetchedReport.materials.map((mat, index) => ({ ...mat, id: `initial-Materials1-${index}-${Date.now()}` })) }
                            ]);
                        } else {
                            setMaterialGroups([]); // No materials or groups
                        }
                    } else {
                        alert(reportResponse.data.message || 'Failed to fetch report details.');
                        navigate('../serviceReportlist'); // Redirect if report not found
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
        setMaterialGroups([...materialGroups, { name: newGroupName, products: [] }]);
        setSelectedGroupIndex(materialGroups.length); // Select the newly added group
        setEditingProductId(null); // Clear any product editing state
        setReportData(prev => ({
            ...prev,
            materialProductName: '',
            materialQuantity: '',
        }));
    };

    // Select a material group to add/edit products
    const handleSelectGroup = (idx) => {
        setSelectedGroupIndex(idx);
        setEditingProductId(null); // Clear any product editing state
        setReportData(prev => ({
            ...prev,
            materialProductName: '',
            materialQuantity: '',
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
        const productData = {
            productName: selectedProduct.productName,
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
        }));
    };

    // Edit product in group
    const handleEditProduct = (groupIdx, product) => {
        setSelectedGroupIndex(groupIdx); // Ensure the correct group is selected
        setEditingProductId(product.id);
        // Find the product _id based on the productName to set the Select value correctly
        const productToEdit = availableProducts.find(p => p.productName === product.productName);
        setReportData(prevData => ({
            ...prevData,
            materialProductName: productToEdit ? productToEdit._id : '',
            materialQuantity: product.quantity.toString(), // Convert number to string for TextField
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
            }));
        }
    };

    // Delete entire material group
    const handleDeleteGroup = (groupIdx) => {
        setMaterialGroups(prevGroups => prevGroups.filter((_, idx) => idx !== groupIdx));
        if (selectedGroupIndex === groupIdx) {
            setSelectedGroupIndex(null); // Deselect if the deleted group was active
            setEditingProductId(null); // Clear product editing state
            setReportData(prev => ({
                ...prev,
                materialProductName: '',
                materialQuantity: '',
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
            problemReport: reportData.problemReport,
            remarksPendingWorks: reportData.remarksPendingWorks,
            accessService: reportData.accessService,
            modelNo: reportData.modelNo,
            serialNo: reportData.serialNo,
            branch: reportData.branch, // This is the branch name string
            reference: reportData.reference,
            usageData: reportData.usageData, // Add new field
            description: reportData.description, // Add new field
            assignedTo : employeeName,
            reportFor: reportFor,
            // Send materialGroups as array of objects, without temporary 'id' field from products
            materialGroups: materialGroups.map(group => ({
                name: group.name,
                products: group.products.map(({ id, ...rest }) => rest) // Remove temporary 'id'
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
                alert(response.data.message);
                handleCancel(); // Reset form after successful submission/update
                navigate('../serviceReportlist'); // Changed from ../serviceReportlist
            } else {
                alert(response.data.message || `Failed to ${reportId ? 'update' : 'submit'} service report.`);
            }
        } catch (err) {
            console.error(`Error ${reportId ? 'updating' : 'submitting'} service report:`, err);
        }
    };

    const handleCancel = () => {
        setReportData({
            reportType: 'Service Report',
            company: '',
            problemReport: '',
            remarksPendingWorks: '',
            accessService: '',
            modelNo: '',
            serialNo: '',
            branch: '',
            reference: '',
            usageData: '', // Reset new field
            description: '', // Reset new field
            materialProductName: '',
            materialQuantity: '',
        });
        setMaterialGroups([]); // Reset material groups
        setSelectedGroupIndex(null); // Reset selected group
        setEditingProductId(null); // Reset product editing state
        toast.info('Form cancelled and reset.');
    };

    const handleCorpcultureReport = () => {
        // Implement logic for "Corpculture Report" button
        toast.info('Corpculture Report button clicked (placeholder)!');
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
                {reportId ? 'Edit Service Report' : 'Add Service Report'} {/* Dynamic Title */}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                        <RadioGroup
                            row
                            name="reportType"
                            value={reportData.reportType}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="Service Report" control={<Radio />} label="Service Report" />
                        </RadioGroup>
                    </FormControl>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="company-label">Company</InputLabel>
                            <Select
                                labelId="company-label"
                                id="company"
                                name="company"
                                value={reportData.company} // This now holds the company _id
                                onChange={handleChange}
                                label="Company"
                            >
                                <MenuItem value="">Select a Company</MenuItem>
                                {companies.map(comp => (
                                    <MenuItem key={comp._id} value={comp._id}>{comp.companyName}</MenuItem> // MenuItem value is _id
                                ))}
                            </Select>
                        </FormControl>
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
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Access Service"
                            name="accessService"
                            value={reportData.accessService}
                            onChange={handleChange}
                            placeholder="ENTER ACCESS SERVICE"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Model No"
                            name="modelNo"
                            value={reportData.modelNo}
                            onChange={handleChange}
                            placeholder="ENTER MODEL NO"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Serial No"
                            name="serialNo"
                            value={reportData.serialNo}
                            onChange={handleChange}
                            placeholder="ENTER SERIAL NO"
                            size="small"
                        />
                    </Grid>
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
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Usage Data"
                            name="usageData"
                            value={reportData.usageData}
                            onChange={handleChange}
                            placeholder="Enter Usage Data"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Description"
                            name="description"
                            value={reportData.description}
                            onChange={handleChange}
                            placeholder="Enter Description"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
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
                        <Grid item xs={12} sm={5}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="material-product-name-label">Select a Product</InputLabel>
                                <Select
                                    labelId="material-product-name-label"
                                    id="materialProductName"
                                    name="materialProductName"
                                    value={reportData.materialProductName} // This holds the product _id
                                    onChange={handleChange}
                                    label="Select a Product"
                                    disabled={editingProductId !== null} // Disable product selection when editing
                                >
                                    <MenuItem value="">Select a Product</MenuItem>
                                    {availableProducts.map(prod => (
                                        <MenuItem key={prod._id} value={prod._id}>{prod.productName}</MenuItem> // MenuItem value is product _id
                                    ))}
                                </Select>
                            </FormControl>
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
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#ffc107', color: 'black', '&:hover': { bgcolor: '#e0a800' } }}
                        startIcon={<DescriptionIcon />}
                        onClick={handleCorpcultureReport}
                    >
                        Corpculture Report
                    </Button>
                </Box>
            </Paper>

            {/* Render all material groups and their products */}
            {materialGroups.map((group, groupIdx) => (
                <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px', mt: 3 }} key={group.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pt: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#019ee3' }}>
                            {group.name}
                        </Typography>
                        <Button color="error" onClick={() => handleDeleteGroup(groupIdx)}>
                            Delete Group
                        </Button>
                    </Box>
                    <Table sx={{ minWidth: 650 }} aria-label={`materials table for ${group.name}`}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Total Amount</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {group.products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No products added to this group yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                group.products.map((product, productIdx) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{productIdx + 1}</TableCell>
                                        <TableCell>{product.productName}</TableCell>
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            ))}
        </Box>
    );
};

export default AddServiceReport;