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
    IconButton,
    Tooltip,
    Button,
    Collapse, // Import Collapse for smooth animation
    Chip,
    TextField, // Import TextField for search input
    TablePagination,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'; // Import down arrow icon
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';   // Import up arrow icon
import SendIcon from '@mui/icons-material/Send'; // Import SendIcon
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/auth';

const ServiceReportsandGatpass = (props) => {
    const navigate = useNavigate();
    const { auth, userPermissions } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [onSendn8n, setOnSendn8n] = useState(false)
    const [expandedReportId, setExpandedReportId] = useState(null); // State to manage expanded row
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [companyNameFilter, setCompanyNameFilter] = useState('');
    const [assignedToFilter, setAssignedToFilter] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [users, setUsers] = useState([]); // State for users list
    const [openReassignModal, setOpenReassignModal] = useState(false); // State for reassign modal
    const [selectedReportId, setSelectedReportId] = useState(null); // State for selected report ID
    const [selectedUserId, setSelectedUserId] = useState(''); // State for selected user in reassign modal
    const [reassigning, setReassigning] = useState(false); // State for reassign loading

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchReports = async (
        from = '',
        to = '',
        companyName = '',
        assignedTo = '',
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
                reportType: props?.reportType || '',
                page: currentPage + 1, // Backend expects 1-indexed page
                limit: currentRowsPerPage,
            }).toString();

            const endpoint = auth?.user?.role === 3 
                ? `${import.meta.env.VITE_SERVER_URL}/api/v1/report/getByassigned/${auth?.user?._id}/${props?.reportType}?${queryParams}`
                : `${import.meta.env.VITE_SERVER_URL}/api/v1/report/${props?.reportType}?${queryParams}`;

            const response = await axios.get(endpoint, {
                headers: { Authorization: auth?.token }
            });
            if (response.data.success) {
                setReports(response.data.reports);
                setTotalCount(response.data.totalCount || 0);
            } else {
                toast.error(response.data.message || 'Failed to fetch reports.');
                setError(response.data.message || 'Failed to fetch reports.');
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err.response?.data?.message || 'Error fetching reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (auth?.token) {
            fetchReports(
                fromDate,
                toDate,
                companyNameFilter,
                assignedToFilter,
                page,
                rowsPerPage
            );
            fetchUsers();
        }
    }, [auth?.token, props?.reportType, page, rowsPerPage]);

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

    const handleEdit = (reportId) => {
        // Navigate to an edit page for the report
        // You'll need to create an EditServiceReport component and a corresponding route
        navigate(`../addServiceReport/${reportId}`);
    };

    const handleDelete = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                const response = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/report/${reportId}`, {
                    headers: { Authorization: auth?.token }
                });
                if (response.data.success) {
                    toast.success(response.data.message);
                    fetchReports(
                        fromDate,
                        toDate,
                        companyNameFilter,
                        assignedToFilter,
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

    const handleToggleExpand = (reportId) => {
        setExpandedReportId(prevId => (prevId === reportId ? null : reportId));
    };

    const handleSendQuotation = async (reportId, companyId) => {
        setOnSendn8n(true)
        try {
            const res = await axios.post('https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734', { reportId: reportId });
            if (res) {
                setOnSendn8n(false)
            }
        } catch (webhookError) {
            setOnSendn8n(false)
            console.error('Error triggering webhook:', webhookError);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

    const handleFilter = () => {
        setPage(0); // Reset to first page when applying new filters
        fetchReports(
            fromDate,
            toDate,
            companyNameFilter,
            assignedToFilter,
            0,
            rowsPerPage
        );
    };

    const handleClearFilters = () => {
        setFromDate('');
        setToDate('');
        setCompanyNameFilter('');
        setAssignedToFilter('');
        setPage(0);
        fetchReports('', '', '', '', 0, rowsPerPage);
    };

    const handleOpenReassignModal = (reportId, currentAssignedToId) => {
        setSelectedReportId(reportId);
        setSelectedUserId(currentAssignedToId || '');
        setOpenReassignModal(true);
    };

    const handleCloseReassignModal = () => {
        setOpenReassignModal(false);
        setSelectedReportId(null);
        setSelectedUserId('');
    };

    const handleReassign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user to assign.');
            return;
        }
        if (!selectedReportId) {
            toast.error('Report ID is missing.');
            return;
        }
        try {
            setReassigning(true);
            const res = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/report/${selectedReportId}`,
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
                toast.success('Report reassigned successfully!');
                handleCloseReassignModal();
                // Refresh the reports list
                fetchReports(
                    fromDate,
                    toDate,
                    companyNameFilter,
                    assignedToFilter,
                    page,
                    rowsPerPage
                );
            } else {
                toast.error(res.data?.message || 'Failed to reassign report.');
            }
        } catch (error) {
            console.error('Error reassigning report:', error);
            toast.error('Error reassigning report.');
        } finally {
            setReassigning(false);
        }
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
                    onClick={() => fetchReports(fromDate, toDate, companyNameFilter, assignedToFilter, page, rowsPerPage)} 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', overflow: 'auto', width: '91%' }}>
            <div className='flex justify-between'>
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    Reports & Gatpass
                </Typography>
                {/* <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                    <Button onClick={() => navigate("../addServiceReport")} color="primary">
                        Create New Report or Gatpass
                    </Button>
                </Typography> */}
            </div>
            {/* Filter Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: '8px' }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#019ee3' }}>
                    Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            variant="outlined"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="To Date"
                            type="date"
                            variant="outlined"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            variant="outlined"
                            value={companyNameFilter}
                            onChange={(e) => setCompanyNameFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Assigned To"
                            variant="outlined"
                            value={assignedToFilter}
                            onChange={(e) => setAssignedToFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleFilter}
                            sx={{ mr: 1 }}
                        >
                            Apply Filters
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={handleClearFilters}
                        >
                            Clear
                        </Button>
                    </Grid>
                </Grid>
            </Paper>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px', overflow: 'auto', width: '100%' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="Service_Reports table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                                <TableCell>S.No</TableCell>
                                <TableCell>Report Type</TableCell>
                                <TableCell>Company</TableCell>
                                <TableCell>Problem Report</TableCell>
                                <TableCell>Model No</TableCell>
                                <TableCell>Serial No</TableCell>
                                <TableCell>Branch</TableCell>
                                <TableCell>Usage Data</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Submitted At</TableCell>
                                <TableCell>Assigned To</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No Service_Reports found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report, index) => (
                                    <React.Fragment key={report._id}>
                                        <TableRow>
                                            <TableCell>
                                                <IconButton
                                                    aria-label="expand row"
                                                    size="small"
                                                    onClick={() => handleToggleExpand(report._id)}
                                                >
                                                    {expandedReportId === report._id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                </IconButton>
                                                {page * rowsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>{report.reportType}</TableCell>
                                            <TableCell>{report.company?.companyName || 'N/A'}</TableCell> {/* Assuming company is populated */}
                                            <TableCell>{report.problemReport}</TableCell>
                                            <TableCell>{report.modelNo}</TableCell>
                                            <TableCell>{report.serialNo}</TableCell>
                                            <TableCell>{report.branch}</TableCell>
                                            <TableCell>{report.usageData || 'N/A'}</TableCell>
                                            <TableCell>{report.description || 'N/A'}</TableCell>
                                            <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {report?.assignedTo ? (
                                                        <Chip label={report.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                    {hasPermission("report") && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleOpenReassignModal(report._id, report?.assignedTo?._id)}
                                                            sx={{ ml: 0.5 }}
                                                            title="Reassign"
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Send Report">
                                                    <IconButton
                                                        onClick={() => handleSendQuotation(report._id, report.company?._id)}
                                                        color="success" // You can choose a different color
                                                    >
                                                        {onSendn8n ? <CircularProgress size={24} /> : <SendIcon />}
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
                                            </TableCell>
                                        </TableRow>
                                        {/* Expanded row for materials */}
                                        <TableRow>
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0, width: "100%" }} colSpan={12}> {/* Adjusted colspan */}
                                                <Collapse in={expandedReportId === report._id} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 1 }}>
                                                        <Typography variant="h6" gutterBottom component="div">
                                                            Materials
                                                        </Typography>
                                                        {/* Check for materialGroups first, then fallback to materials for old data */}
                                                        {(report.materialGroups && report.materialGroups.length > 0) ? (
                                                            report.materialGroups.map((group, groupIndex) => (
                                                                <Box key={groupIndex} sx={{ mb: 2 }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
                                                                        {group.name}
                                                                    </Typography>
                                                                    {group.products && group.products.length > 0 ? (
                                                                        <Table size="small" aria-label={`materials for ${group.name}`}>
                                                                            <TableHead>
                                                                                <TableRow>
                                                                                    <TableCell>Product Name</TableCell>
                                                                                    <TableCell align="right">Quantity</TableCell>
                                                                                    <TableCell align="right">Rate</TableCell>
                                                                                    <TableCell align="right">Total Amount</TableCell>
                                                                                </TableRow>
                                                                            </TableHead>
                                                                            <TableBody>
                                                                                {group.products.map((material, matIndex) => (
                                                                                    <TableRow key={matIndex}>
                                                                                        <TableCell component="th" scope="row">
                                                                                            {material.productName}
                                                                                        </TableCell>
                                                                                        <TableCell align="right">{material.quantity}</TableCell>
                                                                                        <TableCell align="right">{material.rate}</TableCell>
                                                                                        <TableCell align="right">{material.totalAmount}</TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    ) : (
                                                                        <Typography variant="body2" sx={{ ml: 2, mb: 1, color: 'text.secondary' }}>
                                                                            No products listed for this group.
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            ))
                                                        ) : (report.materials && report.materials.length > 0) ? ( // Fallback for old reports
                                                            <Table size="small" aria-label="materials">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>Product Name</TableCell>
                                                                        <TableCell align="right">Quantity</TableCell>
                                                                        <TableCell align="right">Rate</TableCell>
                                                                        <TableCell align="right">Total Amount</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {report.materials.map((material, matIndex) => (
                                                                        <TableRow key={matIndex}>
                                                                            <TableCell component="th" scope="row">
                                                                                {material.productName}
                                                                            </TableCell>
                                                                            <TableCell align="right">{material.quantity}</TableCell>
                                                                            <TableCell align="right">{material.rate}</TableCell>
                                                                            <TableCell align="right">{material.totalAmount}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        ) : (
                                                            <Typography variant="body2" sx={{ ml: 2, mb: 1, color: 'text.secondary' }}>
                                                                No materials listed for this report.
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Pagination Component */}
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Reassign Modal */}
            <Dialog open={openReassignModal} onClose={handleCloseReassignModal}>
                <DialogTitle>Reassign Report</DialogTitle>
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
};

export default ServiceReportsandGatpass;