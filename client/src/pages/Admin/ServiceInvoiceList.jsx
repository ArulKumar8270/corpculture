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
import DeleteIcon from '@mui/icons-material/Delete'; // Import DeleteIcon

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
        grandTotal: invoice.grandTotal || 0,
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
            modeOfPayment: invoice.modeOfPayment || '',
            bankName: invoice.bankName || '',
            transactionDetails: invoice.transactionDetails || '',
            chequeDate: invoice.chequeDate ? new Date(invoice.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice.transferDate ? new Date(invoice.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice.companyNamePayment || '',
            otherPaymentMode: invoice.otherPaymentMode || '',
            paymentAmount: initialPaymentAmount,
            paymentAmountType: initialPaymentAmountType,
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
                status: balanceAmount >= paymentForm?.grandTotal || paymentForm.paymentAmount >= paymentForm?.grandTotal || paymentForm.paymentAmountType === 'TDS' ? "Paid" : "Unpaid",
            };

            // Conditionally set tdsAmount or pendingAmount based on selected type
            if (paymentForm.paymentAmountType === 'TDS') {
                payload.tdsAmount = pendingAmount || 0;
            } else if (paymentForm.paymentAmountType === 'Pending') {
                payload.pendingAmount = pendingAmount || 0;
            }

            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${selectedInvliceId ? selectedInvliceId : invoice._id}`,
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
                props.onInvoiceUpdate();
            }
        } catch (error) {
            console.error('Error updating payment details:', error);
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

    const onMoveToInvoice = async (status) => {
        try {
            const payload = {
                invoiceType: status,
                invoiceNumber: invoiceCount,
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
                handleUpdateInvoiceCount()
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
                    {invoice?.assignedTo ? (
                        <Chip label={invoice.assignedTo?.name} size="small" color="primary" variant="outlined" />
                    ) : (
                        'N/A'
                    )}
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
                                        console.log(product, "product54234"),
                                        <TableRow key={product?.productId?._id || product._id}>
                                            <TableCell component="th" scope="row">
                                                {product.productId?.productName?.productName?.productName || product.productName}
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
                            }, 1000)
                        }

                    }
                    } color="primary" variant="contained">
                        Save changes
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
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate(); // Initialize useNavigate

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            let response;
            if (auth?.user?.role === 3) {
                // For assignedTo, the backend still expects params in the URL
                response = await axios.get(
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
                setInvoiceCount(data.commonDetails?.invoiceCount + 1 || 1);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
        }
    };

    useEffect(() => {
        fetchInvoices();
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
                                    filteredInvoices?.map((invoice) => (
                                        <InvoiceRow key={invoice._id} invoice={invoice} navigate={navigate} onInvoiceUpdate={fetchInvoices} invoiceType={props?.invoice} invoiceCount={invoiceCount} />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </>
        </Box>
    );
};

export default ServiceInvoiceList;