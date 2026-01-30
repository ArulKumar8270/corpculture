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
    Autocomplete, // Added Autocomplete
    Collapse,
    IconButton,
    TablePagination
} from '@mui/material';
import { Visibility as VisibilityIcon, UploadFile as UploadFileIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Edit as EditIcon } from '@mui/icons-material';
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
        modeOfPayment: 'CASH',
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
    const [rentalTypeFilter, setRentalTypeFilter] = useState('');
    const [rentalTitleFilter, setRentalTitleFilter] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filteredRentalEntries, setFilteredRentalEntries] = useState([]); // State for filtered entries
    const [companyPendingInvoice, setCompanyPendingInvoice] = useState([])
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([])
    const [balanceAmount, setBalanceAmount] = useState(0)
    const [pendingAmount, setPendingAmount] = useState(0)
    const [deletingLink, setDeletingLink] = useState(false);
    const [isInvoiceSend, setInvoiceSend] = useState(false);
    const [expandedEntries, setExpandedEntries] = useState(new Set()); // Track expanded entries
    const [currentInvoice, setCurrentInvoice] = useState(null); // Store current invoice for filtering
    const [users, setUsers] = useState([]); // State for users list
    const [openReassignModal, setOpenReassignModal] = useState(false); // State for reassign modal
    const [selectedEntryId, setSelectedEntryId] = useState(null); // State for selected entry ID
    const [selectedUserId, setSelectedUserId] = useState(''); // State for selected user in reassign modal
    const [reassigning, setReassigning] = useState(false); // State for reassign loading
    const [page, setPage] = useState(0); // Pagination state
    const [rowsPerPage, setRowsPerPage] = useState(10); // Pagination state
    useEffect(() => {
        fetchRentalEntries();
        fetchUsers();
    }, [auth.token, props.invoice]);

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

    // Effect to filter rental entries based on filters + search query
    useEffect(() => {
        const filterData = () => {
            let filtered = rentalEntries;

            // Apply dropdown filters first
            if (rentalTypeFilter) {
                filtered = filtered.filter(entry => {
                    const entryType = typeof entry.rentalId === 'object' && entry.rentalId?.rentalType ? entry.rentalId.rentalType : null;
                    return entryType === rentalTypeFilter;
                });
            }
            if (rentalTitleFilter) {
                filtered = filtered.filter(entry => {
                    const entryTitle = typeof entry.rentalId === 'object' && entry.rentalId?.rentalTitle ? entry.rentalId.rentalTitle : null;
                    return entryTitle === rentalTitleFilter;
                });
            }
            if (employeeFilter) {
                filtered = filtered.filter(entry => entry.assignedTo?.name === employeeFilter);
            }
            if (companyFilter) {
                filtered = filtered.filter(entry => entry.companyId?.companyName === companyFilter);
            }
            if (statusFilter) {
                filtered = filtered.filter(entry => entry.status === statusFilter);
            }

            // Then apply text search
            if (searchQuery) {
                const lowercasedQuery = searchQuery.toLowerCase();
                filtered = filtered.filter(entry => {
                    const invoiceNumberMatch = props.invoice === "invoice" && entry.invoiceNumber?.toString().toLowerCase().includes(lowercasedQuery);
                    const companyNameMatch = entry.companyId?.companyName?.toLowerCase().includes(lowercasedQuery);
                    const statusMatch = entry.paymentAmountType?.toLowerCase().includes(lowercasedQuery);

                    // Date matching: Convert invoiceDate (or entryDate/createdAt as fallback) to a date string (e.g., "YYYY-MM-DD")
                    const invoiceDateValue = entry.invoiceDate || entry.entryDate || entry.createdAt;
                    const invoiceDateStr = invoiceDateValue ? new Date(invoiceDateValue).toISOString().split('T')[0] : '';
                    const dateMatch = invoiceDateStr.includes(lowercasedQuery);

                    return invoiceNumberMatch || companyNameMatch || dateMatch || statusMatch;
                });
            }

            setFilteredRentalEntries(filtered);
            setPage(0); // Reset to first page when filters or search query changes
        };

        filterData();
    }, [searchQuery, rentalEntries, props.invoice, rentalTypeFilter, rentalTitleFilter, employeeFilter, companyFilter, statusFilter]); // Re-run filter when query, filters, or original data changes


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
                // Store the actual global invoiceCount value + 1 for next invoice
                setInvoiceCount((data.commonDetails?.invoiceCount || 0) + 1);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
        }
    };

    // Options for filter dropdowns, derived from current rental entries
    const rentalTypes = React.useMemo(() => {
        const types = rentalEntries
            ?.map((entry) => (typeof entry.rentalId === 'object' && entry.rentalId?.rentalType) ? entry.rentalId.rentalType : null)
            .filter(Boolean) || [];
        return [...new Set(types)].sort();
    }, [rentalEntries]);

    const rentalTitles = React.useMemo(() => {
        const titles = rentalEntries
            ?.map((entry) => (typeof entry.rentalId === 'object' && entry.rentalId?.rentalTitle) ? entry.rentalId.rentalTitle : null)
            .filter(Boolean) || [];
        return [...new Set(titles)].sort();
    }, [rentalEntries]);

    const employeeNames = React.useMemo(() => {
        const names = rentalEntries
            ?.map((entry) => entry.assignedTo?.name)
            .filter(Boolean) || [];
        return [...new Set(names)].sort();
    }, [rentalEntries]);

    const companyNames = React.useMemo(() => {
        const names = rentalEntries
            ?.map((entry) => entry.companyId?.companyName)
            .filter(Boolean) || [];
        return [...new Set(names)].sort();
    }, [rentalEntries]);

    const statuses = React.useMemo(() => {
        const sts = rentalEntries
            ?.map((entry) => entry.status)
            .filter(Boolean) || [];
        return [...new Set(sts)].sort();
    }, [rentalEntries]);

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
            const res = await axios.post('https://n8n.nicknameinfo.net/webhook/60f841c0-76d9-47c3-8a4c-7129ceca00df', { invoiceId: invoice});
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
        setCurrentInvoice(invoice); // Store current invoice for filtering
        setPaymentForm({
            modeOfPayment: invoice?.modeOfPayment || 'CASH',
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
        setCurrentInvoice(null);
        setSelectedInvoiceIds([]);
    };

    const selectedAllocatedTotal = companyPendingInvoice
        ?.filter((inv) => selectedInvoiceIds.includes(inv._id))
        .reduce((sum, inv) => sum + Number(inv?.grandTotal || 0), 0) || 0;
    const remainingToAllocate = Math.max(0, (balanceAmount || 0) - selectedAllocatedTotal);

    const togglePendingInvoiceSelection = (pendingInv) => {
        const id = pendingInv._id;
        const amount = Number(pendingInv?.grandTotal || 0);
        setSelectedInvoiceIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            const currentTotal = companyPendingInvoice
                ?.filter((inv) => prev.includes(inv._id))
                .reduce((s, inv) => s + Number(inv?.grandTotal || 0), 0) || 0;
            if (currentTotal + amount <= (balanceAmount || 0)) return [...prev, id];
            return prev;
        });
    };

    const handlePaymentFormChange = async (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({ ...prev, [name]: value }));
        if (name === "paymentAmount") {
            setSelectedInvoiceIds([]);
            if (value < currentInvoice?.grandTotal) {
                let balanceAmount = currentInvoice?.grandTotal - value;
                setPendingAmount(balanceAmount);
                setBalanceAmount(0);
            } else {
                let balanceAmount = value - currentInvoice?.grandTotal;
                setBalanceAmount(balanceAmount);
                setPendingAmount(0);
                try {
                    let response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/all`,
                        { companyId: currentInvoice?.companyId || paymentForm?.companyId, tdsAmount: { $eq: null }, status: { $ne: "Paid" } },
                        { headers: { Authorization: auth.token } }
                    );
                    setCompanyPendingInvoice(response.data?.entries || []);
                } catch (err) {
                    console.log(err, "Api error");
                }
            }
        }
    };

    const buildPaymentPayload = (paymentAmount, isFullPayment = false) => {
        const status = isFullPayment ? "Paid" : "Unpaid";
        const payload = {
            modeOfPayment: paymentForm.modeOfPayment,
            bankName: paymentForm.bankName,
            transactionDetails: paymentForm.transactionDetails,
            chequeDate: paymentForm.chequeDate,
            transferDate: paymentForm.transferDate,
            companyNamePayment: paymentForm.companyNamePayment,
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
        const isMultiSave = typeof targetInvoiceIdArg === 'string' && amountArg != null;
        try {
            if (isMultiSave) {
                const payload = buildPaymentPayload(amountArg, amountArg >= (companyPendingInvoice?.find((i) => i._id === targetInvoiceIdArg)?.grandTotal || 0));
                await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${targetInvoiceIdArg}`,
                    payload,
                    { headers: { Authorization: auth.token } }
                );
                return;
            }

            const currentInvoicePayment = Number(paymentForm?.paymentAmount) >= Number(paymentForm?.grandTotal)
                ? Number(paymentForm?.grandTotal)
                : Number(paymentForm?.paymentAmount);
            const currentPayload = buildPaymentPayload(
                currentInvoicePayment,
                Number(paymentForm?.paymentAmount) >= Number(paymentForm?.grandTotal) || paymentForm.paymentAmountType === 'TDS'
            );

            await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${paymentForm?.invoiceId}`,
                currentPayload,
                { headers: { Authorization: auth.token } }
            );

            for (const invId of selectedInvoiceIds) {
                const pendingInv = companyPendingInvoice?.find((i) => i._id === invId);
                const amt = Number(pendingInv?.grandTotal || 0);
                if (amt <= 0) continue;
                await handleSavePaymentDetails(invId, amt);
            }

            handleClosePaymentDetailsModal();
            fetchRentalEntries();

            const allocatedInvoices = (selectedInvoiceIds || []).map((invId) => {
                const inv = companyPendingInvoice?.find((i) => i._id === invId);
                return inv ? { invoiceId: inv._id, amount: Number(inv?.grandTotal || 0), invoiceDate: inv?.invoiceDate || inv?.entryDate || inv?.createdAt, grandTotal: inv?.grandTotal } : null;
            }).filter(Boolean);

            const n8nPayload = {
                invoiceId: currentInvoice?._id,
                invoice: {
                    _id: currentInvoice?._id,
                    grandTotal: currentInvoice?.grandTotal,
                    invoiceDate: currentInvoice?.invoiceDate || currentInvoice?.entryDate || currentInvoice?.createdAt,
                    companyId: currentInvoice?.companyId,
                    invoiceNumber: currentInvoice?.invoiceNumber,
                },
                payment: {
                    modeOfPayment: paymentForm.modeOfPayment,
                    paymentAmount: Number(paymentForm.paymentAmount) || 0,
                    bankName: paymentForm.bankName,
                    transactionDetails: paymentForm.transactionDetails,
                    chequeDate: paymentForm.chequeDate,
                    transferDate: paymentForm.transferDate,
                    companyNamePayment: paymentForm.companyNamePayment,
                    otherPaymentMode: paymentForm.otherPaymentMode,
                    paymentAmountType: paymentForm.paymentAmountType,
                    currentInvoicePayment,
                },
                allocatedToInvoices: allocatedInvoices,
            };

            try {
                await axios.post('https://n8n.nicknameinfo.net/webhook/fb83e945-2e49-4a73-acce-fd08632ef1a8', n8nPayload);
            } catch (webhookError) {
                console.error('n8n webhook error:', webhookError);
            }

            toast.success('Payment details updated successfully!');
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

    const onMoveToInvoice = async (status, entry) => {
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
                // Invoice count is now incremented automatically by the backend
                // DO NOT call handleUpdateInvoiceCount() - backend handles it
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

    const toggleExpand = (entryId) => {
        setExpandedEntries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(entryId)) {
                newSet.delete(entryId);
            } else {
                newSet.add(entryId);
            }
            return newSet;
        });
    };

    const isExpanded = (entryId) => {
        return expandedEntries.has(entryId);
    };

    const handleOpenReassignModal = (entryId, currentAssignedToId) => {
        setSelectedEntryId(entryId);
        setSelectedUserId(currentAssignedToId || '');
        setOpenReassignModal(true);
    };

    const handleCloseReassignModal = () => {
        setOpenReassignModal(false);
        setSelectedEntryId(null);
        setSelectedUserId('');
    };

    const handleReassign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user to assign.');
            return;
        }
        if (!selectedEntryId) {
            toast.error('Entry ID is missing.');
            return;
        }
        try {
            setReassigning(true);
            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${selectedEntryId}`,
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
                toast.success('Rental invoice reassigned successfully!');
                handleCloseReassignModal();
                // Refresh the entries list
                fetchRentalEntries();
            } else {
                toast.error(res.data?.message || 'Failed to reassign rental invoice.');
            }
        } catch (error) {
            console.error('Error reassigning rental invoice:', error);
            toast.error('Error reassigning rental invoice.');
        } finally {
            setReassigning(false);
        }
    };

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
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', width: '87%' }}>
            <div className='flex justify-between items-center'>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2, color: '#019ee3', fontWeight: 'bold' }}>
                    {props?.invoice === "invoice" ? "Invoices" : "Quotations"} List
                </Typography>
            </div>
            {/* Filters + Search */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="rental-type-filter-label">Rental Type</InputLabel>
                    <Select
                        labelId="rental-type-filter-label"
                        label="Rental Type"
                        value={rentalTypeFilter}
                        onChange={(e) => setRentalTypeFilter(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All</em>
                        </MenuItem>
                        {rentalTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="rental-title-filter-label">Rental Title</InputLabel>
                    <Select
                        labelId="rental-title-filter-label"
                        label="Rental Title"
                        value={rentalTitleFilter}
                        onChange={(e) => setRentalTitleFilter(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All</em>
                        </MenuItem>
                        {rentalTitles.map((title) => (
                            <MenuItem key={title} value={title}>
                                {title}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="employee-filter-label">Employee</InputLabel>
                    <Select
                        labelId="employee-filter-label"
                        label="Employee"
                        value={employeeFilter}
                        onChange={(e) => setEmployeeFilter(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All</em>
                        </MenuItem>
                        {employeeNames.map((name) => (
                            <MenuItem key={name} value={name}>
                                {name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Autocomplete
                    size="small"
                    options={['', ...companyNames]}
                    value={companyFilter || ''}
                    onChange={(event, newValue) => setCompanyFilter(newValue || '')}
                    getOptionLabel={(option) => option === '' ? 'All' : option}
                    isOptionEqualToValue={(option, value) => option === value}
                    sx={{ minWidth: 200 }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Company"
                            variant="outlined"
                            placeholder="Search company..."
                        />
                    )}
                    noOptionsText="No companies found"
                />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All</em>
                        </MenuItem>
                        {statuses.map((st) => (
                            <MenuItem key={st} value={st}>
                                {st}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    sx={{ minWidth: 260, flex: 1 }}
                    label={`Search ${props?.invoice === "invoice" ? "Invoices" : "Quotations"} (Company, Payment Mode, Status, Date)`}
                    variant="outlined"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </Box>
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
                                    <TableCell padding="checkbox"></TableCell>
                                    {props?.invoice === "invoice" ? <TableCell>Invoice Number</TableCell> : null}
                                    <TableCell>Company Name</TableCell>
                                    <TableCell>Serial No.</TableCell>
                                    <TableCell>Model Name</TableCell>
                                    <TableCell>Send Details To</TableCell>
                                    <TableCell>Invoice Date</TableCell>
                                    <TableCell>Image</TableCell>
                                    <TableCell>Assinged To</TableCell>
                                    <TableCell>Grand Total</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRentalEntries
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((entry) => {
                                    const hasMultipleProducts = entry.products && Array.isArray(entry.products) && entry.products.length > 0;
                                    const hasProducts = hasMultipleProducts || entry.machineId;
                                    const expanded = isExpanded(entry._id);
                                    const productsToShow = hasMultipleProducts ? entry.products : (entry.machineId ? [{ machineId: entry.machineId, serialNo: entry.machineId?.serialNo, countImageUpload: entry.countImageUpload }] : []);

                                    // Get first product for main row display (for backward compatibility)
                                    const firstProduct = hasMultipleProducts ? entry.products[0] : null;
                                    const displayMachine = firstProduct?.machineId || entry.machineId;
                                    const displayImage = firstProduct?.countImageUpload || entry.countImageUpload;

                                    return (
                                        <React.Fragment key={entry._id}>
                                            <TableRow>
                                                <TableCell>
                                                    {hasProducts && (
                                                        <IconButton
                                                            aria-label="expand row"
                                                            size="small"
                                                            onClick={() => toggleExpand(entry._id)}
                                                        >
                                                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                                {props?.invoice === "invoice" ? <TableCell>{entry.invoiceNumber || 'N/A'}</TableCell> : null}
                                                <TableCell>{entry.companyId?.companyName || 'N/A'}</TableCell>
                                                <TableCell>{displayMachine?.serialNo || 'N/A'}</TableCell>
                                                <TableCell>{displayMachine?.modelName || 'N/A'}</TableCell>
                                                <TableCell>{entry.sendDetailsTo || 'N/A'}</TableCell>
                                                <TableCell>{entry.invoiceDate ? new Date(entry.invoiceDate).toLocaleDateString() : (entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : (entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'))}</TableCell>
                                                <TableCell>
                                                    {displayImage?.url ? (
                                                        <a href={displayImage.url} target="_blank" rel="noopener noreferrer">
                                                            <img src={displayImage.url} alt="Count" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                        </a>
                                                    ) : 'No Image'}
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        {entry?.assignedTo ? (
                                                            <Chip label={entry.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                                        ) : (
                                                            'N/A'
                                                        )}
                                                        {hasPermission("rentalInvoice") && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenReassignModal(entry._id, entry?.assignedTo?._id)}
                                                                sx={{ ml: 0.5 }}
                                                                title="Reassign"
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                        ₹{entry.grandTotal ? parseFloat(entry.grandTotal).toFixed(2) : '0.00'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={entry.status}
                                                        size="small"
                                                        color={
                                                            entry.status === 'Paid' ? 'success' :
                                                                entry.status === 'Unpaid' ? 'error' :
                                                                    entry.status === 'Pending' || entry.status === 'Progress' ? 'warning' :
                                                                        'default'
                                                        }
                                                    />
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
                                                        <Button variant="outlined" size="small" onClick={() => onSendInvoice(entry._id)}>
                                                            {isInvoiceSend ? <CircularProgress size={24} /> : `Send ${props?.invoice === "quotation" ? "Quotation" : "Invoice"}`}
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
                                                        {entry.companyId && (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => navigate('/admin/dashboard/activity-log', { state: { preselectedCompany: typeof entry.companyId === 'object' ? entry.companyId : { _id: entry.companyId } } })}
                                                            >
                                                                Submit activity
                                                            </Button>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                            {/* Products Expandable Row */}
                                            {hasProducts && (
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={props?.invoice === "invoice" ? 11 : 10}>
                                                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                                                            <Box sx={{ margin: 2 }}>
                                                                <Typography variant="h6" gutterBottom component="div" sx={{ mb: 2 }}>
                                                                    Products ({productsToShow.length})
                                                                </Typography>
                                                                <Table size="small" aria-label="products">
                                                                    <TableHead>
                                                                        <TableRow>
                                                                            <TableCell>#</TableCell>
                                                                            <TableCell>Serial No.</TableCell>
                                                                            <TableCell>Model Name</TableCell>
                                                                            <TableCell>Image</TableCell>
                                                                            <TableCell align="right">Product Total</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>
                                                                    <TableBody>
                                                                        {productsToShow.map((product, index) => {
                                                                            const machine = product.machineId || entry.machineId;
                                                                            return (
                                                                                <TableRow key={product._id || index}>
                                                                                    <TableCell>{index + 1}</TableCell>
                                                                                    <TableCell>{product.serialNo || machine?.serialNo || 'N/A'}</TableCell>
                                                                                    <TableCell>{machine?.modelName || 'N/A'}</TableCell>
                                                                                    <TableCell>
                                                                                        {product.countImageUpload?.url ? (
                                                                                            <a href={product.countImageUpload.url} target="_blank" rel="noopener noreferrer">
                                                                                                <img src={product.countImageUpload.url} alt="Count" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                                                            </a>
                                                                                        ) : 'No Image'}
                                                                                    </TableCell>
                                                                                    <TableCell align="right">
                                                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                                            ₹{product.productTotal ? parseFloat(product.productTotal).toFixed(2) : '0.00'}
                                                                                        </Typography>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            );
                                                                        })}
                                                                        <TableRow>
                                                                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 'bold' }}>
                                                                                Grand Total:
                                                                            </TableCell>
                                                                            <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1976d2' }}>
                                                                                ₹{entry.grandTotal ? parseFloat(entry.grandTotal).toFixed(2) : '0.00'}
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    </TableBody>
                                                                </Table>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {/* Invoice Links Row */}
                                            {entry.invoiceLink && entry.invoiceLink.length > 0 && (
                                                <TableRow>
                                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={props?.invoice === "invoice" ? 11 : 10}>
                                                        <Box sx={{ margin: 1 }}>
                                                            <Typography variant="h6" gutterBottom component="div">
                                                                {props?.invoice === "invoice" ? "Invoices" : "Quotations"} Links
                                                            </Typography>
                                                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                {entry.invoiceLink?.map((link, index) => (
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
                                                                        {hasPermission("serviceInvoice") && (
                                                                            <IconButton
                                                                                aria-label={`delete invoice link ${index + 1}`}
                                                                                size="small"
                                                                                onClick={() => handleDeleteInvoiceLink(entry._id, link, entry)}
                                                                                disabled={deletingLink}
                                                                                sx={{ ml: 0.5 }}
                                                                            >
                                                                                {deletingLink ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                ))}
                                                            </Stack>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {/* Pagination Component */}
                {filteredRentalEntries.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredRentalEntries.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </Paper>
            {/* Payment Details Update Modal */}
            <Dialog open={openPaymentModal} onClose={handleClosePaymentDetailsModal}>
                <DialogTitle>Payment Details (RS: {paymentForm?.grandTotal})</DialogTitle>
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

                    {companyPendingInvoice?.length > 0 && balanceAmount > 0 && (
                        <>
                            <p>Previous Invoice Balance - Rs {balanceAmount.toFixed(2)}</p>
                            <p><strong>Allocated to selected invoices - Rs {selectedAllocatedTotal.toFixed(2)}</strong></p>
                            {remainingToAllocate > 0 && (
                                <p style={{ color: '#666' }}>Remaining to allocate - Rs {remainingToAllocate.toFixed(2)} (select more invoices so total equals balance)</p>
                            )}
                            {remainingToAllocate === 0 && selectedInvoiceIds.length > 0 && (
                                <p style={{ color: 'green' }}>Amount fully allocated.</p>
                            )}
                            <FormControl fullWidth margin="normal" size="small">
                                <InputLabel id="select-pending-invoices-label" shrink>Select Pending Invoices</InputLabel>
                                <Box sx={{ mt: 1, maxHeight: 220, overflow: 'auto', border: '1px solid #ccc', borderRadius: 1, p: 1 }}>
                                    {companyPendingInvoice
                                        ?.filter((pendingInv) => pendingInv._id !== currentInvoice?._id)
                                        .map((pendingInv) => {
                                            const invAmount = Number(pendingInv?.grandTotal || 0);
                                            const canSelect = invAmount <= remainingToAllocate || selectedInvoiceIds.includes(pendingInv._id);
                                            const dateStr = pendingInv.invoiceDate || pendingInv.entryDate || pendingInv.createdAt;
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
                                                        bgcolor: selectedInvoiceIds.includes(pendingInv._id) ? 'action.selected' : 'transparent',
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedInvoiceIds.includes(pendingInv._id)}
                                                        onChange={() => {}}
                                                        disabled={!canSelect}
                                                    />
                                                    <span>{dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A'} - Rs {pendingInv?.grandTotal}</span>
                                                </Box>
                                            );
                                        })}
                                </Box>
                            </FormControl>
                        </>
                    )}

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
                    <Button
                        onClick={() => handleSavePaymentDetails()}
                        color="primary"
                        variant="contained"
                    >
                        Save changes
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Reassign Modal */}
            <Dialog open={openReassignModal} onClose={handleCloseReassignModal}>
                <DialogTitle>Reassign Rental Invoice</DialogTitle>
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
                            {users?.map((user) => (
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
        </Box>
    );
}

export default RentalInvoiceList;