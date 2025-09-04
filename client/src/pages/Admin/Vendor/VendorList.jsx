import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material'; // Import TextField
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';

const VendorList = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const { auth, userPermissions } = useAuth();

    useEffect(() => {
        fetchVendors();
    }, []);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchVendors = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`);
            if (data?.success && data.vendors.length > 0) {
                setVendors(data.vendors);
            } else {
                toast.error(data?.message || 'Failed to fetch vendors. Displaying sample data.');
                setVendors([]);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            toast.error('Something went wrong while fetching vendors. Displaying sample data.');
            setVendors([]);
        }
    };

    const handleAddVendor = () => {
        navigate('../addVendor');
    };

    const handleEdit = (vendorId) => {
        navigate(`../addVendor?vendor_id=${vendorId}`);
        toast.info(`Editing vendor with ID: ${vendorId}`);
    };

    const handleDelete = async (vendorId) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors/${vendorId}`);
                if (data?.success) {
                    toast.success(data.message || 'Vendor deleted successfully!');
                    fetchVendors(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete vendor.');
                }
                // The line below is redundant if fetchVendors() is called, as it will refresh the state from the server.
                // toast.success(`Vendor with ID: ${vendorId} deleted successfully (simulated)!`);
                // setVendors(vendors.filter(vendor => vendor._id !== vendorId));
            } catch (error) {
                console.error('Error deleting vendor:', error);
                toast.error('Something went wrong while deleting the vendor.');
            }
        }
    };

    // Filter vendors based on search term
    const filteredVendors = vendors.filter(vendor => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const companyName = vendor.companyName?.toLowerCase() || '';
        const mobileNumber = vendor.mobileNumber?.toLowerCase() || '';
        const personName = vendor.personName?.toLowerCase() || '';
        const mailId = vendor.mailId?.toLowerCase() || '';

        return (
            companyName.includes(lowerCaseSearchTerm) ||
            mobileNumber.includes(lowerCaseSearchTerm) ||
            personName.includes(lowerCaseSearchTerm) ||
            mailId.includes(lowerCaseSearchTerm)
        );
    });

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    Vendor List
                </Typography>
                {hasPermission("vendorList") ? <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddVendor}
                >
                    Add New Vendor
                </Button> : null}
            </div>

            {/* Search Input */}
            <TextField
                fullWidth
                label="Search by Company, Mobile, Person Name, or Mail ID"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
            />

            <Paper className="p-6 shadow-md">
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold">S.No</TableCell>
                                <TableCell className="font-semibold">Company Name</TableCell>
                                <TableCell className="font-semibold">City</TableCell>
                                <TableCell className="font-semibold">State</TableCell>
                                <TableCell className="font-semibold">Mobile Number</TableCell>
                                <TableCell className="font-semibold">Mail Id</TableCell>
                                <TableCell className="font-semibold">Person Name</TableCell>
                                {hasPermission("vendorList") ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredVendors.length > 0 ? ( // Use filteredVendors here
                                filteredVendors.map((vendor, index) => ( // Use filteredVendors here
                                    <TableRow key={vendor._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{vendor.companyName}</TableCell>
                                        <TableCell>{vendor.city}</TableCell>
                                        <TableCell>{vendor.state}</TableCell>
                                        <TableCell>{vendor.mobileNumber}</TableCell>
                                        <TableCell>{vendor.mailId}</TableCell>
                                        <TableCell>{vendor.personName}</TableCell>
                                        {hasPermission("vendorList") ? <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleEdit(vendor._id)}
                                                className="mr-2 bg-blue-500 hover:bg-blue-600"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(vendor._id)}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Delete
                                            </Button>
                                        </TableCell> : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-gray-500 py-4">
                                        No vendors found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </div>
    );
};

export default VendorList;