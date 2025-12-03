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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Pagination,
    Stack
} from '@mui/material';
import { Visibility as VisibilityIcon, UploadFile as UploadFileIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';

function OldInvoicesList() {
    const [loading, setLoading] = useState(true);
    const [oldInvoices, setOldInvoices] = useState([]);
    const [filteredInvoices, setFilteredInvoices] = useState([]);
    const { auth } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState({
        invoiceNumber: '',
        customerName: '',
        paymentStatus: '',
        startDate: '',
        endDate: ''
    });
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [updateForm, setUpdateForm] = useState({
        paymentStatus: '',
        paymentMethod: '',
        paymentDate: '',
        paymentAmount: 0,
        dueAmount: 0,
        remainderDate: '',
        notes: ''
    });

    useEffect(() => {
        fetchOldInvoices();
    }, [auth.token, page, filters]);

    useEffect(() => {
        filterInvoices();
    }, [searchQuery, oldInvoices]);

    const fetchOldInvoices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (filters.invoiceNumber) params.append('invoiceNumber', filters.invoiceNumber);
            if (filters.customerName) params.append('customerName', filters.customerName);
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/old-invoice/all?${params.toString()}`,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (response.data?.success) {
                setOldInvoices(response.data.invoices || []);
                setTotal(response.data.total || 0);
                setTotalPages(response.data.totalPages || 1);
            } else {
                setOldInvoices([]);
                toast.error(response.data?.message || 'Failed to fetch old invoices');
            }
        } catch (error) {
            console.error("Error fetching old invoices:", error);
            setOldInvoices([]);
            toast.error('Error fetching old invoices');
        } finally {
            setLoading(false);
        }
    };

    const filterInvoices = () => {
        if (!searchQuery) {
            setFilteredInvoices(oldInvoices);
            return;
        }

        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = oldInvoices.filter(invoice => {
            const invoiceNumberMatch = invoice.invoiceNumber?.toString().toLowerCase().includes(lowercasedQuery);
            const customerNameMatch = invoice.customerName?.toLowerCase().includes(lowercasedQuery);
            const productNameMatch = invoice.productName?.toLowerCase().includes(lowercasedQuery);
            const dateMatch = invoice.date ? new Date(invoice.date).toLocaleDateString().includes(lowercasedQuery) : false;

            return invoiceNumberMatch || customerNameMatch || productNameMatch || dateMatch;
        });
        setFilteredInvoices(filtered);
    };

    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setViewDialogOpen(true);
    };

    const handleEditInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setUpdateForm({
            paymentStatus: invoice.paymentStatus || 'Unpaid',
            paymentMethod: invoice.paymentMethod || '',
            paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate).toISOString().split('T')[0] : '',
            paymentAmount: invoice.paymentAmount || 0,
            dueAmount: invoice.dueAmount || 0,
            remainderDate: invoice.remainderDate || '',
            notes: invoice.notes || ''
        });
        setUpdateDialogOpen(true);
    };

    const handleUpdateFormChange = (field, value) => {
        setUpdateForm(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-calculate due amount when payment amount or status changes
        if (field === 'paymentAmount' && selectedInvoice) {
            const paymentAmount = parseFloat(value) || 0;
            const total = selectedInvoice.total || 0;
            const dueAmount = Math.max(0, total - paymentAmount);
            setUpdateForm(prev => ({
                ...prev,
                dueAmount: dueAmount
            }));
        }
    };

    const handleUpdateInvoice = async () => {
        if (!selectedInvoice) return;

        try {
            setUpdating(true);
            const updateData = {
                paymentStatus: updateForm.paymentStatus,
                paymentMethod: updateForm.paymentMethod || undefined,
                paymentDate: updateForm.paymentDate ? new Date(updateForm.paymentDate) : undefined,
                paymentAmount: parseFloat(updateForm.paymentAmount) || 0,
                dueAmount: parseFloat(updateForm.dueAmount) || 0,
                remainderDate: updateForm.remainderDate ? parseInt(updateForm.remainderDate) : undefined,
                notes: updateForm.notes || undefined
            };

            // Remove undefined fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const response = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/old-invoice/update/${selectedInvoice._id}`,
                updateData,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (response.data?.success) {
                toast.success('Invoice updated successfully');
                setUpdateDialogOpen(false);
                fetchOldInvoices(); // Refresh the list
            } else {
                toast.error(response.data?.message || 'Failed to update invoice');
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            toast.error(error.response?.data?.message || 'Error updating invoice');
        } finally {
            setUpdating(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPage(1); // Reset to first page when filter changes
    };

    const handleUploadFile = async () => {
        if (!uploadFile) {
            toast.error('Please select a file to upload');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', uploadFile);

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/old-invoice/upload`,
                formData,
                {
                    headers: {
                        Authorization: auth.token,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            if (response.data?.success) {
                toast.success(
                    `Successfully imported ${response.data.imported} invoices. ${response.data.errors} rows had errors.`
                );
                if (response.data.errorDetails && response.data.errorDetails.length > 0) {
                    console.log('Upload errors:', response.data.errorDetails);
                    // Optionally show error details in a dialog
                }
                setUploadDialogOpen(false);
                setUploadFile(null);
                fetchOldInvoices(); // Refresh the list
            } else {
                toast.error(response.data?.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(error.response?.data?.message || 'Error uploading file');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteInvoice = async (invoiceId) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/old-invoice/delete/${invoiceId}`,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (response.data?.success) {
                toast.success('Invoice deleted successfully');
                fetchOldInvoices();
            } else {
                toast.error(response.data?.message || 'Failed to delete invoice');
            }
        } catch (error) {
            console.error("Error deleting invoice:", error);
            toast.error('Error deleting invoice');
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'success';
            case 'unpaid':
                return 'error';
            case 'partial':
                return 'warning';
            case 'pending':
                return 'info';
            default:
                return 'default';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold', color: '#019ee3' }}>
                    Old Invoices
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{
                        bgcolor: '#019ee3',
                        '&:hover': { bgcolor: '#0180b8' }
                    }}
                >
                    Upload Excel
                </Button>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                    <TextField
                        label="Search"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Invoice Number"
                        variant="outlined"
                        size="small"
                        value={filters.invoiceNumber}
                        onChange={(e) => handleFilterChange('invoiceNumber', e.target.value)}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        label="Customer Name"
                        variant="outlined"
                        size="small"
                        value={filters.customerName}
                        onChange={(e) => handleFilterChange('customerName', e.target.value)}
                        sx={{ minWidth: 150 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Payment Status</InputLabel>
                        <Select
                            value={filters.paymentStatus}
                            label="Payment Status"
                            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                            <MenuItem value="Unpaid">Unpaid</MenuItem>
                            <MenuItem value="Partial">Partial</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Start Date"
                        type="date"
                        variant="outlined"
                        size="small"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 150 }}
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        variant="outlined"
                        size="small"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 150 }}
                    />
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilters({
                                invoiceNumber: '',
                                customerName: '',
                                paymentStatus: '',
                                startDate: '',
                                endDate: ''
                            });
                            setSearchQuery('');
                            setPage(1);
                        }}
                    >
                        Clear Filters
                    </Button>
                </Stack>
            </Paper>

            {/* Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : filteredInvoices.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary">
                        No old invoices found
                    </Typography>
                </Paper>
            ) : (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Invoice No</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Customer Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Product Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Payment Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Due Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredInvoices.map((invoice) => (
                                    <TableRow key={invoice._id} hover>
                                        <TableCell>{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{formatDate(invoice.date)}</TableCell>
                                        <TableCell>{invoice.customerName}</TableCell>
                                        <TableCell>{invoice.productName}</TableCell>
                                        <TableCell>{invoice.quantity || 1}</TableCell>
                                        <TableCell>{formatCurrency(invoice.total)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={invoice.paymentStatus || 'Unpaid'}
                                                color={getPaymentStatusColor(invoice.paymentStatus)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{formatCurrency(invoice.dueAmount)}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleViewInvoice(invoice)}
                                                color="primary"
                                                title="View Details"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditInvoice(invoice)}
                                                color="warning"
                                                title="Update Payment Status"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteInvoice(invoice._id)}
                                                color="error"
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, value) => setPage(value)}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    )}

                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                        Showing {filteredInvoices.length} of {total} invoices
                    </Typography>
                </>
            )}

            {/* View Invoice Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Invoice Details - {selectedInvoice?.invoiceNumber}
                </DialogTitle>
                <DialogContent>
                    {selectedInvoice && (
                        <Box sx={{ mt: 2 }}>
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Invoice Number</Typography>
                                    <Typography variant="body1">{selectedInvoice.invoiceNumber}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Date</Typography>
                                    <Typography variant="body1">{formatDate(selectedInvoice.date)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Customer Name</Typography>
                                    <Typography variant="body1">{selectedInvoice.customerName}</Typography>
                                </Box>
                                {selectedInvoice.customerMobile && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Mobile</Typography>
                                        <Typography variant="body1">{selectedInvoice.customerMobile}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.customerEmail && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                                        <Typography variant="body1">{selectedInvoice.customerEmail}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.customerAddress && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                                        <Typography variant="body1">{selectedInvoice.customerAddress}</Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Product Name</Typography>
                                    <Typography variant="body1">{selectedInvoice.productName}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Quantity</Typography>
                                    <Typography variant="body1">{selectedInvoice.quantity || 1}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Price</Typography>
                                    <Typography variant="body1">{formatCurrency(selectedInvoice.price)}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Total</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(selectedInvoice.total)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Payment Status</Typography>
                                    <Chip
                                        label={selectedInvoice.paymentStatus || 'Unpaid'}
                                        color={getPaymentStatusColor(selectedInvoice.paymentStatus)}
                                        size="small"
                                    />
                                </Box>
                                {selectedInvoice.paymentMethod && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Payment Method</Typography>
                                        <Typography variant="body1">{selectedInvoice.paymentMethod}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.paymentDate && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Payment Date</Typography>
                                        <Typography variant="body1">{formatDate(selectedInvoice.paymentDate)}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.paymentAmount > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Payment Amount</Typography>
                                        <Typography variant="body1">{formatCurrency(selectedInvoice.paymentAmount)}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.dueAmount > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Due Amount</Typography>
                                        <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                                            {formatCurrency(selectedInvoice.dueAmount)}
                                        </Typography>
                                    </Box>
                                )}
                                {selectedInvoice.remainderDate !== undefined && selectedInvoice.remainderDate !== null && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Remainder Date (Days)</Typography>
                                        <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                                            {selectedInvoice.remainderDate} day{selectedInvoice.remainderDate !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                )}
                                {selectedInvoice.notes && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                                        <Typography variant="body1">{selectedInvoice.notes}</Typography>
                                    </Box>
                                )}
                                {selectedInvoice.uploadedFileName && (
                                    <Box>
                                        <Typography variant="subtitle2" color="textSecondary">Uploaded File</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {selectedInvoice.uploadedFileName}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Update Payment Status Dialog */}
            <Dialog
                open={updateDialogOpen}
                onClose={() => {
                    setUpdateDialogOpen(false);
                    setSelectedInvoice(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Update Payment Status - {selectedInvoice?.invoiceNumber}
                </DialogTitle>
                <DialogContent>
                    {selectedInvoice && (
                        <Box sx={{ mt: 2 }}>
                            <Stack spacing={3}>
                                {/* Invoice Summary */}
                                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Invoice Summary
                                    </Typography>
                                    <Stack direction="row" spacing={4} flexWrap="wrap">
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">Customer</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {selectedInvoice.customerName}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {formatCurrency(selectedInvoice.total)}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">Product</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                                {selectedInvoice.productName}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Payment Status */}
                                <FormControl fullWidth>
                                    <InputLabel>Payment Status *</InputLabel>
                                    <Select
                                        value={updateForm.paymentStatus}
                                        label="Payment Status *"
                                        onChange={(e) => handleUpdateFormChange('paymentStatus', e.target.value)}
                                    >
                                        <MenuItem value="Paid">Paid</MenuItem>
                                        <MenuItem value="Unpaid">Unpaid</MenuItem>
                                        <MenuItem value="Partial">Partial</MenuItem>
                                        <MenuItem value="Pending">Pending</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Payment Method */}
                                <TextField
                                    label="Payment Method"
                                    variant="outlined"
                                    value={updateForm.paymentMethod}
                                    onChange={(e) => handleUpdateFormChange('paymentMethod', e.target.value)}
                                    fullWidth
                                    placeholder="e.g., Cash, Bank Transfer, UPI, Cheque"
                                />

                                {/* Payment Date */}
                                <TextField
                                    label="Payment Date"
                                    type="date"
                                    variant="outlined"
                                    value={updateForm.paymentDate}
                                    onChange={(e) => handleUpdateFormChange('paymentDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                />

                                {/* Payment Amount */}
                                <TextField
                                    label="Payment Amount"
                                    type="number"
                                    variant="outlined"
                                    value={updateForm.paymentAmount}
                                    onChange={(e) => handleUpdateFormChange('paymentAmount', e.target.value)}
                                    fullWidth
                                    inputProps={{ min: 0, step: 0.01 }}
                                    helperText={`Total Invoice Amount: ${formatCurrency(selectedInvoice.total)}`}
                                />

                                {/* Due Amount (Auto-calculated) */}
                                <TextField
                                    label="Due Amount"
                                    type="number"
                                    variant="outlined"
                                    value={updateForm.dueAmount}
                                    onChange={(e) => handleUpdateFormChange('dueAmount', e.target.value)}
                                    fullWidth
                                    inputProps={{ min: 0, step: 0.01 }}
                                    disabled
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            bgcolor: '#f5f5f5'
                                        }
                                    }}
                                    helperText="Auto-calculated based on Payment Amount"
                                />

                                {/* Remainder Date (Days) */}
                                <TextField
                                    label="Remainder Date (Days)"
                                    type="text"
                                    variant="outlined"
                                    value={updateForm.remainderDate}
                                    onChange={(e) => handleUpdateFormChange('remainderDate', e.target.value)}
                                    fullWidth
                                    inputProps={{ min: 0, step: 1 }}
                                    // helperText="Enter number of days (e.g., 1, 2, 3, 4, 5) for remainder notification"
                                />

                                {/* Notes */}
                                <TextField
                                    label="Notes"
                                    variant="outlined"
                                    value={updateForm.notes}
                                    onChange={(e) => handleUpdateFormChange('notes', e.target.value)}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Additional notes or remarks"
                                />
                            </Stack>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setUpdateDialogOpen(false);
                            setSelectedInvoice(null);
                        }}
                        disabled={updating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateInvoice}
                        variant="contained"
                        disabled={updating || !updateForm.paymentStatus}
                        sx={{ bgcolor: '#019ee3', '&:hover': { bgcolor: '#0180b8' } }}
                    >
                        {updating ? <CircularProgress size={24} /> : 'Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog
                open={uploadDialogOpen}
                onClose={() => {
                    setUploadDialogOpen(false);
                    setUploadFile(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Upload Old Invoices (Excel File)</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            type="file"
                            inputProps={{ accept: '.xlsx,.xls,.csv' }}
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            fullWidth
                            sx={{ mb: 2 }}
                        />
                        <Typography variant="body2" color="textSecondary">
                            Supported formats: .xlsx, .xls, .csv
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            Required columns: Invoice No, Date, Customer Name, Product Name
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setUploadDialogOpen(false);
                            setUploadFile(null);
                        }}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadFile}
                        variant="contained"
                        disabled={uploading || !uploadFile}
                        sx={{ bgcolor: '#019ee3', '&:hover': { bgcolor: '#0180b8' } }}
                    >
                        {uploading ? <CircularProgress size={24} /> : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default OldInvoicesList;

