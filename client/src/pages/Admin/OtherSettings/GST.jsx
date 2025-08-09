import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Select, MenuItem, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../context/auth';

const GST = () => {
    const { auth, userPermissions } = useAuth();
    const [gstType, setGstType] = useState('');
    const [gstPercentage, setGstPercentage] = useState('');
    const [gstList, setGstList] = useState([]);
    const [editingGst, setEditingGst] = useState(null); // Stores the GST object being edited

    const gstTypesOptions = ['SGST', 'CGST', 'IGST'];

    // Fetch GST list on component mount
    useEffect(() => {
        fetchGstList();
    }, []);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchGstList = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst`); // Assuming this is your API endpoint
            if (data?.success) {
                setGstList(data.gst);
            } else {
                toast.error(data?.message || 'Failed to fetch GST list');
            }
        } catch (error) {
            console.error('Error fetching GST list:', error);
            toast.error('Something went wrong while fetching GST list');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!gstType || !gstPercentage) {
            toast.error('Please fill in all fields.');
            return;
        }

        try {
            if (editingGst) {
                // Update existing GST
                const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst/${editingGst._id}`, {
                    gstType,
                    gstPercentage: parseFloat(gstPercentage),
                });
                if (data?.success) {
                    toast.success(data.message);
                    setEditingGst(null); // Clear editing state
                } else {
                    toast.error(data?.message || 'Failed to update GST.');
                }
            } else {
                // Create new GST
                const { data } = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst`, {
                    gstType,
                    gstPercentage: parseFloat(gstPercentage),
                });
                if (data?.success) {
                    toast.success(data.message);
                } else {
                    toast.error(data?.message || 'Failed to add GST.');
                }
            }
            setGstType('');
            setGstPercentage('');
            fetchGstList(); // Refresh the list
        } catch (error) {
            console.error('Error submitting GST:', error);
            toast.error('Something went wrong.');
        }
    };

    const handleEdit = (gst) => {
        setEditingGst(gst);
        setGstType(gst.gstType);
        setGstPercentage(gst.gstPercentage.toString());
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this GST entry?')) {
            try {
                const { data } = await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/v1/gst/${id}`);
                if (data?.success) {
                    toast.success(data.message);
                    fetchGstList(); // Refresh the list
                } else {
                    toast.error(data?.message || 'Failed to delete GST.');
                }
            } catch (error) {
                console.error('Error deleting GST:', error);
                toast.error('Something went wrong while deleting GST.');
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingGst(null);
        setGstType('');
        setGstPercentage('');
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-6">GST Management</h1>

            {/* GST Create/Edit Form */}
            {hasPermission("otherSettingsGst") ? <Paper className="p-6 mb-8 shadow-md">
                <h2 className="text-xl font-medium mb-4">{editingGst ? 'Edit GST Entry' : 'Add New GST Entry'}</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="gst-type" className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
                        <Select
                            id="gst-type"
                            value={gstType}
                            onChange={(e) => setGstType(e.target.value)}
                            displayEmpty
                            fullWidth
                            variant="outlined"
                            size="small"
                        >
                            <MenuItem value="" disabled>Select a GST Type</MenuItem>
                            {gstTypesOptions.map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="gst-percentage" className="block text-sm font-medium text-gray-700 mb-1">GST %</label>
                        <TextField
                            id="gst-percentage"
                            type="number"
                            placeholder="Enter GST %"
                            value={gstPercentage}
                            onChange={(e) => setGstPercentage(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            inputProps={{ step: "0.1" }} // Allows decimal input
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            className="bg-blue-500 hover:bg-blue-600"
                        >
                            {editingGst ? 'Update GST' : 'Add GST'}
                        </Button>
                        {editingGst && (
                            <Button
                                type="button"
                                variant="outlined"
                                color="secondary"
                                onClick={handleCancelEdit}
                                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </Paper> : null}

            {/* GST List Table */}
            <Paper className="p-6 shadow-md">
                <h2 className="text-xl font-medium mb-4">Existing GST Entries</h2>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-100">
                                <TableCell className="font-semibold">S.No</TableCell>
                                <TableCell className="font-semibold">GST Type</TableCell>
                                <TableCell className="font-semibold">GST Percentage</TableCell>
                                {hasPermission("otherSettingsGst") ? <TableCell className="font-semibold">Action</TableCell> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {gstList.length > 0 ? (
                                gstList.map((gst, index) => (
                                    <TableRow key={gst._id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{gst.gstType}</TableCell>
                                        <TableCell>{gst.gstPercentage}</TableCell>
                                        {hasPermission("otherSettingsGst") ? <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<EditIcon />}
                                                onClick={() => handleEdit(gst)}
                                                className="mr-2 bg-blue-500 hover:bg-blue-600"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDelete(gst._id)}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Delete
                                            </Button>
                                        </TableCell> : null}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                                        No GST entries found.
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

export default GST;