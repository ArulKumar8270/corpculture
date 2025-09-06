import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import SeoData from "../../SEO/SeoData";
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { toast } from 'react-toastify';
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";

const AddEmployee = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { employeeId } = useParams(); // Get employeeId from URL for edit mode

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        employeeType: '',
        designation: '',
        idCradNo: '',
        department: '',
        salary: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // State to track edit mode

    const employeeTypes = ['Service', 'Sales', "Rentals"];

    // Effect to fetch employee data if in edit mode
    useEffect(() => {
        if (employeeId) {
            setIsEditMode(true);
            const fetchEmployee = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/get/${employeeId}`,
                        {
                            headers: {
                                Authorization: auth?.token,
                            },
                        }
                    );
                    const employeeData = response.data.employee;
                    setFormData({
                        name: employeeData.name || '',
                        email: employeeData.email || '',
                        phone: employeeData.phone || '',
                        address: employeeData.address || '',
                        employeeType: employeeData.employeeType || '',
                        designation: employeeData.designation || '',
                        idCradNo: employeeData.idCradNo || '',
                        department: employeeData.department || '',
                        salary: employeeData.salary || '',
                    });
                } catch (error) {
                    console.error("Error fetching employee for edit:", error);
                    toast.error("Failed to load employee data.");
                    navigate('../employee'); // Redirect if employee not found or error
                } finally {
                    setLoading(false);
                }
            };
            if (auth?.token) {
                fetchEmployee();
            }
        } else {
            setIsEditMode(false);
            // Clear form data if switching from edit to add mode
            setFormData({
                name: '', email: '', phone: '', address: '', employeeType: '',
                designation: '', idCradNo: '', department: '', salary: '',
            });
        }
    }, [employeeId, auth?.token, navigate]); // Depend on employeeId and auth.token

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
            if (isEditMode) {
                // Update existing employee
                const response = await axios.put(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/update/${employeeId}`,
                    {
                        ...formData,
                        salary: formData.salary ? Number(formData.salary) : undefined
                    },
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );
                if (response.status === 200) {
                    toast.success("Employee updated successfully!");
                    navigate('../employee');
                }
            } else {
                // Register new user and then create employee
                let registerUser;
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/register`,
                        {
                            ...formData, password: formData?.phone, role: 3,
                        }
                    );
                    registerUser = response?.data?.user;
                    console.log("registerUser234523", registerUser);

                    const employeeCreateResponse = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/create`,
                        {
                            ...formData,
                            password: formData?.phone,
                            userId: registerUser?._id,
                            salary: formData.salary ? Number(formData.salary) : undefined
                        },
                        {
                            headers: {
                                Authorization: auth?.token,
                            },
                        }
                    );
                    if (employeeCreateResponse.status === 201) {
                        toast.success("Employee added successfully!");
                        navigate('../employee');
                    }
                } catch (error) {
                    console.error("Error during employee registration/creation:", error);
                    toast.error(error.response?.data?.message || "Failed to add employee. Please try again.");
                }
            }
        } catch (error) {
            console.error("Error in handleSubmit:", error);
            toast.error(error.response?.data?.message || "Failed to process employee. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-br from-[#e6fbff] to-[#f7fafd] min-h-screen">
            <SeoData title={isEditMode ? "Edit Employee - Admin" : "Add Employee - Admin"} />
            <h1 className="text-2xl font-bold mb-6 text-[#019ee3]">
                {isEditMode ? "Edit Employee" : "Add New Employee"}
            </h1>

            {/* New flex container for form and details */}
            <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto">
                <div className="bg-white rounded-xl shadow p-6 flex-1"> {/* Form container, now flex-1 */}
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
                            disabled={isEditMode} // Disable email field in edit mode if it's a unique identifier
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
                        <TextField
                            label="Designation"
                            name="designation"
                            value={formData.designation}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="ID Card Number"
                            name="idCradNo"
                            value={formData.idCradNo}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Salary"
                            name="salary"
                            type="number"
                            value={formData.salary}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                            inputProps={{ min: 0 }}
                        />

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
                            {loading ? <Spinner size={24} color="#fff" /> : (isEditMode ? 'Update Employee' : 'Add Employee')}
                        </Button>
                    </form>
                </div>

                {/* New section for displaying filtered details */}
                <div className="bg-white rounded-xl shadow p-6 flex-1">
                    <h2 className="text-xl font-bold mb-4 text-[#019ee3]">Employee Details Preview</h2>
                    <div className="space-y-2 text-gray-700">
                        <p><strong>Name:</strong> {formData.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {formData.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {formData.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> {formData.address || 'N/A'}</p>
                        <p><strong>Employee Type:</strong> {formData.employeeType || 'N/A'}</p>
                        <p><strong>Designation:</strong> {formData.designation || 'N/A'}</p>
                        <p><strong>ID Card No:</strong> {formData.idCradNo || 'N/A'}</p>
                        <p><strong>Department:</strong> {formData.department || 'N/A'}</p>
                        <p><strong>Salary:</strong> {formData.salary ? `₹${formData.salary}` : 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmployee;