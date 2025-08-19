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
    Button,
    Dialog, // Added Dialog
    DialogTitle, // Added DialogTitle
    DialogContent, // Added DialogContent
    DialogActions, // Added DialogActions
    TextField, // Added TextField
    FormControl, // Added FormControl
    InputLabel, // Added InputLabel
    Select, // Added Select
    MenuItem // Added MenuItem
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LinkIcon from '@mui/icons-material/Link'; // Import LinkIcon
import Stack from '@mui/material/Stack'; // Import Stack for layout
import Chip from '@mui/material/Chip'; // Import Chip for assignedTo UI
import ServiceQuotationList from './ServiceQuotationList';

// Row component for each invoice, allowing expansion to show products
function InvoiceRow(props) {
    const { invoice, navigate } = props;
    const { auth, userPermissions } = useAuth();
    const [open, setOpen] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false); // State for payment modal
    const [loading, setLoading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ // State for payment form data
        modeOfPayment: invoice.modeOfPayment || '',
        bankName: invoice.bankName || '',
        transactionDetails: invoice.transactionDetails || '', // e.g., cheque number, UPI ID
        chequeDate: invoice.chequeDate || '', // New field for Cheque
        transferDate: invoice.transferDate || '', // New field for Bank Transfer/UPI
        companyNamePayment: invoice.companyNamePayment || '', // New field for Cheque/Bank Transfer/UPI
        otherPaymentMode: invoice.otherPaymentMode || '', // New field for OTHERS
    });

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleEdit = () => {
        navigate(`../addServiceInvoice/${invoice._id}`);
    };

    const handleUploadSignedInvoice = async (invoiceId, oldInvoicLink) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("file", file);
            try {
                setLoading(true)
                const res = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/upload-file`, formData,
                    {
                        headers: {
                            Authorization: auth?.token
                        },
                    }
                );
                try {
                    const serviceRes = await axios.put(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoiceId}`,
                        {
                            invoiceLink: [...oldInvoicLink, res.data?.fileUrl],
                            status: "InvoiceSent"
                        },
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    toast.success("Signed invoice uploaded successfully!");
                    // Optionally, refresh the list or update the specific invoice in state
                } catch (err) {
                    console.error("Upload failed", err);
                    toast.error(err.response?.data?.message || "Failed to upload signed invoice.");
                }
            } catch (error) {
                console.log(error, "Api error");
            }
            setLoading(false)
            props.onInvoiceUpdate();
        };

        input.click();
    };

    const handleOpenPaymentDetailsModal = () => {
        setPaymentForm({
            modeOfPayment: invoice.modeOfPayment || '',
            bankName: invoice.bankName || '',
            transactionDetails: invoice.transactionDetails || '',
            chequeDate: invoice.chequeDate ? new Date(invoice.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice.transferDate ? new Date(invoice.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice.companyNamePayment || '',
            otherPaymentMode: invoice.otherPaymentMode || '',
        });
        setOpenPaymentModal(true);
    };

    const handleClosePaymentDetailsModal = () => {
        setOpenPaymentModal(false);
        // Optionally reset form here if needed, but it's re-initialized on open
    };

    const handlePaymentFormChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePaymentDetails = async () => {
        try {
            const payload = {
                modeOfPayment: paymentForm.modeOfPayment,
                bankName: paymentForm.bankName,
                transactionDetails: paymentForm.transactionDetails,
                chequeDate: paymentForm.chequeDate,
                transferDate: paymentForm.transferDate,
                companyNamePayment: paymentForm.companyNamePayment,
                otherPaymentMode: paymentForm.otherPaymentMode,
            };

            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoice._id}`,
                payload,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (res.data?.success) {
                toast.success(res.data.message || 'Payment details updated successfully!');
                handleClosePaymentDetailsModal();
                // You might want to trigger a re-fetch of invoices in the parent component
                // or update the specific invoice in the `invoices` state.
                // For simplicity, we'll just close the modal and show success.
                props.onInvoiceUpdate(); // Call the prop to trigger re-fetch in parent
            } else {
                toast.error(res.data?.message || 'Failed to update payment details.');
            }
        } catch (error) {
            console.error('Error updating payment details:', error);
            toast.error(error.response?.data?.message || 'Something went wrong while updating payment details.');
        }
    };

    const onSendInvoice = async (invoice) => {
        console.log(invoice, "invoice79037254093")
    }

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
                <TableCell>
                    {invoice?.assignedTo ? (
                        <Chip label={invoice.assignedTo?.name} size="small" color="primary" variant="outlined" />
                    ) : (
                        'N/A'
                    )}
                </TableCell>
                <TableCell>
                    {hasPermission("serviceInvoice") ? <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={handleEdit}>Edit</Button> : null}
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => onSendInvoice(invoice)}>Send InVoice</Button>
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={handleOpenPaymentDetailsModal}>Update Payment Details</Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#28a745', '&:hover': { bgcolor: '#218838' } }}
                        startIcon={<UploadFileIcon />}
                        onClick={() => handleUploadSignedInvoice(invoice?._id, invoice?.invoiceLink)}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Upload Signed Copy'}
                    </Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Invoice Links
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap"> {/* Use Stack for layout */}
                                {
                                    invoice.invoiceLink?.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant="outlined"
                                            size="small"
                                            startIcon={<LinkIcon />}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ my: 0.5 }} // Add some vertical margin for wrapping
                                        >
                                            Invoice {index + 1}
                                        </Button>
                                    ))
                                }
                            </Stack>
                        </Box>
                    </Collapse>
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

            {/* Payment Details Update Modal */}
            <Dialog open={openPaymentModal} onClose={handleClosePaymentDetailsModal}>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal" size="small">
                        <InputLabel id="mode-of-payment-label">Mode Of Payment</InputLabel>
                        <Select
                            labelId="mode-of-payment-label"
                            id="modeOfPayment"
                            name="modeOfPayment"
                            value={paymentForm.modeOfPayment}
                            onChange={handlePaymentFormChange}
                            label="Mode Of Payment"
                        >
                            <MenuItem value="">--select Payment Mode--</MenuItem>
                            <MenuItem value="CHEQUE">CHEQUE</MenuItem>
                            <MenuItem value="BANK TRANSFER">BANK TRANSFER</MenuItem>
                            <MenuItem value="CASH">CASH</MenuItem>
                            <MenuItem value="OTHERS">OTHERS</MenuItem>
                            <MenuItem value="UPI">UPI</MenuItem>
                        </Select>
                    </FormControl>

                    {paymentForm.modeOfPayment === 'CHEQUE' && (
                        <>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Cheque Number"
                                name="transactionDetails"
                                value={paymentForm.transactionDetails}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Cheque Date"
                                name="chequeDate"
                                type="date"
                                value={paymentForm.chequeDate}
                                onChange={handlePaymentFormChange}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Bank Name"
                                name="bankName"
                                value={paymentForm.bankName}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Company Name"
                                name="companyNamePayment"
                                value={paymentForm.companyNamePayment}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                        </>
                    )}
                    {paymentForm.modeOfPayment === 'BANK TRANSFER' && (
                        <>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Transaction ID"
                                name="transactionDetails"
                                value={paymentForm.transactionDetails}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Transfer Date"
                                name="transferDate"
                                type="date"
                                value={paymentForm.transferDate}
                                onChange={handlePaymentFormChange}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Bank Name"
                                name="bankName"
                                value={paymentForm.bankName}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Company Name"
                                name="companyNamePayment"
                                value={paymentForm.companyNamePayment}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                        </>
                    )}
                    {paymentForm.modeOfPayment === 'UPI' && (
                        <>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="UPI ID"
                                name="transactionDetails"
                                value={paymentForm.transactionDetails}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Company Name"
                                name="companyNamePayment"
                                value={paymentForm.companyNamePayment}
                                onChange={handlePaymentFormChange}
                                size="small"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Transfer Date"
                                name="transferDate"
                                type="date"
                                value={paymentForm.transferDate}
                                onChange={handlePaymentFormChange}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </>
                    )}
                    {paymentForm.modeOfPayment === 'OTHERS' && (
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Other Payment Mode"
                            name="otherPaymentMode"
                            value={paymentForm.otherPaymentMode}
                            onChange={handlePaymentFormChange}
                            size="small"
                        />
                    )}
                    {/* For CASH, no specific additional fields are added here */}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePaymentDetailsModal} color="primary">
                        Close
                    </Button>
                    <Button onClick={handleSavePaymentDetails} color="primary" variant="contained">
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

const ServiceInvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const { auth, userPermissions } = useAuth();
    const [movidedList, setMovidedList] = useState(false); // New state for movidedList
    const navigate = useNavigate(); // Initialize useNavigate
    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/${auth?.user?.role === 3 ? `assignedTo/${auth?.user?._id}` : "all"}`, {
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

    useEffect(() => {
        fetchInvoices();
    }, [auth.token]);

    // Filter invoices based on search term
    const filteredInvoices = invoices?.filter(invoice => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            invoice.invoiceNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
            invoice.companyId?.companyName.toLowerCase().includes(lowerCaseSearchTerm) ||
            invoice.modeOfPayment.toLowerCase().includes(lowerCaseSearchTerm) ||
            invoice.status.toLowerCase().includes(lowerCaseSearchTerm) ||
            new Date(invoice.invoiceDate).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
        );
    });

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }} className='w-[95%]'>
            <div className='flex justify-between'>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    Service Invoices
                </Typography>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button color="secondary" onClick={() => setMovidedList((prev) => !prev)} variant="outlined">
                        {!movidedList ? "Movided Invoices" : "All Invoices"}
                    </Button>
                </Typography>
                {hasPermission("serviceInvoice") ? <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button onClick={() => navigate("../addServiceInvoice")} color="primary">
                        Create New Invoice
                    </Button>
                </Typography> : null}
            </div>
            {/* Search Input Field */}
            {!movidedList ?
                <><TextField
                    fullWidth
                    margin="normal"
                    label="Search Invoices (Invoice No., Company, Payment Mode, Status, Date)"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mb: 3 }}
                />
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
                                        <TableCell>Assign To</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredInvoices?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                                No service invoices found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredInvoices?.map((invoice) => (
                                            <InvoiceRow key={invoice._id} invoice={invoice} navigate={navigate} onInvoiceUpdate={fetchInvoices} />
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </> : <ServiceQuotationList status="moveToInvoicing" />}
        </Box>
    );
};

export default ServiceInvoiceList;