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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const collectSerialNumbers = (report) => {
    const serials = new Set();
    if (report?.serialNo?.trim()) serials.add(report.serialNo.trim());
    (report?.materialGroups || []).forEach((group) => {
        (group?.products || []).forEach((product) => {
            if (product?.serialNo?.trim()) serials.add(product.serialNo.trim());
        });
    });
    return Array.from(serials).join(', ') || 'N/A';
};

const ServiceReportsReport = ({ type = 'service' }) => {
    const { auth } = useAuth();
    const [searchParams] = useSearchParams();
    const isRental = type === 'rental';
    const pageTitle = isRental ? 'Rental Reports' : 'Service Reports';
    const exportFileName = isRental ? 'rental_reports_report.xlsx' : 'service_reports_report.xlsx';

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('');
    const [reportTypeFilter, setReportTypeFilter] = useState('');
    const [serialNoFilter, setSerialNoFilter] = useState(searchParams.get('serialNo') || '');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchServiceReports = async (
        from = '',
        to = '',
        companyName = '',
        assignedTo = '',
        reportType = '',
        serialNo = '',
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
                serialNo: serialNo,
                page: currentPage + 1,
                limit: currentRowsPerPage,
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/report/${type}?${queryParams}`,
                {
                    headers: { Authorization: auth?.token }
                }
            );

            if (response.data.success) {
                setReports(response.data.reports);
                setTotalCount(response.data.totalCount || 0);
            } else {
                toast.error(response.data.message || `Failed to fetch ${pageTitle.toLowerCase()}.`);
                setError(response.data.message || `Failed to fetch ${pageTitle.toLowerCase()}.`);
            }
        } catch (err) {
            console.error(`Error fetching ${pageTitle.toLowerCase()}:`, err);
            setError(err.response?.data?.message || `Error fetching ${pageTitle.toLowerCase()}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initialSerial = searchParams.get('serialNo') || '';
        if (initialSerial) setSerialNoFilter(initialSerial);
    }, [searchParams]);

    useEffect(() => {
        if (auth?.token) {
            fetchServiceReports(
                fromDate,
                toDate,
                companyNameFilter,
                assignedToFilter,
                reportTypeFilter,
                serialNoFilter,
                page,
                rowsPerPage
            );
        }
    }, [auth?.token, page, rowsPerPage, type]);

    const handleFilter = () => {
        setPage(0);
        fetchServiceReports(
            fromDate,
            toDate,
            companyNameFilter,
            assignedToFilter,
            reportTypeFilter,
            serialNoFilter,
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
        setSerialNoFilter('');
        setPage(0);
        setRowsPerPage(10);
        fetchServiceReports('', '', '', '', '', '', 0, 10);
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
            'Serial No': collectSerialNumbers(report),
            'Branch': report.branch || 'N/A',
            'Reference': report.reference || 'N/A',
            'Usage Data': report.usageData || 'N/A',
            'Description': report.description || 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, pageTitle);
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(data, exportFileName);
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
                <Button
                    onClick={() =>
                        fetchServiceReports(
                            fromDate,
                            toDate,
                            companyNameFilter,
                            assignedToFilter,
                            reportTypeFilter,
                            serialNoFilter,
                            page,
                            rowsPerPage
                        )
                    }
                    variant="outlined"
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                {pageTitle}
            </Typography>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
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
                        <TextField
                            label="Serial No"
                            value={serialNoFilter}
                            onChange={(e) => setSerialNoFilter(e.target.value)}
                            placeholder="Search material serial no"
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
                    <Table sx={{ minWidth: 650 }} aria-label={`${type} reports table`}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Company Name</TableCell>
                                <TableCell>Report Type</TableCell>
                                <TableCell>Problem Report</TableCell>
                                <TableCell>Serial No</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell>Created Date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length === 0 && !loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No {pageTitle.toLowerCase()} found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report, index) => (
                                    <TableRow key={report._id}>
                                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                        <TableCell>{report.company?.companyName || 'N/A'}</TableCell>
                                        <TableCell>{report.reportType || 'N/A'}</TableCell>
                                        <TableCell>{report.problemReport || 'N/A'}</TableCell>
                                        <TableCell>{collectSerialNumbers(report)}</TableCell>
                                        <TableCell>
                                            {report.assignedTo ? (
                                                <Chip label={report.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
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
