import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Tooltip,
    IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios'; // Uncommented
import { useAuth } from '../../../context/auth'; // Uncommented

const ServiceReportsSummary = () => {
    const navigate = useNavigate();
    const { auth } = useAuth(); // Uncommented
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize reportData as an empty array, it will be populated after fetching
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setLoading(true);
            setError(null);

            // Ensure auth token is available before making API calls
            if (!auth?.token) {
                setError("Authentication token not available. Please log in.");
                setLoading(false);
                return;
            }

            try {
                // Use Promise.allSettled to fetch all data concurrently
                // This allows individual requests to fail without stopping others
                const [
                    serviceInvoicesRes,
                    serviceQuotationsRes,
                    serviceReportsRes,
                    serviceEnquiriesRes
                ] = await Promise.allSettled([
                    // Service Invoices API call
                    axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                        { invoiceType: "invoice" },
                        { headers: { Authorization: auth.token } }
                    ),
                    // Service Quotations API call
                    axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                        { invoiceType: "quotation" },
                        { headers: { Authorization: auth.token } }
                    ),
                    // Service Reports API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/report/service`,
                        { headers: { Authorization: auth.token } }
                    ),
                    // Service Enquiries API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service/all`,
                        { headers: { Authorization: auth.token } }
                    )
                ]);
                // Construct the new report data based on successful responses
                const newReportData = [
                    {
                        id: 'serviceInvoices',
                        name: 'Service Invoices',
                        count:  serviceInvoicesRes?.value?.data?.totalCount ?? 0, // Default to 0 if request failed or data is not successful
                        path: '../serviceInvoicesReport'
                    },
                    {
                        id: 'serviceQuotations',
                        name: 'Service Quotations',
                        count:  serviceQuotationsRes?.value?.data?.totalCount ?? 0,
                        path: '../serviceQuotationsReport'
                    },
                    {
                        id: 'serviceReports',
                        name: 'Service Reports',
                        count:  serviceReportsRes?.value?.data?.totalCount ?? 0,
                        path: '../serviceReportsReport'
                    },
                    {
                        id: 'serviceEnquiries',
                        name: 'Service Enquiries',
                        count: serviceEnquiriesRes?.value?.data?.totalCount ?? 0,
                        path: '../serviceEnquiriesReport'
                    },
                ];
                setReportData(newReportData);

            } catch (err) {
                console.error('Error loading service overview data:', err);
                setError('Failed to load service overview data.');
                toast.error('Failed to load service overview data.');
            } finally {
                setLoading(false);
            }
        };

        // Only call fetchSummaryData if auth token is available
        if (auth?.token) {
            fetchSummaryData();
        }
    }, [auth?.token]); // Re-run effect if auth token changes

    const handleViewDetails = (path, categoryName) => {
        navigate(path);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
                <Typography variant="h6">Error: {error}</Typography>
                <Button onClick={() => window.location.reload()} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Reports Summary
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="service reports summary table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>Category</TableCell>
                                <TableCell align="center">Count</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reportData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service summary data found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewDetails(item.path, item.name)}
                                                disabled={item.count === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {item.count}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ServiceReportsSummary;