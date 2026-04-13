import React, { useState, useEffect, useMemo } from 'react';
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
    TablePagination,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
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

function invoicePaymentEmailsFromRecord(inv) {
    if (Array.isArray(inv?.paymentContactEmails) && inv.paymentContactEmails.length) {
        return [...new Set(inv.paymentContactEmails.map((e) => String(e || '').trim()).filter(Boolean))];
    }
    const one = String(inv?.paymentContactEmail || '').trim();
    return one ? [one] : [];
}

/** Paid invoices often have no paymentAmount in DB; default to grandTotal so save does not flip status to Unpaid. */
function deriveInitialPaymentAmount(invoice) {
    const stored = invoice?.paymentAmount;
    const n = stored !== undefined && stored !== null && stored !== '' ? Number(stored) : NaN;
    if (invoice?.status === 'Paid' && (Number.isNaN(n) || n === 0)) {
        return Number(invoice?.grandTotal) || 0;
    }
    if (!Number.isNaN(n)) return n;
    return 0;
}

function paymentCoversGrandTotal(paymentAmt, grandTotal) {
    const p = Number(paymentAmt);
    const g = Number(grandTotal);
    if (Number.isNaN(p) || Number.isNaN(g)) return false;
    return p + 1e-6 >= g;
}

const ServiceInvoicesReport = (props) => {
    const navigate = useNavigate();
    const { auth, userPermissions } = useAuth();
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
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState(null);
    const [paymentForm, setPaymentForm] = useState({});
    const [companyContactPersons, setCompanyContactPersons] = useState([]);
    const [companyPendingInvoice, setCompanyPendingInvoice] = useState([]);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
    const [balanceAmount, setBalanceAmount] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [savingPayment, setSavingPayment] = useState(false);
    const { companyId: filterCompanyId } = useParams();

    const hasPermission = (key) =>
        userPermissions?.some((p) => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;

    const contactsWithEmail = useMemo(() => {
        const seen = new Set();
        const list = [];
        for (const cp of companyContactPersons) {
            const email = (cp?.email || '').trim();
            if (email && !seen.has(email)) {
                seen.add(email);
                list.push(cp);
            }
        }
        return list;
    }, [companyContactPersons]);

    const paymentEmailAutocompleteOptions = useMemo(() => {
        const fromContacts = contactsWithEmail.map((cp) => (cp?.email || '').trim()).filter(Boolean);
        const selected = (paymentForm.paymentContactEmails || []).map((e) => String(e || '').trim()).filter(Boolean);
        return [...new Set([...selected, ...fromContacts])];
    }, [contactsWithEmail, paymentForm.paymentContactEmails]);

    const selectedAllocatedTotal =
        companyPendingInvoice
            ?.filter((inv) => selectedInvoiceIds.includes(inv._id))
            .reduce((sum, inv) => sum + Number(inv?.grandTotal || 0), 0) || 0;
    const remainingToAllocate = Math.max(0, (balanceAmount || 0) - selectedAllocatedTotal);

    const fetchServiceInvoices = async (
        from = '',
        to = '',
        companyName = '',
        invoiceNumber = '',
        paymentStatus = '',
        currentPage = page,
        currentRowsPerPage = rowsPerPage,
        silent = false
    ) => {
        if (!silent) {
            setLoading(true);
        }
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
            if (!silent) {
                setLoading(false);
            }
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

    const togglePendingInvoiceSelection = (pendingInv) => {
        const id = pendingInv._id;
        const amount = Number(pendingInv?.grandTotal || 0);
        setSelectedInvoiceIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }
            const currentTotal =
                companyPendingInvoice
                    ?.filter((inv) => prev.includes(inv._id))
                    .reduce((s, inv) => s + Number(inv?.grandTotal || 0), 0) || 0;
            if (currentTotal + amount <= (balanceAmount || 0)) return [...prev, id];
            return prev;
        });
    };

    const handleOpenPaymentDetailsModal = async (invoice) => {
        setPaymentInvoice(invoice);
        const companyId = invoice?.companyId?._id || invoice?.companyId;
        let persons = [];
        if (companyId && auth?.token) {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${companyId}`,
                    { headers: { Authorization: auth.token } }
                );
                if (data?.success && Array.isArray(data.company?.contactPersons)) {
                    persons = data.company.contactPersons;
                }
            } catch (e) {
                console.error(e);
                toast.error('Could not load company contacts.');
            }
        }
        setCompanyContactPersons(persons);
        setSelectedInvoiceIds([]);

        const initialPay = deriveInitialPaymentAmount(invoice);
        const grand = Number(invoice.grandTotal) || 0;

        if (initialPay < grand) {
            setPendingAmount(grand - initialPay);
            setBalanceAmount(0);
            setCompanyPendingInvoice([]);
        } else if (initialPay > grand) {
            const bal = initialPay - grand;
            setBalanceAmount(bal);
            setPendingAmount(0);
            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                    {
                        companyId: invoice?.companyId,
                        tdsAmount: { $eq: null },
                        status: { $ne: 'Paid' },
                    },
                    { headers: { Authorization: auth.token } }
                );
                setCompanyPendingInvoice(response.data?.serviceInvoices || []);
            } catch (err) {
                console.log(err, 'Api error');
                setCompanyPendingInvoice([]);
            }
        } else {
            setPendingAmount(0);
            setBalanceAmount(0);
            setCompanyPendingInvoice([]);
        }

        setPaymentForm({
            modeOfPayment: invoice.modeOfPayment || '',
            bankName: invoice.bankName || '',
            transactionDetails: invoice.transactionDetails || '',
            chequeDate: invoice.chequeDate ? new Date(invoice.chequeDate).toISOString().split('T')[0] : '',
            transferDate: invoice.transferDate ? new Date(invoice.transferDate).toISOString().split('T')[0] : '',
            companyNamePayment: invoice.companyNamePayment || '',
            paymentContactEmails: invoicePaymentEmailsFromRecord(invoice),
            otherPaymentMode: invoice.otherPaymentMode || '',
            paymentAmount: initialPay,
            paymentAmountType: invoice.paymentAmountType || '',
            grandTotal: Number(invoice.grandTotal).toFixed(2) || 0,
        });
        setPaymentModalOpen(true);
    };

    const handleClosePaymentDetailsModal = () => {
        setPaymentModalOpen(false);
        setPaymentInvoice(null);
        setSelectedInvoiceIds([]);
        setCompanyContactPersons([]);
        setCompanyPendingInvoice([]);
        setBalanceAmount(0);
        setPendingAmount(0);
    };

    const handlePaymentFormChange = async (e) => {
        const { name, value } = e.target;
        setPaymentForm((prev) => ({ ...prev, [name]: value }));

        if (name === 'paymentAmount' && paymentInvoice) {
            setSelectedInvoiceIds([]);
            const numVal = Number(value);
            const grand = Number(paymentInvoice?.grandTotal);
            if (numVal < grand) {
                setPendingAmount(grand - numVal);
                setBalanceAmount(0);
                setCompanyPendingInvoice([]);
            } else {
                const bal = numVal - grand;
                setBalanceAmount(bal);
                setPendingAmount(0);
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/all`,
                        {
                            companyId: paymentInvoice?.companyId,
                            tdsAmount: { $eq: null },
                            status: { $ne: 'Paid' },
                        },
                        { headers: { Authorization: auth.token } }
                    );
                    setCompanyPendingInvoice(response.data?.serviceInvoices || []);
                } catch (err) {
                    console.log(err, 'Api error');
                }
            }
        }
    };

    const buildPaymentPayload = (paymentAmount, isFullPayment = false) => {
        const status = isFullPayment ? 'Paid' : 'Unpaid';
        const payload = {
            modeOfPayment: paymentForm.modeOfPayment,
            bankName: paymentForm.bankName,
            transactionDetails: paymentForm.transactionDetails,
            chequeDate: paymentForm.chequeDate,
            transferDate: paymentForm.transferDate,
            companyNamePayment: paymentForm.companyNamePayment,
            paymentContactEmails: [
                ...new Set((paymentForm.paymentContactEmails || []).map((e) => String(e || '').trim()).filter(Boolean)),
            ],
            paymentContactEmail:
                (paymentForm.paymentContactEmails || []).map((e) => String(e || '').trim()).filter(Boolean)[0] || '',
            otherPaymentMode: paymentForm.otherPaymentMode,
            paymentAmountType: paymentForm.paymentAmountType,
            paymentAmount: Number(paymentAmount),
            tdsAmount: 0,
            pendingAmount: 0,
            status,
        };
        if (paymentForm.paymentAmountType === 'TDS') {
            payload.tdsAmount = pendingAmount || 0;
        } else if (paymentForm.paymentAmountType === 'Pending') {
            payload.pendingAmount = pendingAmount || 0;
        }
        return payload;
    };

    const handleSavePaymentDetails = async (targetInvoiceIdArg, amountArg) => {
        if (!paymentInvoice?._id) return;
        const isMultiSave = typeof targetInvoiceIdArg === 'string' && amountArg != null;
        try {
            if (isMultiSave) {
                const pendingInv = companyPendingInvoice?.find((i) => i._id === targetInvoiceIdArg);
                const payload = buildPaymentPayload(
                    amountArg,
                    amountArg >= (Number(pendingInv?.grandTotal) || 0)
                );
                await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${targetInvoiceIdArg}`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                return;
            }

            setSavingPayment(true);
            const inv = paymentInvoice;
            const gt = Number(paymentForm?.grandTotal) || Number(inv?.grandTotal) || 0;
            const payNum = Number(paymentForm?.paymentAmount);
            const covers = paymentCoversGrandTotal(payNum, gt);
            const currentInvoicePayment = covers ? gt : payNum;
            const isFullPayment = covers || paymentForm.paymentAmountType === 'TDS';
            const currentPayload = buildPaymentPayload(currentInvoicePayment, isFullPayment);

            await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/service-invoice/update/${inv._id}`,
                currentPayload,
                { headers: { Authorization: auth.token } }
            );

            for (const invId of selectedInvoiceIds) {
                const pendingInv = companyPendingInvoice?.find((i) => i._id === invId);
                const amt = Number(pendingInv?.grandTotal || 0);
                if (amt <= 0) continue;
                await handleSavePaymentDetails(invId, amt);
            }

            const allocatedInvoices = (selectedInvoiceIds || [])
                .map((invId) => {
                    const pInv = companyPendingInvoice?.find((i) => i._id === invId);
                    return pInv
                        ? {
                              invoiceId: pInv._id,
                              amount: Number(pInv?.grandTotal || 0),
                              invoiceDate: pInv?.invoiceDate,
                              grandTotal: pInv?.grandTotal,
                          }
                        : null;
                })
                .filter(Boolean);

            const n8nPayload = {
                invoiceId: inv._id,
                invoice: {
                    _id: inv._id,
                    grandTotal: inv.grandTotal,
                    invoiceDate: inv.invoiceDate,
                    companyId: inv.companyId,
                    invoiceNumber: inv.invoiceNumber,
                },
                payment: {
                    modeOfPayment: paymentForm.modeOfPayment,
                    paymentAmount: Number(paymentForm.paymentAmount) || 0,
                    bankName: paymentForm.bankName,
                    transactionDetails: paymentForm.transactionDetails,
                    chequeDate: paymentForm.chequeDate,
                    transferDate: paymentForm.transferDate,
                    companyNamePayment: paymentForm.companyNamePayment,
                    paymentContactEmails: [
                        ...new Set((paymentForm.paymentContactEmails || []).map((e) => String(e || '').trim()).filter(Boolean)),
                    ],
                    otherPaymentMode: paymentForm.otherPaymentMode,
                    paymentAmountType: paymentForm.paymentAmountType,
                    currentInvoicePayment,
                },
                allocatedToInvoices: allocatedInvoices,
            };

            try {
                await axios.post(
                    'https://n8n.nicknameinfo.net/webhook/fb83e945-2e49-4a73-acce-fd08632ef1a8',
                    n8nPayload
                );
                toast.success('Payment updated (ack sent).');
            } catch (webhookError) {
                console.error('n8n webhook error:', webhookError);
                toast.error(webhookError?.message || 'Payment updated, but ack failed.');
            }

            handleClosePaymentDetailsModal();
            await fetchServiceInvoices(
                fromDate,
                toDate,
                companyNameFilter,
                invoiceNumberFilter,
                paymentStatusFilter,
                page,
                rowsPerPage,
                true
            );
        } catch (error) {
            console.error('Error updating payment details:', error);
            toast.error(error.response?.data?.message || 'Failed to update payment details.');
        } finally {
            if (!isMultiSave) {
                setSavingPayment(false);
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
                                            {hasPermission('serviceInvoice') && !isQuotationReport ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mb: 1, display: 'block' }}
                                                    onClick={() => handleOpenPaymentDetailsModal(invoice)}
                                                >
                                                    Edit payment
                                                </Button>
                                            ) : null}
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

                <Dialog open={paymentModalOpen} onClose={handleClosePaymentDetailsModal} maxWidth="sm" fullWidth>
                    <DialogTitle>Payment Details (RS: {paymentInvoice?.grandTotal})</DialogTitle>
                    <DialogContent>
                        {paymentInvoice ? (
                            <>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Invoice company: {paymentInvoice.companyId?.companyName || 'N/A'}
                                </Typography>
                                <Autocomplete
                                    multiple
                                    freeSolo
                                    options={paymentEmailAutocompleteOptions}
                                    value={paymentForm.paymentContactEmails || []}
                                    onChange={(event, newValue) => {
                                        const cleaned = [...new Set(newValue.map((v) => String(v || '').trim()).filter(Boolean))];
                                        setPaymentForm((prev) => ({ ...prev, paymentContactEmails: cleaned }));
                                    }}
                                    getOptionLabel={(option) => option}
                                    filterSelectedOptions
                                    renderOption={(props, option) => {
                                        const cp = contactsWithEmail.find((c) => (c?.email || '').trim() === option);
                                        const label = cp
                                            ? `${cp.name || 'Contact'} — ${option}${cp.mobile ? ` (${cp.mobile})` : ''}`
                                            : option;
                                        return (
                                            <li {...props} key={option}>
                                                {label}
                                            </li>
                                        );
                                    }}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            margin="normal"
                                            size="small"
                                            label="Contact persons (email)"
                                            placeholder={
                                                contactsWithEmail.length ? 'Pick contacts or type email, Enter to add' : 'Type email, Enter to add'
                                            }
                                            helperText="Multi-select company contacts and/or add any email; all are saved on this invoice."
                                        />
                                    )}
                                />
                                <FormControl fullWidth margin="normal" size="small">
                                    <InputLabel id="report-mode-of-payment-label">Mode Of Payment</InputLabel>
                                    <Select
                                        labelId="report-mode-of-payment-label"
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
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Amount"
                                    name="paymentAmount"
                                    type="number"
                                    value={paymentForm.paymentAmount}
                                    onChange={handlePaymentFormChange}
                                    size="small"
                                />

                                {companyPendingInvoice?.length > 0 && balanceAmount > 0 && (
                                    <>
                                        <p>Previous Invoice Balance - Rs {balanceAmount.toFixed(2)}</p>
                                        <p>
                                            <strong>Allocated to selected invoices - Rs {selectedAllocatedTotal.toFixed(2)}</strong>
                                        </p>
                                        {remainingToAllocate > 0 && (
                                            <p style={{ color: '#666' }}>
                                                Remaining to allocate - Rs {remainingToAllocate.toFixed(2)} (select more invoices so total equals
                                                balance)
                                            </p>
                                        )}
                                        {remainingToAllocate === 0 && selectedInvoiceIds.length > 0 && (
                                            <p style={{ color: 'green' }}>Amount fully allocated.</p>
                                        )}
                                        <FormControl fullWidth margin="normal" size="small">
                                            <InputLabel id="report-select-pending-invoices-label" shrink>
                                                Select Pending Invoices
                                            </InputLabel>
                                            <Box sx={{ mt: 1, maxHeight: 220, overflow: 'auto', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                                                {companyPendingInvoice
                                                    ?.filter((pendingInv) => pendingInv._id !== paymentInvoice._id)
                                                    .map((pendingInv) => {
                                                        const invAmount = Number(pendingInv?.grandTotal || 0);
                                                        const canSelect =
                                                            invAmount <= remainingToAllocate || selectedInvoiceIds.includes(pendingInv._id);
                                                        return (
                                                            <Box
                                                                key={pendingInv._id}
                                                                onClick={() => canSelect && togglePendingInvoiceSelection(pendingInv)}
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 1,
                                                                    py: 0.5,
                                                                    px: 1,
                                                                    cursor: canSelect ? 'pointer' : 'not-allowed',
                                                                    bgcolor: selectedInvoiceIds.includes(pendingInv._id)
                                                                        ? 'action.selected'
                                                                        : 'transparent',
                                                                    borderRadius: 1,
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedInvoiceIds.includes(pendingInv._id)}
                                                                    onChange={() => {}}
                                                                    disabled={!canSelect}
                                                                />
                                                                <span>
                                                                    {new Date(pendingInv.invoiceDate).toLocaleDateString()} - Rs{' '}
                                                                    {pendingInv?.grandTotal}
                                                                </span>
                                                            </Box>
                                                        );
                                                    })}
                                            </Box>
                                        </FormControl>
                                    </>
                                )}

                                {pendingAmount > 0 && (
                                    <FormControl fullWidth margin="normal" size="small">
                                        <InputLabel id="report-payment-amount-type-label">Amount Type</InputLabel>
                                        <Select
                                            labelId="report-payment-amount-type-label"
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
                                    </FormControl>
                                )}
                            </>
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePaymentDetailsModal} color="primary" disabled={savingPayment}>
                            Close
                        </Button>
                        <Button
                            onClick={() => handleSavePaymentDetails()}
                            color="primary"
                            variant="contained"
                            disabled={savingPayment || !paymentInvoice}
                        >
                            {savingPayment ? 'Saving…' : 'Save changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Box>
    );
};

export default ServiceInvoicesReport;