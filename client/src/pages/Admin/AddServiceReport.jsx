import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description'; // Icon for Corpculture Report
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios'; // Assuming axios is used for API calls

const AddServiceReport = () => {
    const navigate = useNavigate();

    // State for form fields
    const [reportData, setReportData] = useState({
        reportType: 'Service Report', // Default to 'Service Report'
        company: '',
        problemReport: '',
        remarksPendingWorks: '',
        accessService: '',
        modelNo: '',
        serialNo: '',
        branch: '',
        reference: '',
        materialProductName: '', // For adding new material
        materialQuantity: '',    // For adding new material
    });

    // State for materials added to the table
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    // States for dropdown data
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);

    // Simulate fetching data for dropdowns
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Mock API call for companies
                const companiesResponse = await new Promise(resolve => setTimeout(() => {
                    resolve({
                        data: {
                            success: true,
                            companies: [
                                { _id: 'comp1', name: 'KANCHI KAMAKOTI CHILDS TRUST HOSPITAL' },
                                { _id: 'comp2', name: 'ABC Corporation' },
                                { _id: 'comp3', name: 'XYZ Solutions' },
                            ]
                        }
                    });
                }, 500));
                if (companiesResponse.data.success) {
                    setCompanies(companiesResponse.data.companies);
                }

                // Mock API call for branches
                const branchesResponse = await new Promise(resolve => setTimeout(() => {
                    resolve({
                        data: {
                            success: true,
                            branches: [
                                { _id: 'branch1', name: 'Main Branch' },
                                { _id: 'branch2', name: 'North Branch' },
                                { _id: 'branch3', name: 'South Branch' },
                            ]
                        }
                    });
                }, 600));
                if (branchesResponse.data.success) {
                    setBranches(branchesResponse.data.branches);
                }

                // Mock API call for products (materials)
                const productsResponse = await new Promise(resolve => setTimeout(() => {
                    resolve({
                        data: {
                            success: true,
                            products: [
                                { _id: 'mat1', name: 'Material X', rate: 50 },
                                { _id: 'mat2', name: 'Material Y', rate: 75 },
                                { _id: 'mat3', name: 'Material Z', rate: 120 },
                            ]
                        }
                    });
                }, 700));
                if (productsResponse.data.success) {
                    setAvailableProducts(productsResponse.data.products);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load initial data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReportData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleAddMaterial = () => {
        const selectedProduct = availableProducts.find(p => p.name === reportData.materialProductName);
        if (!selectedProduct || !reportData.materialQuantity || reportData.materialQuantity <= 0) {
            toast.error('Please select a material and enter a valid quantity.');
            return;
        }

        const newMaterial = {
            id: Date.now(), // Unique ID for the material in the table
            productName: selectedProduct.name,
            quantity: parseInt(reportData.materialQuantity),
            rate: selectedProduct.rate,
            totalAmount: parseInt(reportData.materialQuantity) * selectedProduct.rate,
        };
        setMaterials(prevMaterials => [...prevMaterials, newMaterial]);
        // Clear material-related fields after adding
        setReportData(prevData => ({
            ...prevData,
            materialProductName: '',
            materialQuantity: '',
        }));
        toast.success('Material added to list!');
    };

    const handleDeleteMaterial = (id) => {
        setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== id));
        toast.success('Material removed!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reportData.company || materials.length === 0) {
            toast.error('Please select a company and add at least one material.');
            return;
        }

        console.log('Service Report Data:', reportData);
        console.log('Materials:', materials);

        try {
            // Simulate API call to submit service report data
            // Replace with your actual API endpoint and data structure
            const response = await new Promise(resolve => setTimeout(() => {
                resolve({ data: { success: true, message: 'Service Report submitted successfully!' } });
            }, 1000));

            if (response.data.success) {
                toast.success(response.data.message);
                // Optionally navigate or reset form
                handleCancel(); // Reset form after successful submission
                // navigate('/admin/service-reports');
            } else {
                toast.error(response.data.message || 'Failed to submit service report.');
            }
        } catch (err) {
            console.error('Error submitting service report:', err);
            toast.error('Something went wrong while submitting service report.');
        }
    };

    const handleCancel = () => {
        setReportData({
            reportType: 'Service Report',
            company: '',
            problemReport: '',
            remarksPendingWorks: '',
            accessService: '',
            modelNo: '',
            serialNo: '',
            branch: '',
            reference: '',
            materialProductName: '',
            materialQuantity: '',
        });
        setMaterials([]);
        toast.info('Form cancelled and reset.');
    };

    const handleCorpcultureReport = () => {
        // Implement logic for "Corpculture Report" button
        toast.info('Corpculture Report button clicked (placeholder)!');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Add Service Report
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: '8px' }}>
                <Box sx={{ mb: 3 }}>
                    <FormControl component="fieldset">
                        <RadioGroup
                            row
                            name="reportType"
                            value={reportData.reportType}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="Gate Pass" control={<Radio />} label="Gate Pass" />
                            <FormControlLabel value="Service Report" control={<Radio />} label="Service Report" />
                        </RadioGroup>
                    </FormControl>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="company-label">Company</InputLabel>
                            <Select
                                labelId="company-label"
                                id="company"
                                name="company"
                                value={reportData.company}
                                onChange={handleChange}
                                label="Company"
                            >
                                <MenuItem value="">Select a Company</MenuItem>
                                {companies.map(comp => (
                                    <MenuItem key={comp._id} value={comp.name}>{comp.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Problem Report"
                            name="problemReport"
                            value={reportData.problemReport}
                            onChange={handleChange}
                            placeholder="ENTER PROBLEM REPORT"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Remarks / Pending Works"
                            name="remarksPendingWorks"
                            value={reportData.remarksPendingWorks}
                            onChange={handleChange}
                            placeholder="ENTER REMARKS / PENDING WORKS"
                            multiline
                            rows={2}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Access Service"
                            name="accessService"
                            value={reportData.accessService}
                            onChange={handleChange}
                            placeholder="ENTER ACCESS SERVICE"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Model No"
                            name="modelNo"
                            value={reportData.modelNo}
                            onChange={handleChange}
                            placeholder="ENTER MODEL NO"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Serial No"
                            name="serialNo"
                            value={reportData.serialNo}
                            onChange={handleChange}
                            placeholder="ENTER SERIAL NO"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="branch-label">Branch</InputLabel>
                            <Select
                                labelId="branch-label"
                                id="branch"
                                name="branch"
                                value={reportData.branch}
                                onChange={handleChange}
                                label="Branch"
                            >
                                <MenuItem value="">Select a Branch</MenuItem>
                                {branches.map(branch => (
                                    <MenuItem key={branch._id} value={branch.name}>{branch.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Reference"
                            name="reference"
                            value={reportData.reference}
                            onChange={handleChange}
                            placeholder="Reference"
                            size="small"
                        />
                    </Grid>
                </Grid>

                <Typography variant="h6" component="h2" gutterBottom sx={{ mt: 4, mb: 2, color: '#019ee3' }}>
                    Materials
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="material-product-name-label">Select a Product</InputLabel>
                            <Select
                                labelId="material-product-name-label"
                                id="materialProductName"
                                name="materialProductName"
                                value={reportData.materialProductName}
                                onChange={handleChange}
                                label="Select a Product"
                            >
                                <MenuItem value="">Select a Product</MenuItem>
                                {availableProducts.map(prod => (
                                    <MenuItem key={prod._id} value={prod.name}>{prod.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Quantity"
                            name="materialQuantity"
                            type="number"
                            value={reportData.materialQuantity}
                            onChange={handleChange}
                            placeholder="Enter Quantity"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Button
                            variant="outlined"
                            onClick={handleAddMaterial}
                            disabled={!reportData.materialProductName || !reportData.materialQuantity}
                            fullWidth
                        >
                            Add Material
                        </Button>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
                    <Button variant="contained" sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }} onClick={handleSubmit}>
                        Submit
                    </Button>
                    <Button variant="contained" sx={{ bgcolor: '#dc3545', '&:hover': { bgcolor: '#c82333' } }} onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#ffc107', color: 'black', '&:hover': { bgcolor: '#e0a800' } }}
                        startIcon={<DescriptionIcon />}
                        onClick={handleCorpcultureReport}
                    >
                        Corpculture Report
                    </Button>
                </Box>
            </Paper>

            <TableContainer component={Paper} elevation={3} sx={{ borderRadius: '8px' }}>
                <Table sx={{ minWidth: 650 }} aria-label="materials table">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f0f0f0' }}>
                            <TableCell>S.No</TableCell>
                            <TableCell>Product Name</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Total Amount</TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {materials.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No materials added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            materials.map((material, index) => (
                                <TableRow key={material.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{material.productName}</TableCell>
                                    <TableCell align="right">{material.quantity}</TableCell>
                                    <TableCell align="right">{material.totalAmount}</TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => alert(`Edit material ${material.id}`)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDeleteMaterial(material.id)}>
                                            <DeleteIcon fontSize="small" color="error" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default AddServiceReport;