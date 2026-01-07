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
import { InputAdornment, Select, FormControl, InputLabel, Chip, OutlinedInput, Box } from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category'; // For voucher type
import { PhotoCamera } from '@mui/icons-material';
import Typography from '@mui/material/Typography';

const AddEmployee = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { employeeId } = useParams(); // Get employeeId from URL for edit mode

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: [],
        employeeType: [],
        designation: [],
        idCradNo: '',
        department: [],
        salary: '',
        image: '',
        parentName: '',
        parentPhone: '',
        parentAddress: '',
        parentRelation: '',
        idProof: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // State to track edit mode
    const [categories, setCategories] = useState([]); // New state for categories
    const employeeTypes = ['Service', 'Sales', "Rentals"];

    // New function to fetch categories
    const fetchCategories = async () => {
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (res.status === 200) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error(
                error.response?.data?.message ||
                "Error fetching categories. Please try again."
            );
        }
    };

    // Effect to fetch employee data if in edit mode
    useEffect(() => {
        if (auth?.token) { // Fetch categories only if authenticated
            fetchCategories();
        }

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
                        pincode: Array.isArray(employeeData.pincode) ? employeeData.pincode : (employeeData.pincode ? [employeeData.pincode] : []),
                        employeeType: Array.isArray(employeeData.employeeType) ? employeeData.employeeType : (employeeData.employeeType ? [employeeData.employeeType] : []),
                        designation: Array.isArray(employeeData.designation) ? employeeData.designation : (employeeData.designation ? [employeeData.designation] : []),
                        idCradNo: employeeData.idCradNo || '',
                        // Handle department as array or single value
                        department: Array.isArray(employeeData.department) 
                            ? employeeData.department.map(d => d._id || d)
                            : (employeeData.department?._id || employeeData.department ? [employeeData.department?._id || employeeData.department] : []),
                        salary: employeeData.salary || '',
                        image: employeeData.image || '',
                        parentName: employeeData.parentName || '',
                        parentPhone: employeeData.parentPhone || '',
                        parentAddress: employeeData.parentAddress || '',
                        parentRelation: employeeData.parentRelation || '',
                        idProof: employeeData.idProof || '',
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
                name: '', email: '', phone: '', address: '', pincode: [], employeeType: [],
                designation: [], idCradNo: '', department: [], salary: '', image: '',
                parentName: '', parentPhone: '', parentAddress: '', parentRelation: '', idProof: '',
            });
        }
    }, [employeeId, auth?.token, navigate]); // Depend on employeeId and auth.token

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(name, value, "asdfajslhk");
        setFormData({ ...formData, [name]: value });
        // Clear error for the field when it's being edited
        setErrors({ ...errors, [name]: undefined });
    };

    const handleMultiSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: typeof value === 'string' ? value.split(',') : value });
        // Clear error for the field when it's being edited
        setErrors({ ...errors, [name]: undefined });
    };

    const handlePincodeAdd = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newPincode = e.target.value.trim();
            // Validate pincode (6 digits)
            if (/^\d{6}$/.test(newPincode)) {
                if (!formData.pincode.includes(newPincode)) {
                    setFormData({ ...formData, pincode: [...formData.pincode, newPincode] });
                    e.target.value = '';
                } else {
                    toast.warning('Pincode already added');
                }
            } else {
                toast.error('Please enter a valid 6-digit pincode');
            }
            e.preventDefault();
        }
    };

    const handlePincodeDelete = (pincodeToDelete) => {
        setFormData({
            ...formData,
            pincode: formData.pincode.filter(p => p !== pincodeToDelete)
        });
    };

    const handleDesignationAdd = (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            const newDesignation = e.target.value.trim();
            if (!formData.designation.includes(newDesignation)) {
                setFormData({ ...formData, designation: [...formData.designation, newDesignation] });
                e.target.value = '';
            } else {
                toast.warning('Designation already added');
            }
            e.preventDefault();
        }
    };

    const handleDesignationDelete = (designationToDelete) => {
        setFormData({
            ...formData,
            designation: formData.designation.filter(d => d !== designationToDelete)
        });
    };

    const handleUploadImage = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.jpg,.jpeg,.png';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.match('image.*')) {
                toast.error('Please select a valid image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }

            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            try {
                setLoading(true);
                const res = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/upload-file`,
                    formDataUpload,
                    {
                        headers: {
                            Authorization: auth?.token
                        },
                    }
                );
                if (res.data?.success && res.data?.fileUrl) {
                    setFormData({ ...formData, image: res.data.fileUrl });
                    toast.success('Image uploaded successfully');
                } else {
                    toast.error('Failed to upload image');
                }
            } catch (error) {
                console.error("Image upload error:", error);
                toast.error(error.response?.data?.message || 'Error uploading image');
            } finally {
                setLoading(false);
            }
        };

        input.click();
    };

    const handleUploadIdProof = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should be less than 5MB');
                return;
            }

            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            try {
                setLoading(true);
                const res = await axios.post(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/auth/upload-file`,
                    formDataUpload,
                    {
                        headers: {
                            Authorization: auth?.token
                        },
                    }
                );
                if (res.data?.success && res.data?.fileUrl) {
                    setFormData({ ...formData, idProof: res.data.fileUrl });
                    toast.success('ID Proof uploaded successfully');
                } else {
                    toast.error('Failed to upload ID Proof');
                }
            } catch (error) {
                console.error("ID Proof upload error:", error);
                toast.error(error.response?.data?.message || 'Error uploading ID Proof');
            } finally {
                setLoading(false);
            }
        };

        input.click();
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
        if (!formData.employeeType || formData.employeeType.length === 0) newErrors.employeeType = "Employee Type is required";

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
                        salary: formData.salary ? Number(formData.salary) : undefined,
                        image: formData.image || undefined
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
                    const employeeCreateResponse = await axios.post(
                        `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/create`,
                        {
                            ...formData,
                            password: formData?.phone,
                            userId: registerUser?._id,
                            salary: formData.salary ? Number(formData.salary) : undefined,
                            image: formData.image || undefined
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
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Pincode(s)</label>
                            <TextField
                                placeholder="Enter pincode and press Enter (6 digits)"
                                variant="outlined"
                                size="small"
                                fullWidth
                                onKeyDown={handlePincodeAdd}
                                inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
                                helperText="Press Enter to add pincode"
                            />
                            {formData.pincode.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                    {formData.pincode.map((pincode, index) => (
                                        <Chip
                                            key={index}
                                            label={pincode}
                                            onDelete={() => handlePincodeDelete(pincode)}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            )}
                        </div>
                        <FormControl fullWidth size="small" required error={!!errors.employeeType}>
                            <InputLabel id="employee-type-label">Employee Type</InputLabel>
                            <Select
                                labelId="employee-type-label"
                                id="employeeType"
                                name="employeeType"
                                multiple
                                value={formData.employeeType}
                                onChange={handleMultiSelectChange}
                                input={<OutlinedInput label="Employee Type" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip key={value} label={value} size="small" />
                                        ))}
                                    </Box>
                                )}
                            >
                                {employeeTypes.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.employeeType && (
                                <p style={{ color: '#d32f2f', fontSize: '0.75rem', margin: '3px 14px 0' }}>
                                    {errors.employeeType}
                                </p>
                            )}
                        </FormControl>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Designation(s)</label>
                            <TextField
                                placeholder="Enter designation and press Enter"
                                variant="outlined"
                                size="small"
                                fullWidth
                                onKeyDown={handleDesignationAdd}
                                helperText="Press Enter to add designation"
                            />
                            {formData.designation.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                    {formData.designation.map((designation, index) => (
                                        <Chip
                                            key={index}
                                            label={designation}
                                            onDelete={() => handleDesignationDelete(designation)}
                                            size="small"
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            )}
                        </div>
                        <TextField
                            label="ID Card Number"
                            name="idCradNo"
                            value={formData.idCradNo}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        
                        {/* Image Upload Section */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Employee Photo</label>
                            <div className="flex items-center gap-3">
                                {formData.image ? (
                                    <div className="relative">
                                        <img
                                            src={formData.image}
                                            alt="Employee"
                                            className="w-20 h-20 rounded-lg object-cover border-2 border-[#019ee3]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, image: '' })}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                                        <PhotoCamera className="text-gray-400" />
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    variant="outlined"
                                    startIcon={<PhotoCamera />}
                                    onClick={handleUploadImage}
                                    disabled={loading}
                                    sx={{
                                        borderColor: '#019ee3',
                                        color: '#019ee3',
                                        '&:hover': {
                                            borderColor: '#0180b8',
                                            bgcolor: '#e6fbff',
                                        },
                                    }}
                                >
                                    {formData.image ? 'Change Photo' : 'Upload Photo'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500">Supported formats: JPG, PNG (Max 5MB)</p>
                        </div>

                        {/* ID Proof Upload Section */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">ID Proof Document</label>
                            <div className="flex items-center gap-3">
                                {formData.idProof ? (
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={formData.idProof} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-[#019ee3] hover:underline flex items-center gap-1"
                                        >
                                            <span>View ID Proof</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, idProof: '' })}
                                            className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        onClick={handleUploadIdProof}
                                        disabled={loading}
                                        sx={{
                                            borderColor: '#019ee3',
                                            color: '#019ee3',
                                            '&:hover': {
                                                borderColor: '#0180b8',
                                                bgcolor: '#e6fbff',
                                            },
                                        }}
                                    >
                                        Upload ID Proof
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
                        </div>

                        {/* Parent Details Section */}
                        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#019ee3', fontWeight: 'bold' }}>
                            Parent/Guardian Details
                        </Typography>
                        <TextField
                            label="Parent/Guardian Name"
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Parent/Guardian Phone"
                            name="parentPhone"
                            value={formData.parentPhone}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="Parent/Guardian Relation"
                            name="parentRelation"
                            value={formData.parentRelation}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="e.g., Father, Mother, Guardian"
                        />
                        <TextField
                            label="Parent/Guardian Address"
                            name="parentAddress"
                            value={formData.parentAddress}
                            onChange={handleInputChange}
                            variant="outlined"
                            size="small"
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <label>Department</label>
                        <FormControl fullWidth size="small">
                            <InputLabel id="department-label">Department</InputLabel>
                            <Select
                                labelId="department-label"
                                id="department"
                                name="department"
                                multiple
                                value={formData.department}
                                onChange={handleMultiSelectChange}
                                input={<OutlinedInput label="Department" endAdornment={
                                    <InputAdornment position="end">
                                        <CategoryIcon />
                                    </InputAdornment>
                                } />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const category = categories.find(cat => cat._id === value);
                                            return <Chip key={value} label={category?.name || value} size="small" />;
                                        })}
                                    </Box>
                                )}
                            >
                                {categories?.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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

                {/* Employee ID Card Design */}
                <div className="bg-white rounded-xl shadow-lg p-6 flex-1 flex flex-col items-center">
                    <h2 className="text-xl font-bold mb-6 text-[#019ee3]">Employee ID Card Preview</h2>
                    
                    {/* ID Card Container */}
                    <div className="w-full max-w-md bg-gradient-to-br from-[#019ee3] to-[#0180b8] rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                        {/* Header Section */}
                        <div className="bg-white px-6 py-4 text-center border-b-2 border-[#019ee3]">
                            <h3 className="text-2xl font-bold text-[#019ee3] mb-1">CORPCULTURE</h3>
                            <p className="text-xs text-gray-600 font-semibold">EMPLOYEE IDENTIFICATION CARD</p>
                        </div>

                        {/* Card Body */}
                        <div className="px-6 py-5 bg-white">
                            <div className="flex items-start gap-4 mb-4">
                                {/* Photo Display */}
                                <div className="w-24 h-24 rounded-lg border-4 border-[#019ee3] shadow-md flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#019ee3] to-[#afcb09]">
                                    {formData.image ? (
                                        <img
                                            src={formData.image}
                                            alt={formData.name || 'Employee'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : formData.name ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {formData.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-2xl text-white opacity-70">Photo</span>
                                        </div>
                                    )}
                                </div>

                                {/* Employee Info */}
                                <div className="flex-1">
                                    <h4 className="text-xl font-bold text-gray-800 mb-1">
                                        {formData.name || 'Employee Name'}
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {formData.designation && formData.designation.length > 0
                                            ? (Array.isArray(formData.designation) ? formData.designation.join(', ') : formData.designation)
                                            : 'Designation'}
                                    </p>
                                    <div className="bg-[#e6fbff] rounded-lg px-3 py-2 mt-2">
                                        <p className="text-xs font-semibold text-[#019ee3]">
                                            ID: {formData.idCradNo || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="border-t-2 border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-semibold text-gray-600">Department:</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {formData.department && formData.department.length > 0
                                            ? formData.department.map(id => categories.find(cat => cat._id === id)?.name).filter(Boolean).join(', ') || 'N/A'
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-semibold text-gray-600">Type:</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {formData.employeeType && formData.employeeType.length > 0
                                            ? formData.employeeType.join(', ')
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-semibold text-gray-600">Phone:</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {formData.phone || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-semibold text-gray-600">Email:</span>
                                    <span className="text-xs font-bold text-gray-800 truncate max-w-[180px]">
                                        {formData.email || 'N/A'}
                                    </span>
                                </div>
                                {formData.pincode && formData.pincode.length > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-xs font-semibold text-gray-600">Pincode:</span>
                                        <span className="text-sm font-bold text-gray-800">
                                            {Array.isArray(formData.pincode) ? formData.pincode.join(', ') : formData.pincode}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="bg-gradient-to-r from-[#019ee3] to-[#afcb09] px-6 py-3 text-center">
                            <p className="text-xs text-white font-semibold">
                                This card is the property of Corpculture
                            </p>
                            <p className="text-[10px] text-white/80 mt-1">
                                Valid until further notice
                            </p>
                        </div>
                    </div>

                    {/* Additional Info Below Card */}
                    <div className="mt-6 w-full max-w-md bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-semibold text-gray-600">Address:</span>
                            <span className="text-sm text-gray-800 text-right max-w-[60%]">
                                {formData.address || 'N/A'}
                            </span>
                        </div>
                        {formData.pincode && formData.pincode.length > 0 && (
                            <div className="flex justify-between">
                                <span className="text-sm font-semibold text-gray-600">Pincode:</span>
                                <span className="text-sm text-gray-800">
                                    {Array.isArray(formData.pincode) ? formData.pincode.join(', ') : formData.pincode}
                                </span>
                            </div>
                        )}
                        {formData.salary && (
                            <div className="flex justify-between">
                                <span className="text-sm font-semibold text-gray-600">Salary:</span>
                                <span className="text-sm font-bold text-[#019ee3]">
                                    ₹{formData.salary}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmployee;