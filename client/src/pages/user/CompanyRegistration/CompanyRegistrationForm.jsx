import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/auth'; // Assuming you use this context for auth token
import { useNavigate } from 'react-router-dom'; // To redirect after submission
import SeoData from '../../../SEO/SeoData'; // Assuming you have this component

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
            <main className="w-full pt-5 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen flex items-center justify-center">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Register Company Details</h2>
                    <p className="text-center text-gray-600">Please provide your company information to proceed with your order.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="customerType" className="block text-sm font-medium text-gray-700">Customer Type <span className="text-red-500">*</span></label>
                            <select
                                id="customerType"
                                name="customerType"
                                value={formData.customerType}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            >
                                <option value="">Select Customer Type</option>
                                <option value="Mode Of Customer">Existing Customer</option>
                                <option value="Mode Of Customer">New Customer</option>
                                {/* Add more options here if needed */}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Contact Person <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="contactPerson"
                                name="contactPerson"
                                value={formData.contactPerson}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                            <input
                                type="tel" // Use type="tel" for phone numbers
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            />
                        </div>

                         <div>
                            <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">Address Detail <span className="text-red-500">*</span></label>
                            <textarea
                                id="addressDetail"
                                name="addressDetail"
                                value={formData.addressDetail}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="locationDetail" className="block text-sm font-medium text-gray-700">Location Detail <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="locationDetail"
                                name="locationDetail"
                                value={formData.locationDetail}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="customerComplaint" className="block text-sm font-medium text-gray-700">Customer Complaint (Optional)</label>
                            <textarea
                                id="customerComplaint"
                                name="customerComplaint"
                                value={formData.customerComplaint}
                                onChange={handleChange}
                                rows="3"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue sm:text-sm"
                            ></textarea>
                        </div>


                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                        {success && <p className="text-sm text-green-600 text-center">Company details submitted successfully!</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-[#019ee3] to-[#afcb09] hover:from-[#afcb09] hover:to-[#019ee3]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryBlue`}
                        >
                            {loading ? 'Submitting...' : 'Submit Company Details'}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
};

export default CompanyRegistrationForm;