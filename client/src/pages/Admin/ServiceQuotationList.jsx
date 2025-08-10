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
// Row component for each quotation, allowing expansion to show products
function QuotationRow(props) {
    const { quotation, navigate } = props; // Destructure navigate from props
    const [open, setOpen] = useState(false);
    const { auth, userPermissions } = useAuth();
    const [openPaymentModal, setOpenPaymentModal] = useState(false); // State for payment modal
    const [paymentForm, setPaymentForm] = useState({ // State for payment form data
        modeOfPayment: quotation.modeOfPayment || '',
        bankName: quotation.bankName || '',
        transactionDetails: quotation.transactionDetails || '', // e.g., cheque number, UPI ID
        chequeDate: quotation.chequeDate || '', // New field for Cheque
        transferDate: quotation.transferDate || '', // New field for Bank Transfer/UPI
        companyNamePayment: quotation.companyNamePayment || '', // New field for Cheque/Bank Transfer/UPI
        otherPaymentMode: quotation.otherPaymentMode || '', // New field for OTHERS
    });
    const [loading, setLoading] = useState(true);


    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleEdit = () => {
        navigate(`../addServiceQuotation/${quotation._id}`); // Navigate to edit page
    };

    const handleUploadSignedQuotation = async (quotationId, oldQuotationLink) => {
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
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/update/${quotationId}`,
                        {
                            quotationLink: [...oldQuotationLink, res.data?.fileUrl],
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
            props.onQuotationUpdate();
        };

        input.click();
    };

    const handleOpenPaymentDetailsModal = () => {
        setPaymentForm({
            modeOfPayment: quotation.modeOfPayment || '',
            bankName: quotation.bankName || '',
            transactionDetails: quotation.transactionDetails || '',
            chequeDate: quotation.chequeDate ? new Date(quotation.chequeDate).toISOString().split('T')[0] : '',
            transferDate: quotation.transferDate ? new Date(quotation.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: quotation.companyNamePayment || '',
            otherPaymentMode: quotation.otherPaymentMode || '',
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
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/update/${quotation._id}`,
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
                // You might want to trigger a re-fetch of quotations in the parent component
                // or update the specific quotation in the `quotations` state.
                // For simplicity, we'll just close the modal and show success.
                props.onQuotationUpdate(); // Call the prop to trigger re-fetch in parent
            } else {
                toast.error(res.data?.message || 'Failed to update payment details.');
            }
        } catch (error) {
            console.error('Error updating payment details:', error);
            toast.error(error.response?.data?.message || 'Something went wrong while updating payment details.');
        }
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
                    {quotation.quotationNumber}
                </TableCell>
                <TableCell>{quotation.companyId?.companyName || 'N/A'}</TableCell>
                <TableCell>{quotation.modeOfPayment}</TableCell>
                <TableCell>{quotation.deliveryAddress}</TableCell>
                <TableCell align="right">{quotation.grandTotal.toFixed(2)}</TableCell>
                <TableCell>{quotation.status}</TableCell>
                <TableCell>{new Date(quotation.quotationDate).toLocaleDateString()}</TableCell>
                <TableCell>
                    {quotation?.assignedTo ? (
                        <Chip label={quotation.assignedTo} size="small" color="primary" variant="outlined" />
                    ) : (
                        'N/A'
                    )}
                </TableCell>
                <TableCell>
                    {hasPermission("serviceQuotation") ? <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={handleEdit}>Edit</Button> : null}
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => { }}>Send Quotation</Button>
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={handleOpenPaymentDetailsModal}>Update Payment Details</Button>

                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#28a745', '&:hover': { bgcolor: '#218838' } }}
                        startIcon={<UploadFileIcon />}
                        onClick={() => handleUploadSignedQuotation(quotation?._id, quotation?.quotationLink)}
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
                                Quotation Links
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap"> {/* Use Stack for layout */}
                                {
                                    quotation.quotationLink?.map((link, index) => (
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
                                            Quotation {index + 1}
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
                                    {quotation.products.map((product) => (
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

const ServiceQuotationList = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { auth, userPermissions } = useAuth();

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const navigate = useNavigate(); // Initialize useNavigate
    const [searchTerm, setSearchTerm] = useState('');
    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-quotation/${auth?.user?.role === 3 ? `assignedTo/${auth?.user?._id}` : "all"}`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            if (data?.success) {
                setQuotations(data.serviceQuotations);
            } else {
                toast.error(data?.message || 'Failed to fetch service quotations.');
            }
        } catch (error) {
            console.error("Error fetching service quotations:", error);
            toast.error(error.response?.data?.message || 'Something went wrong while fetching quotations.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchQuotations();
    }, [auth.token]);



    // Filter quotations based on search term
    const filteredQuotaion = quotations.filter(quotation => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            quotation.quotationNumber.toLowerCase().includes(lowerCaseSearchTerm) ||
            quotation.companyId?.companyName.toLowerCase().includes(lowerCaseSearchTerm) ||
            quotation.modeOfPayment.toLowerCase().includes(lowerCaseSearchTerm) ||
            quotation.status.toLowerCase().includes(lowerCaseSearchTerm) ||
            new Date(quotation.quotationDate).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
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
                    Service Quotations
                </Typography>
                {hasPermission("serviceQuotation") ? <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button onClick={() => navigate("../addServiceQuotation")} color="primary">
                        Create New Quotation
                    </Button>
                </Typography> : null}
            </div>
            {/* Search Input Field */}
            <TextField
                fullWidth
                margin="normal"
                label="Search Quotations (Quotation No., Company, Payment Mode, Status, Date)"
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
                                <TableCell>Quotation Number</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Payment Mode</TableCell>
                                <TableCell>Delivery Address</TableCell>
                                <TableCell align="right">Grand Total</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Quotation Date</TableCell>
                                <TableCell>Assign To</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredQuotaion.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service quotations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredQuotaion?.map((quotation) => (
                                    <QuotationRow key={quotation._id} quotation={quotation} navigate={navigate} onQuotationUpdate={() => fetchQuotations()} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ServiceQuotationList;