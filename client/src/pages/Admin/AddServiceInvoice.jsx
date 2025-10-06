import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Select, // Keep Select for other dropdowns if any
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
    CircularProgress, // Import CircularProgress,
    Autocomplete
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
// Removed EditIcon import as it's no longer needed
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // <-- add useParams
import toast from 'react-hot-toast';
import axios from 'axios'; // Import axios
import { useAuth } from '../../context/auth';
import { cache } from 'react';

const AddServiceInvoice = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const { invoiceId, assignedTo } = useParams(); // <-- get invoiceId from URL
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const invoiceType = searchParams.get("invoiceType");
    const serviceId = searchParams.get("serviceId");
    const companyIdFromParams = searchParams.get("companyId"); // Renamed to avoid conflict
    const [invoices, setInvoices] = useState(null);
    // State for form fields
    const [invoiceData, setInvoiceData] = useState({
        companyId: (companyIdFromParams && companyIdFromParams !== 'null') ? companyIdFromParams : '', // Stores the _id of the selected company
        productId: '', // Stores the _id of the selected product for adding to table
        quantity: '', // Quantity for the product being added
        modeOfPayment: 'Cash',
        deliveryAddress: '',
        reference: '',
        description: '',
        // status: 'draft', // Removed Invoice Status
        sendTo: [] // Changed to an array for multi-select
    });

    const [companyData, setCompanyData] = useState(null)
    // State for products added to the table (these are the line items for the invoice)
    const [productsInTable, setProductsInTable] = useState([]);
    // States for dropdown data
    const [companies, setCompanies] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state for initial data

    useEffect(() => {
        fetchInvoicesCounts();
    }, [serviceId]);

    const fetchInvoicesCounts = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            if (data?.success) {
                setInvoices(data.commonDetails?.invoiceCount + 1 || 1);
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
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);


    useEffect(() => {

        if (auth?.token && invoiceData?.companyId && invoiceData?.companyId !== '') {
            console.log("Fetching company data and products for companyId:", invoiceData?.companyId); // Log the companyId being used t
            fetchCompanyData();
            fetchProductsByCompany();
        }
    }, [invoiceData?.companyId, auth?.token]);

    const fetchCompanyData = async () => {
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
                alert(data?.message || 'Failed to fetch company details.');
            }
        } catch (error) {
            console.error('Error fetching company details:', error);
            alert(error.response?.data?.message || 'Something went wrong while fetching company details.');
        }
    };

    const fetchProductsByCompany = async () => {
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
                alert(data?.message || 'Failed to fetch products for the selected company.');
                setAvailableProducts([]); // Clear products if fetch fails
            }
        } catch (error) {
            console.error("Error fetching products by company:", error);
            setAvailableProducts([]); // Clear products on error
        } finally {
            setLoading(false);
        }

    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInvoiceData(prevData => {
            const newData = { ...prevData, [name]: value };
            // If company changes, reset selected product and products in table
            if (name === 'companyId') {
                newData.productId = '';
                newData.quantity = '';
                setProductsInTable([]); // Clear products in table when company changes
                newData.sendTo = []; // Clear sendTo when company changes, ensure it's an array
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
            totalAmount: parseInt(invoiceData.quantity) * selectedProduct.totalAmount,
            otherProducts: invoiceData?.otherProducts,
            benefitQuantity: invoiceData?.benefitQuantity,
            reInstall: invoiceData?.reInstall,
        };

        setProductsInTable(prevProducts => [...prevProducts, newProduct]);
        // Clear product-related fields after adding
        setInvoiceData(prevData => ({
            ...prevData,
            productId: '',
            quantity: '',
            otherProducts: '',
            benefitQuantity: '',
            reInstall: '',
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
                            // status: invoice.status || '', // Removed Invoice Status
                            // Ensure sendTo is always an array
                            sendTo: Array.isArray(invoice.sendTo) ? invoice.sendTo : (invoice.sendTo ? [invoice.sendTo] : []),
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
        const { companyId, modeOfPayment, deliveryAddress, reference, description, sendTo } = invoiceData; // Removed status

        // Updated validation for sendTo (check if array is empty)
        if (!companyId || !modeOfPayment || !deliveryAddress || productsInTable.length === 0) {
            alert('Please fill all required fields and add at least one product.');
            return;
        }

        // Calculate subtotal, tax, and grandTotal
        const subtotal = productsInTable.reduce((sum, item) => sum + item.totalAmount, 0);
        const tax = 0;
        const grandTotal = subtotal + tax;

        const payload = {
            ...(!invoiceId && invoiceType !== "quotation" ? { invoiceNumber: invoices } : []),
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
            // status, // Removed status from payload
            sendTo, // sendTo is now an array
            assignedTo: employeeName,
            invoiceType,
            serviceId: serviceId,
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
                // try {
                //     const res = await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', {});
                //     console.log('Webhook successfully triggered.', res);
                // } catch (webhookError) {
                //     console.error('Error triggering webhook:', webhookError);
                //     toast.error('Failed to trigger webhook for external notification.');
                // }
                handleCancel(data.serviceInvoice);
            } else {
                alert(data?.message || 'Failed to save service invoice.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong while saving the invoice.');
        }
    };

    const handleUpdateInvoiceCount = async () => {
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details/increment-invoice`,
                {
                    invoiceCount: invoices,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                // Update the local state
                setInvoices(null);
            }
        } catch (error) {
            console.error('Error updating invoice count:', error);
        }
    }

    const handleCancel = (invoice) => {
        if (!invoiceId && invoiceType !== "quotation") {
            handleUpdateInvoiceCount()
            updateEmployeeBenefit(invoice)
            updateMatrialDta()
        }
        updateCommissionDetails(invoice);
        updateStausToService(serviceId, 'Completed');
        if (invoiceType === "quotation") {
            navigate('../ServiceQuotationList');
        } else {
            navigate('../serviceInvoiceList');
        }
    };

    const updateStausToService = async (serviceId, status) => {
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service/update/${serviceId}`,
                { status },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                alert(data.message || 'Status Updated successfully!');
            } else {
                alert(data?.message || 'Failed to Status Updated .');
            }
        } catch (err) {
            console.error('Error Status Updated :', err);
        }
    };

    const updateCommissionDetails = async (invoice) => {

        try {
            let totalCommissionAmount = 0;
            let percentageRate = 0; // Default or first product's commission percentage

            if (invoice?.products && invoice.products.length > 0) {
                // Calculate total commission amount by summing commissions from all products
                totalCommissionAmount = invoice.products.reduce((sum, product) => {
                    // Ensure productId and commission exist and are numbers
                    if (product.productId && typeof product.productId.commission === 'number') {
                        return sum + (product.totalAmount * (product.productId.commission / 100));
                    }
                    return sum;
                }, 0);

                // Set percentageRate from the first product's commission, if available.
                // Note: If products have different commission percentages, this single field
                // might not accurately reflect all product commissions.
                if (invoice.products[0].productId && typeof invoice.products[0].productId.commission === 'number') {
                    percentageRate = invoice.products[0].productId.commission;
                }
            }

            const apiParams = {
                commissionFrom: "Service",
                userId: invoice?.companyId?._id,
                serviceInvoiceId: invoice?._id,
                commissionAmount: totalCommissionAmount, // Calculated dynamically
                percentageRate: percentageRate, // Derived from first product's commission
            }
            const payment = await axios.post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/v1/commissions`,
                apiParams,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

        } catch (error) {
            console.log(error);
        }
    }
    const updateEmployeeBenefit = async (invoice) => {
        try {
            for (const product of productsInTable) {
                if (product.reInstall === true || product.otherProducts !== '') {
                    const apiParams = {
                        employeeId: invoice?.assignedTo?._id, // or employeeName if needed
                        invoiceId: invoice?._id,
                        productId: product.productId,
                        quantity: product.benefitQuantity,
                        reInstall: product.reInstall || false,
                        otherProducts: product.otherProducts || null,
                    };

                    const { data } = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-benefits`,
                        apiParams, // ✅ send object directly, not wrapped in { apiParams }
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );

                    if (data?.success) {
                        console.log("Benefit updated:", data.message);
                    }
                }
            }
            alert("All benefits updated successfully!");
        } catch (err) {
            console.error("Error updating benefit:", err);
        }
    };

    const updateMatrialDta = async () => {
        try {
            for (const product of productsInTable) {
                if (product.reInstall === true || product.otherProducts !== '') {
                    const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/materials/updateMaterial/${product.productName?.productName?.productName}`, {
                        name: product.productName?.productName?.productName,
                        unit: product.quantity,
                    });

                    if (data?.success) {
                        console.log("Benefit updated:", data.message);
                    }
                }
            }
            alert("All benefits updated successfully!");
        } catch (err) {
            console.error("Error updating benefit:", err);
        }
    }

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
                Add Service {invoiceType === "quotation" ? " Quotation" : "Invoice"}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <Grid container spacing={3}>
                    {/* <Grid item xs={12} sm={6}>
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
                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small" required>
                            {/* Replaced Select with Autocomplete for Company */}
                            <Autocomplete
                                id="companyId-autocomplete"
                                options={companies}
                                getOptionLabel={(option) => option.companyName || ''}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={companies.find(comp => comp._id === invoiceData.companyId) || null}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'companyId', value: newValue ? newValue._id : '' } });
                                }}
                                loading={loading} // Add loading prop
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Company"
                                        variant="outlined"
                                        size="small"
                                        required
                                        InputProps={{ // Add InputProps to show loader
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                disabled={invoiceId || invoiceData?.companyId ? true : false} // only disable in edit mode
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            {/* Replaced Select with Autocomplete for Product Name */}
                            <Autocomplete
                                id="productId-autocomplete"
                                options={availableProducts}
                                getOptionLabel={(option) => option.productName?.productName?.productName || ''}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={availableProducts.find(prod => prod._id === invoiceData.productId) || null}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'productId', value: newValue ? newValue._id : '' } });
                                }}
                                loading={loading} // Add loading prop
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Product Name"
                                        variant="outlined"
                                        size="small"
                                        InputProps={{ // Add InputProps to show loader
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                disabled={!invoiceData.companyId || availableProducts.length === 0}
                            />
                        </FormControl>
                        {invoiceData.productId && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel shrink htmlFor="rework-checkbox">Rework</InputLabel>
                                        <Select
                                            id="rework-checkbox"
                                            name="reInstall"
                                            value={invoiceData.reInstall || false}
                                            onChange={e => handleChange({ target: { name: 'reInstall', value: e.target.value } })}
                                            disabled={invoiceData.otherProducts}
                                        >
                                            <MenuItem value={false}>No</MenuItem>
                                            <MenuItem value={true}>Yes</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Other Product"
                                        name="otherProducts"
                                        value={invoiceData.otherProducts || ''}
                                        onChange={handleChange}
                                        placeholder="Specify other product if any"
                                        size="small"
                                        disabled={invoiceData.reInstall}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        margin="normal"
                                        label="Quantity"
                                        name="benefitQuantity"
                                        type="number"
                                        value={invoiceData.benefitQuantity}
                                        onChange={handleChange}
                                        placeholder="Enter Quantity"
                                        size="small"
                                        disabled={!invoiceData.productId}
                                    />
                                </Grid>
                            </Grid>
                        )}
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
                    {/* Add Rework, Other Product, and Quantity fields below product selection */}

                    {/* <Grid item xs={12} sm={6}>
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
                    </Grid> */}
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
                            <InputLabel id="send-to-label">Send To</InputLabel>
                            <Select
                                labelId="send-to-label"
                                id="sendTo"
                                name="sendTo"
                                multiple // Added multiple prop for multi-select
                                value={invoiceData.sendTo}
                                onChange={handleChange}
                                label="Send To"
                                disabled={!invoiceData.companyId || !companyData?.contactPersons?.length}
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
                    <Button variant="contained" sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }} onClick={() => handleCancel()}>
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
                            productsInTable?.map((product, index) => (
                                <TableRow key={product.id}> {/* Use the unique 'id' as key */}
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{product?.productName?.productName?.productName}</TableCell>
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