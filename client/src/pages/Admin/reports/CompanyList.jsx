import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Box, Button // Added Dialog related imports
} from '@mui/material';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CompanyList = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setCompanies(data.companies);
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
    }, [auth?.token]);

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
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#019ee3]">Company List</h1>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate("../addCompany")}
                    className="bg-[#019ee3] hover:bg-[#017bb3] text-white px-4 py-2 rounded"
                >
                    Add New Company
                </Button>
            </div>
            <Paper className="p-4 shadow-md rounded-xl">
                {companies.length === 0 ? (
                    <Typography variant="body1" className="text-center text-gray-500 py-4">
                        No companies found.
                    </Typography>
                ) : (
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
                                    <TableCell sx={{ color: 'white' }}>Invoice Type</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Contact Person (Primary)</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Contact Mobile (Primary)</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Customer Type</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Created At</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Action</TableCell>
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
                                        <TableCell>{company.invoiceType}</TableCell>
                                        <TableCell>{company.contactPersons?.[0]?.name || company.contactPerson || 'N/A'}</TableCell>
                                        <TableCell>{company.contactPersons?.[0]?.mobile || company.phone || 'N/A'}</TableCell>
                                        <TableCell>{company.customerType || 'N/A'}</TableCell>
                                        <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
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
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </div>
    );
};

export default CompanyList;