import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Typography, Box, CircularProgress, Paper, Grid, Button
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import InfoIcon from '@mui/icons-material/Info'; // For "More info" icon

const ServiceReports = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [serviceCounts, setServiceCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllServicesAndAggregate = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });

                if (data?.success) {
                    const aggregatedData = {};
                    data.services.forEach(service => {
                        const type = service.serviceType || 'Uncategorized';
                        const title = service.serviceTitle || type; // Use serviceTitle, fallback to serviceType
                        if (!aggregatedData[type]) {
                            aggregatedData[type] = { total: 0, new: 0, displayTitle: title }; // Store the serviceTitle here
                        }
                        aggregatedData[type].total++;
                        // Assuming 'new' services are those without an assigned employeeId
                        if (!service.employeeId) {
                            aggregatedData[type].new++;
                        }
                    });
                    setServiceCounts(aggregatedData);
                } else {
                    setError(data?.message || 'Failed to fetch services.');
                    toast.error(data?.message || 'Failed to fetch services.');
                }
            } catch (err) {
                console.error('Error fetching services for reports:', err);
                setError('Something went wrong while fetching service data.');
                toast.error('Something went wrong while fetching service data.');
            } finally {
                setLoading(false);
            }
        };

        if (auth?.token) {
            fetchAllServicesAndAggregate();
        }
    }, [auth?.token]);

    const getCardColor = (index) => {
        const colors = ['#019ee3', '#dc3545', '#28a745', '#ffc107', '#6c757d', '#007bff']; // Example colors
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <Typography variant="h4" component="h1" gutterBottom className="text-2xl font-bold text-[#019ee3] mb-6">
                Service Requests Overview
            </Typography>

            <Box mb={4}>
                <Typography variant="h6" gutterBottom>Service Requests Tab</Typography>
                <Grid container spacing={3}>
                    {Object.entries(serviceCounts).map(([serviceType, counts], index) => ( // Removed serviceTitle from destructuring here
                        <Grid item xs={12} sm={6} md={4} lg={3} key={serviceType}>
                            <Paper
                                sx={{
                                    p: 3,
                                    backgroundColor: getCardColor(index),
                                    color: 'white',
                                    borderRadius: '8px',
                                    boxShadow: 3,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '150px',
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h5" component="div" fontWeight="bold">
                                        {counts.new}/{counts.total}
                                    </Typography>
                                    {/* You can add an icon here if needed, e.g., a chat bubble */}
                                </Box>
                                <Typography variant="subtitle1" mt={1}>
                                    {counts.displayTitle} {/* Display the stored serviceTitle */}
                                </Typography>
                                <Button
                                    variant="text"
                                    sx={{ color: 'white', alignSelf: 'flex-end', mt: 1 }}
                                    onClick={() => navigate(`../service-enquiries?serviceType=${encodeURIComponent(serviceType)}`)}
                                    endIcon={<InfoIcon />}
                                >
                                    More info
                                </Button>
                            </Paper>
                        </Grid>
                    ))}
                    {Object.keys(serviceCounts).length === 0 && (
                        <Grid item xs={12}>
                            <Typography variant="body1" className="text-center text-gray-500 py-4">
                                No service requests found.
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* You can add similar sections for "Rental Requests Tab" and "AMC Tab" if your data supports it */}
            {/* For example, if your service model has a 'requestType' field like 'Service', 'Rental', 'AMC' */}
            {/* <Box mb={4}>
                <Typography variant="h6" gutterBottom>Rental Requests Tab</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Paper sx={{ p: 3, backgroundColor: '#28a745', color: 'white', borderRadius: '8px', boxShadow: 3 }}>
                            <Typography variant="h5" component="div" fontWeight="bold">
                                0/442
                            </Typography>
                            <Typography variant="subtitle1" mt={1}>
                                Printer Rental Service
                            </Typography>
                            <Button variant="text" sx={{ color: 'white', alignSelf: 'flex-end', mt: 1 }} endIcon={<InfoIcon />}>
                                More info
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box> */}

            {/* <Box mb={4}>
                <Typography variant="h6" gutterBottom>AMC Tab</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Paper sx={{ p: 3, backgroundColor: '#007bff', color: 'white', borderRadius: '8px', boxShadow: 3 }}>
                            <Typography variant="h5" component="div" fontWeight="bold">
                                0/3
                            </Typography>
                            <Typography variant="subtitle1" mt={1}>
                                Computer Service
                            </Typography>
                            <Button variant="text" sx={{ color: 'white', alignSelf: 'flex-end', mt: 1 }} endIcon={<InfoIcon />}>
                                More info
                            </Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Paper sx={{ p: 3, backgroundColor: '#dc3545', color: 'white', borderRadius: '8px', boxShadow: 3 }}>
                            <Typography variant="h5" component="div" fontWeight="bold">
                                0/15
                            </Typography>
                            <Typography variant="subtitle1" mt={1}>
                                Printer Service
                            </Typography>
                            <Button variant="text" sx={{ color: 'white', alignSelf: 'flex-end', mt: 1 }} endIcon={<InfoIcon />}>
                                More info
                            </Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={3}>
                        <Paper sx={{ p: 3, backgroundColor: '#019ee3', color: 'white', borderRadius: '8px', boxShadow: 3 }}>
                            <Typography variant="h5" component="div" fontWeight="bold">
                                0/3
                            </Typography>
                            <Typography variant="subtitle1" mt={1}>
                                AC Service
                            </Typography>
                            <Button variant="text" sx={{ color: 'white', alignSelf: 'flex-end', mt: 1 }} endIcon={<InfoIcon />}>
                                More info
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Box> */}
        </div>
    );
};

export default ServiceReports;