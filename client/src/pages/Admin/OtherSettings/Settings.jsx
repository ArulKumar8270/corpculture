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
    const [saving, setSaving] = useState(false);
    const [savingInvoiceFormat, setSavingInvoiceFormat] = useState(false);
    const [settings, setSettings] = useState({
        globalInvoiceFormat: '',
        fromMail: '',
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
                    fromMail: settings.fromMail, // Keep existing fromMail value
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasPermission('otherSettingsSettings')) {
            toast.error('You do not have permission to update settings');
            return;
        }

        try {
            setSaving(true);
            const { data } = await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                {
                    globalInvoiceFormat: settings.globalInvoiceFormat,
                    fromMail: settings.fromMail,
                },
                {
                    headers: {
                        Authorization: auth.token,
                    },
                }
            );
            if (data?.success) {
                toast.success('Settings updated successfully!');
            } else {
                toast.error(data?.message || 'Failed to update settings');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setSaving(false);
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
                <form onSubmit={handleSubmit}>
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
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={saving}
                            sx={{ mt: 3 }}
                        >
                            {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                        </Button>
                    )}
                </form>
            </Paper>
        </Box>
    );
};

export default Settings;

