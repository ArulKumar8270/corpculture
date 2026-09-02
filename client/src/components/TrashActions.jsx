import React from 'react';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';

const TrashActions = ({
    viewMode,
    onEdit,
    onTrash,
    onRestore,
    showEdit = true,
    editLabel = 'Edit',
    trashLabel = 'Trash',
    restoreLabel = 'Restore',
    size = 'small',
    className = '',
}) => {
    if (viewMode === 'trash') {
        return (
            <Button
                variant="contained"
                color="success"
                size={size}
                startIcon={<RestoreFromTrashIcon />}
                onClick={onRestore}
                className={className}
            >
                {restoreLabel}
            </Button>
        );
    }

    return (
        <>
            {showEdit && onEdit ? (
                <Button
                    variant="contained"
                    color="primary"
                    size={size}
                    startIcon={<EditIcon />}
                    onClick={onEdit}
                    className={`mr-2 ${className}`}
                >
                    {editLabel}
                </Button>
            ) : null}
            {onTrash ? (
                <Button
                    variant="contained"
                    color="error"
                    size={size}
                    startIcon={<DeleteIcon />}
                    onClick={onTrash}
                    className={className}
                >
                    {trashLabel}
                </Button>
            ) : null}
        </>
    );
};

export default TrashActions;
