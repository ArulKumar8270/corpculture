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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
// Removed EditIcon import as it's no longer needed
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // <-- add useParams
import toast from 'react-hot-toast';
import axios from 'axios'; // Import axios
import { useAuth } from '../../context/auth';

const AddServiceInvoice = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { invoiceId, assignedTo } = useParams(); // <-- get invoiceId from URL
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");

    // State for form fields
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '', // New field for invoice number
        companyId: '', // Stores the _id of the selected company
        productId: '', // Stores the _id of the selected product for adding to table
        quantity: '', // Quantity for the product being added
        modeOfPayment: '',
        deliveryAddress: '',
        reference: '',
        description: '',
        status: 'draft'
    });

    const [companyData, setCompanyData] = useState(null)
    // State for products added to the table (these are the line items for the invoice)
    const [productsInTable, setProductsInTable] = useState([]);
    // States for dropdown data
    const [companies, setCompanies] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state for initial data

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
    }, []);


    useEffect(() => {
        const fetchCompanyData = async () => {
            if (invoiceData?.companyId) {
                try {
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${invoiceData?.companyId}`,
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
    }, [invoiceData?.companyId, auth?.token]);

    // Fetch products when companyId changes
    useEffect(() => {
        const fetchProductsByCompany = async () => {
            if (invoiceData.companyId) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/getServiceProductsByCompany/${invoiceData.companyId}`, {
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
    }, [invoiceData.companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prevData => {
            const newData = { ...prevData, [name]: value };
            // If company changes, reset selected product and products in table
            if (name === 'companyId') {
                newData.productId = '';
                newData.quantity = '';
                setProductsInTable([]); // Clear products in table when company changes
            }
            return newData;
        });
    };

    const handleAddProduct = () => {
        const selectedProduct = availableProducts.find(p => p._id === invoiceData.productId);

        if (!selectedProduct || !invoiceData.quantity || invoiceData.quantity <= 0) {
            toast.error('Please select a product and enter a valid quantity.');
            return;
        }
        const newProduct = {
            id: Date.now() + Math.random(), // Assign a unique ID for this table entry
            productId: selectedProduct._id, // Store the actual product ID from DB
            productName: selectedProduct.productName,
            sku: selectedProduct.sku,
            hsn: selectedProduct.hsn,
            quantity: parseInt(invoiceData.quantity),
            rate: selectedProduct.rate,
            totalAmount: parseInt(invoiceData.quantity) * selectedProduct.rate,
        };

        setProductsInTable(prevProducts => [...prevProducts, newProduct]);
        // Clear product-related fields after adding
        setInvoiceData(prevData => ({
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

    // Fetch invoice details if editing
    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            if (invoiceId) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/get/${invoiceId}`,
                        {
                            headers: { Authorization: auth.token },
                        }
                    );
                    if (data?.success) {
                        const invoice = data.serviceInvoice;
                        setInvoiceData({
                            invoiceNumber: invoice.invoiceNumber || '',
                            companyId: invoice.companyId?._id || invoice.companyId || '',
                            productId: '', // Will be set when adding new products
                            quantity: '',
                            modeOfPayment: invoice.modeOfPayment || '',
                            // Convert deliveryAddress object to string if it's an object
                            deliveryAddress: typeof invoice.deliveryAddress === 'object' && invoice.deliveryAddress !== null
                                ? `${invoice.deliveryAddress.address} - ${invoice.deliveryAddress.pincode}`
                                : invoice.deliveryAddress || '',
                            reference: invoice.reference || '',
                            description: invoice.description || '',
                            status: invoice.status || '',
                        });
                        // Map products to table format with unique id
                        setProductsInTable(
                            (invoice.products || []).map((p, idx) => ({
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
                        toast.error(data?.message || 'Failed to fetch invoice details.');
                    }
                } catch (error) {
                    toast.error('Error fetching invoice details.');
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchInvoiceDetails();
        // eslint-disable-next-line
    }, [invoiceId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { invoiceNumber, companyId, modeOfPayment, deliveryAddress, reference, description, status } = invoiceData;

        if (!invoiceNumber || !companyId || !modeOfPayment || !deliveryAddress || productsInTable.length === 0) {
            toast.error('Please fill all required fields and add at least one product.');
            return;
        }

        // Calculate subtotal, tax, and grandTotal
        const subtotal = productsInTable.reduce((sum, item) => sum + item.totalAmount, 0);
        const tax = 0;
        const grandTotal = subtotal + tax;

        const payload = {
            invoiceNumber,
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
            assignedTo : employeeName
        };

        try {
            let data;
            if (invoiceId) {
                // Update existing invoice
                const res = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoiceId}`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                data = res.data;
            } else {
                // Create new invoice
                const res = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/create`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                data = res.data;
            }
            if (data?.success) {
                handleCancel();
            } else {
                alert (data?.message || 'Failed to save service invoice.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong while saving the invoice.');
        }
    };

    const handleCancel = () => {
        setInvoiceData({
            invoiceNumber: '',
            companyId: '',
            productId: '',
            quantity: '',
            modeOfPayment: '',
            deliveryAddress: '',
            reference: '',
            description: '',
            status: 'draft'
        });
        setProductsInTable([]);
        setAvailableProducts([]); // Clear available products
        navigate('../serviceInvoiceList');
    };

    const handleUploadSignedInvoice = () => {
        // Implement file upload logic
        toast.info('Upload Signed Invoice (placeholder)!');
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
                Add Service Invoice
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Invoice Number"
                            name="invoiceNumber"
                            value={invoiceData.invoiceNumber}
                            onChange={handleChange}
                            placeholder="Enter Invoice Number"
                            size="small"
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="company-label">Company</InputLabel>
                            <Select
                                labelId="company-label"
                                id="companyId"
                                name="companyId"
                                value={invoiceData.companyId}
                                onChange={handleChange}
                                label="Company"
                                disabled={!!invoiceId} // only disable in edit mode
                            >
                                <MenuItem value="">Select a Company</MenuItem>
                                {companies.map(comp => (
                                    <MenuItem key={comp._id} value={comp._id}>
                                        {comp.companyName}
                                    </MenuItem>
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
                                value={invoiceData.productId}
                                onChange={handleChange}
                                label="Product Name"
                                disabled={!invoiceData.companyId || availableProducts.length === 0}
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
                            value={invoiceData.quantity}
                            onChange={handleChange}
                            placeholder="Enter Quantity"
                            size="small"
                            disabled={!invoiceData.productId}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="mode-of-payment-label">Mode Of Payment</InputLabel>
                            <Select
                                labelId="mode-of-payment-label"
                                id="modeOfPayment"
                                name="modeOfPayment"
                                value={invoiceData.modeOfPayment}
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
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        {/* <TextField
                            fullWidth
                            margin="normal"
                            name="deliveryAddress"
                            label="Delivery Address"
                            value={invoiceData.deliveryAddress}
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
                            value={invoiceData.deliveryAddress}
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
                            value={invoiceData.reference}
                            onChange={handleChange}
                            placeholder="Reference"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            <InputLabel id="payment-status-label">Invoice Status</InputLabel>
                            <Select
                                labelId="payment-status-label"
                                id="status"
                                name="status"
                                value={invoiceData.status}
                                label="Payment Status"
                                onChange={handleChange}
                            >
                                <MenuItem value="InvoiceSent">Invoice Sent</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Progress">In Progress</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Description"
                            name="description"
                            value={invoiceData.description}
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
                        disabled={!invoiceData.productId || !invoiceData.quantity || invoiceData.quantity <= 0}
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

export default AddServiceInvoice;