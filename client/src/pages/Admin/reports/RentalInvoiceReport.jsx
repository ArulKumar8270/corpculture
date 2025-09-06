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
    TablePagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const RentalInvoiceReport = (props) => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [rentalInvoices, setRentalInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState(''); // This might need backend support
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const { companyId: filterCompanyId } = useParams(); // If filtering by company from another page

    const fetchRentalInvoices = async (
        from = '',
        to = '',
        companyName = '',
        invoiceNumber = '',
        paymentStatus = '',
        currentPage = page,
        currentRowsPerPage = rowsPerPage
    ) => {
        setLoading(true);
        setError(null);
        try {
            const requestBody = {
                invoiceType: props?.type, // Fixed for Rental Invoice Report
                fromDate: from,
                toDate: to,
                ...(filterCompanyId ? { companyId: filterCompanyId } : {}),
                companyName: companyName, // Assumes backend can filter by companyName
                invoiceNumber: invoiceNumber,
                paymentStatus: paymentStatus, // Assumes backend can filter by paymentStatus
                page: currentPage + 1,
                limit: currentRowsPerPage,
            };

            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all/`,
                requestBody,
                {
                    headers: { Authorization: auth?.token }
                }
            );

            if (response.data.success) {
                setRentalInvoices(response.data.entries);
                setTotalCount(response.data.totalCount || response.data.entries?.length);
            } else {
                toast.error(response.data.message || 'Failed to fetch rental invoices.');
                setError(response.data.message || 'Failed to fetch rental invoices.');
            }
        } catch (err) {
            console.error('Error fetching rental invoices:', err);
            setError(err.response?.data?.message || 'Error fetching rental invoices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchRentalInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage);
        }
    }, [auth?.token, page, rowsPerPage]);

    const handleView = (invoiceId) => {
        // Assuming a route for viewing single rental invoice details
        navigate(`/admin/rental-invoice/${invoiceId}`);
    };

    const handleEdit = (invoiceId) => {
        // Assuming a route for editing rental invoices
        navigate(`/admin/edit-rental-invoice/${invoiceId}`);
    };

    const handleDelete = async (invoiceId) => {
        if (window.confirm('Are you sure you want to delete this rental invoice?')) {
            try {
                // Assuming a delete endpoint for rental payment entries
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${invoiceId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchRentalInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage);
                } else {
                    toast.error(response.data.message || 'Failed to delete rental invoice.');
                }
            } catch (err) {
                console.error('Error deleting rental invoice:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while deleting rental invoice.');
            }
        }
    };

    const handleFilter = () => {
        setPage(0);
        fetchRentalInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, 0, rowsPerPage);
    };

    const handleClearFilter = () => {
        setFromDate('');
        setToDate('');
        setCompanyNameFilter('');
        setInvoiceNumberFilter('');
        setPaymentStatusFilter('');
        setPage(0);
        setRowsPerPage(10);
        fetchRentalInvoices('', '', '', '', '', 0, 10);
    };

    const handleExportExcel = () => {
        if (rentalInvoices.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const dataToExport = rentalInvoices.map(invoice => ({
            'Invoice No.': invoice.invoiceNumber,
            'Company': invoice.companyId?.companyName || 'N/A',
            'Machine Model': invoice.machineId?.modelName || 'N/A',
            'Machine Serial No.': invoice.machineId?.serialNo || 'N/A',
            'Invoice Date': new Date(invoice.createdAt).toLocaleDateString(), // Using createdAt as invoice date
            'Grand Total': 'N/A', // Placeholder: Grand Total not in sample response
            'Mode of Payment': invoice.modeOfPayment || 'N/A',
            'Bank Name': invoice.bankName || 'N/A',
            'Cheque Date': invoice.chequeDate ? new Date(invoice.chequeDate).toLocaleDateString() : 'N/A',
            'Other Payment Mode': invoice.otherPaymentMode || 'N/A',
            'Transaction Details': invoice.transactionDetails || 'N/A',
            'Transfer Date': invoice.transferDate ? new Date(invoice.transferDate).toLocaleDateString() : 'N/A',
            'Status': 'N/A', // Placeholder: Payment Status not in sample response
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rental Invoices");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'rental_invoices_report.xlsx');
        toast.success("Exported to Excel successfully!");
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
                <Button onClick={() => fetchRentalInvoices(fromDate, toDate, companyNameFilter, invoiceNumberFilter, paymentStatusFilter, page, rowsPerPage)} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Rental Invoices Report
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                {/* Filter Options */}
                <Box sx={{ mb: 3 }}>
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
                                {/* Add other payment statuses as needed, assuming backend support */}
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

                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="rental invoices table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Invoice No.</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Machine Model / Serial</TableCell>
                                <TableCell>Invoice Date</TableCell>
                                <TableCell>Grand Total</TableCell> {/* Placeholder */}
                                <TableCell>Payment Details</TableCell>
                                <TableCell>Status</TableCell> {/* Placeholder */}
                                {/* <TableCell>Actions</TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rentalInvoices.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No rental invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rentalInvoices.map((invoice, index) => (
                                    <TableRow key={invoice._id}>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{invoice.companyId?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{`${invoice.machineId?.modelName || 'N/A'} / ${invoice.machineId?.serialNo || 'N/A'}`}</TableCell>
                                        <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>N/A</TableCell> {/* Grand Total placeholder */}
                                        <TableCell>
                                            <p>Mode: {invoice?.modeOfPayment || 'N/A'}</p>
                                            {invoice?.bankName && <p>Bank: {invoice?.bankName}</p>}
                                            {invoice?.chequeDate && <p>Cheque Date: {new Date(invoice?.chequeDate).toLocaleDateString()}</p>}
                                            {invoice?.otherPaymentMode && <p>Other Mode: {invoice?.otherPaymentMode}</p>}
                                            {invoice?.transactionDetails && <p>Transaction: {invoice?.transactionDetails}</p>}
                                            {invoice?.transferDate && <p>Transfer Date: {new Date(invoice?.transferDate).toLocaleDateString()}</p>}
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
                                        {/* <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleView(invoice._id)} color="info">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Invoice">
                                                <IconButton onClick={() => handleEdit(invoice._id)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Invoice">
                                                <IconButton onClick={() => handleDelete(invoice._id)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell> */}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>
        </Box>
    );
};

export default RentalInvoiceReport;