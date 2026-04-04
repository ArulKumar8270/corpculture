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
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx'; // Import xlsx library
import { saveAs } from 'file-saver'; // Import saveAs from file-saver

const INVOICE_DOWNLOAD_BASE_URL = 'https://pub-ef65b8bdb5974dd191a466c3120cd6b3.r2.dev';
const PAYMENT_COPY_DOWNLOAD_BASE_URL = 'https://pub-982db31d50054adebd29fa1792b12fb8.r2.dev';

const ServiceInvoicesReport = (props) => {
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
    const [exporting, setExporting] = useState(false);
    const { companyId: filterCompanyId } = useParams();
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
            const requestBody = {
                invoiceType: props?.type,
                fromDate: from,
                toDate: to,
                ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
                companyName: companyName,
                invoiceNumber: invoiceNumber,
                paymentStatus: paymentStatus,
                page: currentPage + 1,
                limit: currentRowsPerPage,
            };

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                requestBody, // Send filters and pagination in the request body
                {
                    headers: { Authorization: auth?.token }
                }
            );

            if (response.data.success) {
                setInvoices(response.data.serviceInvoices);
                // Assuming backend sends totalCount for pagination
                setTotalCount(response.data.totalCount || response.data.serviceInvoices?.length);
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

    const isQuotationReport = props?.type === 'quotation';

    const handleDownloadInvoicePdf = async (invoice) => {
        const candidateUrl =
            Array.isArray(invoice?.invoiceLink) && invoice.invoiceLink.length > 0
                ? invoice.invoiceLink[0]
                : invoice?._id
                    ? `${INVOICE_DOWNLOAD_BASE_URL}/${invoice._id}`
                    : null;

        if (!candidateUrl) {
            toast.error('Invoice id missing');
            return;
        }

        try {
            const res = await fetch(candidateUrl, { method: 'HEAD' });
            if (!res.ok) {
                const msg = 'Already invoice not send please send invoice and download';
                toast.error(msg);
                window.alert(msg);
                return;
            }
            window.open(candidateUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
            window.open(candidateUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownloadPaymentPdf = async (invoice) => {
        if (!invoice?._id) {
            toast.error('Invoice id missing');
            return;
        }

        const candidateUrl = `${PAYMENT_COPY_DOWNLOAD_BASE_URL}/${invoice._id}`;

        try {
            const res = await fetch(candidateUrl, { method: 'HEAD' });
            if (!res.ok) {
                const msg = 'Payment copy not uploaded';
                toast.error(msg);
                window.alert(msg);
                return;
            }
            window.open(candidateUrl, '_blank', 'noopener,noreferrer');
        } catch (e) {
            window.open(candidateUrl, '_blank', 'noopener,noreferrer');
        }
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

    const buildListRequestBody = (currentPage, currentLimit) => ({
        invoiceType: props?.type,
        fromDate: fromDate,
        toDate: toDate,
        ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
        companyName: companyNameFilter,
        invoiceNumber: invoiceNumberFilter,
        paymentStatus: paymentStatusFilter,
        page: currentPage + 1,
        limit: currentLimit,
    });

    const handleExportExcel = async () => {
        if (!auth?.token) {
            toast.error('You must be signed in to export.');
            return;
        }
        if (totalCount === 0) {
            toast.error('No data to export for the current filters.');
            return;
        }
        setExporting(true);
        try {
            const exportLimit = Math.min(Math.max(totalCount, 1), 100000);
            const requestBody = buildListRequestBody(0, exportLimit);

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                requestBody,
                { headers: { Authorization: auth?.token } }
            );

            if (!response.data?.success) {
                toast.error(response.data?.message || 'Failed to fetch data for export.');
                return;
            }

            const rows = response.data.serviceInvoices || [];
            if (rows.length === 0) {
                toast.error('No data to export.');
                return;
            }

            const dataToExport = rows.map((invoice) => ({
                'Invoice No.': invoice.invoiceNumber ?? 'N/A',
                'Company': invoice.companyId?.companyName || 'N/A',
                'Invoice Date': invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A',
                'Grand Total': Number(invoice.grandTotal ?? 0).toFixed(2),
                'Status': invoice.status ?? 'N/A',
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
            XLSX.utils.book_append_sheet(wb, ws, 'Service Invoices');
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            saveAs(blob, `service_invoices_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(`Exported ${rows.length} row(s) to Excel.`);
        } catch (err) {
            console.error('Export error:', err);
            toast.error(err.response?.data?.message || err.message || 'Export failed.');
        } finally {
            setExporting(false);
        }
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
                                <MenuItem value="Unpaid">Unpaid</MenuItem>
                                <MenuItem value="TDS">TDS</MenuItem>
                                {/* Add other payment statuses as needed */}
                            </Select>
                        </FormControl>
                        <Button variant="contained" onClick={handleFilter} sx={{ height: '56px' }}>
                            Filter
                        </Button>
                        <Button variant="outlined" onClick={handleClearFilter} sx={{ height: '56px' }}>
                            Clear Filter
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleExportExcel}
                            disabled={exporting || totalCount === 0}
                            sx={{ height: '56px' }}
                        >
                            {exporting ? 'Exporting…' : 'Export to Excel'}
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
                                <TableCell>Status</TableCell>
                                <TableCell align="center">PDF</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {invoices.length === 0 && !loading ? ( // Check loading state to avoid "No data" during initial fetch
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title={isQuotationReport ? 'Download quotation PDF' : 'Download invoice PDF'}>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleDownloadInvoicePdf(invoice)}
                                                    aria-label="Download invoice PDF"
                                                >
                                                    <DownloadIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {!isQuotationReport ? (
                                                <Tooltip title="Download payment copy PDF">
                                                    <IconButton
                                                        size="small"
                                                        color="secondary"
                                                        onClick={() => handleDownloadPaymentPdf(invoice)}
                                                        aria-label="Download payment PDF"
                                                        sx={{ ml: 0.5 }}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : null}
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