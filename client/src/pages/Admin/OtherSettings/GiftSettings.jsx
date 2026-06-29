import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useNavigate } from 'react-router-dom';

const GiftSettings = () => {
    const navigate = useNavigate();

    return (
        <Box sx={{ p: 3, maxWidth: 640, mx: 'auto' }}>
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <CardGiftcardIcon sx={{ fontSize: 48, color: '#019ee3', mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ color: '#019ee3', fontWeight: 'bold' }}>
                    Gift Settings
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Gift access is controlled by role permissions. Use Menu Settings to configure which
                    roles can view gift-related areas (permission key: otherSettingsGift).
                </Typography>
                <Button variant="contained" onClick={() => navigate('../menuSetting')}>
                    Open Menu Settings
                </Button>
            </Paper>
        </Box>
    );
};

export default GiftSettings;
