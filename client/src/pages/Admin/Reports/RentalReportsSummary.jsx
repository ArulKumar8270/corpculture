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

const RentalReportsSummary = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serialNoFilter, setSerialNoFilter] = useState('');
    const [reportData, setReportData] = useState([]);

    const fetchRentalReportsCount = useCallback(async (serialNo = '') => {
        const params = new URLSearchParams({ page: '1', limit: '1', reportType: 'Rental_Report' });
        if (serialNo.trim()) params.set('serialNo', serialNo.trim());
        const { data } = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/report/Rental_Report?${params.toString()}`,
            { headers: { Authorization: auth.token } }
        );
        return data?.totalCount ?? 0;
    }, [auth.token]);

    const fetchData = useCallback(async (serialNo = '') => {
        setLoading(true);
        setError(null);
        try {
            const [
                rentalInvoicesRes,
                rentalQuotationsRes,
                rentalReportsCount,
                rentalEnquiriesRes
            ] = await Promise.allSettled([
                axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                    { invoiceType: 'invoice', page: 1, limit: 1 },
                    { headers: { Authorization: auth.token } }
                ),
                axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                    { invoiceType: 'quotation', page: 1, limit: 1 },
                    { headers: { Authorization: auth.token } }
                ),
                fetchRentalReportsCount(serialNo),
                axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental/all`,
                    { headers: { Authorization: auth.token } }
                )
            ]);

            const data = [
                { id: 'rentalInvoices', name: 'Rental Invoices', count: rentalInvoicesRes?.value?.data?.totalCount ?? 0, path: '../rantalInvoicesReport' },
                { id: 'rentalQuotations', name: 'Rental Quotations', count: rentalQuotationsRes?.value?.data?.totalCount ?? 0, path: '../rentalQuotationsReport' },
                { id: 'rentalReports', name: 'Rental Reports', count: rentalReportsCount?.status === 'fulfilled' ? (rentalReportsCount.value ?? 0) : 0, path: '../rentalReportsReport', supportsSerialFilter: true },
                { id: 'rentalEnquiries', name: 'Rental Enquiries', count: rentalEnquiriesRes?.value?.data?.totalCount ?? 0, path: '../rentalEnquiriesReport' },
            ];
            setReportData(data);
        } catch (err) {
            console.error('Error loading rental overview data:', err);
            setError('Failed to load rental overview data.');
        } finally {
            setLoading(false);
        }
    }, [auth.token, fetchRentalReportsCount]);

    useEffect(() => {
        if (auth?.token) fetchData('');
    }, [auth?.token, fetchData]);

    const handleApplySerialFilter = () => {
        fetchData(serialNoFilter);
    };

    const handleClearSerialFilter = () => {
        setSerialNoFilter('');
        fetchData('');
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
                <Button onClick={() => fetchData()} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Rental Reports Summary
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px', mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <TextField
                        label="Serial No"
                        value={serialNoFilter}
                        onChange={(e) => setSerialNoFilter(e.target.value)}
                        placeholder="Filter rental reports by serial no"
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
                        Rental Reports count reflects serial no &quot;{serialNoFilter.trim()}&quot;. Open Rental Reports to see matching entries.
                    </Typography>
                ) : null}
            </Paper>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="reantal reports summary table">
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
                                        No reantal summary data found.
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

export default RentalReportsSummary;
