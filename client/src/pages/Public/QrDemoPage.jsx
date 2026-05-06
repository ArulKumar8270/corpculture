import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Typography } from '@mui/material';

const QrDemoPage = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '70vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Paper
                elevation={2}
                sx={{
                    width: '100%',
                    maxWidth: 720,
                    p: 3,
                    borderRadius: 3,
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#019ee3' }}>
                    Demo
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    This is the demo page. Use the button below to go back to home.
                </Typography>

                <Button
                    variant="contained"
                    sx={{ bgcolor: '#019ee3', '&:hover': { bgcolor: '#017bb3' } }}
                    onClick={() => navigate('/')}
                >
                    Home
                </Button>
            </Paper>
        </Box>
    );
};

export default QrDemoPage;

