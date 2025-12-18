import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Box, Button, TextField, TablePagination // Added TablePagination
} from '@mui/material';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
    const { auth, userPermissions } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Input value for search
    const [appliedSearch, setAppliedSearch] = useState(''); // Applied search filter
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);


    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams({
                    page: page + 1, // Backend expects 1-indexed page
                    limit: rowsPerPage,
                    search: appliedSearch || ''
                }).toString();

                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?${queryParams}`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setCompanies(data.companies);
                    setTotalCount(data.totalCount || 0);
                } else {
                    setError(data?.message || 'Failed to fetch companies.');
                    toast.error(data?.message || 'Failed to fetch companies.');
                }
            } catch (err) {
                console.error('Error fetching companies:', err);
                setError('Something went wrong while fetching companies.');
                toast.error('Something went wrong while fetching companies.');
            } finally {
                setLoading(false);
            }
        };

        if (auth?.token) {
            fetchCompanies();
        }
    }, [auth?.token, page, rowsPerPage, appliedSearch]);


    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        // Don't trigger search automatically - wait for Apply Filter button
    };

    const handleApplyFilter = () => {
        setAppliedSearch(searchQuery);
        setPage(0); // Reset to first page when applying filters
    };

    const handleClearFilter = () => {
        setSearchQuery('');
        setAppliedSearch('');
        setPage(0); // Reset to first page when clearing filters
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen w-[98%]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#019ee3]">Company List</h1>
               {/* {hasPermission("reportsCompanyList") ? */}
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("../addCompany")}
                    className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-4 py-2 rounded"
                >
                    Add New Company
                </Button> 
                {/* : null} */}
            </div>
            {/* Filter Section */}
            <Paper className="p-4 mb-4 shadow-md rounded-xl bg-white">
                <Typography variant="h6" className="mb-3 text-[#019ee3] font-semibold">
                    Filters
                </Typography>
                <div className="flex gap-4 items-end">
                    <TextField
                        label="Search Companies"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="flex-1"
                        placeholder="Search by company name, pincode, GST, address, city, state, or contact"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleApplyFilter();
                            }
                        }}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleApplyFilter}
                        className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-6 py-2 rounded"
                    >
                        Apply Filter
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleClearFilter}
                        className="px-6 py-2 rounded"
                    >
                        Clear
                    </Button>
                </div>
            </Paper>
            <Paper className="p-4 shadow-md rounded-xl">
                {companies.length === 0 && !loading ? (
                    <Typography variant="body1" className="text-center text-gray-500 py-4">
                        No companies found.
                    </Typography>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] text-white">
                                        <TableCell sx={{ color: 'white' }}>Company Name</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Billing Address</TableCell>
                                        <TableCell sx={{ color: 'white' }}>City</TableCell>
                                        <TableCell sx={{ color: 'white' }}>State</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Pincode</TableCell>
                                        <TableCell sx={{ color: 'white' }}>GST No</TableCell>
                                        {/* <TableCell sx={{ color: 'white' }}>Invoice Type</TableCell> */}
                                        <TableCell sx={{ color: 'white' }}>Contact Person</TableCell>
                                        <TableCell sx={{ color: 'white' }}>Company Mobile</TableCell>
                                        {/* <TableCell sx={{ color: 'white' }}>Customer Type</TableCell> */}
                                        {/* <TableCell sx={{ color: 'white' }}>Created At</TableCell> */}
                                        {hasPermission("reportsCompanyList") ? <TableCell sx={{ color: 'white' }}>Action</TableCell> : null}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {companies.map((company) => (
                                    <TableRow key={company._id} className="hover:bg-gray-50">
                                        <TableCell>{company.companyName}</TableCell>
                                        <TableCell>{company.billingAddress}</TableCell>
                                        <TableCell>{company.city}</TableCell>
                                        <TableCell>{company.state}</TableCell>
                                        <TableCell>{company.pincode}</TableCell>
                                        <TableCell>{company.gstNo || 'N/A'}</TableCell>
                                        {/* <TableCell>{company.invoiceType}</TableCell> */}
                                        <TableCell>{company.contactPersons?.[0]?.name || company.contactPerson || 'N/A'}</TableCell>
                                        <TableCell>{company.phone || company.contactPersons?.[0]?.mobile || 'N/A'}</TableCell> {/* Updated to prioritize company.phone */}
                                        {/* <TableCell>{company.customerType || 'N/A'}</TableCell> */}
                                        {/* <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell> */}
                                        {/* {hasPermission("reportsCompanyList") ?  */}
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => navigate(`../addCompany/${company._id}`)}
                                                className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-3 py-1 rounded"
                                            >
                                                Edit
                                            </Button>
                                        </TableCell> 
                                        {/* : null} */}
                                    </TableRow>
                                    ))}
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
                    </>
                )}
            </Paper>
        </div>
    );
};

export default CompanyList;