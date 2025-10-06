import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import {
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Box, Typography, InputAdornment,
    CircularProgress // Added for loading indicator
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

// Icons based on the image
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // For date pickers
import DescriptionIcon from '@mui/icons-material/Description'; // For product name, narration
import ReceiptIcon from '@mui/icons-material/Receipt'; // For invoice number
import LockIcon from '@mui/icons-material/Lock'; // For GSTIN/UN
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'; // For quantity
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'; // For rate, price, freight, gross total, round off
import CategoryIcon from '@mui/icons-material/Category'; // For voucher type

const PurchaseRegister = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL parameters
    const [loading, setLoading] = useState(false); // Loading state for form submission/data fetch

    // Form states
    const [vendorCompanyName, setVendorCompanyName] = useState('');
    const [productName, setProductName] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [voucherType, setVoucherType] = useState('Purchase'); // Default as per image
    const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState('');
    const [gstinUn, setGstinUn] = useState('');
    // Removed: narration
    const [purchaseDate, setPurchaseDate] = useState(dayjs()); // Default to current date
    const [quantity, setQuantity] = useState('');
    const [rate, setRate] = useState('');
    // Dropdown options (mock data for now, replace with actual API calls)
    const [vendorCompanies, setVendorCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [gstOptions, setGstOptions] = useState([]);
    const voucherTypes = ['Purchase', 'Return', 'Other']; // Example voucher types

    // Function to fetch products by vendor ID
    const fetchVendorProducts = async (vendorId) => {
        if (!vendorId) {
            setProducts([]); // Clear products if no vendor is selected
            return;
        }
        try {
            const productsRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products/getProductsByVendorId/${vendorId}`);
            if (productsRes.data?.success) {
                setProducts(productsRes.data.vendorProducts);
            } else {
                toast.error(productsRes.data?.message || 'Failed to fetch products for the selected vendor.');
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            toast.error('Something went wrong while fetching vendor products.');
            setProducts([]);
        }
    };

    useEffect(() => {
        // Fetch data for dropdowns (vendors, GST options, and categories)
        const fetchData = async () => {
            try {
                // Fetch Vendor Companies
                const vendorsRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`);
                if (vendorsRes.data?.success) {
                    setVendorCompanies(vendorsRes.data.vendors);
                } else {
                    toast.error(vendorsRes.data?.message || 'Failed to fetch vendor companies.');
                }
            } catch (error) {
                console.error('Error fetching initial data:', error);
                toast.error('Something went wrong while fetching initial data.');
                setVendorCompanies([]);
            }
        };
        fetchData();
    }, []);

    // Effect to load purchase data if in edit mode
    useEffect(() => {
        if (id) {
            setLoading(true);
            const fetchPurchaseData = async () => {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases/${id}`);
                    if (data?.success) {
                        const purchase = data.purchase;
                        setVendorCompanyName(purchase.vendorCompanyName?._id || '');
                        // After setting vendorCompanyName, fetch products for that vendor
                        if (purchase.vendorCompanyName?._id) {
                            await fetchVendorProducts(purchase.vendorCompanyName._id);
                        }
                        setProductName(purchase.productName || '');
                        setSelectedProductId(purchase.productName?._id || '');
                        setVoucherType(purchase.voucherType || 'Purchase');
                        setPurchaseInvoiceNumber(purchase.purchaseInvoiceNumber || '');
                        setPurchaseDate(purchase.purchaseDate ? dayjs(purchase.purchaseDate) : dayjs());
                        setQuantity(purchase.quantity || '');
                        setRate(purchase.rate || '');
                    } else {
                        navigate('../purchaseList'); // Redirect if not found
                    }
                } catch (error) {
                    console.error('Error fetching purchase for edit:', error);
                    navigate('../purchaseList'); // Redirect on error
                } finally {
                    setLoading(false);
                }
            };
            fetchPurchaseData();
        }
    }, [id, navigate]); // Depend on 'id' and 'navigate'

    // Effect to fetch products when vendorCompanyName changes
    useEffect(() => {
        if (vendorCompanyName) {
            fetchVendorProducts(vendorCompanyName);
        } else {
            setProducts([]); // Clear products if vendorCompanyName is cleared
        }
        setProductName(''); // Reset product name when vendor changes
        setSelectedProductId('')
        setRate(''); // Clear rate when vendor changes
    }, [vendorCompanyName]);

    // Effect to set rate based on selected product's pricePerQuantity
    useEffect(() => {
        if (productName && products.length > 0) {
            const selectedProduct = products.find(p => p._id === productName?._id);
            if (selectedProduct && selectedProduct.pricePerQuantity !== undefined) {
                setRate(selectedProduct.pricePerQuantity.toString());
                setGstOptions(selectedProduct.gstType || []);
            } else {
                setRate(''); // Clear rate if product not found or price not available
            }
        } else {
            setRate(''); // Clear rate if no product selected
        }
    }, [productName, products]); // Depend on productName and products list

    // Calculations for Price, GST Amount, and Gross Total
    const parsedQuantity = parseFloat(quantity) || 0;
    const parsedRate = parseFloat(rate) || 0;
    const calculatedPrice = parsedQuantity * parsedRate;

    const totalGstPercentage = Array.isArray(gstOptions) && gstOptions.length > 0
        ? gstOptions.reduce((sum, option) => sum + parseFloat(option.gstPercentage || 0), 0)
        : 0;
    const calculatedGstAmount = calculatedPrice * (totalGstPercentage / 100);
    const calculatedGrossTotal = calculatedPrice + calculatedGstAmount;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation (removed freightCharges, grossTotal, roundOff, price as they are calculated)
        // Removed !narration from validation
        if (!vendorCompanyName || !productName || !voucherType || !purchaseInvoiceNumber || !purchaseDate || !quantity || !rate) {
            alert('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        const purchaseData = {
            vendorCompanyName,
            productName: productName?._id || '',
            voucherType,
            purchaseInvoiceNumber,
            purchaseDate: purchaseDate ? purchaseDate.toISOString() : null,
            quantity: parsedQuantity,
            rate: parsedRate,
            // Use calculated values for price and grossTotal
            price: calculatedPrice,
            grossTotal: calculatedGrossTotal
        };

        try {
            let response;
            if (id) {
                // Update existing purchase
                response = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases/${id}`, purchaseData);
            } else {
                // Create new purchase
                response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases`, purchaseData);
            }

            if (response.data?.success) {
                // Call the new API to update or create material
                let materialResponse = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/materials/update-or-create`, {
                    name: productName.productName,
                    unit: purchaseData.quantity,
                });
                if (materialResponse.data?.success) {
                    alert('Material entry updated/created successfully');
                } else {
                    alert(materialResponse.data?.message || 'Failed to update/create material entry.');
                }
                alert(response.data.message || `Purchase ${id ? 'updated' : 'registered'} successfully!`);

                // Clear form fields after successful submission if creating new
                if (!id) {
                    setVendorCompanyName('');
                    setProductName('');
                    setSelectedProductId('')
                    setVoucherType('Purchase');
                    setPurchaseInvoiceNumber('');
                    setGstinUn('');
                    // Removed: setNarration('');
                    setGstType([]);
                    setPurchaseDate(dayjs());
                    setQuantity('');
                    setRate('');
                    setCategory(''); // Clear category after submission
                    navigate('../purchaseList');
                } else {
                    // Optionally navigate back to list or view page after update
                    navigate('../purchaseList');
                }
            } else {
                toast.error(response.data?.message || `Failed to ${id ? 'update' : 'register'} purchase.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'registering'} purchase:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPurchases = () => {
        navigate('../purchaseList');
    };

    if (loading && id) { // Show loading spinner only when fetching existing data
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <Paper className="p-0 shadow-md mb-6">
                <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-t-lg">
                    <Typography variant="h6" className="font-semibold">
                        {id ? 'Edit Purchase Entry' : 'Purchase Register'} {/* Dynamic title */}
                    </Typography>
                    <Button
                        variant="contained"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
                        onClick={handleViewPurchases}
                    >
                        View Purchases
                    </Button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Vendor Company Name</InputLabel>
                                <Select
                                    value={vendorCompanyName}
                                    onChange={(e) => {
                                        setVendorCompanyName(e.target.value);
                                        setProductName(''); // Clear product when vendor changes
                                        setSelectedProductId('')
                                    }}
                                    label="Vendor Company Name"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <CalendarTodayIcon /> {/* Icon as per image */}
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>--select Company Name--</em>
                                    </MenuItem>
                                    {vendorCompanies.map((vendor) => (
                                        <MenuItem key={vendor._id} value={vendor._id}>{vendor.companyName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Product Name</InputLabel>
                                <Select
                                    value={selectedProductId || ''}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    label="Product Name"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <DescriptionIcon /> {/* Icon as per image */}
                                        </InputAdornment>
                                    }
                                    disabled={!vendorCompanyName} // Disable if no vendor is selected
                                >
                                    <MenuItem value="">
                                        <em>--select Product Name--</em>
                                    </MenuItem>
                                    {products?.map((product) => (
                                        <MenuItem key={product._id} value={product._id}>{product.productName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Voucher Type</InputLabel>
                                <Select
                                    value={voucherType}
                                    onChange={(e) => setVoucherType(e.target.value)}
                                    label="Voucher Type"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <CategoryIcon /> {/* Icon as per image */}
                                        </InputAdornment>
                                    }
                                >
                                    {voucherTypes.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Purchase Invoice Number"
                                value={purchaseInvoiceNumber}
                                onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <ReceiptIcon /> {/* Icon as per image */}
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Removed Narration TextField */}
                            {/* <TextField
                                label="Narration"
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <DescriptionIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            /> */}
                            <div className="col-span-1"></div> {/* Empty div for layout */}
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Purchase Date"
                                    value={purchaseDate}
                                    onChange={(newValue) => setPurchaseDate(newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <CalendarTodayIcon />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>

                            <TextField
                                label="Quantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <ShoppingCartIcon /> {/* Icon as per image */}
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 0 }
                                }}
                            />
                            <TextField
                                label="Rate"
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: "0.01" }
                                }}
                            />

                            {/* Price field - now read-only and calculated */}
                            <TextField
                                label="Price (Calculated)"
                                type="number"
                                value={calculatedPrice.toFixed(2)} // Display calculated value
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    readOnly: true, // Make it read-only
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                            {/* Gross Total field - now read-only and calculated */}
                            <TextField
                                label="Gross Total (Calculated)"
                                type="number"
                                value={calculatedGrossTotal.toFixed(2)} // Display calculated value
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    readOnly: true, // Make it read-only
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />

                            {/* Removed Freight Charges and Round Off fields */}
                            {/* <TextField
                                label="Freight Charges"
                                type="number"
                                value={freightCharges}
                                onChange={(e) => setFreightCharges(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { min: 0, step: "0.01" }
                                }}
                            /> */}
                            {/* <TextField
                                label="Round Off"
                                type="number"
                                value={roundOff}
                                onChange={(e) => setRoundOff(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                    inputProps: { step: "0.01" } // Can be negative for rounding down
                                }}
                            /> */}
                        </div>

                        <div className="flex justify-start mt-6">
                            <Button
                                type="submit"
                                variant="contained"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md"
                                disabled={loading} // Disable button while loading
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : (id ? 'Update' : 'Register')} {/* Dynamic button text */}
                            </Button>
                        </div>
                    </form>
                </div>
            </Paper>
        </div>
    );
};

export default PurchaseRegister;