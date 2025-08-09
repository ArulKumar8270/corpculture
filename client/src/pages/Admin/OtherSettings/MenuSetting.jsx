import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Button, Paper, Typography, FormGroup } from '@mui/material';
import { useAuth } from '../../../context/auth';
// Define the structure of your menu for permission management
// This should ideally match the navigation structure in AdminMenu.jsx
const menuStructure = [
    {
        name: "Account Settings",
        key: "accountSettings",
        permissions: ['view', 'edit'], // Define relevant permissions for this section
        subItems: [
            { name: "Profile Information", key: "profileInformation", permissions: ['view', 'edit'] }
        ]
    },
    {
        name: "Admin Dashboard",
        key: "adminDashboard",
        permissions: ['view'],
        subItems: [
            {
                name: "Sales",
                key: "sales",
                permissions: ['view', 'add', 'edit', 'delete'],
                subItems: [
                    { name: "All Products", key: "salesAllProducts", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "All Category", key: "salesAllCategory", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Orders", key: "salesOrders", permissions: ['view', 'edit'] },
                    { name: "Commission", key: "salesCommission", permissions: ['view'] },
                ]
            },
            {
                name: "Service",
                key: "service",
                permissions: ['view', 'add', 'edit', 'delete'],
                subItems: [
                    { name: "Service Enquiries", key: "serviceEnquiries", permissions: ['view', 'edit'] },
                    { name: "Commission", key: "serviceCommission", permissions: ['view'] },
                    { name: "All Products", key: "serviceAllProducts", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Invoice", key: "serviceInvoice", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Quotation", key: "serviceQuotation", permissions: ['view', 'add', 'edit', 'delete'] },
                ]
            },
            {
                name: "Rental",
                key: "rental",
                permissions: ['view', 'add', 'edit', 'delete'],
                subItems: [
                    { name: "Rental Enquiries", key: "rentalEnquiries", permissions: ['view'] },
                    { name: "All Products", key: "rentalAllProducts", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Invoice", key: "rentalInvoice", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Quotation", key: "rentalQuotation", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Commission", key: "rentalCommission", permissions: ['view'] },
                ]
            },
            {
                name: "Vendor",
                key: "vendor",
                permissions: ['view', 'add', 'edit', 'delete'],
                subItems: [
                    { name: "Vendors", key: "vendorList", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Products", key: "vendorProducts", permissions: ['view', 'add', 'edit', 'delete'] },
                    { name: "Purchase List", key: "vendorPurchaseList", permissions: ['view', 'add', 'edit', 'delete'] },
                ]
            },
            {
                name: "Reports",
                key: "reports",
                permissions: ['view'],
                subItems: [
                    { name: "Company list", key: "reportsCompanyList", permissions: ['view'] },
                    { name: "Service", key: "reportsService", permissions: ['view'] },
                    { name: "Sales", key: "reportsSales", permissions: ['view'] },
                    { name: "Employee list", key: "reportsEmployeeList", permissions: ['view'] },
                    { name: "User list", key: "reportsUserList", permissions: ['view'] },
                ]
            }
        ]
    },
    {
        name: "Other Settings",
        key: "otherSettings",
        permissions: ['view'],
        subItems: [
            { name: "GST", key: "otherSettingsGst", permissions: ['view', 'add', 'edit', 'delete'] },
            { name: "Employee", key: "otherSettingsEmployee", permissions: ['view', 'add', 'edit', 'delete'] },
            { name: "Menu setting", key: "otherSettingsMenuSetting", permissions: ['view', 'edit'] }, // This page itself
            { name: "Credit", key: "otherSettingsCredit", permissions: ['view', 'add', 'edit', 'delete'] },
            { name: "Gift", key: "otherSettingsGift", permissions: ['view', 'add', 'edit', 'delete'] },
        ]
    }
];

const MenuSetting = () => {
    const { auth, userPermissions } = useAuth();
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(auth?.user?._id); // Replace with your role selection logic (e.g., dropdown, radio buttons, etc);
    const [permissions, setPermissions] = useState({}); // Stores permissions for the selected role

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            fetchPermissionsForRole(selectedRole);
        } else {
            // Reset permissions when no role is selected
            setPermissions({});
        }
    }, [selectedRole]);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const fetchRoles = async () => {
        try {
            // Replace with your actual API endpoint to fetch roles/staff types
            const { data } = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/v1/employee/all`,
                {
                    headers: {
                        Authorization: auth?.token,
                    },
                }
            );
            if (data?.success) {
                setRoles(data.employees);
            } else {
                toast.error(data?.message || 'Failed to fetch roles.');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Something went wrong while fetching roles.');
            // Mock data for development if API is not ready
            setRoles([]);
        }
    };

    const fetchPermissionsForRole = async (roleId) => {
        try {
            // Replace with your actual API endpoint to fetch permissions for a role
            const { data } = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/permissions/user/${roleId}`);
            if (data?.success) {
                // Step 1: Create a base object with all possible permissions set to false
                const initializedPerms = {};
                const traverseMenu = (items) => {
                    items.forEach(item => {
                        initializedPerms[item.key] = {};
                        (item.permissions || []).forEach(perm => {
                            initializedPerms[item.key][perm] = false; // Default to false
                        });
                        if (item.subItems) {
                            traverseMenu(item.subItems);
                        }
                    });
                };
                traverseMenu(menuStructure);

                // Step 2: Overlay the fetched permissions (which are in an array format)
                // The fetched 'data.permissions' is an array of objects like { key: 'someKey', actions: ['view', 'edit'] }
                data.permissions.forEach(permEntry => {
                    if (initializedPerms[permEntry.key]) { // Check if this key exists in our menu structure
                        permEntry.actions.forEach(action => {
                            // Only set to true if the action is defined for this key in our menu structure
                            if (initializedPerms[permEntry.key][action] !== undefined) {
                                initializedPerms[permEntry.key][action] = true;
                            }
                        });
                    }
                });

                setPermissions(initializedPerms); // Set the combined permissions
            } else {
                toast.error(data?.message || 'Failed to fetch permissions.');
                // If API call fails or success is false, initialize all to false
                initializePermissions();
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.error('Something went wrong while fetching permissions.');
            // On error, initialize all to false
            initializePermissions();
        }
    };

    const initializePermissions = () => {
        const initial = {};
        const traverseMenu = (items) => {
            items.forEach(item => {
                initial[item.key] = {};
                (item.permissions || []).forEach(perm => {
                    initial[item.key][perm] = false; // Default to false
                });
                if (item.subItems) {
                    traverseMenu(item.subItems);
                }
            });
        };
        traverseMenu(menuStructure);
        setPermissions(initial);
    };

    const handlePermissionChange = (menuKey, permissionType) => (event) => {
        setPermissions(prevPermissions => ({
            ...prevPermissions,
            [menuKey]: {
                ...prevPermissions[menuKey],
                [permissionType]: event.target.checked,
            },
        }));
    };

    const handleSubmit = async () => {
        if (!selectedRole) {
            toast.error('Please select a role first.');
            return;
        }
        try {
            // Replace with your actual API endpoint to update permissions
            const { data } = await axios.put(`${import.meta.env.VITE_SERVER_URL}/api/v1/permissions/batch-update`, { userId: selectedRole, permissions });
            if (data?.success) {
                toast.success(data.message || 'Permissions updated successfully!');
            } else {
                toast.error(data?.message || 'Failed to update permissions.');
            }
        } catch (error) {
            console.error('Error updating permissions:', error);
            toast.error('Something went wrong while updating permissions.');
        }
    };

    const renderPermissions = (items, level = 0) => {
        return items.map(item => (
            <div key={item.key} className={`mb-4 ${level > 0 ? 'ml-6' : ''}`}>
                <Typography variant={level === 0 ? "h6" : "subtitle1"} className="font-semibold mb-2">
                    {item.name}
                </Typography>
                <FormGroup row>
                    {(item.permissions || []).map(perm => (
                        <FormControlLabel
                            key={`${item.key}-${perm}`}
                            control={
                                <Checkbox
                                    checked={permissions[item.key]?.[perm] || false}
                                    onChange={handlePermissionChange(item.key, perm)}
                                    disabled={!selectedRole || hasPermission("otherSettingsGst") ? false : true}
                                />
                            }
                            label={perm.charAt(0).toUpperCase() + perm.slice(1)} // Capitalize first letter
                        />
                    ))}
                </FormGroup>
                {item.subItems && item.subItems.length > 0 && (
                    <div className="mt-2 border-l-2 border-gray-200 pl-4">
                        {renderPermissions(item.subItems, level + 1)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-6">Menu Settings (Role Permissions)</h1>

            <Paper className="p-6 mb-8 shadow-md">
                <FormControl fullWidth variant="outlined" size="small" className="mb-6">
                    <InputLabel id="role-select-label">Select Role</InputLabel>
                    <Select
                        labelId="role-select-label"
                        id="role-select"
                        value={selectedRole}
                        label="Select Role"
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={hasPermission("otherSettingsGst")? false : true}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {roles.map((role) => (
                            <MenuItem key={role.userId} value={role.userId}>
                                {role.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedRole && (
                    <div className="mt-6">
                        <Typography variant="h5" className="font-bold mb-4">
                            Permissions for {roles.find(r => r._id === selectedRole)?.name}
                        </Typography>
                        {renderPermissions(menuStructure)}
                        {hasPermission("otherSettingsGst") ? <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            className="mt-6 bg-blue-500 hover:bg-blue-600"
                        >
                            Save Permissions
                        </Button> : null}
                    </div>
                )}
                {!selectedRole && (
                    <Typography variant="body1" color="textSecondary">
                        Please select a role to view and edit its menu permissions.
                    </Typography>
                )}
            </Paper>
        </div>
    );
};

export default MenuSetting;