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
    Tooltip,
    IconButton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close'; // New import for modal close button
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Dialog, // New import for modal
    DialogTitle, // New import for modal title
    DialogContent, // New import for modal content
    DialogActions, // New import for modal actions
    TextField, // New import for input fields
    Autocomplete, // New import for date selection with chips
    Chip, // New import for displaying selected dates
    Stack // New import for arranging chips (optional, Autocomplete handles it)
} from '@mui/material';

const CompanyReports = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the Reminder Modal
    const [openReminderModal, setOpenReminderModal] = useState(false);
    const [currentCompanyIdForReminder, setCurrentCompanyIdForReminder] = useState(null);
    const [reminderMail, setReminderMail] = useState('');
    const [ccMail, setCcMail] = useState('');
    const [selectedReminderDates, setSelectedReminderDates] = useState([]); // Array of strings (days of month)
    // Options for reminder dates (days of the month, 1 to 31)
    const reminderDateOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    useEffect(() => {
        setLoading(true);
        setError(null);
        axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
            headers: { Authorization: auth?.token }
        })
            .then(res => {
                if (res.data.success && Array.isArray(res.data.companies)) {
                    // Map only required fields for table
                    const mappedCompanies = res.data.companies.map(c => ({
                        _id: c._id,
                        companyName: c.companyName,
                        companyAddress: c.billingAddress || c.addressDetail || '', // fallback if billingAddress not present
                        mobileNumber: c.mobileNumber || c.phone || 'N/A', // fallback if mobileNumber not present
                    }));
                    setCompanies(mappedCompanies);
                } else {
                    setCompanies([]);
                    setError(res.data.message || 'Failed to fetch company data.');
                }
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load company data.');
                setLoading(false);
            });
    }, [auth?.token]);

    const handleViewDetails = (companyId) => {
        // Implement navigation to a detailed company report page
        // This page would show all invoices, quotations, reports etc. for that specific company
        toast.info(`Viewing general details for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}`); // Example route for overall company details
    };

    // New functions to handle navigation for specific report types
    const handleViewServiceInvoices = (companyId) => {
        toast.info(`Viewing service invoices for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/service-invoices`);
    };

    const handleViewServiceQuotations = (companyId) => {
        toast.info(`Viewing service quotations for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/service-quotations`);
    };

    const handleViewServiceReports = (companyId) => {
        toast.info(`Viewing service reports for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/service-reports`);
    };

    const handleViewRentalInvoices = (companyId) => {
        toast.info(`Viewing rental invoices for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/rental-invoices`);
    };

    const handleViewRentalQuotations = (companyId) => {
        toast.info(`Viewing rental quotations for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/rental-quotations`);
    };

    const handleViewRentalReports = (companyId) => {
        toast.info(`Viewing rental reports for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/rental-reports`);
    };

    // Functions for Reminder Modal
    const handleOpenReminderModal = (companyId) => {
        setCurrentCompanyIdForReminder(companyId);
        // In a real app, you might fetch existing reminder data for this company here
        setReminderMail(''); // Reset form fields
        setCcMail('');
        setSelectedReminderDates([]);
        setOpenReminderModal(true);
    };

    const handleCloseReminderModal = () => {
        setOpenReminderModal(false);
        setCurrentCompanyIdForReminder(null);
        setReminderMail('');
        setCcMail('');
        setSelectedReminderDates([]);
    };

    const handleSaveReminder = () => {
        if (!reminderMail) {
            toast.error('Reminder Mail is required.');
            return;
        }
        if (selectedReminderDates.length === 0) {
            toast.error('At least one Reminder Date is required.');
            return;
        }

        // Here you would typically make an API call to save the reminder
        console.log({
            companyId: currentCompanyIdForReminder,
            reminderMail,
            ccMail,
            selectedReminderDates
        });
        toast.success(`Reminder set for company ${currentCompanyIdForReminder}`);
        handleCloseReminderModal();
    };

    // Modified handleSetReminder to open the modal
    const handleSetReminder = (companyId) => {
        handleOpenReminderModal(companyId);
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
                <Button onClick={() => window.location.reload()} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Company Reports
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 1000 }} aria-label="company reports table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Company Address</TableCell>
                                <TableCell>Mobile Number</TableCell>
                                <TableCell align="center">Service Invoice</TableCell>
                                <TableCell align="center">Service Quotation</TableCell>
                                <TableCell align="center">Service Report</TableCell>
                                <TableCell align="center">Rental Invoice</TableCell>
                                <TableCell align="center">Rental Quotation</TableCell>
                                <TableCell align="center">Rental Report</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No company data found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companies.map((company) => (
                                    <TableRow key={company._id}>
                                        <TableCell>{company.companyName}</TableCell>
                                        <TableCell>{company.companyAddress}</TableCell>
                                        <TableCell>{company.mobileNumber}</TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewServiceInvoices(company._id)}
                                                disabled={company.serviceInvoiceCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }} // Adjust padding for number
                                            >
                                                {company.serviceInvoiceCount}
                                            </Button>
                                            <Tooltip title="Set Reminder">
                                                <IconButton onClick={() => handleSetReminder(company._id)} color="warning">
                                                    <NotificationsActiveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewServiceQuotations(company._id)}
                                                disabled={company.serviceQuotationCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.serviceQuotationCount}
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewServiceReports(company._id)}
                                                disabled={company.serviceReportCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.serviceReportCount}
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center" className='flex'>
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewRentalInvoices(company._id)}
                                                disabled={company.rentalInvoiceCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.rentalInvoiceCount}
                                            </Button>
                                            <Tooltip title="Set Reminder">
                                                <IconButton onClick={() => handleSetReminder(company._id)} color="warning">
                                                    <NotificationsActiveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewRentalQuotations(company._id)}
                                                disabled={company.rentalQuotationCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.rentalQuotationCount}
                                            </Button>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Button
                                                variant="text"
                                                color="primary"
                                                onClick={() => handleViewRentalReports(company._id)}
                                                disabled={company.rentalReportCount === 0}
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.rentalReportCount}
                                            </Button>
                                        </TableCell>
                                        {/* <TableCell align="center">
                                            <Tooltip title="Set Reminder">
                                                <IconButton onClick={() => handleSetReminder(company._id)} color="warning">
                                                    <NotificationsActiveIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell> */}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Reminder Modal */}
            <Dialog open={openReminderModal} onClose={handleCloseReminderModal} fullWidth maxWidth="sm">
                <DialogTitle>
                    Set Reminder
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseReminderModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="reminder-mail"
                        label="Reminder Mail"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={reminderMail}
                        onChange={(e) => setReminderMail(e.target.value)}
                        required
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="cc-mail"
                        label="CC Mail"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={ccMail}
                        onChange={(e) => setCcMail(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <Autocomplete
                        multiple
                        id="reminder-dates"
                        options={reminderDateOptions}
                        value={selectedReminderDates}
                        onChange={(event, newValue) => {
                            setSelectedReminderDates(newValue);
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Reminder Dates"
                                placeholder="Select dates"
                                required={selectedReminderDates.length === 0} // Mark as required if no dates selected
                            />
                        )}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReminderModal} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveReminder} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyReports;