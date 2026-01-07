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
import axios from 'axios';
import { useAuth } from '../../../context/auth';

const SalesReportsSummary = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize reportData as an empty array, it will be populated after fetching
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
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
                    productsRes,
                    ordersRes
                ] = await Promise.allSettled([
                    // Sales Products API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/product/seller-product`,
                        { headers: { Authorization: auth.token } }
                    ),
                    // Sales Orders API call
                    axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/user/admin-orders?page=1&limit=1`,
                        { headers: { Authorization: auth.token } }
                    )
                ]);

                // Get products count
                const productsCount = productsRes?.value?.data?.products?.length ?? 0;
                
                // Get orders total count from response
                const ordersCount = ordersRes?.value?.data?.totalCount ?? 0;

                // Construct the report data based on successful responses
                const data = [
                    { id: 'salesProducts', name: 'All Sales Products', count: productsCount, path: '../all-products' },
                    { id: 'salesOrders', name: 'Sales Orders', count: ordersCount, path: '../orders' },
                ];
                setReportData(data);
            } catch (err) {
                console.error('Error loading sales overview data:', err);
                setError('Failed to load sales overview data.');
                toast.error('Failed to load sales overview data.');
            } finally {
                setLoading(false);
            }
        };

        // Only call fetchData if auth token is available
        if (auth?.token) {
            fetchData();
        }
    }, [auth.token]); // Re-run effect if auth token changes

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
                Sales Reports Summary
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="sales reports summary table">
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
                                        No sales summary data found.
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

export default SalesReportsSummary;