import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth';
import {
    Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Box,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button // Added Dialog related imports
} from '@mui/material';
import toast from 'react-hot-toast';

const CompanyList = () => {
    const { auth } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the edit modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [formData, setFormData] = useState({});
    const [isUpdating, setIsUpdating] = useState(false);

    // State for the add new company modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCompanyFormData, setNewCompanyFormData] = useState({
        phone: '',
        companyName: '',
        customerComplaint: '',
        contactPerson: '',
        email: '',
        addressDetail: '',
        locationDetail: '',
    });
    const [isAdding, setIsAdding] = useState(false);


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

    // Functions for edit modal
    const handleOpenModal = (company) => {
        setSelectedCompany(company);
        setFormData({
            customerType: company.customerType || '',
            phone: company.phone || '',
            companyName: company.companyName || '',
            customerComplaint: company.customerComplaint || '',
            contactPerson: company.contactPerson || '',
            email: company.email || '',
            addressDetail: company.addressDetail || '',
            locationDetail: company.locationDetail || '',
            // Add other fields as needed
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCompany(null);
        setFormData({});
        setIsUpdating(false);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateCompany = async () => {
        if (!selectedCompany) return;
        setIsUpdating(true);
        try {
            const updatePayload = {
                _id: selectedCompany._id, // Send the company ID for identification
                ...formData, // Send all updated form data
            };

            const response = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/update/${selectedCompany._id}`, // Assuming this is your update endpoint
                updatePayload,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (response.status === 200 && response.data.success) {
                toast.success(response.data.message || "Company details updated successfully!");
                // Re-fetch companies to show updated data
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setCompanies(data.companies);
                }
                handleCloseModal();
            } else {
                toast.error(response.data.message || "Failed to update company details.");
            }
        } catch (error) {
            console.error("Error updating company details:", error);
            toast.error("Error updating company details.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Functions for add new company modal
    const handleOpenAddModal = () => {
        setNewCompanyFormData({
            customerType: 'New',
            phone: '',
            companyName: '',
            customerComplaint: '',
            contactPerson: '',
            email: '',
            addressDetail: '',
            locationDetail: '',
            userId: auth?.user?._id,
        });
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setNewCompanyFormData({
            customerType: "New",
            phone: '',
            companyName: '',
            customerComplaint: '',
            contactPerson: '',
            email: '',
            addressDetail: '',
            locationDetail: '',
            userId: auth?.user?._id,
        });
        setIsAdding(false);
    };

    const handleNewFormChange = (e) => {
        const { name, value } = e.target;
        setNewCompanyFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCompany = async () => {
        setIsAdding(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/create`, // Assuming this is your create endpoint
                newCompanyFormData,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );

            if (response.status === 201 && response.data.success) { // Assuming 201 for successful creation
                toast.success(response.data.message || "Company added successfully!");
                // Re-fetch companies to show new data
                const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`, {
                    headers: {
                        Authorization: auth.token,
                    },
                });
                if (data?.success) {
                    setCompanies(data.companies);
                }
                handleCloseAddModal();
            } else {
                toast.error(response.data.message || "Failed to add company.");
            }
        } catch (error) {
            console.error("Error adding company:", error);
            toast.error("Error adding company.");
        } finally {
            setIsAdding(false);
        }
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
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-[#019ee3]">Company List</h1>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleOpenAddModal}
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
                                    <TableCell sx={{ color: 'white' }}>Contact Person</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Email</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Phone</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Address</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Location</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Customer Type</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Complaint</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Created At</TableCell>
                                    <TableCell sx={{ color: 'white' }}>Action</TableCell> {/* New Action column */}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companies.map((company) => (
                                    <TableRow key={company._id} className="hover:bg-gray-50">
                                        <TableCell>{company.companyName}</TableCell>
                                        <TableCell>{company.contactPerson}</TableCell>
                                        <TableCell>{company.email}</TableCell>
                                        <TableCell>{company.phone}</TableCell>
                                        <TableCell>{company.addressDetail}</TableCell>
                                        <TableCell>{company.locationDetail}</TableCell>
                                        <TableCell>{company.customerType}</TableCell>
                                        <TableCell>{company.customerComplaint}</TableCell>
                                        <TableCell>{new Date(company.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleOpenModal(company)}
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

            {/* Company Details Edit Modal */}
            <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
                <DialogTitle className="bg-[#019ee3] text-white">Edit Company Details</DialogTitle>
                <DialogContent dividers>
                    {selectedCompany && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                            <TextField
                                label="Company Name"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            />
                            <TextField
                                label="Contact Person"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            />
                            <TextField
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                type="email"
                            />
                            <TextField
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            />
                            <TextField
                                label="Address Detail"
                                name="addressDetail"
                                value={formData.addressDetail}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            />
                            <TextField
                                label="Location Detail"
                                name="locationDetail"
                                value={formData.locationDetail}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            />
                            {/* <TextField
                                label="Customer Type"
                                name="customerType"
                                value={formData.customerType}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                            /> */}
                            <TextField
                                label="Customer Complaint"
                                name="customerComplaint"
                                value={formData.customerComplaint}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                multiline
                                rows={2}
                            />
                            {/* Display Created At (read-only) */}
                            <TextField
                                label="Created At"
                                value={selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString() : "-"}
                                fullWidth
                                margin="normal"
                                variant="outlined"
                                InputProps={{ readOnly: true }}
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="secondary" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateCompany}
                        color="primary"
                        variant="contained"
                        disabled={isUpdating}
                        startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add New Company Modal */}
            <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} fullWidth maxWidth="sm">
                <DialogTitle className="bg-[#019ee3] text-white">Add New Company</DialogTitle>
                <DialogContent dividers>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <TextField
                            label="Company Name"
                            name="companyName"
                            value={newCompanyFormData.companyName}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        <TextField
                            label="Contact Person"
                            name="contactPerson"
                            value={newCompanyFormData.contactPerson}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={newCompanyFormData.email}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            type="email"
                            required
                        />
                        <TextField
                            label="Phone"
                            name="phone"
                            value={newCompanyFormData.phone}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            required
                        />
                        <TextField
                            label="Address Detail"
                            name="addressDetail"
                            value={newCompanyFormData.addressDetail}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                        <TextField
                            label="Location Detail"
                            name="locationDetail"
                            value={newCompanyFormData.locationDetail}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                        <TextField
                            label="Customer Type"
                            name="customerType"
                            value={newCompanyFormData.customerType}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                        />
                        <TextField
                            label="Customer Complaint"
                            name="customerComplaint"
                            value={newCompanyFormData.customerComplaint}
                            onChange={handleNewFormChange}
                            fullWidth
                            margin="normal"
                            variant="outlined"
                            multiline
                            rows={2}
                        />
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAddModal} color="secondary" variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddCompany}
                        color="primary"
                        variant="contained"
                        disabled={isAdding}
                        startIcon={isAdding ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isAdding ? 'Adding...' : 'Add Company'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default CompanyList;