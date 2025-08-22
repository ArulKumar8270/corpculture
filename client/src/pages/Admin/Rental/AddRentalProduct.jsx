import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    TextField, Button, Select, MenuItem, FormControl, InputLabel, Paper, Typography,
    Checkbox, FormControlLabel, FormGroup
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useAuth } from '../../../context/auth';

// Helper component for A3/A4/A5 configurations
const ConfigurationSection = ({ size, config, handleConfigChange, modelSpecs }) => {
    if (!modelSpecs[`is${size}Selected`]) return null; // Only render if the model spec is selected

    const fields = [
        { label: `${size} B/W Old Count`, key: 'bwOldCount', type: 'number' },
        { label: `Free Copies in B/W`, key: 'freeCopiesBw', type: 'number', unlimitedKey: 'bwUnlimited' },
        { label: `Amount for extra B/W copies`, key: 'extraAmountBw', type: 'number', unlimitedKey: 'bwUnlimited' },
        { label: `${size} B/W Unlimited`, key: 'bwUnlimited', type: 'checkbox' },

        { label: `${size} Color Old Count`, key: 'colorOldCount', type: 'number' },
        { label: `Free Copies in Colour`, key: 'freeCopiesColor', type: 'number', unlimitedKey: 'colorUnlimited' },
        { label: `Amount for extra colour copies`, key: 'extraAmountColor', type: 'number', unlimitedKey: 'colorUnlimited' },
        { label: `${size} Color Unlimited`, key: 'colorUnlimited', type: 'checkbox' },

        { label: `${size} ColorScaning Old Count`, key: 'colorScanningOldCount', type: 'number' },
        { label: `Free Copies in Colour Scaning`, key: 'freeCopiesColorScanning', type: 'number', unlimitedKey: 'colorScanningUnlimited' },
        { label: `Amount for extra colour scaning`, key: 'extraAmountColorScanning', type: 'number', unlimitedKey: 'colorScanningUnlimited' },
        { label: `${size} Color Scaning Unlimited`, key: 'colorScanningUnlimited', type: 'checkbox' },
    ];

    return (
        <Paper className="p-6 shadow-md mb-6">
            <Typography variant="h6" className="font-semibold mb-4">{size} Configuration</Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fields.map((field) => (
                    <div key={field.key}>
                        {field.type === 'checkbox' ? (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={config[field.key] || false}
                                        onChange={(e) => handleConfigChange(size, field.key, e.target.checked)}
                                    />
                                }
                                label={field.label}
                            />
                        ) : (
                            <TextField
                                label={field.label}
                                type={field.type}
                                value={config[field.key] || ''}
                                onChange={(e) => handleConfigChange(size, field.key, e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                disabled={field.unlimitedKey && config[field.unlimitedKey]} // Disable if unlimited is checked
                                inputProps={field.type === 'number' ? { min: 0, step: "0.01" } : {}}
                            />
                        )}
                    </div>
                ))}
            </div>
        </Paper>
    );
};


const AddRentalProduct = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const id = searchParams.get('product_id');
    const { auth } = useAuth();
    // Main form states
    const [company, setCompany] = useState('');
    const [branch, setBranch] = useState('');
    const [department, setDepartment] = useState('');
    const [modelName, setModelName] = useState('');
    const [serialNo, setSerialNo] = useState('');
    const [hsn, setHsn] = useState('');
    const [basePrice, setBasePrice] = useState('');
    const [gstTypeIds, setGstTypeIds] = useState([]); // Changed to array for multiple selection
    const [paymentDate, setPaymentDate] = useState(null); // dayjs object
    const [commission, setCommission] = useState(''); // New state for commission

    // Model Specifications checkboxes
    const [modelSpecs, setModelSpecs] = useState({
        isA3Selected: false,
        isA4Selected: false,
        isA5Selected: false,
    });

    // Configuration states for A3, A4, A5
    const [a3Config, setA3Config] = useState({});
    const [a4Config, setA4Config] = useState({});
    const [a5Config, setA5Config] = useState({});

    // Dropdown options
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]); // Assuming branches are fetched based on company
    const [departments, setDepartments] = useState([]); // Assuming departments are fetched based on company/branch
    const [gstOptions, setGstOptions] = useState([]);

    useEffect(() => {
        fetchCompanies();
        fetchGstOptions();
        // Fetch branches and departments if needed (e.g., if they are static or depend on user role)
        // For now, they are just text fields, but if they become dropdowns, add fetch logic here.
    }, []);

    useEffect(() => {
        if (id) {
            fetchRentalProduct(id);
        }
    }, [id]);

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
            setCompanies([]);
        }
    };

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
            setGstOptions([]);
        }
    };

    const fetchRentalProduct = async (productId) => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${productId}`);
            if (data?.success) {
                const product = data.rentalProduct;
                setCompany(product.company?._id || '');
                setBranch(product.branch || '');
                setDepartment(product.department || '');
                setModelName(product.modelName || '');
                setSerialNo(product.serialNo || '');
                setHsn(product.hsn || '');
                setBasePrice(product.basePrice || '');
                // Handle gstType: if it's an array of objects, map to IDs; if single object, take its ID; otherwise empty array
                if (Array.isArray(product.gstType)) {
                    setGstTypeIds(product.gstType.map(gst => gst._id));
                } else if (product.gstType && product.gstType._id) {
                    setGstTypeIds([product.gstType._id]); // Wrap single ID in an array
                } else {
                    setGstTypeIds([]);
                }
                setPaymentDate(product.paymentDate ? dayjs(product.paymentDate) : null);
                setCommission(product.commission || ''); // Populate commission

                setModelSpecs({
                    isA3Selected: product.modelSpecs?.isA3Selected || false,
                    isA4Selected: product.modelSpecs?.isA4Selected || false,
                    isA5Selected: product.modelSpecs?.isA5Selected || false,
                });

                setA3Config(product.a3Config || {});
                setA4Config(product.a4Config || {});
                setA5Config(product.a5Config || {});

            } else {
                toast.error(data?.message || 'Failed to fetch rental product details.');
            }
        } catch (error) {
            console.error('Error fetching rental product:', error);
            toast.error('Something went wrong while fetching rental product details.');
        }
    };

    const handleModelSpecChange = (specName, isChecked) => {
        setModelSpecs(prev => ({ ...prev, [specName]: isChecked }));
    };

    const handleConfigChange = (size, key, value) => {
        const setter = {
            A3: setA3Config,
            A4: setA4Config,
            A5: setA5Config,
        }[size];

        setter(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!company || !branch || !department || !modelName || !serialNo || !hsn || !basePrice || gstTypeIds.length === 0 || !paymentDate || !commission) { // Check gstTypeIds length and commission
            toast.error('Please fill in all required fields.');
            return;
        }

        const rentalProductData = {
            company,
            branch,
            department,
            modelName,
            serialNo,
            hsn,
            basePrice: parseFloat(basePrice),
            gstType: gstTypeIds, // Send as array
            paymentDate: paymentDate ? paymentDate.toISOString() : null, // Convert dayjs object to ISO string
            commission: parseFloat(commission), // Include commission in payload
            modelSpecs,
            a3Config: modelSpecs.isA3Selected ? a3Config : {},
            a4Config: modelSpecs.isA4Selected ? a4Config : {},
            a5Config: modelSpecs.isA5Selected ? a5Config : {},
            assignedTo: employeeName
        };
        try {
            if (id) {
                // Update existing product
                const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${id}`, rentalProductData);
                if (data?.success) {
                    toast.success(data.message || 'Rental product updated successfully!');
                    handleCancel()
                } else {
                    toast.error(data?.message || 'Failed to update rental product.');
                }
            } else {
                // Add new product
                const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products`, rentalProductData);
                if (data?.success) {
                    toast.success(data.message || 'Rental product added successfully!');
                    // Clear form
                    setCompany('');
                    setBranch('');
                    setDepartment('');
                    setModelName('');
                    setSerialNo('');
                    setHsn('');
                    setBasePrice('');
                    setGstTypeIds([]); // Clear as array
                    setPaymentDate(null);
                    setCommission(''); // Clear commission
                    setModelSpecs({ isA3Selected: false, isA4Selected: false, isA5Selected: false });
                    setA3Config({});
                    setA4Config({});
                    setA5Config({});
                } else {
                    toast.error(data?.message || 'Failed to add rental product.');
                }
            }
        } catch (error) {
            console.error('Error submitting rental product:', error);
            toast.error('Something went wrong while saving the rental product.');
        }
    };

    const handleCancel = () => {
        navigate('../rentalProductList');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">{id ? 'Edit Rental Product' : 'Add Rental Product'}</h1>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('../rentalProductList')}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        View Rental Products
                    </Button>
                </div>

                <Paper className="p-6 shadow-md mb-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel id="company-label">Company *</InputLabel>
                            <Select
                                labelId="company-label"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                displayEmpty
                            >
                                {companies.map((comp) => (
                                    <MenuItem key={comp._id} value={comp._id}>
                                        {comp.companyName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Branch *"
                            placeholder="Enter Company Branch"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            label="Department *"
                            placeholder="Enter Company Department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            label="Model Name *"
                            placeholder="Enter Model Name"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            label="Serial No *"
                            placeholder="Enter Serial Name"
                            value={serialNo}
                            onChange={(e) => setSerialNo(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            label="HSN *"
                            placeholder="Enter HSN"
                            value={hsn}
                            onChange={(e) => setHsn(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <TextField
                            label="Base Price *"
                            type="number"
                            placeholder="Enter Machine's Base Price"
                            value={basePrice}
                            onChange={(e) => setBasePrice(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            inputProps={{ step: "0.01" }}
                        />

                        <FormControl fullWidth variant="outlined" size="small">
                            <InputLabel id="gst-type-label">Select GST *</InputLabel>
                            <Select
                                labelId="gst-type-label"
                                multiple // Added for multiple selection
                                value={gstTypeIds} // Now an array
                                onChange={(e) => setGstTypeIds(e.target.value)} // Handles array of values
                                label="Select GST *"
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

                        <DatePicker
                            label="Payment Date *"
                            value={paymentDate}
                            onChange={(newValue) => setPaymentDate(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                        />

                        <TextField
                            label="Commission"
                            type="number"
                            placeholder="Enter Commission Percentage"
                            value={commission}
                            onChange={(e) => setCommission(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                        />

                        <div className="md:col-span-2 lg:col-span-3">
                            <Typography variant="subtitle1" className="font-semibold mb-2">Model Specifications *</Typography>
                            <FormGroup row>
                                <FormControlLabel
                                    control={<Checkbox checked={modelSpecs.isA3Selected} onChange={(e) => handleModelSpecChange('isA3Selected', e.target.checked)} />}
                                    label="A3"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={modelSpecs.isA4Selected} onChange={(e) => handleModelSpecChange('isA4Selected', e.target.checked)} />}
                                    label="A4"
                                />
                                <FormControlLabel
                                    control={<Checkbox checked={modelSpecs.isA5Selected} onChange={(e) => handleModelSpecChange('isA5Selected', e.target.checked)} />}
                                    label="A5"
                                />
                            </FormGroup>
                        </div>
                    </form>
                </Paper>

                {/* Configuration Sections */}
                <ConfigurationSection size="A3" config={a3Config} handleConfigChange={handleConfigChange} modelSpecs={modelSpecs} />
                <ConfigurationSection size="A4" config={a4Config} handleConfigChange={handleConfigChange} modelSpecs={modelSpecs} />
                <ConfigurationSection size="A5" config={a5Config} handleConfigChange={handleConfigChange} modelSpecs={modelSpecs} />

                <div className="flex justify-start gap-3 mt-4">
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        className="bg-blue-500 hover:bg-blue-600"
                    >
                        {id ? 'Update' : 'Submit'}
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
            </div>
        </LocalizationProvider>
    );
};

export default AddRentalProduct;