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
    IconButton,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination // New import for pagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx'; // Import xlsx library
import { saveAs } from 'file-saver'; // Import saveAs from file-saver

const ServiceInvoicesReport = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [page, setPage] = useState(0); // New state for current page (0-indexed)
    const [rowsPerPage, setRowsPerPage] = useState(10); // New state for rows per page
    const [totalCount, setTotalCount] = useState(0); // New state for total number of invoices

    // Modified to accept all filter parameters and pagination parameters
    const fetchServiceInvoices = async (
        from = '',
        to = '',
        companyName = '',
        invoiceNumber = '',
        paymentStatus = '',
        currentPage = page, // Use current page from state or provided
        currentRowsPerPage = rowsPerPage // Use current rowsPerPage from state or provided
    ) => {
        setLoading(true);
        setError(null);
        try {
            let url = `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all/invoice`;
            const params = new URLSearchParams();
            if (from) {
                params.append('fromDate', from);
            }
            if (to) {
                params.append('toDate', to);
            }
            if (companyName) {
                params.append('companyName', companyName);
            }
            if (invoiceNumber) {
                params.append('invoiceNumber', invoiceNumber);
            }
            if (paymentStatus) {
                params.append('paymentStatus', paymentStatus);
            }
            // Add pagination parameters
            params.append('page', currentPage + 1); // Backend usually expects 1-indexed page
            params.append('limit', currentRowsPerPage);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: auth?.token }
            });
            if (response.data.success) {
                setInvoices(response.data.serviceInvoices);
                setTotalCount(response.data.serviceInvoices?.length); // Assuming backend sends totalCount
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
            // Initial fetch with current pagination and filter states
            fetchServiceInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage);
        }
    }, [auth?.token, page, rowsPerPage]); // Re-fetch when page or rowsPerPage changes

    const handleView = (invoiceId) => {
        navigate(`/admin/service-invoice/${invoiceId}`);
    };

    const handleEdit = (invoiceId) => {
        navigate(`/admin/edit-service-invoice/${invoiceId}`);
    };

    const handleDelete = async (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/${invoiceId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    // Refresh with current filters and pagination
                    fetchServiceInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage);
                } else {
                    toast.error(response.data.message || 'Failed to delete invoice.');
                }
            } catch (err) {
                console.error('Error deleting invoice:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while deleting invoice.');
            }
        }
    };

    const handleFilter = () => {
        setPage(0); // Reset to first page when applying new filters
        fetchServiceInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, 0, rowsPerPage);
    };

    const handleClearFilter = () => {
        setFromDate('');
        setToDate('');
        setCompanyNameFilter('');
        setInvoiceNumberFilter('');
        setPaymentStatusFilter('');
        setPage(0); // Reset page
        setRowsPerPage(10); // Reset rows per page
        fetchServiceInvoices('', '', '', '', '', 0, 10); // Fetch all invoices with default pagination
    };

    const handleExportExcel = () => {
        if (invoices.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const dataToExport = invoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNumber,
            'Company': invoice.companyId?.companyName || 'N/A',
            'Invoice Date': new Date(invoice.invoiceDate).toLocaleDateString(),
            'Grand Total': invoice.grandTotal?.toFixed(2) || '0.00',
            'Assigned To': invoice.assignedTo?.name || 'N/A',
            'Bank Name': invoice.bankName || 'N/A',
            'Mode of Payment': invoice.modeOfPayment || 'N/A',
            'Cheque Date': invoice.chequeDate ? new Date(invoice.chequeDate).toLocaleDateString() : 'N/A',
            'Other Payment Mode': invoice.otherPaymentMode || 'N/A',
            'Transaction Details': invoice.transactionDetails || 'N/A',
            'Transfer Date': invoice.transferDate ? new Date(invoice.transferDate).toLocaleDateString() : 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Invoices");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'service_invoices_report.xlsx');
        toast.success("Exported to Excel successfully!");
    };

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
        // Data fetching will be triggered by useEffect due to page state change
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset page to 0 when rows per page changes
        // Data fetching will be triggered by useEffect due to rowsPerPage state change
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
                <Button onClick={() => fetchServiceInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage)} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Invoices Report
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                {/* Filter Options */}
                <Box sx={{ mb: 3 }}> {/* Container for all filter rows */}
                    {/* Top row of filters */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
                        <TextField
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 200 }}
                        />
                        <TextField
                            label="To Date"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ width: 200 }}
                        />
                        <TextField
                            label="Company Name"
                            value={companyNameFilter}
                            onChange={(e) => setCompanyNameFilter(e.target.value)}
                            sx={{ width: 200 }}
                        />
                        <TextField
                            label="Invoice Number"
                            value={invoiceNumberFilter}
                            onChange={(e) => setInvoiceNumberFilter(e.target.value)}
                            sx={{ width: 200 }}
                        />
                    </Box>

                    {/* Bottom row of filters and buttons */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Payment Status</InputLabel>
                            <Select
                                value={paymentStatusFilter}
                                label="Payment Status"
                                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Partial">Partial</MenuItem>
                                {/* Add other payment statuses as needed */}
                            </Select>
                        </FormControl>
                        <Button variant="contained" onClick={handleFilter} sx={{ height: '56px' }}>
                            Filter
                        </Button>
                        <Button variant="outlined" onClick={handleClearFilter} sx={{ height: '56px' }}>
                            Clear Filter
                        </Button>
                        <Button variant="contained" color="success" onClick={handleExportExcel} sx={{ height: '56px' }}>
                            Export to Excel
                        </Button>
                    </Box>
                </Box>
                {/* End Filter Options */}

                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="service invoices table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>Invoice No.</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Invoice Date</TableCell>
                                <TableCell>Grand Total</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell>Payment Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.length === 0 && !loading ? ( // Check loading state to avoid "No data" during initial fetch
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
                                            {invoice.assignedTo ? (
                                                <Chip label={invoice.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {invoice?.bankName ? <p>Bank Name : {invoice?.bankName}</p> : null}
                                            <p>Mode of Payment : {invoice?.modeOfPayment}</p>
                                            {invoice?.chequeDate ? <p>Cheque Date : {new Date(invoice?.chequeDate).toLocaleDateString()}</p> : null}
                                            {invoice?.otherPaymentMode ? <p>Other Payment Mode : {invoice?.otherPaymentMode}</p> : null}
                                            {invoice?.transactionDetails ? <p>Transaction Details : {invoice?.transactionDetails}</p> : null}
                                            {invoice?.transferDate ? <p>Transfer Date : {new Date(invoice?.transferDate).toLocaleDateString()}</p> : null}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination Component */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalCount} // Total number of items
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
};

export default ServiceInvoicesReport;