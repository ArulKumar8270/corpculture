import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth'; // Assuming you use this context for auth token
import { useNavigate } from 'react-router-dom'; // To redirect after submission
import SeoData from '../../../SEO/SeoData'; // Assuming you have this component
import AddCompany from '../../Admin/AddCompany';

const CompanyRegistrationForm = (props) => {
    const { auth, setRefetch, refetch,  } = useAuth(); // Get auth token
    const navigate = useNavigate();

    // State for form fields
    const [formData, setFormData] = useState({
        customerType: '', // Default or initial value
        phone: '',
        companyName: '',
        customerComplaint: '', // Optional
        contactPerson: '',
        email: '',
        addressDetail: '',
        locationDetail: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Basic validation (you might want more robust validation)
        if (!formData.customerType || !formData.phone || !formData.companyName || !formData.contactPerson || !formData.email || !formData.addressDetail || !formData.locationDetail) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        try {
            const companyPrams = {
                ...formData,
                userId : auth?.user?._id,
            }
            // Make API call to submit company details
            // You need to create this backend endpoint (e.g., POST /api/v1/company/register)
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/create`, // *** Create this backend endpoint ***
                companyPrams,
                {
                    headers: {
                        Authorization: auth?.token, // Include auth token
                    },
                }
            );

            if (response.data.success) { // Adjust based on your backend response
                setSuccess(true);
                setRefetch(!refetch)
                props?.onClose() // Or wherever you want to send them next
            } else {
                setError(response.data.message || "Failed to submit company details.");
            }

        } catch (err) {
            console.error("Error submitting company details:", err);
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <SeoData title="Register Company | CorpCulture" />
            <AddCompany />
        </>
    );
};

export default CompanyRegistrationForm;