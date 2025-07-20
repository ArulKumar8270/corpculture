import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Import useParams
import {
    TextField, Button, Paper, Typography, InputAdornment
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // For Company Address (calendar icon)
import LabelIcon from '@mui/icons-material/Label'; // For City (tag icon)
import ReceiptIcon from '@mui/icons-material/Receipt'; // For Pincode (receipt icon)
import LockIcon from '@mui/icons-material/Lock'; // For GST Number (lock icon)
import PhoneIcon from '@mui/icons-material/Phone'; // For Mobile Number (phone icon)
import MailOutlineIcon from '@mui/icons-material/MailOutline'; // For Mail Id (mail icon)
import PersonIcon from '@mui/icons-material/Person'; // For Person Name (person icon)
import HomeIcon from '@mui/icons-material/Home'; // For Company Address (general address icon, if calendar is not suitable)


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
    const [mobileNumber, setMobileNumber] = useState('');
    const [mailId, setMailId] = useState('');
    const [personName, setPersonName] = useState('');

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
                        setMobileNumber(vendor.mobileNumber || '');
                        setMailId(vendor.mailId || '');
                        setPersonName(vendor.personName || '');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!companyName || !companyAddress || !city || !state || !pincode || !mobileNumber || !mailId || !personName) {
            toast.error('Please fill in all required fields.');
            return;
        }

        const vendorData = {
            companyName,
            companyAddress,
            city,
            state,
            pincode,
            gstNumber, // GST number is optional in the backend model, but required in your frontend validation
            mobileNumber,
            mailId,
            personName,
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
                    setMobileNumber('');
                    setMailId('');
                    setPersonName('');
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
                                        <LockIcon /> {/* Using Lock icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Mobile Number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <PhoneIcon /> {/* Using Phone icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Mail Id"
                            value={mailId}
                            onChange={(e) => setMailId(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <MailOutlineIcon /> {/* Using Mail icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Person Name"
                            value={personName}
                            onChange={(e) => setPersonName(e.target.value)}
                            fullWidth
                            variant="outlined"
                            size="small"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <PersonIcon /> {/* Using Person icon as per image */}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>

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