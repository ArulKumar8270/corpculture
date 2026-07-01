import React, { useState, useEffect, useCallback } from 'react';
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
    TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/auth';

const ServiceReportsSummary = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serialNoFilter, setSerialNoFilter] = useState('');
    const [reportData, setReportData] = useState([]);

    const fetchServiceReportsCount = useCallback(async (serialNo = '') => {
        const params = new URLSearchParams({ page: '1', limit: '1', reportType: 'Service_Report' });
        if (serialNo.trim()) params.set('serialNo', serialNo.trim());
        const { data } = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/report/Service_Report?${params.toString()}`,
            { headers: { Authorization: auth.token } }
        );
        return data?.totalCount ?? 0;
    }, [auth.token]);

    const fetchServiceGatePassCount = useCallback(async (serialNo = '') => {
        const params = new URLSearchParams({ page: '1', limit: '1', reportType: 'Service_Gate_Pass' });
        if (serialNo.trim()) params.set('serialNo', serialNo.trim());
        const { data } = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/report/Service_Gate_Pass?${params.toString()}`,
            { headers: { Authorization: auth.token } }
        );
        return data?.totalCount ?? 0;
    }, [auth.token]);

    const fetchSummaryData = useCallback(async (serialNo = '') => {
        setLoading(true);
        setError(null);

        if (!auth?.token) {
            setError('Authentication token not available. Please log in.');
            setLoading(false);
            return;
        }

        try {
            const [
                serviceInvoicesRes,
                serviceQuotationsRes,
                serviceReportsCount,
                serviceGatePassCount,
                serviceEnquiriesRes
            ] = await Promise.allSettled([
                axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    { invoiceType: 'invoice', page: 1, limit: 1 },
                    { headers: { Authorization: auth.token } }
                ),
                axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    { invoiceType: 'quotation', page: 1, limit: 1 },
                    { headers: { Authorization: auth.token } }
                ),
                fetchServiceReportsCount(serialNo),
                fetchServiceGatePassCount(serialNo),
                axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service/all`,
                    { headers: { Authorization: auth.token } }
                )
            ]);

            setReportData([
                {
                    id: 'serviceInvoices',
                    name: 'Service Invoices',
                    count: serviceInvoicesRes?.value?.data?.totalCount ?? 0,
                    path: '../serviceInvoicesReport',
                },
                {
                    id: 'serviceQuotations',
                    name: 'Service Quotations',
                    count: serviceQuotationsRes?.value?.data?.totalCount ?? 0,
                    path: '../serviceQuotationsReport',
                },
                {
                    id: 'serviceReports',
                    name: 'Service Reports',
                    count: serviceReportsCount?.status === 'fulfilled' ? (serviceReportsCount.value ?? 0) : 0,
                    path: '../serviceReportsReport',
                    supportsSerialFilter: true,
                },
                {
                    id: 'serviceGatePass',
                    name: 'Service Gate Pass',
                    count: serviceGatePassCount?.status === 'fulfilled' ? (serviceGatePassCount.value ?? 0) : 0,
                    path: '../serviceGatePassList',
                    supportsSerialFilter: true,
                },
                {
                    id: 'serviceEnquiries',
                    name: 'Service Enquiries',
                    count: serviceEnquiriesRes?.value?.data?.totalCount ?? 0,
                    path: '../serviceEnquiriesReport',
                },
            ]);
        } catch (err) {
            console.error('Error loading service overview data:', err);
            setError('Failed to load service overview data.');
        } finally {
            setLoading(false);
        }
    }, [auth?.token, fetchServiceReportsCount, fetchServiceGatePassCount]);

    useEffect(() => {
        if (auth?.token) fetchSummaryData('');
    }, [auth?.token, fetchSummaryData]);

    const handleApplySerialFilter = () => {
        fetchSummaryData(serialNoFilter);
    };

    const handleClearSerialFilter = () => {
        setSerialNoFilter('');
        fetchSummaryData('');
    };

    const handleViewDetails = (item) => {
        if (item.supportsSerialFilter && serialNoFilter.trim()) {
            navigate(`${item.path}?serialNo=${encodeURIComponent(serialNoFilter.trim())}`);
            return;
        }
        navigate(item.path);
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
                <Button onClick={() => fetchSummaryData('')} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Reports Summary
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Serial No"
                        value={serialNoFilter}
                        onChange={(e) => setSerialNoFilter(e.target.value)}
                        placeholder="Filter service reports by serial no"
                        sx={{ minWidth: 260 }}
                    />
                    <Button variant="contained" onClick={handleApplySerialFilter} sx={{ height: '56px' }}>
                        Filter
                    </Button>
                    <Button variant="outlined" onClick={handleClearSerialFilter} sx={{ height: '56px' }}>
                        Clear
                    </Button>
                </Box>
                {serialNoFilter.trim() ? (
                    <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
                        Service Reports count reflects serial no &quot;{serialNoFilter.trim()}&quot;. Open Service Reports to see matching entries.
                    </Typography>
                ) : null}
            </Paper>
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
                                                onClick={() => handleViewDetails(item)}
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
