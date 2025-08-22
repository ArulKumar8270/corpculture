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
    CircularProgress // Import CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
// Removed EditIcon import as it's no longer needed
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // <-- add useParams
import toast from 'react-hot-toast';
import axios from 'axios'; // Import axios
import { useAuth } from '../../context/auth';

const AddServiceQuotation = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { quotationId } = useParams(); // <-- get QuotationId from URL
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const [invoices, setInvoices] = useState(null);

    // State for form fields
    const [quotationData, setQuotationData] = useState({
        companyId: '', // Stores the _id of the selected company
        productId: '', // Stores the _id of the selected product for adding to table
        quantity: '', // Quantity for the product being added
        modeOfPayment: 'Cash',
        deliveryAddress: '',
        reference: '',
        description: '',
        status: 'draft',
        sendTo: []
    });

    const [companyData, setCompanyData] = useState(null)
    // State for products added to the table (these are the line items for the Quotation)
    const [productsInTable, setProductsInTable] = useState([]);
    // States for dropdown data
    const [companies, setCompanies] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state for initial data


    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/all`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            if (data?.success) {
                setInvoices(data.serviceQuotations?.length + 1);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
            alert(error.response?.data?.message || 'Something went wrong while fetching invoices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCompanyData = async () => {
            if (quotationData?.companyId) {
                try {
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${quotationData?.companyId}`,
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    if (data?.success && data.company) {
                        const company = data.company;
                        setCompanyData(company);

                    } else {
                        toast.error(data?.message || 'Failed to fetch company details.');
                    }
                } catch (error) {
                    console.error('Error fetching company details:', error);
                    toast.error(error.response?.data?.message || 'Something went wrong while fetching company details.');
                }
            }
        };

        if (auth?.token) {
            fetchCompanyData();
        }
    }, [quotationData?.companyId, auth?.token]);

    // Fetch companies on component mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setCompanies(data.companies);
                } else {
                    toast.error(data?.message || 'Failed to fetch companies.');
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
                toast.error('Something went wrong while fetching companies.');
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
        fetchInvoices();
    }, []);

    // Fetch products when companyId changes
    useEffect(() => {
        const fetchProductsByCompany = async () => {
            if (quotationData.companyId) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/getServiceProductsByCompany/${quotationData.companyId}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        setAvailableProducts(data.serviceProducts);
                    } else {
                        toast.error(data?.message || 'Failed to fetch products for the selected company.');
                        setAvailableProducts([]); // Clear products if fetch fails
                    }
                } catch (error) {
                    console.error("Error fetching products by company:", error);
                    toast.error('Something went wrong while fetching products.');
                    setAvailableProducts([]); // Clear products on error
                } finally {
                    setLoading(false);
                }
            } else {
                setAvailableProducts([]); // Clear products if no company is selected
            }
        };
        fetchProductsByCompany();
    }, [quotationData.companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setQuotationData(prevData => {
            const newData = { ...prevData, [name]: value };
            // If company changes, reset selected product and products in table
            if (name === 'companyId') {
                newData.productId = '';
                newData.quantity = '';
                setProductsInTable([]); // Clear products in table when company changes
                newData.sendTo = [];
            }
            return newData;
        });
    };

    const handleAddProduct = () => {
        const selectedProduct = availableProducts.find(p => p._id === quotationData.productId);

        if (!selectedProduct || !quotationData.quantity || quotationData.quantity <= 0) {
            toast.error('Please select a product and enter a valid quantity.');
            return;
        }
        const newProduct = {
            id: Date.now() + Math.random(), // Assign a unique ID for this table entry
            productId: selectedProduct._id, // Store the actual product ID from DB
            productName: selectedProduct.productName,
            sku: selectedProduct.sku,
            hsn: selectedProduct.hsn,
            quantity: parseInt(quotationData.quantity),
            rate: selectedProduct.rate,
            totalAmount: parseInt(quotationData.quantity) * selectedProduct.rate,
        };

        setProductsInTable(prevProducts => [...prevProducts, newProduct]);
        // Clear product-related fields after adding
        setQuotationData(prevData => ({
            ...prevData,
            productId: '',
            quantity: '',
        }));
        toast.success('Product added to list!');
    };

    const handleDeleteProduct = (idToDelete) => { // Changed parameter name to idToDelete
        setProductsInTable(prevProducts => prevProducts.filter(product => product.id !== idToDelete)); // Filter by the unique 'id'
        toast.success('Product removed!');
    };

    // Fetch Quotation details if editing
    useEffect(() => {
        const fetchQuotationDetails = async () => {
            if (quotationId) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/get/${quotationId}`,
                        {
                            headers: { Authorization: auth.token },
                        }
                    );
                    if (data?.success) {
                        const quotation = data.serviceQuotation;
                        setQuotationData({
                            companyId: quotation.companyId?._id || quotation.companyId || '',
                            productId: '', // Will be set when adding new products
                            quantity: '',
                            modeOfPayment: quotation.modeOfPayment || '',
                            deliveryAddress: quotation.deliveryAddress || '',
                            reference: quotation.reference || '',
                            description: quotation.description || '',
                            status: quotation.status || '',
                            sendTo: Array.isArray(quotation.sendTo) ? quotation.sendTo : (quotation.sendTo ? [quotation.sendTo] : []),
                        });
                        // Map products to table format with unique id
                        setProductsInTable(
                            (quotation.products || []).map((p, idx) => ({
                                id: Date.now() + Math.random() + idx,
                                productId: p.productId?._id || p.productId,
                                productName: p.productId?.productName || p.productName,
                                sku: p.productId?.sku || '',
                                hsn: p.productId?.hsn || '',
                                quantity: p.quantity,
                                rate: p.rate,
                                totalAmount: p.totalAmount,
                            }))
                        );
                    } else {
                        toast.error(data?.message || 'Failed to fetch quotation details.');
                    }
                } catch (error) {
                    toast.error('Error fetching quotation details.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchQuotationDetails();
        // eslint-disable-next-line
    }, [quotationId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const {companyId, modeOfPayment, deliveryAddress, reference, description, status, sendTo } = quotationData;

        if ( !companyId || !modeOfPayment || !deliveryAddress || productsInTable.length === 0 || sendTo?.length === 0) {
            toast.error('Please fill all required fields and add at least one product.');
            return;
        }

        // Calculate subtotal, tax, and grandTotal
        const subtotal = productsInTable.reduce((sum, item) => sum + item.totalAmount, 0);
        const tax = 0;
        const grandTotal = subtotal + tax;

        const payload = {
            quotationNumber : invoices,
            companyId,
            products: productsInTable.map(p => ({
                productId: p.productId,
                productName: p.productName,
                quantity: p.quantity,
                rate: p.rate,
                totalAmount: p.totalAmount,
            })),
            modeOfPayment,
            deliveryAddress,
            reference,
            description,
            subtotal,
            tax,
            grandTotal,
            status,
            assignedTo: employeeName,
            sendTo
        };

        try {
            let data;
            if (quotationId) {
                // Update existing Quotation
                const res = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/update/${quotationId}`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                data = res.data;
            } else {
                // Create new quotation
                const res = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/create`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                data = res.data;
            }
            if (data?.success) {
                toast.success(data.message);
                handleCancel();
            } else {
                alert(data?.message || 'Failed to save service quotation.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong while saving the quotation.');
        }
    };

    const handleCancel = () => {
        setQuotationData({
            quotationNumber: '',
            companyId: '',
            productId: '',
            quantity: '',
            modeOfPayment: 'Cash',
            deliveryAddress: '',
            reference: '',
            description: '',
            status: 'draft',
            sendTo: []
        });
        setProductsInTable([]);
        setAvailableProducts([]); // Clear available products
        navigate('../ServiceQuotationList');
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
                Add Service Quotation
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <Grid container spacing={3}>
                    {/* <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="quotation Number"
                            name="quotationNumber"
                            value={quotationData.quotationNumber}
                            onChange={handleChange}
                            placeholder="Enter quotation Number"
                            size="small"
                            required
                        />
                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="company-label">Company</InputLabel>
                            <Select
                                labelId="company-label"
                                id="companyId"
                                name="companyId"
                                value={quotationData.companyId}
                                onChange={handleChange}
                                label="Company"
                                disabled={!!quotationId} // only disable in edit mode
                            >
                                <MenuItem value="">Select a Company</MenuItem>
                                {companies.map(comp => (
                                    <MenuItem key={comp._id} value={comp._id}>{comp.companyName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="product-name-label">Product Name</InputLabel>
                            <Select
                                labelId="product-name-label"
                                id="productId"
                                name="productId"
                                value={quotationData.productId}
                                onChange={handleChange}
                                label="Product Name"
                                disabled={!quotationData.companyId || availableProducts.length === 0}
                            >
                                <MenuItem value="">Select a Product</MenuItem>
                                {availableProducts.map(prod => (
                                    <MenuItem key={prod._id} value={prod._id}>{prod.productName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Quantity"
                            name="quantity"
                            type="number"
                            value={quotationData.quantity}
                            onChange={handleChange}
                            placeholder="Enter Quantity"
                            size="small"
                            disabled={!quotationData.productId}
                        />
                    </Grid>
                    {/* <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="mode-of-payment-label">Mode Of Payment</InputLabel>
                            <Select
                                labelId="mode-of-payment-label"
                                id="modeOfPayment"
                                name="modeOfPayment"
                                value={quotationData.modeOfPayment}
                                onChange={handleChange}
                                label="Mode Of Payment"
                            >
                                <MenuItem value="">Select a Mode Of Payment</MenuItem>
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Card">Card</MenuItem>
                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                <MenuItem value="UPI">UPI</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                        {/* <TextField
                            fullWidth
                            margin="normal"
                            name="deliveryAddress"
                            label="Delivery Address"
                            value={quotationData.deliveryAddress}
                            onChange={handleChange}
                            placeholder="Delivery Address"
                            size="small"
                        /> */}
                        <InputLabel id="delivery-address-label">Service / Delivery Address</InputLabel>
                        <Select
                            fullWidth
                            labelId="delivery-address-label"
                            id="deliveryAddress"
                            name="deliveryAddress"
                            value={quotationData.deliveryAddress}
                            onChange={handleChange}
                            label="Service / Delivery Address"
                        >
                            <MenuItem value="">Select Delivery Address</MenuItem>
                            {companyData?.serviceDeliveryAddresses?.map((result, index) => {
                                return (
                                    <MenuItem key={index} value={`${result.address} - ${result.pincode}`}>
                                        {`${result.address} - ${result.pincode}`}
                                    </MenuItem>
                                )
                            })}

                        </Select>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Reference"
                            name="reference"
                            value={quotationData.reference}
                            onChange={handleChange}
                            placeholder="Reference"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="send-to-label">Send To</InputLabel>
                            <Select
                                labelId="send-to-label"
                                id="sendTo"
                                name="sendTo"
                                multiple // Added multiple prop for multi-select
                                value={quotationData.sendTo}
                                onChange={handleChange}
                                label="Send To"
                                disabled={!quotationData.companyId || !companyData?.contactPersons?.length}
                                renderValue={(selected) => { // Render selected values
                                    const selectedNames = selected.map(email => {
                                        const person = companyData?.contactPersons?.find(p => p.email === email);
                                        return person ? person.name : email;
                                    });
                                    return selectedNames.join(', ');
                                }}
                            >
                                <MenuItem value="">Select a Contact Person</MenuItem>
                                {companyData?.contactPersons?.map((person, index) => (
                                    <MenuItem key={index} value={person.email}>
                                        {person.name} ({person.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Description"
                            name="description"
                            value={quotationData.description}
                            onChange={handleChange}
                            placeholder="description"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Button variant="contained" sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }} onClick={(e) => handleSubmit(e)}>
                        Submit
                    </Button>
                    <Button variant="contained" sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }} onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleAddProduct}
                        disabled={!quotationData.productId || !quotationData.quantity || quotationData.quantity <= 0}
                    >
                        Add Product to List
                    </Button>
                </Box>
            </Paper>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px' }}>
                <Table sx={{ minWidth: 650 }} aria-label="products table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                            <TableCell>S.No</TableCell>
                            <TableCell>Product Name</TableCell>
                            <TableCell>Sku</TableCell>
                            <TableCell>HSN</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Rate</TableCell>
                            <TableCell align="right">Total Amount</TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productsInTable.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No products added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            productsInTable.map((product, index) => (
                                <TableRow key={product.id}> {/* Use the unique 'id' as key */}
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.hsn}</TableCell>
                                    <TableCell align="right">{product.quantity}</TableCell>
                                    <TableCell align="right">{product.rate}</TableCell>
                                    <TableCell align="right">{product.totalAmount}</TableCell>
                                    <TableCell align="center">
                                        {/* Removed EditIcon IconButton */}
                                        <IconButton size="small" onClick={() => handleDeleteProduct(product.id)}> {/* Pass the unique 'id' to delete */}
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AddServiceQuotation;