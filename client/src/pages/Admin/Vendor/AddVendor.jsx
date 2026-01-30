import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    TextField,
    Button,
    Paper,
    Typography,
    InputAdornment,
    Box,
    IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LabelIcon from '@mui/icons-material/Label';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';


const AddVendor = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('vendor_id');
    // Form states
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [pincode, setPincode] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [contactPersons, setContactPersons] = useState([
        { mobileNumber: '', mailId: '', personName: '' },
    ]);

    // Fetch vendor data if ID is present (edit mode)
    useEffect(() => {
        if (id) {
            const fetchVendor = async () => {
                try {
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors/${id}`);
                    if (data?.success) {
                        const vendor = data.vendor;
                        setCompanyName(vendor.companyName || '');
                        setCompanyAddress(vendor.companyAddress || '');
                        setCity(vendor.city || '');
                        setState(vendor.state || '');
                        setPincode(vendor.pincode || '');
                        setGstNumber(vendor.gstNumber || '');
                        const persons = vendor.contactPersons?.length
                            ? vendor.contactPersons
                            : [{ mobileNumber: vendor.mobileNumber || '', mailId: vendor.mailId || '', personName: vendor.personName || '' }];
                        setContactPersons(persons.map((p) => ({ mobileNumber: p.mobileNumber || '', mailId: p.mailId || '', personName: p.personName || '' })));
                    } else {
                        toast.error(data?.message || 'Failed to fetch vendor details.');
                        handleViewVendors() // Redirect if vendor not found
                    }
                } catch (error) {
                    console.error('Error fetching vendor:', error);
                    toast.error('Something went wrong while fetching vendor details.');
                    handleViewVendors() // Redirect on error
                }
            };
            fetchVendor();
        }
    }, [id, navigate]);

    const addContactPerson = () => {
        setContactPersons((prev) => [...prev, { mobileNumber: '', mailId: '', personName: '' }]);
    };

    const removeContactPerson = (index) => {
        if (contactPersons.length <= 1) {
            toast.error('At least one contact person is required.');
            return;
        }
        setContactPersons((prev) => prev.filter((_, i) => i !== index));
    };

    const handleContactPersonChange = (index, field, value) => {
        setContactPersons((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validContacts = contactPersons.filter(
            (p) => p.mobileNumber?.trim() && p.mailId?.trim() && p.personName?.trim()
        );
        if (!companyName || !companyAddress || !city || !state || !pincode) {
            toast.error('Please fill in all required company fields.');
            return;
        }
        if (validContacts.length === 0) {
            toast.error('Please add at least one contact person with Mobile, Mail and Person Name.');
            return;
        }

        const vendorData = {
            companyName,
            companyAddress,
            city,
            state,
            pincode,
            gstNumber,
            contactPersons: validContacts,
        };

        try {
            let response;
            if (id) {
                // Update existing vendor
                response = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors/${id}`, vendorData);
            } else {
                // Create new vendor
                response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/vendors`, vendorData);
            }

            if (response.data?.success) {
                toast.success(response.data.message || `Vendor ${id ? 'updated' : 'registered'} successfully!`);
                // Clear form fields only if creating a new vendor
                if (!id) {
                    setCompanyName('');
                    setCompanyAddress('');
                    setCity('');
                    setState('');
                    setPincode('');
                    setGstNumber('');
                    setContactPersons([{ mobileNumber: '', mailId: '', personName: '' }]);
                }
                handleViewVendors() // Navigate to vendor list after success
            } else {
                toast.error(response.data?.message || `Failed to ${id ? 'update' : 'register'} vendor.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'registering'} vendor:`, error);
            toast.error('Something went wrong. Please try again.');
        }
    };

    const handleViewVendors = () => {
        navigate('../vendorList');
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold text-blue-600">
                    {id ? 'Edit Vendor' : 'Vendor Register'} {/* Dynamic Title */}
                </Typography>
                <Button
                    variant="contained"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                    onClick={handleViewVendors}
                >
                    View Vendors
                </Button>
            </div>

            <Paper className="p-6 shadow-md mb-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextField
                            label="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <CalendarTodayIcon /> {/* Using Calendar icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Company Address"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <HomeIcon /> {/* Using Home icon for address */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <LabelIcon /> {/* Using Label icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="State"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <HomeIcon /> {/* Using Home icon for state */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <ReceiptIcon /> {/* Using Receipt icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="GST Number"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <LockIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>

                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 3, mb: 2 }}>
                        Contact Persons
                    </Typography>
                    {contactPersons.map((person, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 2,
                                alignItems: 'flex-start',
                                mb: 2,
                                p: 2,
                                borderRadius: 1,
                                bgcolor: index % 2 === 0 ? 'rgba(1, 158, 227, 0.06)' : 'rgba(0,0,0,0.02)',
                            }}
                        >
                            <TextField
                                label="Mobile Number"
                                value={person.mobileNumber}
                                onChange={(e) => handleContactPersonChange(index, 'mobileNumber', e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <PhoneIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="Mail Id"
                                value={person.mailId}
                                onChange={(e) => handleContactPersonChange(index, 'mailId', e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                type="email"
                                sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <MailOutlineIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="Person Name"
                                value={person.personName}
                                onChange={(e) => handleContactPersonChange(index, 'personName', e.target.value)}
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' } }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <PersonIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <IconButton
                                color="error"
                                onClick={() => removeContactPerson(index)}
                                disabled={contactPersons.length <= 1}
                                sx={{ mt: 0.5 }}
                                title="Remove contact"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button
                        type="button"
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={addContactPerson}
                        sx={{ mb: 2 }}
                    >
                        Add Contact Person
                    </Button>

                    <div className="flex justify-start mt-6">
                        <Button
                            type="submit"
                            variant="contained"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md"
                        >
                            {id ? 'Update' : 'Register'} {/* Dynamic Button Text */}
                        </Button>
                    </div>
                </form>
            </Paper>
        </div>
    );
};

export default AddVendor;