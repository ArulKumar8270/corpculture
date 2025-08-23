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
    Chip,
    Tooltip,
    IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';

const ServiceInvoicesReport = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchServiceInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            // Assuming an API endpoint to fetch all service invoices
            // This endpoint should populate companyId and assignedTo for display
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`, {
                headers: { Authorization: auth?.token }
            });
            if (response.data.success) {
                setInvoices(response.data.serviceInvoices);
            } else {
                toast.error(response.data.message || 'Failed to fetch service invoices.');
                setError(response.data.message || 'Failed to fetch service invoices.');
            }
        } catch (err) {
            console.error('Error fetching service invoices:', err);
            setError(err.response?.data?.message || 'Error fetching service invoices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchServiceInvoices();
        }
    }, [auth?.token]);

    const handleView = (invoiceId) => {
        // Navigate to a detailed view of the invoice
        // You'll need to create a component for viewing a single invoice
        navigate(`/admin/service-invoice/${invoiceId}`); // Adjust path as per your routing
    };

    const handleEdit = (invoiceId) => {
        // Navigate to an edit page for the invoice
        // You'll need to create a component for editing an invoice
        navigate(`/admin/edit-service-invoice/${invoiceId}`); // Adjust path as per your routing
    };

    const handleDelete = async (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/${invoiceId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchServiceInvoices(); // Refresh the list
                } else {
                    toast.error(response.data.message || 'Failed to delete invoice.');
                }
            } catch (err) {
                console.error('Error deleting invoice:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while deleting invoice.');
            }
        }
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
                <Button onClick={fetchServiceInvoices} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Invoices Report
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="service invoices table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>Invoice No.</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Invoice Date</TableCell>
                                <TableCell>Grand Total</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice._id}>
                                        <TableCell>{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{invoice.companyId?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{invoice.grandTotal?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell>
                                            <Chip label={invoice.status || 'N/A'} size="small" color="info" />
                                        </TableCell>
                                        <TableCell>
                                            {invoice.assignedTo ? (
                                                <Chip label={invoice.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View Invoice">
                                                <IconButton onClick={() => handleView(invoice._id)} color="info">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Invoice">
                                                <IconButton onClick={() => handleEdit(invoice._id)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Invoice">
                                                <IconButton onClick={() => handleDelete(invoice._id)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
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

export default ServiceInvoicesReport;