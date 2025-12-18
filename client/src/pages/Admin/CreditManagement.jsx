import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import {
    Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Box, Button, TextField, TablePagination, Dialog, DialogTitle,
    DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Grid,
    Chip
} from '@mui/material';
import toast from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const CreditManagement = () => {
    const { auth } = useAuth();
    const [credits, setCredits] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [companiesLoading, setCompaniesLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    
    // Filter states
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [creditTypeFilter, setCreditTypeFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({
        companyId: '',
        creditType: '',
        fromDate: '',
        toDate: ''
    });

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCredit, setEditingCredit] = useState(null);
    const [formData, setFormData] = useState({
        companyId: '',
        amount: '',
        description: '',
        creditType: 'Given'
    });
    const [formLoading, setFormLoading] = useState(false);

    // Fetch companies for dropdown
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setCompaniesLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?limit=1000`, {
                    headers: { Authorization: auth.token }
                });
                if (data?.success) {
                    setCompanies(data.companies || []);
                }
            } catch (err) {
                console.error('Error fetching companies:', err);
                toast.error('Failed to fetch companies');
            } finally {
                setCompaniesLoading(false);
            }
        };

        if (auth?.token) {
            fetchCompanies();
        }
    }, [auth?.token]);

    // Fetch credits
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams({
                    page: page + 1,
                    limit: rowsPerPage,
                    companyId: appliedFilters.companyId || '',
                    creditType: appliedFilters.creditType || '',
                    fromDate: appliedFilters.fromDate || '',
                    toDate: appliedFilters.toDate || ''
                }).toString();

                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/credit/all?${queryParams}`, {
                    headers: { Authorization: auth.token }
                });

                if (data?.success) {
                    setCredits(data.credits || []);
                    setTotalCount(data.totalCount || 0);
                } else {
                    setError(data?.message || 'Failed to fetch credits.');
                    toast.error(data?.message || 'Failed to fetch credits.');
                }
            } catch (err) {
                console.error('Error fetching credits:', err);
                setError('Something went wrong while fetching credits.');
                toast.error('Something went wrong while fetching credits.');
            } finally {
                setLoading(false);
            }
        };

        if (auth?.token) {
            fetchCredits();
        }
    }, [auth?.token, page, rowsPerPage, appliedFilters]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleApplyFilters = () => {
        setAppliedFilters({
            companyId: selectedCompanyId,
            creditType: creditTypeFilter,
            fromDate: fromDate,
            toDate: toDate
        });
        setPage(0);
    };

    const handleClearFilters = () => {
        setSelectedCompanyId('');
        setCreditTypeFilter('');
        setFromDate('');
        setToDate('');
        setAppliedFilters({
            companyId: '',
            creditType: '',
            fromDate: '',
            toDate: ''
        });
        setPage(0);
    };

    const handleOpenModal = (credit = null) => {
        if (credit) {
            setEditingCredit(credit);
            setFormData({
                companyId: credit.companyId._id || credit.companyId,
                amount: credit.amount.toString(),
                description: credit.description || '',
                creditType: credit.creditType || 'Given'
            });
        } else {
            setEditingCredit(null);
            setFormData({
                companyId: '',
                amount: '',
                description: '',
                creditType: 'Given'
            });
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingCredit(null);
        setFormData({
            companyId: '',
            amount: '',
            description: '',
            creditType: 'Given'
        });
    };

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.companyId || !formData.amount) {
            toast.error('Please select a company and enter an amount');
            return;
        }

        if (isNaN(formData.amount) || parseFloat(formData.amount) < 0) {
            toast.error('Amount must be a positive number');
            return;
        }

        setFormLoading(true);
        try {
            if (editingCredit) {
                // Update credit
                await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/credit/update/${editingCredit._id}`,
                    {
                        amount: parseFloat(formData.amount),
                        description: formData.description,
                        creditType: formData.creditType
                    },
                    { headers: { Authorization: auth.token } }
                );
                toast.success('Credit updated successfully!');
            } else {
                // Create credit
                await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/credit/create`,
                    formData,
                    { headers: { Authorization: auth.token } }
                );
                toast.success('Credit added successfully!');
            }
            handleCloseModal();
            // Refresh credits list
            const queryParams = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
                companyId: appliedFilters.companyId || '',
                creditType: appliedFilters.creditType || '',
                fromDate: appliedFilters.fromDate || '',
                toDate: appliedFilters.toDate || ''
            }).toString();
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/credit/all?${queryParams}`, {
                headers: { Authorization: auth.token }
            });
            if (data?.success) {
                setCredits(data.credits || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (err) {
            console.error('Error saving credit:', err);
            toast.error(err.response?.data?.message || (editingCredit ? 'Failed to update credit' : 'Failed to add credit'));
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (creditId) => {
        if (!window.confirm('Are you sure you want to delete this credit entry?')) {
            return;
        }

        try {
            await axios.delete(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/credit/delete/${creditId}`,
                { headers: { Authorization: auth.token } }
            );
            toast.success('Credit deleted successfully!');
            // Refresh credits list
            const queryParams = new URLSearchParams({
                page: page + 1,
                limit: rowsPerPage,
                companyId: appliedFilters.companyId || '',
                creditType: appliedFilters.creditType || '',
                fromDate: appliedFilters.fromDate || '',
                toDate: appliedFilters.toDate || ''
            }).toString();
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/credit/all?${queryParams}`, {
                headers: { Authorization: auth.token }
            });
            if (data?.success) {
                setCredits(data.credits || []);
                setTotalCount(data.totalCount || 0);
            }
        } catch (err) {
            console.error('Error deleting credit:', err);
            toast.error(err.response?.data?.message || 'Failed to delete credit');
        }
    };

    if (loading && credits.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error && credits.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen w-[98%]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#019ee3]">Credit Management</h1>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()}
                    className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-4 py-2 rounded"
                >
                    Add Credit
                </Button>
            </div>

            {/* Filter Section */}
            <Paper className="p-4 mb-4 shadow-md rounded-xl bg-white">
                <Typography variant="h6" className="mb-3 text-[#019ee3] font-semibold">
                    Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Company</InputLabel>
                            <Select
                                value={selectedCompanyId}
                                onChange={(e) => setSelectedCompanyId(e.target.value)}
                                label="Company"
                                disabled={companiesLoading}
                                endAdornment={companiesLoading ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                                        <CircularProgress size={20} />
                                    </Box>
                                ) : null}
                            >
                                {companiesLoading ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={20} sx={{ mr: 1 }} />
                                        Loading companies...
                                    </MenuItem>
                                ) : (
                                    <>
                                        <MenuItem value="">All Companies</MenuItem>
                                        {companies.map((company) => (
                                            <MenuItem key={company._id} value={company._id}>
                                                {company.companyName}
                                            </MenuItem>
                                        ))}
                                    </>
                                )}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Credit Type</InputLabel>
                            <Select
                                value={creditTypeFilter}
                                onChange={(e) => setCreditTypeFilter(e.target.value)}
                                label="Credit Type"
                            >
                                <MenuItem value="">All Types</MenuItem>
                                <MenuItem value="Given">Given</MenuItem>
                                <MenuItem value="Used">Used</MenuItem>
                                <MenuItem value="Adjusted">Adjusted</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            label="From Date"
                            type="date"
                            size="small"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            label="To Date"
                            type="date"
                            size="small"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <div className="flex gap-2">
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleApplyFilters}
                                className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-4 py-2 rounded"
                            >
                                Apply Filter
                            </Button>
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={handleClearFilters}
                                className="px-4 py-2 rounded"
                            >
                                Clear
                            </Button>
                        </div>
                    </Grid>
                </Grid>
            </Paper>

            {/* Credits Table */}
            <Paper className="p-4 shadow-md rounded-xl">
                {credits.length === 0 && !loading ? (
                    <Typography variant="body1" className="text-center text-gray-500 py-4">
                        No credits found.
                    </Typography>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                        <TableCell sx={{ color: 'white' }}>Date</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Company</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Amount</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Type</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Description</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Created By</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {credits.map((credit) => (
                                        <TableRow key={credit._id} className="hover:bg-gray-50">
                                            <TableCell>
                                                {new Date(credit.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {credit.companyId?.companyName || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                ₹ {credit.amount.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={credit.creditType}
                                                    size="small"
                                                    color={
                                                        credit.creditType === 'Given' ? 'success' :
                                                        credit.creditType === 'Used' ? 'error' :
                                                        'warning'
                                                    }
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>{credit.description || 'N/A'}</TableCell>
                                            <TableCell>
                                                {credit.createdBy?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleOpenModal(credit)}
                                                        color="primary"
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleDelete(credit._id)}
                                                        color="error"
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={totalCount}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </>
                )}
            </Paper>

            {/* Add/Edit Credit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCredit ? 'Edit Credit' : 'Add New Credit'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        <div className="flex flex-col gap-4 mt-2">
                            <FormControl fullWidth required disabled={!!editingCredit || companiesLoading}>
                                <InputLabel>Company</InputLabel>
                                <Select
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleFormChange}
                                    label="Company"
                                    disabled={companiesLoading}
                                    endAdornment={companiesLoading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                                            <CircularProgress size={20} />
                                        </Box>
                                    ) : null}
                                >
                                    {companiesLoading ? (
                                        <MenuItem disabled>
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                            Loading companies...
                                        </MenuItem>
                                    ) : (
                                        companies.map((company) => (
                                            <MenuItem key={company._id} value={company._id}>
                                                {company.companyName}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                            <TextField
                                name="amount"
                                label="Amount (₹)"
                                type="number"
                                value={formData.amount}
                                onChange={handleFormChange}
                                fullWidth
                                required
                                inputProps={{ min: 0, step: 0.01 }}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Credit Type</InputLabel>
                                <Select
                                    name="creditType"
                                    value={formData.creditType}
                                    onChange={handleFormChange}
                                    label="Credit Type"
                                >
                                    <MenuItem value="Given">Given</MenuItem>
                                    <MenuItem value="Used">Used</MenuItem>
                                    <MenuItem value="Adjusted">Adjusted</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleFormChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </div>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal} disabled={formLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={formLoading}
                            className="bg-[#019ee3] hover:bg-[#017bb3]"
                        >
                            {formLoading ? 'Saving...' : (editingCredit ? 'Update' : 'Add')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    );
};

export default CreditManagement;
