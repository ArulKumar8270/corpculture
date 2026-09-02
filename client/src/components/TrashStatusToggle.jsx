import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const TrashStatusToggle = ({ viewMode, onChange, sx }) => (
    <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_e, value) => value && onChange(value)}
        size="small"
        sx={{ mb: 2, ...sx }}
    >
        <ToggleButton value="active">Active</ToggleButton>
        <ToggleButton value="trash">Trash</ToggleButton>
    </ToggleButtonGroup>
);

export default TrashStatusToggle;
