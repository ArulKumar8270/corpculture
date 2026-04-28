import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/auth';
import {
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Grid,
    Box,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const EmployeeActivityLogForm = () => {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedCompany = location.state?.preselectedCompany;
    const editLogId = location.state?.editLogId;
    const isAdmin = Number(auth?.user?.role) === 1;
    const [petrolPricePerKm, setPetrolPricePerKm] = useState(0);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editLogRaw, setEditLogRaw] = useState(null);

    /** Address rows for a single company (delivery addresses, else billing). */
    const getAddressOptionsForCompany = useCallback((company) => {
        if (!company) return [];
        const opts = [];
        const deliveries = Array.isArray(company.serviceDeliveryAddresses)
            ? company.serviceDeliveryAddresses
            : [];
        if (deliveries.length > 0) {
            deliveries.forEach((addr, idx) => {
                const addrLine = (addr?.address || '').trim();
                if (!addrLine) return;
                opts.push({
                    _id: `${company._id}_addr_${idx}`,
                    companyId: company._id,
                    companyName: company.companyName || '',
                    addressLine: addrLine,
                    pincode: addr?.pincode || '',
                    label: `${addrLine}${addr?.pincode ? ` (${addr.pincode})` : ''}`,
                });
            });
        } else {
            const bill = (company.billingAddress || '').trim();
            if (bill) {
                opts.push({
                    _id: `${company._id}_billing`,
                    companyId: company._id,
                    companyName: company.companyName || '',
                    addressLine: bill,
                    pincode: company.pincode || '',
                    label: `${bill}${company.pincode ? ` (${company.pincode})` : ''}`,
                });
            }
        }
        return opts;
    }, []);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        km: '',
        inTime: '',
        outTime: '',
        callType: '',
        leaveOrWork: '',
        assignedTo: '',
        remarks: '',
    });

    /** Step 1: company · Step 2: address for that company */
    const [routeDraft, setRouteDraft] = useState({
        fromCompany: null,
        fromAddress: null,
        toCompany: null,
        toAddress: null,
    });

    const callTypes = [
        'NEW SERVICE CALLS',
        'PENDING CALLS',
        'REWORK CALLS',
        'DELIVERY CALLS',
        'CHEQUE COLLATION',
        'BILL SIGNATURE',
    ];

    const leaveOrWorkOptions = ['LEAVE', 'WORK'];

    useEffect(() => {
        if (auth?.token) fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.token]);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const { data } = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/common-details`,
                    { headers: { Authorization: auth?.token } }
                );
                if (data?.success) {
                    const v = Number(data?.commonDetails?.petrolPricePerKm || 0);
                    setPetrolPricePerKm(Number.isFinite(v) ? v : 0);
                }
            } catch {
                setPetrolPricePerKm(0);
            }
        };
        if (auth?.token) fetchPrice();
    }, [auth?.token]);

    const calcAmount = (km) => {
        const n = Number(km);
        if (!Number.isFinite(n)) return 0;
        return n * petrolPricePerKm;
    };

    const getAmountForCurrentKm = useCallback(() => {
        const v = calcAmount(formData.km);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    }, [formData.km, petrolPricePerKm]);

    const isKmChangedOnEdit = useCallback(() => {
        if (!editLogId) return false;
        const currentKm = Number(formData.km);
        const originalKm = Number(editLogRaw?.km);
        if (!Number.isFinite(currentKm) || !Number.isFinite(originalKm)) return false;
        return currentKm !== originalKm;
    }, [editLogId, formData.km, editLogRaw?.km]);

    const getAmountDisplayValue = useCallback(() => {
        // If KM changed while editing, show recalculated amount
        if (isKmChangedOnEdit()) {
            return petrolPricePerKm > 0 && formData.km !== ''
                ? getAmountForCurrentKm().toFixed(2)
                : '';
        }

        // Otherwise show stored DB amount on edit (if available)
        if (editLogId) {
            const stored = Number(editLogRaw?.petrolAmount);
            if (Number.isFinite(stored)) return stored.toFixed(2);
        }

        // Create mode (or legacy): compute from current KM + settings
        return petrolPricePerKm > 0 && formData.km !== ''
            ? getAmountForCurrentKm().toFixed(2)
            : '';
    }, [
        editLogId,
        editLogRaw?.petrolAmount,
        formData.km,
        petrolPricePerKm,
        getAmountForCurrentKm,
        isKmChangedOnEdit,
    ]);

    const getAmountHelperText = useCallback(() => {
        if (editLogId) {
            if (isKmChangedOnEdit()) {
                return petrolPricePerKm > 0
                    ? `Updated as KM × ₹${petrolPricePerKm}/KM`
                    : 'Set Petrol Price (₹/KM) in Settings to calculate amount';
            }
            return 'Saved amount from DB';
        }
        return petrolPricePerKm > 0
            ? `Calculated as KM × ₹${petrolPricePerKm}/KM`
            : 'Set Petrol Price (₹/KM) in Settings to calculate amount';
    }, [editLogId, petrolPricePerKm, isKmChangedOnEdit]);

    const petrolAmountForPayload = useCallback(() => {
        // Always send amount that matches the current KM input (if settings present),
        // else fall back to stored DB value on edit, else 0.
        if (petrolPricePerKm > 0 && formData.km !== '') return getAmountForCurrentKm();
        const stored = Number(editLogRaw?.petrolAmount);
        if (editLogId && Number.isFinite(stored) && stored >= 0) return stored;
        return 0;
    }, [editLogId, editLogRaw?.petrolAmount, formData.km, petrolPricePerKm, getAmountForCurrentKm]);

    const fetchCompanies = async () => {
        try {
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/company/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (data?.success) {
                const list = data.companies || [];
                setCompanies(list);
                if (preselectedCompany) {
                    const id =
                        typeof preselectedCompany === 'object'
                            ? preselectedCompany._id
                            : preselectedCompany;
                    const company = list.find((c) => c._id === id);
                    if (company) {
                        const addrOpts = getAddressOptionsForCompany(company);
                        setRouteDraft((prev) => ({
                            ...prev,
                            fromCompany: company,
                            fromAddress: addrOpts[0] || null,
                        }));
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to fetch companies');
        }
    };

    const hydrateAddressForCompany = (company, addressLine, pincode, fallbackId) => {
        if (!company) return null;
        const opts = getAddressOptionsForCompany(company);
        const found = opts.find(
            (o) =>
                String(o.addressLine || '').trim() === String(addressLine || '').trim() &&
                String(o.pincode || '').trim() === String(pincode || '').trim()
        );
        if (found) return found;
        if (!addressLine) return null;
        return {
            _id: fallbackId || `${company._id}_existing`,
            companyId: company._id,
            companyName: company.companyName || '',
            addressLine: String(addressLine || ''),
            pincode: String(pincode || ''),
            label: `${String(addressLine || '')}${pincode ? ` (${pincode})` : ''}`,
        };
    };

    const findCompanyFromList = useCallback(
        (companyId, companyName) => {
            const id = companyId != null ? String(companyId) : '';
            if (id) {
                const byId = companies.find((c) => String(c?._id) === id);
                if (byId) return byId;
            }
            const name = String(companyName || '').trim().toLowerCase();
            if (name) {
                const byName = companies.find(
                    (c) => String(c?.companyName || '').trim().toLowerCase() === name
                );
                if (byName) return byName;
                const byIncludes = companies.find((c) =>
                    String(c?.companyName || '').trim().toLowerCase().includes(name)
                );
                if (byIncludes) return byIncludes;
            }
            return null;
        },
        [companies]
    );

    const companyOptions = useMemo(() => {
        const list = Array.isArray(companies) ? [...companies] : [];
        const addIfMissing = (c) => {
            if (!c) return;
            const id = String(c?._id || '');
            const name = String(c?.companyName || '').trim().toLowerCase();
            const exists = list.some(
                (x) =>
                    (id && String(x?._id || '') === id) ||
                    (name &&
                        String(x?.companyName || '').trim().toLowerCase() === name)
            );
            if (!exists) list.push(c);
        };
        addIfMissing(routeDraft.fromCompany);
        addIfMissing(routeDraft.toCompany);
        return list;
    }, [companies, routeDraft.fromCompany, routeDraft.toCompany]);

    const fromAddressOptions = useMemo(() => {
        const base = routeDraft.fromCompany ? getAddressOptionsForCompany(routeDraft.fromCompany) : [];
        const val = routeDraft.fromAddress;
        if (val && !base.some((o) => String(o?._id || '') === String(val?._id || ''))) {
            return [val, ...base];
        }
        return base;
    }, [routeDraft.fromCompany, routeDraft.fromAddress, getAddressOptionsForCompany]);

    const toAddressOptions = useMemo(() => {
        const base = routeDraft.toCompany ? getAddressOptionsForCompany(routeDraft.toCompany) : [];
        const val = routeDraft.toAddress;
        if (val && !base.some((o) => String(o?._id || '') === String(val?._id || ''))) {
            return [val, ...base];
        }
        return base;
    }, [routeDraft.toCompany, routeDraft.toAddress, getAddressOptionsForCompany]);

    const fetchLogForEdit = useCallback(
        async (id) => {
            if (!auth?.token || !id) return;
            try {
                setLoading(true);
                const url = isAdmin
                    ? `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/admin/${id}`
                    : `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/${id}`;
                const { data } = await axios.get(url, {
                    headers: { Authorization: auth?.token },
                });
                if (!data?.success || !data?.activityLog) {
                    toast.error(data?.message || 'Failed to load activity log');
                    return;
                }

                const log = data.activityLog;
                setEditLogRaw(log);
                setFormData((prev) => ({
                    ...prev,
                    date: log?.date ? new Date(log.date).toISOString().split('T')[0] : prev.date,
                    km: log?.km ?? '',
                    inTime: log?.inTime ?? '',
                    outTime: log?.outTime ?? '',
                    callType: log?.callType ?? '',
                    remarks: log?.remarks ?? '',
                }));

                // Hydrate From/To immediately from DB values (so edit shows even if companies not loaded)
                const fromCompanyId = (log.fromCompany?._id || log.fromCompany)?.toString();
                const toCompanyId = (log.toCompany?._id || log.toCompany)?.toString();
                const fromCompanyObj =
                    findCompanyFromList(fromCompanyId, log.fromCompanyName) ||
                    (fromCompanyId || log.fromCompanyName
                        ? {
                              _id: fromCompanyId || 'from_legacy',
                              companyName: log.fromCompanyName || '—',
                          }
                        : null);
                const toCompanyObj =
                    findCompanyFromList(toCompanyId, log.toCompanyName) ||
                    (toCompanyId || log.toCompanyName
                        ? {
                              _id: toCompanyId || 'to_legacy',
                              companyName: log.toCompanyName || '—',
                          }
                        : null);

                const fromAddr =
                    hydrateAddressForCompany(
                        companies.some((c) => String(c?._id) === String(fromCompanyObj?._id))
                            ? fromCompanyObj
                            : null,
                        log.fromAddressLine,
                        log.fromPincode,
                        `${fromCompanyId || 'from'}_existing`
                    ) ||
                    (log.fromAddressLine
                        ? {
                              _id: `${fromCompanyId || 'from'}_existing`,
                              companyId: fromCompanyId || null,
                              companyName: log.fromCompanyName || fromCompanyObj?.companyName || '',
                              addressLine: String(log.fromAddressLine || ''),
                              pincode: String(log.fromPincode || ''),
                              label: `${String(log.fromAddressLine || '')}${
                                  log.fromPincode ? ` (${log.fromPincode})` : ''
                              }`,
                          }
                        : null);

                const toAddr =
                    hydrateAddressForCompany(
                        companies.some((c) => String(c?._id) === String(toCompanyObj?._id))
                            ? toCompanyObj
                            : null,
                        log.toAddressLine,
                        log.toPincode,
                        `${toCompanyId || 'to'}_existing`
                    ) ||
                    (log.toAddressLine
                        ? {
                              _id: `${toCompanyId || 'to'}_existing`,
                              companyId: toCompanyId || null,
                              companyName: log.toCompanyName || toCompanyObj?.companyName || '',
                              addressLine: String(log.toAddressLine || ''),
                              pincode: String(log.toPincode || ''),
                              label: `${String(log.toAddressLine || '')}${
                                  log.toPincode ? ` (${log.toPincode})` : ''
                              }`,
                          }
                        : null);

                setRouteDraft({
                    fromCompany: fromCompanyObj,
                    fromAddress: fromAddr,
                    toCompany: toCompanyObj,
                    toAddress: toAddr,
                });
            } catch (error) {
                console.error('Error loading activity log:', error);
                toast.error(error.response?.data?.message || 'Failed to load activity log');
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [auth?.token, isAdmin, companies, getAddressOptionsForCompany, findCompanyFromList]
    );

    useEffect(() => {
        if (editLogId) fetchLogForEdit(editLogId);
    }, [editLogId, companies.length, fetchLogForEdit]);

    useEffect(() => {
        if (!editLogId || !editLogRaw) return;

        const log = editLogRaw;
        const fromCompanyId = (log.fromCompany?._id || log.fromCompany)?.toString();
        const toCompanyId = (log.toCompany?._id || log.toCompany)?.toString();
        const fromCompanyObj =
            findCompanyFromList(fromCompanyId, log.fromCompanyName) ||
            (fromCompanyId || log.fromCompanyName
                ? {
                      _id: fromCompanyId || 'from_legacy',
                      companyName: log.fromCompanyName || '—',
                  }
                : null);
        const toCompanyObj =
            findCompanyFromList(toCompanyId, log.toCompanyName) ||
            (toCompanyId || log.toCompanyName
                ? {
                      _id: toCompanyId || 'to_legacy',
                      companyName: log.toCompanyName || '—',
                  }
                : null);

        const fromAddr =
            hydrateAddressForCompany(
                companies.some((c) => String(c?._id) === String(fromCompanyObj?._id))
                    ? fromCompanyObj
                    : null,
                log.fromAddressLine,
                log.fromPincode,
                `${fromCompanyId || 'from'}_existing`
            ) ||
            (log.fromAddressLine
                ? {
                      _id: `${fromCompanyId || 'from'}_existing`,
                      companyId: fromCompanyId || null,
                      companyName: log.fromCompanyName || fromCompanyObj?.companyName || '',
                      addressLine: String(log.fromAddressLine || ''),
                      pincode: String(log.fromPincode || ''),
                      label: `${String(log.fromAddressLine || '')}${
                          log.fromPincode ? ` (${log.fromPincode})` : ''
                      }`,
                  }
                : null);

        const toAddr =
            hydrateAddressForCompany(
                companies.some((c) => String(c?._id) === String(toCompanyObj?._id))
                    ? toCompanyObj
                    : null,
                log.toAddressLine,
                log.toPincode,
                `${toCompanyId || 'to'}_existing`
            ) ||
            (log.toAddressLine
                ? {
                      _id: `${toCompanyId || 'to'}_existing`,
                      companyId: toCompanyId || null,
                      companyName: log.toCompanyName || toCompanyObj?.companyName || '',
                      addressLine: String(log.toAddressLine || ''),
                      pincode: String(log.toPincode || ''),
                      label: `${String(log.toAddressLine || '')}${
                          log.toPincode ? ` (${log.toPincode})` : ''
                      }`,
                  }
                : null);

        setRouteDraft({
            fromCompany: fromCompanyObj,
            fromAddress: fromAddr,
            toCompany: toCompanyObj,
            toAddress: toAddr,
        });
    }, [editLogId, editLogRaw, companies, findCompanyFromList, hydrateAddressForCompany]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFromCompanyChange = (event, newCompany) => {
        setRouteDraft((prev) => ({
            ...prev,
            fromCompany: newCompany,
            fromAddress: null,
        }));
    };

    const handleFromAddressChange = (event, newAddr) => {
        setRouteDraft((prev) => ({ ...prev, fromAddress: newAddr }));
    };

    const handleToCompanyChange = (event, newCompany) => {
        setRouteDraft((prev) => ({
            ...prev,
            toCompany: newCompany,
            toAddress: null,
        }));
    };

    const handleToAddressChange = (event, newAddr) => {
        setRouteDraft((prev) => ({ ...prev, toAddress: newAddr }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.date) {
            toast.error('Please select a date');
            return;
        }

        const fromAddr = routeDraft.fromAddress;
        const toAddr = routeDraft.toAddress;
        if (!routeDraft.fromCompany || !fromAddr) {
            toast.error('Please select From company and address');
            return;
        }
        if (!routeDraft.toCompany || !toAddr) {
            toast.error('Please select To company and address');
            return;
        }
        if (fromAddr._id === toAddr._id) {
            toast.error('From and To cannot be the same address');
            return;
        }

        try {
            setLoading(true);
            const endpoint = editLogId
                ? isAdmin
                    ? `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/admin/update/${editLogId}`
                    : `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/update/${editLogId}`
                : `${import.meta.env.VITE_SERVER_URL}/api/v1/employee-activity-log/create`;

            const method = editLogId ? 'put' : 'post';
            const { data } = await axios[method](
                endpoint,
                {
                    ...formData,
                    fromCompany: fromAddr.companyId,
                    fromCompanyName: fromAddr.companyName || '',
                    fromAddressLine: fromAddr.addressLine || '',
                    fromPincode: fromAddr.pincode || '',
                    toCompany: toAddr.companyId,
                    toCompanyName: toAddr.companyName || '',
                    toAddressLine: toAddr.addressLine || '',
                    toPincode: toAddr.pincode || '',
                    petrolAmount: petrolAmountForPayload(),
                },
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );

            if (data?.success) {
                toast.success(editLogId ? 'Activity log updated successfully' : 'Activity log created successfully');
                if (editLogId) {
                    navigate(-1);
                } else {
                    setFormData({
                        date: new Date().toISOString().split('T')[0],
                        km: '',
                        inTime: '',
                        outTime: '',
                        callType: '',
                        leaveOrWork: '',
                        assignedTo: '',
                        remarks: '',
                    });
                    setRouteDraft({
                        fromCompany: null,
                        fromAddress: null,
                        toCompany: null,
                        toAddress: null,
                    });
                }
            } else {
                toast.error(data?.message || 'Failed to create activity log');
            }
        } catch (error) {
            console.error('Error creating activity log:', error);
            toast.error(
                error.response?.data?.message || 'Failed to create activity log'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold">
                    {editLogId ? 'Edit Activity Log' : 'Employee Activity Log'}
                </h1>
                {editLogId ? (
                    <Button variant="outlined" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                ) : null}
            </div>

            <Paper className="p-6 shadow-md">
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Date */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        {/* From: company first, then address */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                options={companyOptions}
                                getOptionLabel={(option) =>
                                    option?.companyName || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    String(option?._id || '') === String(value?._id || '') ||
                                    String(option?.companyName || '').trim().toLowerCase() ===
                                        String(value?.companyName || '').trim().toLowerCase()
                                }
                                value={routeDraft.fromCompany}
                                onChange={handleFromCompanyChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="From — Company"
                                        variant="outlined"
                                        placeholder="Select company first"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                disabled={!routeDraft.fromCompany}
                                options={fromAddressOptions}
                                getOptionLabel={(option) => option?.label || ''}
                                isOptionEqualToValue={(option, value) =>
                                    String(option?._id || '') === String(value?._id || '')
                                }
                                value={routeDraft.fromAddress}
                                onChange={handleFromAddressChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="From — Address"
                                        variant="outlined"
                                        placeholder={
                                            routeDraft.fromCompany
                                                ? 'Select address'
                                                : 'Select company first'
                                        }
                                        helperText={
                                            routeDraft.fromCompany &&
                                            getAddressOptionsForCompany(
                                                routeDraft.fromCompany
                                            ).length === 0
                                                ? 'No addresses for this company (add in company profile)'
                                                : undefined
                                        }
                                    />
                                )}
                            />
                        </Grid>

                        {/* To: company first, then address */}
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                options={companyOptions}
                                getOptionLabel={(option) =>
                                    option?.companyName || ''
                                }
                                isOptionEqualToValue={(option, value) =>
                                    String(option?._id || '') === String(value?._id || '') ||
                                    String(option?.companyName || '').trim().toLowerCase() ===
                                        String(value?.companyName || '').trim().toLowerCase()
                                }
                                value={routeDraft.toCompany}
                                onChange={handleToCompanyChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="To — Company"
                                        variant="outlined"
                                        placeholder="Select company first"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fullWidth
                                disabled={!routeDraft.toCompany}
                                options={toAddressOptions}
                                getOptionLabel={(option) => option?.label || ''}
                                isOptionEqualToValue={(option, value) =>
                                    String(option?._id || '') === String(value?._id || '')
                                }
                                value={routeDraft.toAddress}
                                onChange={handleToAddressChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="To — Address"
                                        variant="outlined"
                                        placeholder={
                                            routeDraft.toCompany
                                                ? 'Select address'
                                                : 'Select company first'
                                        }
                                        helperText={
                                            routeDraft.toCompany &&
                                            getAddressOptionsForCompany(
                                                routeDraft.toCompany
                                            ).length === 0
                                                ? 'No addresses for this company (add in company profile)'
                                                : undefined
                                        }
                                    />
                                )}
                            />
                        </Grid>

                        {/* KM */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="KM"
                                name="km"
                                type="number"
                                value={formData.km}
                                onChange={handleInputChange}
                                inputProps={{ min: 0 }}
                            />
                        </Grid>

                        {/* Amount (auto) */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Amount (₹)"
                                value={getAmountDisplayValue()}
                                InputProps={{ readOnly: true }}
                                helperText={getAmountHelperText()}
                            />
                        </Grid>

                        {/* In Time */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="In Time"
                                name="inTime"
                                type="time"
                                value={formData.inTime}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Out Time */}
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Out Time"
                                name="outTime"
                                type="time"
                                value={formData.outTime}
                                onChange={handleInputChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {/* Call Type */}
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Call Type</InputLabel>
                                <Select
                                    name="callType"
                                    value={formData.callType}
                                    onChange={handleInputChange}
                                    label="Call Type"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {callTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Leave/Work */}
                        {/* <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Leave/Work</InputLabel>
                                <Select
                                    name="leaveOrWork"
                                    value={formData.leaveOrWork}
                                    onChange={handleInputChange}
                                    label="Leave/Work"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {leaveOrWorkOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid> */}

                        {/* Remarks */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Remarks"
                                name="remarks"
                                multiline
                                rows={3}
                                value={formData.remarks}
                                onChange={handleInputChange}
                            />
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="flex-end" gap={2}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

        </div>
    );
};

export default EmployeeActivityLogForm;

