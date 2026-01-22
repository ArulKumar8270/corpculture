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
    MenuItem, // Added MenuItem
    TablePagination
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
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon
import EditIcon from '@mui/icons-material/Edit'; // Import EditIcon for reassign

// Row component for each invoice, allowing expansion to show products
function InvoiceRow(props) {
    const { invoice, navigate, invoiceType, invoiceCount } = props;
    const { auth, userPermissions } = useAuth();
    const [open, setOpen] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false); // State for payment modal
    const [loading, setLoading] = useState(false);
    const [deletingLink, setDeletingLink] = useState(false); // New state for link deletion loading
    const [companyPendingInvoice, setCompanyPendingInvoice] = useState([])
    const [selectedInvliceId, setSelectedInvliceId] = useState(null)
    const [balanceAmount, setBalanceAmount] = useState(0)
    const [pendingAmount, setPendingAmount] = useState(0)
    const [isInvoiceSend, setInvoiceSend] = useState(false)
    const [openReassignModal, setOpenReassignModal] = useState(false); // State for reassign modal
    const [selectedUserId, setSelectedUserId] = useState(''); // State for selected user in reassign modal
    const [reassigning, setReassigning] = useState(false); // State for reassign loading
    const [paymentForm, setPaymentForm] = useState({ // State for payment form data
        modeOfPayment: invoice.modeOfPayment || '',
        bankName: invoice.bankName || '',
        transactionDetails: invoice.transactionDetails || '', // e.g., cheque number, UPI ID
        chequeDate: invoice.chequeDate || '', // New field for Cheque
        transferDate: invoice.transferDate || '', // New field for Bank Transfer/UPI
        companyNamePayment: invoice.companyNamePayment || '', // New field for Cheque/Bank Transfer/UPI
        otherPaymentMode: invoice.otherPaymentMode || '', // New field for OTHERS
        paymentAmount: 0, // Single field for amount
        paymentAmountType: '', // Type of amount (TDS or Pending)
        grandTotal: Number(invoice.grandTotal).toFixed(2) || 0,
    });

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleEdit = () => {
        navigate(`../addServiceInvoice/${invoice._id}?invoiceType=${invoiceType}`);
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
                    // Optionally, refresh the list or update the specific invoice in state
                } catch (err) {
                    console.error("Upload failed", err);
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
        // let initialPaymentAmount = 0;
        // let initialPaymentAmountType = '';

        // // Initialize paymentAmount and paymentAmountType based on existing invoice data
        // if (invoice.tdsAmount > 0) {
        //     initialPaymentAmount = invoice.tdsAmount;
        //     initialPaymentAmountType = 'TDS';
        // } else if (invoice.pendingAmount > 0) {
        //     initialPaymentAmount = invoice.pendingAmount;
        //     initialPaymentAmountType = 'Pending';
        // }

        setPaymentForm({
            modeOfPayment: invoice.modeOfPayment || '',
            bankName: invoice.bankName || '',
            transactionDetails: invoice.transactionDetails || '',
            chequeDate: invoice.chequeDate ? new Date(invoice.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice.transferDate ? new Date(invoice.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice.companyNamePayment || '',
            otherPaymentMode: invoice.otherPaymentMode || '',
            paymentAmount: invoice.paymentAmount || 0,
            paymentAmountType: invoice.paymentAmountType || '',
            grandTotal: Number(invoice.grandTotal).toFixed(2) || 0,
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
                let balanceAmount = Number(value) - Number(invoice?.grandTotal);
                setBalanceAmount(balanceAmount)
                setPendingAmount(0)
                try {
                    let response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                        { companyId: invoice?.companyId, tdsAmount: { $eq: null }, status: { $ne: "Paid" } }, // Send invoiceType in the request body
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    setCompanyPendingInvoice(response.data?.serviceInvoices)
                } catch (err) {
                    console.log(err, "Api error")
                }
            }

        }

    };

    const handleSavePaymentDetails = async (balanceAmount, tsdBalance) => {
        let status = "Paid"
        if (balanceAmount && selectedInvliceId) {
            status = "Unpaid"
        } else if (Number(paymentForm?.paymentAmount) >= Number(paymentForm?.grandTotal) || paymentForm.paymentAmountType === 'TDS') {
            status = "Paid"
        } else {
            status = "Unpaid"
        }
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
                paymentAmount: balanceAmount ? Number(balanceAmount) : paymentForm?.paymentAmount >= paymentForm?.grandTotal ? Number(paymentForm?.grandTotal) : Number(paymentForm?.paymentAmount),
                tdsAmount: 0, // Default to 0, will be updated if type is TDS
                pendingAmount: 0, // Default to 0, will be updated if type is Pending
                status: status,
            };

            // Conditionally set tdsAmount or pendingAmount based on selected type
            if (paymentForm.paymentAmountType === 'TDS') {
                payload.tdsAmount = pendingAmount || 0;
            } else if (paymentForm.paymentAmountType === 'Pending') {
                payload.pendingAmount = pendingAmount || 0;
            }

            if (selectedInvliceId || invoice._id) {
                const res = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${balanceAmount ? selectedInvliceId : invoice._id}`,
                    payload,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
                if (res.data?.success) {
                    console.log(invoice._id, "invoice2345");
                   
                    handleClosePaymentDetailsModal();
                    
                    props.onInvoiceUpdate();
                    try {
                        const res = await axios.post('https://n8n.nicknameinfo.net/webhook/fb83e945-2e49-4a73-acce-fd08632ef1a8', { invoiceId: invoice._id});
                        if (res) {
                            alert('Payment acknowledgement sent successfully!');
                        }
                    } catch (webhookError) {
                        alert(webhookError.message || 'Failed to trigger webhook for payment acknowledgement.');
                    }
                }
            }




        } catch (error) {
            console.error('Error updating payment details:', error);
        }
    };

    const handleUpdateInvoiceCount = async () => {
        try {
            // The backend endpoint automatically increments by 1
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details/increment-invoice`,
                {},
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                // Refresh the invoice count after incrementing
                fetchInvoicesCount();
            }
        } catch (error) {
            console.error('Error updating invoice count:', error);
        }
    }

    // Helper function to generate invoice number based on format
    const generateInvoiceNumber = (invoiceCount, format) => {
        if (!format || format.trim() === '') {
            return invoiceCount.toString();
        }

        // Get current date for year replacement
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentYearShort = currentYear.toString().slice(-2);
        const nextYearShort = (currentYear + 1).toString().slice(-2);
        const yearRange = `${currentYearShort}-${nextYearShort}`;
        const fullYearRange = `${currentYear}-${currentYear + 1}`;

        // Replace date/year patterns in the format
        let processedFormat = format;
        
        // Replace year patterns (e.g., "26-27" with current year range like "26-27")
        processedFormat = processedFormat.replace(/\d{2}-\d{2}/g, yearRange); // Replace YY-YY pattern
        processedFormat = processedFormat.replace(/\d{4}-\d{4}/g, fullYearRange); // Replace YYYY-YYYY pattern
        
        // Also handle single year patterns
        processedFormat = processedFormat.replace(/\b\d{2}\b/g, (match) => {
            const num = parseInt(match);
            if (num >= 20 && num <= 99) {
                return currentYearShort;
            }
            return match;
        });
        processedFormat = processedFormat.replace(/\b\d{4}\b/g, (match) => {
            const num = parseInt(match);
            if (num >= 2000 && num <= 2099) {
                return currentYear.toString();
            }
            return match;
        });

        // Extract the last number sequence (sequential number part)
        const lastNumberMatch = processedFormat.match(/(\d+)(?!.*\d)/);
        
        if (lastNumberMatch) {
            const numberDigits = lastNumberMatch[1].length;
            const prefix = processedFormat.substring(0, processedFormat.lastIndexOf(lastNumberMatch[1]));
            const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
            return prefix + formattedNumber;
        }
        
        // Fallback: append count to processed format
        return processedFormat + invoiceCount.toString().padStart(5, '0');
    };

    const onMoveToInvoice = async (status) => {
        try {
            // Fetch global invoice format
            const { data: commonData } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            
            const format = commonData?.commonDetails?.globalInvoiceFormat || '';
            const generatedInvoiceNumber = generateInvoiceNumber(invoiceCount, format);
            
            const payload = {
                invoiceType: status,
                // Invoice number is now generated by the backend from global settings
                // Preserve the original quotation date
                quotationDate: invoice.invoiceDate,
                // Set the moved to invoice date to current date
                movedToInvoiceDate: new Date(),
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
                // Invoice count is now incremented automatically by the backend
                // DO NOT call handleUpdateInvoiceCount() - backend handles it
                props.onInvoiceUpdate();
                alert(res.data.message || 'Moved to invoice successfully!');
            } else {
                alert(res.data?.message || 'Failed to update move quotation details.');
            }
        } catch (error) {
            console.error('Error updating status details:', error);
        }
    }

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

    const handleDeleteInvoiceLink = async (invoiceId, linkToDelete) => {
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
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoiceId}`,
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
                props.onInvoiceUpdate(); // Refresh the list
            } else {
                toast.error(res.data?.message || 'Failed to delete invoice link.');
            }
        } catch (error) {
            toast.error('Error deleting invoice link.');
        } finally {
            setDeletingLink(false);
        }
    };

    const handleOpenReassignModal = () => {
        setSelectedUserId(invoice?.assignedTo?._id || '');
        setOpenReassignModal(true);
    };

    const handleCloseReassignModal = () => {
        setOpenReassignModal(false);
        setSelectedUserId('');
    };

    const handleReassign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user to assign.');
            return;
        }
        try {
            setReassigning(true);
            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${invoice._id}`,
                {
                    assignedTo: selectedUserId,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (res.data?.success) {
                toast.success('Invoice reassigned successfully!');
                handleCloseReassignModal();
                props.onInvoiceUpdate(); // Refresh the list
            } else {
                toast.error(res.data?.message || 'Failed to reassign invoice.');
            }
        } catch (error) {
            console.error('Error reassigning invoice:', error);
            toast.error('Error reassigning invoice.');
        } finally {
            setReassigning(false);
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
                {invoiceType === "invoice" ? <TableCell component="th" scope="row">
                    {invoice.invoiceNumber}
                </TableCell> : null}
                <TableCell>{invoice.companyId?.companyName || 'N/A'}</TableCell>
                <TableCell>{invoice.modeOfPayment}</TableCell>
                <TableCell>{invoice.deliveryAddress}</TableCell>
                <TableCell align="right">{invoice.grandTotal.toFixed(2)}</TableCell>
                <TableCell>
                    <Chip
                        label={invoice.status}
                        size="small"
                        color={
                            invoice.status === 'Paid' ? 'success' :
                                invoice.status === 'Unpaid' ? 'error' :
                                    invoice.status === 'Pending' || invoice.status === 'Progress' ? 'warning' :
                                        'default'
                        }
                    />
                    {invoice?.invoiceLink?.length <= 0 ? <Chip
                        label={"Invoice Upload Pending"}
                        size="small"
                        color={"error"}
                        className='mt-2'
                    /> : null}
                </TableCell>
                {/* <TableCell>{invoice.status}</TableCell> */}
                <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {invoice?.assignedTo ? (
                            <Chip label={invoice.assignedTo?.name} size="small" color="primary" variant="outlined" />
                        ) : (
                            'N/A'
                        )}
                        {hasPermission("serviceInvoice") && (
                            <IconButton
                                size="small"
                                onClick={handleOpenReassignModal}
                                sx={{ ml: 0.5 }}
                                title="Reassign"
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                </TableCell>
                <TableCell>
                    {hasPermission("serviceInvoice") ? <Button variant="outlined" size="small" sx={{ mr: 1 }} onClick={handleEdit}>Edit</Button> : null}
                    <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => onSendInvoice(invoice)} > {isInvoiceSend ? <CircularProgress size={24} /> : `Send ${invoiceType === "quotation" ? "Quotaion" : "Invoice"}`}</Button>
                    {invoiceType === "quotation" ? <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={() => onMoveToInvoice("invoice")}>Move to invoice</Button>
                        : null}
                    {!invoice?.tdsAmount && invoiceType !== "quotation" ? <Button variant="outlined" size="small" sx={{ my: 1 }} onClick={handleOpenPaymentDetailsModal}>Update Payment Details</Button> : null}
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
                                {invoiceType === "invoice" ? "Invoices" : "Quotations"} Links
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap"> {/* Use Stack for layout */}
                                {
                                    invoice.invoiceLink?.map((link, index) => (
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
                                                    onClick={() => handleDeleteInvoiceLink(invoice._id, link)}
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
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            {/* Date Information */}
                            {invoice.invoiceType === 'invoice' && (invoice.quotationDate || invoice.movedToInvoiceDate) && (
                                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Date Information:
                                    </Typography>
                                    {invoice.quotationDate && (
                                        <Typography variant="body2" color="text.secondary">
                                            Quotation Date: {new Date(invoice.quotationDate).toLocaleDateString()}
                                        </Typography>
                                    )}
                                    {invoice.movedToInvoiceDate && (
                                        <Typography variant="body2" color="text.secondary">
                                            Moved to Invoice Date: {new Date(invoice.movedToInvoiceDate).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            )}
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
                                    {invoice.products.map((product) => {
                                        // Get product name with fallback for different structures
                                        const productName = product.productId?.productName?.name || 
                                                           product.productId?.productName?.productName?.name || 
                                                           product.productId?.productName?.productName?.productName || 
                                                           product.productName || 
                                                           'N/A';
                                        
                                        return (
                                            <TableRow key={product?.productId?._id || product._id}>
                                                <TableCell component="th" scope="row">
                                                    {productName}
                                                </TableCell>
                                                <TableCell>{product.productId?.sku || 'N/A'}</TableCell>
                                                <TableCell>{product.productId?.hsn || 'N/A'}</TableCell>
                                                <TableCell align="right">{product.quantity}</TableCell>
                                                <TableCell align="right">{product.rate.toFixed(2)}</TableCell>
                                                <TableCell align="right">{product.totalAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>

            {/* Payment Details Update Modal */}
            <Dialog open={openPaymentModal} onClose={handleClosePaymentDetailsModal}>
                <DialogTitle>Payment Details (RS: {invoice.grandTotal})</DialogTitle>
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
                                    {companyPendingInvoice
                                        ?.filter(pendingInv => pendingInv._id !== invoice._id) // Filter out the current invoice
                                        .map((pendingInv) => {
                                            return <MenuItem key={pendingInv._id} value={pendingInv._id}>{new Date(pendingInv.invoiceDate).toLocaleDateString() + " - Rs " + pendingInv?.grandTotal}</MenuItem>
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


                    {/* For CASH, no specific additional fields are added here */}

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
                            }, 2000)
                        }

                    }
                    } color="primary" variant="contained">
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reassign Modal */}
            <Dialog open={openReassignModal} onClose={handleCloseReassignModal}>
                <DialogTitle>Reassign Invoice</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal" size="small">
                        <InputLabel id="reassign-user-label">Select User</InputLabel>
                        <Select
                            labelId="reassign-user-label"
                            id="selectedUserId"
                            name="selectedUserId"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            label="Select User"
                        >
                            <MenuItem value="">--Select User--</MenuItem>
                            {props.users?.map((user) => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.name} {user.email ? `(${user.email})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReassignModal} color="primary">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleReassign} 
                        color="primary" 
                        variant="contained"
                        disabled={reassigning || !selectedUserId}
                    >
                        {reassigning ? <CircularProgress size={24} /> : 'Reassign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

const ServiceInvoiceList = (props) => {
    const [invoices, setInvoices] = useState([]);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [users, setUsers] = useState([]); // State for users list
    const [page, setPage] = useState(0); // Pagination state
    const [rowsPerPage, setRowsPerPage] = useState(10); // Pagination state
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            let response;
            if (auth?.user?.role === 3) {
                // For assignedTo, the backend still expects params in the URL
                response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/assignedTo/${auth?.user?._id}/${props?.invoice}`,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            } else {
                // For 'all' invoices, the backend now expects filters in the request body
                response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    { invoiceType: props?.invoice, tdsAmount: { $eq: null }, status: { $ne: "Paid" } }, // Send invoiceType in the request body
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            }

            if (response.data?.success) {
                setInvoices(response.data.serviceInvoices);
                fetchInvoicesCount();
            } else {
                setInvoices([]);
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
            setInvoices([]);
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
                // Store the actual global invoiceCount value + 1 for next invoice
                setInvoiceCount((data.commonDetails?.invoiceCount || 0) + 1);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            // First, fetch employees
            const employeeRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            
            if (employeeRes.data?.success) {
                // Filter employees by employeeType (Service or Sales)
                const serviceAndSalesEmployees = employeeRes.data.employees.filter(
                    emp => emp.employeeType === 'Service' || emp.employeeType === 'Sales'
                );
                
                // Extract userIds from filtered employees
                const userIds = serviceAndSalesEmployees.map(emp => emp.userId).filter(Boolean);
                
                if (userIds.length > 0) {
                    // Fetch users for those userIds
                    const userRes = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/auth/all-users`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    
                    // Filter users to only include those with matching userIds
                    const filteredUsers = (userRes.data.users || []).filter(user => 
                        userIds.includes(user._id)
                    );
                    setUsers(filteredUsers);
                } else {
                    setUsers([]);
                }
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users.");
            setUsers([]);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchUsers();
    }, [auth.token, props?.invoice]);

    // Filter invoices based on search term
    const filteredInvoices = invoices?.filter(invoice => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return (
            invoice?.invoiceNumber?.toLowerCase()?.includes(lowerCaseSearchTerm) ||
            invoice.companyId?.companyName.toLowerCase().includes(lowerCaseSearchTerm) ||
            invoice.modeOfPayment.toLowerCase().includes(lowerCaseSearchTerm) ||
            invoice?.status?.toLowerCase().includes(lowerCaseSearchTerm) ||
            new Date(invoice.invoiceDate).toLocaleDateString().toLowerCase().includes(lowerCaseSearchTerm)
        );
    });

    // Reset page to 0 when search term changes
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

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
                    Service {props?.invoice === "invoice" ? "Invoices" : "Quotations"}
                </Typography>
                {/* {hasPermission("serviceInvoice") ? <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button onClick={() => navigate("../addServiceInvoice")} color="primary">
                        Create New Invoice
                    </Button>
                </Typography> : null} */}
            </div>
            {/* Search Input Field */}

            <>
                <TextField
                    fullWidth
                    margin="normal"
                    label={`Search ${props?.invoice === "invoice" ? "Invoices" : "Quotations"} (Company, Payment Mode, Status, Date)`}
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
                                    {props?.invoice === "invoice" ? <TableCell>Invoice Number</TableCell> : null}
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
                                    filteredInvoices
                                        ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((invoice) => (
                                            <InvoiceRow key={invoice._id} invoice={invoice} navigate={navigate} onInvoiceUpdate={fetchInvoices} invoiceType={props?.invoice} invoiceCount={invoiceCount} users={users} />
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Pagination Component */}
                    {filteredInvoices?.length > 0 && (
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredInvoices.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    )}
                </Paper>
            </>
        </Box>
    );
};

export default ServiceInvoiceList;