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
    Box,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const EmployeeActivityLogForm = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedCompany = location.state?.preselectedCompany;
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        km: '',
        inTime: '',
        outTime: '',
        callType: '',
        leaveOrWork: '',
        assignedTo: '',
        remarks: '',
    });

    // Single From/To selection (no multi-add rows)
    const [routeDraft, setRouteDraft] = useState({
        fromCompany: null,
        toCompany: null,
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
                const list = data.companies || [];
                setCompanies(list);
                if (preselectedCompany) {
                    const id = typeof preselectedCompany === 'object' ? preselectedCompany._id : preselectedCompany;
                    const company = list.find((c) => c._id === id) || (typeof preselectedCompany === 'object' && preselectedCompany.companyName ? preselectedCompany : null);
                    if (company) {
                        setRouteDraft((prev) => ({ ...prev, fromCompany: company }));
                    }
                }
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

    const handleDraftFromCompanyChange = (event, newValue) => {
        setRouteDraft((prev) => ({ ...prev, fromCompany: newValue }));
    };

    const handleDraftToCompanyChange = (event, newValue) => {
        setRouteDraft((prev) => ({ ...prev, toCompany: newValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.date) {
            toast.error('Please select a date');
            return;
        }

        const from = routeDraft.fromCompany;
        const to = routeDraft.toCompany;
        if (!from || !to) {
            toast.error('Please select both From Company and To Company');
            return;
        }
        if (from._id === to._id) {
            toast.error('From Company and To Company cannot be the same');
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/create`,
                {
                    ...formData,
                    fromCompany: from._id,
                    fromCompanyName: from.companyName || '',
                    toCompany: to._id,
                    toCompanyName: to.companyName || '',
                },
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (data?.success) {
                toast.success('Activity log created successfully');
                setFormData({
                    date: new Date().toISOString().split('T')[0],
                    km: '',
                    inTime: '',
                    outTime: '',
                    callType: '',
                    leaveOrWork: '',
                    assignedTo: '',
                    remarks: '',
                });
                setRouteDraft({ fromCompany: null, toCompany: null });
            } else {
                toast.error(data?.message || 'Failed to create activity log');
            }
        } catch (error) {
            console.error('Error creating activity log:', error);
            toast.error(
                error.response?.data?.message || 'Failed to create activity log'
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
                            <Autocomplete
                                fullWidth
                                options={companies}
                                getOptionLabel={(option) =>
                                    option.companyName || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option._id === value._id
                                }
                                value={routeDraft.fromCompany}
                                onChange={handleDraftFromCompanyChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="From Company"
                                        variant="outlined"
                                        placeholder="Select From"
                                    />
                                )}
                            />
                        </Grid>

                        {/* To Company */}
                        <Grid item xs={12} md={4}>
                            <Autocomplete
                                fullWidth
                                options={companies}
                                getOptionLabel={(option) =>
                                    option.companyName || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option._id === value._id
                                }
                                value={routeDraft.toCompany}
                                onChange={handleDraftToCompanyChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="To Company"
                                        variant="outlined"
                                        placeholder="Select To"
                                    />
                                )}
                            />
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
                        {/* <Grid item xs={12} md={6}>
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
                        </Grid> */}

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

        </div>
    );
};

export default EmployeeActivityLogForm;

