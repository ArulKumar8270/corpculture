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
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField // Import TextField for search input
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
    Chip,
    Stack
} from '@mui/material';

const CompanyReports = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term

    // State for the Reminder Modal
    const [openReminderModal, setOpenReminderModal] = useState(false);
    const [currentCompanyIdForReminder, setCurrentCompanyIdForReminder] = useState(null);
    const [reminderMail, setReminderMail] = useState('');
    const [ccMail, setCcMail] = useState('');
    const [selectedReminderDates, setSelectedReminderDates] = useState([]);
    const [remainderType, setRemainderType] = useState('');
    const [fetchingReminderData, setFetchingReminderData] = useState(false); // New state for loading reminder data
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
                    // Map only required fields for table, including new count fields
                    const mappedCompanies = res.data.companies.map(c => ({
                        _id: c._id,
                        companyName: c.companyName,
                        companyAddress: c.billingAddress || c.addressDetail || '',
                        mobileNumber: c.mobileNumber || c.phone || 'N/A',
                        // Assuming these counts are now returned by the backend for each company
                        serviceInvoiceCount: c.serviceInvoiceCount || 0,
                        serviceQuotationCount: c.serviceQuotationCount || 0,
                        serviceReportCount: c.serviceReportCount || 0,
                        rentalInvoiceCount: c.rentalInvoiceCount || 0,
                        rentalQuotationCount: c.rentalQuotationCount || 0,
                        rentalReportCount: c.rentalReportCount || 0,
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
        toast.info(`Viewing general details for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}`);
    };

    const handleViewServiceInvoices = (companyId) => {
        navigate(`../serviceInvoicesReport/${companyId}`);
    };

    const handleViewServiceQuotations = (companyId) => {
        navigate(`../serviceQuotationsReport/${companyId}`);
    };

    const handleViewServiceReports = (companyId) => {
        navigate(`../rantalInvoicesReport/${companyId}/`);
    };

    const handleViewRentalInvoices = (companyId) => {
        navigate(`../rantalInvoicesReport/${companyId}`);
    };

    const handleViewRentalQuotations = (companyId) => {
        navigate(`../rentalQuotationsReport/${companyId}`);
    };

    const handleViewRentalReports = (companyId) => {
        toast.info(`Viewing rental reports for company ID: ${companyId}`);
        navigate(`/admin/reports/company/${companyId}/rental-reports`);
    };

    // Functions for Reminder Modal
    const handleOpenReminderModal = async (companyId, type) => { // Made async and accepts 'type'
        setCurrentCompanyIdForReminder(companyId);
        setRemainderType(type); // Pre-select the type
        setReminderMail(''); // Reset form fields
        setCcMail('');
        setSelectedReminderDates([]);
        setFetchingReminderData(true); // Start loading

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/remainders/company/${companyId}/${type}`,
                { headers: { Authorization: auth?.token } }
            );

            if (response.data.success && response.data.remainders) { // Corrected from .remainders to .remainder
                const fetchedReminder = response.data.remainders; // Corrected from .remainders to .remainder
                setReminderMail(fetchedReminder.remainderMail);
                setCcMail(fetchedReminder.ccMails.join(', ')); // Convert array back to comma-separated string
                setSelectedReminderDates(fetchedReminder.remainderDates.map(String)); // Convert numbers back to strings
            }
        } catch (error) {
            // If 404, it means no existing reminder, which is fine.
            // For other errors, log or show toast.
            if (error.response && error.response.status !== 404) {
                console.error("Error fetching existing reminder:", error);
                toast.error("Failed to load existing reminder data.");
            }
        } finally {
            setFetchingReminderData(false); // End loading
            setOpenReminderModal(true);
        }
    };

    const handleCloseReminderModal = () => {
        setOpenReminderModal(false);
        setCurrentCompanyIdForReminder(null);
        setReminderMail('');
        setCcMail('');
        setSelectedReminderDates([]);
        setRemainderType('');
        setFetchingReminderData(false); // Reset loading state
    };

    const handleSaveReminder = async () => {
        if (!reminderMail) {
            toast.error('Reminder Mail is required.');
            return;
        }
        if (selectedReminderDates.length === 0) {
            toast.error('At least one Reminder Date is required.');
            return;
        }
        if (!remainderType) {
            toast.error('Reminder Type is required.');
            return;
        }

        const ccMailsArray = ccMail
            .split(',')
            .map(email => email.trim())
            .filter(email => email !== '');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/remainders`,
                {
                    companyId: currentCompanyIdForReminder,
                    remainderType: remainderType,
                    remainderMail: reminderMail,
                    ccMails: ccMailsArray,
                    remainderDates: selectedReminderDates.map(Number)
                },
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (response.data.success) {
                toast.success(response.data.message); // Use the specific message from the backend
                handleCloseReminderModal();
            } else {
                toast.error(response.data.message || 'Failed to save reminder.');
            }
        } catch (error) {
            console.error("Error saving reminder:", error);
            toast.error(error.response?.data?.message || 'Error saving reminder.');
        }
    };

    // Modified handleSetReminder to open the modal with specific type
    const handleSetReminder = (companyId, type) => {
        handleOpenReminderModal(companyId, type);
    };

    // Filter companies based on search term
    const filteredCompanies = companies.filter(company => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const companyName = company.companyName?.toLowerCase() || '';
        const mobileNumber = company.mobileNumber?.toLowerCase() || '';

        return (
            companyName.includes(lowerCaseSearchTerm) ||
            mobileNumber.includes(lowerCaseSearchTerm)
        );
    });

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
            {/* Search Input */}
            <TextField
                fullWidth
                label="Search by Company Name or Mobile Number"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
            />
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
                                {/* <TableCell align="center">Action</TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCompanies.length === 0 ? ( // Use filteredCompanies here
                                <TableRow>
                                    <TableCell colSpan={11} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No company data found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCompanies.map((company) => ( // Use filteredCompanies here
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
                                                sx={{ minWidth: 'unset', padding: '4px 8px' }}
                                            >
                                                {company.serviceInvoiceCount}
                                            </Button>
                                            <Tooltip title="Set Reminder">
                                                <IconButton onClick={() => handleSetReminder(company._id, 'ServiceInvoice')} color="warning">
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
                                                <IconButton onClick={() => handleSetReminder(company._id, 'RentalInvoice')} color="warning">
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
                    {fetchingReminderData ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
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
                            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                                <InputLabel id="remainder-type-label">Reminder Type</InputLabel>
                                <Select
                                    labelId="remainder-type-label"
                                    id="remainder-type"
                                    value={remainderType}
                                    label="Reminder Type"
                                    onChange={(e) => setRemainderType(e.target.value)}
                                    required
                                    disabled // Disable it as it's pre-selected based on the button clicked
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value="ServiceInvoice">Service Invoice</MenuItem>
                                    <MenuItem value="RentalInvoice">Rental Invoice</MenuItem>
                                    <MenuItem value="SalesInvoice">Sales Invoice</MenuItem>
                                    <MenuItem value="Report">Report</MenuItem>
                                    <MenuItem value="Quotation">Quotation</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                margin="dense"
                                id="cc-mail"
                                label="CC Mail (comma-separated)"
                                type="text"
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
                                        required={selectedReminderDates.length === 0}
                                    />
                                )}
                                sx={{ mb: 2 }}
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseReminderModal} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleSaveReminder} color="primary" variant="contained" disabled={fetchingReminderData}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CompanyReports;