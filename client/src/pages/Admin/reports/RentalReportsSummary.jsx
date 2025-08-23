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

const RentalReportsSummary = () => {
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
                    { id: 'reantalInvoices', name: 'Reantal Invoices', count: 120, path: '/admin/reports/reantal/invoices' },
                    { id: 'reantalQuotations', name: 'Reantal Quotations', count: 150, path: '/admin/reports/reantal/quotations' },
                    { id: 'reantalReports', name: 'Reantal Reports & Gatpass', count: 200, path: '/admin/reports/reantal/reports-gatpass' },
                    { id: 'productsUsed', name: 'Products Used in Reantal', count: 500, path: '/admin/reports/reantal/products' },
                    { id: 'reantalEnquiries', name: 'Reantal Enquiries', count: 80, path: '/admin/reports/reantal/enquiries' },
                ];
                setReportData(data);
                setLoading(false);
            }, 500);
        } catch (err) {
            console.error('Error loading reantal overview data:', err);
            setError('Failed to load reantal overview data.');
            setLoading(false);
        }
    }, []);

    const handleViewDetails = (path, categoryName) => {
        toast.info(`Navigating to ${categoryName} list.`);
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
                reantal Reports Summary
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