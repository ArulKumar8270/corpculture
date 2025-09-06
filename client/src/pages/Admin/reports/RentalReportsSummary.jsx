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
import axios from 'axios'; // Uncomment if you fetch real data
import { useAuth } from '../../../context/auth'; // Uncomment if you need auth context

const RentalReportsSummary = () => {
    const navigate = useNavigate();
    const { auth } = useAuth(); // Uncomment if you need auth context
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sample data for demonstration
    // In a real application, these counts would be fetched from your backend API
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use Promise.allSettled to fetch all data concurrently
                // This allows individual requests to fail without stopping others
                const [
                    rentalInvoicesRes,
                    rentalQuotationsRes,
                    rentalReportsRes,
                    rentalEnquiriesRes
                ] = await Promise.allSettled([
                    // rental Invoices API call
                    axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                        { invoiceType: "invoice" },
                        { headers: { Authorization: auth.token } }
                    ),
                    // rental Quotations API call
                    axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                        { invoiceType: "quotation" },
                        { headers: { Authorization: auth.token } }
                    ),
                    // rental Reports API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/report/rental`,
                        { headers: { Authorization: auth.token } }
                    ),
                    // rental Enquiries API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental/all`,
                        { headers: { Authorization: auth.token } }
                    )
                ]);

                // Removed setTimeout
                const data = [
                    { id: 'rentalInvoices', name: 'Rental Invoices', count: rentalInvoicesRes?.value?.data?.totalCount ?? 0, path: '../rantalInvoicesReport' },
                    { id: 'rentalQuotations', name: 'Rental Quotations', count: rentalQuotationsRes?.value?.data?.totalCount ?? 0, path: '../rentalQuotationsReport' },
                    { id: 'rentalReports', name: 'Rental Reports', count: rentalReportsRes?.value?.data?.totalCount ?? 0, path: '../rentalReportsReport' },
                    // { id: 'productsUsed', name: 'Products Used in Rental', count: 500, path: '/admin/reports/rental/products' },
                    { id: 'rentalEnquiries', name: 'Rental Enquiries', count: rentalEnquiriesRes?.value?.data?.totalCount ?? 0, path: '../rentalEnquiriesReport' },
                ];
                setReportData(data);
            } catch (err) {
                console.error('Error loading rental overview data:', err);
                setError('Failed to load rental overview data.');
            } finally {
                setLoading(false); // Ensure loading state is always reset
            }
        };

        fetchData();

    }, [auth.token]);

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
                Rental Reports Summary
            </Typography>
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

export default RentalReportsSummary;