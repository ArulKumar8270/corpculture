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
    Button,
    Dialog, // Added Dialog
    DialogTitle, // Added DialogTitle
    DialogContent, // Added DialogContent
    DialogActions, // Added DialogActions
    FormControl, // Added FormControl
    InputLabel, // Added InputLabel
    Select, // Added Select
    MenuItem, // Added MenuItem
    TextField,
    Collapse
} from '@mui/material';
import { Visibility as VisibilityIcon, UploadFile as UploadFileIcon } from '@mui/icons-material'; // {{ edit_1 }}
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import { useNavigate } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link'; // Import LinkIcon
import Stack from '@mui/material/Stack'; // Import Stack for layout
import Chip from '@mui/material/Chip';

function RentalInvoiceList() {
    const [loading, setLoading] = useState(true);
    const [rentalEntries, setRentalEntries] = useState([]);
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate();
    const [openPaymentModal, setOpenPaymentModal] = useState(false); // State for payment modal
    const [paymentForm, setPaymentForm] = useState({ // State for payment form data
        modeOfPayment: '',
        bankName: '',
        transactionDetails: '', // e.g., cheque number, UPI ID
        chequeDate: '', // New field for Cheque
        transferDate: '', // New field for Bank Transfer/UPI
        companyNamePayment: '', // New field for Cheque/Bank Transfer/UPI
        otherPaymentMode: '', // New field for OTHERS,
        invoiceId: ''
    });

    useEffect(() => {
        const fetchRentalEntries = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${auth?.user?.role === 3 ? `assignedTo/${auth?.user?._id}` : "all"}`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setRentalEntries(data.entries);
                } else {
                    toast.error(data?.message || 'Failed to fetch rental entries.');
                }
            } catch (error) {
                console.error("Error fetching rental entries:", error);
                toast.error('Something went wrong while fetching rental entries.');
            } finally {
                setLoading(false);
            }
        };
        fetchRentalEntries();
    }, [auth.token]);


    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    // {{ edit_2 }}
    const handleEdit = (id) => {
        // Implement navigation to edit page or open a modal
        navigate(`../addRentalInvoice/${id}`);
        console.log('Edit:', id);
    };

    const handleSendInvoice = (id) => {
        // Implement logic to send invoice
        toast.success(`Sending invoice for ${id}`);
        console.log('Send Invoice:', id);
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
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${invoiceId}`,
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


    const handleOpenPaymentDetailsModal = (invoice) => {
        setPaymentForm({
            modeOfPayment: invoice?.modeOfPayment || '',
            bankName: invoice?.bankName || '',
            transactionDetails: invoice?.transactionDetails || '',
            chequeDate: invoice?.chequeDate ? new Date(invoice?.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice?.transferDate ? new Date(invoice?.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice?.companyNamePayment || '',
            otherPaymentMode: invoice?.otherPaymentMode || '',
            invoiceId: invoice?._id
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
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${paymentForm?.invoiceId}`,
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
                fetchRentalEntries(); // Call the prop to trigger re-fetch in parent
            } else {
                toast.error(res.data?.message || 'Failed to update payment details.');
            }
        } catch (error) {
            console.error('Error updating payment details:', error);
            toast.error(error.response?.data?.message || 'Something went wrong while updating payment details.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <div className='flex justify-between'>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    Rental Invoice List
                </Typography>
                {hasPermission("rentalInvoice") ? <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button onClick={() => navigate("../addRentalInvoice")} color="primary">
                        Create New Invoice
                    </Button>
                </Typography> : null}
            </div>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                {rentalEntries.length === 0 ? (
                    <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                        No rental invoices found.
                    </Typography>
                ) : (
                    // {{ edit_1 }}
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table stickyHeader aria-label="rental invoice table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Company Name</TableCell>
                                    <TableCell>Serial No.</TableCell>
                                    <TableCell>Model Name</TableCell>
                                    <TableCell>Send Details To</TableCell>
                                    <TableCell>Remarks</TableCell>
                                    <TableCell>Image</TableCell>
                                    <TableCell>Assinged To</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rentalEntries.map((entry) => (
                                    <>
                                        <TableRow key={entry._id}>
                                            <TableCell>{entry.companyId?.companyName || 'N/A'}</TableCell>
                                            <TableCell>{entry.machineId?.serialNo || 'N/A'}</TableCell>
                                            <TableCell>{entry.machineId?.modelName || 'N/A'}</TableCell>
                                            <TableCell>{entry.sendDetailsTo}</TableCell>
                                            <TableCell>{entry.remarks}</TableCell>
                                            <TableCell>
                                                {entry.countImageUpload?.url ? (
                                                    <a href={entry.countImageUpload.url} target="_blank" rel="noopener noreferrer">
                                                        <img src={entry.countImageUpload.url} alt="Count" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                    </a>
                                                ) : 'No Image'}
                                            </TableCell>
                                            <TableCell>{entry?.assignedTo ? (
                                                <Chip label={entry.assignedTo} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}</TableCell>
                                            <TableCell>
                                                <Stack spacing={1}>
                                                    {hasPermission("rentalInvoice") ? <Button variant="outlined" size="small" onClick={() => handleEdit(entry._id)}>
                                                        Edit
                                                    </Button> : null}
                                                    <Button variant="outlined" size="small" onClick={() => handleSendInvoice(entry._id)}>
                                                        Send Invoice
                                                    </Button>
                                                    <Button variant="outlined" size="small" onClick={() => {
                                                        handleOpenPaymentDetailsModal(entry)
                                                    }}>
                                                        Update Payment Details
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<UploadFileIcon />}
                                                        onClick={() => handleUploadSignedInvoice(entry._id, entry?.invoiceLink)}
                                                    >
                                                        Upload Signed Quotation
                                                    </Button>
                                                </Stack>
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
                                                                entry.invoiceLink?.map((link, index) => (
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
                                    </>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    // {{ edit_1 }}
                )}
            </Paper>
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
        </Box>
    );
}

export default RentalInvoiceList;