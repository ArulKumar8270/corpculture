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
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import TrashStatusToggle from '../../../components/TrashStatusToggle';
import TrashActions from '../../../components/TrashActions';
import { restoreFromTrash, isTrashView } from '../../../utils/trashApi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ServiceEnquiriesReport = (props) => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('active');

    const fetchServiceEnquiries = async (
        from = '',
        to = '',
        companyName = '',
        serviceType = '',
        status = '',
        currentPage = page,
        currentRowsPerPage = rowsPerPage
    ) => {
        setLoading(true);
        setError(null);
        try {
            // Construct query parameters for GET request
            const queryParams = new URLSearchParams({
                fromDate: from,
                toDate: to,
                companyName: companyName,
                serviceType: serviceType,
                page: currentPage + 1,
                limit: currentRowsPerPage,
            });
            if (!isTrashView(viewMode)) {
                if (status) queryParams.set('status', status);
            } else {
                queryParams.set('trashed', 'true');
            }

            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/${props?.type}/all?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (data.success) {
                setEnquiries(data.services || data?.rental);
                setTotalCount(data.totalCount || 0);
            } else {
                toast.error(data.message || 'Failed to fetch service enquiries.');
                setError(data.message || 'Failed to fetch service enquiries.');
            }
        } catch (err) {
            console.error('Error fetching service enquiries:', err);
            setError(err.response?.data?.message || 'Error fetching service enquiries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchServiceEnquiries(
                fromDate,
                toDate,
                companyNameFilter,
                serviceTypeFilter,
                statusFilter,
                page,
                rowsPerPage
            );
        }
    }, [auth?.token, page, rowsPerPage, viewMode]);

    const enquiriesListPath =
        props?.type === 'rental' ? '../rental-enquiries' : '../service-enquiries';

    const handleView = (enquiryId) => {
        navigate(enquiriesListPath);
    };

    const handleEdit = (enquiryId) => {
        navigate(enquiriesListPath);
    };

    const handleDelete = async (enquiryId) => {
        if (window.confirm('Are you sure you want to move this enquiry to trash?')) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/service/${enquiryId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchServiceEnquiries(
                        fromDate,
                        toDate,
                        companyNameFilter,
                        serviceTypeFilter,
                        statusFilter,
                        page,
                        rowsPerPage
                    );
                } else {
                    toast.error(response.data.message || 'Failed to move to trash enquiry.');
                }
            } catch (err) {
                console.error('Error moving to trash enquiry:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while deleting enquiry.');
            }
        }
    };

    const handleRestore = async (enquiryId) => {
        if (window.confirm('Restore this enquiry from trash?')) {
            try {
                const { data } = await restoreFromTrash(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/service`,
                    enquiryId
                );
                if (data?.success) {
                    toast.success(data.message || 'Enquiry restored successfully');
                    fetchServiceEnquiries(
                        fromDate,
                        toDate,
                        companyNameFilter,
                        serviceTypeFilter,
                        statusFilter,
                        page,
                        rowsPerPage
                    );
                } else {
                    toast.error(data?.message || 'Failed to restore enquiry.');
                }
            } catch (err) {
                console.error('Error restoring enquiry:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while restoring enquiry.');
            }
        }
    };

    const handleFilter = () => {
        setPage(0); // Reset to first page when applying new filters
        fetchServiceEnquiries(
            fromDate,
            toDate,
            companyNameFilter,
            serviceTypeFilter,
            statusFilter,
            0,
            rowsPerPage
        );
    };

    const handleClearFilter = () => {
        setFromDate('');
        setToDate('');
        setCompanyNameFilter('');
        setServiceTypeFilter('');
        setStatusFilter('');
        setPage(0);
        setRowsPerPage(10);
        fetchServiceEnquiries('', '', '', '', '', 0, 10);
    };

    const handleExportExcel = () => {
        if (enquiries.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const dataToExport = enquiries.map(enquiry => ({
            'Enquiry ID': enquiry._id,
            'Company Name': enquiry.companyName || 'N/A',
            'Phone': enquiry.phone || 'N/A',
            'Service Type': enquiry.serviceTitle || 'N/A', // Using serviceTitle for display
            'Complaint': enquiry.complaint || 'N/A',
            'Status': enquiry.status || 'N/A',
            'Contact Person': enquiry.contactPerson || 'N/A',
            'Email': enquiry.email || 'N/A',
            'Location': enquiry.location || 'N/A',
            'Created Date': new Date(enquiry.createdAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Enquiries");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'service_enquiries_report.xlsx');
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
                <Button onClick={() => fetchServiceEnquiries(fromDate, toDate, companyNameFilter, serviceTypeFilter, statusFilter, page, rowsPerPage)} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Enquiries Report
            </Typography>
            <TrashStatusToggle viewMode={viewMode} onChange={setViewMode} />
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
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Service Type</InputLabel>
                            <Select
                                value={serviceTypeFilter}
                                label="Service Type"
                                onChange={(e) => setServiceTypeFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="AC Service">AC Service</MenuItem>
                                {/* Add other service types as needed */}
                            </Select>
                        </FormControl>
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
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
                    <Table sx={{ minWidth: 650 }} aria-label="service enquiries table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Service Type</TableCell>
                                <TableCell>Complaint</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created Date</TableCell>
                                {isTrashView(viewMode) ? <TableCell>Record</TableCell> : null}
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {enquiries.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={isTrashView(viewMode) ? 9 : 8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service enquiries found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                enquiries.map((enquiry, index) => (
                                    <TableRow key={enquiry._id}>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{enquiry.companyName || 'N/A'}</TableCell>
                                        <TableCell>{enquiry.phone || 'N/A'}</TableCell>
                                        <TableCell>{enquiry.serviceTitle || 'N/A'}</TableCell>
                                        <TableCell>{enquiry.complaint || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={enquiry.status}
                                                size="small"
                                                color={
                                                    enquiry.status === 'Completed' ? 'success' :
                                                    enquiry.status === 'Pending' ? 'warning' :
                                                    enquiry.status === 'Cancelled' ? 'error' :
                                                    'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(enquiry.createdAt).toLocaleDateString()}</TableCell>
                                        {isTrashView(viewMode) ? (
                                            <TableCell>
                                                <Chip label="Trash" size="small" color="warning" />
                                            </TableCell>
                                        ) : null}
                                        <TableCell>
                                            <TrashActions
                                                viewMode={viewMode}
                                                onEdit={() => handleEdit(enquiry._id)}
                                                onTrash={() => handleDelete(enquiry._id)}
                                                onRestore={() => handleRestore(enquiry._id)}
                                                size="small"
                                            />
                                        </TableCell>
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

export default ServiceEnquiriesReport;