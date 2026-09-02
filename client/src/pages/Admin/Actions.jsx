/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/auth";
import TrashActions from "../../components/TrashActions";
import { restoreProductFromTrash } from "../../utils/trashApi";

const Actions = ({ id, name, updateDeletedProduct, viewMode = "active", onRestore }) => {
    const [open, setOpen] = useState(false);
    const { auth } = useAuth();
    const navigate = useNavigate();

    const handleClose = () => {
        setOpen(false);
    };

    const deleteHandler = async (id) => {
        handleClose();
        try {
            const res = await axios.post(
                `${
                    import.meta.env.VITE_SERVER_URL
                }/api/v1/product/delete-product`,
                {
                    productId: id,
                },
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: auth?.token,
                    },
                }
            );
            if (res.status === 201) {
                toast.success("Product moved to trash successfully!");
                // After a successful deletion, update the products state
                updateDeletedProduct(id);
            }
        } catch (error) {
            console.error("Error:", error);
            if (error.res?.status === 401) {
                toast.error("Product Not Found!");
            } else if (error.res?.status === 500) {
                toast.error("Something Went Wrong! Please Try Again Later");
            }
        }
    };

    const handleRestore = async () => {
        if (!window.confirm("Restore this product from trash?")) return;
        try {
            const res = await restoreProductFromTrash(id);
            if (res.data?.success) {
                toast.success(res.data.message || "Product restored successfully!");
                onRestore?.(id);
            } else {
                toast.error(res.data?.message || "Failed to restore product.");
            }
        } catch (error) {
            console.error("Error restoring product:", error);
            toast.error(error.response?.data?.message || "Something went wrong while restoring the product.");
        }
    };

    return (
        <>
            <TrashActions
                viewMode={viewMode}
                onEdit={() => navigate(`/admin/dashboard/product/${id}`)}
                onTrash={() => setOpen(true)}
                onRestore={handleRestore}
                showEdit={viewMode !== "trash"}
            />

            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Move to trash?"}
                </DialogTitle>
                <DialogContent>
                    <p className="text-gray-500">
                        Do you really want to move
                        {name && (
                            <span className="font-medium">&nbsp;{name}</span>
                        )}
                        &nbsp;to trash?
                    </p>
                </DialogContent>
                <DialogActions>
                    <button
                        onClick={handleClose}
                        className="py-2 px-6 rounded shadow bg-gray-400 hover:bg-gray-500 text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => deleteHandler(id)}
                        className="py-2 px-6 ml-4 rounded bg-red-600 hover:bg-red-700 text-white shadow"
                    >Trash</button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Actions;
