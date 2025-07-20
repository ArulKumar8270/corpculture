import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast'; // Assuming you have react-hot-toast for notifications
import axios from 'axios';

const VendorList = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        // In a real application, you would fetch data from an API here.
        // For now, we'll use sample data.
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            // Simulate API call
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
            setVendors([]); // Fallback to sample data on error
        }
    };

    const handleAddVendor = () => {
        navigate('../addVendor');
    };

    const handleEdit = (vendorId) => {
        // Implement navigation to an edit page for the vendor
        navigate(`../addVendor?vendor_id=${vendorId}`);
        toast.info(`Editing vendor with ID: ${vendorId}`);
    };

    const handleDelete = async (vendorId) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                // Simulate API call for deletion
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors/${vendorId}`);
                if (data?.success) {
                    toast.success(data.message || 'Vendor deleted successfully!');
                    fetchVendors(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete vendor.');
                }
                toast.success(`Vendor with ID: ${vendorId} deleted successfully (simulated)!`);
                setVendors(vendors.filter(vendor => vendor._id !== vendorId)); // Remove from local state
            } catch (error) {
                console.error('Error deleting vendor:', error);
                toast.error('Something went wrong while deleting the vendor (simulated).');
            }
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    Vendor List
                </Typography>
                <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddVendor}
                >
                    Add New Vendor
                </Button>
            </div>

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
                                <TableCell className="font-semibold">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {vendors.length > 0 ? (
                                vendors.map((vendor, index) => (
                                    <TableRow key={vendor._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{vendor.companyName}</TableCell>
                                        <TableCell>{vendor.city}</TableCell>
                                        <TableCell>{vendor.state}</TableCell>
                                        <TableCell>{vendor.mobileNumber}</TableCell>
                                        <TableCell>{vendor.mailId}</TableCell>
                                        <TableCell>{vendor.personName}</TableCell>
                                        <TableCell>
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
                                        </TableCell>
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