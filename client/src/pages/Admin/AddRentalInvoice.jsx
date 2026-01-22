import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    CircularProgress,
    FormHelperText,
    Autocomplete
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ImageIcon from "@mui/icons-material/Image";
import { getTotalRentalInvoicePayment } from '../../utils/functions';
const MAX_IMAGE_SIZE = 500 * 1024;

const RentalInvoiceForm = () => {
    const [searchParams] = useSearchParams();
    const employeeName = searchParams.get("employeeName");
    const invoiceType = searchParams.get("invoiceType");
    const rentalId = searchParams.get("rentalId");
    const companyId = searchParams.get("companyId");
    const [loading, setLoading] = useState(true);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [logoPreview, setLogoPreview] = useState("");
    const [contactOptions, setContactOptions] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [invoices, setInvoices] = useState(null);
    const [invoiceCount, setInvoiceCount] = useState(0);
    const [globalInvoiceFormat, setGlobalInvoiceFormat] = useState('');
    // {{ edit_1 }}
    const [formData, setFormData] = useState({
        companyId: companyId ? companyId : '',
        machineId: '',
        sendDetailsTo: '',
        countImageFile: null,
        remarks: '',
        invoiceDate: dayjs(), // Invoice date with default to today
        a3Config: { bwOldCount: '', bwNewCount: '' },
        a4Config: { bwOldCount: '', bwNewCount: '' },
        a5Config: { bwOldCount: '', bwNewCount: '' },
    });
    // Multiple products support
    const [products, setProducts] = useState([
        {
            id: Date.now(),
            machineId: '',
            serialNo: '',
            selectedProduct: null,
            countImageFile: null,
            imagePreview: '',
            basePrice: '',
            a3Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
            a4Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
            a5Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
        }
    ]);
    // {{ edit_1 }}
    const [errors, setErrors] = useState({});
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();


    useEffect(() => {
        fetchInvoicesCounts();
    }, [rentalId]);

    // Helper function to generate invoice number based on format
    const generateInvoiceNumber = (invoiceCount, format) => {
        if (!format || format.trim() === '') {
            // If no format, return the count as string
            return invoiceCount.toString();
        }

        // Get current date for year replacement
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentYearShort = currentYear.toString().slice(-2);
        const nextYearShort = (currentYear + 1).toString().slice(-2);
        const yearRange = `${currentYearShort}-${nextYearShort}`;
        const fullYearRange = `${currentYear}-${currentYear + 1}`;

        // Replace date/year patterns in the format
        let processedFormat = format;
        
        // Replace year patterns (e.g., "26-27" with current year range like "26-27")
        // Match patterns like: YY-YY, YYYY-YYYY, or any date-like pattern
        processedFormat = processedFormat.replace(/\d{2}-\d{2}/g, yearRange); // Replace YY-YY pattern
        processedFormat = processedFormat.replace(/\d{4}-\d{4}/g, fullYearRange); // Replace YYYY-YYYY pattern
        
        // Also handle single year patterns
        processedFormat = processedFormat.replace(/\b\d{2}\b/g, (match) => {
            // If it's a 2-digit number that looks like a year (20-99), replace with current year
            const num = parseInt(match);
            if (num >= 20 && num <= 99) {
                return currentYearShort;
            }
            return match;
        });
        processedFormat = processedFormat.replace(/\b\d{4}\b/g, (match) => {
            // If it's a 4-digit year (2000-2099), replace with current year
            const num = parseInt(match);
            if (num >= 2000 && num <= 2099) {
                return currentYear.toString();
            }
            return match;
        });

        // Extract the last number sequence (sequential number part)
        const lastNumberMatch = processedFormat.match(/(\d+)(?!.*\d)/);
        
        if (lastNumberMatch) {
            const numberDigits = lastNumberMatch[1].length;
            const prefix = processedFormat.substring(0, processedFormat.lastIndexOf(lastNumberMatch[1]));
            const formattedNumber = invoiceCount.toString().padStart(numberDigits, '0');
            return prefix + formattedNumber;
        }
        
        // Fallback: append count to processed format
        return processedFormat + invoiceCount.toString().padStart(5, '0');
    };

    const fetchInvoicesCounts = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`, {
                headers: {
                    Authorization: auth.token,
                },
            });
            if (data) {
                // Use the actual global invoiceCount value (not +1)
                const count = data.commonDetails?.invoiceCount || 0;
                const format = data.commonDetails?.globalInvoiceFormat || '';
                setGlobalInvoiceFormat(format);
                // Store count + 1 for the next invoice number
                setInvoiceCount(count + 1);
                
                // Generate invoice number based on format using count + 1
                const invoiceNumber = generateInvoiceNumber(count + 1, format);
                setInvoices(invoiceNumber);
            } else {
                alert(data?.message || 'Failed to fetch service invoices.');
            }
        } catch (error) {
            console.error("Error fetching service invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanyData = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/get/${formData.companyId}`,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success && data.company) {
                const company = data.company;
                setCompanies([company]);

            } else {
                alert(data?.message || 'Failed to fetch company details.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong while fetching company details.');
        }
    };

    // Fetch all companies on component mount for Autocomplete
    useEffect(() => {
        const fetchAllCompanies = async () => {
            if (!id && !companyId) {
                // Only fetch all companies when creating new entry (not editing)
                try {
                    setLoadingCompanies(true);
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/company/all?limit=1000`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        setCompanies(data.companies || []);
                    }
                } catch (error) {
                    console.error("Error fetching companies:", error);
                } finally {
                    setLoadingCompanies(false);
                }
            } else if (formData.companyId !== '') {
                // When editing, fetch only the specific company
                fetchCompanyData();
            }
        };
        fetchAllCompanies();
    }, [auth.token, formData.companyId, id, companyId]);

    // Fetch existing rental entry data if in edit mode
    useEffect(() => {
        const fetchRentalEntry = async () => {
            if (id) {
                try {
                    setLoading(true);
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${id}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        const entry = data.entry;

                        // Set basic form data
                        setFormData({
                            companyId: entry.companyId?._id || '',
                            machineId: entry.machineId?._id || '',
                            sendDetailsTo: entry?.sendDetailsTo || '',
                            countImageFile: null,
                            remarks: entry.remarks || '',
                            invoiceDate: entry.invoiceDate ? dayjs(entry.invoiceDate) : dayjs(), // Set invoice date if exists, otherwise default to today
                            a3Config: {
                                bwOldCount: entry.a3Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a3Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a3Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a3Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a3Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a3Config?.colorScanningNewCount ?? 0,
                            },
                            a4Config: {
                                bwOldCount: entry.a4Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a4Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a4Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a4Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a4Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a4Config?.colorScanningNewCount ?? 0,
                            },
                            a5Config: {
                                bwOldCount: entry.a5Config?.bwOldCount ?? 0,
                                bwNewCount: entry.a5Config?.bwNewCount ?? 0,
                                colorOldCount: entry.a5Config?.colorOldCount ?? 0,
                                colorNewCount: entry.a5Config?.colorNewCount ?? 0,
                                colorScanningOldCount: entry.a5Config?.colorScanningOldCount ?? 0,
                                colorScanningNewCount: entry.a5Config?.colorScanningNewCount ?? 0,
                            },
                        });

                        // Check if entry has products array (new format) or single machineId (old format)
                        if (entry.products && Array.isArray(entry.products) && entry.products.length > 0) {
                            // New format - multiple products
                            const productsData = entry.products.map((product, index) => {
                                // Handle both populated (object) and unpopulated (string) machineId
                                const machineIdValue = typeof product.machineId === 'object' && product.machineId?._id
                                    ? product.machineId._id
                                    : (product.machineId || '');
                                const machineObject = typeof product.machineId === 'object' ? product.machineId : null;

                                return {
                                    id: Date.now() + index, // Generate unique ID
                                    machineId: machineIdValue,
                                    serialNo: product.serialNo || machineObject?.serialNo || '',
                                    selectedProduct: machineObject, // Store the populated object if available
                                    countImageFile: null,
                                    imagePreview: product.countImageUpload?.url || '',
                                    basePrice: product.basePrice || '',
                                    a3Config: {
                                        bwOldCount: product.a3Config?.bwOldCount ?? 0,
                                        bwNewCount: product.a3Config?.bwNewCount ?? 0,
                                        colorOldCount: product.a3Config?.colorOldCount ?? 0,
                                        colorNewCount: product.a3Config?.colorNewCount ?? 0,
                                        colorScanningOldCount: product.a3Config?.colorScanningOldCount ?? 0,
                                        colorScanningNewCount: product.a3Config?.colorScanningNewCount ?? 0,
                                    },
                                    a4Config: {
                                        bwOldCount: product.a4Config?.bwOldCount ?? 0,
                                        bwNewCount: product.a4Config?.bwNewCount ?? 0,
                                        colorOldCount: product.a4Config?.colorOldCount ?? 0,
                                        colorNewCount: product.a4Config?.colorNewCount ?? 0,
                                        colorScanningOldCount: product.a4Config?.colorScanningOldCount ?? 0,
                                        colorScanningNewCount: product.a4Config?.colorScanningNewCount ?? 0,
                                    },
                                    a5Config: {
                                        bwOldCount: product.a5Config?.bwOldCount ?? 0,
                                        bwNewCount: product.a5Config?.bwNewCount ?? 0,
                                        colorOldCount: product.a5Config?.colorOldCount ?? 0,
                                        colorNewCount: product.a5Config?.colorNewCount ?? 0,
                                        colorScanningOldCount: product.a5Config?.colorScanningOldCount ?? 0,
                                        colorScanningNewCount: product.a5Config?.colorScanningNewCount ?? 0,
                                    },
                                };
                            });
                            setProducts(productsData);
                        } else if (entry.machineId) {
                            // Old format - single product
                            // Handle both populated (object) and unpopulated (string) machineId
                            const machineIdValue = typeof entry.machineId === 'object' && entry.machineId?._id
                                ? entry.machineId._id
                                : (entry.machineId || '');
                            const machineObject = typeof entry.machineId === 'object' ? entry.machineId : null;

                            setSelectedProduct(machineObject);
                            setProducts([{
                                id: Date.now(),
                                machineId: machineIdValue,
                                serialNo: machineObject?.serialNo || '',
                                selectedProduct: machineObject,
                                countImageFile: null,
                                imagePreview: entry.countImageUpload?.url || '',
                                a3Config: {
                                    bwOldCount: entry.a3Config?.bwOldCount ?? 0,
                                    bwNewCount: entry.a3Config?.bwNewCount ?? 0,
                                    colorOldCount: entry.a3Config?.colorOldCount ?? 0,
                                    colorNewCount: entry.a3Config?.colorNewCount ?? 0,
                                    colorScanningOldCount: entry.a3Config?.colorScanningOldCount ?? 0,
                                    colorScanningNewCount: entry.a3Config?.colorScanningNewCount ?? 0,
                                },
                                a4Config: {
                                    bwOldCount: entry.a4Config?.bwOldCount ?? 0,
                                    bwNewCount: entry.a4Config?.bwNewCount ?? 0,
                                    colorOldCount: entry.a4Config?.colorOldCount ?? 0,
                                    colorNewCount: entry.a4Config?.colorNewCount ?? 0,
                                    colorScanningOldCount: entry.a4Config?.colorScanningOldCount ?? 0,
                                    colorScanningNewCount: entry.a4Config?.colorScanningNewCount ?? 0,
                                },
                                a5Config: {
                                    bwOldCount: entry.a5Config?.bwOldCount ?? 0,
                                    bwNewCount: entry.a5Config?.bwNewCount ?? 0,
                                    colorOldCount: entry.a5Config?.colorOldCount ?? 0,
                                    colorNewCount: entry.a5Config?.colorNewCount ?? 0,
                                    colorScanningOldCount: entry.a5Config?.colorScanningOldCount ?? 0,
                                    colorScanningNewCount: entry.a5Config?.colorScanningNewCount ?? 0,
                                },
                            }]);
                        }

                        // Set main image preview if exists (for backward compatibility)
                        if (entry.countImageUpload?.url) {
                            setLogoPreview(entry.countImageUpload.url);
                        }
                    } else {
                        toast.error(data?.message || 'Failed to fetch rental entry details.');
                        navigate('/admin/rental-invoices');
                    }
                } catch (error) {
                    console.error("Error fetching rental entry:", error);
                    toast.error('Failed to fetch rental entry details.');
                    navigate('/admin/rental-invoices');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchRentalEntry();
    }, [id, auth.token, navigate]);


    // Fetch products based on selected company
    useEffect(() => {
        const fetchProductsByCompany = async () => {
            if (formData.companyId) {
                try {
                    setLoading(true);
                    // Corrected API endpoint for rental products by company
                    const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/getServiceProductsByCompany/${formData.companyId}`, {
                        headers: {
                            Authorization: auth.token,
                        },
                    });
                    if (data?.success) {
                        setAvailableProducts(data.rentalProducts);

                        // If in edit mode, populate selectedProduct for each product in the products array
                        if (id && products.length > 0) {
                            setProducts(prevProducts => prevProducts.map(product => {
                                if (product.machineId) {
                                    const foundProduct = data.rentalProducts.find(p => p._id === product.machineId);
                                    if (foundProduct) {
                                        return {
                                            ...product,
                                            selectedProduct: foundProduct,
                                            serialNo: foundProduct.serialNo || product.serialNo,
                                        };
                                    }
                                }
                                return product;
                            }));
                        }

                        // If in edit mode and machineId is already set (old format), ensure it's still valid
                        if (id && formData.machineId && !data.rentalProducts.some(p => p._id === formData.machineId)) {
                            setFormData(prev => ({ ...prev, machineId: '' })); // Clear if machineId is not in the list
                        }
                    } else {
                        toast.error(data?.message || 'Failed to fetch products for the selected company.');
                        setAvailableProducts([]); // Clear products if fetch fails
                    }
                } catch (error) {
                    console.error("Error fetching products by company:", error);
                    toast.error('Something went wrong while fetching products.');
                    setAvailableProducts([]); // Clear products on error
                } finally {
                    setLoading(false);
                }
            } else {
                setAvailableProducts([]); // Clear products if no company is selected
                // {{ edit_1 }}
                setFormData(prev => ({
                    ...prev,
                    machineId: '',
                    a3Config: { ...prev.a3Config, bwOldCount: '' },
                    a4Config: { ...prev.a4Config, bwOldCount: '' },
                    a5Config: { ...prev.a5Config, bwOldCount: '' },
                }));
                // {{ edit_1 }}
            }
        };
        // Only fetch products if companyId changes or if it's an initial load in edit mode
        if (formData.companyId || id) {
            fetchProductsByCompany();
        }
    }, [formData.companyId, auth.token, id]);

    // Populate "Send Details To" options based on selected company
    useEffect(() => {
        if (formData.companyId && companies.length > 0) {
            const selectedCompany = companies[0];
            if (selectedCompany && selectedCompany.contactPersons) {
                const options = selectedCompany.contactPersons.map(person =>
                    `${person.name} (Mobile: ${person.mobile}, Email: ${person.email})`
                );
                setContactOptions(options);
            } else {
                setContactOptions([]);
            }
        } else {
            setContactOptions([]);
        }
        // Reset sendDetailsTo when company changes, unless in edit mode and it's already set
        if (!id) { // {{ edit_4 }}
            setFormData(prev => ({ ...prev, sendDetailsTo: '' })); // {{ edit_4 }}
        } // {{ edit_4 }}
    }, [formData.companyId, companies, id]); // Added id to dependencies // {{ edit_4 }}

    const handleImagehange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.readyState === 2) {
                setLogoPreview(reader.result);
                setFormData(prev => ({ ...prev, countImageFile: reader.result }));

            }
        };

        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Check if the name contains a dot, indicating a nested field (e.g., a3Config.bwNewCount)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
            setErrors(prev => ({ ...prev, [name]: '' })); // Clear error for nested field
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
            setErrors(prev => ({ ...prev, [name]: '' })); // Clear error on change
        }
    };
    // Functions for managing multiple products
    const addProduct = () => {
        setProducts(prev => [...prev, {
            id: Date.now(),
            machineId: '',
            serialNo: '',
            selectedProduct: null,
            countImageFile: null,
            imagePreview: '',
            basePrice: '',
            a3Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
            a4Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
            a5Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
        }]);
    };

    const removeProduct = (productId) => {
        if (products.length > 1) {
            setProducts(prev => prev.filter(p => p.id !== productId));
        } else {
            toast.error('At least one product is required');
        }
    };

    const handleProductSelect = (productId, newValue) => {
        const selectedProduct = availableProducts.find(prod => prod._id === newValue?._id);
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    machineId: newValue ? newValue._id : '',
                    serialNo: newValue ? newValue.serialNo : '',
                    selectedProduct: selectedProduct,
                    basePrice: selectedProduct ? selectedProduct.basePrice : '',
                    a3Config: selectedProduct ? {
                        ...p.a3Config,
                        bwOldCount: selectedProduct.a3Config?.bwOldCount ?? 0,
                        colorOldCount: selectedProduct.a3Config?.colorOldCount ?? 0,
                        colorScanningOldCount: selectedProduct.a3Config?.colorScanningOldCount ?? 0,
                    } : p.a3Config,
                    a4Config: selectedProduct ? {
                        ...p.a4Config,
                        bwOldCount: selectedProduct.a4Config?.bwOldCount ?? 0,
                        colorOldCount: selectedProduct.a4Config?.colorOldCount ?? 0,
                        colorScanningOldCount: selectedProduct.a4Config?.colorScanningOldCount ?? 0,
                    } : p.a4Config,
                    a5Config: selectedProduct ? {
                        ...p.a5Config,
                        bwOldCount: selectedProduct.a5Config?.bwOldCount ?? 0,
                        colorOldCount: selectedProduct.a5Config?.colorOldCount ?? 0,
                        colorScanningOldCount: selectedProduct.a5Config?.colorScanningOldCount ?? 0,
                    } : p.a5Config,
                };
            }
            return p;
        }));
    };

    const handleProductConfigChange = (productId, configType, field, value) => {
        setProducts(prev => prev.map(p => {
            if (p.id === productId) {
                return {
                    ...p,
                    [configType]: {
                        ...p[configType],
                        [field]: value
                    }
                };
            }
            return p;
        }));
    };

    const handleProductImageChange = (productId, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setProducts(prev => prev.map(p => {
                        if (p.id === productId) {
                            return {
                                ...p,
                                countImageFile: reader.result,
                                imagePreview: reader.result
                            };
                        }
                        return p;
                    }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const validateForm = () => {
        let tempErrors = {};
        if (!formData.companyId) tempErrors.companyId = "Company is required.";
        if (!formData.sendDetailsTo) tempErrors.sendDetailsTo = "Send Details To is required.";

        // Validate products array
        products.forEach((product, index) => {
            if (!product.machineId) {
                tempErrors[`product_${product.id}_machineId`] = `Product ${index + 1}: Serial No. is required.`;
            }

            // Validate nested count fields for each product
            const validateCountField = (config, fieldName, label, productIndex) => {
                if (config[fieldName] !== '' && config[fieldName] < 0) {
                    tempErrors[`product_${product.id}_${label}.${fieldName}`] = `Product ${productIndex + 1} - ${label} ${fieldName.replace(/([A-Z])/g, ' $1').trim()} must be a non-negative number.`;
                }
            };

            validateCountField(product.a3Config, 'bwNewCount', 'A3 B/W', index);
            validateCountField(product.a3Config, 'colorNewCount', 'A3 Color', index);
            validateCountField(product.a3Config, 'colorScanningNewCount', 'A3 Color Scanning', index);

            validateCountField(product.a4Config, 'bwNewCount', 'A4 B/W', index);
            validateCountField(product.a4Config, 'colorNewCount', 'A4 Color', index);
            validateCountField(product.a4Config, 'colorScanningNewCount', 'A4 Color Scanning', index);

            validateCountField(product.a5Config, 'bwNewCount', 'A5 B/W', index);
            validateCountField(product.a5Config, 'colorNewCount', 'A5 Color', index);
            validateCountField(product.a5Config, 'colorScanningNewCount', 'A5 Color Scanning', index);
        });

        // Also validate old format for backward compatibility
        if (products.length === 1 && !products[0].machineId && formData.machineId) {
            if (!formData.machineId) tempErrors.machineId = "Serial No. is required.";

            const validateCountField = (config, fieldName, label) => {
                if (config[fieldName] !== '' && config[fieldName] < 0) {
                    tempErrors[`${label}.${fieldName}`] = `${label} ${fieldName.replace(/([A-Z])/g, ' $1').trim()} must be a non-negative number.`;
                }
            };

            validateCountField(formData.a3Config, 'bwNewCount', 'A3 B/W');
            validateCountField(formData.a3Config, 'colorNewCount', 'A3 Color');
            validateCountField(formData.a3Config, 'colorScanningNewCount', 'A3 Color Scanning');

            validateCountField(formData.a4Config, 'bwNewCount', 'A4 B/W');
            validateCountField(formData.a4Config, 'colorNewCount', 'A4 Color');
            validateCountField(formData.a4Config, 'colorScanningNewCount', 'A4 Color Scanning');

            validateCountField(formData.a5Config, 'bwNewCount', 'A5 B/W');
            validateCountField(formData.a5Config, 'colorNewCount', 'A5 Color');
            validateCountField(formData.a5Config, 'colorScanningNewCount', 'A5 Color Scanning');
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleUpdateInvoiceCount = async () => {
        try {
            // The backend endpoint automatically increments by 1, so we don't need to send the count
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details/increment-invoice`,
                {},
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                // Update the local state
                setInvoices(null);
                setInvoiceCount(0);
            }
        } catch (error) {
            console.error('Error updating invoice count:', error);
        }
    }

    const updateStausToRental = async (rentalId, status, totalAmount) => {
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/rental/update/${rentalId}`,
                { status, grandTotal: totalAmount },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                alert(data.message || 'Status Updated successfully!');
            } else {
                alert(data?.message || 'Failed to Status Updated .');
            }
        } catch (err) {
            console.error('Error Status Updated :', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please correct the errors in the form.");
            return;
        }
        try {
            setLoading(true);
            const data = new FormData();
            data.append('rentalId', rentalId || '');
            if (invoiceType !== "quotation") {
                // Invoice number is now generated by the backend from global settings
                // Only send invoiceNumber for quotations or when updating existing invoices
                // data.append('invoiceNumber', invoices);
            }
            // Use companyId from URL params if available, otherwise use formData.companyId
            const finalCompanyId = companyId || formData.companyId;
            if (!finalCompanyId) {
                toast.error("Company is required.");
                setLoading(false);
                return;
            }
            data.append('companyId', finalCompanyId);

            if (!formData.sendDetailsTo) {
                toast.error("Send Details To is required.");
                setLoading(false);
                return;
            }
            data.append('sendDetailsTo', formData.sendDetailsTo);
            data.append('remarks', formData.remarks || '');
            data.append('invoiceDate', formData.invoiceDate ? formData.invoiceDate.toISOString() : new Date().toISOString()); // Add invoice date
            if (employeeName) {
                data.append('assignedTo', employeeName);
            }
            data.append('invoiceType', invoiceType || '');

            // Check if using multiple products or single product (backward compatibility)
            const hasMultipleProducts = products.some(p => p.machineId);
            const useOldFormat = !hasMultipleProducts && formData.machineId;

            if (useOldFormat) {
                // Old format - single product
                data.append('machineId', formData.machineId);
                data.append('a3Config', JSON.stringify(formData.a3Config));
                data.append('a4Config', JSON.stringify(formData.a4Config));
                data.append('a5Config', JSON.stringify(formData.a5Config));
                if (formData.countImageFile) {
                    data.append('countImageUpload', formData.countImageFile);
                }
            } else {
                // New format - multiple products
                const productsArray = products
                    .filter(p => p.machineId) // Only include products with selected machine
                    .map(p => ({
                        machineId: p.machineId,
                        serialNo: p.serialNo,
                        a3Config: p.a3Config,
                        a4Config: p.a4Config,
                        a5Config: p.a5Config,
                        countImageUpload: p.countImageFile || null,
                    }));
                const validatedProducts = productsArray.map(p => {
                    if (p.countImageUpload && typeof p.countImageUpload === 'string') {
                        // Check if base64 string is complete (ends with proper format)
                        const base64Str = p.countImageUpload;
                        // Base64 data URIs should end with the base64 data, not be truncated
                        if (base64Str.length > 1000000) { // If over ~1MB, it might cause issues
                            alert(`Product image is very large it should be less than 1MB Consider compressing.`);
                        }
                    }
                    return p;
                });

                data.append('products', JSON.stringify(productsArray));

                // Also append main image if provided
                if (formData.countImageFile) {
                    data.append('countImageUpload', formData.countImageFile);
                }
            }

            let res;
            if (id) {
                // Update existing entry
                res = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/${id}`, data, {
                    headers: {
                        Authorization: auth.token,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                // Create new entry
                res = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-payment/create-rental-entry`, data, {
                    headers: {
                        Authorization: auth.token,
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            if (res.data?.success) {
                if (!id && invoiceType !== "quotation") {
                    // Invoice count is now incremented automatically by the backend
                    // await handleUpdateInvoiceCount();
                }
                
                // Calculate total amount - handle both single and multiple products
                let totalAmountIncludingGST = null;
                try {
                    if (res.data?.entry) {
                        totalAmountIncludingGST = getTotalRentalInvoicePayment(res.data.entry);
                    } else {
                        console.warn('Entry data not found in response');
                        totalAmountIncludingGST = { totalAmount: '0.00', commissionRate: 0, commissionAmount: '0.00', totalWithCommission: '0.00' };
                    }
                } catch (error) {
                    console.error('Error calculating total amount:', error);
                    totalAmountIncludingGST = { totalAmount: '0.00', commissionRate: 0, commissionAmount: '0.00', totalWithCommission: '0.00' };
                }
                
                if (!id) {
                    await updateStausToRental(rentalId, "Completed", totalAmountIncludingGST?.totalAmount);
                }
                await updateCommissionDetails(res.data?.entry);

                // Update all products
                if (hasMultipleProducts) {
                    await Promise.all(products
                        .filter(p => p.machineId && p.selectedProduct)
                        .map(p => updateRentalProduct(p.selectedProduct, p?.a3Config, p?.a4Config, p?.a5Config))
                    );
                } else if (selectedProduct) {
                    await onUpdateRentalProduct();
                }

                // Reset form
                setProducts([{
                    id: Date.now(),
                    machineId: '',
                    serialNo: '',
                    selectedProduct: null,
                    countImageFile: null,
                    imagePreview: '',
                    basePrice: '',
                    a3Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a4Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a5Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                }]);
                setFormData({
                    companyId: '',
                    machineId: '',
                    sendDetailsTo: '',
                    countImageFile: null,
                    remarks: '',
                    invoiceDate: dayjs(), // Reset to today
                    basePrice: '',
                    a3Config: { bwOldCount: '', bwNewCount: '' },
                    a4Config: { bwOldCount: '', bwNewCount: '' },
                    a5Config: { bwOldCount: '', bwNewCount: '' },
                });
                setLogoPreview("");

                if (invoiceType === "quotation") {
                    navigate('../rentalQuotationList');
                } else {
                    navigate('../rentalInvoiceList');
                }
            } else {
                toast.error(res.data?.message || `Failed to ${id ? 'update' : 'create'} rental payment entry.`);
            }
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} rental payment entry:`, error);
            toast.error(error.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const updateRentalProduct = async (product, a3Config, a4Config, a5Config) => {
        const apiPayload = {
            ...product,
            a3Config: {
                ...product?.a3Config,
                bwOldCount: Number(a3Config.bwNewCount) || 0,
                colorOldCount: Number(a3Config.colorNewCount) || 0,
                colorScanningOldCount: Number(a3Config.colorScanningNewCount) || 0,
            },
            a4Config: {
                ...product?.a4Config,
                bwOldCount: Number(a4Config.bwNewCount) || 0,
                colorOldCount: Number(a4Config.colorNewCount) || 0,
                colorScanningOldCount: Number(a4Config.colorScanningNewCount) || 0,
            },
            a5Config: {
                ...product?.a5Config,
                bwOldCount: Number(a5Config.bwNewCount) || 0,
                colorOldCount: Number(a5Config.colorNewCount) || 0,
                colorScanningOldCount: Number(a5Config.colorScanningNewCount) || 0,
            }
        };
        try {
            await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${product?._id}`, apiPayload);
        } catch (error) {
            console.error('Error updating rental product:', error);
        }
    };

    const onUpdateRentalProduct = async (e) => {
        const apiPayload = {
            ...selectedProduct,
            a3Config: {
                ...selectedProduct?.a3Config,
                bwOldCount: Number(formData?.a3Config.bwNewCount) || 0,
                colorOldCount: Number(formData?.a3Config.colorNewCount) || 0,
                colorScanningOldCount: Number(formData?.a3Config.colorScanningNewCount) || 0,

            },
            a4Config: {
                ...selectedProduct?.a4Config,
                bwOldCount: Number(formData?.a4Config.bwNewCount) || 0,
                colorOldCount: Number(formData.a4Config.colorNewCount) || 0,
                colorScanningOldCount: Number(formData?.a4Config.colorScanningNewCount) || 0,

            },
            a5Config: {
                ...selectedProduct?.a5Config,
                bwOldCount: Number(formData?.a5Config.bwNewCount) || 0,
                colorOldCount: Number(formData?.a5Config.colorNewCount) || 0,
                colorScanningOldCount: Number(formData?.a5Config.colorScanningNewCount) || 0,
            }
        }
        try {
            // Update existing product
            const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/rental-products/${selectedProduct?._id}`, apiPayload);
            if (data?.success) {
                setFormData({
                    companyId: '',
                    machineId: '',
                    sendDetailsTo: '',
                    countImageFile: null,
                    basePrice: '',
                    remarks: '',
                    invoiceDate: dayjs(), // Reset to today
                    a3Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a4Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                    a5Config: { bwOldCount: '', bwNewCount: '', colorOldCount: '', colorNewCount: '', colorScanningOldCount: '', colorScanningNewCount: '' },
                });
                // {{ edit_1 }}
                setLogoPreview(""); // Clear image preview
                if (invoiceType === "quotation") {
                    navigate('../rentalQuotationList');
                } else {
                    navigate('../rentalInvoiceList');
                }
            }
        } catch (error) {
            alert('Something went wrong while saving the rental product.');
        }
    };


    const updateCommissionDetails = async (entry) => {
        try {
            const totalAmountIncludingGST = getTotalRentalInvoicePayment(entry);
            const apiParams = {
                commissionFrom: "Rental",
                userId: auth?.user?._id,
                companyId: entry?.companyId?._id,
                rentalInvoiceId: entry?._id,
                commissionAmount: totalAmountIncludingGST.commissionAmount,
                percentageRate: totalAmountIncludingGST?.commissionRate,
            };

            // Send commission API
            const payment = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/commissions`,
                apiParams,
                { headers: { Authorization: auth?.token } }
            );

        } catch (error) {
            console.error("Commission calc error ❌", error);
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                {id ? 'Edit Rental Payment Entry' : 'Add Rental Payment Entry'}
            </Typography>

            <Paper elevation={3} sx={{ p: 4, borderRadius: '8px' }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <FormControl fullWidth margin="normal" size="small" required error={!!errors.companyId}>
                            <Autocomplete
                                id="companyId-autocomplete"
                                options={companies}
                                getOptionLabel={(option) => option.companyName || ''}
                                isOptionEqualToValue={(option, value) => option._id === value._id}
                                value={companies.find(comp => comp._id === formData.companyId) || null}
                                onChange={(event, newValue) => {
                                    handleChange({ target: { name: 'companyId', value: newValue ? newValue._id : '' } });
                                }}
                                loading={loadingCompanies}
                                disabled={!!id || !!companyId || loadingCompanies} // Disable if in edit mode or loading
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Company"
                                        variant="outlined"
                                        size="small"
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        error={!!errors.companyId}
                                        helperText={errors.companyId || (loadingCompanies ? 'Loading companies...' : '')}
                                    />
                                )}
                            />
                        </FormControl>
                    </Box>

                    {/* Multiple Products Section */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: '#019ee3', fontWeight: 'bold' }}>
                                Products ({products.length})
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={addProduct}
                                disabled={!formData.companyId}
                            >
                                + Add Product
                            </Button>
                        </Box>

                        {products.map((product, productIndex) => (
                            <Paper key={product.id} elevation={2} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#666' }}>
                                        Product {productIndex + 1} {product.serialNo && `- ${product.serialNo}`}
                                    </Typography>
                                    {products.length > 1 && (
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => removeProduct(product.id)}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </Box>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                                    <FormControl fullWidth size="small" error={!!errors[`product_${product.id}_machineId`]}>
                                        <Autocomplete
                                            options={availableProducts}
                                            getOptionLabel={(option) => option.serialNo || ''}
                                            isOptionEqualToValue={(option, value) => option._id === value._id}
                                            value={availableProducts.find(prod => prod._id === product.machineId) || null}
                                            onChange={(event, newValue) => {
                                                handleProductSelect(product.id, newValue);
                                            }}
                                            loading={loading}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Serial No. *"
                                                    variant="outlined"
                                                    size="small"
                                                    error={!!errors[`product_${product.id}_machineId`]}
                                                    helperText={errors[`product_${product.id}_machineId`]}
                                                />
                                            )}
                                            disabled={!formData.companyId || availableProducts.length === 0}
                                        />
                                    </FormControl>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Product Count Image:</Typography>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleProductImageChange(product.id, e)}
                                            style={{ display: 'block', marginBottom: '8px' }}
                                        />
                                        {product.imagePreview ? (
                                            <img
                                                draggable="false"
                                                src={product.imagePreview}
                                                alt="Product Count"
                                                className="w-20 h-20 object-contain"
                                            />
                                        ) : (
                                            <ImageIcon sx={{ fontSize: 40, color: '#ccc' }} />
                                        )}
                                    </Box>
                                </Box>

                                {/* A3 Entry for this product */}
                                {product.a3Config.bwOldCount > 0 || product.a3Config.colorOldCount > 0 || product.a3Config.colorScanningOldCount > 0 ? (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>A3 Entry:</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                            {product.a3Config.bwOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A3 B/W Old Count"
                                                        value={product.a3Config.bwOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A3 B/W New Count"
                                                        value={product.a3Config.bwNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a3Config', 'bwNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A3 B/W.bwNewCount`]}
                                                        helperText={errors[`product_${product.id}_A3 B/W.bwNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a3Config.colorOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A3 Color Old Count"
                                                        value={product.a3Config.colorOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A3 Color New Count"
                                                        value={product.a3Config.colorNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a3Config', 'colorNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A3 Color.colorNewCount`]}
                                                        helperText={errors[`product_${product.id}_A3 Color.colorNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a3Config.colorScanningOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A3 Color Scanning Old Count"
                                                        value={product.a3Config.colorScanningOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A3 Color Scanning New Count"
                                                        value={product.a3Config.colorScanningNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a3Config', 'colorScanningNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A3 Color Scanning.colorScanningNewCount`]}
                                                        helperText={errors[`product_${product.id}_A3 Color Scanning.colorScanningNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                        </Box>
                                    </>
                                ) : null}

                                {/* A4 Entry for this product */}
                                {product.a4Config.bwOldCount > 0 || product.a4Config.colorOldCount > 0 || product.a4Config.colorScanningOldCount > 0 ? (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>A4 Entry:</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                            {product.a4Config.bwOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A4 B/W Old Count"
                                                        value={product.a4Config.bwOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A4 B/W New Count"
                                                        value={product.a4Config.bwNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a4Config', 'bwNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A4 B/W.bwNewCount`]}
                                                        helperText={errors[`product_${product.id}_A4 B/W.bwNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a4Config.colorOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A4 Color Old Count"
                                                        value={product.a4Config.colorOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A4 Color New Count"
                                                        value={product.a4Config.colorNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a4Config', 'colorNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A4 Color.colorNewCount`]}
                                                        helperText={errors[`product_${product.id}_A4 Color.colorNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a4Config.colorScanningOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A4 Color Scanning Old Count"
                                                        value={product.a4Config.colorScanningOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A4 Color Scanning New Count"
                                                        value={product.a4Config.colorScanningNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a4Config', 'colorScanningNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A4 Color Scanning.colorScanningNewCount`]}
                                                        helperText={errors[`product_${product.id}_A4 Color Scanning.colorScanningNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                        </Box>
                                    </>
                                ) : null}

                                {/* A5 Entry for this product */}
                                {product.a5Config.bwOldCount > 0 || product.a5Config.colorOldCount > 0 || product.a5Config.colorScanningOldCount > 0 ? (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>A5 Entry:</Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                                            {product.a5Config.bwOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A5 B/W Old Count"
                                                        value={product.a5Config.bwOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A5 B/W New Count"
                                                        value={product.a5Config.bwNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a5Config', 'bwNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A5 B/W.bwNewCount`]}
                                                        helperText={errors[`product_${product.id}_A5 B/W.bwNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a5Config.colorOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A5 Color Old Count"
                                                        value={product.a5Config.colorOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A5 Color New Count"
                                                        value={product.a5Config.colorNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a5Config', 'colorNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A5 Color.colorNewCount`]}
                                                        helperText={errors[`product_${product.id}_A5 Color.colorNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                            {product.a5Config.colorScanningOldCount > 0 && (
                                                <>
                                                    <TextField
                                                        fullWidth
                                                        label="A5 Color Scanning Old Count"
                                                        value={product.a5Config.colorScanningOldCount}
                                                        disabled
                                                        size="small"
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <TextField
                                                        fullWidth
                                                        label="A5 Color Scanning New Count"
                                                        value={product.a5Config.colorScanningNewCount}
                                                        onChange={(e) => handleProductConfigChange(product.id, 'a5Config', 'colorScanningNewCount', e.target.value)}
                                                        type="number"
                                                        size="small"
                                                        error={!!errors[`product_${product.id}_A5 Color Scanning.colorScanningNewCount`]}
                                                        helperText={errors[`product_${product.id}_A5 Color Scanning.colorScanningNewCount`]}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                </>
                                            )}
                                        </Box>
                                    </>
                                ) : null}
                            </Paper>
                        ))}
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
                        <FormControl fullWidth size="small" error={!!errors.sendDetailsTo}>
                            <InputLabel id="send-details-to-label" required>Send Details To</InputLabel>
                            <Select
                                labelId="send-details-to-label"
                                id="sendDetailsTo"
                                name="sendDetailsTo"
                                value={formData.sendDetailsTo}
                                label="Send Details To"
                                onChange={handleChange}
                                disabled={!formData.companyId || contactOptions.length === 0}
                            >
                                <MenuItem value="">
                                    <em>Select Option</em>
                                </MenuItem>
                                {contactOptions?.map((option, index) => (
                                    <MenuItem key={index} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.sendDetailsTo && <FormHelperText>{errors.sendDetailsTo}</FormHelperText>}
                        </FormControl>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Invoice Date"
                                value={formData.invoiceDate}
                                onChange={(newValue) => {
                                    setFormData(prev => ({ ...prev, invoiceDate: newValue }));
                                }}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        size: 'small',
                                        margin: 'normal',
                                    },
                                }}
                            />
                        </LocalizationProvider>

                        {/* <Box>
                            <Typography variant="subtitle1" gutterBottom>Count Image Upload:</Typography>
                            <input
                                type="file"
                                accept="image/*"
                                name="countImageUpload"
                                onChange={handleImagehange}
                                className="hidden"
                                style={{ display: 'block', marginBottom: '8px' }}
                            />
                            {!logoPreview ? (
                                <ImageIcon />
                            ) : (
                                <img
                                    draggable="false"
                                    src={logoPreview}
                                    alt="Brand Logo"
                                    className="w-20 h-20 object-contain"
                                />
                            )}
                            {errors.countImageFile && <FormHelperText error>{errors.countImageFile}</FormHelperText>}
                        </Box> */}
                    </Box>


                    <TextField
                        fullWidth
                        label="Remarks"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        sx={{ mb: 3 }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? <CircularProgress size={24} /> : (id ? 'Update Rental Entry' : 'Submit Rental Entry')}
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default RentalInvoiceForm;