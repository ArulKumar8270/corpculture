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
// import axios from 'axios'; // Uncomment if you fetch real data
// import { useAuth } from '../../../context/auth'; // Uncomment if you need auth context

const ServiceReportsSummary = () => {
    const navigate = useNavigate();
    // const { auth } = useAuth(); // Uncomment if you need auth context
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sample data for demonstration
    // In a real application, these counts would be fetched from your backend API
    const [reportData, setReportData] = useState([]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        try {
            // Simulate API call delay to fetch data
            setTimeout(() => {
                const data = [
                    { id: 'serviceInvoices', name: 'Service Invoices', count: 120, path: '../serviceInvoicesReport' },
                    { id: 'serviceQuotations', name: 'Service Quotations', count: 150, path: '../serviceQuotationsReport' },
                    { id: 'serviceReports', name: 'Service Reports', count: 200, path: '/admin/reports/service/reports-gatpass' },
                    // { id: 'productsUsed', name: 'Products Used in Service', count: 500, path: '/admin/reports/service/products' },
                    { id: 'serviceEnquiries', name: 'Service Enquiries', count: 80, path: '/admin/reports/service/enquiries' },
                ];
                setReportData(data);
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error('Error loading service overview data:', err);
            setError('Failed to load service overview data.');
            setLoading(false);
        }
    }, []);

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