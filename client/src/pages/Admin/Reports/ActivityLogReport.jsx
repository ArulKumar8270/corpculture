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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TablePagination,
    Chip,
    Autocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import dayjs from 'dayjs';

const ActivityLogReport = () => {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '', 'PAID', 'UNPAID'
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (auth?.token) {
            fetchActivityLogs(
                fromDate,
                toDate,
                employeeFilter,
                statusFilter,
                page,
                rowsPerPage
            );
        }
    }, [auth?.token, page, rowsPerPage]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (data?.success) {
                setEmployees(data.employees || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const fetchActivityLogs = async (
        from = '',
        to = '',
        employeeId = '',
        status = '',
        currentPage = page,
        currentRowsPerPage = rowsPerPage
    ) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage + 1,
                limit: currentRowsPerPage,
            });

            if (from) queryParams.append('fromDate', from);
            if (to) queryParams.append('toDate', to);
            if (employeeId) queryParams.append('employeeId', employeeId);
            if (status) queryParams.append('status', status);

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/admin/all?${queryParams.toString()}`,
                {
                    headers: { Authorization: auth?.token },
                }
            );

            if (response.data.success) {
                setActivityLogs(response.data.activityLogs || []);
                setTotalCount(response.data.totalCount || 0);
            } else {
                toast.error(
                    response.data.message || 'Failed to fetch activity logs.'
                );
                setError(response.data.message || 'Failed to fetch activity logs.');
            }
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError(
                err.response?.data?.message ||
                    'Error fetching activity logs.'
            );
            toast.error('Error fetching activity logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        setPage(0);
        fetchActivityLogs(fromDate, toDate, employeeFilter, statusFilter, 0, rowsPerPage);
    };

    const handleClearFilters = () => {
        setFromDate('');
        setToDate('');
        setEmployeeFilter('');
        setStatusFilter('');
        setPage(0);
        fetchActivityLogs('', '', '', '', 0, rowsPerPage);
    };

    const handleStatusUpdate = async (logId, newStatus) => {
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/admin/status/${logId}`,
                { status: newStatus },
                { headers: { Authorization: auth?.token } }
            );

            if (data?.success) {
                toast.success('Status updated');
                setActivityLogs((prev) =>
                    prev.map((l) => (l._id === logId ? data.activityLog : l))
                );
            } else {
                toast.error(data?.message || 'Failed to update status');
            }
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        // If time is in HH:MM format, return as is
        if (timeString.match(/^\d{2}:\d{2}$/)) {
            return timeString;
        }
        return timeString;
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', overflowX: 'auto', width: '91%' }}>
            <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{ mb: 4, color: '#019ee3', fontWeight: 'bold' }}
            >
                Employee Activity Log Report
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        alignItems: 'flex-end',
                    }}
                >
                    <TextField
                        label="From Date"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    <TextField
                        label="To Date"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ minWidth: 200 }}
                    />
                    <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => option.name || ''}
                        isOptionEqualToValue={(option, value) =>
                            option._id === value._id
                        }
                        value={
                            employees.find((e) => e._id === employeeFilter) ||
                            null
                        }
                        onChange={(event, newValue) => {
                            setEmployeeFilter(newValue ? newValue._id : '');
                        }}
                        loading={loadingEmployees}
                        sx={{ minWidth: 250 }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Employee"
                                variant="outlined"
                            />
                        )}
                    />
                    <FormControl sx={{ minWidth: 180 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">
                                <em>All</em>
                            </MenuItem>
                            <MenuItem value="UNPAID">Unpaid</MenuItem>
                            <MenuItem value="PAID">Paid</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFilter}
                        sx={{ minWidth: 100 }}
                    >
                        Filter
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleClearFilters}
                        sx={{ minWidth: 100 }}
                    >
                        Clear
                    </Button>
                </Box>
            </Paper>

            {/* Table */}
            <Paper sx={{ p: 3 }}>
                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 400,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error" sx={{ p: 3, textAlign: 'center' }}>
                        {error}
                    </Typography>
                ) : activityLogs.length === 0 ? (
                    <Typography sx={{ p: 3, textAlign: 'center' }}>
                        No activity logs found.
                    </Typography>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            S.No
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Date
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Employee
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            From Company
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            To Company
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            KM
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            In Time
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Out Time
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Call Type
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Status
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                            Remarks
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activityLogs.map((log, index) => (
                                        <TableRow key={log._id} hover>
                                            <TableCell>
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                {log.date
                                                    ? dayjs(log.date).format(
                                                          'DD/MM/YYYY'
                                                      )
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {log.employeeId?.name ||
                                                    log.userId?.name ||
                                                    'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {log.fromCompany?.companyName ||
                                                    log.fromCompanyName ||
                                                    'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {log.toCompany?.companyName ||
                                                    log.toCompanyName ||
                                                    'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {log.km || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(log.inTime)}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(log.outTime)}
                                            </TableCell>
                                            <TableCell>
                                                {log.callType ? (
                                                    <Chip
                                                        label={log.callType}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <FormControl
                                                    size="small"
                                                    sx={{ minWidth: 140 }}
                                                >
                                                    <Select
                                                        value={log.status || 'UNPAID'}
                                                        onChange={(e) =>
                                                            handleStatusUpdate(
                                                                log._id,
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <MenuItem value="UNPAID">
                                                            Unpaid
                                                        </MenuItem>
                                                        <MenuItem value="PAID">
                                                            Paid
                                                        </MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                {log.remarks || 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[10, 25, 50, 100]}
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default ActivityLogReport;

