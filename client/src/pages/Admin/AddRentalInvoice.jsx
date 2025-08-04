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
import { useNavigate } from 'react-router-dom';

const AddRentalInvoice = () => {
    const [loading, setLoading] = useState(true);
    const [machines, setMachines] = useState([]);
    const [sendDetailsOptions, setSendDetailsOptions] = useState([]);
    const [formData, setFormData] = useState({
        machineId: '',
        companyName: '', // Populated from selected machine
        serialNo: '', // Populated from selected machine
        sendDetailsTo: '',
        countImageFile: null,
        remarks: '',
        a4BwOldCount: '', // Populated from selected machine
        a4BwNewCount: '',
    });
    const [errors, setErrors] = useState({});
    const { auth } = useAuth();
    const navigate = useNavigate();

    // Fetch initial data: machines and send details options
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [machinesRes, sendDetailsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/machines`, {
                        headers: { Authorization: auth.token },
                    }),
                    axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/send-details-options`, {
                        headers: { Authorization: auth.token },
                    }),
                ]);

                if (machinesRes.data?.success) {
                    setMachines(machinesRes.data.machines);
                } else {
                    toast.error(machinesRes.data?.message || 'Failed to fetch machines.');
                }

                if (sendDetailsRes.data?.success) {
                    setSendDetailsOptions(sendDetailsRes.data.options);
                } else {
                    toast.error(sendDetailsRes.data?.message || 'Failed to fetch send details options.');
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error(error.response?.data?.message || 'Something went wrong while fetching initial data.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [auth.token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, countImageFile: e.target.files[0] }));
        setErrors(prev => ({ ...prev, countImageFile: '' })); // Clear error on change
    };

    const handleSerialNoChange = async (e) => {
        const selectedMachineId = e.target.value;
        setFormData(prev => ({ ...prev, machineId: selectedMachineId, serialNo: e.target.value }));
        setErrors(prev => ({ ...prev, machineId: '' })); // Clear error on change

        if (selectedMachineId) {
            try {
                const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/machine-details/${selectedMachineId}`, {
                    headers: { Authorization: auth.token },
                });
                if (res.data?.success) {
                    const machine = res.data.machine;
                    setFormData(prev => ({
                        ...prev,
                        companyName: machine.companyId?.companyName || 'N/A',
                        a4BwOldCount: machine.currentCount,
                    }));
                } else {
                    toast.error(res.data?.message || 'Failed to fetch machine details.');
                    setFormData(prev => ({ ...prev, companyName: '', a4BwOldCount: '' }));
                }
            } catch (error) {
                console.error("Error fetching machine details:", error);
                toast.error(error.response?.data?.message || 'Something went wrong while fetching machine details.');
                setFormData(prev => ({ ...prev, companyName: '', a4BwOldCount: '' }));
            }
        } else {
            setFormData(prev => ({ ...prev, companyName: '', a4BwOldCount: '' }));
        }
    };

    const validateForm = () => {
        let tempErrors = {};
        if (!formData.machineId) tempErrors.machineId = "Serial No. is required.";
        if (!formData.sendDetailsTo) tempErrors.sendDetailsTo = "Send Details To is required.";
        if (!formData.a4BwNewCount || isNaN(formData.a4BwNewCount) || formData.a4BwNewCount <= 0) {
            tempErrors.a4BwNewCount = "New Count must be a positive number.";
        }
        // Add more validation as needed

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
            data.append('sendDetailsTo', formData.sendDetailsTo);
            data.append('remarks', formData.remarks);
            data.append('a4BwOldCount', formData.a4BwOldCount);
            data.append('a4BwNewCount', formData.a4BwNewCount);
            if (formData.countImageFile) {
                data.append('countImageUpload', formData.countImageFile);
            }

            const res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/create-rental-entry`, data, {
                headers: {
                    Authorization: auth.token,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });

            if (res.data?.success) {
                toast.success(res.data.message);
                // Reset form or navigate
                setFormData({
                    machineId: '',
                    companyName: '',
                    serialNo: '',
                    sendDetailsTo: '',
                    countImageFile: null,
                    remarks: '',
                    a4BwOldCount: '',
                    a4BwNewCount: '',
                });
                // Optionally navigate back to a list or dashboard
                navigate('/admin/dashboard'); // Example navigation
            } else {
                toast.error(res.data?.message || 'Failed to create rental payment entry.');
            }
        } catch (error) {
            console.error("Error creating rental payment entry:", error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && machines.length === 0) { // Only show full page loader if initial data is loading
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Rental Payment Entry
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: '8px' }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <FormControl fullWidth size="small" error={!!errors.machineId}>
                            <InputLabel id="serial-no-label" required>Serial No.</InputLabel>
                            <Select
                                labelId="serial-no-label"
                                id="serialNo"
                                name="serialNo"
                                value={formData.machineId} // Bind to machineId
                                label="Serial No."
                                onChange={handleSerialNoChange}
                            >
                                <MenuItem value="">
                                    <em>Select Serial No.</em>
                                </MenuItem>
                                {machines.map((machine) => (
                                    <MenuItem key={machine._id} value={machine._id}>
                                        {machine.serialNumber}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.machineId && <FormHelperText>{errors.machineId}</FormHelperText>}
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Company Name"
                            name="companyName"
                            value={formData.companyName}
                            disabled
                            size="small"
                        />
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
                            >
                                <MenuItem value="">
                                    <em>Select Option</em>
                                </MenuItem>
                                {sendDetailsOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
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
                                onChange={handleFileChange}
                                style={{ display: 'block', marginBottom: '8px' }}
                            />
                            {formData.countImageFile && (
                                <Typography variant="body2" color="text.secondary">
                                    Selected: {formData.countImageFile.name}
                                </Typography>
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

                    <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>A4 Entry:</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <TextField
                            fullWidth
                            label="A4 B/W Old Count"
                            name="a4BwOldCount"
                            value={formData.a4BwOldCount}
                            disabled
                            size="small"
                        />
                        <TextField
                            fullWidth
                            label="A4 B/W New Count"
                            name="a4BwNewCount"
                            value={formData.a4BwNewCount}
                            onChange={handleChange}
                            type="number"
                            required
                            size="small"
                            error={!!errors.a4BwNewCount}
                            helperText={errors.a4BwNewCount}
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Submit Rental Entry'}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default AddRentalInvoice;