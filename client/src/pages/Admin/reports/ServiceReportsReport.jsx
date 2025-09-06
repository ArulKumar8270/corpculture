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
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ServiceReportsReport = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState(''); // New filter for assignedTo
    const [reportTypeFilter, setReportTypeFilter] = useState(''); // New filter for reportType
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchServiceReports = async (
        from = '',
        to = '',
        companyName = '',
        assignedTo = '',
        reportType = '',
        currentPage = page,
        currentRowsPerPage = rowsPerPage
    ) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                fromDate: from,
                toDate: to,
                companyName: companyName,
                assignedTo: assignedTo,
                reportType: reportType,
                page: currentPage + 1, // Backend usually expects 1-indexed page
                limit: currentRowsPerPage,
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/report/service?${queryParams}`,
                {
                    headers: { Authorization: auth?.token }
                }
            );

            if (response.data.success) {
                setReports(response.data.reports);
                setTotalCount(response.data.totalCount || 0);
            } else {
                toast.error(response.data.message || 'Failed to fetch service reports.');
                setError(response.data.message || 'Failed to fetch service reports.');
            }
        } catch (err) {
            console.error('Error fetching service reports:', err);
            setError(err.response?.data?.message || 'Error fetching service reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchServiceReports(
                fromDate,
                toDate,
                companyNameFilter,
                assignedToFilter,
                reportTypeFilter,
                page,
                rowsPerPage
            );
        }
    }, [auth?.token, page, rowsPerPage]);

    const handleView = (reportId) => {
        // Assuming a route for viewing a single service report
        navigate(`/admin/service-report-details/${reportId}`);
    };

    const handleEdit = (reportId) => {
        // Assuming a route for editing a service report
        navigate(`/admin/edit-service-report/${reportId}`);
    };

    const handleDelete = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/report/${reportId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchServiceReports(
                        fromDate,
                        toDate,
                        companyNameFilter,
                        assignedToFilter,
                        reportTypeFilter,
                        page,
                        rowsPerPage
                    );
                } else {
                    toast.error(response.data.message || 'Failed to delete report.');
                }
            } catch (err) {
                console.error('Error deleting report:', err);
                toast.error(err.response?.data?.message || 'Something went wrong while deleting report.');
            }
        }
    };

    const handleFilter = () => {
        setPage(0); // Reset to first page when applying new filters
        fetchServiceReports(
            fromDate,
            toDate,
            companyNameFilter,
            assignedToFilter,
            reportTypeFilter,
            0,
            rowsPerPage
        );
    };

    const handleClearFilter = () => {
        setFromDate('');
        setToDate('');
        setCompanyNameFilter('');
        setAssignedToFilter('');
        setReportTypeFilter('');
        setPage(0);
        setRowsPerPage(10);
        fetchServiceReports('', '', '', '', '', 0, 10);
    };

    const handleExportExcel = () => {
        if (reports.length === 0) {
            toast.error("No data to export.");
            return;
        }

        const dataToExport = reports.map(report => ({
            'Report ID': report._id,
            'Company Name': report.company?.companyName || 'N/A',
            'Report Type': report.reportType || 'N/A',
            'Problem Report': report.problemReport || 'N/A',
            'Assigned To': report.assignedTo?.name || 'N/A',
            'Created Date': new Date(report.createdAt).toLocaleDateString(),
            'Model No': report.modelNo || 'N/A',
            'Serial No': report.serialNo || 'N/A',
            'Branch': report.branch || 'N/A',
            'Reference': report.reference || 'N/A',
            'Usage Data': report.usageData || 'N/A',
            'Description': report.description || 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Reports");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, 'service_reports_report.xlsx');
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
                <Button onClick={() => fetchServiceReports(fromDate, toDate, companyNameFilter, assignedToFilter, reportTypeFilter, page, rowsPerPage)} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Service Reports
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
                            label="Assigned To"
                            value={assignedToFilter}
                            onChange={(e) => setAssignedToFilter(e.target.value)}
                            sx={{ width: 200 }}
                        />
                        <FormControl sx={{ width: 200 }}>
                            <InputLabel>Report Type</InputLabel>
                            <Select
                                value={reportTypeFilter}
                                label="Report Type"
                                onChange={(e) => setReportTypeFilter(e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Service Report">Service Report</MenuItem>
                                {/* Add other report types as needed */}
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
                    <Table sx={{ minWidth: 650 }} aria-label="service reports table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Report Type</TableCell>
                                <TableCell>Problem Report</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell>Created Date</TableCell>
                                {/* <TableCell>Actions</TableCell> */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service reports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report, index) => (
                                    <TableRow key={report._id}>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{report.company?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{report.reportType || 'N/A'}</TableCell>
                                        <TableCell>{report.problemReport || 'N/A'}</TableCell>
                                        <TableCell>
                                            {report.assignedTo ? (
                                                <Chip label={report.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                        {/* <TableCell>
                                            <Tooltip title="View Details">
                                                <IconButton onClick={() => handleView(report._id)} color="info">
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Report">
                                                <IconButton onClick={() => handleEdit(report._id)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete Report">
                                                <IconButton onClick={() => handleDelete(report._id)} color="error">
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

export default ServiceReportsReport;