import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress,
    FormHelperText
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ImageIcon from "@mui/icons-material/Image";
const MAX_IMAGE_SIZE = 500 * 1024;

const RentalInvoiceForm = () => {
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [logoPreview, setLogoPreview] = useState("");
    const [contactOptions, setContactOptions] = useState([]);
    // {{ edit_1 }}
    const [formData, setFormData] = useState({
        companyId: '',
        machineId: '',
        sendDetailsTo: '',
        countImageFile: null,
        remarks: '',
        a3Config: { bwOldCount: '', bwNewCount: '' },
        a4Config: { bwOldCount: '', bwNewCount: '' },
        a5Config: { bwOldCount: '', bwNewCount: '' },
    });
    // {{ edit_1 }}
    const [errors, setErrors] = useState({});
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();

    // Fetch all companies on component mount
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
    }, [auth.token]);

    // Fetch existing rental entry data if in edit mode
    useEffect(() => {
        const fetchRentalEntry = async () => {
            if (id) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${id}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        const entry = data.entry;
                        // {{ edit_1 }}
                        setFormData({
                            companyId: entry.companyId?._id || '',
                            machineId: entry.machineId?._id || '',
                            sendDetailsTo: entry.sendDetailsTo || '',
                            countImageFile: null,
                            remarks: entry.remarks || '',
                            a3Config: {
                                bwOldCount: entry.a3Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a3Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a3Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a3Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a3Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a3Config?.colorScanningNewCount ?? 0,
                            },
                            a4Config: {
                                bwOldCount: entry.a4Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a4Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a4Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a4Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a4Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a4Config?.colorScanningNewCount ?? 0,
                            },
                            a5Config: {
                                bwOldCount: entry.a5Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a5Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a5Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a5Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a5Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a5Config?.colorScanningNewCount ?? 0,
                            },
                        });
                        // {{ edit_1 }}
                        if (entry.countImageUpload?.url) {
                            setLogoPreview(entry.countImageUpload.url);
                        }
                    } else {
                        toast.error(data?.message || 'Failed to fetch rental entry details.');
                        navigate('/admin/rental-invoices');
                    }
                } catch (error) {
                    console.error("Error fetching rental entry:", error);
                    toast.error('Something went wrong while fetching rental entry details.');
                    navigate('/admin/rental-invoices');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchRentalEntry();
    }, [id, auth.token, navigate]);


    // Fetch products based on selected company
    useEffect(() => {
        const fetchProductsByCompany = async () => {
            if (formData.companyId) {
                try {
                    setLoading(true);
                    // Corrected API endpoint for rental products by company
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/getServiceProductsByCompany/${formData.companyId}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        setAvailableProducts(data.rentalProducts);
                        // If in edit mode and machineId is already set, ensure it's still valid
                        if (id && formData.machineId && !data.rentalProducts.some(p => p._id === formData.machineId)) {
                            setFormData(prev => ({ ...prev, machineId: '' })); // Clear if machineId is not in the list
                        }
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
                // {{ edit_1 }}
                setFormData(prev => ({
                    ...prev,
                    machineId: '',
                    a3Config: { ...prev.a3Config, bwOldCount: '' },
                    a4Config: { ...prev.a4Config, bwOldCount: '' },
                    a5Config: { ...prev.a5Config, bwOldCount: '' },
                }));
                // {{ edit_1 }}
            }
        };
        // Only fetch products if companyId changes or if it's an initial load in edit mode
        if (formData.companyId || id) {
            fetchProductsByCompany();
        }
    }, [formData.companyId, auth.token, id]);

    // Populate "Send Details To" options based on selected company
    useEffect(() => {
        if (formData.companyId && companies.length > 0) {
            const selectedCompany = companies.find(comp => comp._id === formData.companyId);
            if (selectedCompany && selectedCompany.contactPersons) {
                const options = selectedCompany.contactPersons.map(person =>
                    `${person.name} (Mobile: ${person.mobile}, Email: ${person.email})`
                );
                setContactOptions(options);
            } else {
                setContactOptions([]);
            }
        } else {
            setContactOptions([]);
        }
        // Reset sendDetailsTo when company changes, unless in edit mode and it's already set
        if (!id || (id && formData.companyId !== companies.find(c => c._id === formData.companyId)?._id)) { // {{ edit_4 }}
            setFormData(prev => ({ ...prev, sendDetailsTo: '' })); // {{ edit_4 }}
        } // {{ edit_4 }}
    }, [formData.companyId, companies, id]); // Added id to dependencies // {{ edit_4 }}

    const handleImagehange = (e) => {
        const file = e.target.files[0];

        if (file.size > MAX_IMAGE_SIZE) {
            toast.warning("Logo image size exceeds 500 KB!");
            return;
        }
        const reader = new FileReader();

        reader.onload = () => {
            if (reader.readyState === 2) {
                setLogoPreview(reader.result);
                setFormData(prev => ({ ...prev, countImageFile: reader.result }));

            }
        };

        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Check if the name contains a dot, indicating a nested field (e.g., a3Config.bwNewCount)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
            setErrors(prev => ({ ...prev, [name]: '' })); // Clear error for nested field
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
        }
    };

    const handleProductChange = (e) => {
        const selectedProductId = e.target.value;
        setFormData(prev => ({ ...prev, machineId: selectedProductId }));
        setErrors(prev => ({ ...prev, machineId: '' }));

        const selectedProduct = availableProducts.find(prod => prod._id === selectedProductId);
        if (selectedProduct) {
            // {{ edit_2 }}
            setFormData(prev => ({
                ...prev,
                a3Config: {
                    ...prev.a3Config,
                    bwOldCount: selectedProduct.a3Config?.bwOldCount ?? 0,
                    colorOldCount: selectedProduct.a3Config?.colorOldCount ?? 0,
                    colorScanningOldCount: selectedProduct.a3Config?.colorScanningOldCount ?? 0,
                },
                a4Config: {
                    ...prev.a4Config,
                    bwOldCount: selectedProduct.a4Config?.bwOldCount ?? 0,
                    colorOldCount: selectedProduct.a4Config?.colorOldCount ?? 0,
                    colorScanningOldCount: selectedProduct.a4Config?.colorScanningOldCount ?? 0,
                },
                a5Config: {
                    ...prev.a5Config,
                    bwOldCount: selectedProduct.a5Config?.bwOldCount ?? 0,
                    colorOldCount: selectedProduct.a5Config?.colorOldCount ?? 0,
                    colorScanningOldCount: selectedProduct.a5Config?.colorScanningOldCount ?? 0,
                },
            }));
            // {{ edit_2 }}
        } else {
            setFormData(prev => ({
                ...prev,
                a3Config: { ...prev.a3Config, bwOldCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                a4Config: { ...prev.a4Config, bwOldCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                a5Config: { ...prev.a5Config, bwOldCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
            }));
        }
    };

    const validateForm = () => {
        let tempErrors = {};
        if (!formData.companyId) tempErrors.companyId = "Company is required.";
        if (!formData.machineId) tempErrors.machineId = "Serial No. is required.";
        if (!formData.sendDetailsTo) tempErrors.sendDetailsTo = "Send Details To is required.";

        // Validate nested count fields
        const validateCountField = (config, fieldName, label) => {
            if (config[fieldName] < 0) {
                tempErrors[`${label}.${fieldName}`] = `${label} ${fieldName.replace(/([A-Z])/g, ' $1').trim()} must be a non-negative number.`;
            }
        };

        validateCountField(formData.a3Config, 'bwNewCount', 'A3 B/W');
        validateCountField(formData.a3Config, 'colorNewCount', 'A3 Color');
        validateCountField(formData.a3Config, 'colorScanningNewCount', 'A3 Color Scanning');

        validateCountField(formData.a4Config, 'bwNewCount', 'A4 B/W');
        validateCountField(formData.a4Config, 'colorNewCount', 'A4 Color');
        validateCountField(formData.a4Config, 'colorScanningNewCount', 'A4 Color Scanning');

        validateCountField(formData.a5Config, 'bwNewCount', 'A5 B/W');
        validateCountField(formData.a5Config, 'colorNewCount', 'A5 Color');
        validateCountField(formData.a5Config, 'colorScanningNewCount', 'A5 Color Scanning');

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please correct the errors in the form.");
            return;
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append('machineId', formData.machineId);
            data.append('companyId', formData.companyId);
            data.append('sendDetailsTo', formData.sendDetailsTo);
            data.append('remarks', formData.remarks);
            data.append('assignedTo', employeeName);
            // Append nested config objects as JSON strings
            data.append('a3Config', JSON.stringify(formData.a3Config));
            data.append('a4Config', JSON.stringify(formData.a4Config));
            data.append('a5Config', JSON.stringify(formData.a5Config));

            if (formData.countImageFile) {
                data.append('countImageUpload', formData.countImageFile);
            }

            let res;
            if (id) {
                // Update existing entry
                res = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${id}`, data, {
                    headers: {
                        Authorization: auth.token,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                // Create new entry
                res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/create-rental-entry`, data, {
                    headers: {
                        Authorization: auth.token,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }


            if (res.data?.success) {
                toast.success(res.data.message);
                // Reset form or navigate
                // {{ edit_1 }}
                setFormData({
                    companyId: '',
                    machineId: '',
                    sendDetailsTo: '',
                    countImageFile: null,
                    remarks: '',
                    a3Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a4Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a5Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                });
                // {{ edit_1 }}
                setLogoPreview(""); // Clear image preview
                navigate('../rentalInvoiceList'); // Navigate to the list page
            } else {
                toast.error(res.data?.message || `Failed to ${id ? 'update' : 'create'} rental payment entry.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} rental payment entry:`, error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                {id ? 'Edit Rental Payment Entry' : 'Add Rental Payment Entry'}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: '8px' }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <FormControl fullWidth margin="normal" size="small" required error={!!errors.companyId}>
                            <InputLabel id="company-label">Company</InputLabel>
                            <Select
                                labelId="company-label"
                                id="companyId"
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleChange}
                                label="Company"
                            >
                                <MenuItem value="">Select a Company</MenuItem>
                                {companies.map(comp => (
                                    <MenuItem key={comp._id} value={comp._id}>
                                        {comp.companyName}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.companyId && <FormHelperText>{errors.companyId}</FormHelperText>}
                        </FormControl>
                        <FormControl fullWidth margin="normal" size="small" error={!!errors.machineId}>
                            <InputLabel id="product-name-label">Serial No.</InputLabel>
                            <Select
                                labelId="product-name-label"
                                id="machineId"
                                name="machineId"
                                value={formData.machineId}
                                onChange={handleProductChange}
                                label="Serial No"
                                disabled={!formData.companyId || availableProducts.length === 0}
                            >
                                <MenuItem value="">Select a Product</MenuItem>
                                {availableProducts.map(prod => (
                                    <MenuItem key={prod._id} value={prod._id}>{prod.serialNo}</MenuItem>
                                ))}
                            </Select>
                            {errors.machineId && <FormHelperText>{errors.machineId}</FormHelperText>}
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <FormControl fullWidth size="small" error={!!errors.sendDetailsTo}>
                            <InputLabel id="send-details-to-label" required>Send Details To</InputLabel>
                            <Select
                                labelId="send-details-to-label"
                                id="sendDetailsTo"
                                name="sendDetailsTo"
                                value={formData.sendDetailsTo}
                                label="Send Details To"
                                onChange={handleChange}
                                disabled={!formData.companyId || contactOptions.length === 0}
                            >
                                <MenuItem value="">
                                    <em>Select Option</em>
                                </MenuItem>
                                {contactOptions.map((option, index) => (
                                    <MenuItem key={index} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.sendDetailsTo && <FormHelperText>{errors.sendDetailsTo}</FormHelperText>}
                        </FormControl>

                        <Box>
                            <Typography variant="subtitle1" gutterBottom>Count Image Upload:</Typography>
                            <input
                                type="file"
                                accept="image/*"
                                name="countImageUpload"
                                onChange={handleImagehange}
                                className="hidden"
                                style={{ display: 'block', marginBottom: '8px' }}
                            />
                            {!logoPreview ? (
                                <ImageIcon />
                            ) : (
                                <img
                                    draggable="false"
                                    src={logoPreview}
                                    alt="Brand Logo"
                                    className="w-20 h-20 object-contain"
                                />
                            )}
                            {errors.countImageFile && <FormHelperText error>{errors.countImageFile}</FormHelperText>}
                        </Box>
                    </Box>

                    <TextField
                        fullWidth
                        label="Remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        sx={{ mb: 3 }}
                    />

                    <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>A3 Entry:</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        {/* {{ edit_1 }} */}
                        {formData.a3Config.bwOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A3 B/W Old Count"
                                    name="a3Config.bwOldCount"
                                    value={formData.a3Config.bwOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A3 B/W New Count"
                                    name="a3Config.bwNewCount"
                                    value={formData.a3Config.bwNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a3Config.bwNewCount']}
                                    helperText={errors['a3Config.bwNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_1 }} */}

                        {/* {{ edit_2 }} */}
                        {formData.a3Config.colorOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A3 Color Old Count"
                                    name="a3Config.colorOldCount"
                                    value={formData.a3Config.colorOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A3 Color New Count"
                                    name="a3Config.colorNewCount"
                                    value={formData.a3Config.colorNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a3Config.colorNewCount']}
                                    helperText={errors['a3Config.colorNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_2 }} */}

                        {/* {{ edit_3 }} */}
                        {formData.a3Config.colorScanningOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A3 Color Scanning Old Count"
                                    name="a3Config.colorScanningOldCount"
                                    value={formData.a3Config.colorScanningOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A3 Color Scanning New Count"
                                    name="a3Config.colorScanningNewCount"
                                    value={formData.a3Config.colorScanningNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a3Config.colorScanningNewCount']}
                                    helperText={errors['a3Config.colorScanningNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_3 }} */}

                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>A4 Entry:</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        {/* {{ edit_4 }} */}
                        {formData.a4Config.bwOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A4 B/W Old Count"
                                    name="a4Config.bwOldCount"
                                    value={formData.a4Config.bwOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A4 B/W New Count"
                                    name="a4Config.bwNewCount"
                                    value={formData.a4Config.bwNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a4Config.bwNewCount']}
                                    helperText={errors['a4Config.bwNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_4 }} */}

                        {/* {{ edit_5 }} */}
                        {formData.a4Config.colorOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A4 Color Old Count"
                                    name="a4Config.colorOldCount"
                                    value={formData.a4Config.colorOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A4 Color New Count"
                                    name="a4Config.colorNewCount"
                                    value={formData.a4Config.colorNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a4Config.colorNewCount']}
                                    helperText={errors['a4Config.colorNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_5 }} */}

                        {/* {{ edit_6 }} */}
                        {formData.a4Config.colorScanningOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A4 Color Scanning Old Count"
                                    name="a4Config.colorScanningOldCount"
                                    value={formData.a4Config.colorScanningOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A4 Color Scanning New Count"
                                    name="a4Config.colorScanningNewCount"
                                    value={formData.a4Config.colorScanningNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a4Config.colorScanningNewCount']}
                                    helperText={errors['a4Config.colorScanningNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_6 }} */}

                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>A5 Entry:</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        {/* {{ edit_7 }} */}
                        {formData.a5Config.bwOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A5 B/W Old Count"
                                    name="a5Config.bwOldCount"
                                    value={formData.a5Config.bwOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A5 B/W New Count"
                                    name="a5Config.bwNewCount"
                                    value={formData.a5Config.bwNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a5Config.bwNewCount']}
                                    helperText={errors['a5Config.bwNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_7 }} */}

                        {/* {{ edit_8 }} */}
                        {formData.a5Config.colorOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A5 Color Old Count"
                                    name="a5Config.colorOldCount"
                                    value={formData.a5Config.colorOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A5 Color New Count"
                                    name="a5Config.colorNewCount"
                                    value={formData.a5Config.colorNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a5Config.colorNewCount']}
                                    helperText={errors['a5Config.colorNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_8 }} */}

                        {/* {{ edit_9 }} */}
                        {formData.a5Config.colorScanningOldCount > 0 && (
                            <>
                                <TextField
                                    fullWidth
                                    label="A5 Color Scanning Old Count"
                                    name="a5Config.colorScanningOldCount"
                                    value={formData.a5Config.colorScanningOldCount}
                                    disabled
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    fullWidth
                                    label="A5 Color Scanning New Count"
                                    name="a5Config.colorScanningNewCount"
                                    value={formData.a5Config.colorScanningNewCount}
                                    onChange={handleChange}
                                    type="number"
                                    size="small"
                                    error={!!errors['a5Config.colorScanningNewCount']}
                                    helperText={errors['a5Config.colorScanningNewCount']}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </>

                        )}
                        {/* {{ edit_9 }} */}

                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : (id ? 'Update Rental Entry' : 'Submit Rental Entry')}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default RentalInvoiceForm;