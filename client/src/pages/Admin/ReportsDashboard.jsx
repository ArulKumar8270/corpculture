import React from 'react';
import { Box, Typography, Grid, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ReportsDashboard = () => {
    const navigate = useNavigate();

    // Define your report categories and their respective paths
    const reportCategories = [
        { name: 'Company Reports', path: '/admin/reports/company' },
        { name: 'Service Reports', path: '/admin/reports/service' }, // This will be a sub-dashboard for service reports
        { name: 'Rental Reports', path: '/admin/reports/rental' },
        { name: 'Sales Reports', path: '/admin/reports/sales' },
        { name: 'Employee Reports', path: '/admin/reports/employee' },
        { name: 'User Commission Reports', path: '/admin/reports/user-commission' },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, color: '#019ee3', fontWeight: 'bold' }}>
                Reports Dashboard
            </Typography>

            <Grid container spacing={3}>
                {reportCategories.map((category) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={category.name}>
                        <Paper
                            elevation={3}
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '150px',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: '#e0f7fa',
                                    boxShadow: 6,
                                },
                            }}
                            onClick={() => navigate(category.path)}
                        >
                            <Typography variant="h6" component="h2" sx={{ mb: 1, textAlign: 'center' }}>
                                {category.name}
                            </Typography>
                            <Button variant="outlined" size="small">
                                View Reports
                            </Button>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ReportsDashboard;