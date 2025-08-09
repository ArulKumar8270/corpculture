import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/auth";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import SeoData from "../../SEO/SeoData";
import DeleteIcon from "@mui/icons-material/Delete"; // {{ edit_1 }}
import { IconButton } from "@mui/material"; // {{ edit_1 }}
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const AllCategories = () => {
    const { auth, userPermissions } = useAuth();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categoryForm, setCategoryForm] = useState({ name: "", commission: "0" });
    const [categoryErrors, setCategoryErrors] = useState({});
    const [categoryLoading, setCategoryLoading] = useState(false);

    const hasPermission = (key) => {
        return userPermissions.some(p => p.key === key && p.actions.includes('edit')) || auth?.user?.role === 1;
    };

    const handleCategoryOpen = () => {
        setCategoryModalOpen(true);
        setCategoryForm({ name: "", commission: "" });
        setCategoryErrors({});
    };

    const handleCategoryClose = () => {
        setCategoryModalOpen(false);
    };

    const handleCategoryChange = (e) => {
        setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
        setCategoryErrors({ ...categoryErrors, [e.target.name]: undefined });
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        let errors = {};
        if (!categoryForm.name.trim()) errors.name = "Category name is required";
        if (!categoryForm.commission || isNaN(categoryForm.commission)) errors.commission = "Commission is required and must be a number";
        if (Object.keys(errors).length > 0) {
            setCategoryErrors(errors);
            return;
        }
        setCategoryLoading(true);
        try {
            // Replace with your actual API endpoint
            await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/category/create`, {
                name: categoryForm.name.trim(),
                commission: Number(categoryForm.commission),
            }, {
                headers: { Authorization: auth.token } 
            });
            toast.success("Category added successfully!");
            setCategoryModalOpen(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add category");
        }
        setCategoryLoading(false);
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/category/all`, // Assuming this is your endpoint
                    {
                        headers: {
                            Authorization: auth?.token,
                        },
                    }
                );

                if (res.status === 200) {
                    setCategories(res.data.categories);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setLoading(false);
                toast.error(
                    error.response?.data?.message ||
                    "Error fetching categories. Please try again."
                );
            }
        };

        if (auth?.token) {
            fetchCategories();
        }
    }, [auth?.token, categoryLoading]);

    // Function to handle category deletion
    const handleDeleteCategory = async (categoryId) => { // {{ edit_2 }}
        if (window.confirm("Are you sure you want to delete this category?")) { // {{ edit_2 }}
            try { // {{ edit_2 }}
                const res = await axios.delete( // {{ edit_2 }}
                    `${import.meta.env.VITE_SERVER_URL}/api/v1/category/delete/${categoryId}`, // Assuming this is your delete endpoint // {{ edit_2 }}
                    { // {{ edit_2 }}
                        headers: { // {{ edit_2 }}
                            Authorization: auth?.token, // {{ edit_2 }}
                        }, // {{ edit_2 }}
                    } // {{ edit_2 }}
                ); // {{ edit_2 }}

                if (res.status === 200) { // {{ edit_2 }}
                    toast.success("Category deleted successfully!"); // {{ edit_2 }}
                    // Update the categories state to remove the deleted category // {{ edit_2 }}
                    setCategories(categories.filter(cat => cat._id !== categoryId)); // {{ edit_2 }}
                } // {{ edit_2 }}
            } catch (error) { // {{ edit_2 }}
                console.error("Error deleting category:", error); // {{ edit_2 }}
                toast.error( // {{ edit_2 }}
                    error.response?.data?.message || // {{ edit_2 }}
                    "Error deleting category. Please try again." // {{ edit_2 }}
                ); // {{ edit_2 }}
            } // {{ edit_2 }}
        } // {{ edit_2 }}
    }; // {{ edit_2 }}

    const columns = [
        {
            field: "id",
            headerName: "Category ID",
            minWidth: 150,
            flex: 0.5,
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
        },
        // {
        //     field: "commission",
        //     headerName: "Commission (%)",
        //     type: "number",
        //     minWidth: 150,
        //     flex: 0.5,
        //     headerAlign: "left",
        //     align: "left",
        // },
        // You can add actions here if needed (e.g., Edit, Delete)
        // {
        //     field: "actions",
        //     headerName: "Actions",
        //     minWidth: 100,
        //     flex: 0.3,
        //     type: "number",
        //     sortable: false,
        //     renderCell: (params) => {
        //         return (
        //             // Add your action buttons/components here
        //             <div>Actions</div>
        //         );
        //     },
        // },
        (hasPermission("salesAllProducts") ? [{ // {{ edit_3 }}
            field: "actions", // {{ edit_3 }}
            headerName: "Actions", // {{ edit_3 }}
            minWidth: 100, // {{ edit_3 }}
            flex: 0.3, // {{ edit_3 }}
            sortable: false, // {{ edit_3 }}
            renderCell: (params) => { // {{ edit_3 }}
                return ( // {{ edit_3 }}
                    <IconButton // {{ edit_3 }}
                        onClick={() => handleDeleteCategory(params.row.id)} // Call delete function with row ID // {{ edit_3 }}
                        color="error" // {{ edit_3 }}
                        aria-label="delete category" // {{ edit_3 }}
                    >
                        <DeleteIcon />
                    </IconButton> // {{ edit_3 }}
                ); // {{ edit_3 }}
            }, // {{ edit_3 }}
        }] : []) // {{ edit_3 }}
    ];

    const rows = [];

    categories?.forEach((item) => {
        rows.push({
            id: item._id,
            name: item.name,
            commission: item.commission,
        });
    });

    return (
        <div className="relative p-2 w-full min-h-screen bg-gradient-to-br from-[#e6fbff] to-[#f7fafd]">
            <SeoData title="All Categories - Admin Panel" />

            {loading ? (
                <Spinner />
            ) : (
                <div className="h-full">
                    <div className="flex justify-between items-center p-4 bg-white rounded-2xl shadow mb-4">
                        <h1 className="text-lg font-bold uppercase text-[#019ee3] tracking-wide">
                            Categories
                        </h1>
                        {hasPermission("salesAllProducts")  ? <button
                                onClick={handleCategoryOpen}
                                className="py-2 px-5 rounded-xl shadow font-semibold text-white bg-gradient-to-r from-[#afcb09] to-[#019ee3] hover:from-[#019ee3] hover:to-[#afcb09] transition"
                            >
                                + New Category
                            </button> : null}
                    </div>

                    <div className="w-full h-[80vh] bg-white rounded-2xl shadow-xl border border-[#e6fbff] p-2">
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                    },
                                },
                            }}
                            pageSizeOptions={[10]}
                            disableRowSelectionOnClick
                            disableSelectIconOnClick
                            sx={{
                                borderRadius: 3,
                                border: 'none',
                                boxShadow: 0,
                                '& .MuiDataGrid-columnHeaders': {
                                    background: 'linear-gradient(90deg, #019ee3 0%, #afcb09 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: 15,
                                },
                                '& .MuiDataGrid-row': {
                                    background: '#f7fafd',
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #e6fbff',
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    background: '#e6fbff',
                                },
                            }}
                        />
                    </div>
                </div>
            )}
            {/* Category Modal */}
            <Dialog open={categoryModalOpen} onClose={handleCategoryClose}>
                <DialogTitle>Add New Category</DialogTitle>
                <form onSubmit={handleCategorySubmit}>
                    <DialogContent className="flex flex-col gap-4 min-w-[320px]">
                        <TextField
                            label="Category Name"
                            name="name"
                            value={categoryForm.name}
                            onChange={handleCategoryChange}
                            error={!!categoryErrors.name}
                            helperText={categoryErrors.name}
                            fullWidth
                            required
                        />
                        {/* <TextField
                            label="Commission (%)"
                            name="commission"
                            value={categoryForm.commission}
                            onChange={handleCategoryChange}
                            error={!!categoryErrors.commission}
                            helperText={categoryErrors.commission}
                            fullWidth
                            required
                            type="number"
                            inputProps={{ min: 0 }}
                        /> */}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCategoryClose} disabled={categoryLoading}>Cancel</Button>
                        <Button type="submit" variant="contained" color="primary" disabled={categoryLoading}>
                            {categoryLoading ? "Saving..." : "Add Category"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </div>
    );
};

export default AllCategories;