import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    IconButton,
    Collapse,
    Button
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Row component for each invoice, allowing expansion to show products
function InvoiceRow(props) {
    const { invoice, navigate } = props; // Destructure navigate from props
    const [open, setOpen] = useState(false);

    const handleEdit = () => {
        navigate(`../addServiceInvoice/${invoice._id}`); // Navigate to edit page
    };

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {invoice.invoiceNumber}
                </TableCell>
                <TableCell>{invoice.companyId?.companyName || 'N/A'}</TableCell>
                <TableCell>{invoice.modeOfPayment}</TableCell>
                <TableCell>{invoice.deliveryAddress}</TableCell>
                <TableCell align="right">{invoice.grandTotal.toFixed(2)}</TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell ca>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={handleEdit}>Edit</Button>
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => {}}>Send InVoice</Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Products
                            </Typography>
                            <Table size="small" aria-label="products">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell>SKU</TableCell>
                                        <TableCell>HSN</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Rate</TableCell>
                                        <TableCell align="right">Total Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {invoice.products.map((product) => (
                                        <TableRow key={product.productId._id || product._id}>
                                            <TableCell component="th" scope="row">
                                                {product.productId?.productName || product.productName}
                                            </TableCell>
                                            <TableCell>{product.productId?.sku || 'N/A'}</TableCell>
                                            <TableCell>{product.productId?.hsn || 'N/A'}</TableCell>
                                            <TableCell align="right">{product.quantity}</TableCell>
                                            <TableCell align="right">{product.rate.toFixed(2)}</TableCell>
                                            <TableCell align="right">{product.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

const ServiceInvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setInvoices(data.serviceInvoices);
                } else {
                    toast.error(data?.message || 'Failed to fetch service invoices.');
                }
            } catch (error) {
                console.error("Error fetching service invoices:", error);
                toast.error(error.response?.data?.message || 'Something went wrong while fetching invoices.');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, [auth.token]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Invoices
            </Typography>

            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Invoice Number</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Payment Mode</TableCell>
                                <TableCell>Delivery Address</TableCell>
                                <TableCell align="right">Grand Total</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Invoice Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <InvoiceRow key={invoice._id} invoice={invoice} navigate={navigate} /> 
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ServiceInvoiceList;