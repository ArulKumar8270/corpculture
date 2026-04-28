import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel
} from '@mui/material';
import { useAuth } from '../../../context/auth';

const Settings = () => {
    const { auth, userPermissions } = useAuth();
    const [loading, setLoading] = useState(false);
    const [savingInvoiceFormat, setSavingInvoiceFormat] = useState(false);
    const [savingFromMail, setSavingFromMail] = useState(false);
    const [savingPetrolPrice, setSavingPetrolPrice] = useState(false);
    const [settings, setSettings] = useState({
        globalInvoiceFormat: '',
        fromMail: '',
        petrolPricePerKm: '',
    });
    const [mailInputType, setMailInputType] = useState('select'); // 'select' or 'custom'

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                const savedMail = data.commonDetails?.fromMail || '';
                const predefinedMails = [
                    'noreply@corpculture.com',
                    'support@corpculture.com',
                    'invoices@corpculture.com',
                    'admin@corpculture.com'
                ];
                setSettings({
                    globalInvoiceFormat: data.commonDetails?.globalInvoiceFormat || '',
                    fromMail: savedMail,
                    petrolPricePerKm:
                        data.commonDetails?.petrolPricePerKm !== undefined &&
                        data.commonDetails?.petrolPricePerKm !== null
                            ? String(data.commonDetails.petrolPricePerKm)
                            : '',
                });
                // Determine if saved mail is predefined or custom
                setMailInputType(predefinedMails.includes(savedMail) ? 'select' : 'custom');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to fetch settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveInvoiceFormat = async () => {
        if (!hasPermission('otherSettingsSettings')) {
            toast.error('You do not have permission to update settings');
            return;
        }

        try {
            setSavingInvoiceFormat(true);
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                {
                    globalInvoiceFormat: settings.globalInvoiceFormat,
                    // Save invoice format only
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                toast.success('Global Invoice Format updated successfully!');
            } else {
                toast.error(data?.message || 'Failed to update invoice format');
            }
        } catch (error) {
            console.error('Error updating invoice format:', error);
            toast.error(error.response?.data?.message || 'Failed to update invoice format');
        } finally {
            setSavingInvoiceFormat(false);
        }
    };

    const handleSaveFromMail = async () => {
        if (!hasPermission('otherSettingsSettings')) {
            toast.error('You do not have permission to update settings');
            return;
        }

        try {
            setSavingFromMail(true);
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                {
                    fromMail: settings.fromMail,
                    // Save fromMail only
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                toast.success('From Mail updated successfully!');
            } else {
                toast.error(data?.message || 'Failed to update From Mail');
            }
        } catch (error) {
            console.error('Error updating from mail:', error);
            toast.error(error.response?.data?.message || 'Failed to update From Mail');
        } finally {
            setSavingFromMail(false);
        }
    };

    const handleSavePetrolPrice = async () => {
        if (!hasPermission('otherSettingsSettings')) {
            toast.error('You do not have permission to update settings');
            return;
        }
        try {
            setSavingPetrolPrice(true);
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                {
                    petrolPricePerKm:
                        settings.petrolPricePerKm === ''
                            ? 0
                            : Number(settings.petrolPricePerKm),
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                toast.success('Petrol Price updated successfully!');
            } else {
                toast.error(data?.message || 'Failed to update Petrol Price');
            }
        } catch (error) {
            console.error('Error updating petrol price:', error);
            toast.error(error.response?.data?.message || 'Failed to update Petrol Price');
        } finally {
            setSavingPetrolPrice(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: '#019ee3', fontWeight: 'bold' }}>
                Settings
            </Typography>

            <Paper elevation={3} sx={{ p: 3, borderRadius: '8px', maxWidth: 800 }}>
                <form onSubmit={(e) => e.preventDefault()}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#019ee3' }}>
                        Global Settings
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Global Invoice Format"
                            name="globalInvoiceFormat"
                            value={settings.globalInvoiceFormat}
                            onChange={handleChange}
                            variant="outlined"
                            size="small"
                            placeholder="e.g., CC1001"
                            helperText="Enter invoice format pattern (e.g., CC1001). This can be changed yearly."
                            sx={{ flex: 1 }}
                        />
                        {hasPermission('otherSettingsSettings') && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSaveInvoiceFormat}
                                disabled={savingInvoiceFormat}
                                sx={{ mt: 2, minWidth: 120 }}
                            >
                                {savingInvoiceFormat ? <CircularProgress size={24} /> : 'Save Format'}
                            </Button>
                        )}
                    </Box>

                    <FormControl component="fieldset" fullWidth margin="normal">
                        <FormLabel component="legend" sx={{ mb: 1 }}>From Mail</FormLabel>
                        <RadioGroup
                            row
                            value={mailInputType}
                            onChange={(e) => {
                                setMailInputType(e.target.value);
                                if (e.target.value === 'select') {
                                    setSettings(prev => ({ ...prev, fromMail: '' }));
                                }
                            }}
                        >
                            <FormControlLabel value="select" control={<Radio />} label="Select from list" />
                            <FormControlLabel value="custom" control={<Radio />} label="Custom email" />
                        </RadioGroup>
                    </FormControl>

                    {mailInputType === 'select' ? (
                        <FormControl fullWidth margin="normal" size="small">
                            <InputLabel id="from-mail-label">From Mail</InputLabel>
                            <Select
                                labelId="from-mail-label"
                                id="fromMail"
                                name="fromMail"
                                value={settings.fromMail}
                                onChange={handleChange}
                                label="From Mail"
                            >
                                <MenuItem value="">--Select Mail--</MenuItem>
                                <MenuItem value="noreply@corpculture.com">noreply@corpculture.com</MenuItem>
                                <MenuItem value="support@corpculture.com">support@corpculture.com</MenuItem>
                                <MenuItem value="invoices@corpculture.com">invoices@corpculture.com</MenuItem>
                                <MenuItem value="admin@corpculture.com">admin@corpculture.com</MenuItem>
                            </Select>
                        </FormControl>
                    ) : (
                        <TextField
                            fullWidth
                            margin="normal"
                            label="From Mail"
                            name="fromMail"
                            type="email"
                            value={settings.fromMail}
                            onChange={handleChange}
                            variant="outlined"
                            size="small"
                            placeholder="Enter custom email address"
                            helperText="Enter a valid email address"
                        />
                    )}
                    {hasPermission('otherSettingsSettings') && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveFromMail}
                            disabled={savingFromMail}
                            sx={{ mt: 1 }}
                        >
                            {savingFromMail ? <CircularProgress size={24} /> : 'Save From Mail'}
                        </Button>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mt: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Petrol Price (₹ per KM)"
                            name="petrolPricePerKm"
                            type="number"
                            inputProps={{ min: 0, step: '0.01' }}
                            value={settings.petrolPricePerKm}
                            onChange={handleChange}
                            variant="outlined"
                            size="small"
                            placeholder="e.g., 12"
                            helperText="Used to calculate Petrol Form Report amount = KM × price."
                            sx={{ flex: 1 }}
                        />
                        {hasPermission('otherSettingsSettings') && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSavePetrolPrice}
                                disabled={savingPetrolPrice}
                                sx={{ mt: 2, minWidth: 160 }}
                            >
                                {savingPetrolPrice ? <CircularProgress size={24} /> : 'Save Petrol Price'}
                            </Button>
                        )}
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default Settings;

