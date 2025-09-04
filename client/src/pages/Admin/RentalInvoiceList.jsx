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
    Collapse,
    IconButton
} from '@mui/material';
import { Visibility as VisibilityIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import { useNavigate } from 'react-router-dom';
import LinkIcon from '@mui/icons-material/Link'; // Import LinkIcon
import Stack from '@mui/material/Stack'; // Import Stack for layout
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search'; // Import SearchIcon
import InputAdornment from '@mui/material/InputAdornment'; // Import InputAdornment
import DeleteIcon from '@mui/icons-material/Delete';

function RentalInvoiceList(props) {
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
        invoiceId: '',
        paymentAmount: 0, // Single field for amount
        paymentAmountType: '', // Type of amount (TDS or Pending)
        grandTotal: 0,
    });
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const [filteredRentalEntries, setFilteredRentalEntries] = useState([]); // State for filtered entries
    const [companyPendingInvoice, setCompanyPendingInvoice] = useState([])
    const [selectedInvliceId, setSelectedInvliceId] = useState(null)
    const [balanceAmount, setBalanceAmount] = useState(0)
    const [pendingAmount, setPendingAmount] = useState(0)
    const [deletingLink, setDeletingLink] = useState(false);
    const [isInvoiceSend, setInvoiceSend] = useState(false)
    useEffect(() => {
        fetchRentalEntries();
    }, [auth.token, props.invoice]);

    // Effect to filter rental entries based on search query
    useEffect(() => {
        const filterData = () => {
            if (!searchQuery) {
                setFilteredRentalEntries(rentalEntries);
                return;
            }

            const lowercasedQuery = searchQuery.toLowerCase();
            const filtered = rentalEntries.filter(entry => {
                const invoiceNumberMatch = props.invoice === "invoice" && entry.invoiceNumber?.toString().toLowerCase().includes(lowercasedQuery);
                const companyNameMatch = entry.companyId?.companyName?.toLowerCase().includes(lowercasedQuery);
                const statusMatch = entry.paymentAmountType?.toLowerCase().includes(lowercasedQuery);

                // Date matching: Convert createdAt to a date string (e.g., "YYYY-MM-DD")
                const createdAtDate = entry.createdAt ? new Date(entry.createdAt).toISOString().split('T')[0] : '';
                const dateMatch = createdAtDate.includes(lowercasedQuery);

                return invoiceNumberMatch || companyNameMatch || dateMatch || statusMatch;
            });
            setFilteredRentalEntries(filtered);
        };

        filterData();
    }, [searchQuery, rentalEntries, props.invoice]); // Re-run filter when query or original data changes


    const fetchRentalEntries = async () => {
        try {
            setLoading(true);
            let response;
            if (auth?.user?.role === 3) {
                // For assignedTo, the backend still expects params in the URL
                response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/assignedTo/${auth?.user?._id}/${props?.invoice}`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            } else {
                // For 'all' invoices, the backend now expects filters in the request body
                response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                    { invoiceType: props?.invoice, tdsAmount: { $eq: null }, status: { $ne: "Paid" } }, // Send invoiceType in the request body
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            }

            if (response.data?.success) {
                setRentalEntries(response?.data?.entries);
                fetchInvoicesCount();
            } else {
                setRentalEntries([]);
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
            setRentalEntries([]);
        } finally {
            setLoading(false);
        }
    };


    const fetchInvoicesCount = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            if (data?.success) {
                setInvoiceCount(data.commonDetails?.invoiceCount + 1 || 1);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
        }
    };

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleEdit = (id) => {
        // Implement navigation to edit page or open a modal
        navigate(`../addRentalInvoice/${id}?invoiceType=${props.invoice}`);
        console.log('Edit:', id);
    };

    const onSendInvoice = async (invoice) => {
        setInvoiceSend(true)
        try {
            const res = await axios.post('https://n8n.nicknameinfo.net/webhook/f8d3ad37-a38e-4a38-a06e-09c74fdc3b91', { invoiceId: invoice?._id });
            if (res) {
                setInvoiceSend(false)
            }
        } catch (webhookError) {
            setInvoiceSend(false)
            console.error('Error triggering webhook:', webhookError);
            toast.error('Failed to trigger webhook for external notification.');
        }
    }

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

                } catch (err) {
                    console.error("Upload failed", err);
                }
            } catch (error) {
                console.log(error, "Api error");
            }
            setLoading(false)
            fetchRentalEntries();
        };

        input.click();
    };


    const handleOpenPaymentDetailsModal = (invoice) => {
        let initialPaymentAmount = 0;
        let initialPaymentAmountType = '';

        // Initialize paymentAmount and paymentAmountType based on existing invoice data
        if (invoice.tdsAmount > 0) {
            initialPaymentAmount = invoice.tdsAmount;
            initialPaymentAmountType = 'TDS';
        } else if (invoice.pendingAmount > 0) {
            initialPaymentAmount = invoice.pendingAmount;
            initialPaymentAmountType = 'Pending';
        }
        setPaymentForm({
            modeOfPayment: invoice?.modeOfPayment || '',
            bankName: invoice?.bankName || '',
            transactionDetails: invoice?.transactionDetails || '',
            chequeDate: invoice?.chequeDate ? new Date(invoice?.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice?.transferDate ? new Date(invoice?.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice?.companyNamePayment || '',
            otherPaymentMode: invoice?.otherPaymentMode || '',
            invoiceId: invoice?._id,
            paymentAmount: invoice?.paymentAmount ? invoice?.paymentAmount : initialPaymentAmount,
            paymentAmountType: initialPaymentAmountType,
            grandTotal: invoice?.grandTotal,
            companyId: invoice?.companyId
        });
        setOpenPaymentModal(true);
    };

    const handleClosePaymentDetailsModal = () => {
        setOpenPaymentModal(false);
        // Optionally reset form here if needed, but it's re-initialized on open
    };

    const handlePaymentFormChange = async (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
        if (name === "paymentAmount") {
            if (value < invoice?.grandTotal) {
                let balanceAmount = invoice?.grandTotal - value;
                setPendingAmount(balanceAmount)
                setBalanceAmount(0)
            } else {
                let balanceAmount = value - invoice?.grandTotal;
                setBalanceAmount(balanceAmount)
                setPendingAmount(0)
                try {
                    let response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                        { companyId: paymentForm?.companyId, tdsAmount: { $eq: null }, status: { $ne: "Paid" } }, // Send invoiceType in the request body
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    setCompanyPendingInvoice(response.data?.entries)
                } catch (err) {
                    console.log(err, "Api error")
                }
            }

        }

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
                paymentAmountType: paymentForm.paymentAmountType,
                paymentAmount: paymentForm?.paymentAmount,
                tdsAmount: 0, // Default to 0, will be updated if type is TDS
                pendingAmount: 0, // Default to 0, will be updated if type is Pending
                // status: balanceAmount >= paymentForm?.grandTotal || paymentForm.paymentAmount >= paymentForm?.grandTotal || paymentForm.paymentAmountType === 'TDS' ? "Paid" : "Unpaid",
                status: "Paid",
            };

            // Conditionally set tdsAmount or pendingAmount based on selected type
            if (paymentForm.paymentAmountType === 'TDS') {
                payload.tdsAmount = pendingAmount || 0;
            } else if (paymentForm.paymentAmountType === 'Pending') {
                payload.pendingAmount = pendingAmount || 0;
            }

            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${selectedInvliceId ? selectedInvliceId : paymentForm?.invoiceId}`,
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
                fetchRentalEntries(); // Re-fetch to update the list
            } else {
                toast.error(res.data?.message || 'Failed to update payment details.');
            }
        } catch (error) {
            console.error('Error updating payment details:', error);
            toast.error(error.response?.data?.message || 'Something went wrong while updating payment details.');
        }
    };


    const handleDeleteInvoiceLink = async (invoiceId, linkToDelete, invoice) => {
        if (!window.confirm("Are you sure you want to delete this invoice link?")) {
            return;
        }
        const fileName = linkToDelete.split("/").pop();
        const res = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/delete-file/${fileName}`,
            {
                headers: {
                    Authorization: auth?.token
                },
            }
        );
        try {
            setDeletingLink(true);
            const updatedLinks = invoice.invoiceLink.filter(link => link !== linkToDelete);

            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${invoiceId}`,
                {
                    invoiceLink: updatedLinks,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (res.data?.success) {
                fetchRentalEntries(); // Refresh the list
            } else {
                toast.error(res.data?.message || 'Failed to delete invoice link.');
            }
        } catch (error) {
            toast.error('Error deleting invoice link.');
        } finally {
            setDeletingLink(false);
        }
    };

    const handleUpdateInvoiceCount = async () => {
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details/increment-invoice`,
                {
                    invoiceCount: invoiceCount,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
        } catch (error) {
            console.error('Error updating invoice count:', error);
        }
    }

    const onMoveToInvoice = async (status, entry) => {
        try {
            const payload = {
                invoiceType: status,
                invoiceNumber: invoiceCount,
            };

            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${entry?._id}`,
                payload,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (res.data) {
                handleUpdateInvoiceCount();
                fetchRentalEntries();
                alert(res.data.message || 'Moved to invoice successfully!');
            } else {
                alert(res.data?.message || 'Failed to update move quotation details.');
            }
        } catch (error) {
            console.error('Error updating status details:', error);
        }
    }

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
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
            <div className='flex justify-between items-center'>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2, color: '#019ee3', fontWeight: 'bold' }}>
                    {props?.invoice === "invoice" ? "Invoices" : "Quotations"} List
                </Typography>
            </div>
            <TextField
                fullWidth
                label={`Search ${props?.invoice === "invoice" ? "Invoices" : "Quotations"} (Company, Payment Mode, Status, Date)`}
                margin="normal"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 3 }}
            />
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                {filteredRentalEntries.length === 0 ? (
                    <Typography variant="h6" sx={{ textAlign: 'center', mt: 4 }}>
                        {searchQuery ? "No matching rental invoices found." : "No rental invoices found."}
                    </Typography>
                ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                        <Table stickyHeader aria-label="rental invoice table">
                            <TableHead>
                                <TableRow>
                                    {props?.invoice === "invoice" ? <TableCell>Invoice Number</TableCell> : null}
                                    <TableCell>Company Name</TableCell>
                                    <TableCell>Serial No.</TableCell>
                                    <TableCell>Model Name</TableCell>
                                    <TableCell>Send Details To</TableCell>
                                    <TableCell>Image</TableCell>
                                    <TableCell>Assinged To</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRentalEntries.map((entry) => (
                                    <>
                                        <TableRow key={entry._id}>
                                            {props?.invoice === "invoice" ? <TableCell>{entry.invoiceNumber || 'N/A'}</TableCell> : null}
                                            <TableCell>{entry.companyId?.companyName || 'N/A'}</TableCell>
                                            <TableCell>{entry.machineId?.serialNo || 'N/A'}</TableCell>
                                            <TableCell>{entry.machineId?.modelName || 'N/A'}</TableCell>
                                            <TableCell>{entry.sendDetailsTo}</TableCell>
                                            <TableCell>
                                                {entry.countImageUpload?.url ? (
                                                    <a href={entry.countImageUpload.url} target="_blank" rel="noopener noreferrer">
                                                        <img src={entry.countImageUpload.url} alt="Count" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                    </a>
                                                ) : 'No Image'}
                                            </TableCell>
                                            <TableCell>{entry?.assignedTo ? (
                                                <Chip label={entry.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}</TableCell>
                                            <TableCell>
                                                {/* <Chip
                                                    label={entry.status}
                                                    size="small"
                                                    color={
                                                        entry.status === 'Paid' ? 'success' :
                                                            entry.status === 'Unpaid' ? 'error' :
                                                                entry.status === 'Pending' || entry.status === 'Progress' ? 'warning' :
                                                                    'default'
                                                    }
                                                /> */}
                                                {entry?.invoiceLink?.length <= 0 ? <Chip
                                                    label={"Invoice Upload Pending"}
                                                    size="small"
                                                    color={"error"}
                                                    className='mt-2'
                                                /> : null}
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={1}>
                                                    {hasPermission("rentalInvoice") ? <Button variant="outlined" size="small" onClick={() => handleEdit(entry._id)}>
                                                        Edit
                                                    </Button> : null}
                                                    <Button variant="outlined" size="small" onClick={() => onSendInvoice(entry)}>
                                                        {isInvoiceSend ? <CircularProgress size={24} /> : `Send ${props?.invoice === "quotation" === "quotation" ? "Quotaion" : "Invoice"}`}
                                                    </Button>
                                                    {props?.invoice === "quotation" ? <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => onMoveToInvoice("invoice", entry)}>Move to invoice</Button>
                                                        : null}
                                                    {!entry?.tdsAmount && props?.invoice !== "quotation" ? <Button variant="outlined" size="small" onClick={() => {
                                                        handleOpenPaymentDetailsModal(entry)
                                                    }}>
                                                        Update Payment Details
                                                    </Button> : null}
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        startIcon={<UploadFileIcon />}
                                                        onClick={() => handleUploadSignedInvoice(entry._id, entry?.invoiceLink)}
                                                    >
                                                        Upload Signed {props?.invoice === "invoice" ? "Invoices" : "Quotations"}
                                                    </Button>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                                                <Collapse in={open} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 1 }}>
                                                        <Typography variant="h6" gutterBottom component="div">
                                                            {props?.invoice === "invoice" ? "Invoices" : "Quotations"} Links
                                                        </Typography>
                                                        <Stack direction="row" spacing={1} flexWrap="wrap"> {/* Use Stack for layout */}
                                                            {
                                                                entry.invoiceLink?.map((link, index) => (
                                                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                                                                        <Button
                                                                            variant="outlined"
                                                                            size="small"
                                                                            startIcon={<LinkIcon />}
                                                                            href={link}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            Invoice {index + 1}
                                                                        </Button>
                                                                        {hasPermission("serviceInvoice") && ( // Only show delete if user has permission
                                                                            <IconButton
                                                                                aria-label={`delete invoice link ${index + 1}`}
                                                                                size="small"
                                                                                onClick={() => handleDeleteInvoiceLink(entry._id, link, entry)}
                                                                                disabled={deletingLink} // Disable during deletion
                                                                                sx={{ ml: 0.5 }}
                                                                            >
                                                                                {deletingLink ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
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
                    {/* New: Single Amount Field, shown only if a type is selected */}
                    <TextField
                        fullWidth
                        margin="normal"
                        label={`Amount`}
                        name="paymentAmount"
                        type="number"
                        value={paymentForm.paymentAmount}
                        onChange={handlePaymentFormChange}
                        size="small"
                    />

                    {companyPendingInvoice?.length > 0 && balanceAmount > 0 &&
                        <>
                            <p>Previous Invoice Balance - Rs {balanceAmount.toFixed(2)}</p>
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="mode-of-payment-label">Select Pending Invoice</InputLabel>
                                <Select
                                    labelId="mode-of-payment-label"
                                    id="selectedInvliceId"
                                    name="selectedInvliceId"
                                    value={selectedInvliceId}
                                    onChange={(e) => setSelectedInvliceId(e.target.value)}
                                    label="Mode Of Payment"
                                >
                                    <MenuItem value="">--select Payment Mode--</MenuItem>
                                    {companyPendingInvoice?.map((invoice) => {
                                        return <MenuItem key={invoice._id} value={invoice._id}>{new Date(invoice.invoiceDate).toLocaleDateString() + " - Rs " + invoice?.grandTotal}</MenuItem>
                                    })}
                                </Select>
                            </FormControl>
                        </>
                    }

                    {/* New: Amount Type Selector */}
                    {pendingAmount > 0 && (
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="payment-amount-type-label">Amount Type</InputLabel>
                            <Select
                                labelId="payment-amount-type-label"
                                id="paymentAmountType"
                                name="paymentAmountType"
                                value={paymentForm.paymentAmountType}
                                onChange={handlePaymentFormChange}
                                label="Amount Type"
                            >
                                <MenuItem value="">--select Amount Type--</MenuItem>
                                <MenuItem value="TDS">TDS Amount</MenuItem>
                                <MenuItem value="Pending">Pending Amount</MenuItem>
                            </Select>
                        </FormControl>)}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePaymentDetailsModal} color="primary">
                        Close
                    </Button>
                    <Button onClick={() => {
                        handleSavePaymentDetails()
                        if (balanceAmount) {
                            setTimeout(() => {
                                handleSavePaymentDetails(balanceAmount)
                            }, 1000)
                        }

                    }
                    } color="primary" variant="contained">
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default RentalInvoiceList;