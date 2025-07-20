import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Import useParams
import {
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography, InputAdornment
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event'; // Calendar icon for Vendor Company Name
import DescriptionIcon from '@mui/icons-material/Description'; // Document icon for Product Name and Price
import CalculateIcon from '@mui/icons-material/Calculate'; // Calculator icon for GST Type

const AddVendorProduct = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('product_id');
    // Form states
    const [vendorCompanyName, setVendorCompanyName] = useState('');
    const [productName, setProductName] = useState('');
    const [gstType, setGstType] = useState('');
    const [pricePerQuantity, setPricePerQuantity] = useState('');

    // Dropdown options
    const [vendorCompanies, setVendorCompanies] = useState([]);
    const [gstOptions, setGstOptions] = useState([]);

    useEffect(() => {
        // Fetch vendor companies
        const fetchVendorCompanies = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`);
                if (data?.success) {
                    setVendorCompanies(data.vendors);
                } else {
                    toast.error(data?.message || 'Failed to fetch vendor companies.');
                }
            } catch (error) {
                console.error('Error fetching vendor companies:', error);
                toast.error('Something went wrong while fetching vendor companies.');
            }
        };

        // Fetch GST options
        const fetchGstOptions = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst`);
                if (data?.success) {
                    setGstOptions(data.gst);
                } else {
                    toast.error(data?.message || 'Failed to fetch GST options.');
                }
            } catch (error) {
                console.error('Error fetching GST options:', error);
                toast.error('Something went wrong while fetching GST options.');
            }
        };

        fetchVendorCompanies();
        fetchGstOptions();
    }, []);

    // Effect to fetch product data if in edit mode
    useEffect(() => {
        if (id) {
            const fetchVendorProduct = async () => {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products/${id}`);
                    if (data?.success) {
                        const product = data.vendorProduct;
                        setVendorCompanyName(product.vendorCompanyName._id || ''); // Assuming it's populated
                        setProductName(product.productName || '');
                        setGstType(product.gstType._id || ''); // Assuming it's populated
                        setPricePerQuantity(product.pricePerQuantity.toString() || '');
                    } else {
                        toast.error(data?.message || 'Failed to fetch vendor product details.');
                        handleViewProducts(); // Redirect if product not found
                    }
                } catch (error) {
                    console.error('Error fetching vendor product:', error);
                    toast.error('Something went wrong while fetching vendor product details.');
                    handleViewProducts(); // Redirect on error
                }
            };
            fetchVendorProduct();
        }
    }, [id, navigate]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!vendorCompanyName || !productName || !gstType || !pricePerQuantity) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const productData = {
            vendorCompanyName,
            productName,
            gstType,
            pricePerQuantity: parseFloat(pricePerQuantity),
        };

        try {
            let response;
            if (id) {
                // Update existing vendor product
                response = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products/${id}`, productData);
            } else {
                // Create new vendor product
                response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendor-products`, productData);
            }

            if (response.data?.success) {
                toast.success(response.data.message || `Product ${id ? 'updated' : 'registered'} successfully!`);
                // Clear form fields only if creating a new product
                if (!id) {
                    setVendorCompanyName('');
                    setProductName('');
                    setGstType('');
                    setPricePerQuantity('');
                }
                handleViewProducts(); // Navigate to product list after success
            } else {
                toast.error(response.data?.message || `Failed to ${id ? 'update' : 'register'} product.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'registering'} product:`, error);
            toast.error('Something went wrong. Please try again.');
        }
    };

    const handleViewProducts = () => {
        navigate('../vendorProductList'); // Navigate to a product list page
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <Paper className="p-0 shadow-md mb-6">
                <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-t-lg">
                    <Typography variant="h6" className="font-semibold">
                        {id ? 'Edit Product' : 'Product Register'} {/* Dynamic Title */}
                    </Typography>
                    <Button
                        variant="contained"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
                        onClick={handleViewProducts}
                    >
                        View Products
                    </Button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>Vendor Company Name</InputLabel>
                                <Select
                                    value={vendorCompanyName}
                                    onChange={(e) => setVendorCompanyName(e.target.value)}
                                    label="Vendor Company Name"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <EventIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select Vendor Company</em>
                                    </MenuItem>
                                    {vendorCompanies.map((vendor) => (
                                        <MenuItem key={vendor._id} value={vendor._id}>{vendor.companyName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Product Name"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
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
                            />
                            <FormControl fullWidth variant="outlined" size="small">
                                <InputLabel>GST Type</InputLabel>
                                <Select
                                    value={gstType}
                                    onChange={(e) => setGstType(e.target.value)}
                                    label="GST Type"
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <CalculateIcon />
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Select GST Type</em>
                                    </MenuItem>
                                    {gstOptions.map((gst) => (
                                        <MenuItem key={gst._id} value={gst._id}>{gst.gstType}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Price Per quantity"
                                type="number"
                                value={pricePerQuantity}
                                onChange={(e) => setPricePerQuantity(e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <DescriptionIcon />
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 0, step: "0.01" }
                                }}
                            />
                        </div>

                        <div className="flex justify-start mt-6">
                            <Button
                                type="submit"
                                variant="contained"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md"
                            >
                                {id ? 'Update' : 'Register'} {/* Dynamic Button Text */}
                            </Button>
                        </div>
                    </form>
                </div>
            </Paper>
        </div>
    );
};

export default AddVendorProduct;