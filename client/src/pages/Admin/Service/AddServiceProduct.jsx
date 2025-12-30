import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography,
    Box, // Added for rendering multiple chips
    Chip, // Added for rendering multiple chips
    Autocomplete, // Added for searchable dropdown
    CircularProgress // Added for loading indicator
} from '@mui/material';
import { useAuth } from '../../../context/auth';

const AddServiceProduct = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const product_id = searchParams.get('product_id');
    const { auth, isAdmin } = useAuth();
    const [company, setCompany] = useState('');
    const [productName, setProductName] = useState(''); // This will now store the _id of the selected product
    const [sku, setSku] = useState('');
    const [hsn, setHsn] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [rate, setRate] = useState('');
    const [gstTypeIds, setGstTypeIds] = useState([]); // Changed to array for multiple selection
    const [totalAmount, setTotalAmount] = useState(0);
    const [commission, setCommission] = useState(''); // New state for commission

    const [companies, setCompanies] = useState([]);
    const [gstOptions, setGstOptions] = useState([]); // Stores GST types with their percentages
    const [purchaseProducts, setPurchaseProducts] = useState([]); // New state for products from purchases API
    const [loadingProducts, setLoadingProducts] = useState(false); // New state for product loading
    const [loadingCompanies, setLoadingCompanies] = useState(false); // New state for company loading
    const [companyPage, setCompanyPage] = useState(1);
    const [companyTotalCount, setCompanyTotalCount] = useState(0);
    const [loadingMoreCompanies, setLoadingMoreCompanies] = useState(false);
    const [companySearch, setCompanySearch] = useState('');
    const isInitialMount = useRef(true);
    // Fetch companies and GST options on component mount
    useEffect(() => {
        fetchCompanies(1, false); // Load first 10 companies
        fetchGstOptions();
        fetchPurchaseProducts(); // Fetch purchase products on mount
    }, []);

    // Debounced search effect
    useEffect(() => {
        // Skip on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const searchTimer = setTimeout(() => {
            // Reset to page 1 when search changes
            fetchCompanies(1, false, companySearch);
        }, 500); // 500ms debounce

        return () => clearTimeout(searchTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companySearch]);

    // Load more companies in background after initial load (only when no search)
    useEffect(() => {
        if (!companySearch && companies.length > 0 && companies.length < companyTotalCount && companyPage === 1) {
            // Load next batch in background after a short delay (only after first page loads)
            const timer = setTimeout(() => {
                loadMoreCompanies();
            }, 500);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companies.length, companyTotalCount, companyPage, companySearch]);

    // Fetch product data if editing
    useEffect(() => {
        if (product_id) {
            fetchProduct(product_id);
        }
    }, [product_id]);

    // Calculate total amount whenever quantity, rate, or GST changes
    useEffect(() => {
        calculateTotalAmount();
    }, [quantity, rate, gstTypeIds, gstOptions]); // Depend on gstTypeIds (array)

    const fetchCompanies = async (page = 1, append = false, search = '') => {
        if (!append) {
            setLoadingCompanies(true);
        }
        try {
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?page=${page}&limit=10${searchParam}`, {
                headers: {
                    Authorization: auth?.token,
                },
            });
            if (data?.success) {
                if (append) {
                    setCompanies(prev => [...prev, ...(data.companies || [])]);
                } else {
                    setCompanies(data.companies || []);
                }
                setCompanyTotalCount(data.totalCount || 0);
                setCompanyPage(page);
            } else {
                if (!append) {
                    toast.error(data?.message || 'Failed to fetch companies.');
                }
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            if (!append) {
                setCompanies([]);
            }
        } finally {
            if (!append) {
                setLoadingCompanies(false);
            }
        }
    };

    // Load more companies in background
    const loadMoreCompanies = async () => {
        if (loadingMoreCompanies || companies.length >= companyTotalCount) return;
        
        setLoadingMoreCompanies(true);
        try {
            const nextPage = companyPage + 1;
            await fetchCompanies(nextPage, true, companySearch);
        } catch (error) {
            console.error('Error loading more companies:', error);
        } finally {
            setLoadingMoreCompanies(false);
        }
    };

    const fetchGstOptions = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst`); // Reusing the GST endpoint
            if (data?.success) {
                setGstOptions(data.gst);
            } else {
                toast.error(data?.message || 'Failed to fetch GST options.');
            }
        } catch (error) {
            console.error('Error fetching GST options:', error);
            toast.error('Something went wrong while fetching GST options.');
            // Mock data for development
            setGstOptions([]);
        }
    };
    // New function to fetch products from the purchases API
    const fetchPurchaseProducts = async () => {
        setLoadingProducts(true);
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/purchases${auth?.user !== 1 ? '' :`?category=${auth?.user?.department}`}`, {
                headers: {
                    Authorization: auth?.token,
                },
            });
            if (data?.success) {
                const uniqueProductsMap = new Map();
                data.purchases.forEach(purchase => {
                    // Ensure product exists, has an ID, productCode, and productCode is a non-empty string
                    if (purchase.productName && typeof purchase.productName.productCode === 'string' && purchase.productName.productCode.length > 0) {
                        // Use productCode as the key to group by productCode
                        // If multiple purchases have the same productCode, we only add one entry for that productCode.
                        // The value stored will be the product definition object.
                        if (!uniqueProductsMap.has(purchase.productName.productCode)) {
                            uniqueProductsMap.set(purchase.productName.productCode, purchase);
                        }
                    }
                });
                // Convert map values to an array of unique product definition objects
                setPurchaseProducts(Array.from(uniqueProductsMap.values()));
            } else {
                console.error(data?.message || 'Failed to fetch purchase products.');
            }
        } catch (error) {
            console.error('Error fetching purchase products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchProduct = async (productId) => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/${productId}`);
            if (data?.success) {
                const product = data.serviceProduct;
                setCompany(product.company._id); // Assuming company is populated
                setProductName(product.productName?._id || ''); // Set productName to the _id of the product
                setSku(product.sku);
                setHsn(product.hsn);
                setQuantity(product.quantity);
                setRate(product.rate);
                setCommission(product.commission || ''); // Populate commission field
                // Set gstTypeIds from the fetched product data
                // Assuming product.gstType is an array of populated GST objects or just IDs
                setGstTypeIds(Array.isArray(product.gstType) ? product.gstType.map(g => typeof g === 'object' ? g._id : g) : []);
            } else {
                toast.error(data?.message || 'Failed to fetch product details.');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Something went wrong while fetching product details.');
        }
    };

    const calculateTotalAmount = () => {
        const currentRate = parseFloat(rate) || 0;
        const currentQuantity = parseInt(quantity) || 0;
        let totalGstPercentage = 0; // Sum of all selected GST percentages

        if (gstTypeIds.length > 0 && gstOptions.length > 0) {
            gstTypeIds.forEach(id => {
                const selectedGst = gstOptions.find(gst => gst._id === id);
                if (selectedGst) {
                    totalGstPercentage += selectedGst.gstPercentage;
                }
            });
        }

        const subTotal = currentRate * currentQuantity;
        const gstAmount = subTotal * (totalGstPercentage / 100);
        setTotalAmount((subTotal + gstAmount).toFixed(2)); // Format to 2 decimal places
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Updated validation for gstTypeIds (check if array is empty)
        // Commission is only required for admin users
        if (!company || !productName || !hsn || !quantity || !rate || gstTypeIds.length === 0 || (isAdmin && commission === '')) {
            toast.error('Please fill in all required fields.');
            return;
        }

        try {
            const productData = {
                company,
                productName, // productName is now the _id
                sku: sku ? sku : `${productName}-${hsn}-${quantity}-${rate}-${gstTypeIds.join('-')}${isAdmin ? `-${commission}` : ''}`,
                hsn,
                quantity: parseInt(quantity),
                rate: parseFloat(rate),
                gstType: gstTypeIds, // Send the array of IDs
                totalAmount: parseFloat(totalAmount),
                ...(isAdmin && { commission: parseFloat(commission) }), // Add commission to payload only for admin
            };

            if (product_id) {
                // Update existing product
                const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/${product_id}`, productData);
                if (data?.success) {
                    toast.success(data.message || 'Product updated successfully!');
                    handleCancel() // Navigate to list page
                } else {
                    toast.error(data?.message || 'Failed to update product.');
                }
            } else {
                // Add new product
                const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products`, productData);
                if (data?.success) {
                    toast.success(data.message || 'Product added successfully!');
                    // Clear form or navigate
                    setCompany('');
                    setProductName('');
                    setSku('');
                    setHsn('');
                    setQuantity(1);
                    setRate('');
                    setGstTypeIds([]); // Clear selected GST types
                    setTotalAmount(0);
                    setCommission(''); // Clear commission
                } else {
                    toast.error(data?.message || 'Failed to add product.');
                }
            }
        } catch (error) {
            console.error('Error submitting product:', error);
            alert(error?.response?.data?.message || 'Something went wrong.');
        }
    };

    const handleCancel = () => {
        navigate('../serviceProductList'); // Navigate back to the list or dashboard
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">{product_id ? 'Edit Product' : 'Add Product'}</h1>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('../serviceProductList')}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    View Product
                </Button>
            </div>

            <Paper className="p-6 shadow-md">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Replaced FormControl with Autocomplete for Company */}
                    <Autocomplete
                        options={companies}
                        getOptionLabel={(option) => option.companyName || ''}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={companies.find(c => c._id === company) || null} // Find the object based on stored ID for display
                        onChange={(event, newValue) => {
                            setCompany(newValue ? newValue._id : ''); // Set the _id to state
                        }}
                        onInputChange={(event, newInputValue) => {
                            setCompanySearch(newInputValue);
                        }}
                        onOpen={() => {
                            // Load more companies when dropdown opens if needed (only if no search)
                            if (!companySearch && companies.length < companyTotalCount && !loadingMoreCompanies) {
                                loadMoreCompanies();
                            }
                        }}
                        loading={loadingCompanies || loadingMoreCompanies}
                        ListboxProps={{
                            onScroll: (e) => {
                                const { target } = e;
                                // Load more when user scrolls near bottom
                                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 50) {
                                    if (companies.length < companyTotalCount && !loadingMoreCompanies) {
                                        loadMoreCompanies();
                                    }
                                }
                            },
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Company"
                                placeholder="Search Company"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {(loadingCompanies || loadingMoreCompanies) ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        fullWidth
                    />

                    {/* Replaced TextField with Autocomplete for Product Name */}
                    <Autocomplete
                        options={purchaseProducts}
                        // Display both product name and product code
                        getOptionLabel={(option) => `${option?.productName?.productName || ''}`}
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        // Find the product definition object based on the stored product ID for display
                        value={purchaseProducts.find(p => p._id === productName) || null}
                        onChange={(event, newValue) => {
                            // Set the _id of the selected product definition to state
                            setProductName(newValue ? newValue._id : '');
                        }}
                        loading={loadingProducts}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Product Name"
                                placeholder="Search Product Name"
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        fullWidth
                    />

                    {/* <TextField
                        label="SKU"
                        placeholder="Enter Sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    /> */}

                    <TextField
                        label="HSN"
                        placeholder="Enter HSN"
                        value={hsn}
                        onChange={(e) => setHsn(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    />

                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{ min: 1 }}
                    />

                    <TextField
                        label="Rate"
                        type="number"
                        placeholder="Enter Rate"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                        inputProps={{ step: "0.01" }}
                    />

                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="gst-type-label">GST Type</InputLabel>
                        <Select
                            labelId="gst-type-label"
                            multiple // Allow multiple selections
                            value={gstTypeIds} // Use the array state
                            onChange={(e) => setGstTypeIds(e.target.value)} // Update the array state
                            label="GST Type"
                            renderValue={(selected) => ( // Render selected items as chips
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const selectedGst = gstOptions.find(gst => gst._id === value);
                                        return selectedGst ? <Chip key={value} label={`${selectedGst.gstType} (${selectedGst.gstPercentage}%)`} /> : null;
                                    })}
                                </Box>
                            )}
                        >
                            {/* No "Select a GST Type" option for multiple select */}
                            {gstOptions.map((gst) => (
                                <MenuItem key={gst._id} value={gst._id}>
                                    {gst.gstType} ({gst.gstPercentage}%)
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {isAdmin && (
                        <TextField
                            label="Commission"
                            type="number"
                            placeholder="Enter Commission"
                            value={commission}
                            onChange={(e) => setCommission(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            inputProps={{ step: "0.01" }}
                        />
                    )}

                    <TextField
                        label="Total Amount"
                        value={totalAmount}
                        fullWidth
                        variant="outlined"
                        size="small"
                        InputProps={{
                            readOnly: true,
                        }}
                    />

                    <div className="md:col-span-2 flex justify-start gap-3 mt-4">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            Submit
                        </Button>
                        <Button
                            type="button"
                            variant="contained"
                            color="error"
                            onClick={handleCancel}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Paper>
        </div>
    );
};

export default AddServiceProduct;