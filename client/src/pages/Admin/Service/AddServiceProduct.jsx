import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography } from '@mui/material';
import { useAuth } from '../../../context/auth';

const AddServiceProduct = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const product_id = searchParams.get('product_id');
    const { auth } = useAuth();
    const [company, setCompany] = useState('');
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [hsn, setHsn] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [rate, setRate] = useState('');
    const [gstTypeId, setGstTypeId] = useState(''); // Stores the _id of the selected GST type
    const [totalAmount, setTotalAmount] = useState(0);

    const [companies, setCompanies] = useState([]);
    const [gstOptions, setGstOptions] = useState([]); // Stores GST types with their percentages

    // Fetch companies and GST options on component mount
    useEffect(() => {
        fetchCompanies();
        fetchGstOptions();
    }, []);

    // Fetch product data if editing
    useEffect(() => {
        if (product_id) {
            fetchProduct(product_id);
        }
    }, [product_id]);

    // Calculate total amount whenever quantity, rate, or GST changes
    useEffect(() => {
        calculateTotalAmount();
    }, [quantity, rate, gstTypeId, gstOptions]); // Depend on gstOptions to ensure it's loaded

    const fetchCompanies = async () => {
        try {
            // Replace with your actual API endpoint to fetch companies
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                headers: {
                    Authorization: auth?.token,
                },
            });
            if (data?.success) {
                setCompanies(data.companies);
            } else {
                toast.error(data?.message || 'Failed to fetch companies.');
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Something went wrong while fetching companies.');
            // Mock data for development if API is not ready
            setCompanies([]);
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

    const fetchProduct = async (productId) => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-products/${productId}`);
            if (data?.success) {
                const product = data.serviceProduct;
                setCompany(product.company._id); // Assuming company is populated
                setProductName(product.productName);
                setSku(product.sku);
                setHsn(product.hsn);
                setQuantity(product.quantity);
                setRate(product.rate);
                setGstTypeId(product.gstType._id); // Assuming gstType is populated
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
        let gstPercentage = 0;

        if (gstTypeId && gstOptions.length > 0) {
            const selectedGst = gstOptions.find(gst => gst._id === gstTypeId);
            if (selectedGst) {
                gstPercentage = selectedGst.gstPercentage;
            }
        }

        const subTotal = currentRate * currentQuantity;
        const gstAmount = subTotal * (gstPercentage / 100);
        setTotalAmount((subTotal + gstAmount).toFixed(2)); // Format to 2 decimal places
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!company || !productName || !sku || !hsn || !quantity || !rate || !gstTypeId) {
            toast.error('Please fill in all required fields.');
            return;
        }

        try {
            const productData = {
                company,
                productName,
                sku,
                hsn,
                quantity: parseInt(quantity),
                rate: parseFloat(rate),
                gstType: gstTypeId, // Send the ID
                totalAmount: parseFloat(totalAmount),
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
                    setGstTypeId('');
                    setTotalAmount(0);
                } else {
                    toast.error(data?.message || 'Failed to add product.');
                }
            }
        } catch (error) {
            console.error('Error submitting product:', error);
            toast.error('Something went wrong while saving the product.');
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
                    <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel id="company-label">Company</InputLabel>
                        <Select
                            labelId="company-label"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            label="Company"
                            displayEmpty
                        >
                            <MenuItem value="">
                                <em>Select a Company</em>
                            </MenuItem>
                            {companies.map((comp) => (
                                <MenuItem key={comp._id} value={comp._id}>
                                    {comp.companyName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Product Name"
                        placeholder="Enter Product Name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    />

                    <TextField
                        label="SKU"
                        placeholder="Enter Sku"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    />

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
                            value={gstTypeId}
                            onChange={(e) => setGstTypeId(e.target.value)}
                            label="GST Type"
                            displayEmpty
                        >
                            <MenuItem value="">
                                <em>Select a GST Type</em>
                            </MenuItem>
                            {gstOptions.map((gst) => (
                                <MenuItem key={gst._id} value={gst._id}>
                                    {gst.gstType} ({gst.gstPercentage}%)
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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