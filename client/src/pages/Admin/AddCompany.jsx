import React, { useState, useEffect } from 'react'; // Added useEffect
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    CircularProgress, // Added for loading state
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams

const AddCompany = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { companyId } = useParams(); // Get company ID from URL params

    const [companyData, setCompanyData] = useState({
        companyName: '',
        billingAddress: '',
        invoiceType: 'Corpculture Invoice', // Default value
        city: '',
        state: '',
        pincode: '',
        gstNo: '',
        customerType: '', // Added new field
        customerComplaint: '', // Added new field
    });

    const [serviceDeliveryAddresses, setServiceDeliveryAddresses] = useState(['']); // Array of strings for addresses
    const [contactPersons, setContactPersons] = useState([
        { name: '', mobile: '', email: '' }
    ]); // Array of objects for contact persons

    const [loading, setLoading] = useState(false); // For form submission loading
    const [initialLoading, setInitialLoading] = useState(true); // For initial data fetch loading

    // Effect to fetch company data if in edit mode
    useEffect(() => {
        const fetchCompanyData = async () => { 
            if (companyId) {
                setInitialLoading(true);
                try {
                    const { data } = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${companyId}`,
                        {
                            headers: {
                                Authorization: auth.token,
                            },
                        }
                    );
                    if (data?.success && data.company) {
                        const company = data.company;
                        setCompanyData({
                            companyName: company.companyName || '',
                            billingAddress: company.billingAddress || '',
                            invoiceType: company.invoiceType || 'Corpculture Invoice',
                            city: company.city || '',
                            state: company.state || '',
                            pincode: company.pincode || '',
                            gstNo: company.gstNo || '',
                            customerType: company.customerType || '',
                            customerComplaint: company.customerComplaint || '',
                        });
                        setServiceDeliveryAddresses(company.serviceDeliveryAddresses?.length > 0 ? company.serviceDeliveryAddresses : ['']);
                        setContactPersons(company.contactPersons?.length > 0 ? company.contactPersons : [{ name: '', mobile: '', email: '' }]);
                    } else {
                        toast.error(data?.message || 'Failed to fetch company details.');
                        navigate('../companyList'); // Redirect if company not found
                    }
                } catch (error) {
                    console.error('Error fetching company details:', error);
                    toast.error(error.response?.data?.message || 'Something went wrong while fetching company details.');
                    navigate('../companyList'); // Redirect on error
                } finally {
                    setInitialLoading(false);
                }
            } else {
                setInitialLoading(false); // No ID, so no initial fetch needed
            }
        };

        if (auth?.token) {
            fetchCompanyData();
        }
    }, [companyId, auth?.token, navigate]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceAddressChange = (index, value) => {
        const newAddresses = [...serviceDeliveryAddresses];
        newAddresses[index] = value;
        setServiceDeliveryAddresses(newAddresses);
    };

    const addServiceAddress = () => {
        setServiceDeliveryAddresses(prev => [...prev, '']);
    };

    const removeServiceAddress = (index) => {
        const newAddresses = serviceDeliveryAddresses.filter((_, i) => i !== index);
        setServiceDeliveryAddresses(newAddresses);
    };

    const handleContactPersonChange = (index, field, value) => {
        const newContactPersons = [...contactPersons];
        newContactPersons[index] = { ...newContactPersons[index], [field]: value };
        setContactPersons(newContactPersons);
    };

    const addContactPerson = () => {
        setContactPersons(prev => [...prev, { name: '', mobile: '', email: '' }]);
    };

    const removeContactPerson = (index) => {
        const newContactPersons = contactPersons.filter((_, i) => i !== index);
        setContactPersons(newContactPersons);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Basic validation
        if (!companyData.companyName || !companyData.billingAddress || !companyData.city || !companyData.state || !companyData.pincode) {
            toast.error('Please fill in all required company details.');
            setLoading(false);
            return;
        }
        // Ensure at least one service address is provided if the array is not empty
        if (serviceDeliveryAddresses.length > 0 && serviceDeliveryAddresses.some(addr => !addr.trim())) {
            toast.error('Please fill in all service/delivery addresses or remove empty ones.');
            setLoading(false);
            return;
        }
        // Ensure at least one contact person is provided if the array is not empty
        if (contactPersons.length > 0 && contactPersons.some(person => !person.name.trim() || !person.mobile.trim() || !person.email.trim())) {
            toast.error('Please fill in all contact person details or remove empty ones.');
            setLoading(false);
            return;
        }

        const payload = {
            ...companyData,
            userId : auth?.user?._id,
            serviceDeliveryAddresses: serviceDeliveryAddresses.filter(addr => addr.trim() !== ''),
            contactPersons: contactPersons.filter(person => person.name.trim() !== '' && person.mobile.trim() !== '' && person.email.trim() !== ''),
        };

        try {
            let response;
            if (companyId) {
                // Update existing company
                response = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/update/${companyId}`,
                    payload,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            } else {
                // Add new company
                response = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/company/create`,
                    payload,
                    {
                        headers: {
                            Authorization: auth.token,
                        },
                    }
                );
            }


            if (response.data?.success) {
                toast.success(response.data.message || `Company ${companyId ? 'updated' : 'added'} successfully!`);
                navigate('../companyList'); // Redirect to company list
            } else {
                toast.error(response.data?.message || `Failed to ${companyId ? 'update' : 'add'} company.`);
            }
        } catch (error) {
            console.error(`Error ${companyId ? 'updating' : 'adding'} company:`, error);
            toast.error(error.response?.data?.message || `Something went wrong while ${companyId ? 'updating' : 'adding'} the company.`);
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                {companyId ? 'Edit Company Details' : 'Add New Company'}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Company Name */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                name="companyName"
                                value={companyData.companyName}
                                onChange={handleChange}
                                size="small"
                                required
                            />
                        </Grid>
                        {/* Billing Address */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Billing Address"
                                name="billingAddress"
                                value={companyData.billingAddress}
                                onChange={handleChange}
                                size="small"
                                multiline
                                rows={2}
                                required
                            />
                        </Grid>

                        {/* Service / Delivery Addresses */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>Service / Delivery Addresses</Typography>
                            {serviceDeliveryAddresses.map((address, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label={`Service / Delivery Address ${index + 1}`}
                                        value={address}
                                        onChange={(e) => handleServiceAddressChange(index, e.target.value)}
                                        size="small"
                                        multiline
                                        rows={2}
                                        sx={{ mr: 1 }}
                                        required
                                    />
                                    {serviceDeliveryAddresses.length > 1 && (
                                        <IconButton color="error" onClick={() => removeServiceAddress(index)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                    {index === serviceDeliveryAddresses.length - 1 && (
                                        <Button
                                            variant="contained"
                                            startIcon={<AddIcon />}
                                            onClick={addServiceAddress}
                                            sx={{ ml: 1, bgcolor: '#019ee3', '&:hover': { bgcolor: '#007bb5' } }}
                                        >
                                            Add More Address
                                        </Button>
                                    )}
                                </Box>
                            ))}
                        </Grid>

                        {/* Invoice Type */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small" required>
                                <InputLabel>Invoice Type</InputLabel>
                                <Select
                                    name="invoiceType"
                                    value={companyData.invoiceType}
                                    label="Invoice Type"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Corpculture Invoice">Corpculture Invoice</MenuItem>
                                    {/* Add other invoice types if needed */}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* City */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="City"
                                name="city"
                                value={companyData.city}
                                onChange={handleChange}
                                size="small"
                                required
                            />
                        </Grid>
                        {/* State */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="State"
                                name="state"
                                value={companyData.state}
                                onChange={handleChange}
                                size="small"
                                required
                            />
                        </Grid>
                        {/* Pincode */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Pincode"
                                name="pincode"
                                value={companyData.pincode}
                                onChange={handleChange}
                                size="small"
                                required
                            />
                        </Grid>
                        {/* GST No */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="GST No"
                                name="gstNo"
                                value={companyData.gstNo}
                                onChange={handleChange}
                                size="small"
                            />
                        </Grid>
                        {/* Customer Type */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Customer Type"
                                name="customerType"
                                value={companyData.customerType}
                                onChange={handleChange}
                                size="small"
                            />
                        </Grid>
                        {/* Customer Complaint */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Customer Complaint"
                                name="customerComplaint"
                                value={companyData.customerComplaint}
                                onChange={handleChange}
                                size="small"
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* Contact Persons */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>Contact Persons</Typography>
                            {contactPersons.map((person, index) => (
                                <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label={`Person Name ${index + 1}`}
                                            value={person.name}
                                            onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Mobile No"
                                            value={person.mobile}
                                            onChange={(e) => handleContactPersonChange(index, 'mobile', e.target.value)}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            label="Email_ID"
                                            value={person.email}
                                            onChange={(e) => handleContactPersonChange(index, 'email', e.target.value)}
                                            size="small"
                                            type="email"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        {contactPersons.length > 1 && (
                                            <IconButton color="error" onClick={() => removeContactPerson(index)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Grid>
                                </Grid>
                            ))}
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={addContactPerson}
                                sx={{ mt: 1 }}
                            >
                                Add Person
                            </Button>
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{ mt: 3, bgcolor: '#019ee3', '&:hover': { bgcolor: '#007bb5' } }}
                                disabled={loading} // Disable button during submission
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {loading ? (companyId ? 'Updating...' : 'Adding...') : (companyId ? 'Update Company' : 'Add Company')}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default AddCompany;