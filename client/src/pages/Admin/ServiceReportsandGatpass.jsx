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
    Chip
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
    const { auth } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedReportId, setExpandedReportId] = useState(null); // State to manage expanded row

    const fetchReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/report/${auth?.user?.role === 3 ? `${auth?.user?._id}/${props?.reportType}` : `${props?.reportType}`}`, {
                headers: { Authorization: auth?.token }
            });
            if (response.data.success) {
                setReports(response.data.reports);
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
            fetchReports();
        }
    }, [auth?.token, props?.reportType]);

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
                    fetchReports(); // Refresh the list
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
        try {
            const res = await axios.post('https://n8n.nicknameinfo.net/webhook/88ed0a9b-ee21-43e0-9684-f5c5859f9734', {reportId : reportId});
            console.log('Webhook successfully triggered.', res);
        } catch (webhookError) {
            console.error('Error triggering webhook:', webhookError);
            toast.error('Failed to trigger webhook for external notification.');
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
                <Button onClick={fetchReports} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
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
            <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="service reports table">
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
                                    <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No service reports found.
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
                                                {index + 1}
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
                                                {report?.assignedTo ? (
                                                    <Chip label={report.assignedTo?.name} size="small" color="primary" variant="outlined" />
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="Send Report">
                                                    <IconButton
                                                        onClick={() => handleSendQuotation(report._id, report.company?._id)}
                                                        color="success" // You can choose a different color
                                                    >
                                                        <SendIcon />
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
                                            <TableCell style={{ paddingBottom: 0, paddingTop: 0, width: "100%" }} colSpan={9}>
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
            </Paper>
        </Box>
    );
};

export default ServiceReportsandGatpass;