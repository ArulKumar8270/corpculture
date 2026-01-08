import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/auth';
import {
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Grid,
    Typography,
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

const EmployeeActivityLogForm = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openAddCompanyDialog, setOpenAddCompanyDialog] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [isAddingCompany, setIsAddingCompany] = useState(false);
    const [addingFor, setAddingFor] = useState(''); // 'from' or 'to'

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        fromCompany: '',
        fromCompanyName: '',
        toCompany: '',
        toCompanyName: '',
        km: '',
        inTime: '',
        outTime: '',
        callType: '',
        leaveOrWork: '',
        assignedTo: '',
        remarks: '',
    });

    const callTypes = [
        'NEW SERVICE CALLS',
        'PENDING CALLS',
        'REWORK CALLS',
        'DELIVERY CALLS',
        'CHEQUE COLLATION',
        'BILL SIGNATURE',
    ];

    const leaveOrWorkOptions = ['LEAVE', 'WORK'];

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (data?.success) {
                setCompanies(data.companies || []);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to fetch companies');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFromCompanyChange = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            fromCompany: newValue ? newValue._id : '',
            fromCompanyName: newValue ? newValue.companyName : '',
        }));
    };

    const handleToCompanyChange = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            toCompany: newValue ? newValue._id : '',
            toCompanyName: newValue ? newValue.companyName : '',
        }));
    };

    const handleOpenAddCompanyDialog = (type) => {
        setAddingFor(type);
        setNewCompanyName('');
        setOpenAddCompanyDialog(true);
    };

    const handleCloseAddCompanyDialog = () => {
        setOpenAddCompanyDialog(false);
        setNewCompanyName('');
        setAddingFor('');
    };

    const handleAddNewCompany = async () => {
        if (!newCompanyName.trim()) {
            toast.error('Please enter a company name');
            return;
        }

        try {
            setIsAddingCompany(true);
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/create`,
                {
                    companyName: newCompanyName.trim(),
                    billingAddress: '',
                    city: '',
                    state: '',
                    pincode: '',
                    userId: auth?.user?._id,
                },
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (data?.success) {
                toast.success('Company added successfully');
                await fetchCompanies();
                
                // Set the newly added company in the form
                if (addingFor === 'from') {
                    setFormData((prev) => ({
                        ...prev,
                        fromCompany: data.company._id,
                        fromCompanyName: data.company.companyName,
                    }));
                } else if (addingFor === 'to') {
                    setFormData((prev) => ({
                        ...prev,
                        toCompany: data.company._id,
                        toCompanyName: data.company.companyName,
                    }));
                }
                
                handleCloseAddCompanyDialog();
            } else {
                toast.error(data?.message || 'Failed to add company');
            }
        } catch (error) {
            console.error('Error adding company:', error);
            toast.error('Failed to add company');
        } finally {
            setIsAddingCompany(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.date) {
            toast.error('Please select a date');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/create`,
                formData,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (data?.success) {
                toast.success('Activity log created successfully');
                // Reset form
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    fromCompany: '',
                    fromCompanyName: '',
                    toCompany: '',
                    toCompanyName: '',
                    km: '',
                    inTime: '',
                    outTime: '',
                    callType: '',
                    leaveOrWork: '',
                    assignedTo: '',
                    remarks: '',
                });
            } else {
                toast.error(data?.message || 'Failed to create activity log');
            }
        } catch (error) {
            console.error('Error creating activity log:', error);
            toast.error(
                error.response?.data?.message ||
                    'Failed to create activity log'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">Employee Activity Log</h1>
            </div>

            <Paper className="p-6 shadow-md">
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Date */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        {/* From Company */}
                        <Grid item xs={12} md={4}>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Autocomplete
                                    fullWidth
                                    options={companies}
                                    getOptionLabel={(option) =>
                                        option.companyName || ''
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                        option._id === value._id
                                    }
                                    value={
                                        companies.find(
                                            (c) => c._id === formData.fromCompany
                                        ) || null
                                    }
                                    onChange={handleFromCompanyChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="From Company"
                                            variant="outlined"
                                        />
                                    )}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                        handleOpenAddCompanyDialog('from')
                                    }
                                    sx={{ minWidth: 'auto', mt: 0.5 }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>

                        {/* To Company */}
                        <Grid item xs={12} md={4}>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Autocomplete
                                    fullWidth
                                    options={companies}
                                    getOptionLabel={(option) =>
                                        option.companyName || ''
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                        option._id === value._id
                                    }
                                    value={
                                        companies.find(
                                            (c) => c._id === formData.toCompany
                                        ) || null
                                    }
                                    onChange={handleToCompanyChange}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="To Company"
                                            variant="outlined"
                                        />
                                    )}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() =>
                                        handleOpenAddCompanyDialog('to')
                                    }
                                    sx={{ minWidth: 'auto', mt: 0.5 }}
                                >
                                    Add
                                </Button>
                            </Box>
                        </Grid>

                        {/* KM */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="KM"
                                name="km"
                                type="number"
                                value={formData.km}
                                onChange={handleInputChange}
                                inputProps={{ min: 0 }}
                            />
                        </Grid>

                        {/* In Time */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="In Time"
                                name="inTime"
                                type="time"
                                value={formData.inTime}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Out Time */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Out Time"
                                name="outTime"
                                type="time"
                                value={formData.outTime}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Call Type */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Call Type</InputLabel>
                                <Select
                                    name="callType"
                                    value={formData.callType}
                                    onChange={handleInputChange}
                                    label="Call Type"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {callTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Leave/Work */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Leave/Work</InputLabel>
                                <Select
                                    name="leaveOrWork"
                                    value={formData.leaveOrWork}
                                    onChange={handleInputChange}
                                    label="Leave/Work"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {leaveOrWorkOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Remarks */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Remarks"
                                name="remarks"
                                multiline
                                rows={3}
                                value={formData.remarks}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="flex-end" gap={2}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Add Company Dialog */}
            <Dialog
                open={openAddCompanyDialog}
                onClose={handleCloseAddCompanyDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add New Company</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Company Name"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        margin="normal"
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddCompanyDialog}>Cancel</Button>
                    <Button
                        onClick={handleAddNewCompany}
                        variant="contained"
                        disabled={isAddingCompany || !newCompanyName.trim()}
                    >
                        {isAddingCompany ? 'Adding...' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default EmployeeActivityLogForm;

