import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import TrashStatusToggle from '../../../components/TrashStatusToggle';
import TrashActions from '../../../components/TrashActions';
import { buildTrashListUrl, restoreFromTrash, isTrashView } from '../../../utils/trashApi';

const VendorList = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('active');
    const { auth, userPermissions } = useAuth();

    useEffect(() => {
        fetchVendors();
    }, [viewMode]);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchVendors = async () => {
        try {
            const url = buildTrashListUrl(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`, viewMode);
            const { data } = await axios.get(url);
            if (data?.success) {
                setVendors(data.vendors || []);
            } else {
                toast.error(data?.message || 'Failed to fetch vendors.');
                setVendors([]);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            toast.error('Something went wrong while fetching vendors.');
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
        if (window.confirm('Are you sure you want to move this vendor to trash?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors/${vendorId}`);
                if (data?.success) {
                    toast.success(data.message || 'Vendor moved to trash successfully!');
                    fetchVendors();
                } else {
                    toast.error(data?.message || 'Failed to move to trash vendor.');
                }
            } catch (error) {
                console.error('Error moving to trash vendor:', error);
                toast.error('Something went wrong while deleting the vendor.');
            }
        }
    };

    const handleRestore = async (vendorId) => {
        if (window.confirm('Restore this vendor from trash?')) {
            try {
                const { data } = await restoreFromTrash(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`, vendorId);
                if (data?.success) {
                    toast.success(data.message || 'Vendor restored successfully!');
                    fetchVendors();
                } else {
                    toast.error(data?.message || 'Failed to restore vendor.');
                }
            } catch (error) {
                console.error('Error restoring vendor:', error);
                toast.error(error.response?.data?.message || 'Something went wrong while restoring the vendor.');
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
                {hasPermission("vendorList") && !isTrashView(viewMode) ? <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleAddVendor}
                >
                    Add New Vendor
                </Button> : null}
            </div>

            <TrashStatusToggle viewMode={viewMode} onChange={setViewMode} />

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
                                {isTrashView(viewMode) ? <TableCell className="font-semibold">Status</TableCell> : null}
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
                                        {isTrashView(viewMode) ? (
                                            <TableCell>
                                                <Chip label="Trash" size="small" color="warning" />
                                            </TableCell>
                                        ) : null}
                                        {hasPermission("vendorList") ? <TableCell>
                                            <TrashActions
                                                viewMode={viewMode}
                                                onEdit={() => handleEdit(vendor._id)}
                                                onTrash={() => handleDelete(vendor._id)}
                                                onRestore={() => handleRestore(vendor._id)}
                                            />
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