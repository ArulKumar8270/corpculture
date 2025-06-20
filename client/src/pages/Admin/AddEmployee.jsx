import React, { useState } from 'react';
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";

const AddEmployee = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        employeeType: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const employeeTypes = ['Service', 'Sales', 'Admin', 'Other']; // Define your employee types

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error for the field when it's being edited
        setErrors({ ...errors, [name]: undefined });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!formData.phone.trim()) newErrors.phone = "Phone is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        if (!formData.employeeType) newErrors.employeeType = "Employee Type is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.warning("Please fill in all required fields correctly.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/create`, // *** Update with your actual API endpoint ***
                {...formData, password: formData?.phone},
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (response.status === 201) {
                toast.success("Employee added successfully!");
                navigate('/admin/AdminEmployees'); // *** Update with your actual employees list route ***
            }
        } catch (error) {
            console.error("Error adding employee:", error);
            toast.error(error.response?.data?.message || "Failed to add employee. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <SeoData title="Add Employee - Admin" />
            <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">Add New Employee</h1>

            <div className="bg-white rounded-xl shadow p-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        fullWidth
                        required
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email}
                    />
                    <TextField
                        label="Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        fullWidth
                        required
                        error={!!errors.phone}
                        helperText={errors.phone}
                    />
                     <TextField
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        fullWidth
                        required
                        multiline
                        rows={3}
                        error={!!errors.address}
                        helperText={errors.address}
                    />
                    <TextField
                        select
                        label="Employee Type"
                        name="employeeType"
                        value={formData.employeeType}
                        onChange={handleInputChange}
                        variant="outlined"
                        size="small"
                        fullWidth
                        required
                        error={!!errors.employeeType}
                        helperText={errors.employeeType}
                    >
                        {employeeTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 2,
                            py: 1.5,
                            background: 'linear-gradient(90deg, #019ee3 0%, #afcb09 100%)',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #afcb09 0%, #019ee3 100%)',
                            },
                            color: '#fff',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        {loading ? <Spinner size={24} color="#fff" /> : 'Add Employee'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AddEmployee;