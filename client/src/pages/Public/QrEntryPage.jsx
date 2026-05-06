import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, Typography } from '@mui/material';

const QrEntryPage = () => {
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
                    maxWidth: 520,
                    p: 3,
                    borderRadius: 3,
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#019ee3' }}>
                    Welcome
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Choose an option.
                </Typography>

                <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    sx={{ mb: 2, bgcolor: '#019ee3', '&:hover': { bgcolor: '#017bb3' } }}
                    onClick={() => navigate('/')}
                >
                    Create Enquire
                </Button>

                <Button
                    fullWidth
                    size="large"
                    variant="outlined"
                    sx={{ borderColor: '#019ee3', color: '#019ee3' }}
                    onClick={() => navigate('/qr-demo')}
                >
                    View Demo
                </Button>
            </Paper>
        </Box>
    );
};

export default QrEntryPage;

